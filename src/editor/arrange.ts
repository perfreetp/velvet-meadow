import type { Doc, Part, Hole, BBox } from '../geometry/types';
import { bboxesOverlap, clamp } from '../geometry/math';
import { partWorldBBox } from '../geometry/checks';

const GAP = 2; // 相邻板件最小间距 mm

/**
 * 挪动板件时让相邻件让位:
 * 沿拖动方向把重叠的相邻件推开,并级联传递(最多 8 轮防止环依赖)。
 * 原位直接修改各 part 的 x/y。
 */
export function pushNeighbors(doc: Doc, movedId: string, dxWorld: number, dyWorld: number): void {
  const axis: 'x' | 'y' = Math.abs(dxWorld) >= Math.abs(dyWorld) ? 'x' : 'y';
  const delta = axis === 'x' ? dxWorld : dyWorld;
  if (Math.abs(delta) < 1e-6) return;
  const moved = doc.parts.find(p => p.id === movedId);
  if (!moved) return;

  const movedSet = new Set<string>([movedId]);
  for (let round = 0; round < 8; round++) {
    let any = false;
    for (const driver of [...doc.parts].filter(p => movedSet.has(p.id))) {
      const db = partWorldBBox(driver);
      for (const other of doc.parts) {
        if (movedSet.has(other.id)) continue;
        const ob = partWorldBBox(other);
        if (!bboxesOverlap(db, ob, GAP)) continue;
        if (axis === 'x') {
          const localMinX = ob.minX - other.x; // other 自身包围盒的本地 minX
          const localMaxX = ob.maxX - other.x;
          if (delta > 0) other.x = db.maxX + GAP - localMinX;
          else other.x = db.minX - GAP - localMaxX;
        } else {
          const localMinY = ob.minY - other.y;
          const localMaxY = ob.maxY - other.y;
          if (delta > 0) other.y = db.maxY + GAP - localMinY;
          else other.y = db.minY - GAP - localMaxY;
        }
        clampToBoard(doc, other);
        movedSet.add(other.id);
        any = true;
      }
    }
    if (!any) break;
  }
}

function clampToBoard(doc: Doc, p: Part): void {
  // partWorldBBox 返回世界坐标,localBBox = worldBBox - (p.x, p.y)
  const wb = partWorldBBox(p);
  const localMinX = wb.minX - p.x;
  const localMinY = wb.minY - p.y;
  const localMaxX = wb.maxX - p.x;
  const localMaxY = wb.maxY - p.y;
  p.x = clamp(p.x, -localMinX, doc.board.width - localMaxX);
  p.y = clamp(p.y, -localMinY, doc.board.height - localMaxY);
}

/** 阵列复制:保持孔距的网格阵列 */
export interface ArrayParams {
  cols: number;
  rows: number;
  dx: number; // 列间距(孔中心距),mm
  dy: number; // 行间距,mm
}

export function duplicateHolesArray(part: Part, holeIds: string[], params: ArrayParams): Hole[] {
  const selected = part.holes.filter(h => holeIds.includes(h.id));
  if (!selected.length) return [];
  const created: Hole[] = [];
  for (let r = 0; r < params.rows; r++) {
    for (let c = 0; c < params.cols; c++) {
      if (r === 0 && c === 0) continue; // 原位已是原件
      for (const h of selected) {
        created.push({
          id: `h_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}_${r}_${c}`,
          cx: h.cx + c * params.dx,
          cy: h.cy + r * params.dy,
          r: h.r
        });
      }
    }
  }
  return created;
}

/** 计算当前孔选集合的包围盒(用于阵列间距默认值) */
export function holesBBox(holes: Hole[]): BBox | null {
  if (!holes.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const h of holes) {
    minX = Math.min(minX, h.cx - h.r);
    minY = Math.min(minY, h.cy - h.r);
    maxX = Math.max(maxX, h.cx + h.r);
    maxY = Math.max(maxY, h.cy + h.r);
  }
  return { minX, minY, maxX, maxY };
}
