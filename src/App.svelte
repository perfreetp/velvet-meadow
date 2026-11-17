<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { buildCatalog, LAYERS, WORLD_W, WORLD_H } from './lib/data/catalog';
  import { GridIndex } from './lib/data/spatial';
  import { GpuRenderer } from './lib/render/Renderer';
  import Toolbar from './lib/components/Toolbar.svelte';
  import LayerPanel from './lib/components/LayerPanel.svelte';
  import InfoCard from './lib/components/InfoCard.svelte';
  import ComparePanel from './lib/components/ComparePanel.svelte';
  import Minimap from './lib/components/Minimap.svelte';
  import AdminPanel from './lib/components/AdminPanel.svelte';
  import {
    layerState, hoverId, selectedId, compareIds, boxMode, adminOpen,
    analytics, publishedChanges, dataVersion, visibleStats,
    recordView, recordDwell, flushDwell,
  } from './lib/stores/state';

  // ---------- 数据 ----------
  const { parts, vertexData, frameId, segCount } = buildCatalog();
  const grid = new GridIndex(parts, WORLD_W, WORLD_H, 100);
  let layerParts = [];
  function regroupLayers() {
    layerParts = LAYERS.map((l) => parts.filter((p) => p.layer === l.id && p.id !== frameId));
    layerCounts = LAYERS.map((l, i) => layerParts[i].length);
  }
  let layerCounts = [];

  // 应用一条变更到零件数据(可选同步写 GPU 顶点缓冲)
  const renderer = new GpuRenderer();
  function applyChange(id, ch, gpu) {
    const p = parts[id];
    if (!p) return;
    if (ch.name) p.name = ch.name;
    if (ch.material) p.material = ch.material;
    if (ch.layer !== undefined && ch.layer !== p.layer) {
      p.layer = ch.layer;
      for (let f = p.vStart * 4 + 3; f < (p.vStart + p.vCount) * 4; f += 4) {
        vertexData[f] = ((vertexData[f] | 0) & 3) | (ch.layer << 2);
      }
      if (gpu) renderer.writePartRange(vertexData, p);
    }
  }
  // 启动时先套用已发布变更(写 GPU 之前)
  for (const ch of get(publishedChanges)) applyChange(ch.partId, ch, false);
  regroupLayers();

  function applyToCatalog(changes) {
    for (const [id, ch] of Object.entries(changes)) applyChange(+id, ch, true);
    regroupLayers();
    dataVersion.update((n) => n + 1);
    dirty = true;
  }

  // ---------- 相机 ----------
  const cam = { x: WORLD_W / 2, y: WORLD_H / 2, scale: 0.4 };
  let camTarget = null;
  function flyTo(x, y, scale) {
    camTarget = { x, y, scale: scale ?? Math.max(cam.scale, 1.4) };
  }
  function resetView() {
    const s = Math.min(cssW / WORLD_W, cssH / WORLD_H) * 0.96;
    camTarget = { x: WORLD_W / 2, y: WORLD_H / 2, scale: s };
  }
  const zoomBy = (f) => {
    camTarget = { x: cam.x, y: cam.y, scale: clampScale(cam.scale * f) };
  };
  const clampScale = (s) => Math.min(8, Math.max(0.08, s));

  // ---------- 渲染状态 ----------
  let gpuCanvas, labelCanvas, container, minimap;
  let gpuOK = true, gpuError = '';
  let cssW = 1, cssH = 1, dpr = 1;
  let dirty = true;
  let lState = LAYERS.map(() => ({ visible: true, alpha: 1 }));
  let hover = -1;
  const flags = new Float32Array(parts.length);

  const unsub = [
    layerState.subscribe((v) => { lState = v; dirty = true; }),
    hoverId.subscribe((v) => { hover = v; dirty = true; }),
  ];

  function refreshFlags() {
    flags.fill(0);
    for (const id of get(compareIds)) flags[id] = 2;
    const sel = get(selectedId);
    if (sel >= 0) flags[sel] = 3;
    renderer.setFlags(flags);
    dirty = true;
  }
  const unsub2 = [
    compareIds.subscribe(refreshFlags),
    selectedId.subscribe(refreshFlags),
  ];

  // ---------- 主循环:裁剪 + LOD + 提交 ----------
  let raf = 0;
  function frame() {
    raf = requestAnimationFrame(frame);
    if (camTarget) {
      const k = 0.22;
      cam.x += (camTarget.x - cam.x) * k;
      cam.y += (camTarget.y - cam.y) * k;
      cam.scale += (camTarget.scale - cam.scale) * k;
      if (Math.abs(camTarget.x - cam.x) < 0.5 && Math.abs(camTarget.scale - cam.scale) < 0.002) {
        cam.x = camTarget.x; cam.y = camTarget.y; cam.scale = camTarget.scale;
        camTarget = null;
      }
      dirty = true;
    }
    trackDwell();
    if (!dirty || !gpuOK) return;
    dirty = false;

    const viewW = cssW / cam.scale;
    const viewH = cssH / cam.scale;
    const x0 = cam.x - viewW / 2, y0 = cam.y - viewH / 2;
    const visSet = grid.queryRect(x0, y0, x0 + viewW, y0 + viewH);

    // LOD:远处只留轮廓;中景加细线;放大后才画剖面线和尺寸标注
    const kinds = cam.scale < 0.35 ? KINDS_FAR : cam.scale < 1.2 ? KINDS_MID : KINDS_NEAR;
    const draws = [];
    const visibleParts = [];
    for (let li = 0; li < LAYERS.length; li++) {
      if (!lState[li].visible) continue;
      for (const p of layerParts[li]) {
        if (!visSet.has(p.id)) continue;
        visibleParts.push(p);
        for (const k of kinds) {
          const r = p.ranges[k];
          if (r[1]) draws.push(r);
        }
      }
    }
    const fp = parts[frameId];
    draws.push(fp.ranges[0], fp.ranges[1]);

    renderer.frame(cam, gpuCanvas.width, gpuCanvas.height, lState.map((l) => (l.visible ? l.alpha : 0)), hover, draws);
    drawLabels(visibleParts, kinds);
    visibleStats.set({ parts: visibleParts.length, draws: draws.reduce((a, d) => a + d[1] / 2, 0) });
    minimap?.update({ x: cam.x, y: cam.y, viewW, viewH });
  }
  const KINDS_FAR = [0];
  const KINDS_MID = [0, 1];
  const KINDS_NEAR = [0, 1, 2, 3];

  // ---------- 标注叠加层(Canvas2D:件号 + 尺寸文字 + 网格) ----------
  let labelCtx = null;
  function drawLabels(visibleParts, kinds) {
    const ctx = labelCtx;
    if (!ctx) return;
    ctx.clearRect(0, 0, cssW, cssH);
    // 网格
    ctx.strokeStyle = 'rgba(140,160,190,0.07)';
    ctx.lineWidth = 1;
    const step = 200 * cam.scale;
    if (step > 30) {
      const ox = cssW / 2 - cam.x * cam.scale;
      const oy = cssH / 2 - cam.y * cam.scale;
      ctx.beginPath();
      for (let x = ox % step; x < cssW; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, cssH); }
      for (let y = oy % step; y < cssH; y += step) { ctx.moveTo(0, y); ctx.lineTo(cssW, y); }
      ctx.stroke();
    }
    // 件号:零件在屏幕上足够大才画,避免远处糊成一片
    ctx.textAlign = 'center';
    ctx.font = '11px "Segoe UI", system-ui, sans-serif';
    let n = 0;
    for (const p of visibleParts) {
      const sh = (p.bbox[3] - p.bbox[1]) * cam.scale;
      if (sh < 14 || n >= 260) continue;
      const sx = (p.cx - cam.x) * cam.scale + cssW / 2;
      const sy = (p.cy - cam.y) * cam.scale + cssH / 2;
      ctx.fillStyle = p.id === hover ? '#ff8a5c' : '#aeb9c6';
      ctx.fillText(p.partNo, sx, sy);
      n++;
    }
    // 尺寸标注文字只在放大后出现(与几何 LOD 同步)
    if (kinds === KINDS_NEAR) {
      ctx.font = '10px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#d9a83c';
      for (const p of visibleParts) {
        const sx = (p.dimPos[0] - cam.x) * cam.scale + cssW / 2;
        const sy = (p.dimPos[1] - cam.y) * cam.scale + cssH / 2;
        ctx.fillText(p.dimText, sx, sy);
      }
    }
  }

  // ---------- 拾取 ----------
  function toWorld(sx, sy) {
    return [cam.x + (sx - cssW / 2) / cam.scale, cam.y + (sy - cssH / 2) / cam.scale];
  }
  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 2; i < poly.length; j = i, i += 2) {
      const xi = poly[i], yi = poly[i + 1], xj = poly[j], yj = poly[j + 1];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }
  function pick(sx, sy) {
    const [wx, wy] = toWorld(sx, sy);
    const ids = grid.queryPoint(wx, wy);
    let best = -1, bestArea = Infinity;
    for (const id of ids) {
      const p = parts[id];
      if (id === frameId || !lState[p.layer].visible) continue;
      if (pointInPoly(wx, wy, p.poly)) {
        const a = (p.bbox[2] - p.bbox[0]) * (p.bbox[3] - p.bbox[1]);
        if (a < bestArea) { bestArea = a; best = id; }
      }
    }
    return best;
  }

  // ---------- 交互 ----------
  let panning = false, panStart = null, moved = false;
  let boxStart = null, boxRect = null;
  let tooltip = null;

  function onDown(e) {
    gpuCanvas.setPointerCapture(e.pointerId);
    moved = false;
    if (get(boxMode)) {
      boxStart = [e.offsetX, e.offsetY];
      boxRect = { x: e.offsetX, y: e.offsetY, w: 0, h: 0 };
    } else {
      panning = true;
      panStart = { x: e.clientX, y: e.clientY, cx: cam.x, cy: cam.y };
      camTarget = null;
    }
  }
  function onMove(e) {
    if (panning && panStart) {
      const dx = e.clientX - panStart.x, dy = e.clientY - panStart.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      cam.x = panStart.cx - dx / cam.scale;
      cam.y = panStart.cy - dy / cam.scale;
      dirty = true;
      return;
    }
    if (boxStart) {
      const [bx, by] = boxStart;
      boxRect = {
        x: Math.min(bx, e.offsetX), y: Math.min(by, e.offsetY),
        w: Math.abs(e.offsetX - bx), h: Math.abs(e.offsetY - by),
      };
      moved = true;
      return;
    }
    const id = pick(e.offsetX, e.offsetY);
    if (id !== hover) hoverId.set(id);
    tooltip = id >= 0
      ? { x: e.offsetX + 14, y: e.offsetY + 16, text: `${parts[id].partNo} · ${parts[id].name}` }
      : null;
  }
  function onUp(e) {
    panning = false;
    panStart = null;
    if (boxStart) {
      if (boxRect && boxRect.w > 6 && boxRect.h > 6) finishBox(boxRect);
      boxStart = null;
      boxRect = null;
      return;
    }
    if (!moved) {
      const id = pick(e.offsetX, e.offsetY);
      selectedId.set(id);
      if (id >= 0) recordView(id);
    }
  }
  function onLeave() {
    hoverId.set(-1);
    tooltip = null;
  }
  function onWheel(e) {
    e.preventDefault();
    camTarget = null;
    const f = Math.exp(-e.deltaY * 0.0012);
    const ns = clampScale(cam.scale * f);
    const [wx, wy] = toWorld(e.offsetX, e.offsetY);
    cam.scale = ns;
    cam.x = wx - (e.offsetX - cssW / 2) / ns;
    cam.y = wy - (e.offsetY - cssH / 2) / ns;
    dirty = true;
  }
  function finishBox(rect) {
    const [wx0, wy0] = toWorld(rect.x, rect.y);
    const [wx1, wy1] = toWorld(rect.x + rect.w, rect.y + rect.h);
    const ids = grid.queryRect(wx0, wy0, wx1, wy1);
    compareIds.update((cur) => {
      const s = new Set(cur);
      for (const id of ids) {
        if (s.size >= 12) break;
        if (id !== frameId && lState[parts[id].layer].visible) s.add(id);
      }
      return [...s];
    });
  }

  function locate(id) {
    selectedId.set(id);
    recordView(id);
    flyTo(parts[id].cx, parts[id].cy);
  }
  function seek(wx, wy) {
    camTarget = null;
    cam.x = wx;
    cam.y = wy;
    dirty = true;
  }

  // ---------- 停留时长统计 ----------
  let dwellTarget = -1, dwellSince = 0;
  function trackDwell() {
    const now = performance.now();
    const t = hover >= 0 ? hover : get(selectedId);
    if (t !== dwellTarget) {
      if (dwellTarget >= 0) recordDwell(dwellTarget, (now - dwellSince) / 1000);
      dwellTarget = t;
      dwellSince = now;
    }
  }

  // ---------- 生命周期 ----------
  let ro = null;
  const flushTimer = setInterval(flushDwell, 4000);

  onMount(async () => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const r = container.getBoundingClientRect();
      cssW = r.width; cssH = r.height;
      for (const c of [gpuCanvas, labelCanvas]) {
        c.width = Math.round(cssW * dpr);
        c.height = Math.round(cssH * dpr);
      }
      labelCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirty = true;
    };
    labelCtx = labelCanvas.getContext('2d');
    ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    gpuOK = await renderer.init(gpuCanvas, vertexData, parts.length);
    gpuError = renderer.error;
    renderer.setFlags(flags);
    resetView();
    raf = requestAnimationFrame(frame);
  });

  onDestroy(() => {
    cancelAnimationFrame(raf);
    clearInterval(flushTimer);
    ro?.disconnect();
    [...unsub, ...unsub2].forEach((u) => u());
    flushDwell();
  });

  $: selPart = $selectedId >= 0 ? parts[$selectedId] : null;
</script>

<div class="app" bind:this={container}>
  <canvas
    class="gpu"
    bind:this={gpuCanvas}
    class:boxing={$boxMode}
    on:pointerdown={onDown}
    on:pointermove={onMove}
    on:pointerup={onUp}
    on:pointerleave={onLeave}
    on:wheel={onWheel}
  ></canvas>
  <canvas class="labels" bind:this={labelCanvas}></canvas>

  {#if !gpuOK}
    <div class="nogpu">
      <h2>无法启动 WebGPU</h2>
      <p>{gpuError || '当前环境不支持 WebGPU。'}</p>
      <p>请使用 Chrome / Edge 113+,并确认已开启硬件加速。</p>
    </div>
  {/if}

  <Toolbar
    {segCount}
    onZoomIn={() => zoomBy(1.4)}
    onZoomOut={() => zoomBy(1 / 1.4)}
    onReset={resetView}
  />
  <LayerPanel counts={layerCounts} />

  <div class="right">
    {#if $compareIds.length}
      <ComparePanel {parts} onLocate={locate} />
    {/if}
    {#if selPart}
      <InfoCard part={selPart} {parts} onLocate={locate} />
    {/if}
  </div>

  <Minimap bind:this={minimap} {parts} onSeek={seek} />

  {#if tooltip}
    <div class="tooltip" style="left:{tooltip.x}px; top:{tooltip.y}px">{tooltip.text}</div>
  {/if}
  {#if boxRect}
    <div
      class="boxrect"
      style="left:{boxRect.x}px; top:{boxRect.y}px; width:{boxRect.w}px; height:{boxRect.h}px"
    ></div>
  {/if}

  {#if $adminOpen}
    <AdminPanel {parts} onApply={applyToCatalog} onClose={() => adminOpen.set(false)} />
  {/if}
</div>
