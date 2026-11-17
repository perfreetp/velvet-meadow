import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createField, fillBox } from '../src/lib/voxel/core.js';
import { buildMesh } from '../src/lib/voxel/mesh.js';
import { renderScene } from '../src/lib/voxel/render3d.js';
import { orbitView } from '../src/lib/voxel/math3d.js';
import { analyzeDeadAngles } from '../src/lib/voxel/deadangle.js';

// 最小 2D context 假实现（覆盖渲染器实际调用的 API）
function fakeCtx(w, h) {
  const calls = { putImageData: 0, strokes: 0, paths: 0, lastImage: null };
  return {
    calls,
    canvas: { width: w, height: h },
    createImageData: (ww, hh) => ({ width: ww, height: hh, data: new Uint8ClampedArray(ww * hh * 4) }),
    putImageData(img) { calls.putImageData++; calls.lastImage = img; },
    save() {}, restore() {},
    set strokeStyle(_) {}, set fillStyle(_) {}, set lineWidth(_) {}, set lineDashOffset(_) {},
    setLineDash() {},
    beginPath() { calls.paths++; },
    moveTo() {}, lineTo() {}, stroke() { calls.strokes++; },
    fillRect() {}, fillText() {},
    set font(_) {}
  };
}

test('软件光栅器：完整场景可渲染并产生像素写入', () => {
  const f = createField(12, 12, 12);
  fillBox(f, 3, 3, 2, 8, 8, 9, 1);
  const built = buildMesh(f, { angleThresholdDeg: 20, triLimit: 300000 });
  assert.ok(built.mesh.triCount > 0);

  const w = 240, h = 180;
  const ctx = fakeCtx(w, h);
  const view = orbitView([3, 3, 3], 0.7, 0.5, 40);
  renderScene(ctx, w, h, {
    meshes: [{ positions: built.mesh.positions, indices: built.mesh.indices, color: [90, 170, 200] }],
    view,
    boundsMm: [6, 6, 6]
  });
  assert.equal(ctx.calls.putImageData, 1);
  assert.ok(ctx.calls.strokes >= 1, '包围盒线框应被绘制');
  // 统计与背景色（RGB 均 < 60）不同的像素，确认几何体实际被光栅化
  const d = ctx.calls.lastImage.data;
  let lit = 0;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i] > 60 || d[i + 1] > 60 || d[i + 2] > 60) lit++;
  }
  assert.ok(lit > 200, `应有可观数量的型腔像素，实际 ${lit}`);
});

test('渲染器支持死角叠加网格同帧分色', () => {
  const f = createField(10, 10, 10);
  fillBox(f, 4, 4, 1, 5, 5, 9, 1);
  const dead = analyzeDeadAngles(f, 2, 100);
  const deadField = createField(10, 10, 10);
  deadField.data.set(dead.mask);
  const base = buildMesh(f).mesh;
  const deadMesh = buildMesh(deadField).mesh;

  const ctx = fakeCtx(200, 160);
  const view = orbitView([2.5, 2.5, 2.5], 0.3, 0.6, 36);
  renderScene(ctx, 200, 160, {
    meshes: [
      { positions: base.positions, indices: base.indices, color: [70, 90, 110], wire: true },
      { positions: deadMesh.positions, indices: deadMesh.indices, color: [220, 70, 70] }
    ],
    view,
    boundsMm: [5, 5, 5]
  });
  assert.equal(ctx.calls.putImageData, 1);
});
