import { onCleanup, onMount } from 'solid-js';
import { LAYERS } from '../config';
import type { CampusData } from '../types';
import type { CampusEngine } from '../babylon/CampusEngine';
import { layerOn, setView, view } from '../store';

const COLOR: Record<string, string> = Object.fromEntries(LAYERS.map((l) => [l.id, l.color]));

/** 右下角鹰眼：楼栋缩略 + 当前视口框，点击平移，10fps 节流 */
export default function Minimap(props: { engine: () => CampusEngine | undefined; data: CampusData }) {
  let cv!: HTMLCanvasElement;
  let raf = 0;
  let last = 0;

  onMount(() => {
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 100) return;
      last = t;
      const engine = props.engine();
      if (!engine) return;
      const canvas = cv;
      const ctx = canvas.getContext('2d')!;
      const W = canvas.width;
      const H = canvas.height;
      const b = props.data.bounds;
      const sx = W / (b.maxX - b.minX);
      const sz = H / (b.maxZ - b.minZ);
      const px = (x: number) => (x - b.minX) * sx;
      const pz = (z: number) => (z - b.minZ) * sz;

      ctx.fillStyle = '#0d1524';
      ctx.fillRect(0, 0, W, H);

      // 道路
      ctx.strokeStyle = '#33405a';
      ctx.lineWidth = 1;
      for (const r of props.data.roads) {
        if (!layerOn.road) break;
        ctx.beginPath();
        ctx.moveTo(px(r.x1), pz(r.z1));
        ctx.lineTo(px(r.x2), pz(r.z2));
        ctx.stroke();
      }
      // 楼栋
      for (const bd of props.data.buildings) {
        if (!layerOn[bd.layer]) continue;
        ctx.fillStyle = COLOR[bd.layer];
        ctx.globalAlpha = 0.85;
        ctx.fillRect(px(bd.x - bd.w / 2), pz(bd.z - bd.d / 2), bd.w * sx, bd.d * sz);
      }
      ctx.globalAlpha = 1;

      // 当前视口框
      const v = view();
      const size = engine.canvasSize();
      const aspect = size.h ? size.w / size.h : 1.6;
      const halfW = (v.height * aspect) / 2;
      const halfH = v.height / 2;
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(px(v.targetX - halfW), pz(v.targetZ - halfH), halfW * 2 * sx, halfH * 2 * sz);
    };
    raf = requestAnimationFrame(draw);
    onCleanup(() => cancelAnimationFrame(raf));
  });

  const jump = (e: MouseEvent) => {
    const engine = props.engine();
    if (!engine) return;
    const rect = cv.getBoundingClientRect();
    const b = props.data.bounds;
    const x = b.minX + ((e.clientX - rect.left) / rect.width) * (b.maxX - b.minX);
    const z = b.minZ + ((e.clientY - rect.top) / rect.height) * (b.maxZ - b.minZ);
    const v = view();
    engine.setView({ ...v, targetX: x, targetZ: z });
    setView(engine.getView());
  };

  return <canvas ref={cv} width={300} height={220} onClick={jump} title="点击鹰眼平移视图" />;
}
