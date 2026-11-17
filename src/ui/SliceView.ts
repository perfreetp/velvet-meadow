// 竖直切片视图：固定 X 或 Y 索引，显示该面上的材质柱；扫描线随当前标高联动
import * as d3 from 'd3';
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';

export class SliceView extends GvsElement {
  private svgSel: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private cellPx = 11;
  private unsub: (() => void) | null = null;

  protected styles(): string {
    return `
      :host { display: block; height: 100%; }
      .wrap { width: 100%; height: 100%; background: #fbfdff; border: 1px solid var(--border); border-radius: var(--radius); overflow: auto; }
      svg { display: block; }
      .lab { font-size: 10px; fill: var(--text-2); }
      .scan { fill: rgba(245,158,11,.18); stroke: #d97706; stroke-width: 1.4; }
    `;
  }

  protected template(): Node[] {
    const wrap = this.h('div', { class: 'wrap' });
    wrap.append(document.createElementNS('http://www.w3.org/2000/svg', 'svg'));
    return [wrap];
  }

  protected afterRender(): void {
    this.svgSel = d3.select(this.root.querySelector('svg') as SVGSVGElement);
    this.unsub = editorState.subscribe(() => this.draw());
    this.draw();
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  private draw(): void {
    if (!this.svgSel) return;
    const g = editorState.grid;
    const s = editorState.settings;
    const horiz = s.sliceAxis === 'x' ? g.ny : g.nx; // 水平轴长度
    const padL = 34;
    const padT = 14;
    const w = horiz * this.cellPx + padL + 10;
    const h = g.nz * this.cellPx + padT + 26;
    const svg = this.svgSel.attr('width', w).attr('height', h).attr('viewBox', `0 0 ${w} ${h}`);
    svg.selectAll('*').remove();
    const colorOf = (id: number): string => editorState.project.materials.find((m) => m.id === id)?.color ?? '#9ca3af';

    const root = svg.append('g').attr('transform', `translate(${padL},${padT})`);
    for (let hx = 0; hx < horiz; hx++) {
      for (let z = 0; z < g.nz; z++) {
        const v = s.sliceAxis === 'x' ? g.get(s.sliceIndex, hx, z) : g.get(hx, s.sliceIndex, z);
        if (v === 0) continue;
        // z=0 在顶部（地表），向下递增
        root.append('rect')
          .attr('x', hx * this.cellPx)
          .attr('y', z * this.cellPx)
          .attr('width', this.cellPx)
          .attr('height', this.cellPx)
          .attr('fill', colorOf(v))
          .attr('stroke', 'rgba(15,23,42,.18)')
          .attr('stroke-width', 0.4);
      }
    }

    // 当前标高扫描线
    root.append('rect')
      .attr('class', 'scan')
      .attr('x', 0)
      .attr('y', s.currentZ * this.cellPx)
      .attr('width', horiz * this.cellPx)
      .attr('height', this.cellPx)
      .attr('pointer-events', 'none');

    // 网格与坐标
    const axis = s.sliceAxis === 'x' ? 'Y' : 'X';
    for (let hx = 0; hx <= horiz; hx += Math.max(1, Math.round(horiz / 8))) {
      root.append('line').attr('x1', hx * this.cellPx).attr('y1', 0).attr('x2', hx * this.cellPx).attr('y2', g.nz * this.cellPx).attr('stroke', '#e6ebf2');
      root.append('text').attr('class', 'lab').attr('x', hx * this.cellPx).attr('y', g.nz * this.cellPx + 14).text(String(hx));
    }
    for (let z = 0; z <= g.nz; z += Math.max(1, Math.round(g.nz / 8))) {
      root.append('line').attr('x1', 0).attr('y1', z * this.cellPx).attr('x2', horiz * this.cellPx).attr('y2', z * this.cellPx).attr('stroke', '#e6ebf2');
      root.append('text').attr('class', 'lab').attr('x', -8).attr('y', z * this.cellPx + 4).text(String(z));
    }
    root.append('rect').attr('x', 0).attr('y', 0).attr('width', horiz * this.cellPx).attr('height', g.nz * this.cellPx)
      .attr('fill', 'none').attr('stroke', '#64748b');
    root.append('text').attr('class', 'lab').attr('x', horiz * this.cellPx - 10).attr('y', -4).text(axis);
    root.append('text').attr('class', 'lab').attr('x', -26).attr('y', 4).text('Z');

    // 点击切片定位当前标高
    svg.on('pointerdown', (event: PointerEvent) => {
      const rect = (this.root.querySelector('svg') as SVGSVGElement).getBoundingClientRect();
      const z = Math.floor((event.clientY - rect.top - padT) / this.cellPx);
      if (z >= 0 && z < g.nz) editorState.updateSettings({ currentZ: z });
    });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'slice-view': SliceView;
  }
}
