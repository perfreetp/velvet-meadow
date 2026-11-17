// 色阶图例：材质颜色/名称编辑、增删、当前体素计数
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import type { Material } from '../types';

export class LegendPanel extends GvsElement {
  protected styles(): string {
    return `
      :host { display: block; }
      .mat-row { display: flex; align-items: center; gap: 7px; padding: 4px 2px; border-bottom: 1px dashed var(--border); }
      .mat-row:last-child { border-bottom: none; }
      input[type="color"] { width: 34px; height: 26px; padding: 0; border: 1px solid var(--border); border-radius: 5px; background: none; cursor: pointer; }
      .name { flex: 1; }
      .cnt { font-size: 11px; color: var(--text-2); min-width: 52px; text-align: right; }
      .del { padding: 1px 7px; }
      .add { margin-top: 8px; width: 100%; }
    `;
  }

  protected template(): Node[] {
    const host = this.h('div');
    const list = this.h('div', { class: 'list' });
    host.append(list);
    host.append(this.h('button', { class: 'add', onClick: () => this.addMaterial() }, '＋ 新增地层材质'));
    return [host];
  }

  protected afterRender(): void {
    this.drawList();
    editorState.subscribe((reason) => {
      if (reason === 'materials' || reason === 'edit' || reason === 'load' || reason === 'undo' || reason === 'redo' || reason === 'boreholes') this.drawList();
    });
  }

  private drawList(): void {
    const list = this.root.querySelector('.list') as HTMLElement;
    list.replaceChildren();
    const counts = editorState.grid.countByMaterial(editorState.project.materials);
    for (const m of editorState.project.materials) {
      const row = this.h('div', { class: 'mat-row' });
      const color = document.createElement('input');
      color.type = 'color';
      color.value = m.color;
      color.addEventListener('input', () => this.update(m.id, { color: color.value }));
      const name = document.createElement('input');
      name.className = 'name';
      name.value = m.name;
      name.addEventListener('change', () => this.update(m.id, { name: name.value }));
      const cnt = this.h('span', { class: 'cnt mono' }, `${counts.get(m.id) ?? 0} 格`);
      const del = this.h('button', { class: 'del danger', title: '删除材质（网格内该材质将被清空）', onClick: () => this.removeMaterial(m) }, '删');
      row.append(color, name, cnt, del);
      list.append(row);
    }
  }

  private update(id: number, patch: Partial<Material>): void {
    const mats = editorState.project.materials.map((m) => (m.id === id ? { ...m, ...patch } : m));
    editorState.updateMaterials(mats);
  }

  private addMaterial(): void {
    const used = new Set(editorState.project.materials.map((m) => m.id));
    let id = 1;
    while (used.has(id)) id++;
    if (id > 255) {
      alert('材质数量已达上限 255');
      return;
    }
    const palette = ['#8b5e3c', '#b08968', '#ddb892', '#7f5539', '#9c6644', '#6d6875', '#495057'];
    const mats = [...editorState.project.materials, { id, name: `新地层${id}`, color: palette[id % palette.length], pattern: 'solid' }];
    editorState.updateMaterials(mats);
  }

  private removeMaterial(m: Material): void {
    if (!confirm(`确认删除材质「${m.name}」？网格中该材质体素将一并清空。`)) return;
    const g = editorState.grid;
    editorState.pushUndo();
    for (let i = 0; i < g.data.length; i++) if (g.data[i] === m.id) g.data[i] = 0;
    editorState.updateMaterials(editorState.project.materials.filter((x) => x.id !== m.id));
    if (editorState.settings.brushMaterialId === m.id) {
      editorState.updateSettings({ brushMaterialId: editorState.project.materials[0]?.id ?? 1 });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'legend-panel': LegendPanel;
  }
}
