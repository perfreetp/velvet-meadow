import type { LayerId, PointCategory } from './types';

/**
 * LOD 规则（按正交视口高度 H，单位米）：
 *  H > 380        总图级：仅楼栋轮廓（扁平）+ 主干道
 *  180 < H <= 380 分区级：全部楼栋、全部道路、主管线
 *  70 < H <= 180  街区级：次管线 + 路灯/检查井/阀门/接地端子
 *  H <= 70        近景级：消火栓、摄像头、配电箱等小要素
 */
export const LOD = {
  outline: 380,
  district: 180,
  street: 70,
} as const;

export interface LayerMeta {
  id: LayerId;
  name: string;
  color: string;
  /** 该图层在场景中的叠放次序（越大越靠上，点选穿透按此排序） */
  order: number;
  /** 默认开关 */
  on: boolean;
}

export const LAYERS: LayerMeta[] = [
  { id: 'building', name: '教学楼', color: '#5b8def', order: 10, on: true },
  { id: 'dorm', name: '宿舍楼', color: '#8e6cf0', order: 10, on: true },
  { id: 'canteen', name: '食堂', color: '#f0a23b', order: 10, on: true },
  { id: 'pipeline', name: '管线', color: '#34c8b0', order: 20, on: true },
  { id: 'fire', name: '消防设施', color: '#ef5350', order: 30, on: true },
  { id: 'security', name: '安防设施', color: '#42a5f5', order: 30, on: true },
  { id: 'power', name: '电力设施', color: '#ffca28', order: 30, on: true },
  { id: 'road', name: '道路', color: '#7a8699', order: 5, on: true },
];

export const LAYER_BY_ID: Record<LayerId, LayerMeta> = Object.fromEntries(
  LAYERS.map((l) => [l.id, l]),
) as Record<LayerId, LayerMeta>;

export interface CategoryMeta {
  id: PointCategory;
  name: string;
  layer: LayerId;
  color: string;
  /** 可见的最大视口高度（超过则隐藏） */
  maxH: number;
  /** 点选优先级（同位置取大者） */
  pickOrder: number;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'hydrant', name: '消火栓', layer: 'fire', color: '#ff5252', maxH: 70, pickOrder: 60 },
  { id: 'camera', name: '摄像头', layer: 'security', color: '#40c4ff', maxH: 70, pickOrder: 59 },
  { id: 'powerbox', name: '配电箱', layer: 'power', color: '#ffd740', maxH: 70, pickOrder: 58 },
  { id: 'valve', name: '阀门', layer: 'pipeline', color: '#4dd0e1', maxH: 180, pickOrder: 40 },
  { id: 'manhole', name: '检查井', layer: 'pipeline', color: '#80cbc4', maxH: 180, pickOrder: 39 },
  { id: 'light', name: '路灯', layer: 'power', color: '#fff59d', maxH: 180, pickOrder: 38 },
  { id: 'gndnode', name: '接地端子', layer: 'power', color: '#d7ccc8', maxH: 180, pickOrder: 37 },
];

export const CATEGORY_BY_ID: Record<PointCategory, CategoryMeta> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
) as Record<PointCategory, CategoryMeta>;

export const CATEGORY_FILTERS: { id: PointCategory | 'all'; name: string }[] = [
  { id: 'all', name: '全部类别' },
  ...CATEGORIES.map((c) => ({ id: c.id, name: c.name })),
];

export const MIN_H = 18;
export const MAX_H = 620;

export const ROAD_COLOR = '#5b6675';
export const MAIN_ROAD_COLOR = '#758195';
