// 应用外壳：项目列表 / 编辑器两屏；编辑器三视图联动 + 选项卡侧栏
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import { projectStore } from '../state/ProjectStore';
import { bus, EVT } from './bus';
import './ProjectList';
import './Toolbar';
import './IsoView';
import './TopView';
import './SliceView';
import './LegendPanel';
import './BoreholePanel';
import './SectionPanel';
import './WorkflowBar';
import './StatBar';
import './Toast';

type Tab = 'tool' | 'borehole' | 'legend' | 'section' | 'workflow';

export class GvsApp extends GvsElement {
  private projectId: string | null = null;
  private tab: Tab = 'tool';
  private initialized = false;

  protected styles(): string {
    return `
      :host { display: block; min-height: 100vh; background: var(--bg); }
      .editor { display: grid; grid-template-rows: auto auto 1fr; height: 100vh; gap: 8px; padding: 8px; }
      .topbar { display: flex; align-items: center; gap: 12px; background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px 12px; }
      .topbar h2 { margin: 0; font-size: 15px; }
      .views { display: grid; grid-template-columns: 1fr 320px; gap: 8px; min-height: 0; }
      .view-stack { display: grid; grid-template-rows: 1fr 230px; gap: 8px; min-height: 0; }
      .main-row { display: grid; grid-template-columns: 1fr 340px; gap: 8px; min-height: 0; }
      .panel-box { min-height: 0; display: flex; flex-direction: column; }
      .panel-box .panel-b { flex: 1; min-height: 0; overflow: auto; }
      .side { display: flex; flex-direction: column; min-height: 0; }
      .tabs { display: flex; gap: 4px; padding: 6px 6px 0; }
      .tabs button { border-radius: 6px 6px 0 0; padding: 6px 12px; }
      .tab-body { flex: 1; min-height: 0; overflow: auto; }
      .slice-wrap { padding: 8px; overflow: auto; }
      .view-title { font-size: 12px; color: var(--text-2); padding: 6px 10px 0; font-weight: 600; }
    `;
  }

  protected template(): Node[] {
    return [this.h('div', { class: 'root' }), document.createElement('toast-host')];
  }

  protected afterRender(): void {
    // afterRender 会随每次 render() 执行，应用级初始化只做一次
    if (this.initialized) return;
    this.initialized = true;
    // composed 事件跨 Shadow DOM 只沿祖先链 retarget，监听必须挂在组件自身
    this.addEventListener('gvs-open', ((e: CustomEvent) => {
      this.projectId = e.detail.id;
      const data = projectStore.get(this.projectId!);
      if (!data) return;
      editorState.load(data);
      this.showEditor();
    }) as EventListener);
    bus.on(EVT.REQUEST_SAVE, () => editorState.persist());
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('beforeunload', (e) => {
      if (editorState.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    this.showList();
  }

  private onKey = (e: KeyboardEvent): void => {
    if (!this.projectId) return;
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      if (e.shiftKey) editorState.redo();
      else editorState.undo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
      e.preventDefault();
      editorState.redo();
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      editorState.persist();
      bus.emit(EVT.TOAST, { type: 'ok', text: '已保存' });
    }
  };

  private showList(): void {
    const root = this.root.querySelector('.root') as HTMLElement;
    root.replaceChildren(document.createElement('project-list'));
  }

  private showEditor(): void {
    const root = this.root.querySelector('.root') as HTMLElement;
    const p = editorState.project;
    const editor = this.h('div', { class: 'editor' });

    // 顶栏
    const topbar = this.h('div', { class: 'topbar' });
    topbar.append(
      this.h('button', { onClick: () => this.backToList() }, '← 返回项目区'),
      this.h('h2', {}, `${p.name}`),
      this.h('span', { class: 'tag ' + p.status }, p.id)
    );
    const statHost = this.h('div', { style: 'flex:1;display:flex;justify-content:flex-end' });
    statHost.append(document.createElement('stat-bar'));
    topbar.append(statHost);
    editor.append(topbar);

    // 工作流状态条（操作入口在「审核」选项卡，这里仅展示状态与返工次数）
    const wfPanel = this.h('div', { class: 'panel' });
    const wfBody = this.h('div', { class: 'panel-b', style: 'padding:8px 12px;display:flex;gap:12px;align-items:center' });
    wfBody.append(
      this.h('span', { class: 'tag ' + p.status }, this.statusText(p.status)),
      this.h('span', { class: p.reworkCount > 0 ? 'rework-badge' : 'muted', style: p.reworkCount > 0 ? 'color:var(--danger);font-weight:600' : '' }, `返工次数：${p.reworkCount}`),
      this.h('span', { class: 'muted', style: 'flex:1' }, `更新 ${new Date(p.updatedAt).toLocaleString('zh-CN')} · 审核操作见右侧「审核」选项卡`)
    );
    wfPanel.append(wfBody);
    editor.append(wfPanel);

    // 视图区
    const views = this.h('div', { class: 'views' });
    const stack = this.h('div', { class: 'view-stack' });
    const mainRow = this.h('div', { class: 'main-row' });

    const isoPanel = this.viewPanel('等轴测三维视图（SVG · 贪心合面）', 'iso-view');
    const topPanel = this.viewPanel('俯视平面图（当前标高联动）', 'top-view');
    mainRow.append(isoPanel, topPanel);
    stack.append(mainRow);

    const slicePanel = this.h('div', { class: 'panel panel-box' });
    slicePanel.append(this.h('div', { class: 'view-title' }, '剖面切片视图（橙色扫描线 = 当前标高，点击切片可改标高）'));
    const sw = this.h('div', { class: 'slice-wrap' });
    sw.append(document.createElement('slice-view'));
    slicePanel.append(sw);
    stack.append(slicePanel);
    views.append(stack);

    // 侧边选项卡
    const side = this.h('div', { class: 'panel side' });
    const tabs = this.h('div', { class: 'tabs seg' });
    const tabDefs: [Tab, string][] = [
      ['tool', '工具'],
      ['borehole', '钻孔'],
      ['legend', '图例材质'],
      ['section', '剖面'],
      ['workflow', '审核']
    ];
    for (const [id, label] of tabDefs) {
      tabs.append(this.h('button', { class: this.tab === id ? 'active' : '', onClick: () => { this.tab = id; this.showEditor(); } }, label));
    }
    side.append(tabs);
    const body = this.h('div', { class: 'panel-b tab-body' });
    body.append(this.createTabBody());
    side.append(body);
    views.append(side);

    editor.append(views);
    root.replaceChildren(editor);
  }

  private viewPanel(title: string, tag: string): Node {
    const panel = this.h('div', { class: 'panel panel-box' });
    panel.append(this.h('div', { class: 'view-title' }, title));
    const b = this.h('div', { class: 'panel-b', style: 'padding:6px' });
    b.append(document.createElement(tag));
    panel.append(b);
    return panel;
  }

  private createTabBody(): Node {
    switch (this.tab) {
      case 'tool':
        return document.createElement('gvs-toolbar');
      case 'borehole':
        return document.createElement('borehole-panel');
      case 'legend':
        return document.createElement('legend-panel');
      case 'section':
        return document.createElement('section-panel');
      case 'workflow':
        return document.createElement('workflow-bar');
    }
  }

  private statusText(s: string): string {
    return { ordered: '已下单', in_progress: '制作中', submitted: '待审核', rework: '退回返工', delivered: '已交付' }[s] ?? s;
  }

  private backToList(): void {
    if (editorState.isDirty && !confirm('有未保存的修改，确定返回？返回前可先保存。')) return;
    this.projectId = null;
    this.showList();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'gvs-app': GvsApp;
  }
}
