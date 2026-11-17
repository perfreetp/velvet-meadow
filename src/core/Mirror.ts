// X / Y 轴镜像：一侧改动自动同步到镜像侧
import type { VoxelGrid, VoxelCoord } from './VoxelGrid';
import { applyVoxelEdit } from './VoxelGrid';

export function mirrorCoordX(grid: VoxelGrid, c: VoxelCoord): VoxelCoord {
  return { x: grid.nx - 1 - c.x, y: c.y, z: c.z };
}

export function mirrorCoordY(grid: VoxelGrid, c: VoxelCoord): VoxelCoord {
  return { x: c.x, y: grid.ny - 1 - c.y, z: c.z };
}

/** 按镜像开关展开坐标集合（去重） */
export function expandMirror(
  grid: VoxelGrid,
  coords: VoxelCoord[],
  mirrorX: boolean,
  mirrorY: boolean
): VoxelCoord[] {
  if (!mirrorX && !mirrorY) return coords;
  const seen = new Set<number>();
  const out: VoxelCoord[] = [];
  const push = (c: VoxelCoord) => {
    if (!grid.inside(c.x, c.y, c.z)) return;
    const k = grid.index(c.x, c.y, c.z);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  };
  for (const c of coords) {
    push(c);
    if (mirrorX) push(mirrorCoordX(grid, c));
    if (mirrorY) push(mirrorCoordY(grid, c));
    if (mirrorX && mirrorY) push(mirrorCoordY(grid, mirrorCoordX(grid, c)));
  }
  return out;
}

export function editWithMirror(
  grid: VoxelGrid,
  coords: VoxelCoord[],
  value: number,
  mirrorX: boolean,
  mirrorY: boolean
): Map<number, number> {
  return applyVoxelEdit(grid, expandMirror(grid, coords, mirrorX, mirrorY), value);
}
