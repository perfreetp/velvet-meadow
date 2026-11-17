// 几何核心类型:一条轮廓由若干首尾相接的图元构成
export interface Vec {
  x: number;
  y: number;
}

export interface LineSeg {
  id: string;
  type: 'line';
  a: Vec; // 起点
  b: Vec; // 终点
}

export interface ArcSeg {
  id: string;
  type: 'arc';
  a: Vec;
  b: Vec;
  c: Vec; // 圆心
  ccw: boolean; // 绘制方向(canvas y 向下坐标系下)
}

export interface CubicSeg {
  id: string;
  type: 'cubic';
  a: Vec;
  b: Vec;
  c1: Vec;
  c2: Vec;
}

export type Segment = LineSeg | ArcSeg | CubicSeg;
export type SegType = Segment['type'];

export interface Contour {
  id: string;
  name?: string;
  closed: boolean;
  segs: Segment[];
}

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Hole {
  id: string;
  cx: number;
  cy: number;
  r: number;
}

export interface Part {
  id: string;
  name: string;
  x: number; // 板件在板材上的位置(mm)
  y: number;
  contours: Contour[];
  holes: Hole[];
}

export interface Board {
  width: number; // mm
  height: number; // mm
  thickness: number; // mm
  material: string;
}

export interface Doc {
  version: number;
  board: Board;
  parts: Part[];
  activePartId: string | null;
}

let _seq = 0;
export function uid(prefix = 'id'): string {
  _seq = (_seq + 1) % 1_000_000;
  return `${prefix}_${Date.now().toString(36)}_${_seq}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}
