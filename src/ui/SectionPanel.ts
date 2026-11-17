// 剖面分析：选择剖面线，d3 绘制地层剖面图，输出层厚统计表
import * as d3 from 'd3';
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import { buildProfile, type ProfileResult } from '../core/Section';

export class SectionPanel extends GvsElement {
  private selectedId = '';
  private profile: ProfileResult | null = null;

  protected styles(): string {
    return `
      :host { display: block; }
      .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
      select { flex: 1; }
      .chart-wrap { border: 1px solid var(--border); border-radius: 6px; background: #fff; overflow: auto; }
      .empty { color: var(--text-2); padding: 26px 10px; text-align: center; }
      .thick { margin-top: 12px; }
      .axis text { font-size: 10px; fill: var(--text-2); }
      .axis path, .axis line { stroke: #94a3b8; }
      .col-line { stroke: rgba(15,23,42,.15); stroke-width: .4; }
      .del { padding: 3px 9px; }
    `;
  }

  protected template(): Node[] {
    const host = this.h('div');
    const bar = this.h('div', { class: 'toolbar' });
    const sel = document.createElement('select');
    sel.addEventListener('change', () => {
      this.selectedId = sel.value;
      this.draw();
    });
    const delBtn = this.h('button', { class: 'del danger', onClick: () => this.deleteSelected() }, '删除');
    bar.append(sel, delBtn);
    host.append(bar);
    const chart = this.h('div', { class: 'chart-wrap' });
    host.append(chart);
    const tableHost = this.h('div', { class: 'thick' });
    host.append(tableHost);
    return [host];
  }

  protected afterRender(): void {
    editorState.subscribe((r) => {
      if (r === 'sections' || r === 'edit' || r === 'load' || r === 'materials' || r === 'undo' || r === 'redo' || r === 'workflow') this.draw();
    });
    this.draw();
  }

  private deleteSelected(): void {
    if (!this.selectedId) return;
    editorState.removeSection(this.selectedId);
    this.selectedId = '';
    this.draw();
  }

  private draw(): void {
    const sections = editorState.project.sections;
    const sel = this.root.querySelector('select') as HTMLSelectElement;
    if (!sections.some((s) => s.id === this.selectedId)) this.selectedId = sections[0]?.id ?? '';
    sel.innerHTML = '';
    for (const s of sections) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.name;
      if (s.id === this.selectedId) opt.selected = true;
      sel.append(opt);
    }

    const chartHost = this.root.querySelector('.chart-wrap') as HTMLElement;
    const tableHost = this.root.querySelector('.thick') as HTMLElement;
    chartHost.replaceChildren();
    tableHost.replaceChildren();
    const line = sections.find((s) => s.id === this.selectedId);
    if (!line) {
      chartHost.append(this.h('div', { class: 'empty' }, '暂无剖面线：在俯视图选择「剖面线」工具，逐点点击后双击完成绘制'));
      return;
    }

    this.profile = buildProfile(editorState.grid, line, editorState.project.materials);
    this.drawChart(chartHost);
    this.drawTable(tableHost);
  }

  private drawChart(host: HTMLElement): void {
    const p = this.profile!;
    if (p.columns.length === 0) {
      host.append(this.h('div', { class: 'empty' }, '剖面线范围内没有体素数据'));
      return;
    }
    const colorOf = (id: number): string => editorState.project.materials.find((m) => m.id === id)?.color ?? '#9ca3af';
    const W = Math.max(520, p.totalLength * 14 + 90);
    const H = Math.max(240, p.maxDepth * 16 + 70);
    const margin = { top: 18, right: 18, bottom: 34, left: 46 };
    const svg = d3.select(host).append('svg').attr('width', W).attr('height', H);
    const x = d3.scaleLinear().domain([0, p.totalLength]).range([margin.left, W - margin.right]);
    const y = d3.scaleLinear().domain([0, Math.max(1, p.maxDepth)]).range([margin.top, H - margin.bottom]);
    const colW = Math.max(2, (x(1) - x(0)) * 0.98);

    // 每列按 stack 绘制矩形
    const g = svg.append('g');
    for (const col of p.columns) {
      let depth = 0;
      for (const mat of col.stack) {
        g.append('rect')
          .attr('x', x(col.dist) - colW / 2)
          .attr('y', y(depth))
          .attr('width', colW + 0.6)
          .attr('height', y(depth + 1) - y(depth) + 0.4)
          .attr('fill', colorOf(mat))
          .attr('stroke', 'rgba(15,23,42,.12)')
          .attr('stroke-width', 0.3);
        depth += 1;
      }
    }

    // 地表线（每列最深实体深度的反义——这里实体从 z=0 起算，地表即 y=0）
    g.append('line').attr('x1', margin.left).attr('x2', W - margin.right).attr('y1', y(0)).attr('y2', y(0)).attr('stroke', '#334155').attr('stroke-width', 1.4);

    svg.append('g').attr('class', 'axis').attr('transform', `translate(0,${H - margin.bottom})`).call(d3.axisBottom(x).ticks(Math.min(10, Math.floor(p.totalLength))).tickFormat((d) => `${d}m`));
    svg.append('g').attr('class', 'axis').attr('transform', `translate(${margin.left},0)`).call(d3.axisLeft(y).ticks(Math.min(10, Math.floor(p.maxDepth))).tickFormat((d) => `${d}m`));
    svg.append('text').attr('x', W / 2).attr('y', H - 4).attr('text-anchor', 'middle').attr('class', 'axis').style('font-size', '11px').text('水平距离');
    svg.append('text').attr('transform', `translate(12,${H / 2}) rotate(-90)`).attr('text-anchor', 'middle').attr('class', 'axis').style('font-size', '11px').text('深度');

    // 图例
    const mats = new Set<number>();
    p.columns.forEach((c) => c.stack.forEach((m) => mats.add(m)));
    const lg = svg.append('g').attr('transform', `translate(${margin.left + 6},${margin.top + 4})`);
    let li = 0;
    for (const id of mats) {
      const mat = editorState.project.materials.find((m) => m.id === id);
      const row = lg.append('g').attr('transform', `translate(${li * 96},0)`);
      row.append('rect').attr('width', 12).attr('height', 12).attr('fill', colorOf(id)).attr('stroke', '#666');
      row.append('text').attr('x', 16).attr('y', 10).style('font-size', '11px').text(mat?.name ?? `材质${id}`);
      li++;
    }
  }

  private drawTable(host: HTMLElement): void {
    const p = this.profile!;
    if (p.thickness.length === 0) return;
    const table = document.createElement('table');
    table.innerHTML = `
      <thead><tr><th>层序</th><th>地层</th><th>最小层厚(m)</th><th>最大层厚(m)</th><th>平均层厚(m)</th><th>统计段数</th></tr></thead>`;
    const tb = document.createElement('tbody');
    for (const r of p.thickness) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.order}</td>
        <td><span class="swatch" style="background:${r.color}"></span> ${r.materialName}</td>
        <td class="mono">${r.minThick.toFixed(2)}</td>
        <td class="mono">${r.maxThick.toFixed(2)}</td>
        <td class="mono">${r.avgThick.toFixed(2)}</td>
        <td class="mono">${r.sampleCount}</td>`;
      tb.append(tr);
    }
    table.append(tb);
    const title = this.h('div', { style: 'font-weight:600;margin-bottom:6px' }, '层厚统计表');
    host.append(title, table);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'section-panel': SectionPanel;
  }
}
