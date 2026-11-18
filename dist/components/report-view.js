// 调查说明视图:基于当前网络生成,或查看档案中保存的报告;支持下载 .md
import { app } from '../state.js';
import { buildReport } from '../report.js';
export class ReportView extends HTMLElement {
    pre;
    archiveId = null;
    text = '';
    connectedCallback() {
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
      <style>
        :host { display:flex; flex-direction:column; height:100%; font:13px system-ui; }
        .bar { display:flex; gap:8px; padding:8px; background:#f4f6f4; border-bottom:1px solid #ddd; align-items:center; }
        button { padding:4px 12px; border:1px solid #0a7; background:#0a7; color:#fff; border-radius:4px; cursor:pointer; }
        button.ghost { background:#fff; color:#0a7; }
        pre { flex:1; overflow:auto; margin:0; padding:14px 18px; font:13px/1.6 "Cascadia Mono", Consolas, monospace;
              white-space:pre-wrap; background:#fff; color:#222; }
        .who { color:#888; }
      </style>
      <div class="bar">
        <button id="genBtn">基于当前网络生成说明</button>
        <button class="ghost" id="dlBtn">下载 .md</button>
        <span class="who" id="who"></span>
      </div>
      <pre id="pre"></pre>
    `;
        this.pre = root.querySelector('#pre');
        root.querySelector('#genBtn').addEventListener('click', () => this.showCurrent());
        root.querySelector('#dlBtn').addEventListener('click', () => this.download());
        app.addEventListener('network-changed', () => {
            if (!this.archiveId)
                this.showCurrent();
        });
        this.showCurrent();
    }
    showCurrent() {
        this.archiveId = null;
        if (!app.network) {
            this.text = '尚未生成网络。';
        }
        else {
            this.text = buildReport({
                id: '(未归档)',
                region: '(未填写)',
                name: '当前工作稿',
                network: app.network,
                basemapName: app.basemap?.name ?? null,
            });
        }
        this.pre.textContent = this.text;
        this.shadowRoot.querySelector('#who').textContent = '当前工作稿(归档后报告随档案保存)';
    }
    showArchive(id) {
        const a = app.archives.find((x) => x.id === id);
        if (!a)
            return;
        this.archiveId = id;
        this.text = a.report;
        this.pre.textContent = this.text;
        this.shadowRoot.querySelector('#who').textContent = `档案 ${a.id} · ${a.region} · ${a.name}`;
    }
    download() {
        const blob = new Blob([this.text], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.archiveId ?? '潮沟调查说明'}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
customElements.define('tcn-report', ReportView);
//# sourceMappingURL=report-view.js.map