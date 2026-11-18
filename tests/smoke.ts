// 核心几何算法冒烟测试（Node 直接跑 TS 源码，经 vite-node 替代：用 esbuild 转译）
// 运行：node --experimental-strip-types tests/smoke.ts
import { CatmullRomSpline, deriveSplineLine, v2 } from '../src/core/geometry/spline.ts';
import { offsetPolyline, buildOffsetLines, pointSegmentDistance } from '../src/core/geometry/offset.ts';
import { buildTerrainMesh, sampleSection } from '../src/core/geometry/terrain.ts';
import { pointInPolygon } from '../src/core/geometry/polygon.ts';
import { unfoldSlope } from '../src/core/geometry/unfold.ts';
import { generateSampleData } from '../src/core/io/sample-data.ts';
import { DEFAULT_SETTINGS } from '../src/core/archive/project-store.ts';

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

// 1. 样条经过控制点
const controls = [
  { x: 0, y: 0 },
  { x: 100, y: 40 },
  { x: 200, y: -30 },
  { x: 300, y: 10 }
];
const spline = new CatmullRomSpline(controls);
let fits = true;
controls.forEach((p, i) => {
  const e = spline.evaluate(i);
  if (v2.dist(e, p) > 1e-6) fits = false;
});
check('Catmull-Rom 样条经过全部控制点', fits);

// 2. 派生线：弧长、曲率、突变标记
const settings = { ...DEFAULT_SETTINGS, resampleSpacing: 2, curvatureAlert: 0.0008 };
const d = deriveSplineLine('center', controls, settings)!;
check('派生线采样点数量合理', d.points.length > 100, `got ${d.points.length}`);
check('累计弧长单调递增', d.arcLengths.every((s, i) => i === 0 || s >= d.arcLengths[i - 1]));
check('曲率半径 = 1/|κ|', d.curvatures.every((k, i) => Math.abs(k) < 1e-9 || Math.abs(d.radii[i] - 1 / Math.abs(k)) < 1e-6));
check('总长在弦长与外包范围之间', d.totalLength > v2.dist(controls[0], controls[3]));

// 3. 等距偏移
const off = offsetPolyline(controls, false, 30, 'round');
check('圆角偏移输出点数不少于输入', off.length >= controls.length);
const off2 = offsetPolyline(controls, false, 30, 'miter');
// 边段中部的偏移距离应严格等于 30（角尖允许因 miter 延长而超出）
let maxErr = 0;
for (let i = 0; i < controls.length - 1; i++) {
  const a = controls[i];
  const b = controls[i + 1];
  const dir = v2.norm(v2.sub(b, a));
  const left = v2.normal(dir);
  const mid = v2.add(v2.scale(v2.add(a, b), 0.5), v2.scale(left, 30));
  let md = Infinity;
  for (let j = 0; j < off2.length - 1; j++) md = Math.min(md, pointSegmentDistance(mid, off2[j], off2[j + 1]));
  maxErr = Math.max(maxErr, md);
}
check('尖角偏移边段距离误差 < 0.01m', maxErr < 0.01, `maxErr=${maxErr.toFixed(4)}`);
const both = buildOffsetLines(controls, false, 25, 'bevel', 'both');
check('双侧偏移生成两条线', both.length === 2);

// 闭合环偏移（矩形）
const rect = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 80 },
  { x: 0, y: 80 }
];
// 闭合环偏移（矩形，逆时针：左法向指向环内，+距离=内缩）
const ringIn = offsetPolyline(rect, true, 10, 'miter');
const ringOut = offsetPolyline(rect, true, -10, 'miter');
check('闭合环外扩后点数>4（含角点）', ringOut.length >= 4);
check('闭合环内缩尺寸正确', ringIn.some((p) => Math.abs(p.x - 10) < 0.01) && ringIn.some((p) => Math.abs(p.y - 10) < 0.01));
check('闭合环外扩尺寸正确', ringOut.some((p) => Math.abs(p.x + 10) < 0.01) && ringOut.some((p) => Math.abs(p.y + 10) < 0.01));

// 4. 点在多边形内
check('点在矩形内', pointInPolygon({ x: 50, y: 40 }, rect));
check('点在矩形外', !pointInPolygon({ x: 150, y: 40 }, rect));

// 5. 地形插值
const sample = generateSampleData();
check('示例数据生成', sample.elev.length > 500 && sample.boundary.points.length > 10);
const mesh = buildTerrainMesh(sample.elev, sample.boundary.points, 10, 2, 80)!;
check('地形网格构建', mesh.cols > 10 && mesh.rows > 10);
check('网格高程范围覆盖点集', mesh.minZ < mesh.maxZ);
const z0 = (mesh.heights.filter((z) => Number.isFinite(z)) as Float32Array)[0];
check('网格含有效高程', Number.isFinite(z0));
check('坡度在 0~90 度之间', mesh.slopes.every((s, i) => !mesh.valid[i] || (s >= 0 && s <= 90)));

// 6. 横断面
const sec = sampleSection(mesh, sample.center[0], sample.center[3], 5);
check('横断面采样成功', sec.length > 10 && sec.every((p) => Number.isFinite(p.z)));

// 7. 堤坡展开
const cd = deriveSplineLine('crest-left', sample.crestLeft, settings)!;
const u = unfoldSlope(mesh, cd, 10, 60, { width: 40, crossStep: 5, side: 'left' }, 'u1', Date.now(), '左堤顶线')!;
check('展开成果生成', u.area > 0 && u.slopeLength > 0);
check('展开坡长不小于条带宽', u.slopeLength >= 40 * 0.95);
check('展开条带轮廓完整', u.outline.top.length === u.outline.bottom.length && u.outline.top.length > 10);
// 面积量级：桩长 × 条带宽 附近（坡面面积 ≥ 平面投影）
const planar = u.bounds.maxX * 40;
check('展开面积 ≥ 平面投影面积', u.area >= planar * 0.98, `${u.area.toFixed(1)} vs ${planar.toFixed(1)}`);

console.log(`\n结果：${pass} 通过，${fail} 失败`);
if (fail) process.exit(1);
