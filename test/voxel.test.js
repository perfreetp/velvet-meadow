import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createField, setV, getV, encodeRLE, decodeRLE, stampDisc,
  mirrorSet, countVoxels, cavityBounds, fillBox
} from '../src/lib/voxel/core.js';
import { extractGreedyQuads, quadsToTriMesh, decimate, buildMesh } from '../src/lib/voxel/mesh.js';
import { analyzeDeadAngles } from '../src/lib/voxel/deadangle.js';
import { copyRegion, pasteRegion, diffFields, normRect } from '../src/lib/voxel/selection.js';

test('RLE 编解码往返一致', () => {
  const f = createField(8, 6, 4);
  setV(f, 0, 0, 0, 1);
  setV(f, 7, 5, 3, 1);
  fillBox(f, 2, 2, 1, 5, 4, 2, 1);
  const bytes = encodeRLE(f);
  const g = decodeRLE(bytes, 8, 6, 4);
  assert.deepEqual(Array.from(g.data), Array.from(f.data));
  // 稀疏场 RLE 应明显小于原始体积
  assert.ok(bytes.length < f.data.length);
});

test('X/Y 镜像写入覆盖对称格点', () => {
  const f = createField(10, 10, 2);
  mirrorSet(f, 1, 2, 0, 1, true, true);
  assert.equal(getV(f, 1, 2, 0), 1);
  assert.equal(getV(f, 8, 2, 0), 1); // nx-1-1
  assert.equal(getV(f, 1, 7, 0), 1); // ny-1-2
  assert.equal(getV(f, 8, 7, 0), 1);
  assert.equal(countVoxels(f), 4);

  // 中轴上的点镜像后仍是自己，不重复计数（奇数宽度才有唯一中轴）
  const g = createField(11, 11, 1);
  const changed = mirrorSet(g, 5, 0, 0, 1, true, false);
  assert.equal(changed.length, 1);
});

test('圆盘画笔不越界', () => {
  const f = createField(5, 5, 1);
  stampDisc(f, 0, 0, 0, 3, 1, false, false);
  assert.ok(countVoxels(f) > 0);
  assert.ok(countVoxels(f) < 25);
});

test('贪心合并网格：相邻共面被合并，减面生效', () => {
  const f = createField(6, 6, 6);
  // 3x3x3 型腔
  fillBox(f, 1, 1, 1, 3, 3, 3, 1);
  const quads = extractGreedyQuads(f);
  // 立方体空腔只有 6 个合并后的大面（每面 1 个 quad）
  assert.equal(quads.length, 6);
  const mesh = quadsToTriMesh(quads);
  assert.equal(mesh.triCount, 12);

  // 减面：目标 6 个三角形时应实际下降
  const dec = decimate(mesh, 180, 6);
  assert.ok(dec.reduced);
  assert.ok(dec.after < dec.before);

  // 面数未超阈值时不减
  const built = buildMesh(f, { angleThresholdDeg: 15, triLimit: 300000 });
  assert.equal(built.stats.decimated, false);
  assert.equal(built.stats.trianglesBefore, 12);
});

test('buildMesh 超过 30 万面触发角度阈值减面并给出前后对比', () => {
  const f = createField(40, 40, 40);
  // 棋盘格型腔制造大量独立小面
  for (let z = 0; z < 40; z++) {
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 40; x++) {
        if ((x + y + z) % 2 === 0) setV(f, x, y, z, 1);
      }
    }
  }
  const built = buildMesh(f, { angleThresholdDeg: 30, triLimit: 300000 });
  assert.ok(built.stats.trianglesBefore > 300000);
  assert.ok(built.stats.decimated);
  assert.ok(built.stats.trianglesAfter < built.stats.trianglesBefore);
  assert.ok(built.stats.trianglesAfter <= 300000);
});

test('死角分析：开口直腔可达，悬空底切不可达', () => {
  const f = createField(6, 6, 6);
  // 上部窄通道（x=3 柱），下部扩大形成底切
  fillBox(f, 3, 2, 2, 3, 3, 5, 1);
  setV(f, 2, 2, 2, 1);
  setV(f, 2, 3, 2, 1);
  const r = analyzeDeadAngles(f, 0, 100);
  // 直通道全部可达
  assert.equal(getV(f, 3, 2, 2) === 1 && r.mask[(2 * 6 + 2) * 6 + 3], 0);
  // 底切格（x=2, z=2）上方是实体，刀具无法侧入 -> 死角
  assert.equal(r.mask[(2 * 6 + 2) * 6 + 2], 1);
  assert.ok(r.dead >= 2);
  assert.equal(r.dead + reachableCount(r), r.cavity);
});

test('刀长限制：超深直腔底部判为死角', () => {
  const f = createField(4, 4, 10);
  fillBox(f, 1, 1, 0, 2, 2, 9, 1);
  const r = analyzeDeadAngles(f, 0, 2.5); // 刀长 2.5mm = 5 格
  assert.ok(r.dead > 0);
  // 顶部 5 格可达
  assert.equal(r.reachable[(9 * 4 + 1) * 4 + 1], 1);
  assert.equal(r.reachable[(5 * 4 + 1) * 4 + 1], 1);
  assert.equal(r.reachable[(4 * 4 + 1) * 4 + 1], 0);
});

test('复制/粘贴带偏移，union 与 replace 模式', () => {
  const f = createField(8, 8, 4);
  fillBox(f, 1, 1, 1, 2, 2, 1, 1);
  const clip = copyRegion(f, normRect({ x: 1, y: 1 }, { x: 2, y: 2 }), 1, 1);
  assert.equal(clip.voxels.length, 4);
  const n = pasteRegion(f, clip, [4, 4, 0]);
  assert.equal(n, 4);
  assert.equal(getV(f, 5, 5, 1), 1);
  // 重复粘贴 union 不重复计数
  assert.equal(pasteRegion(f, clip, [4, 4, 0]), 0);
});

test('版本差异：新增与删除分别统计', () => {
  const a = createField(4, 4, 2);
  const b = createField(4, 4, 2);
  setV(a, 0, 0, 0, 1); // b 中被删除
  setV(b, 3, 3, 1, 1); // b 中新增
  const d = diffFields(a, b);
  assert.equal(d.addedCount, 1);
  assert.equal(d.removedCount, 1);
  assert.equal(d.added[(1 * 4 + 3) * 4 + 3], 1);
});

test('型腔包围盒与尺寸（0.5mm 格）', () => {
  const f = createField(10, 10, 10);
  fillBox(f, 2, 3, 4, 5, 6, 7, 1);
  const b = cavityBounds(f);
  assert.deepEqual(b, { minX: 2, minY: 3, minZ: 4, maxX: 5, maxY: 6, maxZ: 7 });
  assert.equal(f.voxel, 0.5);
});

function reachableCount(r) {
  let n = 0;
  for (const v of r.reachable) n += v;
  return n;
}
