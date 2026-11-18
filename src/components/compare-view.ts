// 版本比对视图:当前生成结果与历史档案并排,相机联动

import { app } from '../state.js';
import { SurveyArchive } from '../types.js';
import { ViewportCanvas } from './viewport-canvas.js';

export class CompareView extends HTMLElement {
  private left!: ViewportCanvas;
  private right!: ViewportCanvas;
  private select!: HTMLSelectElement;
  private diffEl!: HTMLElement;
  private syncing = false;
  private archiveId: string | null = null;

  connectedCallback(): void {
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `
      <style>
        :host { display:flex; flex-direction:column; height:100%; font:13px system-ui; }
        .bar { display:flex; gap:8px; align-items:center; padding:6px 8px; background:#f4f6f4; border-bottom:1px solid #ddd; }
        .panes { flex:1; display:flex; min-height:0; }
        .pane { flex:1; min-width:0; position:relative; border-right:1px solid #ccc; display:flex; flex-direction:column; }
        .pane:last-child { border-right:none; }
        .pane h4 { margin:0; padding:4px 8px; font-size:12px; background:#2c343a; color:#dfe9ef; }
        .pane tcn-viewport { flex:1; min-height:0; }
        .diff { padding:6px 10px; font-size:12px; background:#fbfaf6; border-top:1px solid #ddd; max-height:120px; overflow:auto; }
        select { padding:3px 6px; }
        table { border-collapse:collapse; } td,th { border:1px solid #ddd; padding:1px 8px; }
      </style>
      <div class="bar">
        <span>右侧版本:</span>
        <select id="arcSel"><option value="">(选择历史档案)</option></select>
        <span style="color:#888;font-size:12px">两侧平移缩放联动;左侧为当前生成结果</span>
      </div>
      <div class="panes">
        <div class="pane"><h4>当前生成</h4><tcn-viewport id="L"></tcn-viewport></div>
        <div class="pane"><h4 id="rTitle">历史版本</h4><tcn-viewport id="R"></tcn-viewport></div>
      </div>
      <div class="diff" id="diff">选择档案后显示参数与统计差异。</div>
    `;
    this.left = root.querySelector('#L')!;
    this.right = root.querySelector('#R')!;
    this.select = root.querySelector('#arcSel')!;
    this.diffEl = root.querySelector('#diff')!;

    // 相机联动
    const wire = (a: ViewportCanvas, b: ViewportCanvas) => {
      a.addEventListener('tcn-camera', () => {
        if (this.syncing) return;
        this.syncing = true;
        const c = a.getCamera();
        b.setCamera(c.cx, c.cy, c.scale, true);
        this.syncing = false;
      });
    };
    wire(this.left, this.right);
    wire(this.right, this.left);

    this.select.addEventListener('change', () => {
      this.archiveId = this.select.value || null;
      this.refreshRight();
    });

    app.addEventListener('network-changed', () => {
      this.left.setNetwork(app.network);
      this.refreshDiff();
    });
    app.addEventListener('archives-changed', () => this.refreshArchives());
    app.addEventListener('opacities-changed', () => {
      this.left.setOpacities(app.opacities);
      this.right.setOpacities(app.opacities);
    });
    app.addEventListener('basemap-changed', () => {
      this.left.setBasemap(app.basemap?.bmp ?? null);
    });

    this.left.setNetwork(app.network);
    this.left.setOpacities(app.opacities);
    this.right.setOpacities(app.opacities);
    this.refreshArchives();
  }

  /** 供外部调用:指定比对档案 */
  compareWith(id: string): void {
    this.archiveId = id;
    if (this.select) this.select.value = id;
    this.refreshRight();
  }

  private refreshArchives(): void {
    if (!this.select) return;
    const cur = this.archiveId;
    this.select.innerHTML = '<option value="">(选择历史档案)</option>';
    for (const a of app.archives) {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.id} · ${a.region} · ${a.name}`;
      this.select.appendChild(opt);
    }
    if (cur && app.archives.some((a) => a.id === cur)) {
      this.select.value = cur;
    } else {
      this.archiveId = null;
    }
    this.refreshRight();
  }

  private async refreshRight(): Promise<void> {
    const a = app.archives.find((x) => x.id === this.archiveId) ?? null;
    const title = this.shadowRoot?.querySelector('#rTitle');
    if (title) title.textContent = a ? `历史版本:${a.id}` : '历史版本';
    this.right.setNetwork(a ? a.network : null);
    if (a?.basemap) {
      const bmp = await createImageBitmap(a.basemap);
      this.right.setBasemap(bmp);
    } else {
      this.right.setBasemap(null);
    }
    this.refreshDiff();
  }

  private refreshDiff(): void {
    const a: SurveyArchive | undefined = app.archives.find((x) => x.id === this.archiveId);
    const cur = app.network;
    if (!a || !cur) {
      this.diffEl.textContent = a ? '当前尚未生成网络。' : '选择档案后显示参数与统计差异。';
      return;
    }
    const p1 = cur.params;
    const p2 = a.params;
    const rows: string[] = [];
    const fields: [keyof typeof p1, string][] = [
      ['seed', '种子'],
      ['mainDirection', '主沟走向'],
      ['bifurcationAngle', '分叉角度'],
      ['branchDensity', '支沟密度'],
      ['capillaryDensity', '毛细沟密度'],
      ['meanderAmp', '曲流幅度'],
    ];
    for (const [k, label] of fields) {
      const mark = p1[k] !== p2[k] ? ' ⚠' : '';
      rows.push(`<tr><td>${label}</td><td>${p1[k]}</td><td>${p2[k]}</td><td>${mark}</td></tr>`);
    }
    const s1 = cur.stats;
    const s2 = a.network.stats;
    rows.push(
      `<tr><td>总长度(km)</td><td>${(s1.totalLength / 1000).toFixed(2)}</td><td>${(s2.totalLength / 1000).toFixed(2)}</td><td></td></tr>`,
      `<tr><td>沟网密度</td><td>${s1.density.toFixed(2)}</td><td>${s2.density.toFixed(2)}</td><td></td></tr>`,
    );
    this.diffEl.innerHTML = `<table><tr><th>项目</th><th>当前</th><th>${a.id}</th><th>差异</th></tr>${rows.join('')}</table>`;
  }
}

customElements.define('tcn-compare', CompareView);
