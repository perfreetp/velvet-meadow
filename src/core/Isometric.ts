// 等轴测投影与体素 DDA 射线拾取
import type { VoxelGrid, VoxelCoord } from './VoxelGrid';

const COS30 = Math.cos(Math.PI / 6); // √3/2
const SIN30 = 0.5;

export interface IsoTransform {
  scale: number;
  ox: number; // 屏幕平移
  oy: number;
}

export function isoProject(x: number, y: number, z: number, t: IsoTransform): { x: number; y: number } {
  return {
    x: t.ox + (x - y) * COS30 * t.scale,
    y: t.oy + ((x + y) * SIN30 - z) * t.scale
  };
}

export interface Ray3 {
  origin: { x: number; y: number; z: number };
  dir: { x: number; y: number; z: number };
}

/**
 * 屏幕点 -> 三维射线。
 * 等轴测下视线方向固定为 (1,1,1) 的反方向；取射线入口在 z=nz 平面上。
 */
export function screenToRay(sx: number, sy: number, t: IsoTransform, nz: number): Ray3 {
  const A = (sx - t.ox) / (COS30 * t.scale); // x - y
  const B0 = (sy - t.oy) / t.scale; // b(x+y) - z
  const z0 = nz;
  const B = (B0 + z0) / SIN30; // x + y 在 z=nz 平面
  const origin = { x: (A + B) / 2, y: (B - A) / 2, z: z0 };
  const inv = 1 / Math.sqrt(3);
  return { origin, dir: { x: -inv, y: -inv, z: -inv } };
}

export interface RayHit {
  coord: VoxelCoord;
  normal: [number, number, number];
}

/** Amanatides–Woo 体素 DDA，返回第一个非空格与入射面法线 */
export function raycastVoxel(grid: VoxelGrid, ray: Ray3, maxDist = 4096): RayHit | null {
  const { origin, dir } = ray;
  let x = Math.floor(origin.x);
  let y = Math.floor(origin.y);
  let z = Math.floor(origin.z);

  const stepX = dir.x > 0 ? 1 : dir.x < 0 ? -1 : 0;
  const stepY = dir.y > 0 ? 1 : dir.y < 0 ? -1 : 0;
  const stepZ = dir.z > 0 ? 1 : dir.z < 0 ? -1 : 0;

  const tDeltaX = stepX !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = stepY !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = stepZ !== 0 ? Math.abs(1 / dir.z) : Infinity;

  const boundary = (o: number, s: number, i: number): number => (s > 0 ? i + 1 - o : o - i);
  let tMaxX = stepX !== 0 ? boundary(origin.x, stepX, x) / Math.abs(dir.x) : Infinity;
  let tMaxY = stepY !== 0 ? boundary(origin.y, stepY, y) / Math.abs(dir.y) : Infinity;
  let tMaxZ = stepZ !== 0 ? boundary(origin.z, stepZ, z) / Math.abs(dir.z) : Infinity;

  let normal: [number, number, number] = [0, 0, 0];
  let t = 0;
  // 若起点已在实体格内，直接命中
  if (grid.inside(x, y, z) && grid.get(x, y, z) !== 0) {
    return { coord: { x, y, z }, normal: [0, 0, -1] };
  }
  while (t <= maxDist) {
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX;
      t = tMaxX;
      tMaxX += tDeltaX;
      normal = [-stepX, 0, 0];
    } else if (tMaxY < tMaxZ) {
      y += stepY;
      t = tMaxY;
      tMaxY += tDeltaY;
      normal = [0, -stepY, 0];
    } else {
      z += stepZ;
      t = tMaxZ;
      tMaxZ += tDeltaZ;
      normal = [0, 0, -stepZ];
    }
    if (!grid.inside(x, y, z)) {
      if (x < -1 || y < -1 || z < -1 || x > grid.nx || y > grid.ny || z > grid.nz) return null;
      continue;
    }
    if (grid.get(x, y, z) !== 0) return { coord: { x, y, z }, normal };
  }
  return null;
}

/** 沿射线推进到下一个空格（用于擦除时定位表面外的目标），返回命中或表面相邻空 */
export function rayTarget(grid: VoxelGrid, ray: Ray3, erase: boolean): VoxelCoord | null {
  const hit = raycastVoxel(grid, ray);
  if (!hit) return null;
  if (!erase) {
    // 增材：命中面外侧的空格
    return {
      x: hit.coord.x + hit.normal[0],
      y: hit.coord.y + hit.normal[1],
      z: hit.coord.z + hit.normal[2]
    };
  }
  return hit.coord;
}
