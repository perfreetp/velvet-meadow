import type { Doc, Part, Contour, Hole, BBox } from './types';
import { GEOM_EPS, bboxesOverlap, dist, unionBBox } from './math';
import { contourBBox, contourPolyline, isClosed } from './contour';
import { contourSelfIntersections } from './intersection';
import { segBBox } from './segments';

export type Severity = 'critical' | 'major' | 'minor';

export interface Finding {
  id: string;
  severity: Severity;
  code: 'self-intersect' | 'hole-overlap' | 'out-of-bounds' | 'open-contour' | 'duplicate' | 'tiny-feature';
  partId: string;
  partName: string;
  message: string;
  /** 问题定位点(画布 mm 坐标,含零件偏移) */
  points: { x: number; y: number }[];
  status: 'open' | 'confirmed' | 'rejected' | 'waived';
}

export interface BatchReport {
  findings: Finding[];
  checkedAt: number;
  drawingCount: number;
  passed: boolean;
}

let findingSeq = 0;
function fId(): string {
  findingSeq++;
  return `f_${Date.now().toString(36)}_${findingSeq}`;
}

function partBBox(p: Part): BBox {
  let b: BBox | null = null;
  for (const c of p.contours) {
    const cb = contourBBox(c);
    b = b ? unionBBox(b, cb) : cb;
  }
  for (const h of p.holes) {
    const hb: BBox = { minX: h.cx - h.r, minY: h.cy - h.r, maxX: h.cx + h.r, maxY: h.cy + h.r };
    b = b ? unionBBox(b, hb) : hb;
  }
  return b ?? { minX: 0, minY: 0, maxX: 0, maxY: 0 };
}

/** 零件在板材坐标系下的包围盒 */
export function partWorldBBox(p: Part): BBox {
  const b = partBBox(p);
  return { minX: b.minX + p.x, minY: b.minY + p.y, maxX: b.maxX + p.x, maxY: b.maxY + p.y };
}

export function isPartOutOfBoard(doc: Doc, p: Part): boolean {
  const b = partWorldBBox(p);
  return b.minX < -GEOM_EPS || b.minY < -GEOM_EPS || b.maxX > doc.board.width + GEOM_EPS || b.maxY > doc.board.height + GEOM_EPS;
}

/** 图形是否超出板幅(返回越界的定位点) */
export function contourOutOfBoardPoints(doc: Doc, p: Part, c: Contour): { x: number; y: number }[] {
  const pts = contourPolyline(c, 0.15).map(q => ({ x: q.x + p.x, y: q.y + p.y }));
  return pts.filter(q => q.x < -GEOM_EPS || q.y < -GEOM_EPS || q.x > doc.board.width + GEOM_EPS || q.y > doc.board.height + GEOM_EPS);
}

export function holeOutOfBoardPoints(doc: Doc, p: Part, h: Hole): { x: number; y: number }[] {
  const cx = h.cx + p.x, cy = h.cy + p.y;
  const corners = [
    { x: cx + h.r, y: cy }, { x: cx - h.r, y: cy }, { x: cx, y: cy + h.r }, { x: cx, y: cy - h.r }
  ];
  return corners.filter(q => q.x < 0 || q.y < 0 || q.x > doc.board.width || q.y > doc.board.height);
}

export function checkDoc(doc: Doc): Finding[] {
  const findings: Finding[] = [];
  const push = (f: Omit<Finding, 'id' | 'status'>) => findings.push({ ...f, id: fId(), status: 'open' });

  for (const p of doc.parts) {
    // 1. 轮廓自交 + 未闭合
    for (const c of p.contours) {
      const self = contourSelfIntersections(c.segs);
      for (const hit of self) {
        push({
          severity: 'critical',
          code: 'self-intersect',
          partId: p.id, partName: p.name,
          message: `轮廓自交:段 ${hit.i + 1} 与段 ${hit.j + 1} 在 (${hit.p.x.toFixed(1)}, ${hit.p.y.toFixed(1)}) 相交`,
          points: [{ x: hit.p.x + p.x, y: hit.p.y + p.y }]
        });
      }
      if (!isClosed(c) && c.segs.length > 1) {
        push({
          severity: 'major',
          code: 'open-contour',
          partId: p.id, partName: p.name,
          message: '轮廓未闭合,激光路径将无法连续切割',
          points: [{ x: c.segs[0].a.x + p.x, y: c.segs[0].a.y + p.y }]
        });
      }
      // 过短图元(小于 0.2mm,激光加工不可靠)
      for (const s of c.segs) {
        const bb = segBBox(s);
        const span = Math.max(bb.maxX - bb.minX, bb.maxY - bb.minY);
        if (span < 0.2) {
          push({
            severity: 'minor',
            code: 'tiny-feature',
            partId: p.id, partName: p.name,
            message: `存在 ${span.toFixed(2)}mm 的微小图元,可能低于激光加工极限`,
            points: [{ x: s.a.x + p.x, y: s.a.y + p.y }]
          });
        }
      }
    }

    // 2. 孔位重叠(相交=critical;相切/间距小于 1mm=major)
    for (let i = 0; i < p.holes.length; i++) {
      for (let j = i + 1; j < p.holes.length; j++) {
        const h1 = p.holes[i], h2 = p.holes[j];
        const d = dist({ x: h1.cx, y: h1.cy }, { x: h2.cx, y: h2.cy });
        const gap = d - (h1.r + h2.r);
        const wp = [{ x: (h1.cx + h2.cx) / 2 + p.x, y: (h1.cy + h2.cy) / 2 + p.y }];
        if (gap < -GEOM_EPS) {
          push({
            severity: 'critical', code: 'hole-overlap', partId: p.id, partName: p.name,
            message: `孔位重叠:两孔侵入 ${(-gap).toFixed(1)}mm`, points: wp
          });
        } else if (gap < 1) {
          push({
            severity: 'major', code: 'hole-overlap', partId: p.id, partName: p.name,
            message: `孔间距仅 ${gap.toFixed(1)}mm,小于建议安全间距 1mm`, points: wp
          });
        }
      }
      // 孔重复(圆心几乎重合)
      for (let j = i + 1; j < p.holes.length; j++) {
        const d = dist({ x: p.holes[i].cx, y: p.holes[i].cy }, { x: p.holes[j].cx, y: p.holes[j].cy });
        if (d < 0.05) {
          push({
            severity: 'minor', code: 'duplicate', partId: p.id, partName: p.name,
            message: '存在圆心重合的重复孔',
            points: [{ x: p.holes[i].cx + p.x, y: p.holes[i].cy + p.y }]
          });
        }
      }
    }

    // 3. 尺寸越界
    if (isPartOutOfBoard(doc, p)) {
      const b = partWorldBBox(p);
      push({
        severity: 'critical', code: 'out-of-bounds', partId: p.id, partName: p.name,
        message: `零件超出板幅:占用范围 [${b.minX.toFixed(0)},${b.minY.toFixed(0)}]–[${b.maxX.toFixed(0)},${b.maxY.toFixed(0)}],板幅 ${doc.board.width}×${doc.board.height}mm`,
        points: [{ x: Math.max(0, b.minX), y: Math.max(0, b.minY) }]
      });
    }
    for (const c of p.contours) {
      const bad = contourOutOfBoardPoints(doc, p, c);
      if (bad.length && !isPartOutOfBoard(doc, p)) {
        push({
          severity: 'major', code: 'out-of-bounds', partId: p.id, partName: p.name,
          message: `${bad.length} 个轮廓顶点超出板幅`, points: bad.slice(0, 5)
        });
      }
    }
    for (const h of p.holes) {
      const bad = holeOutOfBoardPoints(doc, p, h);
      if (bad.length) {
        push({
          severity: 'critical', code: 'out-of-bounds', partId: p.id, partName: p.name,
          message: `孔 (${(h.cx + p.x).toFixed(0)}, ${(h.cy + p.y).toFixed(0)}) r=${h.r}mm 超出板边`,
          points: bad
        });
      }
    }
  }

  // 4. 零件之间包围盒重叠(排料冲突)
  for (let i = 0; i < doc.parts.length; i++) {
    for (let j = i + 1; j < doc.parts.length; j++) {
      if (bboxesOverlap(partWorldBBox(doc.parts[i]), partWorldBBox(doc.parts[j]), 0.5)) {
        push({
          severity: 'major', code: 'out-of-bounds',
          partId: doc.parts[i].id, partName: doc.parts[i].name,
          message: `零件「${doc.parts[i].name}」与「${doc.parts[j].name}」排料区域重叠`,
          points: [{ x: doc.parts[j].x, y: doc.parts[j].y }]
        });
      }
    }
  }
  return findings;
}

export const SEVERITY_META: Record<Severity, { label: string; color: string; rank: number }> = {
  critical: { label: '严重', color: '#e5484d', rank: 0 },
  major: { label: '主要', color: '#f5a524', rank: 1 },
  minor: { label: '提示', color: '#3b82f6', rank: 2 }
};

/** 整批是否达标:不存在未驳回/未豁免的问题(critical 不允许豁免) */
export function batchPassable(report: BatchReport): boolean {
  return !report.findings.some(f => f.status === 'open' || f.status === 'confirmed' || (f.severity === 'critical' && f.status === 'waived'));
}
