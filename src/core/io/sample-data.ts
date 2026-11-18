import type { BoundaryLine, ElevPoint, Vec2 } from '../../types.js';

/**
 * 生成一段正弦弯曲河道的演示数据：
 * - 中心线沿 x 方向摆动
 * - 每 40m 一个断面，断面上按河谷剖面给出高程点
 * - 河道边界为两侧外包闭合环
 */
export function generateSampleData(): {
  elev: ElevPoint[];
  boundary: BoundaryLine;
  center: Vec2[];
  crestLeft: Vec2[];
  crestRight: Vec2[];
} {
  const L = 1200; // 河段长
  const amp = 90; // 弯曲幅度
  const wave = 2 * Math.PI / 700;
  const centerY = (x: number) => 500 + amp * Math.sin(wave * x) + 30 * Math.sin(wave * 2.3 * x + 1.2);
  const dydx = (x: number) => amp * wave * Math.cos(wave * x) + 30 * wave * 2.3 * Math.cos(wave * 2.3 * x + 1.2);

  const elev: ElevPoint[] = [];
  const sectionStep = 40;
  const halfWidth = 130;
  const crossStep = 10;
  let secNo = 0;
  for (let x = 0; x <= L; x += sectionStep) {
    const cy = centerY(x);
    const slope = dydx(x);
    // 断面方向（垂直于中心线切线）
    const tx = 1;
    const ty = slope;
    const tl = Math.hypot(tx, ty);
    const nx = -ty / tl;
    const ny = tx / tl;
    secNo++;
    for (let off = -halfWidth; off <= halfWidth; off += crossStep) {
      const px = x + nx * off;
      const py = cy + ny * off;
      // 河谷剖面：深槽在中心，两岸抬升，叠加纵向比降与轻微噪声
      const transverse = Math.abs(off);
      const valley = 18 + 0.0009 * transverse * transverse + 0.012 * transverse;
      const longitudinal = 12 - x * 0.004;
      const noise = 0.35 * Math.sin(px * 0.21) * Math.cos(py * 0.17);
      const z = valley + longitudinal + noise;
      elev.push({ x: px, y: py, z: Number(z.toFixed(3)), section: `DM${String(secNo).padStart(3, '0')}` });
    }
  }

  // 河道边界闭合环（两岸外包线顺接）
  const leftBank: Vec2[] = [];
  const rightBank: Vec2[] = [];
  const bankHalf = halfWidth + 12;
  for (let x = 0; x <= L; x += sectionStep) {
    const cy = centerY(x);
    const slope = dydx(x);
    const tl = Math.hypot(1, slope);
    const nx = -slope / tl;
    const ny = 1 / tl;
    leftBank.push({ x: x + nx * bankHalf, y: cy + ny * bankHalf });
    rightBank.push({ x: x - nx * bankHalf, y: cy - ny * bankHalf });
  }
  const boundary: BoundaryLine = {
    id: crypto.randomUUID(),
    name: '河道管理边界',
    points: [...leftBank, ...rightBank.reverse()],
    closed: true,
    kind: 'boundary'
  };

  // 样条控制点：中心线与两侧堤顶线（稀疏点，留给作业员增删拖拽）
  const pick = (off: number): Vec2[] => {
    const pts: Vec2[] = [];
    for (let x = 0; x <= L; x += 120) {
      const cy = centerY(x);
      const slope = dydx(x);
      const tl = Math.hypot(1, slope);
      const nx = -slope / tl;
      const ny = 1 / tl;
      pts.push({ x: x + nx * off, y: cy + ny * off });
    }
    return pts;
  };

  return {
    elev,
    boundary,
    center: pick(0),
    crestLeft: pick(62),
    crestRight: pick(-62)
  };
}
