import { ModalComponent, fmtDate, fmtNum } from './base.js';
import { projectStore } from '../core/archive/project-store.js';
import type { ArchiveRecord } from '../types.js';
import { downloadText } from '../core/io/importers.js';

/** 档案库：按项目编号 / 河段 / 建模日期检索成果报告 */
export class ArchiveDialog extends ModalComponent {
  mount(): void {
    this.renderModal(
      '成果档案库检索',
      `<div class="filters">
        <div class="field"><label>项目编号</label><input id="q-code" placeholder="编号关键字"></div>
        <div class="field"><label>河段</label><input id="q-reach" placeholder="河段关键字"></div>
        <div class="field"><label>归档日期 起</label><input id="q-from" type="date"></div>
        <div class="field"><label>归档日期 止</label><input id="q-to" type="date"></div>
      </div>
      <div class="foot"><button id="q" class="primary">检索</button></div>
      <div id="list" class="list"></div>`,
      `.filters{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
       .foot{margin:4px 0 12px}
       .list{max-height:52vh;overflow:auto}
       .rec{border:1px solid var(--border);border-radius:8px;padding:10px 12px;margin-bottom:8px;background:var(--bg-panel-2)}
       .rec .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px}
       .code{font-family:var(--mono);color:var(--accent);font-weight:600}
       .dim{color:var(--fg-dim);font-size:10px;line-height:1.7}
       .row{display:flex;gap:7px}
       .snap{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:6px 0;font-size:10px}
       .snap span{background:var(--bg-input);border-radius:4px;padding:3px 6px;color:var(--fg-dim)}
       .snap b{color:var(--fg);font-family:var(--mono)}`
    );
    const run = async () => {
      const from = (this.$('#q-from') as HTMLInputElement).value;
      const to = (this.$('#q-to') as HTMLInputElement).value;
      const records = await projectStore.listArchives({
        code: (this.$('#q-code') as HTMLInputElement).value || undefined,
        reach: (this.$('#q-reach') as HTMLInputElement).value || undefined,
        dateFrom: from ? new Date(from + 'T00:00:00').getTime() : undefined,
        dateTo: to ? new Date(to + 'T23:59:59').getTime() : undefined
      });
      this.drawList(records);
    };
    this.$('#q').addEventListener('click', run);
    void run();
  }

  private drawList(records: ArchiveRecord[]): void {
    const host = this.$('#list');
    if (!records.length) {
      host.innerHTML = `<div class="dim" style="padding:24px;text-align:center">没有匹配的归档成果</div>`;
      return;
    }
    host.innerHTML = records
      .map(
        (r) => `<div class="rec" data-id="${r.id}">
        <div class="top">
          <div><span class="code">${r.projectCode}</span> <span class="dim">v${r.version}</span></div>
          <div class="dim">${fmtDate(r.createdAt)}</div>
        </div>
        <div class="dim">${r.projectName} ｜ ${r.river} ｜ ${r.reach}</div>
        <div class="snap">
          <span>高程点 <b>${r.snapshot.pointCount}</b></span>
          <span>中线长 <b>${fmtNum(r.snapshot.centerLength)}m</b></span>
          <span>最大坡度 <b>${fmtNum(r.snapshot.maxSlopeDeg)}°</b></span>
          <span>突变段 <b>${r.snapshot.alertSegmentCount}</b></span>
        </div>
        <div class="row">
          <button class="open">查看报告</button>
          <button class="dl">下载HTML</button>
        </div>
      </div>`
      )
      .join('');
    host.querySelectorAll('.rec').forEach((el) => {
      const id = el.getAttribute('data-id')!;
      const rec = records.find((r) => r.id === id)!;
      el.querySelector('.open')!.addEventListener('click', () => {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(rec.reportHtml);
          w.document.close();
        }
      });
      el.querySelector('.dl')!.addEventListener('click', () => {
        downloadText(rec.reportName, rec.reportHtml, 'text/html');
      });
    });
  }
}
