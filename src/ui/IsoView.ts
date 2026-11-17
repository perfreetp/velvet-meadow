// 等轴测三维视图：SVG + d3，贪心合面渲染、DDA 拾取笔刷编辑、标高高亮
import * as d3 from 'd3';
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import { buildMesh, type MeshResult } from '../core/Mesher';
import { brushCoords, VoxelGrid, type VoxelCoord } from '../core/VoxelGrid';
import { editWithMirror } from '../core/Mirror';
import { isoProject, screenToRay, rayTarget, type IsoTransform } from '../core/Isometric';

const NORMAL_SHADE: Record<string, number> = {
  '0,0,-1': 0.62,
  '0,0,1': 1.0,
  '1,0,0': 0.8,
  '-1,0,0': 0.55,
  '0,1,0': 0.72,
  '0,-1,0': 0.5
};

export class IsoView extends GvsElement {
  private svgSel: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private gSel: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private t: IsoTransform = { scale: 10, ox: 320, oy: 360 };
  private mesh: MeshResult = { faces: [], triangles: 0 };
  private hover: VoxelCoord | null = null;
  private dragging = false;
  private panning = false;
  private lastPointer = { x: 0, y: 0 };
  private rebuildTimer = 0;
  private matColor = new Map<number, d3.RGBColor>();
  private width = 900;
  private height = 640;
  private unsub: (() => void) | null = null;

  protected styles(): string {
    return `
      :host { display: block; position: relative; height: 100%; }
      .wrap { position: relative; width: 100%; height: 100%; background: linear-gradient(180deg,#f8fafc,#eef2f7); border-radius: var(--radius); overflow: hidden; }
      svg { width: 100%; height: 100%; display: block; cursor: crosshair; touch-action: none; }
      .hint { position: absolute; left: 10px; bottom: 8px; background: rgba(255,255,255,.85); border: 1px solid var(--border); border-radius: 6px; padding: 4px 9px; font-size: 12px; color: var(--text-2); pointer-events: none; }
      .axis-label { font-size: 11px; fill: var(--text-2); font-weight: 600; }
    `;
  }

  protected template(): Node[] {
    const wrap = this.h('div', { class: 'wrap' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrap.append(svg);
    const hint = this.h('div', { class: 'hint' }, '左键绘制/擦除 · 滚轮缩放 · 平移工具拖拽画布');
    wrap.append(hint);
    return [wrap];
  }

  protected afterRender(): void {
    const svgEl = this.root.querySelector('svg') as SVGSVGElement;
    this.svgSel = d3.select(svgEl);
    this.gSel = this.svgSel.append('g');
    this.gSel.append('g').attr('class', 'faces');
    this.gSel.append('g').attr('class', 'highlight');
    this.gSel.append('g').attr('class', 'mirror');
    this.gSel.append('g').attr('class', 'hover');
    this.gSel.append('g').attr('class', 'overlay');

    const ro = new ResizeObserver(() => {
      const r = svgEl.getBoundingClientRect();
      this.width = Math.max(320, r.width);
      this.height = Math.max(320, r.height);
      this.centerTransform();
      this.draw();
    });
    ro.observe(svgEl);

    svgEl.addEventListener('pointerdown', this.onPointerDown);
    svgEl.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    svgEl.addEventListener('wheel', this.onWheel, { passive: false });
    svgEl.addEventListener('pointerleave', () => {
      this.hover = null;
      this.drawHover();
    });

    this.unsub = editorState.subscribe(() => this.scheduleRebuild());
    this.resetView();
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  resetView(): void {
    const { nx, ny, nz } = editorState.grid;
    const fitW = this.width / (nx + ny);
    const fitH = this.height / ((nx + ny) / 2 + nz);
    this.t.scale = Math.max(4, Math.min(14, Math.floor(Math.min(fitW, fitH) * 1.4)));
    this.centerTransform();
    this.scheduleRebuild();
  }

  private centerTransform(): void {
    const { nx, ny, nz } = editorState.grid;
    const cx = (nx - ny) * 0.866 * 0.5;
    const cy = ((nx + ny) * 0.5 - nz) * 0.5;
    this.t.ox = this.width / 2 - cx * this.t.scale;
    this.t.oy = this.height / 2 - cy * this.t.scale;
  }

  private scheduleRebuild(): void {
    window.clearTimeout(this.rebuildTimer);
    this.rebuildTimer = window.setTimeout(() => {
      this.mesh = editorState.sliceCrop ? this.buildCropped() : buildMesh(editorState.grid);
      this.draw();
    }, 120);
  }

  private buildCropped(): MeshResult {
    const g = editorState.grid;
    const s = editorState.settings;
    const crop = new Uint8Array(g.data.length);
    for (let z = 0; z < g.nz; z++)
      for (let y = 0; y < g.ny; y++)
        for (let x = 0; x < g.nx; x++) {
          if (s.sliceAxis === 'x' && x > s.sliceIndex) continue;
          if (s.sliceAxis === 'y' && y > s.sliceIndex) continue;
          crop[g.index(x, y, z)] = g.get(x, y, z);
        }
    const sub = new VoxelGrid(g.nx, g.ny, g.nz, g.cell, crop);
    return buildMesh(sub);
  }

  private facePath(f: MeshResult['faces'][number]): string {
    return (
      f.vertices
        .map((v, i) => {
          const p = isoProject(v.x, v.y, v.z, this.t);
          return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        })
        .join(' ') + ' Z'
    );
  }

  private draw(): void {
    if (!this.gSel) return;
    this.matColor.clear();
    for (const m of editorState.project.materials) this.matColor.set(m.id, d3.color(m.color) as d3.RGBColor);

    // 按深度排序（相机在 +x+y+z 方向，和越大越近，后画）
    const faces = this.mesh.faces
      .map((f) => {
        const c = f.vertices.reduce(
          (a, v) => ({ x: a.x + v.x / 4, y: a.y + v.y / 4, z: a.z + v.z / 4 }),
          { x: 0, y: 0, z: 0 }
        );
        return { f, depth: c.x + c.y + c.z };
      })
      .sort((a, b) => a.depth - b.depth);

    // 单面 path，按法线明暗着色（贪心合面已把面数压到可控规模）
    const faceG = this.gSel.select<SVGGElement>('g.faces');
    const sel = faceG.selectAll<SVGPathElement, typeof faces[number]>('path').data(faces);
    sel
      .enter()
      .append('path')
      .attr('stroke', 'rgba(15,23,42,.25)')
      .attr('stroke-width', 0.4)
      .merge(sel as never)
      .attr('fill', (d) => {
        const base = this.matColor.get(d.f.materialId) ?? d3.rgb(128, 128, 128);
        const shade = NORMAL_SHADE[d.f.normal.join(',')] ?? 0.7;
        return d3.rgb(Math.round(base.r * shade), Math.round(base.g * shade), Math.round(base.b * shade)).formatHex();
      })
      .attr('d', (d) => this.facePath(d.f));
    sel.exit().remove();

    this.drawHighlight();
    this.drawMirror();
    this.drawOverlay();
    this.drawHover();
  }

  /** 当前标高层高亮：覆盖该 z 层的面加描边 + 半透明平面 */
  private drawHighlight(): void {
    const s = editorState.settings;
    const layer = s.currentZ;
    const hg = this.gSel!.select<SVGGElement>('g.highlight');
    hg.selectAll('*').remove();
    const hits = this.mesh.faces.filter((f) => {
      const zs = f.vertices.map((v) => v.z);
      const z0 = Math.min(...zs);
      const z1 = Math.max(...zs);
      return layer >= z0 && layer < z1;
    });
    if (hits.length === 0) return;
    hg.append('path')
      .attr('d', hits.map((f) => this.facePath(f)).join(' '))
      .attr('fill', 'none')
      .attr('stroke', '#f59e0b')
      .attr('stroke-width', 1.6)
      .attr('pointer-events', 'none');
  }

  private drawMirror(): void {
    const g = editorState.grid;
    const s = editorState.settings;
    const mg = this.gSel!.select<SVGGElement>('g.mirror');
    mg.selectAll('*').remove();
    const line = (points: { x: number; y: number; z: number }[], color: string) => {
      const d = points
        .map((p, i) => {
          const q = isoProject(p.x, p.y, p.z, this.t);
          return `${i === 0 ? 'M' : 'L'}${q.x},${q.y}`;
        })
        .join(' ');
      mg.append('path').attr('d', d).attr('stroke', color).attr('stroke-dasharray', '5 4').attr('stroke-width', 1.2).attr('fill', 'none');
    };
    if (s.mirrorX) {
      const x = g.nx / 2;
      line(
        [
          { x, y: 0, z: 0 },
          { x, y: g.ny, z: 0 },
          { x, y: g.ny, z: g.nz },
          { x, y: 0, z: g.nz },
          { x, y: 0, z: 0 }
        ],
        '#2563eb'
      );
    }
    if (s.mirrorY) {
      const y = g.ny / 2;
      line(
        [
          { x: 0, y, z: 0 },
          { x: g.nx, y, z: 0 },
          { x: g.nx, y, z: g.nz },
          { x: 0, y, z: g.nz },
          { x: 0, y, z: 0 }
        ],
        '#0891b2'
      );
    }
  }

  private drawOverlay(): void {
    const g = editorState.grid;
    const og = this.gSel!.select<SVGGElement>('g.overlay');
    og.selectAll('*').remove();
    // 场地底面外框 + 三轴标签
    const corners = [
      { x: 0, y: 0, z: 0 },
      { x: g.nx, y: 0, z: 0 },
      { x: g.nx, y: g.ny, z: 0 },
      { x: 0, y: g.ny, z: 0 },
      { x: 0, y: 0, z: 0 }
    ];
    og.append('path')
      .attr('d', corners.map((c, i) => { const p = isoProject(c.x, c.y, c.z, this.t); return `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`; }).join(' '))
      .attr('fill', 'none')
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1);
    const label = (p: { x: number; y: number; z: number }, text: string) => {
      const q = isoProject(p.x, p.y, p.z, this.t);
      og.append('text').attr('x', q.x + 6).attr('y', q.y).attr('class', 'axis-label').text(text);
    };
    label({ x: g.nx + 0.5, y: 0, z: 0 }, 'X');
    label({ x: 0, y: g.ny + 0.5, z: 0 }, 'Y');
    label({ x: 0, y: 0, z: g.nz + 0.5 }, 'Z 标高');
  }

  private drawHover(): void {
    const hg = this.gSel!.select<SVGGElement>('g.hover');
    hg.selectAll('*').remove();
    if (!this.hover) return;
    const s = editorState.settings;
    const tool = s.tool === 'rect' || s.tool === 'sphere' ? s.tool : 'single';
    const coords = brushCoords(tool, this.hover, s.brushSize);
    const cube = (c: VoxelCoord): string => {
      const p0 = isoProject(c.x, c.y, c.z + 1, this.t);
      const p1 = isoProject(c.x + 1, c.y, c.z + 1, this.t);
      const p2 = isoProject(c.x + 1, c.y + 1, c.z + 1, this.t);
      const p3 = isoProject(c.x, c.y + 1, c.z + 1, this.t);
      const b0 = isoProject(c.x, c.y, c.z, this.t);
      const b1 = isoProject(c.x + 1, c.y, c.z, this.t);
      const b2 = isoProject(c.x + 1, c.y + 1, c.z, this.t);
      const b3 = isoProject(c.x, c.y + 1, c.z, this.t);
      return [
        `M${p0.x},${p0.y}L${p1.x},${p1.y}L${p2.x},${p2.y}L${p3.x},${p3.y}Z`,
        `M${p0.x},${p0.y}L${p1.x},${p1.y}L${b1.x},${b1.y}L${b0.x},${b0.y}Z`,
        `M${p1.x},${p1.y}L${p2.x},${p2.y}L${b2.x},${b2.y}L${b1.x},${b1.y}Z`,
        `M${p2.x},${p2.y}L${p3.x},${p3.y}L${b3.x},${b3.y}L${b2.x},${b2.y}Z`,
        `M${p3.x},${p3.y}L${p0.x},${p0.y}L${b0.x},${b0.y}L${b3.x},${b3.y}Z`,
        `M${b0.x},${b0.y}L${b1.x},${b1.y}L${b2.x},${b2.y}L${b3.x},${b3.y}Z`
      ].join(' ');
    };
    const color = s.mode === 'add' ? (this.matColor.get(s.brushMaterialId) ?? d3.rgb(37, 99, 235)).formatHex() : '#dc2626';
    hg.append('path')
      .attr('d', coords.filter((c) => editorState.grid.inside(c.x, c.y, c.z)).map(cube).join(' '))
      .attr('fill', color)
      .attr('fill-opacity', 0.28)
      .attr('stroke', color)
      .attr('stroke-width', 1)
      .attr('pointer-events', 'none');
  }

  private eventCoord(e: PointerEvent | WheelEvent): { x: number; y: number } {
    const r = (this.root.querySelector('svg') as SVGSVGElement).getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private pickTarget(e: PointerEvent): VoxelCoord | null {
    const p = this.eventCoord(e);
    const ray = screenToRay(p.x, p.y, this.t, editorState.grid.nz);
    return rayTarget(editorState.grid, ray, editorState.settings.mode === 'erase');
  }

  private onPointerDown = (e: PointerEvent): void => {
    const s = editorState.settings;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.lastPointer = { x: e.clientX, y: e.clientY };
    if (s.tool === 'pan') {
      this.panning = true;
      return;
    }
    if (s.tool !== 'single' && s.tool !== 'rect' && s.tool !== 'sphere') return;
    const target = this.pickTarget(e);
    if (!target) return;
    this.dragging = true;
    editorState.pushUndo();
    this.applyBrush(target);
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (this.panning) {
      this.t.ox += e.clientX - this.lastPointer.x;
      this.t.oy += e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this.draw();
      return;
    }
    const target = this.pickTarget(e);
    this.hover = target;
    this.drawHover();
    if (this.dragging && target) this.applyBrush(target);
  };

  private onPointerUp = (): void => {
    this.dragging = false;
    this.panning = false;
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const p = this.eventCoord(e);
    const before = { ...this.t };
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    this.t.scale = Math.max(3, Math.min(40, this.t.scale * factor));
    // 以鼠标为锚点缩放
    this.t.ox = p.x - ((p.x - before.ox) * this.t.scale) / before.scale;
    this.t.oy = p.y - ((p.y - before.oy) * this.t.scale) / before.scale;
    this.draw();
  };

  private applyBrush(center: VoxelCoord): void {
    const s = editorState.settings;
    const tool = s.tool === 'rect' || s.tool === 'sphere' ? s.tool : 'single';
    const coords = brushCoords(tool, center, s.brushSize);
    const value = s.mode === 'erase' ? 0 : s.brushMaterialId;
    editWithMirror(editorState.grid, coords, value, s.mirrorX, s.mirrorY);
    editorState.emit('edit');
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'iso-view': IsoView;
  }
}
