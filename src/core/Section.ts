// 剖面线分析：沿折线采样体素，生成剖面图数据与层厚表
import type { Material, SectionLine } from '../types';
import type { VoxelGrid } from './VoxelGrid';

export interface ProfileColumn {
  dist: number;          // 沿剖面线累计水平距离 m
  x: number;
  y: number;
  /** 自地面向下的材质序列（材质 id），按 z 递增 */
  stack: number[];
}

export interface ThicknessRow {
  order: number;
  materialId: number;
  materialName: string;
  color: string;
  minThick: number;
  maxThick: number;
  avgThick: number;
  sampleCount: number;
}

export interface ProfileResult {
  columns: ProfileColumn[];
  totalLength: number;
  maxDepth: number;
  thickness: ThicknessRow[];
}

/** 在折线上按 1m 步长采样，返回每点下方实体柱 */
export function buildProfile(
  grid: VoxelGrid,
  line: SectionLine,
  materials: Material[]
): ProfileResult {
  const matName = (id: number): string => materials.find((m) => m.id === id)?.name ?? `材质${id}`;
  const matColor = (id: number): string => materials.find((m) => m.id === id)?.color ?? '#888888';

  // 展开为等距采样点（步长 1m，沿折线累计距离）
  const samples: { x: number; y: number; dist: number }[] = [];
  let totalLength = 0;
  const pts = line.points;
  if (pts.length < 2) return { columns: [], totalLength: 0, maxDepth: 0, thickness: [] };

  samples.push({ x: pts[0].x, y: pts[0].y, dist: 0 });
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    // 起点已由上一段收录，从步长 1 开始；段长 <1 时至少在段末补一点
    const steps = Math.max(1, Math.round(seg));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      samples.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        dist: totalLength + seg * t
      });
    }
    totalLength += seg;
  }

  const columns: ProfileColumn[] = [];
  let maxDepth = 0;
  for (const sp of samples) {
    const gx = Math.min(grid.nx - 1, Math.max(0, Math.floor(sp.x)));
    const gy = Math.min(grid.ny - 1, Math.max(0, Math.floor(sp.y)));
    const stack: number[] = [];
    for (let z = 0; z < grid.nz; z++) {
      const v = grid.get(gx, gy, z);
      if (v !== 0) {
        stack.push(v);
        maxDepth = Math.max(maxDepth, (z + 1) * grid.cell);
      }
    }
    columns.push({ dist: sp.dist, x: gx, y: gy, stack });
  }

  // 层厚统计：以每列连续同材质段为一层
  interface Acc {
    min: number;
    max: number;
    sum: number;
    n: number;
  }
  const acc = new Map<number, Acc>();
  for (const col of columns) {
    let runMat = 0;
    let runLen = 0;
    const flush = () => {
      if (runMat === 0) return;
      const a = acc.get(runMat) ?? { min: Infinity, max: 0, sum: 0, n: 0 };
      a.min = Math.min(a.min, runLen * grid.cell);
      a.max = Math.max(a.max, runLen * grid.cell);
      a.sum += runLen * grid.cell;
      a.n += 1;
      acc.set(runMat, a);
    };
    for (const v of col.stack) {
      if (v === runMat) {
        runLen++;
      } else {
        flush();
        runMat = v;
        runLen = 1;
      }
    }
    flush();
  }

  const thickness: ThicknessRow[] = [];
  let order = 1;
  for (const [id, a] of acc) {
    thickness.push({
      order: order++,
      materialId: id,
      materialName: matName(id),
      color: matColor(id),
      minThick: a.min,
      maxThick: a.max,
      avgThick: a.sum / a.n,
      sampleCount: a.n
    });
  }

  return { columns, totalLength, maxDepth, thickness };
}
