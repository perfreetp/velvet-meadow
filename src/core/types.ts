/** 全局数据模型 */

export type Vec2 = { x: number; y: number };

/** 直边 */
export interface LineSeg {
  id: string;
  type: 'line';
  a: string; // 起点锚点 id
  b: string; // 终点锚点 id
}

/** 圆弧边：a -> b，bulge = tan(θ/4)，θ 为圆心角（逆时针为正，顺时针为负） */
export interface ArcSeg {
  id: string;
  type: 'arc';
  a: string;
  b: string;
  bulge: number;
}

export type Segment = LineSeg | ArcSeg;

export interface Anchor extends Vec2 {
  id: string;
}

export interface PathData {
  id: string;
  name: string;
  /** 锚点按轮廓顺序排列 */
  anchors: Anchor[];
  /** 边数与锚点数相同，segs[i] 从 anchors[i] 连到 anchors[(i+1)%n] */
  segs: Segment[];
  color: string;
  closed: boolean;
}

export interface LayerData {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  /** 该图层上的路径 id */
  pathIds: string[];
}

/** 布尔运算生成的交点记录 */
export interface IntersectionPoint extends Vec2 {
  id: string;
  source: 'line-line' | 'line-arc' | 'arc-arc';
  pathA: string;
  pathB: string;
}

export interface DocumentData {
  /** 画布逻辑尺寸（毫米） */
  width: number;
  height: number;
  grid: number; // 网格间距 mm
  layers: LayerData[];
  paths: Record<string, PathData>;
  activeLayerId: string;
  /** 布尔运算产生的交点（高亮用） */
  intersections: IntersectionPoint[];
}

export interface GapMark {
  id: string;
  /** 参考路径 id */
  pathId: string;
  /** 缺口两端的锚点 id（沿路径顺序） */
  anchorA: string;
  anchorB: string;
  /** 缺失边之间包含的锚点 id（参考答案） */
  missingAnchorIds: string[];
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  classId: string;
  createdAt: number;
  /** 带缺口的底图（完整文档的副本，含参考路径） */
  template: DocumentData;
  /** 参考答案（补齐后的完整路径数据，按路径 id 索引） */
  referencePaths: Record<string, PathData>;
  gaps: GapMark[];
  /** 自动评分：期望学员布尔操作产生的交点数（-1 表示不考核该项） */
  expectedIntersections: number;
  /** 背景示意图（dataURL，可空） */
  backgroundImage?: string;
}

export interface ManualScore {
  /** 评分项名称 */
  item: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface Submission {
  id: string;
  exerciseId: string;
  classId: string;
  studentId: string;
  studentName: string;
  submittedAt: number;
  doc: DocumentData;
  /** 自动评分 */
  autoScore: {
    closure: number; // 闭合度得分
    intersection: number; // 交点数得分
    total: number;
    detail: string;
  };
  /** 老师复核分项打分 */
  manualScores: ManualScore[];
  finalScore: number | null;
  teacherComment: string;
  reviewed: boolean;
}

export interface Student {
  id: string;
  name: string;
  studentNo: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  students: Student[];
  createdAt: number;
}

export type Role = 'teacher' | 'student';

export interface Session {
  role: Role;
  studentId?: string;
  studentName?: string;
}
