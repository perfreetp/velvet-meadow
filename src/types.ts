// 全局类型定义

export type Role = 'client' | 'maker' | 'supervisor';

export type ProjectStatus = 'ordered' | 'in_progress' | 'submitted' | 'rework' | 'delivered';

export interface Material {
  id: number;          // 1..255，0 保留为空
  name: string;
  color: string;       // #rrggbb
  pattern: string;     // 图例填充图案描述（保留字段）
}

/** 钻孔分层：每层记录层底相对孔口的深度（m）与材质 id */
export interface BoreholeLayer {
  depth: number;       // 层底深度，m
  materialId: number;
}

export interface Borehole {
  id: string;
  name: string;
  x: number;           // 场地坐标，m（=网格列）
  y: number;
  elevation: number;   // 孔口标高，m（绝对标高）
  layers: BoreholeLayer[];
}

export interface SectionLine {
  id: string;
  name: string;
  points: { x: number; y: number }[]; // 场地坐标折线
}

export interface ReviewRecord {
  time: number;
  action: 'submit' | 'approve' | 'reject' | 'start';
  comment: string;
  operator: string;
}

export interface ProjectMeta {
  id: string;
  name: string;
  client: string;
  site: string;
  status: ProjectStatus;
  role: Role;
  nx: number;
  ny: number;
  nz: number;
  cell: number;            // 单格边长 m
  reworkCount: number;
  createdAt: number;
  updatedAt: number;
  reviewLog: ReviewRecord[];
}

export interface ProjectData extends ProjectMeta {
  materials: Material[];
  boreholes: Borehole[];
  sections: SectionLine[];
  /** base64 编码的 Uint8Array 体素数据，长度 nx*ny*nz */
  voxelsB64: string;
}

export interface EditorSettings {
  tool: 'single' | 'rect' | 'sphere' | 'pick' | 'pan' | 'select' | 'section-line';
  mode: 'add' | 'erase';
  brushMaterialId: number;
  brushSize: number;       // 矩形/球笔刷半径（格）
  currentZ: number;        // 当前标高（层索引）
  mirrorX: boolean;
  mirrorY: boolean;
  sliceAxis: 'x' | 'y';
  sliceIndex: number;
}

export const STATUS_LABEL: Record<ProjectStatus, string> = {
  ordered: '已下单',
  in_progress: '制作中',
  submitted: '待审核',
  rework: '退回返工',
  delivered: '已交付'
};

export const ROLE_LABEL: Record<Role, string> = {
  client: '客户',
  maker: '制作员',
  supervisor: '主管'
};
