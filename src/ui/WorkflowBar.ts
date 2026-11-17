// 工作流条：制作员提交、主管审核通过/退回（记返工次数）、审核日志
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import { projectStore } from '../state/ProjectStore';
import { STATUS_LABEL, ROLE_LABEL, type ProjectData, type Role } from '../types';
import { bus, EVT } from './bus';

export class WorkflowBar extends GvsElement {
  role: Role = 'supervisor';

  protected styles(): string {
    return `
      :host { display: block; }
      .bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .log { margin-top: 10px; max-height: 180px; overflow: auto; }
      .log p { margin: 3px 0; font-size: 12px; color: var(--text-2); }
      .log b { color: var(--text); }
      .reject-reason { width: 100%; margin-top: 8px; }
      .rework-big { color: var(--danger); font-weight: 700; }
    `;
  }

  protected template(): Node[] {
    const host = this.h('div');
    const bar = this.h('div', { class: 'bar' });
    const roleSel = document.createElement('select');
    roleSel.style.width = '110px';
    (['client', 'maker', 'supervisor'] as Role[]).forEach((r) => {
      const o = document.createElement('option');
      o.value = r;
      o.textContent = ROLE_LABEL[r];
      roleSel.append(o);
    });
    roleSel.value = this.role;
    roleSel.addEventListener('change', () => {
      this.role = roleSel.value as Role;
      this.renderBar();
    });
    bar.append(this.h('span', { class: 'muted' }, '当前角色'), roleSel);
    host.append(bar);

    const log = this.h('div', { class: 'log panel' });
    log.style.padding = '8px 10px';
    host.append(log);
    return [host];
  }

  protected afterRender(): void {
    editorState.subscribe(() => this.renderBar());
    this.renderBar();
  }

  private renderBar(): void {
    const bar = this.root.querySelector('.bar') as HTMLElement;
    // 保留角色选择器
    const roleSel = bar.querySelector('select') as HTMLSelectElement;
    bar.replaceChildren(this.h('span', { class: 'muted' }, '当前角色'), roleSel);

    const p: ProjectData = editorState.project;
    bar.append(this.h('span', { class: `tag ${p.status}` }, STATUS_LABEL[p.status]));
    bar.append(this.h('span', {}, `返工次数：`), this.h('b', { class: p.reworkCount > 0 ? 'rework-big' : '' }, String(p.reworkCount)));

    const reason = document.createElement('input');
    reason.className = 'reject-reason';
    reason.placeholder = '审核意见 / 退回原因（退回必填，例：ZK03 分层标高与柱状图不符）';

    if (this.role === 'maker') {
      if (p.status === 'ordered' || p.status === 'rework') {
        bar.append(this.h('button', { class: 'primary', onClick: () => this.act('start', '') }, p.status === 'rework' ? '重新制作' : '开始制作'));
      }
      if (p.status === 'in_progress') {
        bar.append(this.h('button', { class: 'primary', onClick: () => { editorState.persist(); this.act('submit', '制作完成，提交审核'); } }, '提交审核'));
      }
    }
    if (this.role === 'supervisor' && p.status === 'submitted') {
      bar.append(reason);
      bar.append(
        this.h('button', {
          class: 'primary',
          onClick: () => {
            editorState.persist();
            this.act('approve', reason.value || '审核通过');
          }
        }, '审核通过并打包交付'),
        this.h('button', {
          class: 'danger',
          onClick: () => {
            if (!reason.value.trim()) {
              bus.emit(EVT.TOAST, { type: 'warn', text: '退回必须填写原因' });
              return;
            }
            this.act('reject', reason.value);
          }
        }, '不合格退回（计返工）')
      );
    }
    if (p.status === 'delivered') {
      bar.append(this.h('span', { class: 'tag delivered' }, '✓ 已打包交付，客户可下载交付包'));
    }
    if (this.role === 'client' && (p.status === 'ordered' || p.status === 'in_progress')) {
      bar.append(this.h('span', { class: 'muted' }, '客户视角：等待制作交付'));
    }

    const log = this.root.querySelector('.log') as HTMLElement;
    log.replaceChildren();
    if (p.reviewLog.length === 0) {
      log.append(this.h('p', {}, '暂无审核记录'));
    }
    for (const rec of [...p.reviewLog].reverse()) {
      const actionText = { submit: '提交审核', approve: '审核通过', reject: '退回返工', start: '开始制作' }[rec.action];
      const color = rec.action === 'reject' ? 'var(--danger)' : rec.action === 'approve' ? 'var(--ok)' : 'var(--text)';
      const para = this.h('p', {});
      para.append(
        this.h('b', { style: `color:${color}` }, actionText),
        document.createTextNode(` · ${rec.operator}（${ROLE_LABEL[this.roleOf(rec)]}） · ${new Date(rec.time).toLocaleString('zh-CN')}`),
        document.createElement('br'),
        document.createTextNode(rec.comment ? `意见：${rec.comment}` : '')
      );
      log.append(para);
    }
  }

  private roleOf(rec: { action: string }): Role {
    return rec.action === 'approve' || rec.action === 'reject' ? 'supervisor' : 'maker';
  }

  private act(action: 'submit' | 'approve' | 'reject' | 'start', comment: string): void {
    const operator = { client: '客户王工', maker: '制作员李工', supervisor: '主管张工' }[this.role];
    const updated = projectStore.transition(editorState.project.id, action, operator, comment);
    editorState.project = updated;
    editorState.emit('workflow');
    if (action === 'approve') {
      bus.emit(EVT.TOAST, { type: 'ok', text: '审核通过，交付包已生成（可用顶部「导出交付包」下载）' });
    } else if (action === 'reject') {
      bus.emit(EVT.TOAST, { type: 'warn', text: `已退回并记录第 ${updated.reworkCount} 次返工` });
    } else {
      bus.emit(EVT.TOAST, { type: 'ok', text: '状态已更新' });
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'workflow-bar': WorkflowBar;
  }
}
