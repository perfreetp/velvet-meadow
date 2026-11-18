// 潮沟网络过程式生成器
//
// 确定性保证:所有随机性来自 Rng(种子派生子流)与整数哈希噪声,
// 生成顺序固定,不使用 Math.random / Date,因此同参数 + 同种子结果完全一致。
//
// 网络分三级:主干(0)、支沟(1)、毛细沟(2),每级独立的初始宽度、
// 宽度衰减系数与弯曲噪声参数;支沟从父沟按密度间距分岔,分岔角 ± 抖动;
// 入口处沿父沟切线平滑过渡(圆角交汇的几何基础);沟头在高程超过该级
// 阈值时按坡降插值自然收尾,末端宽度渐缩。

import { ChannelSegment, DOMAIN, GenParams, Level, Network, NetworkStats } from './types.js';
import { Rng, hashStrings, noise1 } from './rng.js';
import { ElevationField, makeElevation } from './elevation.js';

interface LevelCfg {
  w0: number;      // 初始宽度(米)
  decay: number;   // 宽度指数衰减系数(1/米)
  minW: number;    // 最小宽度(米)
  meander: number; // 曲流幅度缩放
  freq: number;    // 弯曲噪声频率
  rise: number;    // 沟头收尾:相对起点高程的允许抬升(米)
  step: number;    // 步长(米)
  maxLen: number;  // 最大沟长(米)
}

export const LEVEL_CFG: LevelCfg[] = [
  { w0: 16,  decay: 0.0011, minW: 3.0, meander: 1.0,  freq: 0.0011, rise: 6.5, step: 22, maxLen: 3800 },
  { w0: 7,   decay: 0.0026, minW: 1.4, meander: 0.65, freq: 0.0026, rise: 3.5, step: 16, maxLen: 1500 },
  { w0: 2.4, decay: 0.006,  minW: 0.5, meander: 0.4,  freq: 0.005,  rise: 2.0, step: 11, maxLen: 520  },
];

const DEG = Math.PI / 180;

function lerpAngle(a: number, b: number, t: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return a + d * t;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

interface GrownChannel {
  points: number[];
  widths: number[];
}

/** 沿航向生长一条河道,heading: 弧度,0 = 向陆(-y),顺时针为正 */
function growChannel(opts: {
  streamKey: (string | number)[];
  seed: number;
  start: [number, number];
  heading: number;
  entryFrom?: number; // 父沟切线方向:入口若干步内由此平滑转向自身航向(圆角过渡)
  level: Level;
  params: GenParams;
  elev: ElevationField;
}): GrownChannel | null {
  const cfg = LEVEL_CFG[opts.level];
  const rng = new Rng(hashStrings(opts.seed, opts.streamKey));
  const nSeed = hashStrings(opts.seed, [...opts.streamKey, 'noise']);
  const phase = rng.range(0, 1000);
  const amp = opts.params.meanderAmp * cfg.meander;
  const entryBlend = opts.entryFrom !== undefined ? 5 : 0;

  const pts: number[] = [opts.start[0], opts.start[1]];
  let x = opts.start[0];
  let y = opts.start[1];
  let heading = opts.heading;
  let prevMeander = noise1(phase * 1.7, nSeed + 11) * amp;
  // 沟头收尾阈值:起点高程 + 该级允许抬升(沟头沿坡向上自然收尾)
  const zLimit = opts.elev.z(x, y) + cfg.rise;

  const maxSteps = Math.ceil(cfg.maxLen / cfg.step);
  for (let i = 1; i <= maxSteps; i++) {
    const dist = i * cfg.step;
    // 航向游移(弯曲噪声之一:低频摆动,小步长避免随机游走成环)
    heading += noise1(dist * cfg.freq * 3.1 + phase, nSeed) * 0.045 * (0.3 + amp / 60);
    let hUse = heading;
    if (i <= entryBlend && opts.entryFrom !== undefined) {
      hUse = lerpAngle(opts.entryFrom, heading, smoothstep(i / (entryBlend + 1)));
    }
    // 曲流横向偏移(弯曲噪声之二:沿程横向正弦状摆动)
    const meander = noise1(dist * cfg.freq + phase * 1.7, nSeed + 11) * amp;
    const dx = Math.sin(hUse);
    const dy = -Math.cos(hUse);
    const px = Math.cos(hUse);
    const py = Math.sin(hUse);
    const dm = meander - prevMeander;
    prevMeander = meander;
    const nx = x + dx * cfg.step + px * dm;
    const ny = y + dy * cfg.step + py * dm;

    if (nx < 20 || nx > DOMAIN.w - 20 || ny < 20 || ny > DOMAIN.h - 20) break;

    // 沟头按高程自然收尾:越过允许抬升时,在线段上插值到阈值点终止
    const z = opts.elev.z(nx, ny);
    if (z > zLimit) {
      const zPrev = opts.elev.z(x, y);
      const t = z > zPrev ? Math.min(1, Math.max(0, (zLimit - zPrev) / (z - zPrev))) : 1;
      if (t > 0.05) pts.push(x + (nx - x) * t, y + (ny - y) * t);
      break;
    }
    pts.push(nx, ny);
    x = nx;
    y = ny;
  }

  const n = pts.length / 2;
  if (n < 4) return null;

  // 累计里程
  const cum = new Array<number>(n);
  cum[0] = 0;
  for (let i = 1; i < n; i++) {
    const dx = pts[i * 2] - pts[(i - 1) * 2];
    const dy = pts[i * 2 + 1] - pts[(i - 1) * 2 + 1];
    cum[i] = cum[i - 1] + Math.hypot(dx, dy);
  }
  const total = cum[n - 1];
  if (total < cfg.step * 3) return null;

  // 宽度:指数衰减 + 沟头 15% 渐缩收尾
  const widths = new Array<number>(n);
  const taperStart = total * 0.85;
  for (let i = 0; i < n; i++) {
    let w = Math.max(cfg.minW, cfg.w0 * Math.exp(-cfg.decay * cum[i]));
    if (cum[i] > taperStart && total > taperStart) {
      w *= 1 - 0.75 * ((cum[i] - taperStart) / (total - taperStart));
    }
    widths[i] = w;
  }
  return { points: pts, widths };
}

function polylineLength(points: number[]): number {
  let L = 0;
  for (let i = 2; i < points.length; i += 2) {
    L += Math.hypot(points[i] - points[i - 2], points[i + 1] - points[i - 1]);
  }
  return L;
}

function makeSegment(id: string, level: Level, parentId: string | null, ch: GrownChannel): ChannelSegment {
  return {
    id,
    level,
    parentId,
    points: ch.points,
    widths: ch.widths,
    length: polylineLength(ch.points),
    locked: false,
    custom: false,
    color: [0.5, 0.5, 0.5],
  };
}

/** 沿父沟按密度分岔,递归生成下一级 */
function spawnChildren(
  parent: ChannelSegment,
  params: GenParams,
  elev: ElevationField,
  out: ChannelSegment[],
): void {
  if (parent.level >= 2) return;
  const density = parent.level === 0 ? params.branchDensity : params.capillaryDensity;
  if (density <= 0.01) return;
  const childLevel = (parent.level + 1) as Level;
  const rng = new Rng(hashStrings(params.seed, ['spawn', parent.id]));
  const spacing = 1000 / density;
  let acc = rng.range(0.3, 0.9) * spacing;
  let side = rng.next() < 0.5 ? 1 : -1;
  let childIdx = 0;
  const pts = parent.points;

  for (let i = 1; i < pts.length / 2; i++) {
    const x0 = pts[(i - 1) * 2];
    const y0 = pts[(i - 1) * 2 + 1];
    const x1 = pts[i * 2];
    const y1 = pts[i * 2 + 1];
    const segLen = Math.hypot(x1 - x0, y1 - y0);
    if (segLen < 1e-6) continue;
    // 父沟局部切向(与生长方向同约定:dir=(sin,-cos))
    const pHead = Math.atan2(x1 - x0, -(y1 - y0));
    while (acc <= segLen) {
      const t = acc / segLen;
      const bx = x0 + (x1 - x0) * t;
      const by = y0 + (y1 - y0) * t;
      const baseAng = (parent.level === 0 ? params.bifurcationAngle : params.bifurcationAngle * 0.8) * DEG;
      const ang = baseAng * rng.range(0.85, 1.15);
      const id = `${parent.id}.${childIdx++}`;
      const ch = growChannel({
        streamKey: ['ch', id],
        seed: params.seed,
        start: [bx, by],
        heading: pHead + side * ang,
        entryFrom: pHead,
        level: childLevel,
        params,
        elev,
      });
      if (ch) {
        const seg = makeSegment(id, childLevel, parent.id, ch);
        out.push(seg);
        spawnChildren(seg, params, elev, out);
      }
      side = -side;
      acc += spacing * rng.range(0.7, 1.3);
    }
    acc -= segLen;
  }
}

// ---------- 锁定段保留与重接 ----------

interface Attach {
  segId: string;
  x: number;
  y: number;
  width: number;
  dist: number;
}

/** 在候选段集合中找离 p 最近的线上点 */
function nearestPointOnSegments(
  segments: ChannelSegment[],
  px: number,
  py: number,
  filter: (s: ChannelSegment) => boolean,
): Attach | null {
  let best: Attach | null = null;
  for (const s of segments) {
    if (!filter(s)) continue;
    const pts = s.points;
    for (let i = 1; i < pts.length / 2; i++) {
      const ax = pts[(i - 1) * 2];
      const ay = pts[(i - 1) * 2 + 1];
      const bx = pts[i * 2];
      const by = pts[i * 2 + 1];
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const qx = ax + dx * t;
      const qy = ay + dy * t;
      const d = Math.hypot(px - qx, py - qy);
      if (!best || d < best.dist) {
        const w = s.widths[i - 1] + (s.widths[i] - s.widths[i - 1]) * t;
        best = { segId: s.id, x: qx, y: qy, width: w, dist: d };
      }
    }
  }
  return best;
}

/** 生成一条连接段:从附着点平滑接到目标点(二次贝塞尔,沿目标切线进入) */
function makeConnector(
  id: string,
  level: Level,
  parentId: string,
  from: { x: number; y: number; width: number },
  to: { x: number; y: number; width: number; tangent: number },
): ChannelSegment | null {
  const d = Math.hypot(to.x - from.x, to.y - from.y);
  if (d < 2) return null;
  // 控制点:从目标点沿其切线反向外推,保证接入方向顺滑
  const cx = to.x - Math.sin(to.tangent) * d * 0.45;
  const cy = to.y + Math.cos(to.tangent) * d * 0.45;
  const N = 8;
  const points: number[] = [];
  const widths: number[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const u = 1 - t;
    points.push(
      u * u * from.x + 2 * u * t * cx + t * t * to.x,
      u * u * from.y + 2 * u * t * cy + t * t * to.y,
    );
    widths.push(from.width + (to.width - from.width) * t);
  }
  return {
    id,
    level,
    parentId,
    points,
    widths,
    length: polylineLength(points),
    locked: false,
    custom: false,
    color: [0.5, 0.5, 0.5],
  };
}

/** 段首点切向 */
function headTangent(seg: ChannelSegment): number {
  const p = seg.points;
  const dx = p[2] - p[0];
  const dy = p[3] - p[1];
  return Math.atan2(dx, -dy);
}

/**
 * 将锁定段并入新生成的网络:
 * 1. 移除新网络中与锁定段同 id 的生成段(锁定段形态不变,以其为准);
 * 2. 锁定段根部重新接到新网络中最近的同级或上级沟(生成连接段);
 * 3. 原挂在被替换段上的生成子沟,重新接到锁定段最近点。
 */
export function applyLocked(segments: ChannelSegment[], locked: ChannelSegment[]): void {
  for (const L of locked) {
    const idx = segments.findIndex((s) => s.id === L.id);
    const orphans = segments.filter((s) => s.parentId === L.id);
    if (idx >= 0) segments.splice(idx, 1);

    // 锁定段根部接到新网络(主干无需接)
    if (L.parentId !== null || L.level > 0) {
      const root = { x: L.points[0], y: L.points[1] };
      const target = nearestPointOnSegments(
        segments,
        root.x,
        root.y,
        (s) => s.id !== L.id && s.level <= L.level,
      );
      if (target && target.dist > 2) {
        const conn = makeConnector(
          `${L.id}#link`,
          L.level,
          target.segId,
          { x: target.x, y: target.y, width: Math.min(target.width, L.widths[0]) },
          { x: root.x, y: root.y, width: L.widths[0], tangent: headTangent(L) },
        );
        if (conn) segments.push(conn);
      }
      L.parentId = target ? target.segId : null;
    }
    segments.push(L);

    // 孤儿子沟重接到锁定段
    for (const o of orphans) {
      const oRoot = { x: o.points[0], y: o.points[1] };
      const onL = nearestPointOnSegments([L], oRoot.x, oRoot.y, () => true);
      if (onL && onL.dist > 2) {
        const conn = makeConnector(
          `${o.id}#link`,
          o.level,
          L.id,
          { x: onL.x, y: onL.y, width: Math.min(onL.width, o.widths[0]) },
          { x: oRoot.x, y: oRoot.y, width: o.widths[0], tangent: headTangent(o) },
        );
        if (conn) segments.push(conn);
      }
      o.parentId = L.id;
    }
  }
}

// ---------- 统计与分级配色 ----------

export function computeStats(segments: ChannelSegment[]): NetworkStats {
  const counts: [number, number, number] = [0, 0, 0];
  const lengths: [number, number, number] = [0, 0, 0];
  let junctions = 0;
  for (const s of segments) {
    if (s.id.includes('#link')) continue;
    counts[s.level]++;
    lengths[s.level] += s.length;
    if (s.parentId) junctions++;
  }
  const totalLength = lengths[0] + lengths[1] + lengths[2];
  const areaKm2 = (DOMAIN.w / 1000) * (DOMAIN.h / 1000);
  return {
    counts,
    lengths,
    totalLength,
    junctions,
    density: totalLength / 1000 / areaKm2,
  };
}

/** 按沟长与局部密度分级配色:同级内沟越长色越深,局部越密色越暖 */
export function assignColors(segments: ChannelSegment[]): void {
  const BASE: [number, number, number][] = [
    [0.15, 0.42, 0.75], // 主干:蓝
    [0.10, 0.60, 0.52], // 支沟:青
    [0.80, 0.62, 0.20], // 毛细沟:赭
  ];
  // 各级沟长归一化(对数)
  const logRange: [number, number][] = [0, 1, 2].map((lv) => {
    const ls = segments.filter((s) => s.level === lv && !s.id.includes('#link')).map((s) => Math.log(s.length + 1));
    if (!ls.length) return [0, 1] as [number, number];
    return [Math.min(...ls), Math.max(...ls)] as [number, number];
  });
  // 局部密度:网格内沟长占比
  const GX = 10;
  const GY = 8;
  const cell = new Float64Array(GX * GY);
  for (const s of segments) {
    for (let i = 0; i < s.points.length / 2; i += 2) {
      const x = s.points[i * 2];
      const y = s.points[i * 2 + 1];
      const gx = Math.min(GX - 1, Math.max(0, Math.floor((x / DOMAIN.w) * GX)));
      const gy = Math.min(GY - 1, Math.max(0, Math.floor((y / DOMAIN.h) * GY)));
      cell[gy * GX + gx] += s.length / (s.points.length / 4);
    }
  }
  let maxCell = 1;
  for (const c of cell) maxCell = Math.max(maxCell, c);

  for (const s of segments) {
    const [lo, hi] = logRange[s.level];
    const lenNorm = hi > lo ? (Math.log(s.length + 1) - lo) / (hi - lo) : 0.5;
    const cx = Math.min(GX - 1, Math.max(0, Math.floor((s.points[0] / DOMAIN.w) * GX)));
    const cy = Math.min(GY - 1, Math.max(0, Math.floor((s.points[1] / DOMAIN.h) * GY)));
    const denNorm = cell[cy * GX + cx] / maxCell;
    const base = BASE[s.level];
    const dark = 1.0 - 0.4 * lenNorm; // 越长越深
    const warm = denNorm * 0.35;      // 越密越暖
    s.color = [
      Math.min(1, base[0] * dark + warm * 0.9),
      Math.min(1, base[1] * dark + warm * 0.25),
      Math.min(1, base[2] * dark * (1 - warm * 0.5)),
    ];
  }
}

// ---------- 主入口 ----------

/**
 * 生成潮沟网络。locked 为手动锁定段:整体重生成时这些段形态不变,
 * 并自动与新网络接上。
 */
export function generateNetwork(params: GenParams, locked: ChannelSegment[] = []): Network {
  const elev = makeElevation(params.seed);
  const rng = new Rng(hashStrings(params.seed, ['trunk']));
  const startX = 500 + rng.next() * 3000;
  const startY = elev.coastY(startX) - 8;
  const heading = params.mainDirection * DEG;

  const ch = growChannel({
    streamKey: ['M'],
    seed: params.seed,
    start: [startX, startY],
    heading,
    level: 0,
    params,
    elev,
  });
  const segments: ChannelSegment[] = [];
  if (ch) {
    const trunk = makeSegment('M', 0, null, ch);
    segments.push(trunk);
    spawnChildren(trunk, params, elev, segments);
  }
  if (locked.length) applyLocked(segments, locked);
  assignColors(segments);
  return {
    params: { ...params },
    segments,
    stats: computeStats(segments),
    generatedAt: new Date().toISOString(),
  };
}
