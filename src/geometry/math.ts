import type { Vec, BBox } from './types';

export const EPS = 1e-9;
export const GEOM_EPS = 1e-4; // 几何判定容差(mm)
export const SNAP_EPS = 2.5; // 屏幕吸附半径(px)

export const v = (x: number, y: number): Vec => ({ x, y });
export const add = (p: Vec, q: Vec): Vec => ({ x: p.x + q.x, y: p.y + q.y });
export const sub = (p: Vec, q: Vec): Vec => ({ x: p.x - q.x, y: p.y - q.y });
export const scale = (p: Vec, d: number): Vec => ({ x: p.x * d, y: p.y * d });
export const dot = (p: Vec, q: Vec): number => p.x * q.x + p.y * q.y;
export const cross = (p: Vec, q: Vec): number => p.x * q.y - p.y * q.x;
export const len = (p: Vec): number => Math.hypot(p.x, p.y);
export const dist = (p: Vec, q: Vec): number => Math.hypot(p.x - q.x, p.y - q.y);
export const lerp = (p: Vec, q: Vec, t: number): Vec => ({
  x: p.x + (q.x - p.x) * t,
  y: p.y + (q.y - p.y) * t
});
export const mid = (p: Vec, q: Vec): Vec => lerp(p, q, 0.5);

export function angle(p: Vec): number {
  return Math.atan2(p.y, p.x);
}

/** 把角度规范到 [0, 2π) */
export function normAngle(a: number): number {
  const twoPi = Math.PI * 2;
  return ((a % twoPi) + twoPi) % twoPi;
}

/** 从 a 方向到 b 方向、按 ccw 方向扫过的圆心角(0, 2π] */
export function sweepAngle(a: Vec, b: Vec, c: Vec, ccw: boolean): number {
  const aa = normAngle(Math.atan2(a.y - c.y, a.x - c.x));
  const bb = normAngle(Math.atan2(b.y - c.y, b.x - c.x));
  let d = ccw ? bb - aa : aa - bb;
  d = normAngle(d);
  if (d < EPS) d = Math.PI * 2; // 起终点重合 => 整圆
  return d;
}

export function bboxFromPoints(pts: Vec[]): BBox {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

export function unionBBox(a: BBox, b: BBox): BBox {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY)
  };
}

export function pointInBBox(p: Vec, b: BBox, pad = 0): boolean {
  return p.x >= b.minX - pad && p.x <= b.maxX + pad && p.y >= b.minY - pad && p.y <= b.maxY + pad;
}

export function bboxesOverlap(a: BBox, b: BBox, pad = 0): boolean {
  return !(
    a.maxX < b.minX - pad ||
    a.minX > b.maxX + pad ||
    a.maxY < b.minY - pad ||
    a.minY > b.maxY + pad
  );
}

/** 射线法判断点是否在多边形内(展平后的轮廓) */
export function pointInPolygon(p: Vec, poly: Vec[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i];
    if (a.y > p.y !== b.y > p.y) {
      const xHit = a.x + ((p.y - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (p.x < xHit) inside = !inside;
    }
  }
  return inside;
}

/** 有向面积(y 向下为正的画布坐标;CCW 外形返回负值) */
export function signedArea(pts: Vec[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** Douglas–Peucker 抽稀 */
export function simplifyDP(pts: Vec[], tol: number): Vec[] {
  if (pts.length < 3) return pts.slice();
  const keep = new Array<boolean>(pts.length).fill(false);
  keep[0] = keep[pts.length - 1] = true;
  const stack: [number, number][] = [[0, pts.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let maxD = -1, idx = -1;
    const a = pts[first], b = pts[last];
    const ab = sub(b, a);
    const l = len(ab) || 1;
    for (let i = first + 1; i < last; i++) {
      const d = Math.abs(cross(ab, sub(pts[i], a))) / l;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol && idx > 0) {
      keep[idx] = true;
      stack.push([first, idx], [idx, last]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}
