import type { Segment, LineSeg, ArcSeg, CubicSeg, Vec, BBox } from './types';
import { uid } from './types';
import { add, angle, bboxFromPoints, clamp, dist, lerp, normAngle, scale, sub, sweepAngle } from './math';

export function segStart(s: Segment): Vec { return s.a; }
export function segEnd(s: Segment): Vec { return s.b; }

export function pointAt(s: Segment, t: number): Vec {
  switch (s.type) {
    case 'line':
      return lerp(s.a, s.b, t);
    case 'arc': {
      const a0 = angle(sub(s.a, s.c));
      const sweep = sweepAngle(s.a, s.b, s.c, s.ccw);
      const th = a0 + (s.ccw ? 1 : -1) * sweep * t;
      const r = dist(s.a, s.c);
      return { x: s.c.x + r * Math.cos(th), y: s.c.y + r * Math.sin(th) };
    }
    case 'cubic': {
      const u = 1 - t;
      const w0 = scale(s.a, u * u * u);
      const w1 = scale(s.c1, 3 * u * u * t);
      const w2 = scale(s.c2, 3 * u * t * t);
      const w3 = scale(s.b, t * t * t);
      return add(add(w0, w1), add(w2, w3));
    }
  }
}

export function segBBox(s: Segment): BBox {
  if (s.type === 'line') return bboxFromPoints([s.a, s.b]);
  return bboxFromPoints(flatten(s, 0.05));
}

export function segLength(s: Segment): number {
  const pts = flatten(s, 0.02);
  let total = 0;
  let prev = s.a;
  for (const p of pts) { total += dist(prev, p); prev = p; }
  return total;
}

/** 展平为折线,返回除起点外的采样点(末点即 s.b) */
export function flatten(s: Segment, maxStep = 0.1): Vec[] {
  if (s.type === 'line') return [s.b];
  if (s.type === 'arc') {
    const r = dist(s.a, s.c);
    const sweep = sweepAngle(s.a, s.b, s.c, s.ccw);
    const n = Math.max(2, Math.ceil((r * sweep) / maxStep), Math.ceil(sweep / (Math.PI / 12)));
    const a0 = angle(sub(s.a, s.c));
    const pts: Vec[] = [];
    for (let i = 1; i <= n; i++) {
      const th = a0 + (s.ccw ? 1 : -1) * sweep * (i / n);
      pts.push({ x: s.c.x + r * Math.cos(th), y: s.c.y + r * Math.sin(th) });
    }
    pts[pts.length - 1] = s.b;
    return pts;
  }
  // 三次贝塞尔:自适应细分
  const out: Vec[] = [];
  const subdiv = (a: Vec, c1: Vec, c2: Vec, b: Vec, depth: number) => {
    if (depth > 7) { out.push(b); return; }
    const m1 = lerp(a, c1, 0.5), m2 = lerp(c1, c2, 0.5), m3 = lerp(c2, b, 0.5);
    const n1 = lerp(m1, m2, 0.5), n2 = lerp(m2, m3, 0.5);
    const midp = lerp(n1, n2, 0.5);
    const chord = lerp(a, b, 0.5);
    if (dist(midp, chord) < maxStep * 0.25 && depth > 2) { out.push(b); return; }
    subdiv(a, m1, n1, midp, depth + 1);
    subdiv(midp, n2, m3, b, depth + 1);
  };
  subdiv(s.a, s.c1, s.c2, s.b, 0);
  return out;
}

/** 在参数 t 处分割,返回两段(新 id) */
export function splitSeg(s: Segment, t: number): [Segment, Segment] {
  const tt = clamp(t, 1e-6, 1 - 1e-6);
  if (s.type === 'line') {
    const m = pointAt(s, tt);
    return [
      { id: uid('ln'), type: 'line', a: { ...s.a }, b: m },
      { id: uid('ln'), type: 'line', a: m, b: { ...s.b } }
    ];
  }
  if (s.type === 'arc') {
    const m = pointAt(s, tt);
    return [
      { id: uid('ar'), type: 'arc', a: { ...s.a }, b: m, c: { ...s.c }, ccw: s.ccw },
      { id: uid('ar'), type: 'arc', a: m, b: { ...s.b }, c: { ...s.c }, ccw: s.ccw }
    ];
  }
  // de Casteljau
  const p0 = s.a, p1 = s.c1, p2 = s.c2, p3 = s.b;
  const q1 = lerp(p0, p1, tt), q2 = lerp(p1, p2, tt), q3 = lerp(p2, p3, tt);
  const r1 = lerp(q1, q2, tt), r2 = lerp(q2, q3, tt);
  const m = lerp(r1, r2, tt);
  return [
    { id: uid('cb'), type: 'cubic', a: { ...p0 }, c1: q1, c2: r1, b: m },
    { id: uid('cb'), type: 'cubic', a: m, c1: r2, c2: q3, b: { ...p3 } }
  ];
}

export interface NearestResult {
  point: Vec;
  t: number;
  d: number;
}

/** 图元上离 p 最近的点 */
export function nearestOnSeg(s: Segment, p: Vec): NearestResult {
  if (s.type === 'line') {
    const ab = sub(s.b, s.a);
    const l2 = ab.x * ab.x + ab.y * ab.y || 1;
    const t = clamp(((p.x - s.a.x) * ab.x + (p.y - s.a.y) * ab.y) / l2, 0, 1);
    const q = lerp(s.a, s.b, t);
    return { point: q, t, d: dist(p, q) };
  }
  if (s.type === 'arc') {
    const r = dist(s.a, s.c);
    const a0 = angle(sub(s.a, s.c));
    const sweep = sweepAngle(s.a, s.b, s.c, s.ccw);
    const dir = s.ccw ? 1 : -1;
    const target = normAngle(angle(sub(p, s.c)) - a0) * dir;
    // 把目标角度折回 [0, sweep]
    let bestT = 0;
    const candidates = [0, sweep, clamp(target, 0, sweep), clamp(target + Math.PI * 2 * dir, 0, sweep)];
    let bestD = Infinity;
    for (const c of candidates) {
      const t = c / sweep;
      const q = pointAt(s, t);
      const d = dist(p, q);
      if (d < bestD) { bestD = d; bestT = t; }
    }
    // 粗采样后局部细化
    const N = 48;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const q = pointAt(s, t);
      const d = dist(p, q);
      if (d < bestD) { bestD = d; bestT = t; }
    }
    let lo = Math.max(0, bestT - 1 / N), hi = Math.min(1, bestT + 1 / N);
    for (let k = 0; k < 24; k++) {
      const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3;
      if (dist(p, pointAt(s, m1)) < dist(p, pointAt(s, m2))) hi = m2; else lo = m1;
    }
    bestT = (lo + hi) / 2;
    const q = pointAt(s, bestT);
    return { point: q, t: bestT, d: dist(p, q) };
  }
  // cubic:粗采样 + 黄金分割细化
  const N = 40;
  let bestT = 0, bestD = Infinity;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const d = dist(p, pointAt(s, t));
    if (d < bestD) { bestD = d; bestT = t; }
  }
  let lo = Math.max(0, bestT - 1 / N), hi = Math.min(1, bestT + 1 / N);
  for (let k = 0; k < 30; k++) {
    const m1 = lo + (hi - lo) * 0.382, m2 = hi - (hi - lo) * 0.382;
    if (dist(p, pointAt(s, m1)) < dist(p, pointAt(s, m2))) hi = m2; else lo = m1;
  }
  bestT = (lo + hi) / 2;
  const q = pointAt(s, bestT);
  return { point: q, t: bestT, d: dist(p, q) };
}

/** 三点构造圆弧(圆心+方向);三点共线时退化为直线 */
export function arcFromPoints(a: Vec, through: Vec, b: Vec): ArcSeg | LineSeg {
  const ax = a.x, ay = a.y;
  const bx = through.x, by = through.y;
  const cx = b.x, cy = b.y;
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-9) {
    return { id: uid('ln'), type: 'line', a: { ...a }, b: { ...b } };
  }
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  const center = { x: ux, y: uy };
  const ccw = normAngle(angle(sub(through, center)) - angle(sub(a, center))) <
    normAngle(angle(sub(b, center)) - angle(sub(a, center)));
  return { id: uid('ar'), type: 'arc', a: { ...a }, b: { ...b }, c: center, ccw };
}

/** 把一串点用 Catmull-Rom 转三次贝塞尔(自由曲线平滑) */
export function smoothPointsToCubics(pts: Vec[]): CubicSeg[] {
  if (pts.length < 2) return [];
  const out: CubicSeg[] = [];
  const p = (i: number) => pts[clamp(i, 0, pts.length - 1)];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = p(i - 1), p1 = p(i), p2 = p(i + 1), p3 = p(i + 2);
    out.push({
      id: uid('cb'),
      type: 'cubic',
      a: { ...p1 },
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      b: { ...p2 }
    });
  }
  return out;
}

export function cloneSeg(s: Segment): Segment {
  return JSON.parse(JSON.stringify(s)) as Segment;
}
