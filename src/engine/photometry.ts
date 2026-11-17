import type { Lamp, LampKind } from '../types';
import { clamp, deg2rad } from './geometry';

/** 黑体近似：色温 K -> 线性 sRGB 颜色（Tanner Helland 近似的线性化版本） */
export function colorTempToLinearRGB(kelvin: number): { r: number; g: number; b: number } {
  const t = clamp(kelvin, 1000, 12000) / 100;
  let r: number, g: number, b: number;
  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
    b = 255;
  }
  // sRGB gamma -> 线性
  const srgb = [clamp(r, 0, 255) / 255, clamp(g, 0, 255) / 255, clamp(b, 0, 255) / 255];
  const lin = srgb.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return { r: lin[0], g: lin[1], b: lin[2] };
}

/** 灯具库默认规格（可在实例上覆盖） */
export interface LampCatalogEntry {
  kind: LampKind;
  label: string;
  efficacyLmPerW: number;
  defaultPowerW: number;
  defaultBeamDeg: number; // 0 = 全向
  defaultColorTemp: number;
  defaultHeight: number;
  /** 光强分布指数：越大光束越集中（余弦幂次） */
  beamFocus: number;
  /** 是否向水面反射贡献（安装在水面以上才反射） */
  aboveWater: boolean;
}

export const LAMP_CATALOG: Record<LampKind, LampCatalogEntry> = {
  flood: {
    kind: 'flood',
    label: '投光灯',
    efficacyLmPerW: 90,
    defaultPowerW: 150,
    defaultBeamDeg: 36,
    defaultColorTemp: 4000,
    defaultHeight: 6,
    beamFocus: 8,
    aboveWater: true,
  },
  wallWasher: {
    kind: 'wallWasher',
    label: '洗墙灯',
    efficacyLmPerW: 70,
    defaultPowerW: 36,
    defaultBeamDeg: 60,
    defaultColorTemp: 3000,
    defaultHeight: 1.2,
    beamFocus: 3,
    aboveWater: true,
  },
  underwater: {
    kind: 'underwater',
    label: '水下灯',
    efficacyLmPerW: 60,
    defaultPowerW: 12,
    defaultBeamDeg: 45,
    defaultColorTemp: 5000,
    defaultHeight: -0.4,
    beamFocus: 5,
    aboveWater: false,
  },
  lanternString: {
    kind: 'lanternString',
    label: '灯笼串',
    efficacyLmPerW: 50,
    defaultPowerW: 8,
    defaultBeamDeg: 0,
    defaultColorTemp: 2200,
    defaultHeight: 4.5,
    beamFocus: 0,
    aboveWater: true,
  },
};

/**
 * 时间曲线（18:00 -> 23:00）
 * - 天空余晖强度：18 点最强，按平滑阶跃衰减，20:30 后接近 0
 * - 灯光调光：18 点 35%（黄昏低功率），19:30 后 100%，22:30 后微降至 90%（节能时段）
 */
export interface TimeCurve {
  skyGlow: number; // 0..1
  lampDimming: number; // 0..1
  skyColor: { r: number; g: number; b: number };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function timeCurve(hour: number): TimeCurve {
  const h = clamp(hour, 18, 23);
  // 余晖：18:00 = 1，19:00 ≈ 0.55，20:30 ≈ 0.02
  const skyGlow = Math.pow(1 - smoothstep(18, 20.5, h), 1.4);
  // 灯光：18:00 0.35 -> 19:30 1.0，保持到 22:30，之后 0.9
  const rampUp = smoothstep(18, 19.5, h);
  const lampDimming = 0.35 + 0.65 * rampUp - 0.1 * smoothstep(22.5, 23, h);
  // 天空色：黄昏橙紫 -> 深蓝黑夜
  const dusk = { r: 0.55, g: 0.32, b: 0.28 };
  const night = { r: 0.03, g: 0.05, b: 0.12 };
  const m = smoothstep(18, 20.5, h);
  return {
    skyGlow,
    lampDimming,
    skyColor: {
      r: dusk.r * (1 - m) + night.r * m,
      g: dusk.g * (1 - m) + night.g * m,
      b: dusk.b * (1 - m) + night.b * m,
    },
  };
}

/** 单灯光束内的光强系数（二维平面角分布），beamAngleDeg=0 表示全向 */
export function beamIntensity(lamp: Lamp, angleFromAim: number): number {
  const cat = LAMP_CATALOG[lamp.kind];
  if (lamp.beamAngleDeg <= 0) return 1; // 全向
  const half = deg2rad(lamp.beamAngleDeg / 2);
  const a = Math.abs(angleFromAim);
  if (a > half) return 0;
  // 余弦幂次分布 + 边缘软截止
  const cosA = Math.cos(a);
  const shaped = Math.pow(cosA, cat.beamFocus);
  const edge = smoothstep(half, half * 0.82, a); // 靠近边缘平滑
  return shaped * edge + (1 - edge) * shaped * 0.15;
}

/** 灯具总光通量 lm（含时间调光） */
export function lampLumens(lamp: Lamp, dimming: number): number {
  return lamp.powerW * lamp.efficacy * dimming;
}
