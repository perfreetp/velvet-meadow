import type { Segment, Vec, BBox } from './types';
import { GEOM_EPS, bboxFromPoints, bboxesOverlap, cross, dist, sub } from './math';
import { flatten, pointAt, segBBox, splitSeg } from './segments';

export interface CrossPoint {
  tA: number;
  tB: number;
  p: Vec;
}

const SUBDEPTH = 9;
const SUBTOL = 1e-3; // mm

function lineLine(a: Segment, b: Segment): CrossPoint[] {
  if (a.type !== 'line' || b.type !== 'line') return [];
  const r = sub(a.b, a.a), s = sub(b.b, b.a);
  const denom = cross(r, s);
  const qp = sub(b.a, a.a);
  if (Math.abs(denom) < GEOM_EPS) return []; // 平行/共线交由容差重合处理
  const t = cross(qp, s) / denom;
  const u = cross(qp, r) / denom;
  if (t < -1e-7 || t > 1 + 1e-7 || u < -1e-7 || u > 1 + 1e-7) return [];
  const tc = Math.min(1, Math.max(0, t));
  const uc = Math.min(1, Math.max(0, u));
  return [{ tA: tc, tB: uc, p: { x: a.a.x + r.x * tc, y: a.a.y + r.y * tc } }];
}

function lineCircle(p1: Vec, p2: Vec, c: Vec, r: number): { t: number; p: Vec }[] {
  const d = sub(p2, p1);
  const f = sub(p1, c);
  const aa = d.x * d.x + d.y * d.y;
  if (aa < GEOM_EPS) return [];
  const bb = 2 * (f.x * d.x + f.y * d.y);
  const cc = f.x * f.x + f.y * f.y - r * r;
  const disc = bb * bb - 4 * aa * cc;
  if (disc < 0) return [];
  const sq = Math.sqrt(Math.max(0, disc));
  const roots = [(-bb - sq) / (2 * aa), (-bb + sq) / (2 * aa)];
  const out: { t: number; p: Vec }[] = [];
  for (const t of roots) {
    if (t < -1e-7 || t > 1 + 1e-7) continue;
    const tc = Math.min(1, Math.max(0, t));
    out.push({ t: tc, p: { x: p1.x + d.x * tc, y: p1.y + d.y * tc } });
  }
  return out;
}

function lineArc(line: Segment, arc: Segment): CrossPoint[] {
  if (line.type !== 'line' || arc.type !== 'arc') return [];
  const r = dist(arc.a, arc.c);
  const hits = lineCircle(line.a, line.b, arc.c, r);
  const out: CrossPoint[] = [];
  for (const h of hits) {
    // 交点必须落在圆弧的角度区间内:沿弧最近点应与交点重合
    const sample = flatten(arc, 0.02);
    let bestD = Infinity, bestT = 0;
    for (let i = 0; i <= sample.length; i++) {
      const t = i / sample.length;
      const q = i === sample.length ? arc.b : sample[i];
      const d = dist(q, h.p);
      if (d < bestD) { bestD = d; bestT = t; }
    }
    if (bestD < SUBTOL * 4) out.push({ tA: h.t, tB: bestT, p: h.p });
  }
  return out;
}

function arcArc(a: Segment, b: Segment): CrossPoint[] {
  if (a.type !== 'arc' || b.type !== 'arc') return [];
  const r1 = dist(a.a, a.c), r2 = dist(b.a, b.c);
  const d = dist(a.c, b.c);
  if (d < GEOM_EPS) return [];
  const pts: Vec[] = [];
  if (d > r1 + r2 + GEOM_EPS || d < Math.abs(r1 - r2) - GEOM_EPS) return [];
  const a1 = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a1 * a1;
  if (h2 < -GEOM_EPS) return [];
  const h = Math.sqrt(Math.max(0, h2));
  const ux = (b.c.x - a.c.x) / d, uy = (b.c.y - a.c.y) / d;
  const px = a.c.x + a1 * ux, py = a.c.y + a1 * uy;
  pts.push({ x: px + h * (-uy), y: py + h * ux });
  if (h > GEOM_EPS) pts.push({ x: px - h * (-uy), y: py - h * ux });
  const out: CrossPoint[] = [];
  for (const p of pts) {
    const ta = bestArcParam(a, p);
    const tb = bestArcParam(b, p);
    if (ta >= 0 && tb >= 0) out.push({ tA: ta, tB: tb, p });
  }
  return out;
}

function bestArcParam(arc: Segment, p: Vec): number {
  if (arc.type !== 'arc') return -1;
  const sample = flatten(arc, 0.02);
  let bestD = Infinity, bestT = -1;
  for (let i = 0; i <= sample.length; i++) {
    const t = i / sample.length;
    const q = i === sample.length ? arc.b : sample[i];
    const d = dist(q, p);
    if (d < bestD) { bestD = d; bestT = t; }
  }
  return bestD < SUBTOL * 4 ? bestT : -1;
}

/** 含贝塞尔的相交:递归细分直到包围盒足够小,再用折线距离估参数 */
function segIntersectCubic(a: Segment, b: Segment): CrossPoint[] {
  const out: CrossPoint[] = [];
  const seen: Vec[] = [];
  const pushHit = (pa: number, pb: number, p: Vec) => {
    if (seen.some(q => dist(q, p) < SUBTOL * 3)) return;
    seen.push(p);
    out.push({ tA: pa, tB: pb, p });
  };
  const subdiv = (s1: Segment, t1lo: number, t1hi: number, s2: Segment, t2lo: number, t2hi: number, depth: number) => {
    const b1: BBox = segBBox(s1), b2: BBox = segBBox(s2);
    if (!bboxesOverlap(b1, b2, SUBTOL)) return;
    const span1 = Math.max(b1.maxX - b1.minX, b1.maxY - b1.minY);
    const span2 = Math.max(b2.maxX - b2.minX, b2.maxY - b2.minY);
    if (depth >= SUBDEPTH || (span1 < SUBTOL && span2 < SUBTOL)) {
      // 两段已足够短:取中点连线最近处
      const m1 = pointAt(s1, 0.5), m2 = pointAt(s2, 0.5);
      if (dist(m1, m2) < SUBTOL * 3) {
        pushHit((t1lo + t1hi) / 2, (t2lo + t2hi) / 2, { x: (m1.x + m2.x) / 2, y: (m1.y + m2.y) / 2 });
      }
      return;
    }
    const [s1a, s1b] = splitSeg(s1, 0.5);
    const [s2a, s2b] = splitSeg(s2, 0.5);
    const t1m = (t1lo + t1hi) / 2, t2m = (t2lo + t2hi) / 2;
    for (const [x, xlo, xhi] of [[s1a, t1lo, t1m], [s1b, t1m, t1hi]] as [Segment, number, number][]) {
      for (const [y, ylo, yhi] of [[s2a, t2lo, t2m], [s2b, t2m, t2hi]] as [Segment, number, number][]) {
        subdiv(x, xlo, xhi, y, ylo, yhi, depth + 1);
      }
    }
  };
  subdiv(a, 0, 1, b, 0, 1, 0);
  return out;
}

export function segIntersections(a: Segment, b: Segment): CrossPoint[] {
  if (!bboxesOverlap(segBBox(a), segBBox(b), SUBTOL)) return [];
  if (a.type === 'line' && b.type === 'line') return lineLine(a, b);
  if (a.type === 'line' && b.type === 'arc') return lineArc(a, b);
  if (a.type === 'arc' && b.type === 'line') {
    return lineArc(b, a).map(h => ({ tA: h.tB, tB: h.tA, p: h.p }));
  }
  if (a.type === 'arc' && b.type === 'arc') return arcArc(a, b);
  return segIntersectCubic(a, b);
}

/** 同一轮廓自交检测(相邻段只在公共锚点处相接,视为正常) */
export function contourSelfIntersections(segs: Segment[]): { p: Vec; i: number; j: number }[] {
  const hits: { p: Vec; i: number; j: number }[] = [];
  const n = segs.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === n - 1);
      for (const h of segIntersections(segs[i], segs[j])) {
        if (adjacent) {
          // 相邻段仅允许在公共端点相交
          const shared = j === i + 1 ? segs[i].b : segs[i].a;
          if (dist(h.p, shared) < SUBTOL * 4) continue;
        }
        if (!hits.some(q => dist(q.p, h.p) < SUBTOL * 4)) hits.push({ p: h.p, i, j });
      }
    }
  }
  return hits;
}
