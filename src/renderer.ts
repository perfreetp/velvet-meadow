// 渲染器统一接口:WebGPU 为主,Canvas2D 兜底。

import { ChannelSegment } from './types.js';
import { Mesh } from './geometry.js';

export interface SceneData {
  segments: ChannelSegment[];
  mesh: Mesh;
  sea: number[] | null; // 海岸线采样折线(扁平 xy),Canvas2D 回退用
}

export interface IRenderer {
  readonly kind: 'webgpu' | 'canvas2d';
  setScene(scene: SceneData): void;
  setBasemap(bmp: ImageBitmap | null, worldW: number, worldH: number): void;
  setCamera(cx: number, cy: number, scale: number): void; // scale: 像素/米
  setOpacities(o: [number, number, number]): void;
  resize(cssW: number, cssH: number, dpr: number): void;
  render(): void;
  dispose(): void;
}
