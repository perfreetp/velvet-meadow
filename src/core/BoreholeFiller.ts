// 钻孔分层标高 -> 体素批量填充
// 每个钻孔给出孔口标高与各层层底深度；对网格每一列用 IDW 插值地面标高与
// 各层底标高，再按格心标高判定所属地层材质。
import type { Borehole } from '../types';
import type { VoxelGrid } from './VoxelGrid';

export interface FillOptions {
  /** 场地基准标高（z=0 格顶的绝对标高），不传则取钻孔孔口最大值向上取整 */
  baseElev?: number;
  /** IDW 幂参数 */
  power?: number;
  /** 影响半径（m），超出最近钻孔该距离的列不填充；Infinity 表示全场填充 */
  influenceRadius?: number;
  /** 进度回调 0..1 */
  onProgress?: (p: number) => void;
}

export interface FillResult {
  baseElev: number;
  filled: number;
  columns: number;
}

interface Boundary {
  values: { x: number; y: number; v: number }[];
}

export function fillFromBoreholes(grid: VoxelGrid, boreholes: Borehole[], opts: FillOptions = {}): FillResult {
  if (boreholes.length === 0) return { baseElev: 0, filled: 0, columns: 0 };
  const power = opts.power ?? 2;
  const radius = opts.influenceRadius ?? Infinity;

  // 基准标高
  let baseElev = opts.baseElev;
  if (baseElev === undefined) {
    baseElev = Math.ceil(Math.max(...boreholes.map((b) => b.elevation)));
  }

  // 地面标高点
  const ground = boreholes.map((b) => ({ x: b.x, y: b.y, v: b.elevation }));
  // 各层底绝对标高 = 孔口标高 - 层底深度
  const maxLayers = Math.max(...boreholes.map((b) => b.layers.length));
  const boundaries: Boundary[] = [];
  for (let k = 0; k < maxLayers; k++) {
    const values: { x: number; y: number; v: number }[] = [];
    for (const b of boreholes) {
      if (k < b.layers.length) {
        values.push({ x: b.x, y: b.y, v: b.elevation - b.layers[k].depth });
      }
    }
    boundaries.push({ values });
  }
  const layerMaterial = (bi: number, borehole: Borehole): number =>
    borehole.layers[Math.min(bi, borehole.layers.length - 1)].materialId;

  // 材质在钻孔间可能不同：层材质也按 IDW 对材质 id 做“加权投票”
  const materialVotes: { x: number; y: number; mat: number }[][] = [];
  for (let k = 0; k < maxLayers; k++) {
    const votes: { x: number; y: number; mat: number }[] = [];
    for (const b of boreholes) {
      if (k < b.layers.length) votes.push({ x: b.x, y: b.y, mat: b.layers[k].materialId });
    }
    materialVotes.push(votes);
  }

  const idw = (
    samples: { x: number; y: number; v: number }[],
    x: number,
    y: number
  ): { v: number; nearest: number } => {
    let num = 0;
    let den = 0;
    let nearest = Infinity;
    for (const s of samples) {
      const dx = s.x - x;
      const dy = s.y - y;
      const d = Math.hypot(dx, dy);
      nearest = Math.min(nearest, d);
      if (d < 1e-9) return { v: s.v, nearest: 0 };
      const w = 1 / Math.pow(d, power);
      num += w * s.v;
      den += w;
    }
    return { v: num / den, nearest };
  };

  const voteMaterial = (votes: { x: number; y: number; mat: number }[], x: number, y: number): number => {
    const score = new Map<number, number>();
    for (const s of votes) {
      const d = Math.hypot(s.x - x, s.y - y);
      const w = d < 1e-9 ? 1e9 : 1 / Math.pow(d, power);
      score.set(s.mat, (score.get(s.mat) ?? 0) + w);
    }
    let best = 0;
    let bestW = -1;
    for (const [mat, w] of score) {
      if (w > bestW) {
        bestW = w;
        best = mat;
      }
    }
    return best;
  };

  let filled = 0;
  let columns = 0;
  const { nx, ny, nz, cell } = grid;
  let lastReport = 0;

  for (let y = 0; y < ny; y++) {
    for (let x = 0; x < nx; x++) {
      const cx = x + 0.5;
      const cy = y + 0.5;
      const g = idw(ground, cx, cy);
      if (g.nearest > radius) continue;
      columns++;
      // 该列插值出的各层底标高
      const bottoms: number[] = [];
      for (const bd of boundaries) {
        const r = idw(bd.values, cx, cy);
        bottoms.push(r.v);
      }
      for (let z = 0; z < nz; z++) {
        const center = baseElev - (z + 0.5) * cell; // 格心绝对标高
        if (center > g.v || center < bottoms[bottoms.length - 1]) continue;
        // 找到包含该标高的层 k：bottoms[k-1] > center >= bottoms[k]
        let k = 0;
        while (k < bottoms.length && center < bottoms[k]) k++;
        if (k >= bottoms.length) continue;
        const mat = voteMaterial(materialVotes[k], cx, cy);
        if (mat > 0) {
          grid.set(x, y, z, mat);
          filled++;
        }
      }
    }
    if (opts.onProgress) {
      const p = (y + 1) / ny;
      if (p - lastReport > 0.05) {
        lastReport = p;
        opts.onProgress(p);
      }
    }
  }
  void layerMaterial;
  opts.onProgress?.(1);
  return { baseElev, filled, columns };
}
