import type { Vec2 } from './types';

export interface SnapResult {
  point: Vec2;
  /** 吸附类型 */
  kind: 'grid' | 'anchor' | 'none';
  /** 提示文本 */
  hint: string;
  /** 被吸附的参考点（用于画高亮标记） */
  reference?: Vec2;
  /** 约束线方向（度），存在时画约束辅助线 */
  constraint?: number;
}

export interface SnapSource {
  points: Vec2[];
  grid: number;
  gridEnabled: boolean;
  anchorEnabled: boolean;
  threshold: number; // 世界坐标半径 mm
}

/** 水平/垂直/45° 约束：返回约束后的点与方向角 */
export function applyAxisConstraint(origin: Vec2, p: Vec2): { point: Vec2; angle: number } {
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  const adx = Math.abs(dx), ady = Math.abs(dy);
  if (adx < 1e-9 && ady < 1e-9) return { point: { ...p }, angle: 90 };
  // 45° 扇形区（|dx| 与 |dy| 之比在 0.66~1.5 内）
  if (adx > 1e-9 && ady > 1e-9 && Math.min(adx, ady) / Math.max(adx, ady) > 0.66) {
    const s = Math.sign(dx), t = Math.sign(dy);
    const m = (adx + ady) / 2;
    return { point: { x: origin.x + s * m, y: origin.y + t * m }, angle: (Math.atan2(t, s) * 180) / Math.PI };
  }
  if (adx >= ady) {
    return { point: { x: p.x, y: origin.y }, angle: 0 };
  }
  return { point: { x: origin.x, y: p.y }, angle: 90 };
}

function nearestGrid(p: Vec2, grid: number): Vec2 {
  return {
    x: Math.round(p.x / grid) * grid,
    y: Math.round(p.y / grid) * grid
  };
}

/**
 * 综合吸附：锚点优先，其次网格；axis 约束由调用方先用 applyAxisConstraint 处理，
 * 约束后的点仍可吸附到锚点/网格。
 */
export function snap(p: Vec2, src: SnapSource, origin?: Vec2, axisLocked = false): SnapResult {
  let working = { ...p };
  let constraint: number | undefined;
  if (axisLocked && origin) {
    const r = applyAxisConstraint(origin, p);
    working = r.point;
    constraint = r.angle;
  }

  if (src.anchorEnabled) {
    let best: { p: Vec2; d: number } | null = null;
    for (const q of src.points) {
      const d = Math.hypot(q.x - working.x, q.y - working.y);
      if (d <= src.threshold && (!best || d < best.d)) best = { p: q, d };
    }
    if (best) {
      return {
        point: { ...best.p }, kind: 'anchor',
        hint: `吸附到点位 (${best.p.x.toFixed(2)}, ${best.p.y.toFixed(2)})`,
        reference: best.p, constraint
      };
    }
  }

  if (src.gridEnabled) {
    const g = nearestGrid(working, src.grid);
    const d = Math.hypot(g.x - working.x, g.y - working.y);
    if (d <= src.threshold) {
      return {
        point: g, kind: 'grid',
        hint: `吸附到格点 (${g.x.toFixed(2)}, ${g.y.toFixed(2)})`,
        reference: g, constraint
      };
    }
  }

  if (axisLocked && origin) {
    return {
      point: working, kind: 'none',
      hint: constraintLabel(constraint!), reference: origin, constraint
    };
  }
  return { point: working, kind: 'none', hint: '' };
}

function constraintLabel(angle: number): string {
  const a = ((angle % 180) + 180) % 180;
  if (a < 1 || a > 179) return '水平约束';
  if (Math.abs(a - 90) < 1) return '垂直约束';
  if (Math.abs(a - 45) < 1) return '45° 约束';
  if (Math.abs(a - 135) < 1) return '135° 约束';
  return `${Math.round(a)}° 约束`;
}
