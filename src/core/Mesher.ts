// 网格面提取 + 贪心合面（greedy meshing）
// 1) 仅在「实-空」边界生成面，自动剔除内部面；
// 2) 每个轴方向、每层扫描出 (材质, 面朝向) 掩码，先横向贪心合并成矩形，
//    再纵向合并同宽同材质的矩形，输出带法线的三角面。
import type { VoxelGrid } from './VoxelGrid';

export interface MeshVertex {
  x: number;
  y: number;
  z: number;
}

export interface MeshFace {
  vertices: [MeshVertex, MeshVertex, MeshVertex, MeshVertex]; // 逆时针（从外侧看）
  normal: [number, number, number];
  materialId: number;
}

export interface MeshResult {
  faces: MeshFace[];
  triangles: number; // 三角面数 = faces * 2
}

// 三个轴的面定义：法线方向 + 四边形四角偏移（从外侧看逆时针）
const AXIS_FACES = [
  {
    // X 轴面（法向 ±X），在 yz 平面扫描，dims = (y, z)
    axis: 0 as const,
    dirs: [
      { n: [-1, 0, 0] as [number, number, number], corners: [[0, 0, 1], [0, 0, 0], [0, 1, 0], [0, 1, 1]] },
      { n: [1, 0, 0] as [number, number, number], corners: [[1, 1, 1], [1, 1, 0], [1, 0, 0], [1, 0, 1]] }
    ]
  },
  {
    // Y 轴面（法向 ±Y），在 xz 平面扫描，dims = (x, z)
    axis: 1 as const,
    dirs: [
      { n: [0, -1, 0] as [number, number, number], corners: [[1, 0, 1], [0, 0, 1], [0, 0, 0], [1, 0, 0]] },
      { n: [0, 1, 0] as [number, number, number], corners: [[0, 1, 1], [1, 1, 1], [1, 1, 0], [0, 1, 0]] }
    ]
  },
  {
    // Z 轴面（法向 ±Z），在 xy 平面扫描，dims = (x, y)
    axis: 2 as const,
    dirs: [
      { n: [0, 0, -1] as [number, number, number], corners: [[0, 1, 0], [1, 1, 0], [1, 0, 0], [0, 0, 0]] },
      { n: [0, 0, 1] as [number, number, number], corners: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]] }
    ]
  }
];

/**
 * 贪心网格化。
 * @param grid 体素网格
 * @param materialFilter 仅导出这些材质（不传则全部）
 */
export function buildMesh(grid: VoxelGrid, materialFilter?: Set<number>): MeshResult {
  const { nx, ny, nz, cell } = grid;
  const get = (x: number, y: number, z: number): number => {
    if (x < 0 || y < 0 || z < 0 || x >= nx || y >= ny || z >= nz) return 0;
    return grid.data[grid.index(x, y, z)];
  };

  const size = [nx, ny, nz];
  const faces: MeshFace[] = [];

  for (const { axis, dirs } of AXIS_FACES) {
    const d1 = (axis + 1) % 3; // 扫描行内维
    const d2 = (axis + 2) % 3; // 扫描行维
    const u = size[d1];
    const v = size[d2];

    // mask[d][i]：该切片上第 i 个 (d1,d2) 格朝向 d 侧的面材质，0 表示无面
    const mask0 = new Int16Array(u * v);
    const mask1 = new Int16Array(u * v);

    for (let slice = 0; slice <= size[axis]; slice++) {
      mask0.fill(0);
      mask1.fill(0);
      for (let j = 0; j < v; j++) {
        for (let i = 0; i < u; i++) {
          const p = [0, 0, 0];
          p[axis] = slice;
          p[d1] = i;
          p[d2] = j;
          // 负方向面：当前格（axis=slice-1）实、邻格（slice）空
          const a = slice === 0 ? 0 : get(p[0] - (axis === 0 ? 1 : 0), p[1] - (axis === 1 ? 1 : 0), p[2] - (axis === 2 ? 1 : 0));
          const b = slice === size[axis] ? 0 : get(p[0], p[1], p[2]);
          const ia = a !== 0 && (!materialFilter || materialFilter.has(a)) ? a : 0;
          const ib = b !== 0 && (!materialFilter || materialFilter.has(b)) ? b : 0;
          const k = j * u + i;
          if (ia !== 0 && b === 0) mask0[k] = ia;
          if (ib !== 0 && a === 0) mask1[k] = ib;
        }
      }

      for (let d = 0; d < 2; d++) {
        const mask = d === 0 ? mask0 : mask1;
        const normal = dirs[d].n;
        const corners = dirs[d].corners;
        greedyMerge(mask, u, v, (i0, j0, i1, j1, mat) => {
          const base = [0, 0, 0];
          base[axis] = slice;
          const verts = corners.map((c) => {
            const q = [0, 0, 0];
            // 四角偏移中 d1 方向跨度 i0..i1，d2 方向跨度 j0..j1
            const span1 = c[d1] === 0 ? i0 : i1;
            const span2 = c[d2] === 0 ? j0 : j1;
            q[axis] = base[axis] + c[axis];
            q[d1] = span1;
            q[d2] = span2;
            return { x: q[0] * cell, y: q[1] * cell, z: q[2] * cell } as MeshVertex;
          }) as MeshFace['vertices'];
          faces.push({ vertices: verts, normal, materialId: mat });
        });
      }
    }
  }

  return { faces, triangles: faces.length * 2 };
}

/** 在 u×v 掩码上做贪心矩形合并，回调输出 (i0,j0) 闭区间到 (i1,j1) 开区间 */
function greedyMerge(
  mask: Int16Array,
  u: number,
  v: number,
  emit: (i0: number, j0: number, i1: number, j1: number, mat: number) => void
): void {
  // 每行先横向合并
  interface RowRect {
    i0: number;
    i1: number;
    j: number;
    mat: number;
    used: boolean;
  }
  const rects: RowRect[] = [];
  for (let j = 0; j < v; j++) {
    let i = 0;
    while (i < u) {
      const mat = mask[j * u + i];
      if (mat === 0) {
        i++;
        continue;
      }
      let i1 = i + 1;
      while (i1 < u && mask[j * u + i1] === mat) i1++;
      rects.push({ i0: i, i1, j, mat, used: false });
      i = i1;
    }
  }
  // 纵向贪心：同列范围、同材质的相邻行矩形合并
  for (let r = 0; r < rects.length; r++) {
    const cur = rects[r];
    if (cur.used) continue;
    let j1 = cur.j + 1;
    for (let s = r + 1; s < rects.length; s++) {
      const nxt = rects[s];
      if (nxt.used || nxt.j !== j1 || nxt.i0 !== cur.i0 || nxt.i1 !== cur.i1 || nxt.mat !== cur.mat) continue;
      nxt.used = true;
      j1++;
    }
    emit(cur.i0, cur.j, cur.i1, j1, cur.mat);
  }
}
