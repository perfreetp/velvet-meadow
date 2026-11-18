import type { ColorMode, TerrainMeshData } from '../../types';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** 蓝→青→绿→黄→红 地形色带 */
const RAMP: [number, RGB][] = [
  [0.0, { r: 44, g: 88, b: 168 }],
  [0.25, { r: 34, g: 166, b: 179 }],
  [0.45, { r: 78, g: 186, b: 96 }],
  [0.65, { r: 214, g: 202, b: 84 }],
  [0.85, { r: 225, g: 132, b: 61 }],
  [1.0, { r: 206, g: 60, b: 52 }]
];

export function rampColor(t: number): RGB {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 0; i < RAMP.length - 1; i++) {
    const [t0, c0] = RAMP[i];
    const [t1, c1] = RAMP[i + 1];
    if (x >= t0 && x <= t1) {
      const f = (x - t0) / (t1 - t0);
      return {
        r: Math.round(c0.r + (c1.r - c0.r) * f),
        g: Math.round(c0.g + (c1.g - c0.g) * f),
        b: Math.round(c0.b + (c1.b - c0.b) * f)
      };
    }
  }
  return RAMP[RAMP.length - 1][1];
}

/** 曲率预警色：正常青绿，突变段警示红 */
export const LINE_NORMAL: RGB = { r: 56, g: 189, b: 248 };
export const LINE_ALERT: RGB = { r: 255, g: 90, b: 78 };

/**
 * 生成地形顶点色。
 * - elevation：按高程线性拉伸
 * - slope：按坡度 0~maxSlope(度)
 * - curvature：地形曲率按对称归一化（绝对值拉伸）
 */
export function buildVertexColors(mesh: TerrainMeshData, mode: ColorMode): Uint8Array {
  const n = mesh.cols * mesh.rows;
  const colors = new Uint8Array(n * 3);
  let maxAbsCurv = 1e-9;
  for (let i = 0; i < n; i++) {
    if (mesh.valid[i]) maxAbsCurv = Math.max(maxAbsCurv, Math.abs(mesh.curvatures[i]));
  }
  const zRange = Math.max(mesh.maxZ - mesh.minZ, 1e-6);
  const slopeRange = Math.max(mesh.maxSlope, 1e-6);

  for (let i = 0; i < n; i++) {
    if (!mesh.valid[i]) {
      colors[i * 3] = 30;
      colors[i * 3 + 1] = 41;
      colors[i * 3 + 2] = 59;
      continue;
    }
    let t: number;
    if (mode === 'elevation') {
      t = (mesh.heights[i] - mesh.minZ) / zRange;
    } else if (mode === 'slope') {
      t = mesh.slopes[i] / slopeRange;
    } else {
      t = 0.5 + (0.5 * mesh.curvatures[i]) / maxAbsCurv;
    }
    const c = rampColor(t);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  return colors;
}

export function cssColor(c: RGB, alpha = 1): string {
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}
