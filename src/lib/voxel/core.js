// 体素场核心数据结构：按 0.5mm 一格的分层二值体素场
// 值 1 = 型腔（被挖去的材料），0 = 钢料实体
export const VOXEL_SIZE = 0.5;

export function createField(nx, ny, nz) {
  return {
    nx, ny, nz,
    voxel: VOXEL_SIZE,
    data: new Uint8Array(nx * ny * nz)
  };
}

export function cloneField(f) {
  return { nx: f.nx, ny: f.ny, nz: f.nz, voxel: f.voxel, data: new Uint8Array(f.data) };
}

export function idx(f, x, y, z) {
  return (z * f.ny + y) * f.nx + x;
}

export function inside(f, x, y, z) {
  return x >= 0 && y >= 0 && z >= 0 && x < f.nx && y < f.ny && z < f.nz;
}

export function getV(f, x, y, z) {
  if (!inside(f, x, y, z)) return 0;
  return f.data[idx(f, x, y, z)];
}

export function setV(f, x, y, z, v) {
  if (!inside(f, x, y, z)) return false;
  const i = idx(f, x, y, z);
  if (f.data[i] === v) return false;
  f.data[i] = v;
  return true;
}

export function countVoxels(f) {
  let n = 0;
  for (let i = 0; i < f.data.length; i++) n += f.data[i];
  return n;
}

export function fieldBoundsMm(f) {
  return { x: f.nx * f.voxel, y: f.ny * f.voxel, z: f.nz * f.voxel };
}

/**
 * 带 X/Y 镜像的单点写入。镜像格坐标：nx-1-x / ny-1-y。
 * 返回真正发生变化的格点列表。
 */
export function mirrorSet(f, x, y, z, v, mirrorX, mirrorY) {
  const changed = [];
  const xs = mirrorX ? [x, f.nx - 1 - x] : [x];
  const ys = mirrorY ? [y, f.ny - 1 - y] : [y];
  for (const xx of xs) {
    for (const yy of ys) {
      if (inside(f, xx, yy, z) && setV(f, xx, yy, z, v)) changed.push(idx(f, xx, yy, z));
    }
  }
  return changed;
}

/** 圆盘画笔：在 z 层以 (cx,cy) 为中心、半径 r（格）内写入 v，支持镜像 */
export function stampDisc(f, cx, cy, z, radius, v, mirrorX, mirrorY) {
  const r2 = radius * radius;
  const r = Math.ceil(radius);
  let changedCount = 0;
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy > r2) continue;
      changedCount += mirrorSet(f, cx + dx, cy + dy, z, v, mirrorX, mirrorY).length;
    }
  }
  return changedCount;
}

/** 矩形区域填充（框选粘贴用），值统一为 v */
export function fillBox(f, x0, y0, z0, x1, y1, z1, v) {
  let n = 0;
  for (let z = z0; z <= z1; z++) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (setV(f, x, y, z, v)) n++;
      }
    }
  }
  return n;
}

/** 整层清空 */
export function clearLayer(f, z) {
  f.data.fill(0, z * f.ny * f.nx, (z + 1) * f.ny * f.nx);
}

// ---------- RLE + varint 快照（版本建档/撤销栈/IndexedDB 持久化） ----------

function writeVarint(arr, n) {
  while (n > 127) {
    arr.push((n & 0x7f) | 0x80);
    n >>>= 0;
    n = Math.floor(n / 128);
  }
  arr.push(n & 0x7f);
}

function readVarint(bytes, p) {
  let shift = 0, result = 0, b;
  do {
    b = bytes[p.pos++];
    result |= (b & 0x7f) << shift;
    shift += 7;
  } while (b & 0x80);
  return result >>> 0;
}

/** 二值场 RLE：交替 (value:1bit 并入 count 的 varint)，用 count<<1 | value 编码 */
export function encodeRLE(f) {
  const out = [];
  const d = f.data;
  let run = 0, cur = d[0];
  for (let i = 0; i < d.length; i++) {
    if (d[i] === cur && run < 0xffffffff) {
      run++;
    } else {
      writeVarint(out, (run << 1) | cur);
      cur = d[i];
      run = 1;
    }
  }
  if (run > 0) writeVarint(out, (run << 1) | cur);
  return new Uint8Array(out);
}

export function decodeRLE(bytes, nx, ny, nz) {
  const f = createField(nx, ny, nz);
  const p = { pos: 0 };
  let w = 0;
  while (p.pos < bytes.length) {
    const packed = readVarint(bytes, p);
    const value = packed & 1;
    const count = packed >>> 1;
    f.data.fill(value, w, w + count);
    w += count;
  }
  if (w !== f.data.length) throw new Error(`RLE 解码长度不符: ${w} != ${f.data.length}`);
  return f;
}

/** 列出型腔体素包围盒（格坐标，含），无型腔时返回 null */
export function cavityBounds(f) {
  let minX = f.nx, minY = f.ny, minZ = f.nz, maxX = -1, maxY = -1, maxZ = -1;
  for (let z = 0; z < f.nz; z++) {
    for (let y = 0; y < f.ny; y++) {
      for (let x = 0; x < f.nx; x++) {
        if (!getV(f, x, y, z)) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      }
    }
  }
  return maxZ < 0 ? null : { minX, minY, minZ, maxX, maxY, maxZ };
}
