// 钻孔管理：钻孔条目 CRUD、分层标编辑、按钻孔批量插值填充
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import { fillFromBoreholes } from '../core/BoreholeFiller';
import { bus, EVT } from './bus';
import type { Borehole } from '../types';

export class BoreholePanel extends GvsElement {
  private editingId = '';

  protected styles(): string {
    return `
      :host { display: block; }
      .bh-item { border: 1px solid var(--border); border-radius: 6px; margin-bottom: 8px; overflow: hidden; }
      .bh-head { display: flex; align-items: center; gap: 6px; padding: 7px 9px; background: var(--panel-2); cursor: pointer; }
      .bh-head .nm { font-weight: 600; flex: 1; }
      .bh-body { padding: 9px; }
      .layer-row { display: grid; grid-template-columns: 1fr 1fr 30px; gap: 6px; margin-bottom: 5px; align-items: center; }
      .layer-row .idx { font-size: 11px; color: var(--text-2); text-align: center; }
      .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
      .progress { height: 6px; background: var(--panel-2); border-radius: 3px; overflow: hidden; margin-top: 8px; }
      .progress > i { display: block; height: 100%; background: var(--primary); width: 0; transition: width .2s; }
    `;
  }

  protected template(): Node[] {
    const host = this.h('div');
    host.append(this.h('button', { class: 'primary', style: 'width:100%;margin-bottom:10px', onClick: () => this.addBorehole() }, '＋ 新增钻孔'));
    const list = this.h('div', { class: 'bh-list' });
    host.append(list);
    host.append(this.h('hr'));
    host.append(
      this.h(
        'button',
        { class: 'primary', style: 'width:100%', title: 'IDW 插值所有钻孔分层标高，批量填充体素', onClick: () => this.fillAll() },
        '按钻孔分层批量填充体素'
      )
    );
    const prog = this.h('div', { class: 'progress' });
    prog.append(this.h('i'));
    host.append(prog);
    return [host];
  }

  protected afterRender(): void {
    editorState.subscribe((r) => {
      if (r === 'boreholes' || r === 'load' || r === 'materials') this.drawList();
    });
    this.drawList();
  }

  private drawList(): void {
    const list = this.root.querySelector('.bh-list') as HTMLElement;
    list.replaceChildren();
    for (const bh of editorState.project.boreholes) {
      const item = this.h('div', { class: 'bh-item' });
      const head = this.h('div', { class: 'bh-head' });
      head.append(this.h('span', { class: 'nm' }, `${bh.name}（${bh.x}, ${bh.y}）孔口 ${bh.elevation}m`));
      head.append(this.h('button', { onClick: () => { this.editingId = this.editingId === bh.id ? '' : bh.id; this.drawList(); } }, this.editingId === bh.id ? '收起' : '编辑'));
      head.append(this.h('button', { class: 'danger', onClick: () => editorState.removeBorehole(bh.id) }, '删'));
      item.append(head);
      if (this.editingId === bh.id) item.append(this.renderEditor(bh));
      list.append(item);
    }
  }

  private renderEditor(bh: Borehole): Node {
    const body = this.h('div', { class: 'bh-body' });
    const meta = this.h('div', { class: 'meta-grid' });
    const mk = (label: string, value: number | string, onInput: (v: string) => void) => {
      const f = this.h('div', { class: 'field' });
      f.append(this.h('label', {}, label));
      const inp = document.createElement('input');
      inp.value = String(value);
      inp.addEventListener('change', () => onInput(inp.value));
      f.append(inp);
      return f;
    };
    meta.append(
      mk('名称', bh.name, (v) => this.patch(bh, { name: v })),
      mk('孔口标高(m)', bh.elevation, (v) => this.patch(bh, { elevation: Number(v) })),
      mk('X 坐标(m)', bh.x, (v) => this.patch(bh, { x: Number(v) })),
      mk('Y 坐标(m)', bh.y, (v) => this.patch(bh, { y: Number(v) }))
    );
    body.append(meta);

    body.append(this.h('label', {}, '地层分层（自上而下，层底深度 m + 材质）'));
    bh.layers.forEach((ly, i) => {
      const row = this.h('div', { class: 'layer-row' });
      const depth = document.createElement('input');
      depth.type = 'number';
      depth.step = '0.5';
      depth.value = String(ly.depth);
      depth.addEventListener('change', () => {
        bh.layers[i].depth = Number(depth.value);
        this.save(bh);
      });
      const mat = document.createElement('select');
      for (const m of editorState.project.materials) {
        const opt = document.createElement('option');
        opt.value = String(m.id);
        opt.textContent = m.name;
        if (m.id === ly.materialId) opt.selected = true;
        mat.append(opt);
      }
      mat.addEventListener('change', () => {
        bh.layers[i].materialId = Number(mat.value);
        this.save(bh);
      });
      const idx = this.h('span', { class: 'idx' }, `L${i + 1}`);
      row.append(depth, mat, idx);
      body.append(row);
    });

    const actions = this.h('div', { class: 'actions' });
    actions.append(
      this.h('button', {
        onClick: () => {
          const last = bh.layers[bh.layers.length - 1]?.depth ?? 0;
          const matId = editorState.project.materials[0]?.id ?? 1;
          bh.layers.push({ depth: last + 2, materialId: matId });
          this.save(bh);
        }
      }, '＋ 分层'),
      this.h('button', { class: 'danger', onClick: () => { bh.layers.pop(); this.save(bh); } }, '移除末层')
    );
    body.append(actions);
    return body;
  }

  private patch(bh: Borehole, p: Partial<Borehole>): void {
    Object.assign(bh, p);
    this.save(bh);
  }

  private save(bh: Borehole): void {
    editorState.upsertBorehole({ ...bh, layers: [...bh.layers] });
  }

  private addBorehole(): void {
    const g = editorState.grid;
    const n = editorState.project.boreholes.length + 1;
    const matId = editorState.project.materials[0]?.id ?? 1;
    const bh: Borehole = {
      id: 'B' + Date.now().toString(36),
      name: `ZK${String(n).padStart(2, '0')}`,
      x: Math.floor(g.nx / 2),
      y: Math.floor(g.ny / 2),
      elevation: g.nz,
      layers: [
        { depth: 3, materialId: matId },
        { depth: 8, materialId: editorState.project.materials[1]?.id ?? matId },
        { depth: Math.min(g.nz, 15), materialId: editorState.project.materials[2]?.id ?? matId }
      ]
    };
    this.editingId = bh.id;
    editorState.upsertBorehole(bh);
  }

  private fillAll(): void {
    const bhs = editorState.project.boreholes;
    if (bhs.length === 0) {
      bus.emit(EVT.TOAST, { type: 'warn', text: '请先添加钻孔' });
      return;
    }
    if (bhs.length < 2) {
      bus.emit(EVT.TOAST, { type: 'warn', text: '至少需要 2 个钻孔才能插值（单孔将按柱状垂直外延）' });
    }
    editorState.pushUndo();
    const bar = this.root.querySelector('.progress > i') as HTMLElement;
    const result = fillFromBoreholes(editorState.grid, bhs, {
      onProgress: (p) => {
        bar.style.width = `${Math.round(p * 100)}%`;
      }
    });
    bar.style.width = '100%';
    editorState.emit('edit');
    bus.emit(EVT.TOAST, { type: 'ok', text: `填充完成：${result.columns} 列、${result.filled} 个体素，基准标高 ${result.baseElev}m` });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'borehole-panel': BoreholePanel;
  }
}
