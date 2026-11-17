import type { Contour, Segment, Vec, BBox } from './types';
import { uid } from './types';
import { GEOM_EPS, bboxFromPoints, dist, pointInPolygon, signedArea } from './math';
import { flatten, pointAt, segEnd, segStart, splitSeg, nearestOnSeg, cloneSeg } from './segments';

/** 展平为折线(包含首点) */
export function contourPolyline(c: Contour, step = 0.1): Vec[] {
  const pts: Vec[] = c.segs.length ? [c.segs[0].a] : [];
  for (const s of c.segs) {
    const fp = flatten(s, step);
    for (const p of fp) pts.push(p);
  }
  if (c.closed && pts.length > 1 && dist(pts[0], pts[pts.length - 1]) < GEOM_EPS) pts.pop();
  return pts;
}

export function contourBBox(c: Contour): BBox {
  return bboxFromPoints(contourPolyline(c, 0.2));
}

export function contourLength(c: Contour): number {
  let total = 0;
  for (const s of c.segs) {
    const fp = flatten(s, 0.05);
    let prev = s.a;
    for (const p of fp) { total += dist(prev, p); prev = p; }
  }
  return total;
}

/** 所有锚点(段端点;闭合轮廓首锚点不重复) */
export function contourAnchors(c: Contour): Vec[] {
  if (!c.segs.length) return [];
  const anchors = c.segs.map(segStart);
  if (!c.closed) anchors.push(segEnd(c.segs[c.segs.length - 1]));
  return anchors;
}

export function isClosed(c: Contour): boolean {
  if (c.closed) return true;
  if (c.segs.length < 2) return false;
  return dist(segStart(c.segs[0]), segEnd(c.segs[c.segs.length - 1])) < GEOM_EPS;
}

/** 点是否在闭合轮廓内部 */
export function pointInsideContour(p: Vec, c: Contour): boolean {
  if (!isClosed(c)) return false;
  return pointInPolygon(p, contourPolyline(c, 0.1));
}

/** 轮廓是否为逆时针(y 向下坐标系;激光/填充约定 CCW 为外轮廓) */
export function isCCW(c: Contour): boolean {
  return signedArea(contourPolyline(c, 0.15)) < 0;
}

/** 命中锚点,返回锚点下标(在 contourAnchors 序列中) */
export function hitAnchor(c: Contour, p: Vec, tol: number): number {
  const anchors = contourAnchors(c);
  let best = -1, bestD = tol;
  anchors.forEach((a, i) => {
    const d = dist(a, p);
    if (d < bestD) { bestD = d; best = i; }
  });
  return best;
}

/** 命中段,返回段下标与参数 t */
export function hitSegment(c: Contour, p: Vec, tol: number): { index: number; t: number; point: Vec } | null {
  let best: { index: number; t: number; point: Vec; d: number } | null = null;
  c.segs.forEach((s, i) => {
    const r = nearestOnSeg(s, p);
    if (r.d < tol && (!best || r.d < best.d)) best = { index: i, t: r.t, point: r.point, d: r.d };
  });
  return best;
}

/** 在某段参数 t 处插入锚点(段一分为二) */
export function insertAnchor(c: Contour, segIndex: number, t: number): void {
  const s = c.segs[segIndex];
  const [s1, s2] = splitSeg(s, t);
  c.segs.splice(segIndex, 1, s1, s2);
}

/** 删除锚点:相邻两段合并为一段(线-线、弧-弧保圆心时保弧度,其余用三次贝塞尔近似) */
export function deleteAnchor(c: Contour, anchorIndex: number): void {
  const n = c.segs.length;
  if (n < 2) return;
  const prevIdx = (anchorIndex - 1 + n) % n;
  const nextIdx = anchorIndex % n;
  const prev = c.segs[prevIdx];
  const next = c.segs[nextIdx];
  const start = segStart(prev);
  const end = segEnd(next);
  let merged: Segment;
  if (prev.type === 'line' && next.type === 'line') {
    merged = { id: uid('ln'), type: 'line', a: { ...start }, b: { ...end } };
  } else if (prev.type === 'arc' && next.type === 'arc' &&
    dist(prev.c, next.c) < GEOM_EPS && prev.ccw === next.ccw &&
    dist(prev.c, start) - dist(next.c, end) < GEOM_EPS) {
    merged = { id: uid('ar'), type: 'arc', a: { ...start }, b: { ...end }, c: { ...prev.c }, ccw: prev.ccw };
  } else {
    // 用中点控制点的三次贝塞尔近似,尽量保留圆角观感
    const midPrev = pointAt(prev, 0.5);
    const midNext = pointAt(next, 0.5);
    merged = {
      id: uid('cb'), type: 'cubic', a: { ...start }, b: { ...end },
      c1: { ...midPrev }, c2: { ...midNext }
    };
  }
  const removeIdx = [prevIdx, nextIdx].sort((a, b) => a - b);
  c.segs.splice(removeIdx[1], 1);
  c.segs.splice(removeIdx[0], 1);
  c.segs.splice(removeIdx[0], 0, merged);
}

/** 移动锚点;open 轮廓首/尾锚点只影响一段 */
export function moveAnchor(c: Contour, anchorIndex: number, to: Vec): void {
  const n = c.segs.length;
  if (!n) return;
  const isLastOpen = !c.closed && anchorIndex === n; // 末锚点
  if (isLastOpen) {
    c.segs[n - 1].b = { ...to };
    return;
  }
  if (!c.closed && anchorIndex === 0) {
    c.segs[0].a = { ...to };
    return;
  }
  const prev = c.segs[(anchorIndex - 1 + n) % n];
  const next = c.segs[anchorIndex % n];
  prev.b = { ...to };
  next.a = { ...to };
}

/** 整体平移 */
export function translateContour(c: Contour, dx: number, dy: number): void {
  const t = (p: Vec): Vec => ({ x: p.x + dx, y: p.y + dy });
  for (const s of c.segs) {
    s.a = t(s.a); s.b = t(s.b);
    if (s.type === 'arc') s.c = t(s.c);
    if (s.type === 'cubic') { s.c1 = t(s.c1); s.c2 = t(s.c2); }
  }
}

export function cloneContour(c: Contour): Contour {
  return { id: uid('ct'), name: c.name, closed: c.closed, segs: c.segs.map(cloneSeg) };
}

export function makeContour(segs: Segment[], closed: boolean, name?: string): Contour {
  return { id: uid('ct'), name, closed, segs };
}
