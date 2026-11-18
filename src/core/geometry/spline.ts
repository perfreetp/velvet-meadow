import type { LineDerivation, Vec2, WorkSettings } from '../../types.js';

/** 二维向量小工具 */
export const v2 = {
  add: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y }),
  sub: (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y }),
  scale: (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s }),
  len: (a: Vec2): number => Math.hypot(a.x, a.y),
  dist: (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y),
  distSq: (a: Vec2, b: Vec2): number => {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return dx * dx + dy * dy;
  },
  norm: (a: Vec2): Vec2 => {
    const l = Math.hypot(a.x, a.y);
    return l < 1e-12 ? { x: 0, y: 0 } : { x: a.x / l, y: a.y / l };
  },
  /** 左法向 */
  normal: (a: Vec2): Vec2 => ({ x: -a.y, y: a.x }),
  dot: (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y,
  cross: (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x
};

/**
 * 离心 Catmull-Rom 样条（tension=0.5），经过全部控制点。
 * 返回参数 t∈[0,n-1] 上的位置、一阶导、二阶导。
 */
export class CatmullRomSpline {
  readonly pts: Vec2[];

  constructor(controlPoints: Vec2[]) {
    if (controlPoints.length < 2) throw new Error('样条至少需要 2 个控制点');
    this.pts = controlPoints.map((p) => ({ ...p }));
  }

  private cp(i: number): Vec2 {
    const n = this.pts.length;
    // 端点外推（离心）
    if (i < 0) return { x: 2 * this.pts[0].x - this.pts[1].x, y: 2 * this.pts[0].y - this.pts[1].y };
    if (i >= n) {
      const a = this.pts[n - 1];
      const b = this.pts[n - 2];
      return { x: 2 * a.x - b.x, y: 2 * a.y - b.y };
    }
    return this.pts[i];
  }

  private static basis(t: number): [number, number, number, number] {
    const t2 = t * t;
    const t3 = t2 * t;
    // 标准 Catmull-Rom 基函数矩阵
    return [
      -0.5 * t3 + t2 - 0.5 * t,
      1.5 * t3 - 2.5 * t2 + 1,
      -1.5 * t3 + 2 * t2 + 0.5 * t,
      0.5 * t3 - 0.5 * t2
    ];
  }

  private static basisD(t: number): [number, number, number, number] {
    const t2 = t * t;
    return [
      -1.5 * t2 + 2 * t - 0.5,
      4.5 * t2 - 5 * t,
      -4.5 * t2 + 4 * t + 0.5,
      1.5 * t2 - t
    ];
  }

  private static basisD2(t: number): [number, number, number, number] {
    return [-3 * t + 2, 9 * t - 5, -9 * t + 4, 3 * t - 1];
  }

  evaluate(t: number): Vec2 {
    const n = this.pts.length;
    const i = Math.min(Math.floor(t), n - 2);
    const u = t - i;
    const [b0, b1, b2, b3] = CatmullRomSpline.basis(u);
    const p0 = this.cp(i - 1);
    const p1 = this.cp(i);
    const p2 = this.cp(i + 1);
    const p3 = this.cp(i + 2);
    return {
      x: b0 * p0.x + b1 * p1.x + b2 * p2.x + b3 * p3.x,
      y: b0 * p0.y + b1 * p1.y + b2 * p2.y + b3 * p3.y
    };
  }

  derivative(t: number): Vec2 {
    const n = this.pts.length;
    const i = Math.min(Math.floor(t), n - 2);
    const u = t - i;
    const [d0, d1, d2, d3] = CatmullRomSpline.basisD(u);
    const p0 = this.cp(i - 1);
    const p1 = this.cp(i);
    const p2 = this.cp(i + 1);
    const p3 = this.cp(i + 2);
    return {
      x: d0 * p0.x + d1 * p1.x + d2 * p2.x + d3 * p3.x,
      y: d0 * p0.y + d1 * p1.y + d2 * p2.y + d3 * p3.y
    };
  }

  secondDerivative(t: number): Vec2 {
    const n = this.pts.length;
    const i = Math.min(Math.floor(t), n - 2);
    const u = t - i;
    const b = CatmullRomSpline.basisD2(u);
    const p0 = this.cp(i - 1);
    const p1 = this.cp(i);
    const p2 = this.cp(i + 1);
    const p3 = this.cp(i + 2);
    return {
      x: b[0] * p0.x + b[1] * p1.x + b[2] * p2.x + b[3] * p3.x,
      y: b[0] * p0.y + b[1] * p1.y + b[2] * p2.y + b[3] * p3.y
    };
  }

  /** 有符号曲率 κ = cross(r',r'') / |r'|³（正=左弯） */
  curvatureAt(t: number): number {
    const d1 = this.derivative(t);
    const d2 = this.secondDerivative(t);
    const speed = Math.hypot(d1.x, d1.y);
    if (speed < 1e-9) return 0;
    return v2.cross(d1, d2) / (speed * speed * speed);
  }

  get spanCount(): number {
    return this.pts.length - 1;
  }
}

/**
 * 将样条按弧长等距重采样，并计算每个采样点的曲率、曲率半径、
 * 曲率变化率（对弧长的导数）以及突变标记。
 */
export function deriveSplineLine(
  lineId: string,
  controls: Vec2[],
  settings: WorkSettings
): LineDerivation | null {
  if (controls.length < 2) return null;
  const spline = new CatmullRomSpline(controls);
  const span = spline.spanCount;

  // 先细采样得到弧长映射
  const fineSteps = Math.max(span * 40, 200);
  const finePts: Vec2[] = [];
  const fineT: number[] = [];
  const fineS: number[] = [];
  let acc = 0;
  let prev: Vec2 | null = null;
  for (let i = 0; i <= fineSteps; i++) {
    const t = (i / fineSteps) * span;
    const p = spline.evaluate(t);
    if (prev) acc += v2.dist(prev, p);
    finePts.push(p);
    fineT.push(t);
    fineS.push(acc);
    prev = p;
  }
  const total = acc;
  const spacing = Math.max(settings.resampleSpacing, total / 4000);

  // 按弧长取值（在细采样序列上线性插值，t 用邻近值即可保证曲率精度）
  const points: Vec2[] = [];
  const arcLengths: number[] = [];
  const curvatures: number[] = [];
  let j = 0;
  const targetCount = Math.max(2, Math.round(total / spacing) + 1);
  for (let k = 0; k < targetCount; k++) {
    const s = (k / (targetCount - 1)) * total;
    while (j < fineS.length - 2 && fineS[j + 1] < s) j++;
    const s0 = fineS[j];
    const s1 = fineS[j + 1];
    const f = s1 - s0 < 1e-12 ? 0 : (s - s0) / (s1 - s0);
    const p0 = finePts[j];
    const p1 = finePts[j + 1];
    points.push({ x: p0.x + (p1.x - p0.x) * f, y: p0.y + (p1.y - p0.y) * f });
    arcLengths.push(s);
    const t = fineT[j] + (fineT[j + 1] - fineT[j]) * f;
    curvatures.push(spline.curvatureAt(t));
  }

  const n = points.length;
  const radii = curvatures.map((k) => (Math.abs(k) < 1e-9 ? Infinity : 1 / Math.abs(k)));

  // 曲率变化率 dκ/ds（中心差分）
  const rates = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    if (i === 0 || i === n - 1) {
      rates[i] = 0;
    } else {
      const ds = arcLengths[i + 1] - arcLengths[i - 1];
      rates[i] = ds > 1e-9 ? (curvatures[i + 1] - curvatures[i - 1]) / ds : 0;
    }
  }
  const alerts = rates.map((r) => Math.abs(r) > settings.curvatureAlert);

  return {
    lineId,
    points,
    arcLengths,
    totalLength: total,
    curvatures,
    radii,
    curvatureRates: rates,
    alerts
  };
}

/** 在派生线上找到距给定点最近的采样点索引 */
export function nearestIndexOnDerivation(d: LineDerivation, p: Vec2): number {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < d.points.length; i++) {
    const dd = v2.distSq(d.points[i], p);
    if (dd < bestD) {
      bestD = dd;
      best = i;
    }
  }
  return best;
}

