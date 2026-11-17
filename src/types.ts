// 全局类型定义：校园要素、图层、工单

export type LayerId = 'building' | 'dorm' | 'canteen' | 'pipeline' | 'fire' | 'security' | 'power' | 'road';

export type PointCategory =
  | 'hydrant'        // 消火栓
  | 'camera'         // 摄像头
  | 'powerbox'       // 配电箱
  | 'light'          // 路灯
  | 'manhole'        // 检查井
  | 'valve'          // 阀门
  | 'gndnode';       // 接地端子（占量小要素）

export type FeatureType = 'building' | 'point' | 'pipeline' | 'road';

export interface BuildingFeature {
  id: string;
  type: 'building';
  layer: LayerId;
  code: string;              // 编号
  name: string;
  x: number;                 // 中心世界坐标（米）
  z: number;
  w: number;                 // 占地宽（米）
  d: number;                 // 占地深（米）
  height: number;            // 楼高（米）
  inspectDate: string;       // 上次巡检时间
}

export interface PointFeature {
  id: string;
  type: 'point';
  layer: LayerId;
  category: PointCategory;
  code: string;
  buildingCode: string;      // 所属楼栋（道路附属为 ROAD / CAMPUS）
  x: number;
  z: number;
  inspectDate: string;
}

export interface PipelineFeature {
  id: string;
  type: 'pipeline';
  layer: 'pipeline';
  code: string;
  name: string;             // 给水/中水/雨污/电力/通信
  x1: number; z1: number;
  x2: number; z2: number;
  diameter: number;         // 管径 mm
  trunk: boolean;           // 主管（分区级可见），支管需放到街区级
  inspectDate: string;
}

export interface RoadFeature {
  id: string;
  type: 'road';
  layer: 'road';
  name: string;
  x1: number; z1: number;
  x2: number; z2: number;
  width: number;
}

export type AnyFeature = BuildingFeature | PointFeature | PipelineFeature | RoadFeature;

export interface CampusData {
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  buildings: BuildingFeature[];
  points: PointFeature[];
  pipelines: PipelineFeature[];
  roads: RoadFeature[];
  /** 点位空间哈希网格，用于视锥裁剪与框选 */
  grid: SpatialGrid;
  featureById: Map<string, AnyFeature>;
}

/** 均匀网格空间索引（cell=60m），仅索引点状要素 */
export class SpatialGrid {
  cell = 60;
  private map = new Map<string, number[]>();
  constructor(public points: PointFeature[]) {
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const key = this.keyOf(p.x, p.z);
      const arr = this.map.get(key);
      if (arr) arr.push(i);
      else this.map.set(key, [i]);
    }
  }
  keyOf(x: number, z: number) {
    return Math.floor(x / this.cell) + ':' + Math.floor(z / this.cell);
  }
  /** 返回与给定矩形相交的所有格子内点位索引 */
  query(x0: number, z0: number, x1: number, z1: number): PointFeature[] {
    const cx0 = Math.floor(Math.min(x0, x1) / this.cell);
    const cx1 = Math.floor(Math.max(x0, x1) / this.cell);
    const cz0 = Math.floor(Math.min(z0, z1) / this.cell);
    const cz1 = Math.floor(Math.max(z0, z1) / this.cell);
    const out: PointFeature[] = [];
    for (let cx = cx0; cx <= cx1; cx++) {
      for (let cz = cz0; cz <= cz1; cz++) {
        const arr = this.map.get(cx + ':' + cz);
        if (arr) for (const i of arr) out.push(this.points[i]);
      }
    }
    return out;
  }
}

export interface ViewState {
  targetX: number;
  targetZ: number;
  height: number; // 正交视口高度（米），越小越近
}

export interface MeasureSeg { x1: number; z1: number; x2: number; z2: number; len: number }

export interface Mark { id: string; x: number; z: number; text: string; color: string }

export interface Bookmark {
  id: string;
  name: string;
  view: ViewState;
  createdAt: string;
}

export type ToolMode = 'select' | 'box' | 'measure' | 'mark';

export type OrderStatus = 'pending' | 'dispatched' | 'submitted' | 'done' | 'returned';
export type Role = 'dispatcher' | 'worker' | 'qa';

export interface WorkOrder {
  id: string;
  title: string;
  category: PointCategory | 'building' | 'pipeline' | 'road';
  featureId: string;
  featureCode: string;
  content: string;
  assignee: string | null;
  status: OrderStatus;
  reworkCount: number;
  createdAt: string;
  dispatchedAt: string | null;
  submittedAt: string | null;
  finishedAt: string | null;
  qaNote: string;
  resultNote: string;
}

export interface WorkerStat {
  worker: string;
  total: number;
  done: number;
  rework: number;
  reworkRate: number;
  pending: number;
}
