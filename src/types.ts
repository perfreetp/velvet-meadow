// 共享类型定义

export const LEVEL_NAMES = ['主干', '支沟', '毛细沟'] as const;
export type Level = 0 | 1 | 2;

/** 生成参数:同一组参数 + 同一种子 => 完全一致的网络 */
export interface GenParams {
  seed: number;            // 随机种子
  mainDirection: number;   // 主沟走向(度,0 = 正陆地方向,顺时针为正)
  bifurcationAngle: number;// 分叉角度(度)
  branchDensity: number;   // 支沟密度(条/km,沿主干)
  capillaryDensity: number;// 毛细沟密度(条/km,沿支沟)
  meanderAmp: number;      // 曲流幅度(米)
}

export const DEFAULT_PARAMS: GenParams = {
  seed: 20261118,
  mainDirection: 8,
  bifurcationAngle: 42,
  branchDensity: 3.2,
  capillaryDensity: 5.0,
  meanderAmp: 26,
};

export interface ChannelSegment {
  id: string;              // 路径式 id:'M' 主干,'M.2' 第3条支沟,'M.2.1' 毛细沟
  level: Level;
  parentId: string | null;
  points: number[];        // 扁平 [x0,y0,x1,y1,...] 世界坐标(米)
  widths: number[];        // 每点宽度(米)
  length: number;          // 沟长(米)
  locked: boolean;         // 手动锁定:整体重生成时形态不变
  custom: boolean;         // 曾被手动编辑
  color: [number, number, number]; // 分级配色(0..1)
}

export interface NetworkStats {
  counts: [number, number, number];
  lengths: [number, number, number]; // 米
  totalLength: number;
  junctions: number;
  density: number;         // km/km²
}

export interface Network {
  params: GenParams;
  segments: ChannelSegment[];
  stats: NetworkStats;
  generatedAt: string;     // 展示用时间戳,不影响几何确定性
}

/** 调查档案(编号归档) */
export interface SurveyArchive {
  id: string;              // 编号 TCN-YYYY-NNN
  year: number;
  region: string;          // 区域
  name: string;            // 档案名
  params: GenParams;
  network: Network;
  basemapName: string | null;
  basemap?: Blob;          // 航拍底图
  report: string;          // 调查说明
  createdAt: string;
}

export const DOMAIN = { w: 4000, h: 3000 }; // 调查区范围(米)
