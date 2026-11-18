import { ModalComponent, fmtDate } from './base.js';
import { projectStore } from '../core/archive/project-store.js';
import { workbench } from '../core/state/workbench.js';
import type { ProjectMeta } from '../types.js';

export class ProjectDialog extends ModalComponent {
  private mode: 'create' | 'open' = 'create';

  static get observedAttributes(): string[] {
    return ['mode'];
  }

  attributeChangedCallback(): void {
    this.mode = (this.getAttribute('mode') as 'open') === 'open' ? 'open' : 'create';
    this.mount();
  }

  mount(): void {
    this.mode = (this.getAttribute('mode') as 'open') === 'open' ? 'open' : 'create';
    if (this.mode === 'create') this.renderCreate();
    else this.renderSearch();
  }

  private renderCreate(): void {
    this.renderModal(
      '新建项目 · 建档编号',
      `<form id="f">
        <div class="grid">
          <div class="field"><label>项目编号 *</label><input name="code" required placeholder="如 HD-2026-018" value="HD-${new Date().getFullYear()}-"></div>
          <div class="field"><label>项目名称 *</label><input name="name" required placeholder="如 某河某段地形建模"></div>
          <div class="field"><label>河流名称 *</label><input name="river" required placeholder="如 潇水河"></div>
          <div class="field"><label>河段 *</label><input name="reach" required placeholder="如 城区段 K0+000~K1+200"></div>
        </div>
        <div id="err" class="err"></div>
        <div class="foot"><button type="button" id="cancel">取消</button><button type="submit" class="primary">建档并进入作业</button></div>
      </form>`,
      `.grid{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
       .foot{display:flex;justify-content:flex-end;gap:10px;margin-top:8px}
       .err{color:var(--danger);font-size:11px;min-height:16px}`
    );
    this.$('#cancel').addEventListener('click', () => this.remove());
    this.$('#f').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target as HTMLFormElement);
      try {
        const file = await projectStore.createProject({
          code: String(fd.get('code')!).trim(),
          name: String(fd.get('name')!).trim(),
          river: String(fd.get('river')!).trim(),
          reach: String(fd.get('reach')!).trim()
        });
        workbench.resetSession();
        this.remove();
      } catch (err) {
        this.$('#err').textContent = (err as Error).message;
      }
    });
  }

  private renderSearch(): void {
    this.renderModal(
      '打开 / 检索项目',
      `<div class="filters">
        <div class="field"><label>项目编号</label><input id="q-code" placeholder="编号关键字"></div>
        <div class="field"><label>河段</label><input id="q-reach" placeholder="河段关键字"></div>
        <div class="field"><label>建模日期 起</label><input id="q-from" type="date"></div>
        <div class="field"><label>建模日期 止</label><input id="q-to" type="date"></div>
      </div>
      <div class="foot"><button id="q-btn" class="primary">检索</button></div>
      <div id="list" class="list"></div>`,
      `.filters{display:grid;grid-template-columns:1fr 1fr;gap:0 14px}
       .foot{margin:4px 0 12px}
       .list{max-height:46vh;overflow:auto;border:1px solid var(--border);border-radius:8px}
       .item{display:grid;grid-template-columns:1.4fr 1fr 1fr auto;gap:10px;align-items:center;
         padding:9px 12px;border-bottom:1px solid var(--border)}
       .item:last-child{border-bottom:none}
       .item:hover{background:var(--bg-panel-2)}
       .code{font-family:var(--mono);color:var(--accent)}
       .dim{color:var(--fg-dim);font-size:11px}
       .del{color:var(--danger)}`
    );
    const runQuery = async () => {
      const fromVal = (this.$('#q-from') as HTMLInputElement).value;
      const toVal = (this.$('#q-to') as HTMLInputElement).value;
      const metas = await projectStore.listProjects({
        code: (this.$('#q-code') as HTMLInputElement).value || undefined,
        reach: (this.$('#q-reach') as HTMLInputElement).value || undefined,
        dateFrom: fromVal ? new Date(fromVal + 'T00:00:00').getTime() : undefined,
        dateTo: toVal ? new Date(toVal + 'T23:59:59').getTime() : undefined
      });
      this.drawList(metas);
    };
    this.$('#q-btn').addEventListener('click', runQuery);
    void runQuery();
  }

  private drawList(metas: ProjectMeta[]): void {
    const host = this.$('#list');
    if (!metas.length) {
      host.innerHTML = `<div class="dim" style="padding:22px;text-align:center">没有匹配的项目</div>`;
      return;
    }
    host.innerHTML = metas
      .map(
        (m) => `<div class="item" data-code="${m.code}">
          <div><div class="code">${m.code}</div><div class="dim">${m.name}</div></div>
          <div class="dim">${m.river}<br>${m.reach}</div>
          <div class="dim">建档 ${fmtDate(m.createdAt)}<br>更新 ${fmtDate(m.updatedAt)}</div>
          <div class="row" style="display:flex;gap:6px">
            <button class="primary open">打开</button>
            <button class="del">删除</button>
          </div>
        </div>`
      )
      .join('');
    host.querySelectorAll('.item').forEach((el) => {
      const code = el.getAttribute('data-code')!;
      el.querySelector('.open')!.addEventListener('click', async () => {
        await projectStore.openProject(code);
        workbench.resetSession();
        this.remove();
      });
      el.querySelector('.del')!.addEventListener('click', async () => {
        if (confirm(`确认删除项目 ${code}？该操作不可恢复。`)) {
          await projectStore.deleteProject(code);
          (el as HTMLElement).remove();
        }
      });
    });
  }
}
