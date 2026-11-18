import type { CornerMode, Vec2 } from '../../types';
import { v2 } from './spline';

const MITER_LIMIT = 4; // 尖角长度与偏移距离之比上限，超限自动退回斜切
const ARC_SEGMENTS = 10; // 圆角每段弧的细分数（按转角自适应再缩放）

interface Edge {
  p0: Vec2;
  p1: Vec2;
  dir: Vec2;
  normal: Vec2; // 单位左法向
}

function makeEdges(points: Vec2[], closed: boolean): Edge[] {
  const edges: Edge[] = [];
  const n = points.length;
  const segCount = closed ? n : n - 1;
  for (let i = 0; i < segCount; i++) {
    const p0 = points[i];
    const p1 = points[(i + 1) % n];
    const dir = v2.norm(v2.sub(p1, p0));
    edges.push({ p0, p1, dir, normal: v2.normal(dir) });
  }
  return edges;
}

/** 两直线交点：a + t*da 与 b + s*db */
function lineIntersection(a: Vec2, da: Vec2, b: Vec2, db: Vec2): Vec2 | null {
  const denom = da.x * db.y - da.y * db.x;
  if (Math.abs(denom) < 1e-10) return null;
  const diff = v2.sub(b, a);
  const t = (diff.x * db.y - diff.y * db.x) / denom;
  return v2.add(a, v2.scale(da, t));
}

function arcPoints(center: Vec2, from: Vec2, to: Vec2, dirA: Vec2, dirB: Vec2, turnLeft: boolean): Vec2[] {
  const r = v2.dist(center, from);
  const a0 = Math.atan2(from.y - center.y, from.x - center.x);
  let a1 = Math.atan2(to.y - center.y, to.x - center.x);
  if (turnLeft) {
    while (a1 <= a0) a1 += Math.PI * 2;
  } else {
    while (a1 >= a0) a1 -= Math.PI * 2;
  }
  const sweep = Math.abs(a1 - a0);
  const steps = Math.max(4, Math.ceil((sweep / (Math.PI / 2)) * ARC_SEGMENTS));
  const out: Vec2[] = [];
  for (let i = 1; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push({ x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) });
  }
  // 抑制未使用变量告警（dirA/dirB 保留用于调试切线）
  void dirA;
  void dirB;
  return out;
}

/**
 * 折线等距偏移。
 * @param points 输入折线
 * @param closed 是否闭合环
 * @param distance 偏移距离，正值沿左法向，负值沿右法向
 * @param mode round 圆角 / miter 尖角 / bevel 斜切
 */
export function offsetPolyline(points: Vec2[], closed: boolean, distance: number, mode: CornerMode): Vec2[] {
  if (points.length < 2 || Math.abs(distance) < 1e-9) return points.map((p) => ({ ...p }));
  const edges = makeEdges(points, closed);
  if (edges.length === 0) return [];

  // 每条边的偏移直线
  const shifted = edges.map((e) => ({
    a: v2.add(e.p0, v2.scale(e.normal, distance)),
    b: v2.add(e.p1, v2.scale(e.normal, distance))
  }));

  const out: Vec2[] = [];

  if (!closed) {
    out.push(shifted[0].a);
  }

  const jointCount = closed ? edges.length : edges.length - 1;
  for (let k = 0; k < jointCount; k++) {
    const e0 = edges[k];
    const e1 = edges[(k + 1) % edges.length];
    const s0 = shifted[k];
    const s1 = shifted[(k + 1) % edges.length];
    const joint = closed ? points[(k + 1) % points.length] : points[k + 1];

    // 共线边：直接用偏移端点
    const cross = v2.cross(e0.dir, e1.dir);
    if (Math.abs(cross) < 1e-9) {
      out.push(s0.b);
      continue;
    }

    const turnLeft = cross > 0;
    // 偏移方向与转角方向是否一致（同向=凹角，偏移线发散需延长求交）
    const sameSide = distance > 0 === turnLeft;

    if (mode === 'round') {
      out.push(s0.b);
      if (sameSide) {
        // 凸角：绕原顶点圆弧连接
        for (const p of arcPoints(joint, s0.b, s1.a, e0.dir, e1.dir, turnLeft === distance > 0)) out.push(p);
      } else {
        // 凹角：偏移直线交点
        const hit = lineIntersection(s0.a, e0.dir, s1.a, e1.dir);
        out.push(hit ?? s0.b);
      }
    } else if (mode === 'miter') {
      const hit = lineIntersection(s0.a, e0.dir, s1.a, e1.dir);
      if (!hit) {
        out.push(s0.b);
        continue;
      }
      const miterLen = v2.dist(hit, joint);
      if (!sameSide || miterLen <= Math.abs(distance) * MITER_LIMIT) {
        out.push(hit);
      } else {
        // 尖角过长，退回斜切
        out.push(s0.b, s1.a);
      }
    } else {
      // bevel：斜切，凸角直接弦接两个偏移端点；凹角求交
      if (sameSide) {
        out.push(s0.b, s1.a);
      } else {
        const hit = lineIntersection(s0.a, e0.dir, s1.a, e1.dir);
        out.push(hit ?? s0.b);
      }
    }
  }

  if (!closed) {
    out.push(shifted[shifted.length - 1].b);
  }

  return dedupe(out);
}

function dedupe(pts: Vec2[]): Vec2[] {
  const res: Vec2[] = [];
  for (const p of pts) {
    const last = res[res.length - 1];
    if (!last || v2.distSq(last, p) > 1e-10) res.push(p);
  }
  if (res.length > 1 && v2.distSq(res[0], res[res.length - 1]) < 1e-10) res.pop();
  return res;
}

export type OffsetSide = 'left' | 'right' | 'both';

/** 对一条业务线生成等距平行线（两侧时返回两条） */
export function buildOffsetLines(
  sourcePoints: Vec2[],
  closed: boolean,
  distance: number,
  mode: CornerMode,
  side: OffsetSide
): { side: 'left' | 'right'; points: Vec2[] }[] {
  const results: { side: 'left' | 'right'; points: Vec2[] }[] = [];
  if (side === 'left' || side === 'both') {
    results.push({ side: 'left', points: offsetPolyline(sourcePoints, closed, Math.abs(distance), mode) });
  }
  if (side === 'right' || side === 'both') {
    results.push({ side: 'right', points: offsetPolyline(sourcePoints, closed, -Math.abs(distance), mode) });
  }
  return results;
}

/** 点到线段距离，用于范围裁剪等 */
export function pointSegmentDistance(p: Vec2, a: Vec2, b: Vec2): number {
  const ab = v2.sub(b, a);
  const ap = v2.sub(p, a);
  const lenSq = ab.x * ab.x + ab.y * ab.y;
  if (lenSq < 1e-12) return v2.dist(p, a);
  let t = (ap.x * ab.x + ap.y * ab.y) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return v2.dist(p, { x: a.x + ab.x * t, y: a.y + ab.y * t });
}
