import type { Anchor, IntersectionPoint, PathData, Segment, Vec2 } from './types';
import {
  arcArc, arcGeom, angleParam, dist, lineArc, lineLine, pointInPolygon, uid
} from './math2d';
import { eachSeg, flattenPath, segEndpoints } from './geometry';

export type BoolOp = 'union' | 'difference' | 'intersection';

interface HNode {
  id: string;
  p: Vec2;
  isIntersection: boolean;
  interId?: string;
  companionNodeId?: string;
  sourceKind?: 'line-line' | 'line-arc' | 'arc-arc';
}

interface HEdge {
  id: string;
  from: string;
  to: string;
  poly: 0 | 1;
  srcSegId: string;
  t0: number;
  t1: number;
  pair: string;
  next: string;
  used: boolean;
}

interface PolygonGraph {
  nodes: Map<string, HNode>;
  edges: Map<string, HEdge>;
  startEdge: string;
  flat: Vec2[];
  path: PathData;
}

function paramOnSeg(path: PathData, seg: Segment, p: Vec2): number {
  const [a, b] = segEndpoints(path, seg);
  if (seg.type === 'line') {
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    return l2 < 1e-14 ? 0 : ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  }
  const g = arcGeom(a, b, seg.bulge);
  return g ? (angleParam(g, p) ?? 0) : 0;
}

function buildGraph(path: PathData, poly: 0 | 1): PolygonGraph {
  const { pts, pieces } = flattenPath(path, 0.04);
  const nodes = new Map<string, HNode>();
  const edges = new Map<string, HEdge>();
  const nodeIds: string[] = [];
  const segOfVertex: string[] = [];
  const tOfVertex: number[] = [];

  let idx = 0;
  for (const piece of pieces) {
    for (let k = 0; k < piece.pts.length; k++) {
      const p = pts[idx];
      const nid = uid('n');
      nodes.set(nid, { id: nid, p, isIntersection: false });
      nodeIds.push(nid);
      segOfVertex.push(piece.seg.id);
      tOfVertex.push(k === 0 ? 0 : -1);
      idx++;
    }
  }
  idx = 0;
  for (const piece of pieces) {
    const seg = path.segs.find(s => s.id === piece.seg.id)!;
    for (let k = 0; k < piece.pts.length; k++) {
      if (tOfVertex[idx] === -1) tOfVertex[idx] = paramOnSeg(path, seg, pts[idx]);
      idx++;
    }
  }

  const n = nodeIds.length;
  const fwd: string[] = [];
  const rev: string[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const eid = uid('e'), rid = uid('e');
    fwd.push(eid);
    rev.push(rid);
    edges.set(eid, {
      id: eid, from: nodeIds[i], to: nodeIds[j], poly,
      srcSegId: segOfVertex[i], t0: tOfVertex[i], t1: j === 0 ? 1 : tOfVertex[j],
      pair: rid, next: '', used: false
    });
    edges.set(rid, {
      id: rid, from: nodeIds[j], to: nodeIds[i], poly,
      srcSegId: segOfVertex[i], t0: j === 0 ? 1 : tOfVertex[j], t1: tOfVertex[i],
      pair: eid, next: '', used: false
    });
  }
  // 正向环：e_i -> e_{i+1}；反向环：r_i -> r_{i-1}
  for (let i = 0; i < n; i++) {
    edges.get(fwd[i])!.next = fwd[(i + 1) % n];
    edges.get(rev[i])!.next = rev[(i - 1 + n) % n];
  }

  return { nodes, edges, startEdge: fwd[0], flat: pts, path };
}

/** 在正向半边 e 上插入交点节点，返回从该节点出发的正向半边 */
function splitEdge(g: PolygonGraph, eid: string, node: HNode): string {
  const e = g.edges.get(eid)!;
  const pair = g.edges.get(e.pair)!;
  g.nodes.set(node.id, node);

  const seg = g.path.segs.find(s => s.id === e.srcSegId)!;
  const t = paramOnSeg(g.path, seg, node.p);

  const e1id = uid('e'), e2id = uid('e'), p1id = uid('e'), p2id = uid('e');
  const oldNext = e.next;
  // 正向环：e(A→B) 拆为 e1(A→M) → e2(M→B)
  const e1: HEdge = { ...e, id: e1id, to: node.id, t1: t, pair: p1id, next: e2id };
  const e2: HEdge = { ...e, id: e2id, from: node.id, t0: t, pair: p2id, next: oldNext };
  // 反向环：pair(B→A) 拆为 p2(B→M) → p1(M→A)
  const p2: HEdge = { ...pair, id: p2id, to: node.id, t1: t, pair: e2id, next: p1id };
  const p1: HEdge = { ...pair, id: p1id, from: node.id, t0: t, pair: e1id, next: pair.next };

  g.edges.delete(eid);
  g.edges.delete(pair.id);
  g.edges.set(e1id, e1);
  g.edges.set(e2id, e2);
  g.edges.set(p1id, p1);
  g.edges.set(p2id, p2);
  // 重新链接两个环：所有仍指向旧 id 的边改指向新边
  for (const cand of g.edges.values()) {
    if (cand.next === eid) cand.next = e1id;
    if (cand.next === pair.id) cand.next = p2id;
  }
  if (g.startEdge === eid) g.startEdge = e1id;
  return e2id;
}

function ringEdges(g: PolygonGraph, start?: string): HEdge[] {
  const begin = start ?? g.startEdge;
  const out: HEdge[] = [];
  const seen = new Set<string>();
  let cur = g.edges.get(begin)!;
  do {
    if (!cur || seen.has(cur.id)) break;
    seen.add(cur.id);
    out.push(cur);
    cur = g.edges.get(cur.next)!;
  } while (cur && cur.id !== begin);
  return out;
}

/** 两条源边的解析求交 */
function segIntersect(pathA: PathData, segA: Segment, pathB: PathData, segB: Segment): { p: Vec2; kind: HNode['sourceKind'] }[] {
  const [a1, a2] = segEndpoints(pathA, segA);
  const [b1, b2] = segEndpoints(pathB, segB);
  const out: { p: Vec2; kind: HNode['sourceKind'] }[] = [];

  if (segA.type === 'line' && segB.type === 'line') {
    const hit = lineLine(a1, a2, b1, b2);
    if (hit) out.push({ p: hit.p, kind: 'line-line' });
    return out;
  }
  if (segA.type === 'arc' && segB.type === 'arc') {
    const ga = arcGeom(a1, a2, segA.bulge), gb = arcGeom(b1, b2, segB.bulge);
    if (ga && gb) for (const h of arcArc(ga, gb)) out.push({ p: h.p, kind: 'arc-arc' });
    return out;
  }
  if (segA.type === 'line' && segB.type === 'arc') {
    const gb = arcGeom(b1, b2, segB.bulge);
    if (gb) for (const h of lineArc(a1, a2, gb)) out.push({ p: h.p, kind: 'line-arc' });
    return out;
  }
  // 剩余情形：A 弧 B 线
  if (segA.type !== 'arc') return out;
  const ga = arcGeom(a1, a2, segA.bulge);
  if (ga) for (const h of lineArc(b1, b2, ga)) out.push({ p: h.p, kind: 'line-arc' });
  return out;
}

function findEdgeBySrc(g: PolygonGraph, srcSegId: string): HEdge | undefined {
  for (const e of g.edges.values()) if (e.srcSegId === srcSegId) return e;
  return undefined;
}

/** 在当前存活半边中找到包含点 p 的正向半边 */
function findLiveEdge(g: PolygonGraph, srcSegId: string, p: Vec2): HEdge | undefined {
  // 先按与 p 的距离选出最贴近的半边，再要求正向（参数递增）
  let best: HEdge | undefined;
  let bestD = Infinity;
  for (const e of g.edges.values()) {
    if (e.srcSegId !== srcSegId) continue;
    const a = g.nodes.get(e.from)!.p;
    const b = g.nodes.get(e.to)!.p;
    // 包围盒粗筛 + 点到线段距离，避免叉积容差在短细分边上失效
    if (p.x < Math.min(a.x, b.x) - 1e-5 || p.x > Math.max(a.x, b.x) + 1e-5) continue;
    if (p.y < Math.min(a.y, b.y) - 1e-5 || p.y > Math.max(a.y, b.y) + 1e-5) continue;
    const d = pointSegDistLocal(p, a, b);
    if (d < bestD) { bestD = d; best = e; }
  }
  if (!best) return undefined;
  if (best.t1 > best.t0 + 1e-9) return best;
  // 选中的是反向边时改取其配对正向边
  const pair = g.edges.get(best.pair);
  return pair && pair.t1 > pair.t0 + 1e-9 ? pair : best;
}

function pointSegDistLocal(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 < 1e-14) return dist(p, a);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return dist(p, { x: a.x + dx * t, y: a.y + dy * t });
}

function buildAndIntersect(p0: PathData, p1: PathData): { g0: PolygonGraph; g1: PolygonGraph; intersections: IntersectionPoint[] } {
  const g0 = buildGraph(p0, 0);
  const g1 = buildGraph(p1, 1);
  const intersections: IntersectionPoint[] = [];

  for (const s0 of eachSeg(p0)) {
    for (const s1 of eachSeg(p1)) {
      const hits = segIntersect(p0, s0, p1, s1);
      for (const hit of hits) {
        const he0 = findLiveEdge(g0, s0.id, hit.p);
        const he1 = findLiveEdge(g1, s1.id, hit.p);
        if (!he0 || !he1) continue;

        const exist = intersections.find(q => dist(q, hit.p) < 0.01);
        const interId = exist?.id ?? uid('ip');
        if (!exist) {
          intersections.push({
            id: interId, x: hit.p.x, y: hit.p.y, source: hit.kind!,
            pathA: p0.id, pathB: p1.id
          });
        }
        const n0: HNode = { id: uid('n'), p: hit.p, isIntersection: true, interId, sourceKind: hit.kind };
        const n1: HNode = { id: uid('n'), p: hit.p, isIntersection: true, interId, sourceKind: hit.kind };
        n0.companionNodeId = n1.id;
        n1.companionNodeId = n0.id;
        splitEdge(g0, he0.id, n0);
        splitEdge(g1, he1.id, n1);
      }
    }
  }

  return { g0, g1, intersections };
}

/** 该出边是否进入另一多边形（出边中点在对方内部） */
function edgeEntersOther(g: PolygonGraph, e: HEdge, other: PolygonGraph): boolean {
  const a = g.nodes.get(e.from)!.p;
  const b = g.nodes.get(e.to)!.p;
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  return pointInPolygon(mid, other.flat);
}

function companionOf(g: PolygonGraph, node: HNode, graphs: [PolygonGraph, PolygonGraph]): { g: PolygonGraph; node: HNode } {
  const other = g === graphs[0] ? graphs[1] : graphs[0];
  return { g: other, node: other.nodes.get(node.companionNodeId!)! };
}

function shouldSwitch(op: BoolOp, poly: 0 | 1, entry: boolean): boolean {
  if (op === 'union') return entry;
  if (op === 'intersection') return !entry;
  // 差集 A−B：A 进入 B 时换边（挖掉重叠段）；B 离开 A 时换边（洞壁反向保留）
  return poly === 0 ? entry : !entry;
}

function traceLoops(graphs: [PolygonGraph, PolygonGraph], op: BoolOp): HNode[][] {
  const loops: HNode[][] = [];

  /**
   * 某节点在指定图上的正向出边。
   * 交点 M 把源边拆成 e1(A→M)、e2(M→B)：从 M 出发的正向边是 e2（参数递增），
   * 反向边是 p1（参数递减）。优先用参数方向判定，pair 关系兜底。
   */
  const forwardOut = (g: PolygonGraph, nodeId: string): HEdge | undefined => {
    const outs = [...g.edges.values()].filter(e => e.from === nodeId);
    if (outs.length === 0) return undefined;
    if (outs.length === 1) return outs[0];
    const increasing = outs.filter(e => e.t1 > e.t0 + 1e-9);
    if (increasing.length === 1) return increasing[0];
    const byPair = outs.find(e => {
      const p = g.edges.get(e.pair);
      return !!p && p.to === nodeId;
    });
    return byPair ?? outs[0];
  };

  const findStart = (): { g: PolygonGraph; edge: HEdge } | null => {
    for (const g of graphs) {
      for (const e of g.edges.values()) {
        if (!g.nodes.get(e.from)!.isIntersection || e.used) continue;
        // 只从交点的正向出边开始，避免同一交点的反向边再起一个重复环
        if (forwardOut(g, e.from)?.id === e.id) return { g, edge: e };
      }
    }
    return null;
  };

  let start = findStart();
  while (start) {
    const loop: HNode[] = [];
    const visitedKeys = new Set<string>(); // g+node，检测真正闭合
    let g = start.g;
    let e = start.edge;
    let guard = 0;
    const startKey = `${start.g === graphs[0] ? 0 : 1}:${g.nodes.get(e.from)!.id}`;
    do {
      const node = g.nodes.get(e.from)!;
      if (loop.length === 0 || dist(loop[loop.length - 1].p, node.p) > 1e-9) loop.push(node);
      e.used = true;
      g.edges.get(e.pair)!.used = true;

      const other = g === graphs[0] ? graphs[1] : graphs[0];
      const entry = edgeEntersOther(g, e, other);
      if (node.isIntersection && shouldSwitch(op, e.poly, entry)) {
        const comp = companionOf(g, node, graphs);
        const ng = comp.g;
        const ne = forwardOut(ng, comp.node.id);
        if (!ne) break;
        g = ng;
        e = ne;
      } else {
        const ne = g.edges.get(e.next);
        if (!ne) break;
        e = ne;
      }
      const key = `${g === graphs[0] ? 0 : 1}:${g.nodes.get(e.from)!.id}`;
      if (key === startKey && loop.length >= 2) break;
      if (visitedKeys.has(key)) break; // 防御：节点级重复即终止
      visitedKeys.add(key);
    } while (++guard < 10000);

    if (loop.length >= 3) loops.push(loop);
    start = findStart();
  }

  // 同一几何环可能从不同交点/图被追踪多次，按节点点集去重
  const seen = new Set<string>();
  return loops.filter(loop => {
    const key = loop.map(n => `${Math.round(n.p.x * 1000)},${Math.round(n.p.y * 1000)}`).sort().join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function noIntersectionCase(p0: PathData, p1: PathData, op: BoolOp): PathData[] {
  const f0 = flattenPath(p0).pts;
  const f1 = flattenPath(p1).pts;
  const aInB = pointInPolygon(f0[0], f1);
  const bInA = pointInPolygon(f1[0], f0);
  const clone = (p: PathData, suffix: string): PathData => ({
    ...p,
    id: uid('path'),
    name: `${p.name}-${suffix}`,
    anchors: p.anchors.map(a => ({ ...a })),
    segs: p.segs.map(s => ({ ...s }))
  });
  if (op === 'union') {
    if (aInB) return [clone(p1, '并')];
    if (bInA) return [clone(p0, '并')];
    return [clone(p0, '并'), clone(p1, '并')];
  }
  if (op === 'intersection') {
    if (aInB) return [clone(p0, '交')];
    if (bInA) return [clone(p1, '交')];
    return [];
  }
  if (bInA || aInB) return [];
  return [clone(p0, '差')];
}


/** 将节点环重建为 PathData；连续同源圆弧半边合并并按子弧圆心角还原 bulge */
function reconstruct(rawLoop: HNode[], graphs: [PolygonGraph, PolygonGraph], name: string, color: string): PathData {
  // 1) 去掉与首点几何重合的闭合点
  let loop = rawLoop.length > 1 && samePoint(rawLoop[0], rawLoop[rawLoop.length - 1])
    ? rawLoop.slice(0, -1)
    : rawLoop;

  // 2) 合并环内同坐标节点（跨图配对交点在结果里应是同一个锚点）
  const canonical: HNode[] = [];
  const map = new Map<string, HNode>();
  for (const n of loop) {
    const key = `${Math.round(n.p.x * 1e6)},${Math.round(n.p.y * 1e6)}`;
    const exist = map.get(key);
    if (!exist) { map.set(key, n); canonical.push(n); }
  }
  loop = canonical;
  const repOf = (n: HNode): HNode => map.get(`${Math.round(n.p.x * 1e6)},${Math.round(n.p.y * 1e6)}`)!;

  // 3) 逐节点对找半边（两图都查），构造边描述；跨图同坐标接缝跳过
  interface EdgeDesc { from: HNode; to: HNode; g: PolygonGraph; edge: HEdge | null }
  const descs: EdgeDesc[] = [];
  for (let i = 0; i < loop.length; i++) {
    const from = loop[i];
    const to = repOf(loop[(i + 1) % loop.length]);
    if (from.id === to.id) continue;
    let found: EdgeDesc | undefined;
    for (const g of graphs) {
      if (!g.nodes.has(from.id)) continue;
      const all = [...g.edges.values()].filter(e => {
        const tn = g.nodes.get(e.to);
        return e.from === from.id && !!tn && samePoint(tn, to);
      });
      const edge = all.find(e => e.t1 > e.t0 + 1e-9) ?? all[0];
      if (edge) { found = { from, to, g, edge }; break; }
    }
    // 跨图接缝：两图都没有连接半边，但几何上相邻，补一条直线描述
    descs.push(found ?? { from, to, g: graphs[0], edge: null });
  }

  const anchors: Anchor[] = loop.map(n => ({ id: uid('a'), x: n.p.x, y: n.p.y }));
  const nodeIndex = new Map(loop.map((n, i) => [n.id, i]));
  const segs: Segment[] = [];

  let k = 0;
  while (k < descs.length) {
    const piece = descs[k];
    const aIdx = nodeIndex.get(piece.from.id)!;

    // 跨图接缝（无半边）：直接直线连接
    if (!piece.edge) {
      const bIdx = nodeIndex.get(piece.to.id)!;
      segs.push({ id: uid('s'), type: 'line', a: anchors[aIdx].id, b: anchors[bIdx].id });
      k++;
      continue;
    }

    const srcSeg = piece.g.path.segs.find(s => s.id === piece.edge!.srcSegId);
    if (srcSeg && srcSeg.type === 'arc') {
      // 合并连续同源弧半边
      let end = k;
      let tStart = piece.edge.t0;
      let tEnd = piece.edge.t1;
      while (end + 1 < descs.length) {
        const next = descs[end + 1];
        if (!next.edge || next.g !== piece.g || next.edge.srcSegId !== srcSeg.id) break;
        tEnd = next.edge.t1;
        end++;
      }
      const [sa, sb] = segEndpoints(piece.g.path, srcSeg);
      const gArc = arcGeom(sa, sb, srcSeg.bulge);
      let bulge = srcSeg.bulge;
      if (gArc) {
        let span = tEnd - tStart;
        if (span < 0) span += 1; // 参数环绕
        bulge = Math.tan((gArc.sweep * span) / 4);
      }
      const endIdx = nodeIndex.get(descs[end].to.id)!;
      segs.push({ id: uid('s'), type: 'arc', a: anchors[aIdx].id, b: anchors[endIdx].id, bulge });
      k = end + 1;
    } else {
      const bIdx = nodeIndex.get(piece.to.id)!;
      segs.push({ id: uid('s'), type: 'line', a: anchors[aIdx].id, b: anchors[bIdx].id });
      k++;
    }
  }

  return { id: uid('path'), name, anchors, segs, color, closed: true };
}

export interface BoolResult {
  paths: PathData[];
  intersections: IntersectionPoint[];
}

/** 端点几何位置相同（交点在两图各有一个节点） */
function samePoint(a: HNode, b: HNode): boolean {
  return dist(a.p, b.p) < 1e-6;
}

/**
 * 合并被跨图切换拆开的开放环：若环 X 的末交点与环 Y 的首交点几何重合，
 * 则拼接 X+Y，直到形成闭合环。差集的 L 形轮廓会被还原为单环。
 */
function mergeLoops(loops: HNode[][]): HNode[][] {
  const chains = loops.map(l => [...l]);
  let merged = true;
  while (merged && chains.length > 1) {
    merged = false;
    for (let i = 0; i < chains.length && !merged; i++) {
      for (let j = 0; j < chains.length; j++) {
        if (i === j) continue;
        const a = chains[i], b = chains[j];
        if (samePoint(a[a.length - 1], b[0])) {
          chains[i] = [...a, ...b.slice(1)];
          chains.splice(j, 1);
          merged = true;
          break;
        }
        // 反向匹配：a 尾 == b 尾，把 b 反转
        if (samePoint(a[a.length - 1], b[b.length - 1])) {
          chains[i] = [...a, ...[...b].reverse().slice(1)];
          chains.splice(j, 1);
          merged = true;
          break;
        }
      }
    }
  }
  // 仅保留首尾闭合（或节点数>=3）的环
  return chains.filter(l => l.length >= 3 && (samePoint(l[0], l[l.length - 1]) || l.length >= 3));
}

/**
 * 对两条闭合路径执行布尔运算。
 * 限制：不处理共线重叠、重合边等退化情形；差集遇到完全包含时返回简化结果。
 */
export function booleanOp(p0: PathData, p1: PathData, op: BoolOp): BoolResult {
  if (p0.anchors.length < 3 || p1.anchors.length < 3) return { paths: [], intersections: [] };
  const label = op === 'union' ? '并集' : op === 'difference' ? '差集' : '交集';
  const { g0, g1, intersections } = buildAndIntersect(p0, p1);

  if (intersections.length === 0) {
    return { paths: noIntersectionCase(p0, p1, op), intersections: [] };
  }
  const rawLoops = traceLoops([g0, g1], op);
  const loops = mergeLoops(rawLoops);
  const color = op === 'union' ? '#22c55e' : op === 'difference' ? '#f59e0b' : '#38bdf8';
  const paths = loops.map((loop, i) => reconstruct(loop, [g0, g1], `${label}-${i + 1}`, color));
  return { paths, intersections };
}

/** 两条路径的全部交点（供高亮/评分用） */
export function allIntersections(p0: PathData, p1: PathData): IntersectionPoint[] {
  const out: IntersectionPoint[] = [];
  for (const s0 of eachSeg(p0)) {
    for (const s1 of eachSeg(p1)) {
      for (const hit of segIntersect(p0, s0, p1, s1)) {
        if (!out.some(q => dist(q, hit.p) < 0.01)) {
          out.push({
            id: uid('ip'), x: hit.p.x, y: hit.p.y, source: hit.kind!,
            pathA: p0.id, pathB: p1.id
          });
        }
      }
    }
  }
  return out;
}
