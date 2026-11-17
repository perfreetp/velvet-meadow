// 俯视平面图：当前标高切片色阶、笔刷编辑、框选、剖面线绘制、钻孔/镜像参考
import * as d3 from 'd3';
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import { bus, EVT } from './bus';
import { mirrorCoordX, mirrorCoordY } from '../core/Mirror';
import { normalizeBox, type Box } from '../core/Clipboard';
import type { SectionLine } from '../types';

export class TopView extends GvsElement {
  private svgSel: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private cellPx = 9;
  private dragStart: { x: number; y: number } | null = null;
  private dragCur: { x: number; y: number } | null = null;
  private painting = false;
  private polyline: { x: number; y: number }[] = [];
  private unsub: (() => void) | null = null;

  protected styles(): string {
    return `
      :host { display: block; height: 100%; }
      .wrap { position: relative; width: 100%; height: 100%; background: #fbfdff; border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
      svg { display: block; touch-action: none; }
      .bh-label { font-size: 10px; fill: #1e3a8a; font-weight: 600; pointer-events: none; }
      .grid-line { stroke: #e6ebf2; stroke-width: .5; }
      .hint { position: absolute; right: 10px; top: 8px; background: rgba(255,255,255,.9); border: 1px solid var(--border); border-radius: 6px; padding: 4px 9px; font-size: 12px; color: var(--text-2); }
    `;
  }

  protected template(): Node[] {
    const wrap = this.h('div', { class: 'wrap' });
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    wrap.append(svg);
    wrap.append(this.h('div', { class: 'hint' }, '俯视图 · 随当前标高联动'));
    return [wrap];
  }

  protected afterRender(): void {
    const svgEl = this.root.querySelector('svg') as SVGSVGElement;
    this.svgSel = d3.select(svgEl);
    svgEl.addEventListener('pointerdown', this.onDown);
    svgEl.addEventListener('pointermove', this.onMove);
    window.addEventListener('pointerup', this.onUp);
    svgEl.addEventListener('dblclick', this.onDblClick);
    this.unsub = editorState.subscribe(() => this.draw());
    this.draw();
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  private toCell(e: PointerEvent | MouseEvent): { x: number; y: number } {
    const g = editorState.grid;
    const rect = (this.root.querySelector('svg') as SVGSVGElement).getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left - 24) / this.cellPx);
    const y = Math.floor((e.clientY - rect.top - 24) / this.cellPx);
    return { x: Math.max(0, Math.min(g.nx - 1, x)), y: Math.max(0, Math.min(g.ny - 1, y)) };
  }

  private onDown = (e: PointerEvent): void => {
    const s = editorState.settings;
    const c = this.toCell(e);
    if (s.tool === 'select') {
      this.dragStart = c;
      this.dragCur = c;
    } else if (s.tool === 'section-line') {
      this.polyline.push({ x: c.x + 0.5, y: c.y + 0.5 });
      this.draw();
    } else if (s.tool === 'single' || s.tool === 'rect' || s.tool === 'sphere') {
      // 一次笔画只压一个撤销快照
      if (!this.painting) editorState.pushUndo();
      this.painting = true;
      editorState.paintColumn(c.x, c.y);
    }
  };

  private onMove = (e: PointerEvent): void => {
    const s = editorState.settings;
    const c = this.toCell(e);
    if (s.tool === 'select' && this.dragStart) {
      this.dragCur = c;
      this.drawRubber();
    } else if (this.painting && (s.tool === 'single' || s.tool === 'rect' || s.tool === 'sphere')) {
      editorState.paintColumn(c.x, c.y);
    }
  };

  private onUp = (): void => {
    if (this.dragStart && this.dragCur) {
      const box: Box = normalizeBox(
        { ...this.dragStart, z: editorState.settings.currentZ },
        { ...this.dragCur, z: editorState.settings.currentZ }
      );
      box.z0 = 0;
      box.z1 = editorState.grid.nz - 1;
      bus.emit(EVT.SELECTION_BOX, { box });
    }
    this.dragStart = null;
    this.dragCur = null;
    this.painting = false;
  };

  private onDblClick = (): void => {
    if (editorState.settings.tool !== 'section-line' || this.polyline.length < 2) return;
    const line: SectionLine = {
      id: 'S' + Date.now().toString(36),
      name: `剖面线 ${editorState.project.sections.length + 1}`,
      points: this.polyline.slice(0, -1)
    };
    this.polyline = [];
    editorState.upsertSection(line);
    bus.emit(EVT.SECTION_DRAWN, { id: line.id });
    bus.emit(EVT.TOAST, { type: 'ok', text: `已生成 ${line.name}，可在剖面面板查看剖面图与层厚表` });
  };

  private drawRubber(): void {
    if (!this.dragStart || !this.dragCur) return;
    const x0 = Math.min(this.dragStart.x, this.dragCur.x);
    const y0 = Math.min(this.dragStart.y, this.dragCur.y);
    const w = Math.abs(this.dragCur.x - this.dragStart.x) + 1;
    const h = Math.abs(this.dragCur.y - this.dragStart.y) + 1;
    this.svgSel!.select('g.rubber')
      .selectAll('rect')
      .data([1])
      .join('rect')
      .attr('x', 24 + x0 * this.cellPx)
      .attr('y', 24 + y0 * this.cellPx)
      .attr('width', w * this.cellPx)
      .attr('height', h * this.cellPx)
      .attr('fill', 'rgba(37,99,235,.12)')
      .attr('stroke', '#2563eb')
      .attr('stroke-dasharray', '4 3');
  }

  private draw(): void {
    if (!this.svgSel) return;
    const g = editorState.grid;
    const s = editorState.settings;
    const w = g.nx * this.cellPx + 48;
    const h = g.ny * this.cellPx + 48;
    const svg = this.svgSel.attr('width', w).attr('height', h).attr('viewBox', `0 0 ${w} ${h}`);
    svg.selectAll('*').remove();

    const colorOf = (id: number): string => editorState.project.materials.find((m) => m.id === id)?.color ?? '#e5e7eb';

    // 单元格
    const cells = svg.append('g').attr('transform', 'translate(24,24)');
    const frag: string[] = [];
    for (let y = 0; y < g.ny; y++) {
      for (let x = 0; x < g.nx; x++) {
        const v = g.get(x, y, s.currentZ);
        if (v === 0) continue;
        frag.push(`<rect x="${x * this.cellPx}" y="${y * this.cellPx}" width="${this.cellPx}" height="${this.cellPx}" fill="${colorOf(v)}"/>`);
      }
    }
    cells.html(frag.join(''));

    // 网格线（抽样，避免过密）
    const step = Math.max(1, Math.round(8 / this.cellPx));
    const gridG = svg.append('g').attr('class', 'grid-line').attr('transform', 'translate(24,24)');
    for (let x = 0; x <= g.nx; x += step) {
      gridG.append('line').attr('x1', x * this.cellPx).attr('y1', 0).attr('x2', x * this.cellPx).attr('y2', g.ny * this.cellPx);
    }
    for (let y = 0; y <= g.ny; y += step) {
      gridG.append('line').attr('x1', 0).attr('y1', y * this.cellPx).attr('x2', g.nx * this.cellPx).attr('y2', y * this.cellPx);
    }

    // 镜像参考线
    if (s.mirrorX) {
      svg.append('line')
        .attr('x1', 24 + (g.nx / 2) * this.cellPx).attr('y1', 24)
        .attr('x2', 24 + (g.nx / 2) * this.cellPx).attr('y2', 24 + g.ny * this.cellPx)
        .attr('stroke', '#2563eb').attr('stroke-dasharray', '5 4').attr('stroke-width', 1.4);
    }
    if (s.mirrorY) {
      svg.append('line')
        .attr('x1', 24).attr('y1', 24 + (g.ny / 2) * this.cellPx)
        .attr('x2', 24 + g.nx * this.cellPx).attr('y2', 24 + (g.ny / 2) * this.cellPx)
        .attr('stroke', '#0891b2').attr('stroke-dasharray', '5 4').attr('stroke-width', 1.4);
    }

    // 已有剖面线
    for (const line of editorState.project.sections) {
      const pts = line.points.map((p) => [24 + p.x * this.cellPx, 24 + p.y * this.cellPx]);
      svg.append('polyline')
        .attr('points', pts.map((p) => p.join(',')).join(' '))
        .attr('fill', 'none').attr('stroke', '#7c3aed').attr('stroke-width', 1.6)
        .attr('stroke-dasharray', '6 3').attr('pointer-events', 'none');
      const end = pts[pts.length - 1];
      svg.append('text').attr('x', end[0] + 4).attr('y', end[1]).attr('class', 'bh-label').attr('fill', '#7c3aed').text(line.name).attr('pointer-events', 'none');
    }

    // 正在绘制的剖面线
    if (this.polyline.length > 0) {
      const pts = this.polyline.map((p) => [24 + p.x * this.cellPx, 24 + p.y * this.cellPx]);
      svg.append('polyline')
        .attr('points', pts.map((p) => p.join(',')).join(' '))
        .attr('fill', 'none').attr('stroke', '#a855f7').attr('stroke-width', 1.8).attr('pointer-events', 'none');
    }
    svg.append('g').attr('class', 'rubber');

    // 钻孔
    for (const bh of editorState.project.boreholes) {
      const cx = 24 + bh.x * this.cellPx;
      const cy = 24 + bh.y * this.cellPx;
      svg.append('circle').attr('cx', cx).attr('cy', cy).attr('r', 3.4).attr('fill', '#1d4ed8').attr('stroke', '#fff').attr('stroke-width', 1).attr('pointer-events', 'none');
      svg.append('text').attr('x', cx + 4).attr('y', cy + 3).attr('class', 'bh-label').text(bh.name).attr('pointer-events', 'none');
    }

    // 边框 + 轴标
    svg.append('rect').attr('x', 24).attr('y', 24).attr('width', g.nx * this.cellPx).attr('height', g.ny * this.cellPx)
      .attr('fill', 'none').attr('stroke', '#64748b').attr('stroke-width', 1);
    svg.append('text').attr('x', 24 + g.nx * this.cellPx + 6).attr('y', 30).attr('class', 'bh-label').text('X');
    svg.append('text').attr('x', 10).attr('y', 24 + g.ny * this.cellPx + 4).attr('class', 'bh-label').text('Y');

    this.drawRubber();
  }

  /** 供外部/测试调用：镜像坐标预览 */
  previewMirror(x: number, y: number): { x: number; y: number }[] {
    const g = editorState.grid;
    const s = editorState.settings;
    const out = [{ x, y }];
    if (s.mirrorX) out.push(mirrorCoordX(g, { x, y, z: 0 }));
    if (s.mirrorY) out.push(mirrorCoordY(g, { x, y, z: 0 }));
    return out;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'top-view': TopView;
  }
}
