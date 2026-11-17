import { createSignal, onMount, onCleanup, createEffect, Show } from 'solid-js';
import { store } from '../lib/store';
import { TOOLS, clamp } from '../lib/constants';
import { drawScene, shapePath2D } from './drawScene';
import {
  hitShape, nearestSegment, makeRectShape, makeEllipseShape,
  shapeBounds, newPoint, createShape
} from '../lib/geometry';
import { snapAngle, snapBounds, snapPoint } from '../lib/snapping';

// mode: 'edit' | 'review'
export default function EditorCanvas(props) {
  let canvasRef;
  const [view, setView] = createSignal({ zoom: 1, panX: 40, panY: 40, dpr: 1 });
  if (typeof window !== 'undefined') {
    window.__viewState = view;
    onCleanup(() => { if (window.__viewState === view) delete window.__viewState; });
  }
  const [marquee, setMarquee] = createSignal(null);
  const [creating, setCreating] = createSignal(null);
  const [penDraft, setPenDraft] = createSignal([]);
  const [penCursor, setPenCursor] = createSignal(null);
  const [areaDraft, setAreaDraft] = createSignal([]);
  const [hover, setHover] = createSignal(null);
  const drag = { mode: null };

  const doc = () => props.doc;
  const readOnly = () => props.mode === 'review';
  const tool = () => (readOnly() ? store.state.tool : store.state.tool);

  const toWorld = (e) => {
    const r = canvasRef.getBoundingClientRect();
    const sx = e.clientX - r.left;
    const sy = e.clientY - r.top;
    const v = view();
    return { x: (sx - v.panX) / v.zoom, y: (sy - v.panY) / v.zoom, sx, sy };
  };

  const lockedSet = () => {
    const set = new Set();
    const layers = doc().layers || [];
    const lockedLayers = new Set(layers.filter((l) => l.locked).map((l) => l.id));
    for (const s of doc().shapes) {
      if (s.locked || lockedLayers.has(s.parentId)) set.add(s.id);
    }
    return set;
  };

  function redraw() {
    const cv = canvasRef;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const v = view();
    drawScene(ctx, cv, v, doc(), {
      tool: tool(),
      selection: readOnly() ? { shapeIds: [] } : store.state.selection,
      activeShape: readOnly() ? null : doc().shapes.find((s) => s.id === store.state.selection.activeShapeId),
      guides: store.state.guides,
      penDraft: readOnly() ? null : penDraft(),
      penCursor: readOnly() ? null : penCursor(),
      areaDraft: areaDraft(),
      marquee: marquee(),
      creating: creating(),
      annotations: props.annotations || [],
      diffDoc: props.diffDoc || null,
      lockedSet: lockedSet()
    });
  }

  createEffect(redraw);

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const r = canvasRef.parentElement.getBoundingClientRect();
    canvasRef.width = Math.round(r.width * dpr);
    canvasRef.height = Math.round(r.height * dpr);
    canvasRef.style.width = `${r.width}px`;
    canvasRef.style.height = `${r.height}px`;
    setView((v) => ({ ...v, dpr }));
  }
  onMount(() => {
    resize();
    window.addEventListener('resize', resize);
  });
  onCleanup(() => window.removeEventListener('resize', resize));

  const zoomAt = (factor, cx, cy) => {
    setView((v) => {
      const nz = clamp(v.zoom * factor, 0.15, 8);
      const wx = (cx - v.panX) / v.zoom;
      const wy = (cy - v.panY) / v.zoom;
      return { ...v, zoom: nz, panX: cx - wx * nz, panY: cy - wy * nz };
    });
  };

  // ---- 命中 ----
  function hitTopShape(w) {
    const shapes = doc().shapes;
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (s.visible === false) continue;
      if (hitShape(s, w.x, w.y)) return s;
    }
    return null;
  }
  function hitNodeHandle(shape, w) {
    const tol = 6 / view().zoom;
    for (let i = 0; i < shape.points.length; i++) {
      const pt = shape.points[i];
      for (const h of ['in', 'out']) {
        if (pt[h] && Math.hypot(pt[h].x - w.x, pt[h].y - w.y) <= tol) return { idx: i, handle: h };
      }
      if (Math.hypot(pt.x - w.x, pt.y - w.y) <= tol) return { idx: i, handle: null };
    }
    return null;
  }

  function selectedShapes() {
    const ids = new Set(store.state.selection.shapeIds);
    return doc().shapes.filter((s) => ids.has(s.id));
  }
  function unionBounds(shapes) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of shapes) {
      const b = shapeBounds(s);
      minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
      maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
    }
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }

  // ---- 指针事件 ----
  function onPointerDown(e) {
    canvasRef.setPointerCapture(e.pointerId);
    const w = toWorld(e);
    if (e.button === 1 || (e.button === 0 && tool() === TOOLS.HAND)) {
      drag.mode = 'pan'; drag.sx = w.sx; drag.sy = w.sy; drag.pan = { ...view() };
      return;
    }
    if (e.button !== 0) return;

    if (readOnly()) {
      if (tool() === TOOLS.ANN_POINT) {
        props.onAddPoint?.({ x: w.x, y: w.y });
      } else if (tool() === TOOLS.ANN_AREA) {
        setAreaDraft((d) => [...d, { x: w.x, y: w.y }]);
      }
      return;
    }

    const t = tool();
    if (t === TOOLS.PEN) {
      const draft = [...penDraft()];
      // 点到起点则闭合
      if (draft.length >= 3 && Math.hypot(draft[0].x - w.x, draft[0].y - w.y) <= 8 / view().zoom) {
        finishPen(true);
        return;
      }
      const snapped = e.shiftKey ? snapAngle(w.x, w.y, draft.at(-1)?.x ?? w.x, draft.at(-1)?.y ?? w.y) : { x: w.x, y: w.y };
      draft.push(newPoint(snapped.x, snapped.y));
      setPenDraft(draft);
      return;
    }

    if (t === TOOLS.RECT || t === TOOLS.ELLIPSE) {
      setCreating({ kind: t === TOOLS.RECT ? 'rect' : 'ellipse', x0: w.x, y0: w.y, x1: w.x, y1: w.y });
      drag.mode = 'creating';
      return;
    }

    if (t === TOOLS.NODE) {
      const activeId = store.state.selection.activeShapeId;
      const active = doc().shapes.find((s) => s.id === activeId);
      if (active) {
        const hh = hitNodeHandle(active, w);
        if (hh) {
          store.beginInteraction();
          drag.mode = 'node';
          drag.shapeId = active.id;
          drag.idx = hh.idx;
          drag.handle = hh.handle;
          store.setSelection({ shapeIds: [active.id], activeShapeId: active.id, nodeIndex: hh.idx });
          return;
        }
        const ns = nearestSegment(active, w.x, w.y);
        if (ns && ns.distance <= 12 / view().zoom) {
          store.insertNodeOnSegment(active.id, ns.segIdx);
          return;
        }
      }
      const shp = hitTopShape(w);
      if (shp) {
        store.setSelection({ shapeIds: [shp.id], activeShapeId: shp.id, nodeIndex: null });
        store.beginInteraction();
        drag.mode = 'shape';
        drag.ids = new Set([shp.id]);
        drag.lastX = w.x; drag.lastY = w.y;
      } else {
        store.setSelection({ shapeIds: [], activeShapeId: null, nodeIndex: null });
      }
      return;
    }

    // 选择工具
    const shp = hitTopShape(w);
    const locked = lockedSet();
    if (shp) {
      let ids;
      if (e.shiftKey) {
        const cur = new Set(store.state.selection.shapeIds);
        if (cur.has(shp.id)) cur.delete(shp.id); else cur.add(shp.id);
        ids = [...cur];
      } else if (!store.state.selection.shapeIds.includes(shp.id)) {
        ids = [shp.id];
      } else {
        ids = [...store.state.selection.shapeIds];
      }
      store.setSelection({ shapeIds: ids, activeShapeId: shp.id, nodeIndex: null });
      if (!locked.has(shp.id)) {
        store.beginInteraction();
        drag.mode = 'shape';
        drag.ids = new Set(ids.filter((id) => !locked.has(id)));
        drag.lastX = w.x; drag.lastY = w.y;
      }
    } else {
      drag.mode = 'marquee';
      setMarquee({ x0: w.x, y0: w.y, x1: w.x, y1: w.y });
      if (!e.shiftKey) store.setSelection({ shapeIds: [], activeShapeId: null, nodeIndex: null });
    }
  }

  function onPointerMove(e) {
    const w = toWorld(e);
    setHover({ x: w.x, y: w.y });
    if (tool() === TOOLS.PEN && penDraft().length) {
      const last = penDraft().at(-1);
      const snapped = e.shiftKey ? snapAngle(w.x, w.y, last.x, last.y) : { x: w.x, y: w.y };
      setPenCursor(snapped);
    }
    if (!drag.mode) return;

    if (drag.mode === 'pan') {
      const v = drag.pan;
      setView({ ...v, panX: v.panX + (w.sx - drag.sx), panY: v.panY + (w.sy - drag.sy) });
      return;
    }
    if (drag.mode === 'creating') {
      setCreating((c) => ({ ...c, x1: w.x, y1: w.y }));
      return;
    }
    if (drag.mode === 'marquee') {
      setMarquee((m) => ({ ...m, x1: w.x, y1: w.y }));
      return;
    }
    if (drag.mode === 'shape') {
      const dx = w.x - drag.lastX, dy = w.y - drag.lastY;
      let guides = [];
      let adx = dx, ady = dy;
      if (doc().settings.snap) {
        const b = unionBounds(selectedShapes());
        const r = snapBounds(b, doc().shapes, drag.ids);
        adx += r.dx; ady += r.dy; guides = r.guides;
      }
      if (e.shiftKey) {
        // shift 锁定水平/垂直主方向
        if (Math.abs(dx) > Math.abs(dy)) ady = 0; else adx = 0;
      }
      store.translateShapes(drag.ids, adx, ady);
      store.setGuides(guides);
      drag.lastX = w.x; drag.lastY = w.y;
      return;
    }
    if (drag.mode === 'node') {
      let nx = w.x, ny = w.y;
      let guides = [];
      if (!drag.handle && doc().settings.snap) {
        const r = snapPoint(w.x, w.y, doc().shapes, new Set([drag.shapeId]));
        nx = r.x; ny = r.y; guides = r.guides;
      }
      if (e.shiftKey && !drag.handle) {
        const s = doc().shapes.find((x) => x.id === drag.shapeId);
        const pt = s.points[drag.idx];
        if (Math.abs(w.x - pt.x) > Math.abs(w.y - pt.y)) ny = pt.y; else nx = pt.x;
      }
      store.moveNode(drag.shapeId, drag.idx, nx, ny, drag.handle);
      store.setGuides(guides);
    }
  }

  function onPointerUp(e) {
    try { canvasRef.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    if (drag.mode === 'marquee') {
      const m = marquee();
      if (m) {
        const x0 = Math.min(m.x0, m.x1), x1 = Math.max(m.x0, m.x1);
        const y0 = Math.min(m.y0, m.y1), y1 = Math.max(m.y0, m.y1);
        if (Math.abs(x1 - x0) > 2 || Math.abs(y1 - y0) > 2) {
          const ids = doc().shapes
            .filter((s) => s.visible !== false)
            .filter((s) => {
              const b = shapeBounds(s);
              return b.minX >= x0 && b.maxX <= x1 && b.minY >= y0 && b.maxY <= y1;
            })
            .map((s) => s.id);
          store.setSelection({ shapeIds: ids, activeShapeId: ids[0] || null, nodeIndex: null });
        }
      }
      setMarquee(null);
    }
    if (drag.mode === 'creating') {
      const c = creating();
      const w = Math.abs(c.x1 - c.x0), h = Math.abs(c.y1 - c.y0);
      if (w > 2 && h > 2) {
        const cx = (c.x0 + c.x1) / 2, cy = (c.y0 + c.y1) / 2;
        const shape = c.kind === 'rect' ? makeRectShape(cx, cy, w, h) : makeEllipseShape(cx, cy, w / 2, h / 2);
        const layerId = doc().layers.find((l) => !l.locked)?.id ?? doc().layers[0]?.id;
        shape.parentId = layerId;
        store.addShape(shape);
        store.setTool(TOOLS.SELECT);
      }
      setCreating(null);
    }
    if (drag.mode === 'shape' || drag.mode === 'node') {
      store.endInteraction();
      store.setGuides([]);
    }
    drag.mode = null;
  }

  function onDoubleClick(e) {
    const w = toWorld(e);
    if (readOnly()) {
      if (tool() === TOOLS.ANN_AREA && areaDraft().length > 2) {
        props.onAddArea?.(areaDraft());
        setAreaDraft([]);
      }
      return;
    }
    if (tool() === TOOLS.PEN && penDraft().length >= 2) {
      finishPen(true); // 双击闭合
    }
  }

  function finishPen(closed) {
    const draft = penDraft();
    if (!draft || draft.length < 2) return;
    const shape = createShape({
      name: '钢笔自由路径',
      points: draft.map((p) => ({ ...p })),
      closed,
      fill: '#9bc4a4',
      parentId: doc().layers.find((l) => !l.locked)?.id ?? doc().layers[0]?.id
    });
    store.addShape(shape);
    setPenDraft([]);
    setPenCursor(null);
    store.setTool(TOOLS.SELECT);
  }

  function onWheel(e) {
    e.preventDefault();
    const w = toWorld(e);
    if (e.ctrlKey || e.metaKey) {
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, w.sx, w.sy);
    } else {
      setView((v) => ({ ...v, panX: v.panX - (e.shiftKey ? e.deltaY : e.deltaX), panY: v.panY - (e.shiftKey ? 0 : e.deltaY) }));
    }
  }

  function onKeyDown(e) {
    if (readOnly()) {
      if (e.key === 'Escape') setAreaDraft([]);
      return;
    }
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); store.undo(); return; }
    if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) { e.preventDefault(); store.redo(); return; }
    if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); store.duplicateSelection(); return; }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); store.deleteSelection(); return; }
    if (e.key === 'Escape') {
      setPenDraft([]); setPenCursor(null);
      store.setSelection({ shapeIds: [], activeShapeId: null, nodeIndex: null });
      store.setTool(TOOLS.SELECT);
      return;
    }
    if (e.key === 'Enter' && tool() === TOOLS.PEN && penDraft().length >= 2) { finishPen(true); return; }
    const map = { v: TOOLS.SELECT, p: TOOLS.PEN, n: TOOLS.NODE, r: TOOLS.RECT, o: TOOLS.ELLIPSE, h: TOOLS.HAND };
    if (!mod && map[e.key.toLowerCase()]) store.setTool(map[e.key.toLowerCase()]);
  }

  onMount(() => window.addEventListener('keydown', onKeyDown));
  onCleanup(() => window.removeEventListener('keydown', onKeyDown));

  return (
    <div class="canvas-wrap" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        class="editor-canvas"
        style={{ cursor: tool() === TOOLS.HAND ? 'grab' : readOnly() ? 'crosshair' : 'default', display: 'block' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDblClick={onDoubleClick}
        onWheel={onWheel}
        onContextMenu={(e) => { e.preventDefault(); if (tool() === TOOLS.PEN && penDraft().length >= 2) finishPen(false); }}
      />
      <div class="canvas-hud">
        <button class="hud-btn" onClick={() => zoomAt(1.2, canvasRef.clientWidth / 2, canvasRef.clientHeight / 2)}>＋</button>
        <button class="hud-btn" onClick={() => zoomAt(1 / 1.2, canvasRef.clientWidth / 2, canvasRef.clientHeight / 2)}>－</button>
        <button class="hud-btn" onClick={() => setView((v) => ({ ...v, zoom: 1, panX: 40, panY: 40 }))}>1:1</button>
        <span class="hud-zoom">{Math.round(view().zoom * 100)}%</span>
      </div>
      <Show when={readOnly() && tool() === TOOLS.ANN_AREA && areaDraft().length}>
        <div class="area-hint">圈选批注:已标 {areaDraft().length} 个点,双击完成 · Esc 取消</div>
      </Show>
      <Show when={!readOnly() && tool() === TOOLS.PEN}>
        <div class="area-hint">钢笔:单击加锚点(Shift 吸附 H/V/45°),双击/回车闭合,右键留开放路径,Esc 取消</div>
      </Show>
    </div>
  );
}
