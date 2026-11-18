import type { LineDerivation, TerrainMeshData, UnfoldResult, Vec2 } from '../../types';
import { sampleTerrainZ } from './terrain';
import { v2 } from './spline';

export interface UnfoldOptions {
  /** 条带宽度（自堤顶线向坡脚方向）m */
  width: number;
  /** 横剖面采样步距 m */
  crossStep: number;
  /** 向线的哪一侧展开 */
  side: 'left' | 'right';
}

interface P3 {
  x: number;
  y: number;
  z: number;
}

/**
 * 将选中堤坡段按测地线展开为平面成果图。
 *
 * 工程做法：
 * 1. 沿派生线选中段逐站点，按法向切横剖面，在地形曲面上采样得到三维条带网格；
 * 2. 每条横剖面按三维弦长累计得到"展开坡长"方向坐标 V；
 * 3. 沿堤方向按堤顶线三维弧长累计得到桩号坐标 U；
 * 4. 展开面积直接取三维条带三角面面积之和（展开保面积）。
 */
export function unfoldSlope(
  mesh: TerrainMeshData,
  derivation: LineDerivation,
  startIdx: number,
  endIdx: number,
  opts: UnfoldOptions,
  id: string,
  createdAt: number,
  lineName: string
): UnfoldResult | null {
  const lo = Math.max(0, Math.min(startIdx, endIdx));
  const hi = Math.min(derivation.points.length - 1, Math.max(startIdx, endIdx));
  if (hi - lo < 1 || opts.width <= 0) return null;

  const sign = opts.side === 'left' ? 1 : -1;
  const crossCount = Math.max(2, Math.ceil(opts.width / opts.crossStep) + 1);

  // 三维条带网格 P[station][cross]
  const grid: P3[][] = [];
  for (let i = lo; i <= hi; i++) {
    const p = derivation.points[i];
    const pNext = derivation.points[Math.min(i + 1, hi)];
    const pPrev = derivation.points[Math.max(i - 1, lo)];
    const dir = v2.norm(v2.sub(pNext, pPrev));
    const normal = v2.scale(v2.normal(dir), sign);
    const row: P3[] = [];
    for (let k = 0; k < crossCount; k++) {
      const off = (k / (crossCount - 1)) * opts.width;
      const qx = p.x + normal.x * off;
      const qy = p.y + normal.y * off;
      let z = sampleTerrainZ(mesh, qx, qy);
      if (!Number.isFinite(z)) {
        // 网格外点：沿剖面回退找最近有效值
        z = nearestValidZ(mesh, p, normal, off);
      }
      row.push({ x: qx, y: qy, z });
    }
    grid.push(row);
  }

  // 沿堤三维弧长 U（取堤顶边 k=0 的三维弦长累计）
  const U: number[] = [0];
  for (let i = 1; i < grid.length; i++) {
    U.push(U[i - 1] + dist3(grid[i][0], grid[i - 1][0]));
  }

  // 每条横剖面的展开坡长 V（三维累计）
  const Vmax: number[] = [];
  const profileV: number[][] = [];
  for (const row of grid) {
    const vs = [0];
    for (let k = 1; k < row.length; k++) vs.push(vs[k - 1] + dist3(row[k], row[k - 1]));
    profileV.push(vs);
    Vmax.push(vs[vs.length - 1]);
  }

  // 三维三角面面积求和 = 展开面积
  let area = 0;
  for (let i = 0; i < grid.length - 1; i++) {
    for (let k = 0; k < crossCount - 1; k++) {
      area += triangleArea3(grid[i][k], grid[i + 1][k], grid[i][k + 1]);
      area += triangleArea3(grid[i + 1][k], grid[i + 1][k + 1], grid[i][k + 1]);
    }
  }

  const meanSlopeLen = Vmax.reduce((a, b) => a + b, 0) / Vmax.length;
  const top: Vec2[] = U.map((u) => ({ x: u, y: 0 }));
  const bottom: Vec2[] = U.map((u, i) => ({ x: u, y: Vmax[i] }));

  const stations = grid.map((row, i) => ({ s: U[i], z: row[0].z }));

  const allX = [...top, ...bottom];
  const minX = 0;
  const maxX = U[U.length - 1];
  const minY = 0;
  const maxY = Math.max(...Vmax);

  void allX;
  return {
    id,
    createdAt,
    lineId: derivation.lineId,
    lineName,
    segStart: lo,
    segEnd: hi,
    area,
    slopeLength: meanSlopeLen,
    width: opts.width,
    outline: { top, bottom },
    bounds: { minX, minY, maxX, maxY },
    stations
  };
}

function nearestValidZ(mesh: TerrainMeshData, origin: Vec2, normal: Vec2, maxOff: number): number {
  for (let off = maxOff; off >= 0; off -= mesh.spacing) {
    const z = sampleTerrainZ(mesh, origin.x + normal.x * off, origin.y + normal.y * off);
    if (Number.isFinite(z)) return z;
  }
  return mesh.minZ;
}

function dist3(a: P3, b: P3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function triangleArea3(a: P3, b: P3, c: P3): number {
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const acx = c.x - a.x;
  const acy = c.y - a.y;
  const acz = c.z - a.z;
  const cx = aby * acz - abz * acy;
  const cy = abz * acx - abx * acz;
  const cz = abx * acy - aby * acx;
  return 0.5 * Math.hypot(cx, cy, cz);
}
