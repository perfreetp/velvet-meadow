// 框选 / 复制粘贴 / 版本差异
import { cloneField, getV, idx, inside } from './core.js';

/** 规范化矩形（格坐标，含端点） */
export function normRect(a, b) {
  return {
    x0: Math.min(a.x, b.x), y0: Math.min(a.y, b.y),
    x1: Math.max(a.x, b.x), y1: Math.max(a.y, b.y)
  };
}

/**
 * 复制矩形区域内的型腔体素。z0/z1 给出层范围（含）。
 * 返回 { size:[sx,sy,sz], voxels:[[lx,ly,lz]...] 局部坐标 }
 */
export function copyRegion(field, rect, z0, z1) {
  const { x0, y0, x1, y1 } = rect;
  const sx = x1 - x0 + 1, sy = y1 - y0 + 1, sz = z1 - z0 + 1;
  const voxels = [];
  for (let z = z0; z <= z1; z++) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (getV(field, x, y, z) === 1) voxels.push([x - x0, y - y0, z - z0]);
      }
    }
  }
  return { origin: [x0, y0, z0], size: [sx, sy, sz], voxels };
}

/**
 * 粘贴：按偏移（格坐标，可为负）写入副本。
 * mode: 'union' 只叠加型腔；'replace' 目标框内先清空再写入。
 * 返回实际写入格数。
 */
export function pasteRegion(field, clip, offset, mode = 'union') {
  const [ox, oy, oz] = offset;
  const tx0 = clip.origin[0] + ox, ty0 = clip.origin[1] + oy, tz0 = clip.origin[2] + oz;
  if (mode === 'replace') {
    const [sx, sy, sz] = clip.size;
    for (let z = 0; z < sz; z++) {
      for (let y = 0; y < sy; y++) {
        for (let x = 0; x < sx; x++) {
          const gx = tx0 + x, gy = ty0 + y, gz = tz0 + z;
          if (inside(field, gx, gy, gz)) field.data[idx(field, gx, gy, gz)] = 0;
        }
      }
    }
  }
  let n = 0;
  for (const [lx, ly, lz] of clip.voxels) {
    const gx = tx0 + lx, gy = ty0 + ly, gz = tz0 + lz;
    if (inside(field, gx, gy, gz)) {
      const i = idx(field, gx, gy, gz);
      if (field.data[i] === 0) { field.data[i] = 1; n++; }
    }
  }
  return n;
}

/** 两版场差异：added = B 有 A 无；removed = A 有 B 无（仅统计型腔格） */
export function diffFields(fieldA, fieldB) {
  if (fieldA.data.length !== fieldB.data.length) {
    throw new Error('差异比较要求两版场尺寸一致');
  }
  const added = new Uint8Array(fieldA.data.length);
  const removed = new Uint8Array(fieldA.data.length);
  let nAdd = 0, nRem = 0;
  for (let i = 0; i < fieldA.data.length; i++) {
    const a = fieldA.data[i], b = fieldB.data[i];
    if (!a && b) { added[i] = 1; nAdd++; }
    else if (a && !b) { removed[i] = 1; nRem++; }
  }
  return { added, removed, addedCount: nAdd, removedCount: nRem };
}

/** 把 RLE 快照差异渲染所需的掩码投影到指定层（2D） */
export function maskLayer(mask, field, z) {
  const out = new Uint8Array(field.nx * field.ny);
  const base = z * field.nx * field.ny;
  for (let i = 0; i < out.length; i++) out[i] = mask[base + i];
  return out;
}

export { cloneField };
