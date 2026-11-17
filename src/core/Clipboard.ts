// 框选复制 / 粘贴 / 整块平移
import type { VoxelGrid, VoxelCoord } from './VoxelGrid';

export interface Box {
  x0: number;
  y0: number;
  z0: number;
  x1: number; // 含
  y1: number;
  z1: number;
}

export interface ClipboardData {
  sx: number;
  sy: number;
  sz: number;
  /** 局部坐标（相对块原点）-> 材质 */
  cells: { x: number; y: number; z: number; v: number }[];
}

export function normalizeBox(a: VoxelCoord, b: VoxelCoord): Box {
  return {
    x0: Math.min(a.x, b.x),
    y0: Math.min(a.y, b.y),
    z0: Math.min(a.z, b.z),
    x1: Math.max(a.x, b.x),
    y1: Math.max(a.y, b.y),
    z1: Math.max(a.z, b.z)
  };
}

export function boxCoords(box: Box): VoxelCoord[] {
  const out: VoxelCoord[] = [];
  for (let x = box.x0; x <= box.x1; x++)
    for (let y = box.y0; y <= box.y0 + (box.y1 - box.y0); y++)
      for (let z = box.z0; z <= box.z1; z++) out.push({ x, y, z });
  return out;
}

export function copyBox(grid: VoxelGrid, box: Box): ClipboardData {
  const cells: ClipboardData['cells'] = [];
  for (let x = box.x0; x <= box.x1; x++)
    for (let y = box.y0; y <= box.y1; y++)
      for (let z = box.z0; z <= box.z1; z++) {
        const v = grid.get(x, y, z);
        if (v !== 0) cells.push({ x: x - box.x0, y: y - box.y0, z: z - box.z0, v });
      }
  return {
    sx: box.x1 - box.x0 + 1,
    sy: box.y1 - box.y0 + 1,
    sz: box.z1 - box.z0 + 1,
    cells
  };
}

/** 粘贴到目标原点；overwrite=false 时不覆盖已有实体 */
export function pasteClipboard(
  grid: VoxelGrid,
  clip: ClipboardData,
  origin: VoxelCoord,
  overwrite = true
): number {
  let n = 0;
  for (const c of clip.cells) {
    const x = origin.x + c.x;
    const y = origin.y + c.y;
    const z = origin.z + c.z;
    if (!grid.inside(x, y, z)) continue;
    if (!overwrite && grid.get(x, y, z) !== 0) continue;
    grid.set(x, y, z, c.v);
    n++;
  }
  return n;
}

/** 整块平移：取出块内容（原位移空），写到偏移目标，返回实际移动格数 */
export function translateBox(grid: VoxelGrid, box: Box, dx: number, dy: number, dz: number): number {
  const clip = copyGridBox(grid, box);
  // 清除原区域
  for (let x = box.x0; x <= box.x1; x++)
    for (let y = box.y0; y <= box.y1; y++)
      for (let z = box.z0; z <= box.z1; z++) grid.set(x, y, z, 0);
  return pasteClipboard(grid, clip, { x: box.x0 + dx, y: box.y0 + dy, z: box.z0 + dz });
}

function copyGridBox(grid: VoxelGrid, box: Box): ClipboardData {
  return copyBox(grid, box);
}
