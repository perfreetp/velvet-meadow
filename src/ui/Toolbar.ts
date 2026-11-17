// 建模工具栏：笔刷、增删模式、镜像、标高、切片轴/索引、撤销重做、剪贴板
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import { bus, EVT } from './bus';
import { copyBox, pasteClipboard, translateBox, normalizeBox, type Box } from '../core/Clipboard';
import type { EditorSettings } from '../types';

const TOOLS: { id: EditorSettings['tool']; label: string; hint: string }[] = [
  { id: 'single', label: '单格', hint: '单格笔刷' },
  { id: 'rect', label: '矩形', hint: '矩形笔刷' },
  { id: 'sphere', label: '球形', hint: '球形笔刷' },
  { id: 'select', label: '框选', hint: '俯视图框选一块' },
  { id: 'section-line', label: '剖面线', hint: '俯视图逐点绘制，双击结束' },
  { id: 'pan', label: '平移', hint: '拖拽平移视图' }
];

export class Toolbar extends GvsElement {
  private selection: Box | null = null;

  protected styles(): string {
    return `
      :host { display: block; }
      .group { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
      .group .lab { width: 100%; font-size: 12px; color: var(--text-2); margin-bottom: 2px; }
      button { padding: 5px 10px; }
      .seg button.active { background: var(--primary); color: #fff; border-color: var(--primary); }
      input[type="range"] { flex: 2; }
      .val { min-width: 34px; text-align: right; font-variant-numeric: tabular-nums; }
      .mirror-on { color: var(--primary); font-weight: 600; }
      .clip-info { font-size: 12px; color: var(--text-2); margin: 4px 0 8px; }
    `;
  }

  protected template(): Node[] {
    const host = this.h('div');

    const toolGroup = this.h('div', { class: 'group seg' });
    toolGroup.append(this.h('div', { class: 'lab' }, '工具'));
    for (const t of TOOLS) {
      toolGroup.append(this.h('button', { title: t.hint, onClick: () => editorState.updateSettings({ tool: t.id }) }, t.label));
    }
    host.append(toolGroup);

    const modeGroup = this.h('div', { class: 'group seg' });
    modeGroup.append(this.h('div', { class: 'lab' }, '编辑模式'));
    const addBtn = this.h('button', { class: 'primary', onClick: () => editorState.updateSettings({ mode: 'add' }) }, '增材');
    const eraBtn = this.h('button', { class: 'danger', onClick: () => editorState.updateSettings({ mode: 'erase' }) }, '擦除');
    modeGroup.append(addBtn, eraBtn);
    host.append(modeGroup);

    // 材质选择
    const matField = this.h('div', { class: 'field' });
    matField.append(this.h('label', {}, '笔刷材质'));
    const matSel = document.createElement('select');
    matSel.addEventListener('change', () => editorState.updateSettings({ brushMaterialId: Number(matSel.value) }));
    matField.append(matSel);
    host.append(matField);

    // 笔刷半径
    const sizeField = this.h('div', { class: 'field' });
    sizeField.append(this.h('label', {}, '笔刷半径（格）'));
    const sizeRow = this.h('div', { class: 'row' });
    const sizeRange = document.createElement('input');
    sizeRange.type = 'range';
    sizeRange.min = '0';
    sizeRange.max = '8';
    const sizeVal = this.h('span', { class: 'val mono' });
    sizeRange.addEventListener('input', () => {
      editorState.updateSettings({ brushSize: Number(sizeRange.value) });
      sizeVal.textContent = sizeRange.value;
    });
    sizeRow.append(sizeRange, sizeVal);
    sizeField.append(sizeRow);
    host.append(sizeField);

    // 镜像
    const mirrorGroup = this.h('div', { class: 'group seg' });
    mirrorGroup.append(this.h('div', { class: 'lab' }, '镜像联动（一侧改动另一侧同步）'));
    mirrorGroup.append(
      this.h('button', { id: 'mx', onClick: () => editorState.updateSettings({ mirrorX: !editorState.settings.mirrorX }) }, 'X 轴镜像'),
      this.h('button', { id: 'my', onClick: () => editorState.updateSettings({ mirrorY: !editorState.settings.mirrorY }) }, 'Y 轴镜像')
    );
    host.append(mirrorGroup);

    // 当前标高
    const zField = this.h('div', { class: 'field' });
    zField.append(this.h('label', {}, '当前标高（层索引，0 = 地表）'));
    const zRow = this.h('div', { class: 'row' });
    const zRange = document.createElement('input');
    zRange.type = 'range';
    zRange.min = '0';
    const zVal = this.h('span', { class: 'val mono' });
    zRange.addEventListener('input', () => {
      editorState.updateSettings({ currentZ: Number(zRange.value) });
      zVal.textContent = zRange.value;
    });
    zRow.append(zRange, zVal);
    zField.append(zRow);
    host.append(zField);

    // 切片
    const sliceField = this.h('div', { class: 'field' });
    sliceField.append(this.h('label', {}, '剖面切片'));
    const sliceRow = this.h('div', { class: 'row seg' });
    const bx = this.h('button', { onClick: () => editorState.updateSettings({ sliceAxis: 'x', sliceIndex: Math.floor(editorState.grid.nx / 2) }) }, '切 X');
    const by = this.h('button', { onClick: () => editorState.updateSettings({ sliceAxis: 'y', sliceIndex: Math.floor(editorState.grid.ny / 2) }) }, '切 Y');
    sliceRow.append(bx, by);
    sliceField.append(sliceRow);
    const sliceRangeRow = this.h('div', { class: 'row' });
    const sliceRange = document.createElement('input');
    sliceRange.type = 'range';
    sliceRange.min = '0';
    const sliceVal = this.h('span', { class: 'val mono' });
    sliceRange.addEventListener('input', () => {
      editorState.updateSettings({ sliceIndex: Number(sliceRange.value) });
      sliceVal.textContent = sliceRange.value;
    });
    sliceRangeRow.append(sliceRange, sliceVal);
    sliceField.append(sliceRangeRow);
    const cropBtn = this.h('button', { style: 'width:100%;margin-top:6px', onClick: () => this.toggleCrop(cropBtn) }, '三维视图按切片裁剪');
    sliceField.append(cropBtn);
    host.append(sliceField);

    host.append(this.h('hr'));

    // 撤销重做
    const hist = this.h('div', { class: 'group seg' });
    hist.append(
      this.h('button', { id: 'undo', onClick: () => editorState.undo() }, '↶ 撤销'),
      this.h('button', { id: 'redo', onClick: () => editorState.redo() }, '↷ 重做')
    );
    host.append(hist);

    // 剪贴板
    const clipGroup = this.h('div', { class: 'group' });
    clipGroup.append(this.h('div', { class: 'lab' }, '框选块操作（框选范围默认贯穿全部标高）'));
    const info = this.h('div', { class: 'clip-info' }, '未选择块');
    clipGroup.append(info);
    clipGroup.append(
      this.h('button', { id: 'copy', onClick: () => this.doCopy() }, '复制'),
      this.h('button', { id: 'paste', onClick: () => this.doPaste() }, '粘贴到选区'),
      this.h('button', { id: 'mvx-', onClick: () => this.move(-1, 0, 0) }, 'X-'),
      this.h('button', { id: 'mvx+', onClick: () => this.move(1, 0, 0) }, 'X+'),
      this.h('button', { id: 'mvy-', onClick: () => this.move(0, -1, 0) }, 'Y-'),
      this.h('button', { id: 'mvy+', onClick: () => this.move(0, 1, 0) }, 'Y+'),
      this.h('button', { id: 'mvz-', onClick: () => this.move(0, 0, -1) }, 'Z-'),
      this.h('button', { id: 'mvz+', onClick: () => this.move(0, 0, 1) }, 'Z+')
    );
    host.append(clipGroup);

    // 保存元素引用，状态刷新时同步
    this.refs = { matSel, sizeRange, sizeVal, zRange, zVal, sliceRange, sliceVal, bx, by, info, cropBtn, addBtn, eraBtn };
    return [host];
  }

  private refs!: {
    matSel: HTMLSelectElement;
    sizeRange: HTMLInputElement;
    sizeVal: HTMLElement;
    zRange: HTMLInputElement;
    zVal: HTMLElement;
    sliceRange: HTMLInputElement;
    sliceVal: HTMLElement;
    bx: HTMLElement;
    by: HTMLElement;
    info: HTMLElement;
    cropBtn: HTMLElement;
    addBtn: HTMLElement;
    eraBtn: HTMLElement;
  };

  protected afterRender(): void {
    bus.on(EVT.SELECTION_BOX, (p: { box: Box }) => {
      this.selection = p.box;
      this.syncClipInfo();
    });
    editorState.subscribe(() => this.sync());
    this.sync();
  }

  private sync(): void {
    const s = editorState.settings;
    const r = this.refs;
    // 材质下拉
    r.matSel.innerHTML = '';
    for (const m of editorState.project.materials) {
      const opt = document.createElement('option');
      opt.value = String(m.id);
      opt.textContent = m.name;
      r.matSel.append(opt);
    }
    r.matSel.value = String(s.brushMaterialId);
    r.sizeRange.value = String(s.brushSize);
    r.sizeVal.textContent = String(s.brushSize);
    r.zRange.max = String(editorState.grid.nz - 1);
    r.zRange.value = String(s.currentZ);
    r.zVal.textContent = String(s.currentZ);
    const maxSlice = (s.sliceAxis === 'x' ? editorState.grid.nx : editorState.grid.ny) - 1;
    r.sliceRange.max = String(maxSlice);
    r.sliceRange.value = String(Math.min(s.sliceIndex, maxSlice));
    r.sliceVal.textContent = String(s.sliceIndex);
    r.bx.classList.toggle('active', s.sliceAxis === 'x');
    r.by.classList.toggle('active', s.sliceAxis === 'y');

    const toolBtns = this.$all('.group')[0]?.querySelectorAll('button') ?? [];
    toolBtns.forEach((b, i) => b.classList.toggle('active', TOOLS[i]?.id === s.tool));
    r.addBtn.classList.toggle('active', s.mode === 'add');
    r.eraBtn.classList.toggle('active', s.mode === 'erase');
    const mx = this.$('#mx')!;
    const my = this.$('#my')!;
    mx.classList.toggle('active', s.mirrorX);
    mx.classList.toggle('mirror-on', s.mirrorX);
    my.classList.toggle('active', s.mirrorY);
    my.classList.toggle('mirror-on', s.mirrorY);

    const crop = editorState.sliceCrop;
    r.cropBtn.classList.toggle('active', crop);
    r.cropBtn.textContent = crop ? '裁剪中：点击关闭' : '三维视图按切片裁剪';
  }

  private syncClipInfo(): void {
    if (!this.selection) {
      this.refs.info.textContent = '未选择块';
      return;
    }
    const b = this.selection;
    this.refs.info.textContent = `选区 X[${b.x0}~${b.x1}] Y[${b.y0}~${b.y1}] Z[${b.z0}~${b.z1}]，共 ${(b.x1 - b.x0 + 1) * (b.y1 - b.y0 + 1) * (b.z1 - b.z0 + 1)} 格`;
  }

  private toggleCrop(btn: HTMLElement): void {
    editorState.sliceCrop = !editorState.sliceCrop;
    editorState.emit('settings');
    void btn;
  }

  private doCopy(): void {
    if (!this.selection) {
      bus.emit(EVT.TOAST, { type: 'warn', text: '请先在俯视图用框选工具选择一块区域' });
      return;
    }
    editorState.clipboard = copyBox(editorState.grid, this.selection);
    bus.emit(EVT.TOAST, { type: 'ok', text: `已复制 ${editorState.clipboard.cells.length} 个实体格` });
  }

  private doPaste(): void {
    if (!editorState.clipboard || !this.selection) {
      bus.emit(EVT.TOAST, { type: 'warn', text: '请先复制，并在目标位置框选粘贴区（取选区原点）' });
      return;
    }
    editorState.pushUndo();
    const n = pasteClipboard(editorState.grid, editorState.clipboard, { x: this.selection.x0, y: this.selection.y0, z: this.selection.z0 });
    editorState.emit('edit');
    bus.emit(EVT.TOAST, { type: 'ok', text: `粘贴 ${n} 个实体格` });
  }

  private move(dx: number, dy: number, dz: number): void {
    if (!this.selection) {
      bus.emit(EVT.TOAST, { type: 'warn', text: '请先框选要平移的块' });
      return;
    }
    const b = this.selection;
    const g = editorState.grid;
    if (b.x0 + dx < 0 || b.x1 + dx >= g.nx || b.y0 + dy < 0 || b.y1 + dy >= g.ny || b.z0 + dz < 0 || b.z1 + dz >= g.nz) {
      bus.emit(EVT.TOAST, { type: 'warn', text: '平移超出网格范围' });
      return;
    }
    editorState.pushUndo();
    const n = translateBox(g, b, dx, dy, dz);
    this.selection = normalizeBox({ x: b.x0 + dx, y: b.y0 + dy, z: b.z0 + dz }, { x: b.x1 + dx, y: b.y1 + dy, z: b.z1 + dz });
    this.syncClipInfo();
    editorState.emit('edit');
    bus.emit(EVT.TOAST, { type: 'ok', text: `整块平移 1 格，移动 ${n} 个实体格` });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gvs-toolbar': Toolbar;
  }
}
