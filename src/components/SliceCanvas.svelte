<script>
  import { onMount } from 'svelte';
  import {
    editor, paintAt, commitStroke, beginSelect, moveSelect, endSelect,
    copySelection, pasteClipboard, undo, redo, gotoLayer
  } from '../lib/editor.svelte.js';
  import { getV } from '../lib/voxel/core.js';

  let canvasEl = $state(null);
  let ctx = $state(null);
  let drawing = false;
  let panning = false;
  let panStart = null;
  let hover = $state(null); // {x,y}
  let redrawTick = $state(0);

  const CELL = $derived(editor.zoom);

  onMount(() => {
    ctx = canvasEl.getContext('2d');
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvasEl.parentElement);
    window.addEventListener('keydown', onKey);
    return () => { ro.disconnect(); window.removeEventListener('keydown', onKey); };
  });

  // 任何现场变化触发重绘
  $effect(() => {
    void redrawTick;
    void editor.currentZ;
    void editor.tool;
    void editor.brushRadius;
    void editor.mirrorX;
    void editor.mirrorY;
    void editor.selectRect;
    void editor.hiddenLayers.size;
    void editor.lockedLayers.size;
    void editor.deadOn;
    void editor.zoom;
    void editor.pan.x;
    void editor.pan.y;
    if (ctx) draw();
  });

  // 体素数据变化（voxelCount 是廉价信号）也重绘
  $effect(() => { void editor.voxelCount; if (ctx) draw(); });

  function draw() {
    const f = editor.field;
    if (!f || !ctx) return;
    const w = canvasEl.clientWidth, h = canvasEl.clientHeight;
    if (canvasEl.width !== w || canvasEl.height !== h) { canvasEl.width = w; canvasEl.height = h; }
    ctx.fillStyle = '#12151a';
    ctx.fillRect(0, 0, w, h);

    const z = editor.currentZ;
    const ox = editor.pan.x, oy = editor.pan.y;
    const c = CELL;

    // 网格
    ctx.strokeStyle = '#232a34';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= f.nx; x++) { ctx.moveTo(ox + x * c, oy); ctx.lineTo(ox + x * c, oy + f.ny * c); }
    for (let y = 0; y <= f.ny; y++) { ctx.moveTo(ox, oy + y * c); ctx.lineTo(ox + f.nx * c, oy + y * c); }
    ctx.stroke();

    const locked = editor.lockedLayers.has(z);
    const hidden = editor.hiddenLayers.has(z);

    // 体素
    for (let y = 0; y < f.ny; y++) {
      for (let x = 0; x < f.nx; x++) {
        if (getV(f, x, y, z) !== 1) continue;
        const dead = editor.deadMask?.[ (z * f.ny + y) * f.nx + x];
        ctx.fillStyle = dead ? 'rgba(220,70,70,.92)' : 'rgba(74,163,216,.85)';
        ctx.fillRect(ox + x * c + 0.5, oy + y * c + 0.5, c - 1, c - 1);
      }
    }

    // 镜像轴
    ctx.setLineDash([5, 4]);
    ctx.lineWidth = 1.2;
    if (editor.mirrorX) {
      const ax = f.nx % 2 ? ox + ((f.nx - 1) / 2 + 0.5) * c : ox + (f.nx / 2) * c;
      line(ax, oy, ax, oy + f.ny * c, '#9a7bd4');
    }
    if (editor.mirrorY) {
      const ay = f.ny % 2 ? oy + ((f.ny - 1) / 2 + 0.5) * c : oy + (f.ny / 2) * c;
      line(ox, ay, ox + f.nx * c, ay, '#9a7bd4');
    }
    ctx.setLineDash([]);

    // 框选矩形
    if (editor.selectRect) {
      const r = editor.selectRect;
      ctx.strokeStyle = '#eb822d';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(ox + r.x0 * c, oy + r.y0 * c, (r.x1 - r.x0 + 1) * c, (r.y1 - r.y0 + 1) * c);
      ctx.fillStyle = 'rgba(235,130,45,.12)';
      ctx.fillRect(ox + r.x0 * c, oy + r.y0 * c, (r.x1 - r.x0 + 1) * c, (r.y1 - r.y0 + 1) * c);
    }

    // 画笔预览（含镜像落点）
    if (hover && (editor.tool === 'brush' || editor.tool === 'eraser')) {
      const pts = brushPoints(hover.x, hover.y);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = editor.tool === 'brush' ? '#46cd6e' : '#dc4646';
      for (const [px, py] of pts) ctx.fillRect(ox + px * c, oy + py * c, c, c);
      ctx.globalAlpha = 1;
    }

    if (hidden) overlayMsg('该层已隐藏（只读预览）');
    else if (locked) overlayMsg('该层已锁定（不可编辑）');
  }

  function line(x1, y1, x2, y2, color) {
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  function overlayMsg(text) {
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.fillRect(12, 12, 180, 30);
    ctx.fillStyle = '#f2c14e';
    ctx.font = '12px sans-serif';
    ctx.fillText(text, 22, 31);
  }

  function brushPoints(cx, cy) {
    const f = editor.field;
    const r = editor.brushRadius, r2 = r * r;
    const base = [];
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++)
        if (dx * dx + dy * dy <= r2) base.push([cx + dx, cy + dy]);
    const out = new Set();
    for (let [x, y] of base) {
      const xs = editor.mirrorX ? [x, f.nx - 1 - x] : [x];
      const ys = editor.mirrorY ? [y, f.ny - 1 - y] : [y];
      for (const xx of xs) for (const yy of ys) {
        if (xx >= 0 && yy >= 0 && xx < f.nx && yy < f.ny) out.add(`${xx},${yy}`);
      }
    }
    return [...out].map((s) => s.split(',').map(Number));
  }

  function eventCell(ev) {
    const rect = canvasEl.getBoundingClientRect();
    const x = Math.floor((ev.clientX - rect.left - editor.pan.x) / CELL);
    const y = Math.floor((ev.clientY - rect.top - editor.pan.y) / CELL);
    const f = editor.field;
    if (x < 0 || y < 0 || x >= f.nx || y >= f.ny) return null;
    return { x, y };
  }

  function onDown(ev) {
    if (ev.button === 1 || ev.shiftKey) {
      panning = true;
      panStart = { x: ev.clientX - editor.pan.x, y: ev.clientY - editor.pan.y };
      canvasEl.setPointerCapture?.(ev.pointerId);
      return;
    }
    const p = eventCell(ev);
    if (!p) return;
    if (editor.tool === 'select') {
      beginSelect(p.x, p.y);
      return;
    }
    const z = editor.currentZ;
    if (editor.hiddenLayers.has(z) || editor.lockedLayers.has(z)) return;
    drawing = true;
    paintAt(p.x, p.y, editor.tool === 'brush' ? 1 : 0);
    redrawTick++;
  }

  function onMove(ev) {
    if (panning) {
      editor.pan = { x: ev.clientX - panStart.x, y: ev.clientY - panStart.y };
      return;
    }
    const p = eventCell(ev);
    hover = p;
    if (!p) return;
    if (editor.tool === 'select' && editor.selectStart) { moveSelect(p.x, p.y); return; }
    if (!drawing) return;
    paintAt(p.x, p.y, editor.tool === 'brush' ? 1 : 0);
    redrawTick++;
  }

  function onUp(ev) {
    if (panning) { panning = false; return; }
    if (editor.tool === 'select') { endSelect(); return; }
    if (drawing) {
      drawing = false;
      commitStroke(editor.tool === 'brush' ? '画笔堆体素' : '橡皮擦除');
    }
  }

  function onLeave() { hover = null; drawing = false; panning = false; }

  function onWheel(ev) {
    ev.preventDefault();
    editor.zoom = Math.max(5, Math.min(46, editor.zoom + (ev.deltaY < 0 ? 2 : -2)));
  }

  function onKey(ev) {
    if (ev.target.tagName === 'INPUT' || ev.target.tagName === 'SELECT') return;
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 'z') { ev.preventDefault(); undo(); }
    else if ((ev.ctrlKey || ev.metaKey) && ev.key === 'y') { ev.preventDefault(); redo(); }
    else if (ev.key === 'b') editor.tool = 'brush';
    else if (ev.key === 'e') editor.tool = 'eraser';
    else if (ev.key === 's') editor.tool = 'select';
    else if (ev.key === 'ArrowUp') gotoLayer(editor.currentZ + 1);
    else if (ev.key === 'ArrowDown') gotoLayer(editor.currentZ - 1);
    else if (ev.key === 'Enter' && editor.selectRect) copySelection();
  }
</script>

<div class="canvas-wrap">
  <canvas
    bind:this={canvasEl}
    onpointerdown={onDown}
    onpointermove={onMove}
    onpointerup={onUp}
    onpointerleave={onLeave}
    onwheel={onWheel}
  ></canvas>
  <div class="hint">
    左键 {editor.tool === 'select' ? '框选' : editor.tool === 'brush' ? '堆体素' : '擦除'} ·
    Shift/中键平移 · 滚轮缩放 · B 画笔 / E 橡皮 / S 框选 / Ctrl+Z 撤销 / ↑↓ 切层
    {#if editor.selectRect}
      · <button class="tiny primary" onclick={copySelection}>复制(Ctrl+Enter)</button>
      <button class="tiny" onclick={() => pasteClipboard('union')}>粘贴</button>
    {/if}
  </div>
</div>

<style>
  .canvas-wrap { flex: 1; position: relative; min-height: 0; }
  canvas { width: 100%; height: 100%; display: block; cursor: crosshair; touch-action: none; }
  .hint {
    position: absolute; bottom: 10px; left: 12px;
    background: rgba(20,23,29,.85); border: 1px solid var(--border);
    border-radius: 6px; padding: 6px 10px; color: var(--muted); font-size: 11px;
    display: flex; gap: 8px; align-items: center;
  }
</style>
