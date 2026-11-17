import type {
  DarkZone,
  Lamp,
  OccluderElement,
  ProjectData,
  SimResult,
  Vec2,
} from '../types';
import {
  angleDiff,
  clamp,
  deg2rad,
  dist,
  pointInPolygon,
  polygonBounds,
  polygonToSegments,
  polylineToSegments,
  raySegment,
  type Segment,
} from './geometry';
import {
  LAMP_CATALOG,
  beamIntensity,
  colorTempToLinearRGB,
  lampLumens,
  timeCurve,
} from './photometry';

// 仿真参数
const TARGET_CELL = 0.8; // 目标网格尺寸 m
const MAX_CELLS = 60000; // 网格单元上限，超出则自动放大格距
const MIN_DARK_AREA_M2 = 4; // 暗区最小面积，过滤碎点
const AMBIENT_DUSK_LUX = 18; // 18:00 黄昏环境照度
const WATER_F0 = 0.02; // 水的菲涅尔基础反射率
const UNDERWATER_COUPLING = 0.55; // 水下灯穿出水面的耦合系数

interface OccluderSeg extends Segment {
  thickness: number;
}

function collectOccluders(elements: OccluderElement[]): OccluderSeg[] {
  const segs: OccluderSeg[] = [];
  for (const el of elements) {
    if (el.type === 'wall') {
      for (const s of polylineToSegments(el.points, el.thickness, el.height)) {
        segs.push({ ...s, thickness: el.thickness });
      }
    } else if (el.type === 'pier') {
      // 桥墩多边形按等效厚度 1.2m 参与半影计算
      for (const s of polygonToSegments(el.points, el.height)) {
        segs.push({ ...s, thickness: 1.2 });
      }
    }
  }
  return segs;
}

interface WaterRegion {
  poly: Vec2[];
  bounds: { min: Vec2; max: Vec2 };
}

function collectWater(data: ProjectData): WaterRegion[] {
  return data.elements
    .filter((e) => e.type === 'water')
    .map((e) => {
      const poly = (e as { points: Vec2[] }).points;
      return { poly, bounds: polygonBounds(poly) };
    });
}

/**
 * 软阴影可见度模型（2.5D）：
 * 光线在遮挡物处的射线高度 hr = hL*(1-d1/r)，挡墙高度 hw。
 * 由遮挡物厚度 s 与几何距离决定的目标面半影宽度 w = s*d2/d1，
 * 即灯离遮挡物越远(d1↑)半影越窄，遮挡物离受光点越远(d2↑)半影越宽；
 * 再按射线斜率 hL/r 换算为高度裕量，对 (hr-hw) 做 smoothstep 软过渡。
 * 返回 0（全影）~ 1（无遮挡）。
 */
function visibility(
  lamp: Lamp,
  target: Vec2,
  r: number,
  segs: OccluderSeg[],
): number {
  const dx = (target.x - lamp.pos.x) / r;
  const dy = (target.y - lamp.pos.y) / r;
  const d = { x: dx, y: dy };
  let vis = 1;
  for (const s of segs) {
    const hit = raySegment(lamp.pos, d, s.a, s.b);
    if (!hit || hit.t >= r) continue;
    const d1 = hit.t;
    const d2 = r - d1;
    const rayHeightAtHit = lamp.height * (1 - d1 / r);
    const delta = rayHeightAtHit - s.height; // 负=被挡
    // 半影宽度（目标面，米），限制在 0.15~4m
    const wPen = clamp((s.thickness * d2) / Math.max(d1, 0.3), 0.15, 4);
    // 换算为等效高度裕量
    const slope = lamp.height / Math.max(r, 0.5);
    const hPen = Math.max(wPen * Math.abs(slope), 0.05);
    const localVis = smoothstep(-hPen, hPen, delta);
    vis = Math.min(vis, localVis);
    if (vis < 0.02) return 0;
  }
  return vis;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * 光束立体角 Ω = 2π∫₀^half f(θ)sinθ dθ，数值积分。
 * 定向灯的轴向峰值光强 I_peak = lm / Ω，
 * 保证光束越集中轴向照度越高，且全灯总光通量守恒。
 * 全向灯（beamAngle=0）按半球发射 Ω=2π。
 */
function beamSolidAngle(lamp: Lamp): number {
  if (lamp.beamAngleDeg <= 0) return 2 * Math.PI;
  const half = deg2rad(lamp.beamAngleDeg / 2);
  const cat = LAMP_CATALOG[lamp.kind];
  const N = 24;
  let sum = 0;
  for (let i = 0; i < N; i++) {
    const a = ((i + 0.5) / N) * half;
    sum += beamIntensity(lamp, a) * Math.sin(a) * (half / N);
  }
  return Math.max(2 * Math.PI * sum, 0.05);
}

function fresnel(cosTheta: number): number {
  const f = 1 - clamp(cosTheta, 0, 1);
  return WATER_F0 + (1 - WATER_F0) * f * f * f * f * f;
}

export function simulate(data: ProjectData): SimResult {
  const t0 = performance.now();
  const waters = collectWater(data);
  const occluders = collectOccluders(
    data.elements.filter(
      (e): e is OccluderElement => e.type === 'wall' || e.type === 'pier',
    ),
  );
  const lamps = data.elements.filter((e): e is Lamp => e.type === 'lamp');
  const curve = timeCurve(data.timeHour);

  // 合并水面边界
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const w of waters) {
    minX = Math.min(minX, w.bounds.min.x);
    minY = Math.min(minY, w.bounds.min.y);
    maxX = Math.max(maxX, w.bounds.max.x);
    maxY = Math.max(maxY, w.bounds.max.y);
  }
  if (!waters.length) {
    minX = minY = 0; maxX = maxY = 10;
  }

  let cell = TARGET_CELL;
  let cols = Math.max(2, Math.ceil((maxX - minX) / cell) + 1);
  let rows = Math.max(2, Math.ceil((maxY - minY) / cell) + 1);
  if (cols * rows > MAX_CELLS) {
    cell = Math.sqrt(((maxX - minX) * (maxY - minY)) / MAX_CELLS);
    cols = Math.ceil((maxX - minX) / cell) + 1;
    rows = Math.ceil((maxY - minY) / cell) + 1;
  }

  const n = cols * rows;
  const total = new Float32Array(n).fill(NaN);
  const directArr = new Float32Array(n).fill(NaN);
  const reflArr = new Float32Array(n).fill(NaN);
  const inWater = new Uint8Array(n);
  const cellArea = cell * cell;

  // 标记水面单元
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const idx = cy * cols + cx;
      const p: Vec2 = { x: minX + (cx + 0.5) * cell, y: minY + (cy + 0.5) * cell };
      for (const w of waters) {
        if (
          p.x >= w.bounds.min.x && p.x <= w.bounds.max.x &&
          p.y >= w.bounds.min.y && p.y <= w.bounds.max.y &&
          pointInPolygon(p, w.poly)
        ) {
          inWater[idx] = 1;
          total[idx] = 0;
          directArr[idx] = 0;
          reflArr[idx] = 0;
          break;
        }
      }
    }
  }

  const lampRuntime: SimResult['lampRuntime'] = [];

  for (const lamp of lamps) {
    const cat = LAMP_CATALOG[lamp.kind];
    const lm = lampLumens(lamp, curve.lampDimming);
    const omega = beamSolidAngle(lamp);
    const iPeak = lm / omega; // 轴向峰值光强 cd，光通量守恒
    lampRuntime.push({ id: lamp.id, lumens: lm, dimming: curve.lampDimming });
    const h = Math.abs(lamp.height);
    for (let idx = 0; idx < n; idx++) {
      if (!inWater[idx]) continue;
      const cx = idx % cols;
      const cy = (idx - cx) / cols;
      const target: Vec2 = { x: minX + (cx + 0.5) * cell, y: minY + (cy + 0.5) * cell };
      const r = dist(lamp.pos, target);
      if (r < 0.05) continue;
      // 光束方向门限
      const aimAt = Math.atan2(target.y - lamp.pos.y, target.x - lamp.pos.x);
      const beam = beamIntensity(lamp, angleDiff(aimAt, lamp.aim));
      if (beam <= 0.001) continue;

      const r3 = Math.hypot(r, h);
      const cosTheta = r / r3; // 光线对水平面的入射角余弦
      const vis = visibility(lamp, target, r, occluders);
      if (vis < 0.01) continue;

      // 水平面照度 E = I_peak·f(θ)·cosθ/R²
      let coupling = 1;
      if (!cat.aboveWater) coupling = UNDERWATER_COUPLING;
      const eDirect = iPeak * beam * (cosTheta / (r3 * r3)) * vis * coupling;

      // 菲涅尔权重反射：仅水面以上灯具，形成掠射角拉长的反射带
      let eRefl = 0;
      if (cat.aboveWater) {
        const incident = iPeak * beam * (1 / (r3 * r3)) * vis;
        eRefl = incident * fresnel(cosTheta) * 0.6;
      }
      directArr[idx] += eDirect;
      reflArr[idx] += eRefl;
      total[idx] += eDirect + eRefl;
    }
  }

  // 天空余晖环境光（仅计入总照度）
  const ambient = curve.skyGlow * AMBIENT_DUSK_LUX;
  let waterCount = 0;
  let sumLux = 0, minLux = Infinity, maxLux = 0, below = 0;
  for (let idx = 0; idx < n; idx++) {
    if (!inWater[idx]) continue;
    total[idx] += ambient;
    waterCount++;
    sumLux += total[idx];
    minLux = Math.min(minLux, total[idx]);
    maxLux = Math.max(maxLux, total[idx]);
    if (total[idx] < data.luxThreshold) below++;
  }
  if (!waterCount) minLux = 0;

  const darkZones = findDarkZones(data, total, inWater, cols, rows, cell, minX, minY);

  const totalPowerW = lamps.reduce((s, l) => s + l.powerW, 0);
  return {
    gridOrigin: { x: minX, y: minY },
    cellSize: cell,
    cols,
    rows,
    total,
    direct: directArr,
    reflected: reflArr,
    inWater,
    darkZones,
    stats: {
      waterCells: waterCount,
      meanLux: waterCount ? sumLux / waterCount : 0,
      minLux,
      maxLux,
      pctBelowThreshold: waterCount ? (below / waterCount) * 100 : 0,
      lampCount: lamps.length,
      totalPowerW,
    },
    lampRuntime,
    elapsedMs: performance.now() - t0,
  };
}

/** 暗区连通域（4 邻域），按面积过滤并输出清单 */
function findDarkZones(
  data: ProjectData,
  total: Float32Array,
  inWater: Uint8Array,
  cols: number,
  rows: number,
  cell: number,
  minX: number,
  minY: number,
): DarkZone[] {
  const n = cols * rows;
  const visited = new Uint8Array(n);
  const zones: DarkZone[] = [];
  const stack: number[] = [];
  const minCells = Math.ceil(MIN_DARK_AREA_M2 / (cell * cell));

  for (let start = 0; start < n; start++) {
    if (!inWater[start] || visited[start] || total[start] >= data.luxThreshold) continue;
    // BFS
    const cells: number[] = [];
    stack.length = 0;
    stack.push(start);
    visited[start] = 1;
    let sum = 0, minL = Infinity, sx = 0, sy = 0;
    while (stack.length) {
      const idx = stack.pop()!;
      cells.push(idx);
      const lx = total[idx];
      sum += lx;
      minL = Math.min(minL, lx);
      const cx = idx % cols;
      sx += cx; sy += (idx - cx) / cols;
      const neighbors = [idx - 1, idx + 1, idx - cols, idx + cols];
      for (const nb of neighbors) {
        if (nb < 0 || nb >= n || visited[nb] || !inWater[nb]) continue;
        // 左右邻居需同行
        if ((nb === idx - 1 || nb === idx + 1) && Math.floor(nb / cols) !== Math.floor(idx / cols)) continue;
        if (total[nb] >= data.luxThreshold) continue;
        visited[nb] = 1;
        stack.push(nb);
      }
    }
    if (cells.length < minCells) continue;
    const count = cells.length;
    const acx = sx / count, acy = sy / count;
    zones.push({
      id: `dz_${zones.length}`,
      cellCount: count,
      areaM2: count * cell * cell,
      minLux: minL,
      avgLux: sum / count,
      centroid: { x: minX + (acx + 0.5) * cell, y: minY + (acy + 0.5) * cell },
      cells,
    });
  }
  // 大面积优先
  zones.sort((a, b) => b.areaM2 - a.areaM2);
  return zones;
}

/** 色温工具导出（渲染层复用） */
export { colorTempToLinearRGB };
