import type { Anchor, PathData, Segment, Vec2 } from './types';
import { arcGeom, dist, lineLine, pointSegDist, tessellateArc, type ArcGeom } from './math2d';

export function getAnchor(path: PathData, id: string): Anchor | undefined {
  return path.anchors.find(a => a.id === id);
}

export function segEndpoints(path: PathData, seg: Segment): [Anchor, Anchor] {
  const a = getAnchor(path, seg.a)!;
  const b = getAnchor(path, seg.b)!;
  return [a, b];
}

/** 顺序遍历路径的边（开放路径不含最后一条回到起点的虚拟边） */
export function eachSeg(path: PathData): Segment[] {
  const n = path.anchors.length;
  if (n < 2) return [];
  if (path.closed) return path.segs.slice(0, n);
  return path.segs.slice(0, n - 1);
}

export function segArcGeom(path: PathData, seg: Segment): ArcGeom | null {
  if (seg.type !== 'arc') return null;
  const [a, b] = segEndpoints(path, seg);
  return arcGeom(a, b, seg.bulge);
}

export interface FlattenedSeg {
  seg: Segment;
  /** 该边展开后的折线点（含起点不含终点，最后由调用方补终点） */
  pts: Vec2[];
}

/** 将路径展开为折线（圆弧按容差细分） */
export function flattenPath(path: PathData, tolerance = 0.05): { pts: Vec2[]; pieces: FlattenedSeg[] } {
  const pts: Vec2[] = [];
  const pieces: FlattenedSeg[] = [];
  const segs = eachSeg(path);
  for (const seg of segs) {
    const [a, b] = segEndpoints(path, seg);
    if (seg.type === 'line') {
      pts.push({ x: a.x, y: a.y });
      pieces.push({ seg, pts: [{ x: a.x, y: a.y }] });
    } else {
      const g = arcGeom(a, b, seg.bulge);
      if (!g) {
        pts.push({ x: a.x, y: a.y });
        pieces.push({ seg, pts: [{ x: a.x, y: a.y }] });
        continue;
      }
      const arcPts = tessellateArc(g, tolerance);
      arcPts.pop(); // 去掉终点，避免重复
      pts.push(...arcPts);
      pieces.push({ seg, pts: arcPts });
    }
  }
  if (segs.length) {
    const last = segs[segs.length - 1];
    const [, b] = segEndpoints(path, last);
    pts.push({ x: b.x, y: b.y });
  }
  return { pts, pieces };
}

/** 路径是否闭合且边数完整 */
export function isPathClosed(path: PathData): boolean {
  return path.closed && path.anchors.length >= 3 && path.segs.length === path.anchors.length;
}

/** 轮廓闭合度：0~1，综合首末距离与边完整性 */
export function closureRatio(path: PathData): number {
  if (path.anchors.length < 2) return 0;
  let score = 0;
  const first = path.anchors[0];
  const last = path.anchors[path.anchors.length - 1];
  const gap = dist(first, last);
  // 以路径整体尺寸做归一化
  const xs = path.anchors.map(a => a.x), ys = path.anchors.map(a => a.y);
  const span = Math.max(1, Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)));
  const endScore = path.closed ? 1 : Math.max(0, 1 - gap / (span * 0.3));
  const edgeScore = Math.min(1, path.segs.length / Math.max(1, path.anchors.length - (path.closed ? 0 : 1)));
  score = endScore * 0.7 + edgeScore * 0.3;
  return Math.max(0, Math.min(1, score));
}

export interface AnchorHit {
  pathId: string;
  anchorId: string;
  point: Vec2;
  d: number;
}

/** 在半径内拾取锚点 */
export function hitAnchor(
  paths: PathData[],
  p: Vec2,
  radius: number,
  filter?: (path: PathData) => boolean
): AnchorHit | null {
  let best: AnchorHit | null = null;
  for (const path of paths) {
    if (filter && !filter(path)) continue;
    for (const a of path.anchors) {
      const d = dist(a, p);
      if (d <= radius && (!best || d < best.d)) best = { pathId: path.id, anchorId: a.id, point: a, d };
    }
  }
  return best;
}

export interface EdgeHit {
  pathId: string;
  seg: Segment;
  d: number;
  q: Vec2;
}

/** 拾取边（圆弧按细分折线近似） */
export function hitEdge(
  paths: PathData[],
  p: Vec2,
  radius: number,
  filter?: (path: PathData) => boolean
): EdgeHit | null {
  let best: EdgeHit | null = null;
  for (const path of paths) {
    if (filter && !filter(path)) continue;
    for (const seg of eachSeg(path)) {
      const [a, b] = segEndpoints(path, seg);
      if (seg.type === 'line') {
        const r = pointSegDist(p, a, b);
        if (r.d <= radius && (!best || r.d < best.d)) best = { pathId: path.id, seg, d: r.d, q: r.q };
      } else {
        const g = arcGeom(a, b, seg.bulge);
        if (!g) continue;
        const pts = tessellateArc(g, 0.03);
        for (let i = 0; i < pts.length - 1; i++) {
          const r = pointSegDist(p, pts[i], pts[i + 1]);
          if (r.d <= radius && (!best || r.d < best.d)) best = { pathId: path.id, seg, d: r.d, q: r.q };
        }
      }
    }
  }
  return best;
}

/** 自交检测：返回自交点数量（用于诊断提示） */
export function countSelfIntersections(path: PathData): number {
  const { pts } = flattenPath(path, 0.05);
  if (pts.length < 4) return 0;
  let count = 0;
  const n = pts.length - (path.closed ? 0 : 1);
  const total = path.closed ? pts.length : pts.length - 1;
  for (let i = 0; i < total; i++) {
    for (let j = i + 1; j < total; j++) {
      if (Math.abs(i - j) <= 1 || (path.closed && (i === 0 && j === total - 1))) continue;
      const a = pts[i % pts.length], b = pts[(i + 1) % pts.length];
      const c = pts[j % pts.length], d = pts[(j + 1) % pts.length];
      if (lineLine(a, b, c, d)) count++;
    }
  }
  void n;
  return count;
}

/** 路径包围盒 */
export function pathBounds(path: PathData): { minX: number; minY: number; maxX: number; maxY: number } {
  const xs: number[] = [], ys: number[] = [];
  for (const a of path.anchors) { xs.push(a.x); ys.push(a.y); }
  for (const seg of eachSeg(path)) {
    if (seg.type === 'arc') {
      const g = segArcGeom(path, seg);
      if (g) {
        // 简化：用弧顶与端点包围（足够显示用途）
        xs.push(g.center.x, g.center.x + g.radius, g.center.x - g.radius);
        ys.push(g.center.y, g.center.y + g.radius, g.center.y - g.radius);
      }
    }
  }
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}
