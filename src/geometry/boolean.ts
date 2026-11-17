import type { Contour, Segment, Vec } from './types';
import { uid } from './types';
import { dist, pointInPolygon } from './math';
import { cloneSeg, pointAt, segEnd, segStart } from './segments';
import { cloneContour, contourPolyline } from './contour';
import { segIntersections } from './intersection';
import { splitSeg } from './segments';

export type BoolOp = 'union' | 'subtract' | 'intersect';

const CHAIN_EPS = 5e-3;

interface SplitSet {
  segs: Segment[];
}

/** 收集两轮廓所有交点,把每条段按交点参数切分 */
function splitAtIntersections(A: Contour, B: Contour): [SplitSet, SplitSet] {
  const cutsA = new Map<number, number[]>();
  const cutsB = new Map<number, number[]>();
  const add = (map: Map<number, number[]>, i: number, t: number) => {
    if (t < 1e-5 || t > 1 - 1e-5) return;
    if (!map.has(i)) map.set(i, []);
    const arr = map.get(i)!;
    if (!arr.some(x => Math.abs(x - t) < 1e-4)) arr.push(t);
  };
  A.segs.forEach((sa, i) => {
    B.segs.forEach((sb, j) => {
      for (const h of segIntersections(sa, sb)) {
        add(cutsA, i, h.tA);
        add(cutsB, j, h.tB);
      }
    });
  });
  const apply = (c: Contour, cuts: Map<number, number[]>): SplitSet => ({
    segs: c.segs.flatMap((s, i) => {
      const ts = (cuts.get(i) ?? []).sort((a, b) => a - b);
      if (!ts.length) return [cloneSeg(s)];
      const out: Segment[] = [];
      let cur = cloneSeg(s);
      let base = 0;
      for (const t of ts) {
        const local = (t - base) / (1 - base);
        const [s1, s2] = splitSeg(cur, local);
        out.push(s1);
        cur = s2;
        base = t;
      }
      out.push(cur);
      return out;
    })
  });
  return [apply(A, cutsA), apply(B, cutsB)];
}

function midpoint(s: Segment): Vec { return pointAt(s, 0.5); }

function inside(p: Vec, c: Contour): boolean {
  if (c.segs.length < 2) return false;
  return pointInPolygon(p, contourPolyline(c, 0.08));
}

/** 把段按首尾连接拼成闭合环 */
function assembleLoops(segs: Segment[]): Contour[] {
  const remaining = segs.map(s => ({ s, used: false }));
  const loops: Contour[] = [];
  for (let start = 0; start < remaining.length; start++) {
    if (remaining[start].used) continue;
    const chain: Segment[] = [];
    let cur = remaining[start];
    cur.used = true;
    chain.push(cur.s);
    let guard = 0;
    while (guard++ < remaining.length + 4) {
      const tail = segEnd(chain[chain.length - 1]);
      if (dist(tail, segStart(chain[0])) < CHAIN_EPS) break;
      let next = remaining.find(r => !r.used && dist(segStart(r.s), tail) < CHAIN_EPS);
      if (!next) {
        // 容差放宽再找一次
        next = remaining.find(r => !r.used && dist(segStart(r.s), tail) < CHAIN_EPS * 8);
      }
      if (!next) break;
      next.used = true;
      chain.push(next.s);
    }
    if (chain.length >= 2 && dist(segEnd(chain[chain.length - 1]), segStart(chain[0])) < CHAIN_EPS * 8) {
      loops.push({ id: uid('ct'), closed: true, segs: chain });
    }
  }
  return loops;
}

/**
 * 两个闭合轮廓的布尔运算。
 * 交点处切分原图元 -> 按段中点相对另一轮廓的内外关系选边 -> 拼环。
 * 弧/贝塞尔仅被切分不展平,因此结果保留原路径圆角。
 */
export function booleanOp(op: BoolOp, contourA: Contour, contourB: Contour): Contour[] {
  const A = cloneContour(contourA);
  const B = cloneContour(contourB);
  A.closed = B.closed = true;
  const [sa, sb] = splitAtIntersections(A, B);

  const keepA = (s: Segment): boolean => {
    const m = midpoint(s);
    const inB = inside(m, B);
    if (op === 'union') return !inB;
    if (op === 'subtract') return !inB;
    return inB; // intersect
  };
  const keepB = (s: Segment): boolean => {
    const m = midpoint(s);
    const inA = inside(m, A);
    if (op === 'union') return !inA;
    if (op === 'subtract') return inA; // 减去:保留 B 落在 A 内部的边(方向取反由拼环自然处理)
    return inA;
  };

  const kept: Segment[] = [];
  for (const s of sa.segs) if (keepA(s)) kept.push(s);
  for (const s of sb.segs) {
    if (!keepB(s)) continue;
    if (op === 'subtract') kept.push(reverseSeg(s));
    else kept.push(s);
  }
  return assembleLoops(kept);
}

function reverseSeg(s: Segment): Segment {
  if (s.type === 'line') {
    return { ...s, id: uid('ln'), a: { ...s.b }, b: { ...s.a } };
  }
  if (s.type === 'arc') {
    return { ...s, id: uid('ar'), a: { ...s.b }, b: { ...s.a }, c: { ...s.c }, ccw: !s.ccw };
  }
  return { ...s, id: uid('cb'), a: { ...s.b }, b: { ...s.a }, c1: { ...s.c2 }, c2: { ...s.c1 } };
}

/** 两轮廓是否有交互(相交,或一个落在另一个内部) */
export function contoursInteract(a: Contour, b: Contour): boolean {
  for (const sa of a.segs) {
    for (const sb of b.segs) {
      if (segIntersections(sa, sb).length) return true;
    }
  }
  // 无交点:检查包含关系(取中点判定)
  const ma = a.segs.length ? pointAt(a.segs[0], 0.5) : null;
  const mb = b.segs.length ? pointAt(b.segs[0], 0.5) : null;
  if (ma && inside(ma, b)) return true;
  if (mb && inside(mb, a)) return true;
  return false;
}

/** 批量两两合并(任意顺序,无交互或运算失败的轮廓原样保留) */
export function unionAll(contours: Contour[]): Contour[] {
  let result = contours.map(cloneContour);
  let mergedAny = true;
  let guard = 0;
  while (mergedAny && guard++ < 100) {
    mergedAny = false;
    outer: for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        if (!contoursInteract(result[i], result[j])) continue;
        const r = booleanOp('union', result[i], result[j]);
        if (!r.length) continue; // 运算失败,保留原样
        const rest = result.filter((_, k) => k !== i && k !== j);
        result = [...r, ...rest];
        mergedAny = true;
        break outer;
      }
    }
  }
  return result;
}

/** 轮廓面积(有向,展平积分) */
export function contourArea(c: Contour): number {
  const pts = contourPolyline(c, 0.05);
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s / 2);
}
