import { createMemo } from 'solid-js';
import type { CampusEngine } from '../babylon/CampusEngine';
import { view } from '../store';

/** 比例尺：按当前像素米数取 1/2/5 整数档，右下角显示 */
export default function ScaleBar(props: { engine: () => CampusEngine | undefined }) {
  const scale = createMemo(() => {
    const engine = props.engine();
    const size = engine?.canvasSize();
    if (!engine || !size || !size.h) return null;
    const mpp = view().height / size.h; // 米/像素
    const targetPx = 90;
    const raw = targetPx * mpp;
    const pow = Math.pow(10, Math.floor(Math.log10(raw)));
    const candidates = [1, 2, 5, 10].map((m) => m * pow);
    const meters = candidates.find((m) => m >= raw) || candidates[candidates.length - 1];
    const px = meters / mpp;
    const label = meters >= 1000 ? (meters / 1000) + ' km' : meters + ' m';
    return { px, label };
  });

  return (
    <div class="overlay scale-bar">
      <div class="bar" style={{ width: (scale()?.px || 80) + 'px' }} />
      {scale()?.label || '—'}
    </div>
  );
}
