// 纯几何工具：多边形 / 射线 / 阴影，全部为无副作用纯函数，Worker 与主线程共用

export function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y;
    const xj = poly[j].x, yj = poly[j].y;
    const intersect = (yi > y) !== (yj > y) &&
      x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

// 线段 AB 是否与多边形任一边相交（不含端点在内部的情形，调用方另做点内含判断）
export function segmentIntersectsPolygon(ax, ay, bx, by, poly) {
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    if (segmentsIntersect(ax, ay, bx, by, p.x, p.y, q.x, q.y)) return true;
  }
  return false;
}

function segmentsIntersect(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = cross(cx, cy, dx, dy, ax, ay);
  const d2 = cross(cx, cy, dx, dy, bx, by);
  const d3 = cross(ax, ay, bx, by, cx, cy);
  const d4 = cross(ax, ay, bx, by, dx, dy);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true;
  return false;
}

function cross(ax, ay, bx, by, px, py) {
  return (bx - ax) * (py - ay) - (by - ay) * (px - ax);
}

export function polygonArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return Math.abs(a) / 2;
}

export function polygonCentroid(poly) {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const crossV = p.x * q.y - q.x * p.y;
    a += crossV;
    cx += (p.x + q.x) * crossV;
    cy += (p.y + q.y) * crossV;
  }
  a *= 0.5;
  if (Math.abs(a) < 1e-9) {
    const sx = poly.reduce((s, p) => s + p.x, 0);
    const sy = poly.reduce((s, p) => s + p.y, 0);
    return { x: sx / poly.length, y: sy / poly.length };
  }
  return { x: cx / (6 * a), y: cy / (6 * a) };
}

// 点到线段的最近距离
export function distancePointToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  const cx = ax + t * dx, cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

export function distancePointToPolygon(px, py, poly) {
  if (pointInPolygon(px, py, poly)) return 0;
  let min = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    const d = distancePointToSegment(px, py, p.x, p.y, q.x, q.y);
    if (d < min) min = d;
  }
  return min;
}

// 射线（起点 ox,oy，方向 dirx,diry）与线段相交的最近距离，无交点返回 Infinity
export function raySegmentT(ox, oy, dirx, diry, ax, ay, bx, by) {
  const vx = bx - ax, vy = by - ay;
  const denom = dirx * vy - diry * vx;
  if (Math.abs(denom) < 1e-12) return Infinity;
  const t = ((ax - ox) * vy - (ay - oy) * vx) / denom;
  const u = ((ax - ox) * diry - (ay - oy) * dirx) / denom;
  if (t < 0 || u < 0 || u > 1) return Infinity;
  return t;
}

// 平行光下，建筑（挤出高度 h）在地面的阴影多边形
// sunDir 为太阳光传播方向的水平单位向量（从太阳指向地面的投影方向）
export function extrudeShadowPolygon(poly, height, sunElev, sunDirX, sunDirY) {
  if (sunElev <= 0.02) return poly; // 太阳极低时阴影趋于无限，返回本体由上层截断
  const reach = height / Math.tan(sunElev);
  const dx = sunDirX * reach;
  const dy = sunDirY * reach;
  const n = poly.length;
  // 阴影 = 原多边形 ∪ 每条边沿光方向挤出的四边形，取凸包式合并：
  // 对凸/凹多边形统一用「轮廓点 + 偏移点」做凸包并不正确，这里直接构造联合体的外包络：
  const pts = poly.map((p) => ({ x: p.x, y: p.y }));
  const shifted = poly.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  return convexHull([...pts, ...shifted]);
}

// Andrew 单调链凸包
export function convexHull(points) {
  const pts = points.map((p) => ({ x: p.x, y: p.y })).sort((a, b) => a.x - b.x || a.y - b.y);
  if (pts.length <= 2) return pts;
  const cross3 = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross3(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross3(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

// 圆盘光源采样点：中心 1 个 + 半径 r 的环上 n-1 个，r 为光源物理尺寸（米）
export function diskSamples(cx, cy, radius, n) {
  const out = [{ x: cx, y: cy, w: 1 / n }];
  if (n <= 1 || radius <= 0) return out;
  const ring = n - 1;
  for (let i = 0; i < ring; i++) {
    const ang = (i / ring) * Math.PI * 2;
    out.push({ x: cx + Math.cos(ang) * radius, y: cy + Math.sin(ang) * radius, w: 1 / n });
  }
  return out;
}

export function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
