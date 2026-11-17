import { BaseComponent, sharedCss, toast } from './base';
import { DocumentStore } from '../core/store';
import { EditorCanvas, type EditorTool } from './editor-canvas';
import { booleanOp, allIntersections, type BoolOp } from '../core/boolean';
import { downloadSvg } from '../core/svg-export';
import { isPathClosed, closureRatio } from '../core/geometry';
import type { PathData } from '../core/types';

const CSS = `
:host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.toolbar {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  padding: 8px 10px; background: var(--panel); border-bottom: 1px solid var(--border);
}
.toolbar .group { display: flex; gap: 4px; align-items: center; padding-right: 10px; margin-right: 4px; border-right: 1px solid var(--border); }
.toolbar .group:last-child { border-right: none; }
.body { flex: 1; display: flex; min-height: 0; }
.sidebar {
  width: 264px; min-width: 264px; background: var(--panel);
  border-right: 1px solid var(--border); display: flex; flex-direction: column;
}
.sidebar.right { border-right: none; border-left: 1px solid var(--border); }
.tabs { display: flex; border-bottom: 1px solid var(--border); }
.tabs button { flex: 1; border-radius: 0; border: none; background: transparent; padding: 10px 4px; }
.tabs button.active { background: var(--panel-2); color: var(--accent); border-bottom: 2px solid var(--accent); }
.tab-body { flex: 1; overflow: auto; padding: 10px; }
.entry {
  display: flex; align-items: center; gap: 6px; padding: 7px 8px;
  border: 1px solid var(--border); border-radius: 6px; margin-bottom: 6px;
  background: var(--panel-2); cursor: pointer;
}
.entry.selected { border-color: var(--accent); background: #0c2f45; }
.entry .name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.entry .mini { display: flex; gap: 3px; }
.entry button { padding: 2px 7px; font-size: 11px; }
.canvas-host { flex: 1; display: flex; min-width: 0; position: relative; }
.prop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.full { grid-column: 1 / -1; }
.bool-btns { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
.statusbar {
  padding: 5px 10px; background: var(--panel); border-top: 1px solid var(--border);
  font-size: 11px; color: var(--muted); display: flex; gap: 16px;
}
.seg-item { border: 1px solid var(--border); border-radius: 6px; padding: 7px; margin-bottom: 6px; background: var(--panel-2); }
`;

export class EditorView extends BaseComponent {
  store: DocumentStore;
  private canvas!: EditorCanvas;
  private leftTab: 'layers' | 'paths' | 'props' = 'layers';
  private rightTab: 'boolean' | 'snap' = 'boolean';
  /** 提交回调（学生练习模式） */
  onSubmit?: () => void;
  submitLabel = '提交作业';
  showSubmit = false;
  /** 出题模式：缺口标记回调由外部接管 */
  extraButton?: { label: string; action: () => void };

  constructor(store: DocumentStore) {
    super();
    this.store = store;
  }

  protected render(): void {
    this.shadow.innerHTML = `<style>${sharedCss}${CSS}</style>
      <div class="toolbar">
        <div class="group">
          <button data-tool="select" title="选择/拖动锚点 (V)">🖱 选择</button>
          <button data-tool="polyline" title="折线工具，点击落点，双击/Esc 结束">✏ 折线</button>
          <button data-tool="arc" title="圆弧工具：点起点、移动定弧顶、点终点">⌒ 圆弧</button>
          <button data-tool="pan" title="平移画布 (H)">✋ 平移</button>
        </div>
        <div class="group">
          <button id="btn-fit">适应窗口</button>
          <button id="btn-zoom-in">放大</button>
          <button id="btn-zoom-out">缩小</button>
        </div>
        <div class="group">
          <button id="btn-undo" title="Ctrl+Z">↶ 撤销</button>
          <button id="btn-redo" title="Ctrl+Y">↷ 重做</button>
        </div>
        <div class="group">
          <button id="btn-svg">导出 SVG</button>
          ${this.showSubmit ? `<button id="btn-submit" class="primary">${this.submitLabel}</button>` : ''}
          ${this.extraButton ? `<button id="btn-extra" class="primary">${this.extraButton.label}</button>` : ''}
        </div>
      </div>
      <div class="body">
        <div class="sidebar">
          <div class="tabs">
            <button data-tab="layers" class="${this.leftTab === 'layers' ? 'active' : ''}">图层</button>
            <button data-tab="paths" class="${this.leftTab === 'paths' ? 'active' : ''}">路径</button>
            <button data-tab="props" class="${this.leftTab === 'props' ? 'active' : ''}">属性</button>
          </div>
          <div class="tab-body" id="left-body"></div>
        </div>
        <div class="canvas-host"><editor-canvas></editor-canvas></div>
        <div class="sidebar right">
          <div class="tabs">
            <button data-rtab="boolean" class="${this.rightTab === 'boolean' ? 'active' : ''}">布尔运算</button>
            <button data-rtab="snap" class="${this.rightTab === 'snap' ? 'active' : ''}">吸附/约束</button>
          </div>
          <div class="tab-body" id="right-body"></div>
        </div>
      </div>
      <div class="statusbar" id="status"></div>`;
  }

  protected afterRender(): void {
    this.canvas = this.$('editor-canvas') as EditorCanvas;
    this.canvas.store = this.store;

    this.shadow.querySelectorAll('[data-tool]').forEach(b => {
      b.addEventListener('click', () => {
        this.canvas.setTool((b as HTMLElement).dataset.tool as EditorTool);
        this.syncToolButtons();
      });
    });
    this.shadow.querySelectorAll('[data-tab]').forEach(b => {
      b.addEventListener('click', () => { this.leftTab = (b as HTMLElement).dataset.tab as typeof this.leftTab; this.rerender(); });
    });
    this.shadow.querySelectorAll('[data-rtab]').forEach(b => {
      b.addEventListener('click', () => { this.rightTab = (b as HTMLElement).dataset.rtab as typeof this.rightTab; this.rerender(); });
    });

    this.$('#btn-fit')?.addEventListener('click', () => this.canvas.fitView());
    this.$('#btn-zoom-in')?.addEventListener('click', () => this.zoom(1.2));
    this.$('#btn-zoom-out')?.addEventListener('click', () => this.zoom(1 / 1.2));
    this.$('#btn-undo')?.addEventListener('click', () => this.store.undo());
    this.$('#btn-redo')?.addEventListener('click', () => this.store.redo());
    this.$('#btn-svg')?.addEventListener('click', () => {
      downloadSvg(this.store.doc, `断屑槽轮廓_${new Date().toISOString().slice(0, 10)}.svg`);
      toast('已按实际尺寸(mm)导出 SVG，图层名已写入 data-layer-name');
    });
    this.$('#btn-submit')?.addEventListener('click', () => this.onSubmit?.());
    this.$('#btn-extra')?.addEventListener('click', () => this.extraButton?.action());

    this.store.addEventListener('change', this.refreshPanels);
    this.store.addEventListener('select', this.refreshPanels);
    this.store.addEventListener('history', this.refreshPanels);
    this.store.addEventListener('load', this.refreshPanels);

    this.shadow.addEventListener('keydown', (e: Event) => {
      const ke = e as KeyboardEvent;
      if ((ke.ctrlKey || ke.metaKey) && ke.key.toLowerCase() === 'z') {
        ke.preventDefault();
        ke.shiftKey ? this.store.redo() : this.store.undo();
      }
      if ((ke.ctrlKey || ke.metaKey) && ke.key.toLowerCase() === 'y') {
        ke.preventDefault();
        this.store.redo();
      }
    });

    this.refreshPanels();
    this.syncToolButtons();
  }

  private zoom(f: number): void {
    this.canvas.zoomBy(f);
  }

  disconnectedCallback(): void {
    this.store.removeEventListener('change', this.refreshPanels);
    this.store.removeEventListener('select', this.refreshPanels);
    this.store.removeEventListener('history', this.refreshPanels);
    this.store.removeEventListener('load', this.refreshPanels);
  }

  private syncToolButtons(): void {
    this.shadow.querySelectorAll('[data-tool]').forEach(b => {
      b.classList.toggle('active', (b as HTMLElement).dataset.tool === this.canvas.tool);
    });
  }

  private refreshPanels = (): void => {
    this.renderLeft();
    this.renderRight();
    this.renderStatus();
    const undo = this.$('#btn-undo') as HTMLButtonElement | null;
    const redo = this.$('#btn-redo') as HTMLButtonElement | null;
    if (undo) undo.disabled = !this.store.canUndo;
    if (redo) redo.disabled = !this.store.canRedo;
    if (undo) undo.title = this.store.undoLabel ? `撤销: ${this.store.undoLabel}` : '无可撤销';
    if (redo) redo.title = this.store.redoLabel ? `重做: ${this.store.redoLabel}` : '无可重做';
  };

  private renderLeft(): void {
    const body = this.$('#left-body');
    if (!body) return;
    if (this.leftTab === 'layers') body.innerHTML = this.layersHtml();
    if (this.leftTab === 'paths') body.innerHTML = this.pathsHtml();
    if (this.leftTab === 'props') body.innerHTML = this.propsHtml();
    this.bindLeft();
  }

  private layersHtml(): string {
    const rows = this.store.doc.layers.map(l => `
      <div class="entry ${l.id === this.store.doc.activeLayerId ? 'selected' : ''}" data-layer="${l.id}">
        <span style="width:10px;height:10px;border-radius:2px;background:${l.color};display:inline-block"></span>
        <span class="name" title="${l.name}">${l.name} <span class="tag">${l.pathIds.length}</span></span>
        <span class="mini">
          <button data-act="visible" title="${l.visible ? '隐藏' : '显示'}">${l.visible ? '👁' : '🚫'}</button>
          <button data-act="lock" title="${l.locked ? '解锁' : '锁定'}">${l.locked ? '🔒' : '🔓'}</button>
        </span>
      </div>`).join('');
    return `<div class="col">
      <div class="row"><button id="add-layer" class="primary" style="flex:1">＋ 新建图层</button></div>
      ${rows || '<div class="empty">暂无图层</div>'}
      <hr>
      <div class="muted small">点击图层名切换当前层；锁定层不可编辑，隐藏层不参与导出。</div>
    </div>`;
  }

  private pathsHtml(): string {
    const paths = Object.values(this.store.doc.paths);
    const rows = paths.map(p => {
      const closed = isPathClosed(p);
      const ratio = Math.round(closureRatio(p) * 100);
      const sel = this.store.selectedPathIds.includes(p.id);
      const layer = this.store.layerOfPath(p.id);
      return `<div class="entry ${sel ? 'selected' : ''}" data-path="${p.id}">
        <span style="width:10px;height:10px;border-radius:50%;background:${p.color};display:inline-block"></span>
        <span class="name" title="${p.name}">${p.name}
          <span class="tag ${closed ? 'ok' : 'warn'}">${closed ? '闭合' : `开放 ${ratio}%`}</span>
          <span class="tag small">${layer?.name ?? ''}</span>
        </span>
        <span class="mini">
          <button data-act="dup" title="复制">⧉</button>
          <button data-act="del" title="删除">✕</button>
        </span>
      </div>`;
    }).join('');
    return `<div class="col">
      <div class="muted small">点击条目选中（布尔运算需选两条）；双击边可插入锚点。</div>
      ${rows || '<div class="empty">暂无路径，用折线/圆弧工具开始绘制</div>'}
    </div>`;
  }

  private propsHtml(): string {
    const id = this.store.selectedPathIds[0];
    const path = id ? this.store.doc.paths[id] : null;
    if (!path) return '<div class="empty">选择一条路径后在此编辑属性</div>';
    const segRows = path.segs.map((s, i) => `
      <div class="seg-item">
        <div class="row" style="justify-content:space-between">
          <span class="muted">边 #${i + 1} · ${s.type === 'line' ? '直线' : '圆弧'}</span>
          <button data-segact="toggle" data-seg="${s.id}">${s.type === 'line' ? '转圆弧' : '转直线'}</button>
        </div>
        ${s.type === 'arc' ? `
          <label style="margin-top:6px">曲率 bulge: ${s.bulge.toFixed(3)}</label>
          <input type="range" min="-2" max="2" step="0.01" value="${s.bulge}" data-bulge="${s.id}">
        ` : ''}
      </div>`).join('');
    return `<div class="col">
      <div class="prop-grid">
        <div class="full">
          <label>路径名称</label>
          <input id="prop-name" value="${path.name}">
        </div>
        <div class="full">
          <label>颜色</label>
          <input type="color" id="prop-color" value="${path.color}">
        </div>
        <div class="full row">
          <label style="margin:0">闭合轮廓</label>
          <input type="checkbox" id="prop-closed" ${path.closed ? 'checked' : ''} style="width:auto">
        </div>
        <div class="full muted small">锚点 ${path.anchors.length} 个 · 边 ${path.segs.length} 条 · 闭合率 ${Math.round(closureRatio(path) * 100)}%</div>
      </div>
      <hr><div class="panel-title">边与曲率</div>${segRows || '<div class="empty">尚无边</div>'}
    </div>`;
  }

  private renderRight(): void {
    const body = this.$('#right-body');
    if (!body) return;
    if (this.rightTab === 'boolean') body.innerHTML = this.boolHtml();
    else body.innerHTML = this.snapHtml();
    this.bindRight();
  }

  private boolHtml(): string {
    const sel = this.store.selectedPathIds;
    const p0 = sel[0] ? this.store.doc.paths[sel[0]] : null;
    const p1 = sel[1] ? this.store.doc.paths[sel[1]] : null;
    const ready = !!p0 && !!p1 && isPathClosed(p0) && isPathClosed(p1);
    const ipRows = this.store.doc.intersections.map(ip => `
      <div class="seg-item small">
        <span class="tag err">交点</span>
        (${ip.x.toFixed(2)}, ${ip.y.toFixed(2)})
        <span class="tag">${ip.source}</span>
      </div>`).join('');
    return `<div class="col">
      <div class="panel-title">运算对象（选 2 条闭合路径）</div>
      <div class="seg-item small">
        A: ${p0 ? `${p0.name} ${isPathClosed(p0) ? '✓闭合' : '<span class="tag warn">未闭合</span>'}` : '<span class="muted">未选择</span>'}
      </div>
      <div class="seg-item small">
        B: ${p1 ? `${p1.name} ${isPathClosed(p1) ? '✓闭合' : '<span class="tag warn">未闭合</span>'}` : '<span class="muted">未选择</span>'}
      </div>
      <div class="bool-btns">
        <button data-op="union" ${!ready ? 'disabled' : ''}>∪ 并集</button>
        <button data-op="difference" ${!ready ? 'disabled' : ''}>− 差集</button>
        <button data-op="intersection" ${!ready ? 'disabled' : ''}>∩ 交集</button>
      </div>
      <button id="btn-detect" class="small">仅检测交点（不裁剪）</button>
      <hr>
      <div class="panel-title">新生成交点 <span class="tag">${this.store.doc.intersections.length}</span></div>
      ${ipRows || '<div class="empty small">执行布尔运算后，新交点会在此列出并在画布红色高亮，原锚点全部保留</div>'}
      <button id="btn-clear-ip" class="small danger" ${this.store.doc.intersections.length ? '' : 'disabled'}>清除交点标记</button>
    </div>`;
  }

  private snapHtml(): string {
    return `<div class="col">
      <div class="panel-title">吸附</div>
      <label class="row" style="color:var(--text)"><input type="checkbox" id="snap-grid" ${this.canvas.snapGrid ? 'checked' : ''} style="width:auto"> 格点吸附（间距 ${this.store.doc.grid}mm）</label>
      <label class="row" style="color:var(--text)"><input type="checkbox" id="snap-anchor" ${this.canvas.snapAnchor ? 'checked' : ''} style="width:auto"> 已有点位吸附</label>
      <label>吸附半径 ${this.canvas.snapThresholdMm.toFixed(1)} mm</label>
      <input type="range" id="snap-radius" min="0.3" max="4" step="0.1" value="${this.canvas.snapThresholdMm}">
      <hr>
      <div class="panel-title">方向约束</div>
      <div class="muted small">
        绘制或拖锚点时按住 <b>Shift</b>，从端点拉出水平 / 垂直 / 45° 约束线，
        接近 45° 扇形区自动吸附到斜线，画布同步显示虚线约束辅助线。
      </div>
      <hr>
      <div class="panel-title">画布规格</div>
      <div class="prop-grid">
        <div><label>宽 (mm)</label><input id="doc-w" type="number" value="${this.store.doc.width}"></div>
        <div><label>高 (mm)</label><input id="doc-h" type="number" value="${this.store.doc.height}"></div>
        <div class="full"><label>网格 (mm)</label><input id="doc-grid" type="number" value="${this.store.doc.grid}"></div>
      </div>
      <button id="doc-apply" class="small">应用规格</button>
    </div>`;
  }

  private renderStatus(): void {
    const el = this.$('#status');
    if (!el) return;
    const nPaths = Object.keys(this.store.doc.paths).length;
    const nClosed = Object.values(this.store.doc.paths).filter(isPathClosed).length;
    const nIp = this.store.doc.intersections.length;
    el.innerHTML = `
      <span>路径 ${nPaths}（闭合 ${nClosed}）</span>
      <span>交点 ${nIp}</span>
      <span>图层 ${this.store.doc.layers.length} · 当前「${this.store.activeLayer.name}」${this.store.activeLayer.locked ? ' 🔒已锁定' : ''}</span>
      <span style="margin-left:auto">单位 mm · 导出 1:1 实际尺寸</span>`;
  }

  private bindLeft(): void {
    this.$('#add-layer')?.addEventListener('click', () => {
      this.store.addLayer();
      toast('已新建图层');
    });
    this.shadow.querySelectorAll('[data-layer]').forEach(el => {
      const id = (el as HTMLElement).dataset.layer!;
      el.addEventListener('click', e => {
        const act = (e.target as HTMLElement).dataset.act;
        if (act === 'visible') return this.store.toggleLayerVisible(id);
        if (act === 'lock') return this.store.toggleLayerLock(id);
        this.store.setActiveLayer(id);
      });
      el.addEventListener('dblclick', () => {
        const layer = this.store.doc.layers.find(l => l.id === id)!;
        const name = prompt('图层名称', layer.name);
        if (name) this.store.renameLayer(id, name);
      });
    });
    this.shadow.querySelectorAll('[data-path]').forEach(el => {
      const id = (el as HTMLElement).dataset.path!;
      el.addEventListener('click', e => {
        const act = (e.target as HTMLElement).dataset.act;
        if (act === 'del') return this.store.removePath(id);
        if (act === 'dup') return this.store.duplicatePath(id);
        this.store.togglePathSelection(id);
      });
    });
    const nameInput = this.$('#prop-name') as HTMLInputElement | null;
    nameInput?.addEventListener('change', () => {
      const id = this.store.selectedPathIds[0];
      if (id && nameInput.value) this.store.renamePath(id, nameInput.value);
    });
    const colorInput = this.$('#prop-color') as HTMLInputElement | null;
    colorInput?.addEventListener('change', () => {
      const id = this.store.selectedPathIds[0];
      const p = id ? this.store.doc.paths[id] : null;
      if (p) { p.color = colorInput.value; this.store.dispatchEvent(new CustomEvent('change')); }
    });
    const closedCb = this.$('#prop-closed') as HTMLInputElement | null;
    closedCb?.addEventListener('change', () => {
      const id = this.store.selectedPathIds[0];
      if (id) this.store.setPathClosed(id, closedCb.checked);
    });
    this.shadow.querySelectorAll('[data-segact]').forEach(b => {
      b.addEventListener('click', () => {
        const pid = this.store.selectedPathIds[0];
        const segId = (b as HTMLElement).dataset.seg!;
        if (pid) this.store.toggleSegmentArc(pid, segId);
      });
    });
    this.shadow.querySelectorAll('[data-bulge]').forEach(inp => {
      inp.addEventListener('input', () => {
        const pid = this.store.selectedPathIds[0];
        const segId = (inp as HTMLInputElement).dataset.bulge!;
        const path = pid ? this.store.doc.paths[pid] : null;
        const seg = path?.segs.find(s => s.id === segId);
        if (seg && seg.type === 'arc') {
          seg.bulge = parseFloat((inp as HTMLInputElement).value);
          this.store.dispatchEvent(new CustomEvent('change'));
        }
      });
    });
  }

  private bindRight(): void {
    this.shadow.querySelectorAll('[data-op]').forEach(b => {
      b.addEventListener('click', () => this.runBoolean((b as HTMLElement).dataset.op as BoolOp));
    });
    this.$('#btn-detect')?.addEventListener('click', () => this.detectOnly());
    this.$('#btn-clear-ip')?.addEventListener('click', () => this.store.clearIntersections());
    (this.$('#snap-grid') as HTMLInputElement | null)?.addEventListener('change', e => {
      this.canvas.snapGrid = (e.target as HTMLInputElement).checked;
    });
    (this.$('#snap-anchor') as HTMLInputElement | null)?.addEventListener('change', e => {
      this.canvas.snapAnchor = (e.target as HTMLInputElement).checked;
    });
    (this.$('#snap-radius') as HTMLInputElement | null)?.addEventListener('input', e => {
      this.canvas.snapThresholdMm = parseFloat((e.target as HTMLInputElement).value);
    });
    this.$('#doc-apply')?.addEventListener('click', () => {
      const w = parseFloat((this.$('#doc-w') as HTMLInputElement).value);
      const h = parseFloat((this.$('#doc-h') as HTMLInputElement).value);
      const g = parseFloat((this.$('#doc-grid') as HTMLInputElement).value);
      if (w > 0 && h > 0 && g > 0) {
        this.store.doc.width = w; this.store.doc.height = h; this.store.doc.grid = g;
        this.store.dispatchEvent(new CustomEvent('change'));
        this.canvas.fitView();
        toast('画布规格已更新');
      }
    });
  }

  private runBoolean(op: BoolOp): void {
    const [a, b] = this.store.selectedPathIds;
    const p0 = this.store.doc.paths[a];
    const p1 = this.store.doc.paths[b];
    if (!p0 || !p1) return toast('请先选中两条闭合路径', 'warn');
    if (!isPathClosed(p0) || !isPathClosed(p1)) return toast('两条路径都必须是闭合轮廓', 'err');
    try {
      const result = booleanOp(p0, p1, op);
      if (result.paths.length === 0 && result.intersections.length === 0) {
        return toast('运算结果为空（可能为包含关系的退化情形）', 'warn');
      }
      const label = op === 'union' ? '并集运算' : op === 'difference' ? '差集运算' : '交集运算';
      this.store.addBooleanResult(result.paths, result.intersections, label);
      toast(`${label}完成：生成 ${result.paths.length} 条轮廓、${result.intersections.length} 个新交点（原锚点已保留）`);
    } catch (err) {
      console.error(err);
      toast('布尔运算失败：' + (err as Error).message, 'err');
    }
  }

  private detectOnly(): void {
    const [a, b] = this.store.selectedPathIds;
    const p0 = this.store.doc.paths[a];
    const p1 = this.store.doc.paths[b];
    if (!p0 || !p1) return toast('请先选中两条路径', 'warn');
    const ips = allIntersections(p0, p1);
    this.store.setIntersections(ips);
    toast(ips.length ? `检测到 ${ips.length} 个交点` : '两条路径没有交点', ips.length ? 'info' : 'warn');
  }

  getStore(): DocumentStore { return this.store; }

  /** 只读模式（复核/查看参考答案时禁用编辑） */
  setReadOnly(ro: boolean): void {
    requestAnimationFrame(() => { if (this.canvas) this.canvas.readOnly = ro; });
  }
}

customElements.define('editor-view', EditorView);
