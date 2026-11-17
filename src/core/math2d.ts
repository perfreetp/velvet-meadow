import type { Vec2 } from './types';

let counter = 0;
export function uid(prefix = 'id'): string {
  counter = (counter + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}${Math.floor(Math.random() * 4096).toString(36)}`;
}

export const v = (x: number, y: number): Vec2 => ({ x, y });
export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const dot = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
export const cross = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;
export const len = (a: Vec2): number => Math.hypot(a.x, a.y);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const dist2 = (a: Vec2, b: Vec2): number => {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
};
export const norm = (a: Vec2): Vec2 => {
  const l = Math.hypot(a.x, a.y);
  return l < 1e-12 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
};
export const perp = (a: Vec2): Vec2 => ({ x: -a.y, y: a.x });
export const mid = (a: Vec2, b: Vec2): Vec2 => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
export const lerp = (a: Vec2, b: Vec2, t: number): Vec2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t
});
export const angleOf = (a: Vec2): number => Math.atan2(a.y, a.x);

/** 角度归一化到 (-π, π] */
export function normalizeAngle(a: number): number {
  let r = a % (Math.PI * 2);
  if (r <= -Math.PI) r += Math.PI * 2;
  if (r > Math.PI) r -= Math.PI * 2;
  return r;
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, x));
}

/** 点到线段距离及最近点参数 t */
export function pointSegDist(p: Vec2, a: Vec2, b: Vec2): { d: number; t: number; q: Vec2 } {
  const ab = sub(b, a);
  const l2 = dot(ab, ab);
  const t = l2 < 1e-14 ? 0 : clamp(dot(sub(p, a), ab) / l2, 0, 1);
  const q = lerp(a, b, t);
  return { d: dist(p, q), t, q };
}

export interface LineLineHit {
  t: number; // 在第一段 a->b 上的参数
  u: number; // 在第二段 c->d 上的参数
  p: Vec2;
}

/** 两线段（含端点）交点 */
export function lineLine(a: Vec2, b: Vec2, c: Vec2, d: Vec2): LineLineHit | null {
  const r = sub(b, a);
  const s = sub(d, c);
  const denom = cross(r, s);
  const qp = sub(c, a);
  if (Math.abs(denom) < 1e-12) return null; // 平行/共线（练习场景不处理共线重叠）
  const t = cross(qp, s) / denom;
  const u = cross(qp, r) / denom;
  const eps = 1e-9;
  if (t < -eps || t > 1 + eps || u < -eps || u > 1 + eps) return null;
  return { t: clamp(t, 0, 1), u: clamp(u, 0, 1), p: add(a, mul(r, t)) };
}

/** bulge 圆弧几何信息 */
export interface ArcGeom {
  center: Vec2;
  radius: number;
  startAngle: number;
  endAngle: number;
  sweep: number; // 有向圆心角（弧度），逆时针正
  ccw: boolean;
}

export function arcGeom(a: Vec2, b: Vec2, bulge: number): ArcGeom | null {
  const chord = dist(a, b);
  if (chord < 1e-10 || Math.abs(bulge) < 1e-9) return null;
  const h = chord / 2;
  const sagitta = bulge * h; // 弧高（带符号）
  const radius = h * (bulge + 1 / bulge) / 2;
  const chordDir = norm(sub(b, a));
  // 圆心在弦中垂线上，弧顶一侧与 bulge 同号
  const normal = perp(chordDir);
  const centerDist = radius - sagitta;
  const center = add(mid(a, b), mul(normal, centerDist));
  const startAngle = angleOf(sub(a, center));
  const endAngle = angleOf(sub(b, center));
  let sweep = normalizeAngle(endAngle - startAngle);
  const ccw = bulge > 0;
  if (ccw && sweep < 0) sweep += Math.PI * 2;
  if (!ccw && sweep > 0) sweep -= Math.PI * 2;
  if (!ccw && sweep === 0) sweep = -Math.PI * 2;
  return { center, radius: Math.abs(radius), startAngle, endAngle, sweep, ccw };
}

/** 圆弧按参数 t∈[0,1] 取点 */
export function arcPoint(g: ArcGeom, t: number): Vec2 {
  const ang = g.startAngle + g.sweep * t;
  return { x: g.center.x + g.radius * Math.cos(ang), y: g.center.y + g.radius * Math.sin(ang) };
}

/** 圆弧自适应细分（弦高差控制） */
export function tessellateArc(g: ArcGeom, tolerance = 0.05): Vec2[] {
  const total = Math.abs(g.sweep);
  if (total < 1e-9) return [];
  // 弦高误差 = r(1-cos(Δ/2)) <= tol
  const maxStep = Math.max(0.02, 2 * Math.acos(clamp(1 - tolerance / Math.max(g.radius, 1e-6), -1, 1)));
  const n = Math.max(2, Math.ceil(total / maxStep));
  const pts: Vec2[] = [];
  for (let i = 0; i <= n; i++) pts.push(arcPoint(g, i / n));
  return pts;
}

export interface ArcHit {
  t: number; // 弧上参数 0..1
  p: Vec2;
}

/** 线段与圆弧交点 */
export function lineArc(p1: Vec2, p2: Vec2, g: ArcGeom): ArcHit[] {
  const d = sub(p2, p1);
  const f = sub(p1, g.center);
  const A = dot(d, d);
  if (A < 1e-14) return [];
  const B = 2 * dot(f, d);
  const C = dot(f, f) - g.radius * g.radius;
  const disc = B * B - 4 * A * C;
  const hits: ArcHit[] = [];
  if (disc < -1e-9) return hits;
  const root = Math.sqrt(Math.max(0, disc));
  for (const tSeg of [(-B - root) / (2 * A), (-B + root) / (2 * A)]) {
    if (tSeg < -1e-9 || tSeg > 1 + 1e-9) continue;
    const p = lerp(p1, p2, clamp(tSeg, 0, 1));
    const t = angleParam(g, p);
    if (t !== null) hits.push({ t, p });
  }
  return dedupHits(hits);
}

/** 圆上点对应的弧参数（不在弧段内返回 null） */
export function angleParam(g: ArcGeom, p: Vec2): number | null {
  const ang = angleOf(sub(p, g.center));
  let delta = normalizeAngle(ang - g.startAngle);
  if (g.ccw && delta < 0) delta += Math.PI * 2;
  if (!g.ccw && delta > 0) delta -= Math.PI * 2;
  const total = g.sweep; // 带符号
  // 起点（含整圆 2π 环绕）
  if (Math.abs(delta) < 1e-7) return 0;
  const t = total === 0 ? 0 : delta / total;
  if (t < -1e-7 || t > 1 + 1e-7) return null;
  return clamp(t, 0, 1);
}

/** 两圆弧交点 */
export function arcArc(g1: ArcGeom, g2: ArcGeom): ArcHit[] {
  const d = dist(g1.center, g2.center);
  const hits: ArcHit[] = [];
  if (d < 1e-12) return hits;
  const r1 = g1.radius, r2 = g2.radius;
  if (d > r1 + r2 + 1e-9 || d < Math.abs(r1 - r2) - 1e-9) return hits;
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a;
  if (h2 < -1e-9) return hits;
  const h = Math.sqrt(Math.max(0, h2));
  const dir = norm(sub(g2.center, g1.center));
  const base = add(g1.center, mul(dir, a));
  const off = mul(perp(dir), h);
  for (const p of [add(base, off), ...(h > 1e-9 ? [sub(base, off)] : [])]) {
    const t1 = angleParam(g1, p);
    const t2 = angleParam(g2, p);
    if (t1 !== null && t2 !== null) hits.push({ t: t1, p });
  }
  return dedupHits(hits);
}

function dedupHits(hits: ArcHit[]): ArcHit[] {
  const out: ArcHit[] = [];
  for (const h of hits) {
    if (!out.some(o => dist2(o.p, h.p) < 1e-12)) out.push(h);
  }
  return out.sort((a, b) => a.t - b.t);
}

/** 射线法判断点是否在多边形内（pts 为闭合多边形的有序顶点） */
export function pointInPolygon(p: Vec2, pts: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[j], b = pts[i];
    if ((a.y > p.y) !== (b.y > p.y)) {
      const x = a.x + ((p.y - a.y) * (b.x - a.x)) / (b.y - a.y);
      if (p.x < x) inside = !inside;
    }
  }
  return inside;
}

/** 有向面积（正=逆时针） */
export function signedArea(pts: Vec2[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += cross(a, b);
  }
  return s / 2;
}

/** 三点构造 bulge（p1 -> p3 经过/趋近 p2 的弧），返回 bulge 与中点参数对应关系 */
export function bulgeFromThree(p1: Vec2, p2: Vec2, p3: Vec2): number {
  const chord = dist(p1, p3);
  if (chord < 1e-10) return 0;
  const chordDir = norm(sub(p3, p1));
  const n = perp(chordDir);
  const signedHeight = dot(sub(p2, mid(p1, p3)), n);
  const h = chord / 2;
  // sagitta = bulge * h  => bulge = sagitta/h；退化时退回直线
  if (Math.abs(signedHeight) < 1e-9) return 0;
  return signedHeight / h;
}

/** 由起点、终点和弧顶（ bulge 控制点）求 bulge */
export function bulgeFromApex(a: Vec2, b: Vec2, apex: Vec2): number {
  return bulgeFromThree(a, apex, b);
}

/** 弧顶（弧中点） */
export function arcApex(g: ArcGeom): Vec2 {
  return arcPoint(g, 0.5);
}

export const EPS = 1e-7;
