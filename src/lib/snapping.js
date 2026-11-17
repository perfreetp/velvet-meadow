// 吸附:水平/垂直/45° 角度吸附 + 对象边距/中心对齐吸附 + 参考线生成
import { shapeBounds } from './geometry';
import { round2 } from './constants';

export const SNAP_THRESHOLD = 6; // 屏幕/画布像素阈值

// 钢笔绘制时,相对上一锚点做 H/V/45° 角度吸附
export function snapAngle(x, y, ox, oy) {
  const dx = x - ox;
  const dy = y - oy;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-6) return { x, y, angle: null };
  const angle = Math.atan2(dy, dx);
  const step = Math.PI / 4; // 45°
  const snapped = Math.round(angle / step) * step;
  const diff = Math.abs(((angle - snapped + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  if (diff < 0.12) {
    return { x: round2(ox + Math.cos(snapped) * dist), y: round2(oy + Math.sin(snapped) * dist), angle: (snapped * 180) / Math.PI };
  }
  return { x, y, angle: (angle * 180) / Math.PI };
}

// 移动对象时,以选中包围盒对齐其他对象的边/中线;返回吸附增量与参考线
export function snapBounds(movingBounds, otherShapes, movingIds) {
  const vKeys = ['minX', 'maxX', 'cx'];
  const hKeys = ['minY', 'maxY', 'cy'];
  let bestV = null;
  let bestH = null;

  for (const shape of otherShapes) {
    if (movingIds.has(shape.id) || shape.visible === false || shape.closed === false) continue;
    const b = shapeBounds(shape);
    for (const mk of vKeys) {
      for (const ok of vKeys) {
        const delta = b[ok] - movingBounds[mk];
        if (Math.abs(delta) <= SNAP_THRESHOLD && (!bestV || Math.abs(delta) < Math.abs(bestV.delta))) {
          bestV = { delta, pos: b[ok] };
        }
      }
    }
    for (const mk of hKeys) {
      for (const ok of hKeys) {
        const delta = b[ok] - movingBounds[mk];
        if (Math.abs(delta) <= SNAP_THRESHOLD && (!bestH || Math.abs(delta) < Math.abs(bestH.delta))) {
          bestH = { delta, pos: b[ok] };
        }
      }
    }
  }

  // 横纵分别吸附,可同时生效
  const guides = [];
  let dx = 0, dy = 0;
  if (bestV) { dx = bestV.delta; guides.push({ orient: 'v', pos: bestV.pos, span: movingSpan(movingBounds, 'v') }); }
  if (bestH) { dy = bestH.delta; guides.push({ orient: 'h', pos: bestH.pos, span: movingSpan(movingBounds, 'h') }); }
  return { dx, dy, guides };
}

function movingSpan(b, orient) {
  return orient === 'v' ? { from: b.minY, to: b.maxY } : { from: b.minX, to: b.maxX };
}

// 节点拖动时吸附到其他对象的边/中心延长线
export function snapPoint(x, y, otherShapes, movingIds) {
  let best = null;
  for (const shape of otherShapes) {
    if (movingIds?.has(shape.id) || shape.visible === false) continue;
    const b = shapeBounds(shape);
    for (const [pos, orient] of [[b.minX, 'v'], [b.maxX, 'v'], [b.cx, 'v'], [b.minY, 'h'], [b.maxY, 'h'], [b.cy, 'h']]) {
      const delta = pos - (orient === 'v' ? x : y);
      if (Math.abs(delta) <= SNAP_THRESHOLD && (!best || Math.abs(delta) < Math.abs(best.delta))) {
        best = { delta, orient, pos };
      }
    }
  }
  if (!best) return { x, y, guides: [] };
  return best.orient === 'v'
    ? { x: round2(x + best.delta), y, guides: [{ orient: 'v', pos: best.pos }] }
    : { x, y: round2(y + best.delta), guides: [{ orient: 'h', pos: best.pos }] };
}
