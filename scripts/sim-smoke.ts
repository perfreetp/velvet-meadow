// 仿真冒烟测试：node --import tsx 不需要，直接用 vite-node 风格的 esbuild 产物
// 用法：npx tsx scripts/sim-smoke.ts
import { createDefaultProject } from '../src/defaultScene';
import { simulate } from '../src/engine/simulation';
import { timeCurve } from '../src/engine/photometry';
import type { Lamp, ProjectData } from '../src/types';

function clone(d: ProjectData): ProjectData {
  return JSON.parse(JSON.stringify(d));
}

const base = createDefaultProject();

// 1. 默认场景：19:30 应有暗区（东侧刻意留空）
const sim = simulate(clone(base));
console.log('=== 默认场景 19:30 ===');
console.log('网格', sim.cols, 'x', sim.rows, 'cell=', sim.cellSize.toFixed(2), 'm');
console.log('水面单元', sim.stats.waterCells);
console.log('照度 mean/min/max =',
  sim.stats.meanLux.toFixed(2), sim.stats.minLux.toFixed(2), sim.stats.maxLux.toFixed(2), 'lux');
console.log('低于15lux占比', sim.stats.pctBelowThreshold.toFixed(1) + '%');
console.log('暗区数', sim.darkZones.length, '最大暗区面积',
  sim.darkZones[0] ? sim.darkZones[0].areaM2.toFixed(1) + ' m²' : '-');
console.log('耗时', sim.elapsedMs.toFixed(0), 'ms');

// 2. 时间曲线：18 点 vs 23 点
console.log('\n=== 时间曲线 ===');
for (const h of [18, 19, 19.5, 20.5, 22, 23]) {
  const c = timeCurve(h);
  console.log(`${h}:00 余晖=${(c.skyGlow * 100).toFixed(0)}% 调光=${(c.lampDimming * 100).toFixed(0)}%`);
}
const d18 = simulate({ ...clone(base), timeHour: 18 });
const d23 = simulate({ ...clone(base), timeHour: 23 });
console.log('18:00 均照度', d18.stats.meanLux.toFixed(2), '| 23:00 均照度', d23.stats.meanLux.toFixed(2));
console.log('23:00 暗区数', d23.darkZones.length, '(应显著多于 18:00 的', d18.darkZones.length, ')');

// 3. 距离衰减：单灯、零高度（退化为纯平面平方反比），比较 3m 与 9m
const single: ProjectData = {
  ...clone(base),
  elements: [
    ...base.elements.filter((e) => e.type !== 'lamp'),
    {
      id: 't1', type: 'lamp', name: '测试灯', kind: 'flood',
      pos: { x: 0, y: 0 }, aim: 0, beamAngleDeg: 120,
      colorTemp: 4000, powerW: 100, height: 0.01, efficacy: 100,
    } as Lamp,
  ],
  timeHour: 21,
};
const s3 = simulate(single);
const luxAt = (x: number, y: number) => {
  const cx = Math.floor((x - s3.gridOrigin.x) / s3.cellSize);
  const cy = Math.floor((y - s3.gridOrigin.y) / s3.cellSize);
  const idx = cy * s3.cols + cx;
  return s3.inWater[idx] ? s3.total[idx] : NaN;
};
console.log('\n=== 距离衰减（100W，120°，零高度）===');
console.log('3m:', luxAt(3, 0).toFixed(2), 'lux | 6m:', luxAt(6, 0).toFixed(2), 'lux | 9m:', luxAt(9, 0).toFixed(2), 'lux');
const ratio = luxAt(3, 0) / Math.max(luxAt(9, 0), 1e-6);
console.log('3m/9m 网格采样比值', ratio.toFixed(2), '(理论 9，0.8m 网格取整带来偏差)');

// 3a. 解析校验：同一网格单元内距离变化时严格平方反比（消除网格取整误差）
// E(r) = I_peak/r²，故 E(r1)/E(r2) = (r2/r1)²
const analytic: Record<number, number> = {};
for (const r of [4, 6, 8]) {
  const cx = Math.floor((r - s3.gridOrigin.x) / s3.cellSize);
  const cy = Math.floor((0 - s3.gridOrigin.y) / s3.cellSize);
  const px = s3.gridOrigin.x + (cx + 0.5) * s3.cellSize;
  const idx = cy * s3.cols + cx;
  analytic[r] = s3.total[idx] * px * px; // E·r² 应为常数 I_peak
}
const invSqErr = Math.max(
  Math.abs(analytic[4] - analytic[6]) / analytic[6],
  Math.abs(analytic[6] - analytic[8]) / analytic[6],
);
console.log('E·r² 守恒偏差', (invSqErr * 100).toFixed(2) + '%（应 < 2%）');

// 3b. 立体角归一化：同功率 36° 窄光束应比 120° 宽光束轴上亮得多
const narrow: ProjectData = {
  ...clone(base),
  elements: [
    ...base.elements.filter((e) => e.type !== 'lamp'),
    {
      id: 't2', type: 'lamp', name: '窄光束', kind: 'flood',
      pos: { x: 0, y: 0 }, aim: 0, beamAngleDeg: 36,
      colorTemp: 4000, powerW: 100, height: 0.01, efficacy: 100,
    } as Lamp,
  ],
  timeHour: 21,
};
const sNarrow = simulate(narrow);
const luxN = (x: number, y: number) => {
  const cx = Math.floor((x - sNarrow.gridOrigin.x) / sNarrow.cellSize);
  const cy = Math.floor((y - sNarrow.gridOrigin.y) / sNarrow.cellSize);
  const idx = cy * sNarrow.cols + cx;
  return sNarrow.inWater[idx] ? sNarrow.total[idx] : NaN;
};
console.log('\n=== 光束立体角归一化（同功率 100W，轴向 6m）===');
console.log('36° 窄光束:', luxN(6, 0).toFixed(2), 'lux | 120° 宽光束:', luxAt(6, 0).toFixed(2), 'lux');
const narrowGain = luxN(6, 0) / Math.max(luxAt(6, 0), 1e-6);
console.log('窄/宽 增益', narrowGain.toFixed(2), '(cos^8 聚光形状下立体角比，窄光束轴向显著更亮)');

// 4. 遮挡：在灯与目标之间加一道高墙，照度应下降
const elevatedLamp: Lamp = {
  id: 't3', type: 'lamp', name: '高架测试灯', kind: 'flood',
  pos: { x: 0, y: 0 }, aim: 0, beamAngleDeg: 120,
  colorTemp: 4000, powerW: 100, height: 6, efficacy: 100,
};
const elevated: ProjectData = {
  ...clone(base),
  elements: [...base.elements.filter((e) => e.type !== 'lamp'), elevatedLamp],
  timeHour: 21,
};
const blocked: ProjectData = {
  ...clone(elevated),
  elements: [
    ...elevated.elements,
    {
      id: 'w1', type: 'wall', name: '测试挡墙',
      points: [{ x: 4, y: -8 }, { x: 4, y: 8 }],
      thickness: 1, height: 5,
    },
  ],
};
const s4 = simulate(blocked);
const sElev = simulate(elevated);
const luxAtE = (sim: typeof s4, x: number, y: number) => {
  const cx = Math.floor((x - sim.gridOrigin.x) / sim.cellSize);
  const cy = Math.floor((y - sim.gridOrigin.y) / sim.cellSize);
  const idx = cy * sim.cols + cx;
  return sim.inWater[idx] ? sim.total[idx] : NaN;
};
console.log('\n=== 挡墙遮挡（x=4 处 5m 高墙，灯高 6m）===');
console.log('6m 无遮挡:', luxAtE(sElev, 6, 0).toFixed(2), 'lux vs 有遮挡:', luxAtE(s4, 6, 0).toFixed(2), 'lux');
console.log('8m 无遮挡:', luxAtE(sElev, 8, 0).toFixed(2), 'lux vs 有遮挡:', luxAtE(s4, 8, 0).toFixed(2), 'lux');

// 5. 半影随距离变化：矮墙（射线可越过），比较远近点
const lowWall: ProjectData = {
  ...clone(elevated),
  elements: [
    ...elevated.elements,
    {
      id: 'w2', type: 'wall', name: '矮墙',
      points: [{ x: 4, y: -8 }, { x: 4, y: 8 }],
      thickness: 2, height: 3.2,
    },
  ],
};
const s5 = simulate(lowWall);
const luxAt5 = (x: number, y: number) => luxAtE(s5, x, y);
console.log('\n=== 软阴影（3.2m 矮墙，灯高 6m）===');
console.log('近墙背侧 5m:', luxAt5(5, 0).toFixed(2), 'lux（深影/半影区）');
console.log('远墙背侧 9m:', luxAt5(9, 0).toFixed(2), 'lux（半影更宽，部分透过）');

// 6. 反射分量
console.log('\n=== 菲涅尔反射 ===');
const reflAt9 = (() => {
  const cx = Math.floor((9 - sElev.gridOrigin.x) / sElev.cellSize);
  const cy = Math.floor((0 - sElev.gridOrigin.y) / sElev.cellSize);
  return sElev.reflected[cy * sElev.cols + cx];
})();
console.log('9m 处直射', luxAtE(sElev, 9, 0).toFixed(2), '反射', reflAt9.toFixed(2), 'lux');

// 断言
const assert = (cond: boolean, msg: string) => {
  if (!cond) { console.error('❌ FAIL:', msg); process.exitCode = 1; }
  else console.log('✅ PASS:', msg);
};
console.log('\n=== 断言 ===');
assert(sim.stats.waterCells > 500, '水面网格数量合理');
assert(sim.darkZones.length >= 1, '默认场景东侧存在暗区');
assert(d23.darkZones.length >= d18.darkZones.length, '深夜暗区不少于黄昏');
assert(ratio > 7 && ratio < 13, '距离衰减符合平方反比（含网格取整）');
assert(invSqErr < 0.02, '同单元 E·r² 守恒，严格平方反比');
assert(narrowGain > 2.5, '窄光束轴向照度显著高于宽光束');
assert(luxAtE(s4, 6, 0) < 1, '高墙后照度被显著削减');
assert(s5.stats.maxLux > 0, '仿真可完成');
assert(luxAt5(9, 0) > luxAt5(5, 0), '半影宽度随灯—遮挡物距离增加，远侧照度回升');
assert(reflAt9 > 0, '菲涅尔反射分量非零');
