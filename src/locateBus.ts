import type { CameraState } from './three/ThreeStage';

/** 全局画布定位注册表：暗区清单/批注列表请求画面居中到指定坐标 */
type Listener = (x: number, y: number) => void;

class LocateBus {
  private listeners = new Set<Listener>();
  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  locate(x: number, y: number): void {
    this.listeners.forEach((fn) => fn(x, y));
  }
}

export const locateBus = new LocateBus();

/** 比对视图共享相机 */
export const sharedCompareCam: { current: CameraState | null } = { current: null };
