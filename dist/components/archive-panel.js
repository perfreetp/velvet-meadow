// 档案检索视图:按年份 / 区域 / 沟级别检索,支持载入、比对、查看报告、删除
import { app } from '../state.js';
import { filterArchives } from '../db.js';
import { LEVEL_NAMES } from '../types.js';
export class ArchivePanel extends HTMLElement {
    listEl;
    yearSel;
    regionInput;
    levelSel;
    connectedCallback() {
        const root = this.attachShadow({ mode: 'open' });
        root.innerHTML = `
      <style>
        :host { display:flex; flex-direction:column; height:100%; font:13px system-ui; }
        .filters { display:flex; gap:8px; padding:8px; background:#f4f6f4; border-bottom:1px solid #ddd; flex-wrap:wrap; align-items:center; }
        select, input { padding:3px 6px; font-size:13px; }
        .list { flex:1; overflow:auto; padding:8px; }
        table { border-collapse:collapse; width:100%; font-size:12px; }
        th, td { border:1px solid #ddd; padding:4px 8px; text-align:left; white-space:nowrap; }
        th { background:#eef2ee; position:sticky; top:0; }
        button { padding:2px 8px; margin-right:4px; font-size:12px; cursor:pointer; border:1px solid #0a7; background:#fff; color:#0a7; border-radius:3px; }
        button.del { border-color:#c50; color:#c50; }
        .empty { color:#888; padding:20px; text-align:center; }
      </style>
      <div class="filters">
        <label>年份 <select id="year"><option value="">全部</option></select></label>
        <label>区域 <input id="region" type="text" placeholder="关键字" style="width:120px"></label>
        <label>沟级别 <select id="level">
          <option value="">全部</option>
          <option value="0">主干</option><option value="1">支沟</option><option value="2">毛细沟</option>
        </select></label>
        <span id="count" style="color:#888"></span>
      </div>
      <div class="list" id="list"></div>
    `;
        this.listEl = root.querySelector('#list');
        this.yearSel = root.querySelector('#year');
        this.regionInput = root.querySelector('#region');
        this.levelSel = root.querySelector('#level');
        const apply = () => this.refresh();
        this.yearSel.addEventListener('change', apply);
        this.regionInput.addEventListener('input', apply);
        this.levelSel.addEventListener('change', apply);
        app.addEventListener('archives-changed', () => this.refreshYears());
        this.refreshYears();
    }
    refreshYears() {
        const years = [...new Set(app.archives.map((a) => a.year))].sort((a, b) => b - a);
        const cur = this.yearSel.value;
        this.yearSel.innerHTML = '<option value="">全部</option>';
        for (const y of years) {
            const opt = document.createElement('option');
            opt.value = String(y);
            opt.textContent = `${y} 年`;
            this.yearSel.appendChild(opt);
        }
        this.yearSel.value = cur;
        this.refresh();
    }
    refresh() {
        const year = this.yearSel.value ? parseInt(this.yearSel.value, 10) : null;
        const region = this.regionInput.value.trim();
        const level = this.levelSel.value ? parseInt(this.levelSel.value, 10) : null;
        const rows = filterArchives(app.archives, { year, region, level });
        this.shadowRoot.querySelector('#count').textContent = `共 ${rows.length} 条`;
        if (!rows.length) {
            this.listEl.innerHTML = '<div class="empty">无匹配档案。在「生成」页调参生成后归档即可建立编号档案。</div>';
            return;
        }
        const body = rows
            .map((a) => {
            const s = a.network.stats;
            const lv = level != null ? ` · ${LEVEL_NAMES[level]} ${(s.lengths[level] / 1000).toFixed(2)}km` : '';
            return `<tr>
          <td>${a.id}</td><td>${a.name}</td><td>${a.region}</td><td>${a.year}</td>
          <td>${a.params.seed}</td><td>${(s.totalLength / 1000).toFixed(2)} km${lv}</td>
          <td>${a.basemapName ? '📷' : '—'}</td>
          <td>
            <button data-act="load" data-id="${a.id}">载入</button>
            <button data-act="compare" data-id="${a.id}">比对</button>
            <button data-act="report" data-id="${a.id}">报告</button>
            <button class="del" data-act="del" data-id="${a.id}">删除</button>
          </td>
        </tr>`;
        })
            .join('');
        this.listEl.innerHTML = `<table>
      <tr><th>编号</th><th>名称</th><th>区域</th><th>年份</th><th>种子</th><th>总长</th><th>底图</th><th>操作</th></tr>
      ${body}</table>`;
        this.listEl.querySelectorAll('button').forEach((btn) => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const act = btn.dataset.act;
                const archive = app.archives.find((a) => a.id === id);
                if (!archive)
                    return;
                if (act === 'load') {
                    app.loadArchive(archive);
                    this.dispatchEvent(new CustomEvent('tcn-navigate', { detail: { tab: 'gen' }, bubbles: true, composed: true }));
                }
                else if (act === 'compare') {
                    this.dispatchEvent(new CustomEvent('tcn-navigate', { detail: { tab: 'compare', archiveId: id }, bubbles: true, composed: true }));
                }
                else if (act === 'report') {
                    this.dispatchEvent(new CustomEvent('tcn-navigate', { detail: { tab: 'report', archiveId: id }, bubbles: true, composed: true }));
                }
                else if (act === 'del') {
                    if (window.confirm(`删除档案 ${id}?`))
                        void app.deleteArchive(id);
                }
            });
        });
    }
}
customElements.define('tcn-archives', ArchivePanel);
//# sourceMappingURL=archive-panel.js.map