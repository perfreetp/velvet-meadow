/** 几何与布尔运算验证脚本（Node 环境，esbuild 编译后运行） */
import { lineLine, arcGeom, lineArc, arcArc, pointInPolygon, tessellateArc, bulgeFromApex, dist } from '../src/core/math2d';
import { booleanOp, allIntersections } from '../src/core/boolean';
import { flattenPath, closureRatio, isPathClosed } from '../src/core/geometry';
import { exportSvg, pathToSvgD } from '../src/core/svg-export';
import { autoScore } from '../src/core/scoring';
import { DocumentStore } from '../src/core/store';
import { buildSeedData } from '../src/core/seed';
import { uid } from '../src/core/math2d';
import type { PathData } from '../src/core/types';

let passed = 0;
let failed = 0;

function ok(name: string, cond: boolean, extra = ''): void {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.error(`  ✗ ${name} ${extra}`); }
}

function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}

/** 矩形闭合路径（逆时针） */
function rectPath(x0: number, y0: number, x1: number, y1: number, name: string): PathData {
  const pts = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]] as [number, number][];
  const anchors = pts.map(([x, y]) => ({ id: uid('a'), x, y }));
  const segs = anchors.map((a, i) => {
    const b = anchors[(i + 1) % anchors.length];
    return { id: uid('s'), type: 'line' as const, a: a.id, b: b.id };
  });
  return { id: uid('path'), name, anchors, segs, color: '#fff', closed: true };
}

/** 用 4 段 90° 圆弧构造近似圆 */
function circlePath(cx: number, cy: number, r: number, name: string): PathData {
  // 正方形 4 个切点，每段 bulge = tan(90°/4)=1
  const k = r;
  const pts = [[cx + k, cy], [cx, cy + k], [cx - k, cy], [cx, cy - k]] as [number, number][];
  const anchors = pts.map(([x, y]) => ({ id: uid('a'), x, y }));
  const segs = anchors.map((a, i) => {
    const b = anchors[(i + 1) % anchors.length];
    return { id: uid('s'), type: 'arc' as const, a: a.id, b: b.id, bulge: Math.tan(Math.PI / 8) };
  });
  return { id: uid('path'), name, anchors, segs, color: '#fff', closed: true };
}

/** 完整圆（起点与终点重合的两段半圆弧），用于解析几何单测 */
function fullCircleGeom(cx: number, cy: number, r: number): import('../src/core/math2d').ArcGeom {
  const g1 = arcGeom({ x: cx - r, y: cy }, { x: cx + r, y: cy }, 1)!;
  void g1;
  // 用两段半圆拼整圆，这里测试只需要一个 2π 圆：直接手工构造
  return {
    center: { x: cx, y: cy }, radius: r,
    startAngle: 0, endAngle: Math.PI * 2, sweep: Math.PI * 2, ccw: true
  };
}

console.log('\n[1] 基础解析几何');
{
  const hit = lineLine({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 });
  ok('两线段交点', !!hit && approx(hit!.p.x, 5) && approx(hit!.p.y, 5));
  const none = lineLine({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 2 }, { x: 1, y: 2 });
  ok('平行线无交点', none === null);
  const g = arcGeom({ x: 0, y: 0 }, { x: 4, y: 0 }, 1);
  ok('bulge=1 为半圆', !!g && approx(g!.radius, 2) && approx(Math.abs(g!.sweep), Math.PI));
  const half = arcGeom({ x: 0, y: 0 }, { x: 4, y: 0 }, -1);
  ok('负 bulge 顺时针', !!half && half!.sweep < 0);
  const arcPts = tessellateArc(g!, 0.01);
  ok('圆弧细分首末点正确', approx(arcPts[0].x, 0) && approx(arcPts.at(-1)!.x, 4));
  const apex = { x: 2, y: 2 };
  const b = bulgeFromApex({ x: 0, y: 0 }, { x: 4, y: 0 }, apex);
  ok('三点反推 bulge=1', approx(b, 1));
  const full = fullCircleGeom(0, 0, 2);
  const la = lineArc({ x: -5, y: 2 }, { x: 5, y: 2 }, full);
  ok('水平线 y=2 与整圆相切于一点', la.length === 1 && approx(la[0].p.x, 0, 1e-6), `got ${la.length}`);
  const laMid = lineArc({ x: -5, y: 1 }, { x: 5, y: 1 }, full);
  const xsMid = laMid.map(h => h.p.x).sort((a, b) => a - b);
  ok('水平线 y=1 与整圆交于 ±√3', laMid.length === 2
    && approx(xsMid[0], -Math.sqrt(3), 1e-6) && approx(xsMid[1], Math.sqrt(3), 1e-6));
  const la2 = lineArc({ x: -5, y: 0 }, { x: 5, y: 0 }, full);
  ok('过圆心线交圆于直径两端', la2.length === 2 && approx(dist(la2[0].p, la2[1].p), 4));
  const g2 = fullCircleGeom(3, 0, 2);
  const aa = arcArc(full, g2);
  ok('两圆相交两点', aa.length === 2 && approx(aa[0].p.x, 1.5), `got ${aa.length}`);
  ok('点在多边形内', pointInPolygon({ x: 5, y: 5 }, [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]));
  ok('点在多边形外', !pointInPolygon({ x: 15, y: 5 }, [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }]));
}

console.log('\n[2] 两个重叠矩形的布尔运算');
{
  const A = rectPath(0, 0, 10, 10, 'A');
  const B = rectPath(5, 5, 15, 15, 'B');
  const ips = allIntersections(A, B);
  ok('检测到 2 个交点', ips.length === 2, `got ${ips.length}`);

  const inter = booleanOp(A, B, 'intersection');
  ok('交集产生 1 条轮廓', inter.paths.length === 1, `got ${inter.paths.length}`);
  if (inter.paths[0]) {
    const p = inter.paths[0];
    ok('交集为 4 顶点四边形', p.anchors.length === 4, `got ${p.anchors.length}`);
    const xs = p.anchors.map(a => a.x), ys = p.anchors.map(a => a.y);
    ok('交集区域为 5×5', Math.max(...xs) - Math.min(...xs) === 5 && Math.max(...ys) - Math.min(...ys) === 5);
    ok('交集轮廓闭合', isPathClosed(p));
  }

  const uni = booleanOp(A, B, 'union');
  ok('并集产生 1 条轮廓', uni.paths.length === 1, `got ${uni.paths.length}`);
  if (uni.paths[0]) {
    ok('并集为 8 顶点', uni.paths[0].anchors.length === 8, `got ${uni.paths[0].anchors.length}`);
    const flat = flattenPath(uni.paths[0]).pts;
    ok('并集包含 A、B 内部点', pointInPolygon({ x: 2, y: 2 }, flat) && pointInPolygon({ x: 12, y: 12 }, flat));
    ok('并集排除外部点', !pointInPolygon({ x: 12, y: 2 }, flat));
  }

  const diff = booleanOp(A, B, 'difference');
  ok('差集产生 1 条轮廓', diff.paths.length === 1, `got ${diff.paths.length}`);
  if (diff.paths[0]) {
    ok('差集为 6 顶点 L 形', diff.paths[0].anchors.length === 6, `got ${diff.paths[0].anchors.length}`);
    const flat = flattenPath(diff.paths[0]).pts;
    ok('差集保留 A 独有区域', pointInPolygon({ x: 2, y: 2 }, flat));
    ok('差集排除重叠区域', !pointInPolygon({ x: 7, y: 7 }, flat));
  }
}

console.log('\n[3] 含圆弧路径的布尔运算');
{
  const R = rectPath(-8, -8, 8, 8, 'R');
  const C = circlePath(0, 0, 5, 'C');
  const ips = allIntersections(R, C);
  ok('圆完全在矩形内：无交点', ips.length === 0, `got ${ips.length}`);
  const inter = booleanOp(R, C, 'intersection');
  ok('包含关系下交集=内圆', inter.paths.length === 1 && inter.paths[0].name.includes('交'));
  const uni = booleanOp(R, C, 'union');
  ok('包含关系下并集=外矩形', uni.paths.length === 1);

  const C2 = circlePath(6, 0, 5, 'C2');
  const cross = allIntersections(R, C2);
  ok('偏移圆与矩形有交点', cross.length >= 2, `got ${cross.length}`);
  const res = booleanOp(R, C2, 'intersection');
  ok('矩形∩偏移圆产生轮廓', res.paths.length >= 1);
  if (res.paths[0]) {
    // 圆弧必须被还原（至少一条 arc 边）
    ok('结果中保留圆弧边', res.paths[0].segs.some(s => s.type === 'arc'));
    const flat = flattenPath(res.paths[0], 0.02).pts;
    ok('交集点同时在两形状内/边界', pointInPolygon({ x: 2, y: 0 }, flat));
  }
}

console.log('\n[4] 路径工具与评分');
{
  const open = rectPath(0, 0, 10, 10, 'open');
  open.closed = false;
  open.segs.pop();
  ok('开放路径闭合率 < 1', closureRatio(open) < 1);
  const closed = rectPath(0, 0, 10, 10, 'c');
  ok('闭合路径闭合率 = 1', approx(closureRatio(closed), 1));

  const store = new DocumentStore();
  const p = rectPath(0, 0, 20, 20, 'test');
  store.addPath(p);
  ok('路径可撤销', store.canUndo);
  const n0 = Object.keys(store.doc.paths).length;
  store.undo();
  ok('撤销后路径消失', Object.keys(store.doc.paths).length === n0 - 1);
  store.redo();
  ok('重做后路径恢复', Object.keys(store.doc.paths).length === n0);

  const d = pathToSvgD(p);
  ok('SVG 路径以 M 开头、Z 结尾', d.startsWith('M') && d.endsWith('Z'));
  const circle = circlePath(0, 0, 5, 'cir');
  ok('圆弧导出 A 命令', pathToSvgD(circle).includes(' A '));
  const svg = exportSvg(store.doc);
  ok('SVG 带 mm 实际尺寸', svg.includes('mm') && svg.includes('data-layer-name'));
}

console.log('\n[5] 示例习题与自动评分');
{
  const seed = await buildSeedData();
  ok('生成 1 个示例班级', seed.classes.length === 1);
  ok('生成 1 道示例习题', seed.exercises.length === 1);
  const ex = seed.exercises[0];
  const tplPaths = Object.values(ex.template.paths);
  ok('模板路径为开放缺口', tplPaths.every(p => !p.closed));
  ok('参考答案为闭合轮廓', Object.values(ex.referencePaths).every(isPathClosed));
  const score = autoScore(ex.template, ex);
  ok('缺口模板自动分低于满分', score.total < 60 && score.closure < 40, `total=${score.total}`);
  // 学员补齐：用参考答案替换后应得满分闭合项
  const fixed = JSON.parse(JSON.stringify(ex.template));
  for (const [pid, rp] of Object.entries(ex.referencePaths)) fixed.paths[pid] = rp;
  const score2 = autoScore(fixed, ex);
  ok('补齐后闭合度满分', score2.closure === 40, `got ${score2.closure}`);
}

console.log(`\n结果：${passed} 通过，${failed} 失败`);
if (failed > 0) process.exit(1);
