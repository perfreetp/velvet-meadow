// 体素网格：Uint8Array 稠密存储，0 = 空；索引顺序 x -> y -> z
import type { Material } from '../types';

export class VoxelGrid {
  readonly nx: number;
  readonly ny: number;
  readonly nz: number;
  readonly cell: number;
  data: Uint8Array;

  constructor(nx: number, ny: number, nz: number, cell = 1, data?: Uint8Array) {
    this.nx = nx;
    this.ny = ny;
    this.nz = nz;
    this.cell = cell;
    this.data = data ?? new Uint8Array(nx * ny * nz);
  }

  index(x: number, y: number, z: number): number {
    return (z * this.ny + y) * this.nx + x;
  }

  inside(x: number, y: number, z: number): boolean {
    return x >= 0 && y >= 0 && z >= 0 && x < this.nx && y < this.ny && z < this.nz;
  }

  get(x: number, y: number, z: number): number {
    if (!this.inside(x, y, z)) return 0;
    return this.data[this.index(x, y, z)];
  }

  set(x: number, y: number, z: number, v: number): void {
    if (this.inside(x, y, z)) this.data[this.index(x, y, z)] = v;
  }

  clone(): VoxelGrid {
    return new VoxelGrid(this.nx, this.ny, this.nz, this.cell, this.data.slice());
  }

  countVoxels(): number {
    let n = 0;
    for (let i = 0; i < this.data.length; i++) if (this.data[i] !== 0) n++;
    return n;
  }

  countByMaterial(materials: Material[]): Map<number, number> {
    const m = new Map<number, number>();
    for (const v of this.data) {
      if (v !== 0) m.set(v, (m.get(v) ?? 0) + 1);
    }
    void materials;
    return m;
  }

  toBase64(): string {
    let bin = '';
    const d = this.data;
    const CHUNK = 0x8000;
    for (let i = 0; i < d.length; i += CHUNK) {
      bin += String.fromCharCode(...d.subarray(i, i + CHUNK));
    }
    return btoa(bin);
  }

  static fromBase64(b64: string, nx: number, ny: number, nz: number, cell: number): VoxelGrid {
    const bin = atob(b64);
    const data = new Uint8Array(nx * ny * nz);
    for (let i = 0; i < bin.length && i < data.length; i++) data[i] = bin.charCodeAt(i);
    return new VoxelGrid(nx, ny, nz, cell, data);
  }
}

/** 体素坐标（整数格） */
export interface VoxelCoord {
  x: number;
  y: number;
  z: number;
}

/** 对一组格点应用材质（或擦除），返回实际发生变化的坐标->旧值 */
export function applyVoxelEdit(
  grid: VoxelGrid,
  coords: VoxelCoord[],
  value: number
): Map<number, number> {
  const changed = new Map<number, number>();
  for (const c of coords) {
    if (!grid.inside(c.x, c.y, c.z)) continue;
    const idx = grid.index(c.x, c.y, c.z);
    const old = grid.data[idx];
    if (old === value) continue;
    if (!changed.has(idx)) changed.set(idx, old);
    grid.data[idx] = value;
  }
  return changed;
}

/** 生成笔刷覆盖的格点 */
export function brushCoords(
  tool: 'single' | 'rect' | 'sphere',
  center: VoxelCoord,
  radius: number
): VoxelCoord[] {
  const out: VoxelCoord[] = [];
  const r = Math.max(0, Math.floor(radius));
  if (tool === 'single') return [center];
  if (tool === 'rect') {
    for (let x = center.x - r; x <= center.x + r; x++)
      for (let y = center.y - r; y <= center.y + r; y++)
        for (let z = center.z - r; z <= center.z + r; z++) out.push({ x, y, z });
    return out;
  }
  // sphere
  const r2 = (r + 0.3) * (r + 0.3);
  for (let x = -r; x <= r; x++)
    for (let y = -r; y <= r; y++)
      for (let z = -r; z <= r; z++) {
        if (x * x + y * y + z * z <= r2) out.push({ x: center.x + x, y: center.y + y, z: center.z + z });
      }
  return out;
}
