import type { Vec2 } from '../types';

export const v = (x: number, y: number): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const norm = (a: Vec2): Vec2 => {
  const l = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / l, y: a.y / l };
};
export const angleOf = (a: Vec2): number => Math.atan2(a.y, a.x);
export const fromAngle = (rad: number, r = 1): Vec2 => ({ x: Math.cos(rad) * r, y: Math.sin(rad) * r });
/** 角度差归一化到 [-PI, PI] */
export const angleDiff = (a: number, b: number): number => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const clamp = (x: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, x));
export const deg2rad = (d: number): number => (d * Math.PI) / 180;

/** 射线 p+t*d 与线段 ab 的交点 t（无交点返回 null，t>=0） */
export function raySegment(
  p: Vec2,
  d: Vec2,
  a: Vec2,
  b: Vec2,
): { t: number; u: number } | null {
  const e = sub(b, a);
  const denom = d.x * e.y - d.y * e.x;
  if (Math.abs(denom) < 1e-12) return null;
  const ap = sub(a, p);
  const t = (ap.x * e.y - ap.y * e.x) / denom;
  const u = (ap.x * d.y - ap.y * d.x) / denom;
  if (t < 0 || u < 0 || u > 1) return null;
  return { t, u };
}

export interface Segment {
  a: Vec2;
  b: Vec2;
  height: number;
}

/** 折线拆为线段（带高度），可选厚度偏移生成双侧挡墙段 */
export function polylineToSegments(
  points: Vec2[],
  thickness: number,
  height: number,
): Segment[] {
  const segs: Segment[] = [];
  if (points.length < 2) return segs;
  const half = thickness / 2;
  // 中心线分段 + 两端封口，构成有厚度的带状挡墙
  const left: Vec2[] = [];
  const right: Vec2[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(0, i - 1)];
    const next = points[Math.min(points.length - 1, i + 1)];
    const dir = norm(sub(next, prev));
    const n = { x: -dir.y, y: dir.x };
    left.push(add(points[i], scale(n, half)));
    right.push(add(points[i], scale(n, -half)));
  }
  for (let i = 0; i < points.length - 1; i++) {
    segs.push({ a: left[i], b: left[i + 1], height });
    segs.push({ a: right[i + 1], b: right[i], height });
  }
  segs.push({ a: right[0], b: left[0], height });
  segs.push({
    a: left[left.length - 1],
    b: right[right.length - 1],
    height,
  });
  return segs;
}

/** 闭合多边形拆为线段 */
export function polygonToSegments(points: Vec2[], height: number): Segment[] {
  const segs: Segment[] = [];
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    segs.push({ a, b, height });
  }
  return segs;
}

/** 点在多边形内（射线法），边界算在内 */
export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect =
      yi > p.y !== yj > p.y &&
      p.x < ((xj - xi) * (p.y - yi)) / (yj - yi || 1e-12) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** 点到线段的距离 */
export function pointSegmentDist(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  if (l2 < 1e-12) return dist(p, a);
  const t = clamp(dot(sub(p, a), ab) / l2, 0, 1);
  return dist(p, add(a, scale(ab, t)));
}

/** 点到折线的距离 */
export function pointPolylineDist(p: Vec2, line: Vec2[]): number {
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    min = Math.min(min, pointSegmentDist(p, line[i], line[i + 1]));
  }
  return min;
}

export function polygonBounds(poly: Vec2[]): { min: Vec2; max: Vec2 } {
  const min = { x: Infinity, y: Infinity };
  const max = { x: -Infinity, y: -Infinity };
  for (const p of poly) {
    min.x = Math.min(min.x, p.x);
    min.y = Math.min(min.y, p.y);
    max.x = Math.max(max.x, p.x);
    max.y = Math.max(max.y, p.y);
  }
  return { min, max };
}

/** 折线长度 */
export function polylineLength(line: Vec2[]): number {
  let total = 0;
  for (let i = 0; i < line.length - 1; i++) total += dist(line[i], line[i + 1]);
  return total;
}

/** 沿折线取距离 s 处的点与切线方向 */
export function samplePolyline(
  line: Vec2[],
  s: number,
): { pos: Vec2; dir: Vec2 } | null {
  if (line.length < 2) return null;
  let acc = 0;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i];
    const b = line[i + 1];
    const segLen = dist(a, b);
    if (acc + segLen >= s) {
      const t = segLen < 1e-9 ? 0 : (s - acc) / segLen;
      return {
        pos: { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) },
        dir: norm(sub(b, a)),
      };
    }
    acc += segLen;
  }
  const last = line[line.length - 1];
  return { pos: last, dir: norm(sub(last, line[line.length - 2])) };
}

let idCounter = 0;
export function uid(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}`;
}
