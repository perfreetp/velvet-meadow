// 视口组件:WebGPU 渲染(自动回退 Canvas2D),支持平移缩放、
// 编辑模式下选取/拖拽顶点/插入顶点,相机可与其他视口同步。
import { DOMAIN } from '../types.js';
import { buildMesh, pickSegment } from '../geometry.js';
import { WebGpuRenderer } from '../renderer-webgpu.js';
import { Canvas2DRenderer } from '../renderer-2d.js';
import { makeElevation } from '../elevation.js';
export class ViewportCanvas extends HTMLElement {
    canvas;
    renderer = null;
    readout;
    badge;
    network = null;
    basemapBmp = null;
    opacities = [1, 1, 1];
    selectedId = null;
    editMode = false;
    cam = { cx: DOMAIN.w / 2, cy: DOMAIN.h / 2, scale: 0.22 };
    dragging = false;
    dragVertex = -1;
    dragSeg = null;
    lastX = 0;
    lastY = 0;
    rafPending = false;
    ready;
    constructor() {
        super();
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
      <style>
        :host { display: block; position: relative; width: 100%; height: 100%; overflow: hidden; }
        canvas { width: 100%; height: 100%; display: block; cursor: grab; touch-action: none; }
        :host([editing]) canvas { cursor: crosshair; }
        .hud { position: absolute; left: 8px; bottom: 8px; font: 11px/1.4 monospace;
               background: rgba(20,24,28,.72); color: #cfe3ef; padding: 3px 8px; border-radius: 4px;
               pointer-events: none; white-space: pre; }
        .badge { position: absolute; right: 8px; top: 8px; font: 11px monospace;
                 background: rgba(20,24,28,.72); color: #9fe8a9; padding: 3px 8px; border-radius: 4px;
                 pointer-events: none; }
      </style>
      <canvas></canvas>
      <div class="hud"></div>
      <span class="badge"></span>
    `;
        this.canvas = root.querySelector('canvas');
        this.readout = root.querySelector('.hud');
        this.badge = root.querySelector('.badge');
        this.ready = this.initRenderer();
    }
    async initRenderer() {
        const gpu = await WebGpuRenderer.create(this.canvas);
        this.renderer = gpu ?? new Canvas2DRenderer(this.canvas);
        this.badge.textContent = gpu ? 'WebGPU' : 'Canvas2D(回退)';
        this.applyScene();
        this.requestRender();
    }
    connectedCallback() {
        const ro = new ResizeObserver(() => {
            this.resizeRenderer();
            this.requestRender();
        });
        ro.observe(this);
        this.canvas.addEventListener('pointerdown', (e) => this.onDown(e));
        this.canvas.addEventListener('pointermove', (e) => this.onMove(e));
        this.canvas.addEventListener('pointerup', (e) => this.onUp(e));
        this.canvas.addEventListener('dblclick', (e) => this.onDblClick(e));
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const before = this.screenToWorld(mx, my);
            this.cam.scale = Math.min(6, Math.max(0.04, this.cam.scale * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));
            const after = this.screenToWorld(mx, my);
            this.cam.cx += before.x - after.x;
            this.cam.cy += before.y - after.y;
            this.emitCamera();
            this.requestRender();
        }, { passive: false });
    }
    resizeRenderer() {
        const rect = this.getBoundingClientRect();
        this.renderer?.resize(rect.width, rect.height, window.devicePixelRatio || 1);
    }
    // ---- 对外接口 ----
    get rendererKind() {
        return this.renderer?.kind ?? 'init';
    }
    setNetwork(net) {
        this.network = net;
        this.applyScene();
        this.requestRender();
    }
    setSelection(id) {
        this.selectedId = id;
        this.applyScene();
        this.requestRender();
    }
    setOpacities(o) {
        this.opacities = o;
        this.renderer?.setOpacities(o);
        this.requestRender();
    }
    setBasemap(bmp) {
        this.basemapBmp = bmp;
        this.renderer?.setBasemap(bmp, DOMAIN.w, DOMAIN.h);
        this.requestRender();
    }
    setCamera(cx, cy, scale, silent = false) {
        this.cam = { cx, cy, scale };
        if (!silent)
            this.emitCamera();
        this.requestRender();
    }
    getCamera() {
        return { ...this.cam };
    }
    applyScene() {
        if (!this.renderer)
            return;
        const segments = this.network?.segments ?? [];
        const sea = this.seaPolyline();
        const mesh = buildMesh(segments, this.selectedId, sea);
        this.renderer.setScene({ segments, mesh, sea });
        this.renderer.setOpacities(this.opacities);
        this.renderer.setBasemap(this.basemapBmp, DOMAIN.w, DOMAIN.h);
    }
    seaPolyline() {
        if (!this.network)
            return null;
        const elev = makeElevation(this.network.params.seed);
        const pts = [];
        for (let x = 0; x <= DOMAIN.w; x += 50) {
            pts.push(x, elev.coastY(x));
        }
        return pts;
    }
    /** 视图适配到当前网络范围 */
    fitToNetwork() {
        if (!this.network || !this.network.segments.length)
            return;
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        for (const s of this.network.segments) {
            for (let i = 0; i < s.points.length; i += 2) {
                minX = Math.min(minX, s.points[i]);
                maxX = Math.max(maxX, s.points[i]);
                minY = Math.min(minY, s.points[i + 1]);
                maxY = Math.max(maxY, s.points[i + 1]);
            }
        }
        const rect = this.getBoundingClientRect();
        if (rect.width < 10 || rect.height < 10)
            return;
        const pad = 1.25;
        const sx = rect.width / Math.max(1, (maxX - minX) * pad);
        const sy = rect.height / Math.max(1, (maxY - minY) * pad);
        this.cam.cx = (minX + maxX) / 2;
        this.cam.cy = (minY + maxY) / 2;
        this.cam.scale = Math.min(6, Math.max(0.04, Math.min(sx, sy)));
        this.emitCamera();
        this.requestRender();
    }
    requestRender() {
        if (this.rafPending)
            return;
        this.rafPending = true;
        requestAnimationFrame(() => {
            this.rafPending = false;
            void this.ready.then(() => {
                this.resizeRenderer();
                if (!this.renderer)
                    return;
                this.renderer.setCamera(this.cam.cx, this.cam.cy, this.cam.scale);
                this.renderer.render();
            });
        });
    }
    emitCamera() {
        this.dispatchEvent(new CustomEvent('tcn-camera', { detail: this.getCamera(), bubbles: true, composed: true }));
    }
    // ---- 交互 ----
    screenToWorld(sx, sy) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (sx - rect.width / 2) / this.cam.scale + this.cam.cx,
            y: (sy - rect.height / 2) / this.cam.scale + this.cam.cy,
        };
    }
    pickTol() {
        return 10 / this.cam.scale;
    }
    onDown(e) {
        this.canvas.setPointerCapture(e.pointerId);
        const rect = this.canvas.getBoundingClientRect();
        this.lastX = e.clientX - rect.left;
        this.lastY = e.clientY - rect.top;
        this.dragging = true;
        this.dragVertex = -1;
        this.dragSeg = null;
        if (this.editMode && this.network) {
            const w = this.screenToWorld(this.lastX, this.lastY);
            const hit = pickSegment(this.network.segments, w.x, w.y, this.pickTol());
            const id = hit ? hit.segment.id : null;
            this.dispatchEvent(new CustomEvent('tcn-select', { detail: { id }, bubbles: true, composed: true }));
            if (hit) {
                this.dragSeg = hit.segment;
                this.dragVertex = hit.pointIndex;
            }
        }
    }
    onMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const w = this.screenToWorld(mx, my);
        this.readout.textContent = `x ${w.x.toFixed(0)} m  y ${w.y.toFixed(0)} m  比例 ${this.cam.scale.toFixed(2)} px/m`;
        if (!this.dragging)
            return;
        if (this.editMode && this.dragSeg && this.dragVertex >= 0) {
            // 拖拽顶点
            this.dragSeg.points[this.dragVertex * 2] = w.x;
            this.dragSeg.points[this.dragVertex * 2 + 1] = w.y;
            this.applyScene();
            this.requestRender();
        }
        else if (!this.editMode) {
            // 平移
            this.cam.cx -= (mx - this.lastX) / this.cam.scale;
            this.cam.cy -= (my - this.lastY) / this.cam.scale;
            this.emitCamera();
            this.requestRender();
        }
        this.lastX = mx;
        this.lastY = my;
    }
    onUp(_e) {
        if (this.dragging && this.dragSeg && this.dragVertex >= 0) {
            this.dispatchEvent(new CustomEvent('tcn-edit', {
                detail: { id: this.dragSeg.id },
                bubbles: true,
                composed: true,
            }));
        }
        this.dragging = false;
        this.dragVertex = -1;
        this.dragSeg = null;
    }
    onDblClick(e) {
        if (!this.editMode || !this.network)
            return;
        const rect = this.canvas.getBoundingClientRect();
        const w = this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
        const hit = pickSegment(this.network.segments, w.x, w.y, this.pickTol());
        if (!hit)
            return;
        // 在最近边内插入顶点
        const seg = hit.segment;
        const idx = Math.min(hit.pointIndex + 1, seg.points.length / 2 - 1);
        seg.points.splice(idx * 2, 0, w.x, w.y);
        seg.widths.splice(idx, 0, seg.widths[Math.max(0, idx - 1)]);
        this.dispatchEvent(new CustomEvent('tcn-edit', { detail: { id: seg.id }, bubbles: true, composed: true }));
        this.applyScene();
        this.requestRender();
    }
}
customElements.define('tcn-viewport', ViewportCanvas);
//# sourceMappingURL=viewport-canvas.js.map