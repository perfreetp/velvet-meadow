import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sunPosition, SOLAR_PRESETS } from '../client/src/engine/solar.js';
import { kelvinToRGB } from '../client/src/engine/color.js';
import { pointInPolygon, polygonArea, convexHull, diskSamples } from '../client/src/engine/geometry.js';
import { computeLighting } from '../client/src/engine/lighting.js';
import { computeBlockStats, statsToCSV } from '../client/src/engine/stats.js';

const LAT = 39.9042, LNG = 116.4074;

test('夏至正午太阳高度角显著高于冬至', () => {
  const summer = new Date(2026, 5, 21);
  const winter = new Date(2026, 11, 21);
  const s = sunPosition(summer, 12, LAT, LNG);
  const w = sunPosition(winter, 12, LAT, LNG);
  assert.ok(s.daylight && w.daylight);
  const sDeg = s.elev * 180 / Math.PI, wDeg = w.elev * 180 / Math.PI;
  // 北京夏至正午约 73.5°，冬至约 26.6°，容差 ±2°
  assert.ok(Math.abs(sDeg - 73.5) < 2, `夏至 ${sDeg}`);
  assert.ok(Math.abs(wDeg - 26.6) < 2, `冬至 ${wDeg}`);
  assert.ok(sDeg - wDeg > 40);
});

test('21 点太阳已落山（夏至北京日落约 19:46）', () => {
  const summer = new Date(2026, 5, 21);
  const r = sunPosition(summer, 21, LAT, LNG);
  assert.equal(r.daylight, false);
  assert.ok(r.elev < 0);
});

test('下午太阳方位在西侧（azim > 180°）', () => {
  const summer = new Date(2026, 5, 21);
  const r = sunPosition(summer, 16, LAT, LNG);
  assert.ok(r.azim * 180 / Math.PI > 180, `azim=${r.azim * 180 / Math.PI}`);
});

test('色温转换：低色温偏暖红，高色温偏蓝', () => {
  const warm = kelvinToRGB(2200);
  const cool = kelvinToRGB(6500);
  assert.ok(warm[0] > warm[2], '2200K 红 > 蓝');
  assert.ok(cool[2] > warm[2], '6500K 蓝分量高于 2200K');
});

test('点内含与多边形面积', () => {
  const sq = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
  assert.equal(pointInPolygon(5, 5, sq), true);
  assert.equal(pointInPolygon(15, 5, sq), false);
  assert.equal(Math.round(polygonArea(sq)), 100);
});

test('凸包去凹点', () => {
  const pts = [{ x: 0, y: 0 }, { x: 5, y: 1 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }];
  const hull = convexHull(pts);
  assert.equal(hull.length, 4);
});

test('圆盘采样权重和为 1', () => {
  const s = diskSamples(3, 4, 0.5, 6);
  assert.equal(s.length, 6);
  assert.ok(Math.abs(s.reduce((a, p) => a + p.w, 0) - 1) < 1e-9);
});

test('夜间无日照时，路灯只照亮半径内且被建筑遮挡', () => {
  const bounds = { minX: 0, minY: 0, maxX: 40, maxY: 30 };
  const buildings = [{
    id: 'b1', name: '测试楼', blockId: 'B1', blockName: '街坊一', floors: 3,
    polygon: [{ x: 15, y: 8 }, { x: 25, y: 8 }, { x: 25, y: 22 }, { x: 15, y: 22 }],
  }];
  const lights = [{
    id: 'l1', type: 'street', x: 5, y: 15, height: 8, radius: 14,
    cct: 3000, power: 12, size: 0.4, washTarget: null,
  }];
  const r = computeLighting({
    buildings, lights, bounds, cell: 1, hour: 21,
    solarDate: { month: 6, day: 21 }, lat: LAT, lng: LNG,
    includeSun: false, darkThreshold: 20,
  });
  // 建筑占据的格子照度为 0（跳过计算）
  const idxInside = (15 - 0) * r.cols + 15; // (15,15) 在楼内
  assert.equal(r.lux[idxInside], 0);
  // 光源邻近格子有照度
  const idxNear = (15 - 0) * r.cols + 6; // (6,15) 距灯 1m
  assert.ok(r.lux[idxNear] > 0, '灯下应有照度');
  // 建筑背光面（楼右侧 x=27）不应收到来自左侧灯的光
  const idxBehind = (15 - 0) * r.cols + 27;
  assert.equal(r.lux[idxBehind], 0, '建筑背面应为 0');
  // 半径外为 0
  const idxFar = 15 * r.cols + 39;
  assert.equal(r.lux[idxFar], 0);
});

test('半影：增大光源尺寸使阴影边界过渡更柔和（相邻格照度差缩小）', () => {
  const bounds = { minX: 0, minY: 0, maxX: 40, maxY: 20 };
  const buildings = [{
    id: 'b1', name: '墙', blockId: 'B1', blockName: 'x', floors: 4,
    polygon: [{ x: 18, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }, { x: 18, y: 20 }],
  }];
  const mk = (size) => computeLighting({
    buildings,
    lights: [{ id: 'l', type: 'street', x: 5, y: 10, height: 6, radius: 30, cct: 3000, power: 20, size }],
    bounds, cell: 1, hour: 21, solarDate: { month: 6, day: 21 },
    lat: LAT, lng: LNG, includeSun: false, darkThreshold: 20,
  });
  const hard = mk(0.05), soft = mk(1.5);
  // 统计墙右缘 x=21..24 的照度梯度总变化
  const grad = (res) => {
    let g = 0;
    for (let x = 21; x < 24; x++) {
      const i1 = 10 * res.cols + x, i2 = 10 * res.cols + x + 1;
      g += Math.abs(res.lux[i2] - res.lux[i1]);
    }
    return g;
  };
  assert.ok(grad(soft) <= grad(hard), `柔和梯度 ${grad(soft)} 应不大于硬边 ${grad(hard)}`);
});

test('路灯正下方照度处于合理工程量级（数十 lx）', () => {
  const bounds = { minX: 0, minY: 0, maxX: 30, maxY: 30 };
  const r = computeLighting({
    buildings: [],
    lights: [{ id: 'l', type: 'street', x: 15, y: 15, height: 8, radius: 18, cct: 3000, power: 12, size: 0.4 }],
    bounds, cell: 1, hour: 21, solarDate: { month: 6, day: 21 },
    lat: 39.9, lng: 116.4, includeSun: false, darkThreshold: 20,
  });
  // 灯下格 (15,15)
  const under = 15 * r.cols + 15;
  assert.ok(r.lux[under] >= 15 && r.lux[under] <= 120, `灯下照度 ${r.lux[under].toFixed(1)}lx 应在 15~120`);
});

test('暗区连通块与街坊统计输出结构完整', () => {
  const bounds = { minX: 0, minY: 0, maxX: 30, maxY: 20 };
  const blocks = [{ id: 'B1', name: '街坊一', polygon: [{ x: 0, y: 0 }, { x: 30, y: 0 }, { x: 30, y: 20 }, { x: 0, y: 20 }] }];
  const r = computeLighting({
    buildings: [], lights: [], bounds, cell: 1, hour: 21,
    solarDate: { month: 6, day: 21 }, lat: LAT, lng: LNG,
    includeSun: false, darkThreshold: 20,
  });
  const st = computeBlockStats(r, [], blocks, 20);
  assert.equal(st.blocks.length, 1);
  assert.equal(st.blocks[0].avgLux, 0);
  assert.equal(st.blocks[0].darkRatio, 1);
  assert.ok(r.darkZones.length >= 1);
  assert.equal(r.darkZones[0].areaM2, r.darkZones[0].cells);
  const csv = statsToCSV(st);
  assert.ok(csv.includes('街坊名称'));
  assert.ok(csv.includes('暗区占比'));
});

test('白天日照：无遮挡区域有日照，建筑投影区内为 0', () => {
  const bounds = { minX: 0, minY: 0, maxX: 60, maxY: 60 };
  const buildings = [{
    id: 'b1', name: '楼', blockId: 'B1', blockName: 'x', floors: 6,
    polygon: [{ x: 25, y: 25 }, { x: 35, y: 25 }, { x: 35, y: 35 }, { x: 25, y: 35 }],
  }];
  const r = computeLighting({
    buildings, lights: [], bounds, cell: 1, hour: 12,
    solarDate: { month: 12, day: 21 }, lat: LAT, lng: LNG,
    includeSun: true, darkThreshold: 20,
  });
  // 正午阳光充足
  const open = 30 * r.cols + 5;
  assert.ok(r.sunLux[open] > 1000, `开阔地日照 ${r.sunLux[open]}`);
  // 至少存在一些日照被遮挡的非建筑格（阴影）
  let shaded = 0;
  for (let i = 0; i < r.sunLux.length; i++) {
    if (r.lux[i] === 0 && r.darkMask[i] === 0) shaded++;
  }
  assert.ok(shaded > 0, '建筑外应有阴影格');
});
