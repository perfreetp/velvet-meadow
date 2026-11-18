import type { ElevPoint, SectionSample, TerrainMeshData, Vec2 } from '../../types';
import { pointInPolygon } from './polygon';
import { v2 } from './spline';

/**
 * 基于断面高程点构建规则网格地形（IDW 反距离加权）。
 * 网格范围由边界 polygon 决定（无边界时取点集外包矩形），
 * polygon 外的网格单元标记为无效。
 */
export function buildTerrainMesh(
  points: ElevPoint[],
  polygon: Vec2[] | null,
  spacing: number,
  idwPower: number,
  idwRadius: number
): TerrainMeshData | null {
  if (points.length < 3) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (polygon && polygon.length >= 3) {
    for (const p of polygon) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  // 外扩半个格距，避免边界采样丢失
  minX -= spacing;
  minY -= spacing;
  maxX += spacing;
  maxY += spacing;

  const cols = Math.max(2, Math.ceil((maxX - minX) / spacing) + 1);
  const rows = Math.max(2, Math.ceil((maxY - minY) / spacing) + 1);
  const count = cols * rows;
  const heights = new Float32Array(count).fill(NaN);
  const valid = new Uint8Array(count);
  const slopes = new Float32Array(count);
  const curvatures = new Float32Array(count);

  // 预建网格分桶，加速半径搜索
  const bucket = new Map<number, number[]>();
  const bkey = (gx: number, gy: number) => gy * 100000 + gx;
  const span = Math.max(idwRadius, spacing);
  const nbx = Math.ceil((maxX - minX) / span) + 1;
  void nbx;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const gx = Math.floor((p.x - minX) / span);
    const gy = Math.floor((p.y - minY) / span);
    const k = bkey(gx, gy);
    let arr = bucket.get(k);
    if (!arr) {
      arr = [];
      bucket.set(k, arr);
    }
    arr.push(i);
  }

  let minZ = Infinity;
  let maxZ = -Infinity;
  const radiusSq = idwRadius * idwRadius;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = minX + c * spacing;
      const y = minY + r * spacing;
      if (polygon && polygon.length >= 3 && !pointInPolygon({ x, y }, polygon)) continue;

      const gx = Math.floor((x - minX) / span);
      const gy = Math.floor((y - minY) / span);
      let wSum = 0;
      let zSum = 0;
      let exact: ElevPoint | null = null;
      const ring = Math.ceil(idwRadius / span);
      for (let by = gy - ring; by <= gy + ring && !exact; by++) {
        for (let bx = gx - ring; bx <= gx + ring; bx++) {
          const arr = bucket.get(bkey(bx, by));
          if (!arr) continue;
          for (const pi of arr) {
            const p = points[pi];
            const dx = p.x - x;
            const dy = p.y - y;
            const dSq = dx * dx + dy * dy;
            if (dSq > radiusSq) continue;
            if (dSq < 1e-6) {
              exact = p;
              break;
            }
            const w = 1 / Math.pow(Math.sqrt(dSq), idwPower);
            wSum += w;
            zSum += w * p.z;
          }
        }
      }
      let z: number;
      if (exact) {
        z = exact.z;
      } else if (wSum > 0) {
        z = zSum / wSum;
      } else {
        continue;
      }
      heights[idx] = z;
      valid[idx] = 1;
      minZ = Math.min(minZ, z);
      maxZ = Math.max(maxZ, z);
    }
  }

  if (!Number.isFinite(minZ)) return null;

  // 坡度（中心差分梯度）与地形曲率（拉普拉斯算子 / spacing²）
  let maxSlope = 0;
  const at = (r: number, c: number): number => {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return NaN;
    return heights[r * cols + c];
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (!valid[idx]) continue;
      const zL = at(r, c - 1);
      const zR = at(r, c + 1);
      const zD = at(r - 1, c);
      const zU = at(r + 1, c);
      let gx = 0;
      let gy = 0;
      let lap = 0;
      let n = 0;
      if (Number.isFinite(zL) && Number.isFinite(zR)) gx = (zR - zL) / (2 * spacing);
      if (Number.isFinite(zD) && Number.isFinite(zU)) gy = (zU - zD) / (2 * spacing);
      const zC = heights[idx];
      for (const zz of [zL, zR, zD, zU]) {
        if (Number.isFinite(zz)) {
          lap += zz - zC;
          n++;
        }
      }
      const slopeDeg = (Math.atan(Math.hypot(gx, gy)) * 180) / Math.PI;
      slopes[idx] = slopeDeg;
      maxSlope = Math.max(maxSlope, slopeDeg);
      curvatures[idx] = n > 0 ? (lap / n) / spacing : 0;
    }
  }

  return {
    origin: { x: minX, y: minY },
    cols,
    rows,
    spacing,
    heights,
    minZ,
    maxZ,
    slopes,
    maxSlope,
    curvatures,
    valid
  };
}

/** 在网格上做双线性插值取高程，网格外/无效处返回 NaN */
export function sampleTerrainZ(mesh: TerrainMeshData, x: number, y: number): number {
  const fx = (x - mesh.origin.x) / mesh.spacing;
  const fy = (y - mesh.origin.y) / mesh.spacing;
  const c0 = Math.floor(fx);
  const r0 = Math.floor(fy);
  if (c0 < 0 || r0 < 0 || c0 >= mesh.cols - 1 || r0 >= mesh.rows - 1) return NaN;
  const tx = fx - c0;
  const ty = fy - r0;
  const i00 = r0 * mesh.cols + c0;
  const i10 = i00 + 1;
  const i01 = i00 + mesh.cols;
  const i11 = i01 + 1;
  const z00 = mesh.heights[i00];
  const z10 = mesh.heights[i10];
  const z01 = mesh.heights[i01];
  const z11 = mesh.heights[i11];
  if (![z00, z10, z01, z11].every(Number.isFinite)) return NaN;
  return (
    z00 * (1 - tx) * (1 - ty) +
    z10 * tx * (1 - ty) +
    z01 * (1 - tx) * ty +
    z11 * tx * ty
  );
}

/**
 * 拉任意横断面：沿 a→b 方向按 step 平距采样地形。
 */
export function sampleSection(mesh: TerrainMeshData, a: Vec2, b: Vec2, step = 2): SectionSample[] {
  const total = v2.dist(a, b);
  const n = Math.max(2, Math.ceil(total / step) + 1);
  const out: SectionSample[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const x = a.x + (b.x - a.x) * t;
    const y = a.y + (b.y - a.y) * t;
    const z = sampleTerrainZ(mesh, x, y);
    if (Number.isFinite(z)) {
      out.push({ distance: t * total, x, y, z });
    }
  }
  return out;
}
