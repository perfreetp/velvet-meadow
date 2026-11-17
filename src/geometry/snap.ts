import type { Doc, Part, Vec } from './types';
import { dist } from './math';
import { contourAnchors } from './contour';
import { SNAP_EPS } from './math';

export interface SnapCandidate {
  p: Vec; // 板材世界坐标(mm)
  kind: 'edge' | 'hole-center' | 'anchor' | 'corner';
  partId?: string;
}

export interface GuideLine {
  axis: 'h' | 'v';
  value: number; // 世界坐标
  from: Vec;
  to: Vec;
  kind: SnapCandidate['kind'];
}

export interface SnapResult {
  snapped: Vec | null;
  guides: GuideLine[];
  target: SnapCandidate | null;
}

/** 收集整张板材上的吸附候选点 */
export function collectSnapCandidates(doc: Doc, excludePartId?: string): SnapCandidate[] {
  const out: SnapCandidate[] = [];
  const { width: W, height: H } = doc.board;
  // 板边
  for (const x of [0, W]) for (const y of [0, H]) {
    out.push({ p: { x, y }, kind: 'corner' });
  }
  for (const part of doc.parts) {
    if (part.id === excludePartId) continue;
    for (const c of part.contours) {
      for (const a of contourAnchors(c)) {
        out.push({ p: { x: a.x + part.x, y: a.y + part.y }, kind: 'anchor', partId: part.id });
      }
    }
    for (const h of part.holes) {
      out.push({ p: { x: h.cx + part.x, y: h.cy + part.y }, kind: 'hole-center', partId: part.id });
    }
  }
  // 当前编辑零件自身的孔中心与锚点也参与(端点靠近孔中心吸附)
  const active = doc.parts.find(p => p.id === doc.activePartId);
  if (active) {
    for (const h of active.holes) {
      out.push({ p: { x: h.cx + active.x, y: h.cy + active.y }, kind: 'hole-center', partId: active.id });
    }
    for (const c of active.contours) {
      for (const a of contourAnchors(c)) {
        out.push({ p: { x: a.x + active.x, y: a.y + active.y }, kind: 'anchor', partId: active.id });
      }
    }
  }
  return out;
}

/** 板边候选(线段式吸附) */
export function nearestBoardEdge(doc: Doc, p: Vec, tolMm: number): { axis: 'h' | 'v'; value: number; d: number } | null {
  const edges = [
    { axis: 'v' as const, value: 0, d: Math.abs(p.x) },
    { axis: 'v' as const, value: doc.board.width, d: Math.abs(p.x - doc.board.width) },
    { axis: 'h' as const, value: 0, d: Math.abs(p.y) },
    { axis: 'h' as const, value: doc.board.height, d: Math.abs(p.y - doc.board.height) }
  ];
  edges.sort((a, b) => a.d - b.d);
  return edges[0].d <= tolMm ? edges[0] : null;
}

/**
 * 在屏幕容差内寻找吸附点。
 * @param screenPos 鼠标的世界坐标(mm)
 * @param pxPerMm 缩放,用于把屏幕像素容差换算成 mm
 * @param viewW/viewH 视口尺寸,用于生成参考线长度
 */
export function findSnap(
  doc: Doc,
  screenPos: Vec,
  pxPerMm: number,
  viewW: number,
  viewH: number,
  excludePartId?: string
): SnapResult {
  const tolMm = SNAP_EPS / pxPerMm;
  const candidates = collectSnapCandidates(doc, excludePartId);
  let best: SnapCandidate | null = null;
  let bestD = tolMm;
  for (const c of candidates) {
    const d = dist(c.p, screenPos);
    if (d < bestD) { bestD = d; best = c; }
  }
  const edge = nearestBoardEdge(doc, screenPos, tolMm);
  if (edge && edge.d < bestD) {
    const snapped = { ...screenPos };
    if (edge.axis === 'v') snapped.x = edge.value; else snapped.y = edge.value;
    return {
      snapped,
      target: { p: snapped, kind: 'edge' },
      guides: [guideFor(edge.axis, edge.value, snapped, viewW, viewH, 'edge')]
    };
  }
  if (!best) return { snapped: null, guides: [], target: null };
  const guides: GuideLine[] = [];
  // 吸附点同时给出水平、垂直两条参考线
  guides.push(guideFor('v', best.p.x, best.p, viewW, viewH, best.kind));
  guides.push(guideFor('h', best.p.y, best.p, viewW, viewH, best.kind));
  return { snapped: { ...best.p }, guides, target: best };
}

function guideFor(axis: 'h' | 'v', value: number, origin: Vec, viewW: number, viewH: number, kind: SnapCandidate['kind']): GuideLine {
  const span = 60;
  if (axis === 'v') {
    return {
      axis, value, kind,
      from: { x: value, y: Math.max(0, origin.y - span) },
      to: { x: value, y: Math.min(viewH, origin.y + span) }
    };
  }
  return {
    axis, value, kind,
    from: { x: Math.max(0, origin.x - span), y: value },
    to: { x: Math.min(viewW, origin.x + span), y: value }
  };
}
