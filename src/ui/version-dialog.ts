import { ModalComponent, fmtDate } from './base.js';
import { projectStore } from '../core/archive/project-store.js';
import { workbench } from '../core/state/workbench.js';
import { computeStats } from '../core/archive/stats.js';
import { diffWithPrevious } from '../core/archive/version-diff.js';
import type { ProjectStats } from '../types.js';

/** 保存加工版本并与上一版本比对 */
export class VersionDialog extends ModalComponent {
  note = '常规加工';

  mount(): void {
    const f = workbench.file!;
    const stats: ProjectStats = computeStats(f, workbench.derivations, workbench.terrain);
    const diff = diffWithPrevious(f.versions, stats);
    this.renderModal(
      `版本加工 · 保存 v${f.currentVersion + 1}`,
      `<div class="note-row"><span class="cap">加工说明：</span><input id="note" value="${this.note}"></div>
      <table><thead><tr><th>指标</th><th>上一版本</th><th>当前</th><th>变化</th></tr></thead>
      <tbody>${diff
        .map(
          (d) => `<tr class="${d.changed ? 'chg' : ''}">
          <td>${d.label}</td><td>${d.oldValue}</td><td>${d.newValue}</td>
          <td class="${d.delta.startsWith('-') ? 'neg' : d.delta.startsWith('+') || d.delta === '新增' ? 'pos' : ''}">${d.delta}</td></tr>`
        )
        .join('')}</tbody></table>
      <div class="foot">
        <button id="cancel">取消</button>
        <button id="ok" class="primary">确认保存版本</button>
      </div>`,
      `
      .note-row { display:flex; align-items:center; gap:8px; margin-bottom:12px; }
      .note-row input { flex:1; }
      .cap { color:var(--fg-dim); font-size:11px; white-space:nowrap; }
      td, th { text-align:right; } td:first-child, th:first-child { text-align:left; }
      tr.chg { background: rgba(251,191,36,.08); }
      .pos { color:var(--warn); font-weight:600; } .neg { color:var(--danger); font-weight:600; }
      .foot { display:flex; justify-content:flex-end; gap:10px; margin-top:14px; }
      `
    );
    this.$('#cancel').addEventListener('click', () => this.remove());
    this.$('#ok').addEventListener('click', async () => {
      const note = (this.$('#note') as HTMLInputElement).value || this.note;
      const v = await projectStore.saveVersion(note, stats);
      this.renderModal(
        `版本 v${v} 已保存`,
        `<div class="done">
          <p>✓ 加工版本已写入档案库，可在后续加工中继续与历史版本比对。</p>
          <p class="cap">保存时间：${fmtDate(Date.now())}｜说明：${note}</p>
          <div class="foot"><button class="primary" id="close">完成</button></div>
        </div>`,
        `.done p { line-height:1.8; } .foot { text-align:right; margin-top:16px; }`
      );
      this.$('#close').addEventListener('click', () => this.remove());
    });
  }
}
