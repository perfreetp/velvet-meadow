import { BaseComponent, sharedCss, toast } from './base';
import { DocumentStore } from '../core/store';
import { Renderer, type Camera, type RenderOptions } from '../render/renderer';
import { hitAnchor, hitEdge } from '../core/geometry';
import { snap, type SnapResult } from '../core/snap';
import { bulgeFromApex, arcGeom, tessellateArc, dist } from '../core/math2d';
import type { PathData, Vec2 } from '../core/types';

export type EditorTool = 'select' | 'polyline' | 'arc' | 'pan';

interface DragState {
  kind: 'anchor' | 'pan' | 'marquee' | 'arc-apex';
  pathId?: string;
  anchorId?: string;
  segId?: string;
  startClient?: Vec2;
  origin?: Vec2;
  moved?: boolean;
  batchStarted?: boolean;
}

const CSS = `
:host { display: flex; flex-direction: column; flex: 1; min-height: 0; position: relative; }
.canvas-wrap { flex: 1; position: relative; min-height: 0; overflow: hidden; background: #0b111a; }
canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }
canvas.pan { cursor: grab; }
canvas.panning { cursor: grabbing; }
.bg-image {
  position: absolute; pointer-events: none; opacity: .35;
  image-rendering: auto; border: 1px dashed #475569;
}
.hud {
  position: absolute; left: 10px; bottom: 10px; display: flex; gap: 8px;
  background: rgba(15,23,42,.82); border: 1px solid var(--border);
  border-radius: 8px; padding: 6px 10px; font-size: 11px; color: var(--muted);
  pointer-events: none;
}
.snap-hint {
  position: absolute; left: 10px; top: 10px;
  background: rgba(15,23,42,.85); border: 1px solid var(--accent);
  border-radius: 8px; padding: 7px 12px; font-size: 12px;
  opacity: 0; transition: opacity .12s; pointer-events: none; max-width: 320px;
}
.snap-hint.show { opacity: 1; }
.snap-hint .k { color: var(--accent); font-weight: 600; }
.cursor-coord {
  position: absolute; pointer-events: none; font-size: 11px;
  color: #7dd3fc; background: rgba(15,23,42,.8); padding: 2px 6px;
  border-radius: 4px; transform: translate(10px, 10px); white-space: nowrap;
}
.marquee {
  position: absolute; border: 1px solid var(--accent);
  background: rgba(56,189,248,.12); pointer-events: none;
}
`;

export class EditorCanvas extends BaseComponent {
  private _store: DocumentStore | null = null;
  private initialized = false;
  /** 由父组件 EditorView 在 connectedCallback 后注入；注入时触发初始化 */
  get store(): DocumentStore { return this._store!; }
  set store(s: DocumentStore) {
    this._store = s;
    if (this.isConnected && !this.initialized) this.init();
  }
  private renderer!: Renderer;
  private canvas!: HTMLCanvasElement;
  private wrap!: HTMLElement;
  private hintEl!: HTMLElement;
  private coordEl!: HTMLElement;
  private bgEl!: HTMLElement;
  private marqueeEl!: HTMLElement;

  tool: EditorTool = 'select';
  snapGrid = true;
  snapAnchor = true;
  snapThresholdMm = 1.2;
  axisLock = false; // Shift 按住
  private drawingPathId: string | null = null;
  private drawingPoints: Vec2[] = [];
  private drawingType: 'line' | 'arc' = 'line';
  private arcApex: Vec2 | null = null; // 圆弧工具拖拽中的弧顶
  private hover: { pathId: string; anchorId: string } | null = null;
  private drag: DragState | null = null;
  private currentSnap: SnapResult | null = null;
  private rafPending = false;
  private bgImage: HTMLImageElement | null = null;
  private gapEnds: Vec2[] = [];
  private resizeObs?: ResizeObserver;
  /** 只读模式（复核/参考查看） */
  readOnly = false;

  constructor(store?: DocumentStore) {
    super();
    if (store) this._store = store;
  }

  connectedCallback(): void {
    this.render();
    this.cacheDom();
    if (this._store && !this.initialized) this.init();
  }

  private cacheDom(): void {
    this.wrap = this.$('#wrap')!;
    this.canvas = this.$('#cv') as HTMLCanvasElement;
    this.hintEl = this.$('#hint')!;
    this.coordEl = this.$('#coord')!;
    this.bgEl = this.$('#bg')!;
    this.marqueeEl = document.createElement('div');
    this.marqueeEl.className = 'marquee';
    this.marqueeEl.hidden = true;
    this.wrap.appendChild(this.marqueeEl);
  }

  private init(): void {
    if (!this._store || this.initialized) return;
    this.initialized = true;
    this.afterRender();
  }

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="canvas-wrap" id="wrap">
        <canvas id="cv"></canvas>
        <div class="bg-image" id="bg" hidden></div>
        <div class="snap-hint" id="hint"></div>
        <div class="cursor-coord" id="coord" hidden></div>
        <div class="hud">
          <span id="hud-tool">选择</span>
          <span id="hud-zoom"></span>
          <span id="hud-snap"></span>
          <span id="hud-lock"></span>
        </div>
      </div>`;
  }

  protected afterRender(): void {
    this.renderer = new Renderer(this.canvas);
    this.resizeObs = new ResizeObserver(() => this.handleResize());
    this.resizeObs.observe(this.wrap);
    requestAnimationFrame(() => {
      this.handleResize();
      this.renderer.fitView(this.store.doc.width, this.store.doc.height, this.wrap.clientWidth, this.wrap.clientHeight);
      this.invalidate();
    });

    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    this.canvas.addEventListener('pointermove', this.onPointerMove);
    this.canvas.addEventListener('pointerup', this.onPointerUp);
    this.canvas.addEventListener('pointerleave', this.onPointerLeave);
    this.canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvas.addEventListener('dblclick', this.onDblClick);
    this.canvas.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.store.addEventListener('change', this.invalidate);
    this.store.addEventListener('select', this.invalidate);
    this.store.addEventListener('load', this.onStoreLoad);
    this.invalidate();
  }

  disconnectedCallback(): void {
    this.resizeObs?.disconnect();
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this._store?.removeEventListener('change', this.invalidate);
    this._store?.removeEventListener('select', this.invalidate);
    this._store?.removeEventListener('load', this.onStoreLoad);
  }

  private onStoreLoad = (): void => {
    this.drawingPathId = null;
    this.drawingPoints = [];
    this.renderer.fitView(this.store.doc.width, this.store.doc.height, this.wrap.clientWidth, this.wrap.clientHeight);
    this.invalidate();
  };

  setTool(tool: EditorTool): void {
    this.tool = tool;
    this.cancelDrawing();
    this.canvas.classList.toggle('pan', tool === 'pan');
    this.invalidate();
  }

  setBackgroundImage(dataUrl?: string): void {
    if (!dataUrl) {
      this.bgImage = null;
      this.bgEl.hidden = true;
      this.invalidate();
      return;
    }
    const img = new Image();
    img.onload = () => {
      this.bgImage = img;
      (this.bgEl as HTMLImageElement).tagName;
      const el = this.bgEl as HTMLElement;
      el.style.backgroundImage = `url(${dataUrl})`;
      el.style.backgroundSize = '100% 100%';
      this.positionBg();
      this.invalidate();
    };
    img.src = dataUrl;
  }

  setGapEnds(pts: Vec2[]): void {
    this.gapEnds = pts;
    this.invalidate();
  }

  private positionBg(): void {
    if (!this.bgImage) return;
    const cam = this.renderer.getCamera();
    const p0 = { x: cam.offsetX, y: cam.offsetY };
    const w = this.store.doc.width * cam.scale;
    const h = this.store.doc.height * cam.scale;
    this.bgEl.style.left = `${p0.x}px`;
    this.bgEl.style.top = `${p0.y}px`;
    this.bgEl.style.width = `${w}px`;
    this.bgEl.style.height = `${h}px`;
    this.bgEl.hidden = false;
  }

  private handleResize = (): void => {
    const w = this.wrap.clientWidth, h = this.wrap.clientHeight;
    if (w === 0 || h === 0) return;
    this.renderer?.resize(w, h);
    this.positionBg();
    this.invalidate();
  };

  private invalidate = (): void => {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.draw();
    });
  };

  private clientToWorld(e: PointerEvent | WheelEvent | MouseEvent): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    return this.renderer.screenToWorld({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  private clientToCss(e: PointerEvent | MouseEvent): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private collectSnapPoints(excludePath?: string): Vec2[] {
    return this.snapAnchor ? this.store.allAnchorPoints(excludePath) : [];
  }

  private computeSnap(world: Vec2, origin?: Vec2): SnapResult {
    return snap(world, {
      points: this.collectSnapPoints(this.drawingPathId ?? undefined),
      grid: this.store.doc.grid,
      gridEnabled: this.snapGrid,
      anchorEnabled: this.snapAnchor,
      threshold: this.snapThresholdMm
    }, origin, this.axisLock);
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button === 1 || (e.button === 0 && this.tool === 'pan')) {
      this.drag = { kind: 'pan', startClient: { x: e.clientX, y: e.clientY } };
      this.canvas.setPointerCapture(e.pointerId);
      this.canvas.classList.add('panning');
      return;
    }
    if (e.button !== 0 || this.readOnly) return;
    const world = this.clientToWorld(e);
    const css = this.clientToCss(e);
    this.canvas.setPointerCapture(e.pointerId);

    if (this.tool === 'select') {
      const editablePaths = this.store.visiblePaths().filter(p => this.store.isPathEditable(p.id));
      const radiusPx = 8 / this.renderer.getCamera().scale;
      const anchorHit = hitAnchor(editablePaths, world, radiusPx);
      if (anchorHit) {
        this.store.selectAnchor(anchorHit.pathId, anchorHit.anchorId);
        if (!this.store.selectedPathIds.includes(anchorHit.pathId)) {
          this.store.togglePathSelection(anchorHit.pathId);
        }
        this.drag = {
          kind: 'anchor', pathId: anchorHit.pathId, anchorId: anchorHit.anchorId,
          origin: { ...world }, startClient: css, moved: false
        };
        return;
      }
      // 弧顶手柄拖拽（改 bulge）
      const edgeHit = hitEdge(editablePaths, world, radiusPx);
      if (edgeHit && edgeHit.seg.type === 'arc') {
        this.drag = {
          kind: 'arc-apex', pathId: edgeHit.pathId, segId: edgeHit.seg.id,
          startClient: css, moved: false
        };
        return;
      }
      if (edgeHit) {
        this.store.clearSelection();
        this.store.togglePathSelection(edgeHit.pathId);
        return;
      }
      // 空白：框选
      this.store.clearSelection();
      this.drag = { kind: 'marquee', startClient: css, moved: false };
      this.marqueeEl.hidden = false;
      this.marqueeEl.style.left = `${css.x}px`;
      this.marqueeEl.style.top = `${css.y}px`;
      this.marqueeEl.style.width = '0px';
      this.marqueeEl.style.height = '0px';
      return;
    }

    if (this.tool === 'polyline' || this.tool === 'arc') {
      this.handleDrawDown(world, e);
    }
  };

  private handleDrawDown(world: Vec2, e: PointerEvent): void {
    const layer = this.store.activeLayer;
    if (layer.locked || !layer.visible) {
      toast('当前图层已锁定或隐藏，无法绘制', 'warn');
      return;
    }
    const origin = this.drawingPoints.length ? this.drawingPoints[this.drawingPoints.length - 1] : undefined;
    const snapped = this.computeSnap(world, origin);
    const p = snapped.point;

    if (!this.drawingPathId) {
      const path = this.store.beginPath();
      this.drawingPathId = path.id;
      this.drawingType = this.tool === 'arc' ? 'arc' : 'line';
      this.store.appendAnchor(path.id, p, 'line');
      this.drawingPoints = [p];
      this.arcApex = null;
      return;
    }

    const path = this.store.doc.paths[this.drawingPathId];
    // 点击首点附近 -> 闭合
    const first = path.anchors[0];
    if (dist(p, first) <= this.snapThresholdMm) {
      this.finishDrawing(true);
      return;
    }

    if (this.drawingType === 'arc' && this.arcApex) {
      // 第二次点击（弧顶已由移动确定）：用弧顶生成弧段
      const bulge = bulgeFromApex(this.drawingPoints[this.drawingPoints.length - 1], p, this.arcApex);
      this.store.appendAnchor(this.drawingPathId, p, 'arc', bulge);
      this.arcApex = null;
    } else {
      this.store.appendAnchor(this.drawingPathId, p, this.drawingType);
    }
    this.drawingPoints.push(p);
    void e;
  }

  private onPointerMove = (e: PointerEvent): void => {
    const world = this.clientToWorld(e);
    const css = this.clientToCss(e);
    this.coordEl.hidden = false;
    this.coordEl.style.left = `${css.x}px`;
    this.coordEl.style.top = `${css.y}px`;
    this.coordEl.textContent = `x: ${world.x.toFixed(2)}  y: ${world.y.toFixed(2)} mm`;

    // 平移
    if (this.drag?.kind === 'pan') {
      const dx = e.clientX - (this.drag.startClient!.x);
      const dy = e.clientY - (this.drag.startClient!.y);
      this.drag.startClient = { x: e.clientX, y: e.clientY };
      this.renderer.pan(dx, dy);
      this.positionBg();
      this.invalidate();
      return;
    }

    const origin = this.drag?.kind === 'anchor' && this.drag.origin
      ? this.drag.origin
      : this.drawingPoints.length ? this.drawingPoints[this.drawingPoints.length - 1] : undefined;
    const snapped = this.computeSnap(world, origin);
    this.currentSnap = snapped;
    this.showSnapHint(snapped);

    if (this.drag?.kind === 'anchor') {
      const path = this.store.doc.paths[this.drag.pathId!];
      const anchor = path?.anchors.find(a => a.id === this.drag!.anchorId);
      if (!anchor) return;
      if (!this.drag.moved && dist(snapped.point, anchor) > 1e-4) {
        this.drag.moved = true;
        this.store.beginBatch('拖动锚点');
        this.drag.batchStarted = true;
      }
      if (this.drag.moved) this.store.moveAnchor(this.drag.pathId!, this.drag.anchorId!, snapped.point, false);
      this.invalidate();
      return;
    }

    if (this.drag?.kind === 'arc-apex') {
      // 用指针位置重算 bulge
      const path = this.store.doc.paths[this.drag.pathId!];
      const seg = path?.segs.find(s => s.id === this.drag!.segId);
      if (seg && seg.type === 'arc') {
        if (!this.drag.batchStarted) {
          this.store.beginBatch('调整曲率');
          this.drag.batchStarted = true;
          this.drag.moved = true;
        }
        const a = path.anchors.find(x => x.id === seg.a)!;
        const b = path.anchors.find(x => x.id === seg.b)!;
        seg.bulge = Math.max(-2, Math.min(2, bulgeFromApex(a, b, snapped.point)));
        this.invalidate();
      }
      return;
    }

    if (this.drag?.kind === 'marquee') {
      const x0 = this.drag.startClient!.x, y0 = this.drag.startClient!.y;
      this.marqueeEl.style.left = `${Math.min(x0, css.x)}px`;
      this.marqueeEl.style.top = `${Math.min(y0, css.y)}px`;
      this.marqueeEl.style.width = `${Math.abs(css.x - x0)}px`;
      this.marqueeEl.style.height = `${Math.abs(css.y - y0)}px`;
      return;
    }

    // 绘制中：圆弧工具移动时记录弧顶
    if (this.drawingPathId && this.drawingType === 'arc') {
      this.arcApex = snapped.point;
      this.invalidate();
      return;
    }

    // 悬停高亮
    if (this.tool === 'select' && !this.readOnly) {
      const radiusPx = 8 / this.renderer.getCamera().scale;
      const editablePaths = this.store.visiblePaths().filter(p => this.store.isPathEditable(p.id));
      const hit = hitAnchor(editablePaths, world, radiusPx);
      const nextHover = hit ? { pathId: hit.pathId, anchorId: hit.anchorId } : null;
      if (JSON.stringify(nextHover) !== JSON.stringify(this.hover)) {
        this.hover = nextHover;
        this.canvas.style.cursor = hit ? 'pointer' : 'crosshair';
        this.invalidate();
      }
    }
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this.drag?.kind === 'pan') {
      this.canvas.classList.remove('panning');
      this.positionBg();
    }
    if (this.drag?.kind === 'marquee') {
      this.marqueeEl.hidden = true;
      const css = this.clientToCss(e);
      const x0 = this.drag.startClient!.x, y0 = this.drag.startClient!.y;
      if (Math.abs(css.x - x0) > 3 || Math.abs(css.y - y0) > 3) {
        const wMin = this.renderer.screenToWorld({ x: Math.min(x0, css.x), y: 0 });
        const wMax = this.renderer.screenToWorld({ x: Math.max(x0, css.x), y: 0 });
        const hMin = this.renderer.screenToWorld({ x: 0, y: Math.min(y0, css.y) });
        const hMax = this.renderer.screenToWorld({ x: 0, y: Math.max(y0, css.y) });
        const minX = wMin.x, maxX = wMax.x;
        const minY = hMin.y, maxY = hMax.y;
        for (const path of this.store.visiblePaths()) {
          if (!this.store.isPathEditable(path.id)) continue;
          if (path.anchors.some(a => a.x >= minX && a.x <= maxX && a.y >= minY && a.y <= maxY)) {
            if (!this.store.selectedPathIds.includes(path.id)) this.store.togglePathSelection(path.id);
          }
        }
      }
    }
    if (this.drag?.batchStarted) {
      this.store.endBatch();
    }
    this.drag = null;
    this.invalidate();
  };

  private onPointerLeave = (): void => {
    this.hover = null;
    this.coordEl.hidden = true;
    this.hintEl.classList.remove('show');
    this.invalidate();
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const css = this.clientToCss(e);
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    this.renderer.zoom(factor, css);
    this.positionBg();
    this.invalidate();
  };

  private onDblClick = (e: MouseEvent): void => {
    if (this.readOnly) return;
    if (this.tool === 'select') {
      // 双击边插入锚点
      const world = this.clientToWorld(e);
      const radiusPx = 10 / this.renderer.getCamera().scale;
      const editablePaths = this.store.visiblePaths().filter(p => this.store.isPathEditable(p.id));
      const hit = hitEdge(editablePaths, world, radiusPx);
      if (hit) {
        this.store.insertAnchorOnEdge(hit.pathId, hit.seg.id, hit.q);
        toast('已插入锚点');
      }
    } else if ((this.tool === 'polyline' || this.tool === 'arc') && this.drawingPathId) {
      this.finishDrawing(false);
    }
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'Shift') {
      this.axisLock = true;
      this.invalidate();
    }
    if (e.key === 'Escape') {
      this.cancelDrawing();
      this.store.clearSelection();
    }
    if ((e.key === 'Enter') && this.drawingPathId) this.finishDrawing(false);
    if (e.key === 'Delete' || e.key === 'Backspace') {
      const sel = this.store.selectedAnchor;
      if (sel) {
        this.deleteAnchor(sel.pathId, sel.anchorId);
      } else if (this.store.selectedPathIds.length) {
        for (const id of [...this.store.selectedPathIds]) this.store.removePath(id);
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
      this.axisLock = false;
      this.invalidate();
    }
  };

  private deleteAnchor(pathId: string, anchorId: string): void {
    const path = this.store.doc.paths[pathId];
    if (!path) return;
    // 简化策略：点数<=2 时删除整条路径；否则移除锚点并合并相邻边（直线）
    if (path.anchors.length <= 2) {
      this.store.removePath(pathId);
      return;
    }
    this.store.beginBatch('删除锚点');
    const idx = path.anchors.findIndex(a => a.id === anchorId);
    const prevIdx = (idx - 1 + path.anchors.length) % path.anchors.length;
    const nextIdx = (idx + 1) % path.anchors.length;
    const prev = path.anchors[prevIdx];
    const next = path.anchors[nextIdx];
    path.anchors.splice(idx, 1);
    // 移除与该点相连的边，补一条 prev->next 直线
    path.segs = path.segs.filter(s => s.a !== anchorId && s.b !== anchorId);
    if (!path.closed || idx !== 0) {
      path.segs.splice(prevIdx, 0, { id: `s_${Math.random().toString(36).slice(2)}`, type: 'line', a: prev.id, b: next.id });
    }
    this.store.endBatch();
    this.store.selectedAnchor = null;
    toast('已删除锚点（相邻边合并为直线）');
  }

  private finishDrawing(close: boolean): void {
    if (!this.drawingPathId) return;
    const id = this.drawingPathId;
    const path = this.store.doc.paths[id];
    this.store.beginBatch(close ? '闭合轮廓' : '完成绘制');
    if (close) {
      this.store.closePath(id, this.drawingType);
    } else {
      path.closed = false;
    }
    this.store.endBatch();
    this.drawingPathId = null;
    this.drawingPoints = [];
    this.arcApex = null;
    this.invalidate();
    if (close) toast('轮廓已闭合', 'info');
  }

  cancelDrawing(): void {
    if (this.drawingPathId) {
      const id = this.drawingPathId;
      const path = this.store.doc.paths[id];
      if (path && path.anchors.length <= 1) this.store.removePath(id);
      else if (path) path.closed = false;
    }
    this.drawingPathId = null;
    this.drawingPoints = [];
    this.arcApex = null;
    this.invalidate();
  }

  isDrawing(): boolean { return this.drawingPathId !== null; }

  private showSnapHint(s: SnapResult): void {
    if (!s.hint) {
      this.hintEl.classList.remove('show');
      return;
    }
    const label = s.kind === 'grid' ? '格点' : s.kind === 'anchor' ? '点位' : '约束';
    this.hintEl.innerHTML = `<span class="k">${label}</span> · ${s.hint}`;
    this.hintEl.classList.add('show');
  }

  fitView(): void {
    this.renderer.fitView(this.store.doc.width, this.store.doc.height, this.wrap.clientWidth, this.wrap.clientHeight);
    this.positionBg();
    this.invalidate();
  }

  zoomBy(factor: number): void {
    const host = this.wrap;
    this.renderer.zoom(factor, { x: host.clientWidth / 2, y: host.clientHeight / 2 });
    this.positionBg();
    this.invalidate();
  }

  getCamera(): Camera { return this.renderer.getCamera(); }

  private draw(): void {
    if (!this.renderer) return;
    const cam = this.renderer.getCamera();
    const hudZoom = this.$('#hud-zoom');
    if (hudZoom) hudZoom.textContent = `缩放 ${(cam.scale).toFixed(1)} px/mm`;
    const hudTool = this.$('#hud-tool');
    if (hudTool) hudTool.textContent = { select: '选择/编辑', polyline: '折线绘制', arc: '圆弧绘制', pan: '平移' }[this.tool];
    const hudSnap = this.$('#hud-snap');
    if (hudSnap) hudSnap.textContent = `吸附: 格点${this.snapGrid ? '✓' : '✕'} 点位${this.snapAnchor ? '✓' : '✕'}`;
    const hudLock = this.$('#hud-lock');
    if (hudLock) hudLock.textContent = this.axisLock ? 'Shift 约束: 开' : 'Shift 约束: 关';

    let preview: RenderOptions['preview'] = null;
    if (this.drawingPathId && this.drawingPoints.length) {
      const path = this.store.doc.paths[this.drawingPathId];
      const pts = path ? path.anchors.map(a => ({ ...a })) : [...this.drawingPoints];
      if (this.currentSnap && this.drawingType === 'arc' && this.arcApex && pts.length) {
        // 弧预览：用细分点近似
        const last = pts[pts.length - 1];
        const bulge = bulgeFromApex(last, this.currentSnap.point, this.arcApex);
        const g = arcGeom(last, this.currentSnap.point, bulge);
        if (g) pts.push(...tessellateArc(g, 0.1).slice(1));
        else pts.push({ ...this.currentSnap.point });
      } else if (this.currentSnap) {
        pts.push({ ...this.currentSnap.point });
      }
      preview = { points: pts, closed: false, dashed: true, color: this.store.activeLayer.color };
    }

    this.renderer.render({
      width: this.store.doc.width,
      height: this.store.doc.height,
      grid: this.store.doc.grid,
      paths: this.store.visiblePaths(),
      editable: id => this.store.isPathEditable(id),
      selectedPathIds: this.store.selectedPathIds,
      selectedAnchor: this.store.selectedAnchor,
      intersections: this.store.doc.intersections,
      preview,
      snapMarker: this.currentSnap && this.currentSnap.kind !== 'none' || this.axisLock
        ? {
            point: this.currentSnap?.point ?? { x: 0, y: 0 },
            kind: this.currentSnap?.kind ?? 'none',
            constraint: this.currentSnap?.constraint,
            origin: this.drag?.origin ?? this.drawingPoints.at(-1)
          }
        : null,
      hoverAnchor: this.hover,
      gapEnds: this.gapEnds
    });
    this.positionBg();
  }
}

customElements.define('editor-canvas', EditorCanvas);
