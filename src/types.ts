// 全局业务类型定义

export interface Vec2 {
  x: number;
  y: number;
}

/** 断面高程点（平面坐标 x/y 为测绘坐标，z 为高程，单位 m） */
export interface ElevPoint {
  x: number;
  y: number;
  z: number;
  /** 来源断面编号，可选 */
  section?: string;
}

/** 河道边界 / 堤顶线等折线，闭合环 closed=true */
export interface BoundaryLine {
  id: string;
  name: string;
  points: Vec2[];
  closed: boolean;
  kind: 'boundary' | 'center' | 'crest-left' | 'crest-right' | 'offset';
}

export type ColorMode = 'elevation' | 'slope' | 'curvature';
export type CornerMode = 'round' | 'miter' | 'bevel';

export interface WorkSettings {
  /** 等距偏移距离 m */
  offsetDistance: number;
  /** 角部处理 */
  cornerMode: CornerMode;
  /** 地形网格间距 m */
  gridSpacing: number;
  /** IDW 幂参数 */
  idwPower: number;
  /** IDW 搜索半径 m */
  idwRadius: number;
  /** 曲率突变阈值（曲率变化率 1/m²），超过即着色预警 */
  curvatureAlert: number;
  /** 曲面着色模式 */
  colorMode: ColorMode;
  /** 样条重采样间距 m */
  resampleSpacing: number;
}

export interface ProjectMeta {
  id: string;
  code: string;
  name: string;
  river: string;
  reach: string;
  createdAt: number;
  updatedAt: number;
}

export interface VersionInfo {
  version: number;
  createdAt: number;
  note: string;
  /** 该版本的关键统计快照，用于版本比对 */
  stats: ProjectStats;
}

export interface ProjectStats {
  pointCount: number;
  centerControlCount: number;
  crestLeftCount: number;
  crestRightCount: number;
  offsetLineCount: number;
  centerLength: number;
  crestLeftLength: number;
  crestRightLength: number;
  minElev: number;
  maxElev: number;
  maxSlopeDeg: number;
  alertSegmentCount: number;
}

export interface UnfoldResult {
  id: string;
  createdAt: number;
  lineId: string;
  lineName: string;
  /** 选中堤坡段的起止采样索引 */
  segStart: number;
  segEnd: number;
  /** 展开面积 m² */
  area: number;
  /** 坡长（展开后条带中轴长度）m */
  slopeLength: number;
  /** 条带宽度 m */
  width: number;
  /** 展开平面成果图（2D 折线轮廓，画布坐标由视图按 bounds 自适配） */
  outline: { top: Vec2[]; bottom: Vec2[] };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  /** 展开条带中线的高程序列，用于成果图上的高程注记 */
  stations: { s: number; z: number }[];
}

export interface ArchiveRecord {
  id: string;
  createdAt: number;
  projectCode: string;
  projectName: string;
  river: string;
  reach: string;
  version: number;
  reportName: string;
  /** 报告 HTML 全文 */
  reportHtml: string;
  snapshot: ProjectStats;
}

export interface ProjectFile {
  meta: ProjectMeta;
  elevPoints: ElevPoint[];
  boundaries: BoundaryLine[];
  centerControls: Vec2[];
  crestLeftControls: Vec2[];
  crestRightControls: Vec2[];
  offsetLines: BoundaryLine[];
  settings: WorkSettings;
  unfoldResults: UnfoldResult[];
  versions: VersionInfo[];
  currentVersion: number;
}

/** 样条派生数据：沿弧长等距采样的平面线及曲率信息 */
export interface LineDerivation {
  lineId: string;
  points: Vec2[];
  /** 累计弧长 m，与 points 等长 */
  arcLengths: number[];
  totalLength: number;
  /** 各采样点曲率 1/m（带符号，正为左弯） */
  curvatures: number[];
  /** 曲率半径 m，直线段为 Infinity */
  radii: number[];
  /** 曲率变化率（弧长导数近似）1/m² */
  curvatureRates: number[];
  /** 是否突变段（|曲率变化率| 超阈值），与 points 等长 */
  alerts: boolean[];
}

export interface TerrainMeshData {
  /** 网格原点（测绘坐标） */
  origin: Vec2;
  cols: number;
  rows: number;
  spacing: number;
  /** 行优先高程，网格外为 NaN */
  heights: Float32Array;
  minZ: number;
  maxZ: number;
  /** 顶点坡度（度） */
  slopes: Float32Array;
  maxSlope: number;
  /** 顶点地形曲率（拉普拉斯近似，1/m） */
  curvatures: Float32Array;
  /** 有效顶点掩码 */
  valid: Uint8Array;
}

export interface SectionSample {
  /** 距断面起点的平距 m */
  distance: number;
  x: number;
  y: number;
  z: number;
}
