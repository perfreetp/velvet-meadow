// 铣削死角分析：模拟三轴立铣刀从 +Z 方向自上而下开粗。
// 刀具半径决定侧刃能进入的最小横向开口，刀长决定最大可加工深度。
// 型腔体素中刀具到达不了的格子标记为死角（需拆电极/EDM 或改工艺）。
import { getV, idx, inside } from './core.js';

/**
 * @param field 体素场（1=型腔）
 * @param toolRadiusMm 刀具半径 mm
 * @param toolLengthMm 有效刀长 mm（刃长，从毛坯顶面计）
 * @returns { mask: Uint8Array(与 field.data 等长，1=死角), reachable, dead, toolRadiusVox, toolLengthVox }
 */
export function analyzeDeadAngles(field, toolRadiusMm, toolLengthMm) {
  const { nx, ny, nz } = field;
  const rVox = Math.max(0, Math.floor(toolRadiusMm / field.voxel - 1e-9));
  const depthMax = Math.ceil(toolLengthMm / field.voxel);
  const reachable = new Uint8Array(field.data.length);

  // 圆盘偏移表
  const offsets = [];
  const r2 = rVox * rVox;
  for (let dy = -rVox; dy <= rVox; dy++) {
    for (let dx = -rVox; dx <= rVox; dx++) {
      if (dx * dx + dy * dy <= r2) offsets.push([dx, dy]);
    }
  }

  // reachZ(x,y)：该 (x,y) 柱当前可加工到的最深层（含），-1 表示尚未到达
  const reachZ = new Int32Array(nx * ny).fill(-1);

  // 顶层种子：z = nz-1 层型腔，且圆盘内同层全部为型腔
  const top = nz - 1;
  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      if (getV(field, x, y, top) !== 1) continue;
      if (discClear(field, x, y, top, offsets)) {
        reachZ[y * nx + x] = top;
        reachable[idx(field, x, y, top)] = 1;
      }
    }
  }

  // 自上而下逐层腐蚀传播
  for (let z = top - 1; z >= 0; z--) {
    for (let y = 0; y < ny; y++) {
      for (let x = 0; x < nx; x++) {
        const col = y * nx + x;
        if (reachZ[col] !== z + 1) continue; // 上一层不可达则无法下切
        const depthFromTop = top - z + 1;
        if (depthFromTop > depthMax) continue; // 超刀长
        if (getV(field, x, y, z) !== 1) continue;
        if (!discClear(field, x, y, z, offsets)) continue; // 侧刃被实体挡住
        reachZ[col] = z;
        reachable[idx(field, x, y, z)] = 1;
      }
    }
  }

  // 死角 = 型腔且不可达
  const mask = new Uint8Array(field.data.length);
  let dead = 0, cavity = 0;
  for (let i = 0; i < field.data.length; i++) {
    if (field.data[i] === 1) {
      cavity++;
      if (!reachable[i]) { mask[i] = 1; dead++; }
    }
  }
  return {
    mask,
    reachable,
    dead,
    cavity,
    toolRadiusVox: rVox,
    toolLengthVox: depthMax
  };
}

function discClear(field, cx, cy, z, offsets) {
  for (const [dx, dy] of offsets) {
    const x = cx + dx, y = cy + dy;
    if (!inside(field, x, y, z)) return false;
    if (field.data[idx(field, x, y, z)] !== 1) return false;
  }
  return true;
}

/** 死角体素的分层统计，供层列表显示角标 */
export function deadByLayer(field, mask) {
  const counts = new Int32Array(field.nz);
  for (let z = 0; z < field.nz; z++) {
    let n = 0;
    const base = z * field.nx * field.ny;
    for (let i = 0; i < field.nx * field.ny; i++) n += mask[base + i];
    counts[z] = n;
  }
  return counts;
}
