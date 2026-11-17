// 三维工作线程：持有 OffscreenCanvas，所有网格构建、减面、软件渲染、OBJ 导出都在这里，
// 不阻塞主线程的切片编辑。
import { decodeRLE, createField, fieldBoundsMm } from '../lib/voxel/core.js';
import { buildMesh, exportOBJ } from '../lib/voxel/mesh.js';
import { diffFields } from '../lib/voxel/selection.js';
import { renderScene } from '../lib/voxel/render3d.js';
import { orbitView } from '../lib/voxel/math3d.js';

const state = {
  canvas: null,
  ctx: null,
  w: 640,
  h: 480,
  dims: null,
  base: null,          // 当前版本 buildMesh 结果
  camera: { yaw: 0.7, pitch: 0.5, dist: 200, target: [0, 0, 0] },
  wire: false,
  overlays: [],        // [{mesh,color,wire,wireColor}]
  mode: 'solid'        // solid | dead | diff
};

function post(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

// 对带 reqId 的请求做应答（ resolve 客户端 Promise ），同时可被监听器广播
function reply(reqId, type, payload = {}) {
  self.postMessage({ type, reqId, ...payload });
}

function fieldFromMask(mask, dims) {
  const f = createField(dims.nx, dims.ny, dims.nz);
  f.data.set(mask);
  return f;
}

function fitCamera(dims, field) {
  const blank = fieldBoundsMm({ ...dims, voxel: 0.5 });
  // 以型腔包围盒取景，型腔为空时回退到毛坯
  let cx = blank.x / 2, cy = blank.y / 2, cz = blank.z / 2, span = Math.max(blank.x, blank.y, blank.z);
  if (field) {
    let minX = dims.nx, minY = dims.ny, minZ = dims.nz, maxX = -1, maxY = -1, maxZ = -1;
    for (let z = 0; z < dims.nz; z++)
      for (let y = 0; y < dims.ny; y++)
        for (let x = 0; x < dims.nx; x++)
          if (field.data[(z * dims.ny + y) * dims.nx + x] === 1) {
            if (x < minX) minX = x; if (x > maxX) maxX = x;
            if (y < minY) minY = y; if (y > maxY) maxY = y;
            if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
          }
    if (maxZ >= 0) {
      cx = (minX + maxX + 1) * 0.25;
      cy = (minY + maxY + 1) * 0.25;
      cz = (minZ + maxZ + 1) * 0.25;
      span = Math.max((maxX - minX + 1) * 0.5, (maxY - minY + 1) * 0.5, (maxZ - minZ + 1) * 0.5);
    }
  }
  state.camera.target = [cx, cy, cz];
  // 按视野取景：dist ≈ span / (2·tan(fov/2))，0.85 倍让型腔占画面主体
  state.camera.dist = Math.max((span / (2 * Math.tan((45 * Math.PI) / 360))) * 0.85, 5);
}

function draw() {
  if (!state.canvas || !state.dims) return;
  const b = fieldBoundsMm({ ...state.dims, voxel: 0.5 });
  const view = orbitView(
    state.camera.target,
    state.camera.yaw,
    state.camera.pitch,
    state.camera.dist
  );
  const meshes = [];
  if (state.base) {
    if (state.mode === 'solid') {
      meshes.push({
        positions: state.base.mesh.positions,
        indices: state.base.mesh.indices,
        color: [90, 170, 200],
        wire: state.wire,
        wireColor: [200, 230, 245]
      });
    } else {
      // dead / diff 模式下基础体改线框，保证内部叠加体可见
      meshes.push({
        positions: state.base.mesh.positions,
        indices: state.base.mesh.indices,
        color: [70, 90, 110],
        wire: true,
        wireColor: [150, 170, 190]
      });
    }
  }
  for (const o of state.overlays) meshes.push(o);
  renderScene(state.ctx, state.w, state.h, { meshes, view, boundsMm: [b.x, b.y, b.z] });
}

self.onmessage = async (ev) => {
  const msg = ev.data;
  try {
    switch (msg.type) {
      case 'init': {
        state.canvas = msg.canvas;
        state.ctx = state.canvas.getContext('2d');
        state.w = msg.w || state.canvas.width;
        state.h = msg.h || state.canvas.height;
        state.canvas.width = state.w;
        state.canvas.height = state.h;
        post('ready');
        break;
      }
      case 'resize': {
        state.w = msg.w; state.h = msg.h;
        state.canvas.width = msg.w; state.canvas.height = msg.h;
        draw();
        break;
      }
      case 'camera': {
        Object.assign(state.camera, msg.camera);
        draw();
        break;
      }
      case 'getCamera': {
        self.postMessage({ type: 'cameraState', reqId: msg.reqId, camera: { ...state.camera } });
        break;
      }
      case 'refit': {
        if (state.lastField) {
          fitCamera(state.dims, state.lastField);
          draw();
        }
        reply(msg.reqId, 'cameraState', { camera: { ...state.camera } });
        break;
      }
      case 'wire': {
        state.wire = !!msg.on;
        draw();
        break;
      }
      case 'field': {
        post('busy', { label: '网格构建与减面中…' });
        const dims = msg.dims;
        state.dims = dims;
        const field = decodeRLE(msg.rle, dims.nx, dims.ny, dims.nz);
        state.lastField = field;
        if (msg.refit) fitCamera(dims, field);
        const built = buildMesh(field, {
          angleThresholdDeg: msg.angleThresholdDeg ?? 15,
          triLimit: 300000
        });
        state.base = built;
        state.mode = 'solid';
        state.overlays = [];
        draw();
        reply(msg.reqId, 'stats', { stats: built.stats, camera: msg.refit ? { ...state.camera } : null });
        break;
      }
      case 'dead': {
        // msg.mask: 死角体素掩码 RLE 解出后的完整 Uint8（由主线程直接传掩码字节）
        if (!state.dims) break;
        state.overlays = state.overlays.filter((o) => o.kind !== 'dead');
        if (msg.on && msg.mask) {
          post('busy', { label: '死角网格构建中…' });
          const f = fieldFromMask(msg.mask, state.dims);
          const built = buildMesh(f, { angleThresholdDeg: 30, triLimit: 300000 });
          state.overlays.push({
            kind: 'dead',
            positions: built.mesh.positions,
            indices: built.mesh.indices,
            color: [220, 70, 70]
          });
          state.mode = 'dead';
        } else {
          state.mode = 'solid';
        }
        draw();
        reply(msg.reqId, 'idle');
        break;
      }
      case 'diff': {
        if (!state.dims) break;
        state.overlays = state.overlays.filter((o) => o.kind !== 'add' && o.kind !== 'rem');
        if (msg.on && msg.rleA && msg.rleB) {
          post('busy', { label: '版本差异对比中…' });
          const a = decodeRLE(msg.rleA, state.dims.nx, state.dims.ny, state.dims.nz);
          const b = decodeRLE(msg.rleB, state.dims.nx, state.dims.ny, state.dims.nz);
          const d = diffFields(a, b);
          const addMesh = buildMesh(fieldFromMask(d.added, state.dims), { angleThresholdDeg: 30, triLimit: 300000 });
          const remMesh = buildMesh(fieldFromMask(d.removed, state.dims), { angleThresholdDeg: 30, triLimit: 300000 });
          state.overlays.push(
            { kind: 'add', positions: addMesh.mesh.positions, indices: addMesh.mesh.indices, color: [70, 205, 110] },
            { kind: 'rem', positions: remMesh.mesh.positions, indices: remMesh.mesh.indices, color: [235, 130, 45] }
          );
          state.mode = 'diff';
          draw();
          post('diffStats', { addedCount: d.addedCount, removedCount: d.removedCount });
        } else {
          state.mode = 'solid';
          draw();
        }
        reply(msg.reqId, 'idle');
        break;
      }
      case 'render': {
        draw();
        break;
      }
      case 'export': {
        if (!state.base) throw new Error('尚无网格可导出');
        const obj = exportOBJ(state.base.mesh, { ...msg.meta, ...state.dims });
        reply(msg.reqId, 'obj', { text: obj, stats: state.base.stats });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    post('error', { message: err.message, stack: err.stack });
  }
};
