// 项目库列表：客户下单建项目、角色切换、状态流转、打开/删除
import { GvsElement } from './GvsElement';
import { projectStore } from '../state/ProjectStore';
import { STATUS_LABEL, ROLE_LABEL, type ProjectMeta, type Role } from '../types';
import { bus, EVT } from './bus';

export class ProjectList extends GvsElement {
  role: Role = 'maker';

  protected styles(): string {
    return `
      :host { display: block; max-width: 1080px; margin: 0 auto; padding: 22px; }
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
      h1 { font-size: 20px; margin: 0; }
      .role-bar { display: flex; gap: 6px; }
      .grid-card { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
      .card { padding: 14px; }
      .card h3 { margin: 0 0 6px; font-size: 15px; }
      .meta { color: var(--text-2); font-size: 12px; line-height: 1.7; }
      .card-foot { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
      .form-wrap { margin-bottom: 18px; padding: 16px; }
      .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .rework { color: var(--danger); font-weight: 600; }
    `;
  }

  protected template(): Node[] {
    const host = this.h('div');
    const head = this.h('div', { class: 'head' });
    head.append(this.h('h1', {}, '岩土三维地层体素建模系统 · 项目区'));
    const roleBar = this.h('div', { class: 'role-bar seg' });
    (['client', 'maker', 'supervisor'] as Role[]).forEach((r) => {
      roleBar.append(this.h('button', { onClick: () => { this.role = r; this.render(); } }, ROLE_LABEL[r]));
    });
    head.append(roleBar);
    host.append(head);

    if (this.role === 'client') {
      host.append(this.renderOrderForm());
    }

    const grid = this.h('div', { class: 'grid-card' });
    host.append(grid);
    return [host];
  }

  private renderOrderForm(): Node {
    const panel = this.h('div', { class: 'panel form-wrap' });
    panel.append(this.h('div', { class: 'panel-h' }, '客户下单 · 新建项目'));
    const body = this.h('div', { class: 'panel-b' });
    const fg = this.h('div', { class: 'form-grid' });
    const mkInput = (label: string, value: string, type = 'text') => {
      const f = this.h('div', { class: 'field' });
      f.append(this.h('label', {}, label));
      const inp = document.createElement('input');
      inp.type = type;
      inp.value = value;
      f.append(inp);
      return f;
    };
    const nameF = mkInput('项目名称', '某场地岩土勘察');
    const clientF = mkInput('委托客户', '××建设集团');
    const siteF = mkInput('场地位置', '城东新区 A-07 地块');
    const nxF = mkInput('网格 X（格）', '64', 'number');
    const nyF = mkInput('网格 Y（格）', '64', 'number');
    const nzF = mkInput('网格 Z（格）', '32', 'number');
    fg.append(nameF, clientF, siteF, nxF, nyF, nzF);
    body.append(fg);
    body.append(
      this.h('button', {
        class: 'primary',
        onClick: () => {
          const inputs = body.querySelectorAll('input');
          const p = projectStore.create({
            name: inputs[0].value || '未命名项目',
            client: inputs[1].value,
            site: inputs[2].value,
            nx: clampInt(inputs[3].value, 8, 256, 64),
            ny: clampInt(inputs[4].value, 8, 256, 64),
            nz: clampInt(inputs[5].value, 4, 128, 32),
            cell: 1
          });
          bus.emit(EVT.TOAST, { type: 'ok', text: `项目 ${p.id} 已下单，等待制作员接单` });
          this.render();
        }
      }, '提交订单')
    );
    panel.append(body);
    return panel;
  }

  protected afterRender(): void {
    this.drawCards();
    this.$all('.role-bar button').forEach((b, i) => b.classList.toggle('active', (['client', 'maker', 'supervisor'] as Role[])[i] === this.role));
  }

  private drawCards(): void {
    const grid = this.root.querySelector('.grid-card') as HTMLElement;
    grid.replaceChildren();
    const list = projectStore.list().sort((a, b) => b.updatedAt - a.updatedAt);
    if (list.length === 0) {
      grid.append(this.h('div', { class: 'muted', style: 'padding:30px 0' }, '暂无项目，切换到「客户」角色下单建项目。'));
      return;
    }
    for (const p of list) {
      grid.append(this.renderCard(p));
    }
  }

  private renderCard(p: ProjectMeta): Node {
    const card = this.h('div', { class: 'panel card' });
    card.append(this.h('h3', {}, p.name));
    const tag = this.h('span', { class: `tag ${p.status}` }, STATUS_LABEL[p.status]);
    card.append(this.h('div', { class: 'meta' }, [
      document.createTextNode(`编号 ${p.id} · ${p.client}`),
      document.createElement('br'),
      document.createTextNode(`场地 ${p.site}`),
      document.createElement('br'),
      document.createTextNode(`网格 ${p.nx}×${p.ny}×${p.nz}，单格 ${p.cell}m`),
      document.createElement('br'),
      document.createTextNode(`更新 ${new Date(p.updatedAt).toLocaleString('zh-CN')}`)
    ]));
    const foot = this.h('div', { class: 'card-foot' });
    foot.append(tag);
    if (p.reworkCount > 0) foot.append(this.h('span', { class: 'rework' }, `返工 ${p.reworkCount} 次`));
    const spacer = this.h('span', { style: 'flex:1' });
    foot.append(spacer);
    foot.append(this.h('button', { class: 'primary', onClick: () => this.open(p.id) }, '打开'));
    foot.append(this.h('button', { class: 'danger', onClick: () => { if (confirm('确认删除该项目？')) { projectStore.remove(p.id); this.render(); } } }, '删除'));
    card.append(foot);
    return card;
  }

  private open(id: string): void {
    this.dispatchEvent(new CustomEvent('gvs-open', { detail: { id }, bubbles: true, composed: true }));
  }
}

function clampInt(v: string, min: number, max: number, dft: number): number {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return dft;
  return Math.max(min, Math.min(max, n));
}

declare global {
  interface HTMLElementTagNameMap {
    'project-list': ProjectList;
  }
}
