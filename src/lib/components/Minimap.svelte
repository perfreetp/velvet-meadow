<script>
  import { onMount } from 'svelte';
  import { LAYERS, WORLD_W, WORLD_H } from '../data/catalog';

  export let parts;
  export let onSeek = () => {}; // (worldX, worldY) => void

  const W = 232;
  const H = Math.round((W * WORLD_H) / WORLD_W);
  let canvas;
  let lastCam = null;

  export function update(cam) {
    lastCam = cam;
    draw();
  }

  function draw() {
    if (!canvas || !lastCam) return;
    const ctx = canvas.getContext('2d');
    const sx = W / WORLD_W;
    const sy = H / WORLD_H;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#0a0f1a';
    ctx.fillRect(0, 0, W, H);
    // 零件包围盒,按图层着色
    for (const p of parts) {
      if (p.partNo === 'FRAME') continue;
      ctx.fillStyle = LAYERS[p.layer].color + '88';
      const b = p.bbox;
      ctx.fillRect(b[0] * sx, b[1] * sy, Math.max(1, (b[2] - b[0]) * sx), Math.max(1, (b[3] - b[1]) * sy));
    }
    // 当前视野范围
    const vw = lastCam.viewW * sx;
    const vh = lastCam.viewH * sy;
    const vx = (lastCam.x - lastCam.viewW / 2) * sx;
    const vy = (lastCam.y - lastCam.viewH / 2) * sy;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(vx, vy, vw, vh);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(vx, vy, vw, vh);
  }

  function seek(e) {
    const r = canvas.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / r.width) * WORLD_W;
    const wy = ((e.clientY - r.top) / r.height) * WORLD_H;
    onSeek(wx, wy);
  }

  let dragging = false;
  function down(e) {
    dragging = true;
    canvas.setPointerCapture(e.pointerId);
    seek(e);
  }
  function move(e) {
    if (dragging) seek(e);
  }
  function up() {
    dragging = false;
  }

  onMount(() => {
    if (lastCam) draw();
  });
</script>

<canvas
  class="minimap"
  bind:this={canvas}
  width={W}
  height={H}
  title="鹰眼图:点击或拖动跳转到图纸对应位置"
  on:pointerdown={down}
  on:pointermove={move}
  on:pointerup={up}
></canvas>
