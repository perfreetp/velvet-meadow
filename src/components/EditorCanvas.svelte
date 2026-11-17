<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { editor, type Tool, type AnchorRef } from '../editor/store.svelte';
  import type { Contour, Segment, Vec } from '../geometry/types';
  import { uid } from '../geometry/types';
  import { render, screenToWorld, worldToScreen, gridCache, type ViewTransform } from '../render/canvas';
  import { findSnap, type GuideLine } from '../geometry/snap';
  import { hitAnchor, hitSegment } from '../geometry/contour';
  import { nearestOnSeg, smoothPointsToCubics, arcFromPoints } from '../geometry/segments';
  import { dist, simplifyDP, SNAP_EPS } from '../geometry/math';
  import { isPartOutOfBoard, partWorldBBox } from '../geometry/checks';
  import { makeContour } from '../geometry/contour';

  let wrap: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let ro: ResizeObserver;

  let view = $state<ViewTransform>({ scale: 0.55, offsetX: 30, offsetY: 30 });
  let cssW = 800, cssH = 600;
  let guides = $state<GuideLine[]>([]);
  let snapPoint = $state<Vec | null>(null);
  let dragAnchor = $state<AnchorRef | null>(null);
  let outOfBoardIds = $state<Set<string>>(new Set());
  let cursorWorld = $state<Vec>({ x: 0, y: 0 });

  // 交互状态
  let spacePan = $state(false);
  let panning = $state(false);
  let panStart = { x: 0, y: 0, ox: 0, oy: 0 };
  let partDrag: { id: string; startWorld: Vec; origX: number; origY: number } | null = $state(null);
  let drawing = $state(false);
  let draftContour: Contour | null = $state(null);
  let freePoints: Vec[] = [];
  let arcThrough: Vec | null = null; // 圆弧工具的中间点
  let movedDuringStroke = false;

  const tool = () => editor.tool;

  onMount(() => {
    ctx = canvas.getContext('2d')!;
    ro = new ResizeObserver(() => resize());
    ro.observe(wrap);
    resize();
    const raf = () => { draw(); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      ro.disconnect();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });

  function resize(): void {
    const r = wrap.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    cssW = r.width; cssH = r.height;
    canvas.width = Math.round(r.width * dpr);
    canvas.height = Math.round(r.height * dpr);
    canvas.style.width = `${r.width}px`;
    canvas.style.height = `${r.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    gridCache.invalidate();
  }

  function onKeyDown(e: KeyboardEvent): void {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.code === 'Space') { spacePan = true; e.preventDefault(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      e.shiftKey ? editor.redo() : editor.undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); editor.redo(); }
    if (e.key === 'Escape') cancelDraft();
    if (e.key === 'Enter' && draftContour?.segs.length) finishDraft(true);
    if (e.key === 'Delete' || e.key === 'Backspace') deleteSelection();
    const shortcut: Record<string, Tool> = { v: 'select', l: 'line', a: 'arc', f: 'freehand' };
    if (!e.ctrlKey && !e.metaKey && shortcut[e.key.toLowerCase()]) pickTool(shortcut[e.key.toLowerCase()]);
  }
  function onKeyUp(e: KeyboardEvent): void { if (e.code === 'Space') spacePan = false; }

  function deleteSelection(): void {
    const sel = editor.selection;
    if (!sel) return;
    if (sel.kind === 'contour') editor.removeContour(sel.partId, sel.id);
    if (sel.kind === 'holes') editor.removeHoles(sel.partId, sel.holeIds);
  }

  function draw(): void {
    if (!ctx) return;
    outOfBoardIds = new Set(editor.doc.parts.filter(p => isPartOutOfBoard(editor.doc, p)).map(p => p.id));
    const findings = editor.report?.findings.filter(f => f.status !== 'rejected').map(f => ({
      points: f.points, severity: f.severity
    })) ?? [];
    render(ctx, {
      doc: editor.doc,
      view,
      width: cssW,
      height: cssH,
      selectedContourId: editor.selection?.kind === 'contour' ? editor.selection.id : null,
      selectedHoleIds: editor.selectedHoleIds,
      selectedPartId: editor.selection?.kind === 'part' ? editor.selection.id : null,
      dragAnchor,
      guides,
      snapPoint,
      hoverPoint: null,
      outOfBoardPartIds: outOfBoardIds,
      previewContour: draftContour,
      previewPartId: draftContour ? editor.doc.activePartId : null,
      findings
    });
  }

  function localPoint(e: PointerEvent): Vec {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  /** 指针世界坐标,带吸附 */
  function snappedWorld(e: PointerEvent): { world: Vec; snapped: Vec | null } {
    const world = screenToWorld(localPoint(e), view);
    const part = editor.activePart;
    const res = findSnap(editor.doc, world, view.scale, cssW / view.scale, cssH / view.scale, partDrag?.id);
    guides = res.guides;
    snapPoint = res.snapped;
    return { world, snapped: res.snapped ?? null };
  }

  function onPointerDown(e: PointerEvent): void {
    canvas.setPointerCapture(e.pointerId);
    movedDuringStroke = false;
    const sp = localPoint(e);
    const worldRaw = screenToWorld(sp, view);
    const { world, snapped } = snappedWorld(e);
    const target = snapped ?? world;
    cursorWorld = target;

    if (e.button === 1 || spacePan || tool() === 'select' && e.button === 2) {
      panning = true;
      panStart = { x: sp.x, y: sp.y, ox: view.offsetX, oy: view.offsetY };
      return;
    }

    const t = tool();
    if (t === 'select') return handleSelectDown(e, sp, worldRaw, target);
    if (t === 'add-anchor' || t === 'delete-anchor') return handleAnchorTool(e, target);
    return handleDrawDown(e, target, worldRaw);
  }

  function handleSelectDown(e: PointerEvent, sp: Vec, worldRaw: Vec, target: Vec): void {
    const tolPx = 8;
    const tolMm = tolPx / view.scale;
    // 1. 锚点(选中轮廓上)
    if (editor.selection?.kind === 'contour') {
      const c = editor.findContour(editor.selection.partId, editor.selection.id);
      if (c) {
        const part = editor.findPart(editor.selection.partId)!;
        const local = { x: worldRaw.x - part.x, y: worldRaw.y - part.y };
        const ai = hitAnchor(c, local, tolMm);
        if (ai >= 0) {
          dragAnchor = { partId: part.id, contourId: c.id, anchor: ai };
          editor.commit();
          return;
        }
      }
    }
    // 2. 孔
    for (const p of editor.doc.parts) {
      for (const h of p.holes) {
        const hp = { x: h.cx + p.x, y: h.cy + p.y };
        if (dist(hp, worldRaw) <= Math.max(h.r, tolMm)) {
          editor.setActivePart(p.id);
          editor.toggleHoleSelection(h.id, e.shiftKey);
          editor.selection = { kind: 'holes', partId: p.id, holeIds: editor.selectedHoleIds };
          return;
        }
      }
    }
    // 3. 轮廓
    for (const p of editor.doc.parts) {
      for (const c of p.contours) {
        const local = { x: worldRaw.x - p.x, y: worldRaw.y - p.y };
        const hit = hitSegment(c, local, tolMm);
        if (hit) {
          editor.setActivePart(p.id);
          editor.selection = { kind: 'contour', id: c.id, partId: p.id };
          editor.clearHoleSelection();
          return;
        }
      }
    }
    // 4. 零件包围盒 -> 拖动
    for (const p of editor.doc.parts) {
      const bb = partWorldBBox(p);
      if (worldRaw.x >= bb.minX && worldRaw.x <= bb.maxX && worldRaw.y >= bb.minY && worldRaw.y <= bb.maxY) {
        editor.setActivePart(p.id);
        editor.selection = { kind: 'part', id: p.id };
        editor.clearHoleSelection();
        partDrag = { id: p.id, startWorld: worldRaw, origX: p.x, origY: p.y };
        editor.commit();
        return;
      }
    }
    editor.selection = null;
    editor.clearHoleSelection();
    void sp; void target;
  }

  function handleAnchorTool(e: PointerEvent, target: Vec): void {
    const part = editor.activePart;
    if (!part) return;
    const local = { x: target.x - part.x, y: target.y - part.y };
    const tolMm = 8 / view.scale;
    for (const c of part.contours) {
      if (tool() === 'add-anchor') {
        if (editor.insertAnchorAt(part.id, c.id, local, tolMm)) {
          editor.selection = { kind: 'contour', id: c.id, partId: part.id };
          return;
        }
      } else {
        if (editor.deleteAnchorAt(part.id, c.id, local, tolMm)) return;
      }
    }
    void e;
  }

  function handleDrawDown(e: PointerEvent, target: Vec, worldRaw: Vec): void {
    const part = editor.activePart;
    if (!part) return;
    const local = { x: target.x - part.x, y: target.y - part.y };
    const t = tool();

    if (t === 'freehand') {
      if (!drawing) {
        editor.commit();
        drawing = true;
        freePoints = [local];
        draftContour = makeContour([], false, '自由曲线');
      } else {
        freePoints.push(local);
      }
      return;
    }

    if (!drawing) {
      editor.commit();
      drawing = true;
      arcThrough = null;
      draftContour = makeContour([], false, t === 'arc' ? '圆弧' : '直线');
      draftContour.segs.push({ id: uid('ln'), type: 'line', a: { ...local }, b: { ...local } });
      return;
    }
    // 第二次落点:固化当前段
    const segs = draftContour!.segs;
    const last = segs[segs.length - 1];
    last.b = { ...local };
    if (t === 'arc' && arcThrough) {
      const arc = arcFromPoints(last.a, arcThrough, last.b);
      segs[segs.length - 1] = arc;
    }
    // 靠近首点 => 闭合
    const start = segs[0].a;
    if (dist(local, start) < SNAP_EPS / view.scale) {
      last.b = { ...start };
      finishDraft(true);
      return;
    }
    segs.push({ id: uid('ln'), type: 'line', a: { ...local }, b: { ...local } });
    arcThrough = null;
    void e; void worldRaw;
  }

  function onPointerMove(e: PointerEvent): void {
    const sp = localPoint(e);
    const worldRaw = screenToWorld(sp, view);
    movedDuringStroke = true;

    if (panning) {
      view.offsetX = panStart.ox + (sp.x - panStart.x);
      view.offsetY = panStart.oy + (sp.y - panStart.y);
      return;
    }

    const { snapped } = snappedWorld(e);
    const target = snapped ?? worldRaw;
    cursorWorld = target;

    // 锚点拖拽
    if (dragAnchor) {
      const part = editor.findPart(dragAnchor.partId)!;
      const c = part.contours.find(x => x.id === dragAnchor!.contourId)!;
      editor.dragAnchor(dragAnchor, { x: target.x - part.x, y: target.y - part.y });
      return;
    }

    // 零件拖动 + 让位
    if (partDrag) {
      const dx = target.x - partDrag.startWorld.x;
      const dy = target.y - partDrag.startWorld.y;
      editor.movePart(partDrag.id, partDrag.origX + dx, partDrag.origY + dy, dx, dy);
      return;
    }

    if (!drawing || !draftContour) return;
    const part = editor.activePart!;
    const local = { x: target.x - part.x, y: target.y - part.y };

    if (tool() === 'freehand') {
      freePoints.push(local);
      const simp = simplifyDP(freePoints, 0.4);
      draftContour.segs = smoothPointsToCubics(simp);
      return;
    }
    const last = draftContour.segs[draftContour.segs.length - 1];
    last.b = { ...local };
    if (tool() === 'arc') {
      // 移动中:用当前点与起终点的中点先给一个候选中间点;按住 Alt 固定中间点
      if (!e.altKey || !arcThrough) {
        arcThrough = { x: (last.a.x + local.x) / 2, y: (last.a.y + local.y) / 2 + dist(last.a, local) * 0.15 };
      }
      const arc = arcFromPoints(last.a, arcThrough, last.b);
      draftContour.segs[draftContour.segs.length - 1] = arc;
    }
  }

  function onPointerUp(e: PointerEvent): void {
    panning = false;
    if (dragAnchor) { dragAnchor = null; editor.save(); return; }
    if (partDrag) {
      partDrag = null;
      editor.save();
      return;
    }
    if (tool() === 'freehand' && drawing) {
      // 自由曲线按住拖动,松开即结束
      finishDraft(false);
    }
    void e;
  }

  function finishDraft(closed: boolean): void {
    if (!draftContour || !draftContour.segs.length) { cancelDraft(); return; }
    // 去掉零长末段
    draftContour.segs = draftContour.segs.filter(s => dist(s.a, s.b) > 0.05);
    if (!draftContour.segs.length) { cancelDraft(); return; }
    if (closed) {
      draftContour.closed = true;
      const last = draftContour.segs[draftContour.segs.length - 1];
      last.b = { ...draftContour.segs[0].a };
    }
    const c = draftContour;
    const part = editor.activePart!;
    part.contours.push(c);
    editor.selection = { kind: 'contour', id: c.id, partId: part.id };
    cancelDraft();
    editor.save();
  }

  function cancelDraft(): void {
    drawing = false;
    draftContour = null;
    freePoints = [];
    arcThrough = null;
    guides = [];
    snapPoint = null;
  }

  function onDblClick(): void {
    if (drawing && draftContour && tool() !== 'freehand') finishDraft(false);
  }

  function onWheel(e: WheelEvent): void {
    e.preventDefault();
    const sp = localPoint(e as unknown as PointerEvent);
    const before = screenToWorld(sp, view);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    view.scale = Math.min(8, Math.max(0.05, view.scale * factor));
    view.offsetX = sp.x - before.x * view.scale;
    view.offsetY = sp.y - before.y * view.scale;
    gridCache.invalidate();
  }

  function fitView(): void {
    const b = editor.doc.board;
    const sx = (cssW - 60) / b.width;
    const sy = (cssH - 60) / b.height;
    view.scale = Math.min(sx, sy, 4);
    view.offsetX = (cssW - b.width * view.scale) / 2;
    view.offsetY = (cssH - b.height * view.scale) / 2;
    gridCache.invalidate();
  }

  const toolMeta: { id: Tool; icon: string; label: string }[] = [
    { id: 'select', icon: '➤', label: '选择/拖动 (V)' },
    { id: 'line', icon: '╱', label: '直线 (L)' },
    { id: 'arc', icon: '⌒', label: '圆弧 (A)' },
    { id: 'freehand', icon: '〰', label: '自由曲线 (F)' },
    { id: 'add-anchor', icon: '⊕', label: '添加锚点' },
    { id: 'delete-anchor', icon: '⊖', label: '删除锚点' }
  ];

  function pickTool(t: Tool): void {
    cancelDraft();
    editor.tool = t;
  }
</script>

<div class="canvas-wrap" bind:this={wrap}>
  <canvas
    bind:this={canvas}
    onpointerdown={onPointerDown}
    onpointermove={onPointerMove}
    onpointerup={onPointerUp}
    ondblclick={onDblClick}
    onwheel={onWheel}
    oncontextmenu={(e) => e.preventDefault()}
    style={`cursor: ${spacePan ? 'grab' : editor.tool === 'select' ? 'default' : 'crosshair'}`}
  ></canvas>
  <div class="canvas-hud">
    <button onclick={fitView}>适应幅面</button>
    <span class="pill">缩放 {(view.scale * 100).toFixed(0)}%</span>
    <span class="pill mono">{cursorWorld.x.toFixed(1)}, {cursorWorld.y.toFixed(1)} mm</span>
    {#if snapPoint}
      <span class="pill snap">已吸附</span>
    {/if}
  </div>
  <div class="tool-rail-floating">
    {#each toolMeta as t (t.id)}
      <button
        class={editor.tool === t.id ? 'active' : ''}
        title={t.label}
        onclick={() => pickTool(t.id)}
      >{t.icon}</button>
    {/each}
  </div>
</div>

<style>
  canvas { display: block; touch-action: none; }
  .canvas-hud {
    position: absolute; left: 12px; bottom: 12px;
    display: flex; gap: 8px; align-items: center;
    pointer-events: auto;
  }
  .canvas-hud button { background: rgba(255,255,255,0.92); }
  .tool-rail-floating {
    position: absolute; top: 12px; left: 12px;
    display: flex; flex-direction: column; gap: 4px;
    background: rgba(255,255,255,0.94);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 5px;
    box-shadow: var(--shadow);
  }
  .tool-rail-floating button {
    width: 38px; height: 38px; padding: 0; font-size: 16px;
    display: flex; align-items: center; justify-content: center;
  }
  .snap { background: #fce7f3; color: #be185d; }
</style>
