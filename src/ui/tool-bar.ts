import { BaseComponent } from './base.js';
import { workbench, LINE_NAMES, type LineId, type ToolMode } from '../core/state/workbench.js';
import type { ColorMode, CornerMode } from '../types.js';

const TOOLS: { id: ToolMode; label: string; hint: string }[] = [
  { id: 'select', label: '选择/拖拽', hint: '拖拽控制点，右键删除点' },
  { id: 'add-point', label: '增点', hint: '在活动线路上点击添加控制点' },
  { id: 'section', label: '横断面', hint: '两点拉一条任意横断面' },
  { id: 'pick-slope', label: '堤坡选段', hint: '在活动堤线上点选起止段' }
];

export class ToolBar extends BaseComponent {
  private unsub: (() => void) | null = null;

  mount(): void {
    this.draw();
    this.unsub = workbench.subscribe(() => this.draw());
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  private draw(): void {
    const f = workbench.file;
    const disabled = !f;
    this.render(
      `<div class="toolbar">
        <div class="group">
          ${TOOLS.map(
            (t) =>
              `<button data-tool="${t.id}" class="${workbench.tool === t.id ? 'active' : ''}" ${disabled ? 'disabled' : ''} title="${t.hint}">${t.label}</button>`
          ).join('')}
        </div>
        <div class="divider"></div>
        <div class="group">
          <span class="cap">活动线路</span>
          <select id="line-sel" ${disabled ? 'disabled' : ''}>
            ${(Object.keys(LINE_NAMES) as LineId[]).map((id) => `<option value="${id}" ${workbench.activeLine === id ? 'selected' : ''}>${LINE_NAMES[id]}</option>`).join('')}
          </select>
        </div>
        <div class="divider"></div>
        <div class="group">
          <span class="cap">曲面着色</span>
          <select id="color-sel" ${disabled ? 'disabled' : ''}>
            <option value="elevation" ${f?.settings.colorMode === 'elevation' ? 'selected' : ''}>高程着色</option>
            <option value="slope" ${f?.settings.colorMode === 'slope' ? 'selected' : ''}>坡度着色</option>
            <option value="curvature" ${f?.settings.colorMode === 'curvature' ? 'selected' : ''}>曲率着色</option>
          </select>
        </div>
        <div class="group">
          <span class="cap">角部</span>
          <select id="corner-sel" ${disabled ? 'disabled' : ''}>
            <option value="round" ${f?.settings.cornerMode === 'round' ? 'selected' : ''}>圆角</option>
            <option value="miter" ${f?.settings.cornerMode === 'miter' ? 'selected' : ''}>尖角</option>
            <option value="bevel" ${f?.settings.cornerMode === 'bevel' ? 'selected' : ''}>斜切</option>
          </select>
        </div>
        <div class="divider"></div>
        <div class="group">
          <span class="cap">垂向夸张</span>
          <input id="z-scale" type="range" min="1" max="8" step="0.5" value="3" style="width:90px">
          <span id="z-val" class="cap">3.0×</span>
        </div>
        <div class="group">
          <button id="fit" ${disabled ? 'disabled' : ''}>全图</button>
          <button id="png" ${disabled ? 'disabled' : ''}>导出PNG</button>
        </div>
      </div>`,
      `
      .toolbar { display:flex; align-items:center; gap:10px; padding:7px 14px;
        background:var(--bg-panel); border-bottom:1px solid var(--border); flex-wrap:wrap; }
      .group { display:flex; align-items:center; gap:6px; }
      .divider { width:1px; height:22px; background:var(--border); }
      .cap { color:var(--fg-dim); font-size:11px; white-space:nowrap; }
      select, input[type=range] { width:auto; min-width:84px; }
      `
    );

    this.$all('[data-tool]').forEach((b) =>
      b.addEventListener('click', () => workbench.setTool((b as HTMLElement).dataset.tool as ToolMode))
    );
    (this.$('#line-sel') as HTMLSelectElement).addEventListener('change', (e) => {
      workbench.setActiveLine((e.target as HTMLSelectElement).value as LineId);
    });
    (this.$('#color-sel') as HTMLSelectElement).addEventListener('change', (e) => {
      workbench.setColorMode((e.target as HTMLSelectElement).value as ColorMode);
    });
    (this.$('#corner-sel') as HTMLSelectElement).addEventListener('change', (e) => {
      workbench.setCornerMode((e.target as HTMLSelectElement).value as CornerMode);
    });
    this.$('#z-scale').addEventListener('input', (e) => {
      const v = Number((e.target as HTMLInputElement).value);
      this.$('#z-val').textContent = `${v.toFixed(1)}×`;
      this.dispatchEvent(new CustomEvent('z-scale', { detail: v, bubbles: true, composed: true }));
    });
    this.$('#fit').addEventListener('click', () => this.dispatchEvent(new CustomEvent('fit-view', { bubbles: true, composed: true })));
    this.$('#png').addEventListener('click', () => this.dispatchEvent(new CustomEvent('export-png', { bubbles: true, composed: true })));
  }
}
