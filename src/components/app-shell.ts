// 应用外壳:布局、标签页、事件接线

import { app } from '../state.js';
import { ViewportCanvas } from './viewport-canvas.js';
import { CompareView } from './compare-view.js';
import { ReportView } from './report-view.js';

type Tab = 'gen' | 'compare' | 'archives' | 'report';

export class AppShell extends HTMLElement {
  private viewport!: ViewportCanvas;
  private compare!: CompareView;
  private report!: ReportView;
  private tab: Tab = 'gen';
  private lastGenCounter = -1;

  connectedCallback(): void {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display:flex; flex-direction:column; height:100vh; font:14px system-ui; }
        header { background:#17323f; color:#eaf3f8; padding:8px 16px; display:flex; align-items:baseline; gap:12px; }
        header h1 { font-size:16px; margin:0; font-weight:600; }
        header span { font-size:12px; color:#9fc3d4; }
        .body { flex:1; display:flex; min-height:0; }
        aside { width:300px; flex:0 0 300px; overflow-y:auto; border-right:1px solid #ccc; padding:10px 12px; background:#fbfbf8; }
        main { flex:1; display:flex; flex-direction:column; min-width:0; }
        nav { display:flex; gap:2px; background:#e8ece8; padding:4px 8px 0; }
        nav button { padding:6px 16px; border:1px solid #ccc; border-bottom:none; background:#f4f4f0;
                     border-radius:6px 6px 0 0; cursor:pointer; font-size:13px; }
        nav button.active { background:#fff; font-weight:600; color:#076; }
        .page { flex:1; min-height:0; display:none; }
        .page.active { display:flex; flex-direction:column; }
        #page-gen { position:relative; }
        #page-gen tcn-viewport { position:absolute; inset:0; }
      </style>
      <header>
        <h1>滩涂潮沟网络生成器</h1>
        <span>海岸带调查队 · 过程式生成 · 同种子完全复现</span>
      </header>
      <div class="body">
        <aside><tcn-controls></tcn-controls></aside>
        <main>
          <nav>
            <button data-tab="gen" class="active">生成视图</button>
            <button data-tab="compare">版本比对</button>
            <button data-tab="archives">档案检索</button>
            <button data-tab="report">调查说明</button>
          </nav>
          <div class="page active" id="page-gen"><tcn-viewport id="mainVp"></tcn-viewport></div>
          <div class="page" id="page-compare"><tcn-compare></tcn-compare></div>
          <div class="page" id="page-archives"><tcn-archives></tcn-archives></div>
          <div class="page" id="page-report"><tcn-report></tcn-report></div>
        </main>
      </div>
    `;
    this.viewport = root.querySelector('#mainVp')!;
    this.compare = root.querySelector('tcn-compare')!;
    this.report = root.querySelector('tcn-report')!;

    root.querySelectorAll('nav button').forEach((btn) => {
      btn.addEventListener('click', () => this.switchTab((btn as HTMLElement).dataset.tab as Tab));
    });

    // 状态 -> 主视口
    app.addEventListener('network-changed', () => {
      this.viewport.setNetwork(app.network);
      this.viewport.setSelection(app.selectedId);
      if (app.genCounter !== this.lastGenCounter) {
        this.lastGenCounter = app.genCounter;
        // 等布局稳定后适配视图
        requestAnimationFrame(() => this.viewport.fitToNetwork());
      }
    });
    app.addEventListener('selection-changed', () => this.viewport.setSelection(app.selectedId));
    app.addEventListener('opacities-changed', () => this.viewport.setOpacities(app.opacities));
    app.addEventListener('basemap-changed', () => this.viewport.setBasemap(app.basemap?.bmp ?? null));
    app.addEventListener('editmode-changed', () => {
      this.viewport.editMode = app.editMode;
      this.viewport.toggleAttribute('editing', app.editMode);
    });

    // 主视口 -> 状态
    this.viewport.addEventListener('tcn-select', (e) => {
      app.select((e as CustomEvent<{ id: string | null }>).detail.id);
    });
    this.viewport.addEventListener('tcn-edit', (e) => {
      const id = (e as CustomEvent<{ id: string }>).detail.id;
      const seg = app.network?.segments.find((s) => s.id === id);
      if (seg) app.markEdited(seg);
    });

    // 跨页导航(档案页发起比对/查看报告)
    this.addEventListener('tcn-navigate', (e) => {
      const d = (e as CustomEvent<{ tab: Tab; archiveId?: string }>).detail;
      this.switchTab(d.tab);
      if (d.tab === 'compare' && d.archiveId) this.compare.compareWith(d.archiveId);
      if (d.tab === 'report' && d.archiveId) this.report.showArchive(d.archiveId);
    });

    // 初始数据
    this.viewport.setNetwork(app.network);
    this.viewport.setOpacities(app.opacities);
  }

  private switchTab(tab: Tab): void {
    this.tab = tab;
    const root = this.shadowRoot!;
    root.querySelectorAll('nav button').forEach((b) => {
      b.classList.toggle('active', (b as HTMLElement).dataset.tab === tab);
    });
    root.querySelectorAll('.page').forEach((p) => {
      p.classList.toggle('active', p.id === `page-${tab}`);
    });
    if (tab === 'report' && this.report) {
      // 切回报告页时若未指定档案,刷新当前稿
      this.report.showCurrent();
    }
  }
}

customElements.define('tcn-app', AppShell);
