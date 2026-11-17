// 全局数据模型 —— 单位：米，坐标系：X 向右(东)，Y 向上(北)，二维平面俯视

export type Vec2 = { x: number; y: number };

export type ElementType =
  | 'water'
  | 'wall'
  | 'bridgeOpening'
  | 'pier'
  | 'dock'
  | 'route'
  | 'lamp';

export type LampKind = 'flood' | 'wallWasher' | 'underwater' | 'lanternString';

export const LAMP_KIND_LABEL: Record<LampKind, string> = {
  flood: '投光灯',
  wallWasher: '洗墙灯',
  underwater: '水下灯',
  lanternString: '灯笼串',
};

/** 可参与遮挡的元素：驳岸挡墙 + 桥墩（需求明确指定） */
export type OccluderElement = SceneWall | ScenePier;

export interface SceneElementBase {
  id: string;
  name: string;
}

export interface SceneWater extends SceneElementBase {
  type: 'water';
  points: Vec2[];
}

export interface SceneWall extends SceneElementBase {
  type: 'wall';
  points: Vec2[]; // 折线，按有厚度的挡墙处理
  thickness: number; // m
  height: number; // m，挡墙高度影响软阴影
}

export interface SceneBridgeOpening extends SceneElementBase {
  type: 'bridgeOpening';
  /** 桥洞多边形（镂空/通航区，本身不挡光，仅作平面要素与统计分区） */
  points: Vec2[];
}

export interface ScenePier extends SceneElementBase {
  type: 'pier';
  points: Vec2[]; // 闭合多边形
  height: number;
}

export interface SceneDock extends SceneElementBase {
  type: 'dock';
  points: Vec2[]; // 闭合多边形，码头平台，不遮挡
}

export interface SceneRoute extends SceneElementBase {
  type: 'route';
  points: Vec2[]; // 航线折线
}

export interface Lamp extends SceneElementBase {
  type: 'lamp';
  kind: LampKind;
  pos: Vec2;
  /** 投光主方向，弧度，0 = +X，逆时针为正 */
  aim: number;
  /** 发光角度（光束张角，全角，度），0 表示全向（灯笼串/水下灯默认） */
  beamAngleDeg: number;
  /** 色温 K */
  colorTemp: number;
  /** 功率 W */
  powerW: number;
  /** 安装高度 m，参与菲涅尔反射与软阴影几何 */
  height: number;
  /** 光效 lm/W，灯具库默认值，可按灯型不同 */
  efficacy: number;
}

export type SceneElement =
  | SceneWater
  | SceneWall
  | SceneBridgeOpening
  | ScenePier
  | SceneDock
  | SceneRoute
  | Lamp;

export interface ProjectMeta {
  name: string;
  createdAt: number;
  updatedAt: number;
}

export interface Comment {
  id: string;
  pos: Vec2;
  author: string;
  text: string;
  createdAt: number;
  replies: { id: string; author: string; text: string; createdAt: number }[];
  resolved: boolean;
}

export interface ProjectData {
  meta: ProjectMeta;
  elements: SceneElement[];
  comments: Comment[];
  /** 时间滑杆位置，小时（18~23，支持小数） */
  timeHour: number;
  /** 热力图显示模式 */
  heatmapMode: 'total' | 'direct' | 'reflected';
  heatmapVisible: boolean;
  darkZoneVisible: boolean;
  luxThreshold: number;
}

export interface VersionSnapshot {
  id: string;
  label: string;
  note: string;
  createdAt: number;
  data: ProjectData;
}

// ---------- 仿真输出 ----------

export interface DarkZone {
  id: string;
  cellCount: number;
  areaM2: number;
  minLux: number;
  avgLux: number;
  centroid: Vec2;
  cells: number[]; // 网格索引
}

export interface SimStats {
  waterCells: number;
  meanLux: number;
  minLux: number;
  maxLux: number;
  pctBelowThreshold: number;
  lampCount: number;
  totalPowerW: number;
}

export interface SimResult {
  gridOrigin: Vec2;
  cellSize: number;
  cols: number;
  rows: number;
  /** 每个水面网格单元的总照度 lux（非水面单元为 NaN） */
  total: Float32Array;
  direct: Float32Array;
  reflected: Float32Array;
  /** 单元中心是否落在水面内 */
  inWater: Uint8Array;
  darkZones: DarkZone[];
  stats: SimStats;
  /** 参与计算的灯具运行时参数（导出/调试用） */
  lampRuntime: { id: string; lumens: number; dimming: number }[];
  elapsedMs: number;
}
