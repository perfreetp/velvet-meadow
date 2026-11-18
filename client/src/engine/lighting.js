// 逐格照度引擎：建筑遮挡可见性 + 光源尺寸半影 + 色温混合 + 曝光/伽马 + 暗区连通块
import { pointInPolygon, segmentIntersectsPolygon, diskSamples, clamp } from './geometry.js';
import { sunPosition, sunGroundDirection, solarIlluminance } from './solar.js';
import { kelvinToRGB } from './color.js';

export const FLOOR_HEIGHT = 3.0;          // 规划默认层高 3m
const SUN_SAMPLES = 8;                    // 太阳圆盘半影采样数
const DEFAULT_LIGHT_SAMPLES = 6;          // 点光源半影采样数

/**
 * @typedef {Object} EngineInput
 * @property {Array} buildings  {id,name,blockId,floors,polygon:[{x,y}]}
 * @property {Array} lights     {id,type,x,y,height,radius,cct,power,size,washTarget?}
 * @property {{minX,minY,maxX,maxY}} bounds 网格范围（米）
 * @property {number} cell 网格尺寸（米，默认 1）
 * @property {number} hour 9~21
 * @property {{month,day}} solarDate 节气日期
 * @property {number} lat @property {number} lng
 * @property {number} exposure 曝光增益（EV 折算的乘数）
 * @property {number} gamma 显示伽马
 * @property {boolean} includeSun 是否计入日照
 * @property {number} darkThreshold 暗区阈值 lux（默认 20）
 */

export function computeLighting(input) {
  const {
    buildings = [], lights = [], bounds, cell = 1,
    hour = 20, solarDate, lat = 39.9, lng = 116.4,
    exposure = 1, gamma = 2.2, includeSun = true, darkThreshold = 20,
  } = input;

  const cols = Math.max(1, Math.ceil((bounds.maxX - bounds.minX) / cell));
  const rows = Math.max(1, Math.ceil((bounds.maxY - bounds.minY) / cell));
  const n = cols * rows;

  // 每格线性累加结果
  const lux = new Float32Array(n);        // 总照度（lux）
  const accR = new Float32Array(n);
  const accG = new Float32Array(n);
  const accB = new Float32Array(n);
  const sunLux = new Float32Array(n);     // 仅日照分量，供日照校核
  const artificialLux = new Float32Array(n); // 仅灯光分量，夜间模式用

  const buildingGeos = buildings.map((b) => ({
    ...b,
    height: Math.max(1, b.floors || 1) * FLOOR_HEIGHT,
    poly: b.polygon,
  }));

  // ---------- 日照 ----------
  const date = new Date(2026, (solarDate?.month || 6) - 1, solarDate?.day || 21);
  const sun = sunPosition(date, hour, lat, lng);
  if (includeSun && sun.daylight) {
    const dir = sunGroundDirection(sun.azim);
    const baseLux = solarIlluminance(sun.elev);
    // 太阳角半径约 0.27°，地面半影带宽度 = h * tan(0.27°)
    const sunDiskRadius = 0.0047; // 弧度
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const idx = gy * cols + gx;
        const px = bounds.minX + (gx + 0.5) * cell;
        const py = bounds.minY + (gy + 0.5) * cell;
        if (insideBuilding(px, py, buildingGeos)) continue;

        let visible = 0;
        // 圆盘采样：中心 + 环，模拟半影
        const samples = diskSamples(0, 0, sunDiskRadius, SUN_SAMPLES);
        for (const s of samples) {
          // 微小角度偏移 -> 传播方向微扰
          const dx = dir.x + s.x;
          const dy = dir.y + s.y;
          const dl = Math.hypot(dx, dy) || 1;
          if (sunRayHits(px, py, dx / dl, dy / dl, sun.elev, buildingGeos)) continue;
          visible += s.w * SUN_SAMPLES; // 权重和为 1
        }
        const v = visible / SUN_SAMPLES;
        const contribution = baseLux * v;
        lux[idx] += contribution;
        sunLux[idx] = contribution;
        // 阳光色温按高度角从低角度暖金到正午白
        const cct = 3500 + 3000 * clamp(Math.sin(sun.elev), 0, 1);
        const [r, g, b] = kelvinToRGB(cct);
        accR[idx] += r * contribution;
        accG[idx] += g * contribution;
        accB[idx] += b * contribution;
      }
    }
  }

  // ---------- 人工光源 ----------
  for (const light of lights) {
    const [cr, cg, cb] = kelvinToRGB(light.cct || 3000);
    const samples = diskSamples(light.x, light.y, light.size || 0.3, DEFAULT_LIGHT_SAMPLES);
    const maxR = light.radius || 10;

    // 只遍历半径包围盒内的格子，避免全网格扫描
    const gx0 = clamp(Math.floor((light.x - maxR - bounds.minX) / cell), 0, cols - 1);
    const gx1 = clamp(Math.ceil((light.x + maxR - bounds.minX) / cell), 0, cols - 1);
    const gy0 = clamp(Math.floor((light.y - maxR - bounds.minY) / cell), 0, cols - 1);
    const gy1 = clamp(Math.ceil((light.y + maxR - bounds.minY) / cell), 0, rows - 1);

    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const idx = gy * cols + gx;
        const px = bounds.minX + (gx + 0.5) * cell;
        const py = bounds.minY + (gy + 0.5) * cell;
        if (insideBuilding(px, py, buildingGeos)) continue;

        let illum = 0;
        for (const s of samples) {
          const dxy = Math.hypot(px - s.x, py - s.y);
          if (dxy > maxR) continue;
          if (pointRayBlocked(s.x, s.y, light.height || 6, px, py, buildingGeos)) continue;
          illum += s.w * pointIlluminance(light, s.x, s.y, px, py, dxy);
        }
        if (illum <= 0) continue;
        lux[idx] += illum;
        artificialLux[idx] += illum;
        accR[idx] += cr * illum;
        accG[idx] += cg * illum;
        accB[idx] += cb * illum;
      }
    }
  }

  // ---------- 输出显示色：混合色按照度加权归一，再走曝光 + 伽马 ----------
  const display = new Uint8ClampedArray(n * 3);
  const heat = new Float32Array(n); // 热力图归一值
  let maxLux = 0;
  for (let i = 0; i < n; i++) {
    if (lux[i] > maxLux) maxLux = lux[i];
    heat[i] = lux[i];
  }

  for (let i = 0; i < n; i++) {
    const total = lux[i];
    let lr = 0, lg = 0, lb = 0;
    if (total > 1e-6) {
      // 色温加权混合：各光源的线性 RGB 已按自身照度累加
      lr = accR[i] / total;
      lg = accG[i] / total;
      lb = accB[i] / total;
    }
    // 昼夜分别取参考白：日照量级可达 10 万 lx，灯光仅几十 lx，
    // 按该格日照占比在两套基准间插值，避免白天整片过曝、夜晚又漆黑
    const sunFrac = total > 1e-6 ? clamp(sunLux[i] / total, 0, 1) : 0;
    const refNight = 100 / Math.max(0.1, exposure);
    const refDay = 60000 / Math.max(0.1, exposure);
    const refWhite = refNight + (refDay - refNight) * sunFrac;
    // 指数色调映射（HDR 压缩），再走显示伽马
    const tonemap = (c) => {
      const linear = 1 - Math.exp(-(c * total) / refWhite);
      return Math.pow(clamp(linear, 0, 1), 1 / gamma) * 255;
    };
    display[i * 3] = tonemap(lr);
    display[i * 3 + 1] = tonemap(lg);
    display[i * 3 + 2] = tonemap(lb);
  }

  // ---------- 暗区：低于阈值且在建筑外的格子，做连通块统计 ----------
  const darkMask = new Uint8Array(n);
  const buildingMask = new Uint8Array(n); // 建筑占地格，地面纹理需透明
  for (let i = 0; i < n; i++) {
    const gx = i % cols;
    const gy = (i / cols) | 0;
    const px = bounds.minX + (gx + 0.5) * cell;
    const py = bounds.minY + (gy + 0.5) * cell;
    if (insideBuilding(px, py, buildingGeos)) {
      buildingMask[i] = 1;
      continue;
    }
    if (lux[i] < darkThreshold) darkMask[i] = 1;
  }
  const darkZones = connectedComponents(darkMask, cols, rows, cell, bounds);

  return {
    cols, rows, cell, bounds,
    lux, sunLux, artificialLux, display, heat,
    maxLux, darkMask, buildingMask, darkZones,
    sun: { elev: sun.elev, azim: sun.azim, daylight: sun.daylight },
  };
}

function insideBuilding(x, y, geos) {
  for (const g of geos) {
    if (pointInPolygon(x, y, g.poly)) return true;
  }
  return false;
}

// 平行光是否被建筑挡住：沿光线反方向（从地面格点指向太阳）找挤出体相交
function sunRayHits(px, py, dirX, dirY, elev, geos) {
  // 从格点向太阳方向追踪，建筑在该方向上且高度足以遮住光线即遮挡
  for (const g of geos) {
    // 求光线水平投影与多边形各边的进入距离
    let minT = Infinity;
    const poly = g.poly;
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length];
      const t = rayEdgeT(px, py, dirX, dirY, a.x, a.y, b.x, b.y);
      if (t > 0 && t < minT) minT = t;
    }
    if (!isFinite(minT)) continue;
    // 光线在 minT 处的离地高度 = minT * tan(elev)
    const rayHeight = minT * Math.tan(elev);
    if (rayHeight < g.height) return true;
  }
  return false;
}

function rayEdgeT(ox, oy, dx, dy, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const denom = dx * vy - dy * vx;
  if (Math.abs(denom) < 1e-12) return Infinity;
  const t = ((ax - ox) * vy - (ay - oy) * vx) / denom;
  const u = ((ax - ox) * dy - (ay - oy) * dx) / denom;
  if (t < 0 || u < 0 || u > 1) return Infinity;
  return t;
}

// 点光源到格点的三维视线是否被建筑挡住
function pointRayBlocked(lx, ly, lh, px, py, geos) {
  for (const g of geos) {
    if (pointInPolygon(lx, ly, g.poly) || pointInPolygon(px, py, g.poly)) return true;
    if (!segmentIntersectsPolygon(lx, ly, px, py, g.poly)) continue;
    // 水平交点处的视线离地高度：沿光源→格点线性插值
    const hit = closestIntersection(lx, ly, px, py, g.poly);
    const t = hit ?? 1;
    const sightHeight = lh * (1 - t); // 格点处高度为 0
    if (sightHeight < g.height) return true;
  }
  return false;
}

// 线段与多边形首次相交的归一化位置 t（0=光源端，1=格点端）
function closestIntersection(ax, ay, bx, by, poly) {
  let best = null;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    const t = segmentT(ax, ay, bx, by, p.x, p.y, q.x, q.y);
    if (t !== null && (best === null || t < best)) best = t;
  }
  return best;
}

function segmentT(ax, ay, bx, by, cx, cy, dx, dy) {
  const rx = bx - ax, ry = by - ay;
  const sx = dx - cx, sy = dy - cy;
  const denom = rx * sy - ry * sx;
  if (Math.abs(denom) < 1e-12) return null;
  const t = ((cx - ax) * sy - (cy - ay) * sx) / denom;
  const u = ((cx - ax) * ry - (cy - ay) * rx) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return t;
}

// 单点照度：距离平方反比 + 半径滚降 + 灯具类型配光
function pointIlluminance(light, lx, ly, px, py, dxy) {
  const h = light.height || 6;
  const dist3 = Math.sqrt(dxy * dxy + h * h);
  const cosTheta = h / dist3; // 光线与地面法线夹角余弦
  const radius = light.radius || 10;
  // 半径内保持较平坦照度，接近边缘用 smoothstep 柔和收束，避免近处骤暗
  const t = clamp(dxy / radius, 0, 1);
  const edge = 1 - t * t * (3 - 2 * t);

  // 向下光强（坎德拉）：下射灯具光通量主要进入下半空间（2π），
  // 取利用系数 η 折算到有效光强 I = Φ·η/π（朗伯面光源关系）
  const lumens = (light.power || 10) * 1000;
  let eta = 0.5;
  let beam = 1; // 配光形状因子
  if (light.type === 'street') {
    eta = 0.55;                       // 路灯高效下射
    beam = Math.pow(cosTheta, 1.5);   // 宽配光
  } else if (light.type === 'courtyard') {
    eta = 0.45;
    beam = Math.pow(cosTheta, 1.1);   // 近朗伯
  } else if (light.type === 'wallwash') {
    eta = 0.5;
    const aim = light.washTarget;
    if (aim) {
      const ax = aim.x - lx, ay = aim.y - ly;
      const al = Math.hypot(ax, ay) || 1;
      const dot = ((px - lx) * ax + (py - ly) * ay) / ((dxy || 1e-6) * al);
      beam = Math.pow(Math.max(0, dot), 3) * Math.max(0.2, cosTheta);
    } else {
      beam = Math.pow(cosTheta, 2);
    }
  }
  const candela = (lumens * eta) / Math.PI;
  // 地面点照度 E = I·cos³θ/h²（平方反比 + 入射角余弦），再乘配光与半径滚降
  return (candela * cosTheta ** 3 / (h * h)) * beam * edge;
}

// 四邻域连通块（BFS），输出每个暗区块的格数、面积与世界坐标包围盒（米）
function connectedComponents(mask, cols, rows, cell, bounds) {
  const seen = new Uint8Array(mask.length);
  const zones = [];
  const queue = new Int32Array(mask.length);
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    let head = 0, tail = 0;
    queue[tail++] = start;
    seen[start] = 1;
    let minGX = Infinity, minGY = Infinity, maxGX = -Infinity, maxGY = -Infinity;
    let count = 0;
    while (head < tail) {
      const idx = queue[head++];
      count++;
      const gx = idx % cols, gy = (idx / cols) | 0;
      if (gx < minGX) minGX = gx; if (gx > maxGX) maxGX = gx;
      if (gy < minGY) minGY = gy; if (gy > maxGY) maxGY = gy;
      const neighbors = [idx - 1, idx + 1, idx - cols, idx + cols];
      for (const nb of neighbors) {
        if (nb < 0 || nb >= mask.length || seen[nb] || !mask[nb]) continue;
        // 左右邻接需同行
        if ((nb === idx - 1 || nb === idx + 1) && Math.floor(nb / cols) !== gy) continue;
        seen[nb] = 1;
        queue[tail++] = nb;
      }
    }
    zones.push({
      id: zones.length,
      cells: count,
      areaM2: count * cell * cell,
      // 网格索引包围盒
      gridBBox: { minX: minGX, minY: minGY, maxX: maxGX, maxY: maxGY },
      // 世界坐标包围盒（米）
      worldBBox: {
        minX: round2(bounds.minX + minGX * cell),
        minY: round2(bounds.minY + minGY * cell),
        maxX: round2(bounds.minX + (maxGX + 1) * cell),
        maxY: round2(bounds.minY + (maxGY + 1) * cell),
      },
    });
  }
  zones.sort((a, b) => b.areaM2 - a.areaM2);
  return zones;
}

function round2(v) {
  return Math.round(v * 100) / 100;
}
