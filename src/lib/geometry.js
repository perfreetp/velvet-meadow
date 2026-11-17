// 几何核心:自有路径模型 <-> Paper.js 无头桥接,布尔运算,节点编辑,命中测试
// paper-core(无 acorn);用离屏 canvas 激活独立 PaperScope,保证 Path 原型方法完整
import paperNS from 'paper/dist/paper-core.js';
const paper = paperNS?.default ? paperNS.default : paperNS;
import { uid, round2, SHAPE_TYPES } from './constants';

let paperReady = false;
function ensurePaper() {
  if (paperReady) return;
  const canvas = (typeof document !== 'undefined' && document.createElement)
    ? document.createElement('canvas')
    : { width: 16, height: 16 };
  paper.setup(canvas);
  paperReady = true;
}

export function newPoint(x, y, seg = 'L') {
  return { x: round2(x), y: round2(y), seg, in: null, out: null };
}

// 平滑曲线控制点(转曲线时按相邻节点切线估算)
export function smoothHandles(points, idx) {
  const n = points.length;
  const prev = points[(idx - 1 + n) % n];
  const cur = points[idx];
  const next = points[(idx + 1) % n];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const len = Math.hypot(dx, dy) || 1;
  const tx = dx / len;
  const ty = dy / len;
  const dPrev = Math.hypot(cur.x - prev.x, cur.y - prev.y);
  const dNext = Math.hypot(next.x - cur.x, next.y - cur.y);
  cur.in = { x: round2(cur.x - tx * dPrev / 3), y: round2(cur.y - ty * dPrev / 3) };
  cur.out = { x: round2(cur.x + tx * dNext / 3), y: round2(cur.y + ty * dNext / 3) };
}

// 直线段 -> 曲线段
export function convertToCurve(points, idx) {
  const n = points.length;
  if (n < 3) return;
  const cur = points[idx];
  cur.seg = 'C';
  smoothHandles(points, idx);
  const prev = points[(idx - 1 + n) % n];
  if (prev.seg === 'C') smoothHandles(points, (idx - 1 + n) % n);
}

// 曲线段 -> 直线段(清除本段出控制点与下一点入控制点)
export function convertToLine(points, idx) {
  const n = points.length;
  const cur = points[idx];
  const next = points[(idx + 1) % n];
  cur.seg = 'L';
  cur.out = null;
  next.in = null;
}

export function shapeBounds(shape) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of shape.points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  // 曲线控制点可能超出节点包围盒
  for (const p of shape.points) {
    for (const h of [p.in, p.out]) {
      if (!h) continue;
      minX = Math.min(minX, h.x);
      minY = Math.min(minY, h.y);
      maxX = Math.max(maxX, h.x);
      maxY = Math.max(maxY, h.y);
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
}

export function shapeToD(shape) {
  const pts = shape.points;
  if (pts.length < 2) return '';
  let d = `M ${round2(pts[0].x)} ${round2(pts[0].y)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (a.seg === 'C' && a.out && b.in) {
      d += ` C ${round2(a.out.x)} ${round2(a.out.y)}, ${round2(b.in.x)} ${round2(b.in.y)}, ${round2(b.x)} ${round2(b.y)}`;
    } else {
      d += ` L ${round2(b.x)} ${round2(b.y)}`;
    }
  }
  if (shape.closed !== false) d += ' Z';
  return d;
}

// ---- Paper 桥接 ----
export function shapeToPaper(shape) {
  ensurePaper();
  const p = new paper.Path();
  const pts = shape.points;
  p.moveTo(pts[0].x, pts[0].y);
  const last = shape.closed === false ? pts.length - 1 : pts.length;
  for (let i = 0; i < last; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (a.seg === 'C' && a.out && b.in) {
      p.cubicCurveTo(new paper.Point(a.out.x, a.out.y), new paper.Point(b.in.x, b.in.y), new paper.Point(b.x, b.y));
    } else {
      p.lineTo(b.x, b.y);
    }
  }
  if (shape.closed !== false) p.closePath();
  p.fillColor = new paper.Color(shape.fill || '#88a');
  return p;
}

function paperPathToPoints(path) {
  const segs = path.segments;
  const pts = segs.map((s) => ({
    x: round2(s.point.x),
    y: round2(s.point.y),
    seg: 'L',
    in: null,
    out: null
  }));
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const curve = path.curves[i];
    if (!curve) continue;
    if (curve.hasHandles && curve.hasHandles()) pts[i].seg = 'C';
    if (s.handleIn && (Math.abs(s.handleIn.x) > 1e-6 || Math.abs(s.handleIn.y) > 1e-6)) {
      pts[i].in = { x: round2(s.point.x + s.handleIn.x), y: round2(s.point.y + s.handleIn.y) };
    }
    if (s.handleOut && (Math.abs(s.handleOut.x) > 1e-6 || Math.abs(s.handleOut.y) > 1e-6)) {
      pts[i].out = { x: round2(s.point.x + s.handleOut.x), y: round2(s.point.y + s.handleOut.y) };
    }
  }
  return pts;
}

function collectResultPaths(result) {
  if (!result) return [];
  if (result.children) return result.children.filter((c) => c.segments && c.segments.length >= 3);
  return result.segments && result.segments.length >= 3 ? [result] : [];
}

// 布尔运算:union | subtract | intersect | xor,返回多组可编辑节点
export function booleanOp(shapes, op) {
  ensurePaper();
  if (shapes.length < 2) return shapes.map((s) => s.points.map((p) => ({ ...p, in: p.in ? { ...p.in } : null, out: p.out ? { ...p.out } : null })));
  const papers = shapes.map(shapeToPaper);
  let result;
  const a = papers[0];
  // paper 的 unite/subtract/... 只接受单个 path,多操作数包成 CompoundPath
  const rest = papers.length === 2
    ? papers[1]
    : new paper.CompoundPath({ children: papers.slice(1), insert: false });
  if (op === 'union') {
    result = a.unite(rest);
  } else if (op === 'subtract') {
    result = a.subtract(rest);
  } else if (op === 'intersect') {
    result = a.intersect(rest);
  } else if (op === 'xor') {
    result = a.exclude(rest);
  } else {
    throw new Error(`未知布尔运算: ${op}`);
  }
  const out = collectResultPaths(result).map(paperPathToPoints);
  papers.forEach((p) => p.remove());
  if (rest !== papers[1] && rest.remove) rest.remove();
  if (result && result.remove) result.remove();
  return out.length ? out : [];
}

// 重叠叶片去重叠边:对选中闭合路径做并集,内部重合边被消除,结果仍保留可编辑节点
export function removeOverlapEdges(shapes) {
  return booleanOp(shapes, 'union');
}

// 命中测试
export function hitShape(shape, x, y) {
  if (shape.closed === false || shape.points.length < 3) return false;
  ensurePaper();
  const p = shapeToPaper(shape);
  const ok = p.contains(new paper.Point(x, y));
  p.remove();
  return ok;
}

// 就近曲线段拾取(节点工具:点线段插节点)
export function nearestSegment(shape, x, y) {
  ensurePaper();
  const p = shapeToPaper(shape);
  const loc = p.getNearestLocation(new paper.Point(x, y));
  if (!loc || loc.curve == null) { p.remove(); return null; }
  const idx = p.curves.indexOf(loc.curve);
  const dist = loc.point.getDistance(new paper.Point(x, y));
  p.remove();
  return { segIdx: idx, distance: dist, point: { x: loc.point.x, y: loc.point.y } };
}

// 在第 segIdx 段上插入节点(默认中点位置),返回新 points
export function insertNode(shape, segIdx, t = 0.5) {
  ensurePaper();
  const p = shapeToPaper(shape);
  const curve = p.curves[segIdx];
  if (!curve) return null;
  const offset = curve.length * t;
  curve.divide(curve.getTimeAt(offset));
  const pts = paperPathToPoints(p);
  p.remove();
  return pts;
}

// 删除节点
export function deleteNode(shape, idx) {
  if (shape.points.length <= 3) return null;
  const pts = shape.points.map((p) => ({ ...p, in: p.in ? { ...p.in } : null, out: p.out ? { ...p.out } : null }));
  const n = pts.length;
  const prev = pts[(idx - 1 + n) % n];
  prev.seg = 'L';
  prev.out = null;
  pts[(idx + 1) % n].in = null;
  pts.splice(idx, 1);
  return pts;
}

// 采样为多边形(供 Babylon 拉伸 / 面积估算)
export function samplePolygon(shape, step = 2) {
  ensurePaper();
  const p = shapeToPaper(shape);
  const len = p.length;
  const count = Math.max(24, Math.min(400, Math.floor(len / step)));
  const out = [];
  for (let i = 0; i < count; i++) {
    const pt = p.getPointAt((len * i) / count);
    out.push({ x: pt.x, y: pt.y });
  }
  p.remove();
  return out;
}

export function shapeArea(shape) {
  ensurePaper();
  const p = shapeToPaper(shape);
  const a = Math.abs(p.area);
  p.remove();
  return a;
}

// 图元工厂
export function createShape(partial) {
  return {
    id: uid('shp'),
    kind: 'shape',
    type: SHAPE_TYPES.CUSTOM,
    name: partial.name || '未命名图元',
    materialCode: partial.materialCode || '',
    closed: true,
    points: partial.points || [],
    fill: partial.fill || '#7fbf8f',
    stroke: partial.stroke || '#2f6b46',
    strokeWidth: partial.strokeWidth ?? 0.4,
    locked: false,
    visible: true,
    parentId: partial.parentId ?? null,
    ...partial
  };
}

export function makeRectShape(cx, cy, w, h, fill = '#e8a7b8') {
  const x = cx - w / 2, y = cy - h / 2;
  return createShape({
    type: SHAPE_TYPES.CUSTOM,
    name: '矩形图元',
    points: [newPoint(x, y), newPoint(x + w, y), newPoint(x + w, y + h), newPoint(x, y + h)],
    fill
  });
}

export function makeEllipseShape(cx, cy, rx, ry, fill = '#f2c1d0') {
  const k = 0.5523;
  const pts = [
    newPoint(cx, cy - ry, 'C'),
    newPoint(cx + rx, cy, 'C'),
    newPoint(cx, cy + ry, 'C'),
    newPoint(cx - rx, cy, 'C')
  ];
  pts[0].out = { x: cx + rx * k, y: cy - ry };
  pts[1].in = { x: cx + rx, y: cy - ry * k };
  pts[1].out = { x: cx + rx, y: cy + ry * k };
  pts[2].in = { x: cx + rx * k, y: cy + ry };
  pts[2].out = { x: cx - rx * k, y: cy + ry };
  pts[3].in = { x: cx - rx, y: cy + ry * k };
  pts[3].out = { x: cx - rx, y: cy - ry * k };
  pts[0].in = { x: cx - rx * k, y: cy - ry };
  return createShape({ type: SHAPE_TYPES.CUSTOM, name: '椭圆图元', points: pts, fill });
}

// 预置叶片(上下两条贝塞尔闭合)
export function makeLeafShape(cx, cy, len = 60, wid = 26, fill = '#6fae7d') {
  const top = newPoint(cx, cy - len / 2, 'C');
  const right = newPoint(cx + wid / 2, cy, 'C');
  const bot = newPoint(cx, cy + len / 2, 'C');
  const left = newPoint(cx - wid / 2, cy, 'C');
  top.out = { x: cx + wid * 0.7, y: cy - len * 0.28 };
  right.in = { x: cx + wid * 0.55, y: cy - len * 0.22 };
  right.out = { x: cx + wid * 0.55, y: cy + len * 0.22 };
  bot.in = { x: cx + wid * 0.7, y: cy + len * 0.28 };
  bot.out = { x: cx - wid * 0.7, y: cy + len * 0.28 };
  left.in = { x: cx - wid * 0.55, y: cy + len * 0.22 };
  left.out = { x: cx - wid * 0.55, y: cy - len * 0.22 };
  top.in = { x: cx - wid * 0.7, y: cy - len * 0.28 };
  return createShape({ type: SHAPE_TYPES.LEAF, name: '叶片', materialCode: 'LF-001', points: [top, right, bot, left], fill });
}

// 预置花瓣
export function makePetalShape(cx, cy, len = 54, wid = 34, fill = '#ef9fb6') {
  const base = newPoint(cx, cy + len / 2, 'C');
  const left = newPoint(cx - wid / 2, cy + len * 0.05, 'C');
  const topL = newPoint(cx - wid * 0.28, cy - len * 0.32, 'C');
  const top = newPoint(cx, cy - len / 2, 'C');
  const topR = newPoint(cx + wid * 0.28, cy - len * 0.32, 'C');
  const right = newPoint(cx + wid / 2, cy + len * 0.05, 'C');
  const chain = [base, left, topL, top, topR, right];
  for (let i = 0; i < chain.length; i++) {
    const cur = chain[i];
    const nxt = chain[(i + 1) % chain.length];
    cur.out = { x: cur.x + (nxt.x - cur.x) * 0.45, y: cur.y + (nxt.y - cur.y) * 0.45 };
    nxt.in = { x: nxt.x + (cur.x - nxt.x) * 0.45, y: nxt.y + (cur.y - nxt.y) * 0.45 };
  }
  return createShape({ type: SHAPE_TYPES.PETAL, name: '花瓣', materialCode: 'PT-001', points: chain, fill });
}
