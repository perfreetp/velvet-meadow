import assert from 'node:assert/strict';
import { uid } from '../src/geometry/types';
import type { Contour, Segment, Vec, Doc, Part } from '../src/geometry/types';
import { pointAt, splitSeg, arcFromPoints, smoothPointsToCubics, flatten } from '../src/geometry/segments';
import { makeContour, contourAnchors, insertAnchor, deleteAnchor, contourPolyline, isClosed } from '../src/geometry/contour';
import { segIntersections, contourSelfIntersections } from '../src/geometry/intersection';
import { booleanOp, unionAll, contourArea, contoursInteract } from '../src/geometry/boolean';
import { circleContour, contourToPathD, parseSVGPaths, exportDocSVG } from '../src/geometry/svg';
import { checkDoc } from '../src/geometry/checks';
import { findSnap } from '../src/geometry/snap';
import { History } from '../src/editor/history';
import { createDoc } from '../src/editor/factory';
import { pushNeighbors, duplicateHolesArray } from '../src/editor/arrange';

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

const P = (x: number, y: number): Vec => ({ x, y });
const line = (a: Vec, b: Vec): Segment => ({ id: uid('ln'), type: 'line', a, b });

/** 矩形轮廓(直线) */
function rectContour(x: number, y: number, w: number, h: number): Contour {
  return makeContour([
    line(P(x, y), P(x + w, y)),
    line(P(x + w, y), P(x + w, y + h)),
    line(P(x + w, y + h), P(x, y + h)),
    line(P(x, y + h), P(x, y))
  ], true);
}

/** 圆弧中点:圆心 + 两端半径方向之和归一化后乘 r */
function arcMidpoint(a: Vec, b: Vec, c: Vec): Vec {
  const ra = P(a.x - c.x, a.y - c.y);
  const rb = P(b.x - c.x, b.y - c.y);
  const r = Math.hypot(ra.x, ra.y);
  const sx = ra.x + rb.x, sy = ra.y + rb.y;
  const l = Math.hypot(sx, sy) || 1;
  return P(c.x + (sx / l) * r, c.y + (sy / l) * r);
}

/** 圆角矩形:四条直线边 + 四个 90° 圆弧交替 */
function roundedRectContour(x: number, y: number, w: number, h: number, r: number): Contour {
  const corners: { a: Vec; c: Vec; b: Vec }[] = [
    { a: P(x + w - r, y), c: P(x + w - r, y + r), b: P(x + w, y + r) },          // 右上
    { a: P(x + w, y + h - r), c: P(x + w - r, y + h - r), b: P(x + w - r, y + h) }, // 右下
    { a: P(x + r, y + h), c: P(x + r, y + h - r), b: P(x, y + h - r) },          // 左下
    { a: P(x, y + r), c: P(x + r, y + r), b: P(x + r, y) }                       // 左上
  ];
  const edges: [Vec, Vec][] = [
    [P(x + r, y), P(x + w - r, y)],
    [P(x + w, y + r), P(x + w, y + h - r)],
    [P(x + w - r, y + h), P(x + r, y + h)],
    [P(x, y + h - r), P(x, y + r)]
  ];
  const segs: Segment[] = [];
  for (let i = 0; i < 4; i++) {
    segs.push(line(edges[i][0], edges[i][1]));
    const { a, c, b } = corners[i];
    const arc = arcFromPoints(a, arcMidpoint(a, b, c), b);
    assert.equal(arc.type, 'arc', '圆角应为圆弧图元');
    segs.push(arc);
  }
  return makeContour(segs, true);
}

console.log('— 图元基础 —');
test('直线 pointAt/分割', () => {
  const s = line(P(0, 0), P(10, 0));
  assert.deepEqual(pointAt(s, 0.5), P(5, 0));
  const [a, b] = splitSeg(s, 0.5);
  assert.equal(a.type, 'line');
  assert.deepEqual(a.b, P(5, 0));
  assert.deepEqual(b.a, P(5, 0));
});

test('圆弧分割后仍是圆弧且同圆心(圆角不丢)', () => {
  const c = circleContour(50, 50, 10);
  const arc = c.segs[0];
  assert.equal(arc.type, 'arc');
  const [a, b] = splitSeg(arc, 0.3);
  assert.equal(a.type, 'arc');
  assert.equal(b.type, 'arc');
  if (a.type === 'arc' && b.type === 'arc' && arc.type === 'arc') {
    assert.deepEqual(a.c, arc.c);
    assert.deepEqual(b.c, arc.c);
    assert.equal(a.ccw, arc.ccw);
  }
});

test('贝塞尔分割保持三次类型', () => {
  const s: Segment = { id: uid('cb'), type: 'cubic', a: P(0, 0), c1: P(3, 0), c2: P(7, 10), b: P(10, 10) };
  const [a, b] = splitSeg(s, 0.5);
  assert.equal(a.type, 'cubic');
  assert.equal(b.type, 'cubic');
  assert.ok(flatten(a, 0.1).length > 1);
});

test('自由曲线点串转贝塞尔', () => {
  const cubics = smoothPointsToCubics([P(0, 0), P(5, 2), P(10, 0), P(15, 3)]);
  assert.equal(cubics.length, 3);
  assert.ok(cubics.every(s => s.type === 'cubic'));
});

console.log('— 轮廓锚点 —');
test('锚点增删', () => {
  const c = rectContour(0, 0, 100, 50);
  const n0 = contourAnchors(c).length;
  insertAnchor(c, 0, 0.5);
  assert.equal(contourAnchors(c).length, n0 + 1);
  assert.equal(c.segs.length, 5);
  deleteAnchor(c, 1);
  assert.equal(contourAnchors(c).length, n0);
});

test('闭合判定与折线展平', () => {
  const c = rectContour(0, 0, 10, 10);
  assert.ok(isClosed(c));
  const poly = contourPolyline(c, 0.5);
  assert.ok(poly.length >= 4);
});

console.log('— 相交 —');
test('线线相交', () => {
  const hits = segIntersections(line(P(0, 0), P(10, 10)), line(P(0, 10), P(10, 0)));
  assert.equal(hits.length, 1);
  assert.ok(Math.abs(hits[0].p.x - 5) < 1e-6);
});

test('线弧相交(两点)', () => {
  const circle = circleContour(0, 0, 5);
  const all = circle.segs.flatMap(s => segIntersections(line(P(-10, 0), P(10, 0)), s));
  assert.equal(all.length, 2);
});

test('弧弧相交', () => {
  const a = circleContour(0, 0, 5);
  const b = circleContour(6, 0, 5);
  const hits = a.segs.flatMap(sa => b.segs.map(sb => segIntersections(sa, sb)).flat());
  assert.equal(hits.length, 2);
});

test('自交检测:8 字形轮廓被识别', () => {
  const bowtie = makeContour([
    line(P(0, 0), P(10, 10)),
    line(P(10, 10), P(10, 0)),
    line(P(10, 0), P(0, 10)),
    line(P(0, 10), P(0, 0))
  ], true);
  const hits = contourSelfIntersections(bowtie.segs);
  assert.ok(hits.length >= 1, '8 字形应有自交点');
});

test('正常矩形无自交', () => {
  assert.equal(contourSelfIntersections(rectContour(0, 0, 10, 10).segs).length, 0);
});

console.log('— 布尔运算 —');
test('并集:两个相交矩形得到单一闭合环', () => {
  const a = rectContour(0, 0, 10, 10);
  const b = rectContour(5, 5, 10, 10);
  const r = booleanOp('union', a, b);
  assert.equal(r.length, 1);
  assert.ok(r[0].closed);
  const area = contourArea(r[0]);
  assert.ok(Math.abs(area - 175) < 1.5, `并集面积应≈175,实际 ${area}`);
});

test('差集:面积小于被减轮廓', () => {
  const a = rectContour(0, 0, 10, 10);
  const b = rectContour(5, 0, 10, 10);
  const r = booleanOp('subtract', a, b);
  assert.ok(r.length >= 1);
  const total = r.reduce((s, c) => s + contourArea(c), 0);
  assert.ok(total < contourArea(a));
  assert.ok(Math.abs(total - 50) < 1.5, `差集面积应≈50,实际 ${total}`);
});

test('交集:只剩重叠区域', () => {
  const a = rectContour(0, 0, 10, 10);
  const b = rectContour(5, 5, 10, 10);
  const r = booleanOp('intersect', a, b);
  assert.equal(r.length, 1);
  assert.ok(Math.abs(contourArea(r[0]) - 25) < 1.5);
});

test('圆角保留:圆角矩形并集后仍含圆弧图元', () => {
  const a = roundedRectContour(0, 0, 40, 20, 4);
  const arcCountBefore = a.segs.filter(s => s.type === 'arc').length;
  assert.equal(arcCountBefore, 4);
  const b = rectContour(30, 5, 30, 10);
  assert.ok(contoursInteract(a, b));
  const r = booleanOp('union', a, b);
  assert.ok(r.length >= 1);
  const arcAfter = r.reduce((n, c) => n + c.segs.filter(s => s.type === 'arc').length, 0);
  assert.ok(arcAfter >= 2, `未参与切割的圆角应保留(期望≥2,实际 ${arcAfter})`);
});

test('unionAll:分离轮廓保留、相交轮廓合并', () => {
  const cs = [rectContour(0, 0, 10, 10), rectContour(5, 5, 10, 10), rectContour(100, 100, 5, 5)];
  const r = unionAll(cs);
  assert.equal(r.length, 2, '两个相交件合并为一,分离件保留');
});

console.log('— SVG 往返 —');
test('圆弧轮廓导出含 A 命令且可解析回圆弧', () => {
  const c = circleContour(20, 20, 8);
  const d = contourToPathD(c);
  assert.ok(d.includes('A'), '圆弧应导出为 SVG A 命令');
  const back = parseSVGPaths(`<svg><path d="${d}"/></svg>`);
  assert.equal(back.length, 1);
  assert.ok(back[0].segs.some(s => s.type === 'arc'), '解析回的轮廓应保留圆弧');
});

test('整板 SVG 导出包含板框与零件', () => {
  const doc = createDoc();
  doc.parts[0].contours.push(rectContour(0, 0, 50, 30));
  const svg = exportDocSVG(doc);
  assert.ok(svg.includes('<svg'));
  assert.ok(svg.includes('<path'));
  assert.ok(svg.includes('mm'));
});

console.log('— 检查 —');
test('孔位重叠分档:侵入=严重,近距=主要', () => {
  const doc = createDoc();
  const p = doc.parts[0];
  p.holes.push({ id: 'h1', cx: 50, cy: 50, r: 10 }, { id: 'h2', cx: 65, cy: 50, r: 10 });
  const f1 = checkDoc(doc).filter(f => f.code === 'hole-overlap');
  assert.ok(f1.some(f => f.severity === 'critical'));
  p.holes[1].cx = 70.5; // 间距 0.5mm
  const f2 = checkDoc(doc).filter(f => f.code === 'hole-overlap');
  assert.ok(f2.some(f => f.severity === 'major'));
});

test('越界检查:零件拖出板幅报严重', () => {
  const doc = createDoc();
  doc.parts[0].contours.push(rectContour(0, 0, 100, 100));
  assert.equal(checkDoc(doc).filter(f => f.code === 'out-of-bounds').length, 0);
  doc.parts[0].x = doc.board.width - 10;
  const findings = checkDoc(doc).filter(f => f.code === 'out-of-bounds');
  assert.ok(findings.some(f => f.severity === 'critical'));
});

test('自交轮廓进入检查结果', () => {
  const doc = createDoc();
  const bowtie = makeContour([
    line(P(0, 0), P(10, 10)), line(P(10, 10), P(10, 0)),
    line(P(10, 0), P(0, 10)), line(P(0, 10), P(0, 0))
  ], true);
  doc.parts[0].contours.push(bowtie);
  assert.ok(checkDoc(doc).some(f => f.code === 'self-intersect' && f.severity === 'critical'));
});

console.log('— 吸附 —');
test('靠近孔中心吸附并产生参考线', () => {
  const doc = createDoc();
  const p = doc.parts[0];
  p.holes.push({ id: 'h1', cx: 100, cy: 100, r: 5 });
  const near = P(p.x + 100 + 0.5, p.y + 100);
  const res = findSnap(doc, near, 4, 1000, 800);
  assert.ok(res.snapped, '应吸附到孔中心');
  assert.equal(res.guides.length, 2);
});

console.log('— 历史/持久化结构 —');
test('撤销栈支持 30+ 步并按 50 截断', () => {
  const h = new History();
  let doc = createDoc();
  for (let i = 0; i < 60; i++) { h.push(doc); doc = JSON.parse(JSON.stringify(doc)); doc.board.width = 1000 + i; }
  assert.equal(h.depth, 50);
  for (let i = 0; i < 40; i++) doc = h.undo(doc);
  assert.equal(h.canRedo, true);
  for (let i = 0; i < 40; i++) doc = h.redo(doc);
  assert.equal(h.canRedo, false);
});

console.log('— 排料/阵列 —');
test('拖动零件时相邻件让位且保持间隙', () => {
  const doc = createDoc();
  doc.parts = [
    { id: 'a', name: 'A', x: 0, y: 0, contours: [rectContour(0, 0, 50, 50)], holes: [] },
    { id: 'b', name: 'B', x: 52, y: 0, contours: [rectContour(0, 0, 50, 50)], holes: [] }
  ];
  // 真实流程:先把 A 移到新位置,再让相邻件让位
  doc.parts[0].x = 60;
  pushNeighbors(doc, 'a', 60, 0);
  const b = doc.parts[1];
  assert.ok(b.x >= 110, `B 应被推到 A 右侧并留 2mm 间隙(期望≥110,实际 ${b.x})`);
});

test('孔阵列保持孔距', () => {
  const part: Part = { id: 'p', name: 'p', x: 0, y: 0, contours: [], holes: [{ id: 'h', cx: 10, cy: 10, r: 3 }] };
  const made = duplicateHolesArray(part, ['h'], { cols: 3, rows: 2, dx: 20, dy: 25 });
  assert.equal(made.length, 5); // 3x2 减原件
  const row1 = made.filter(h => h.cy === 10);
  assert.deepEqual(row1.map(h => h.cx).sort((a, b) => a - b), [30, 50]);
  assert.ok(made.every(h => h.r === 3));
});

console.log(`\n全部通过:${passed} 项`);
