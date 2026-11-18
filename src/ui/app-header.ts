import { BaseComponent } from './base.js';
import { projectStore } from '../core/archive/project-store.js';
import { workbench } from '../core/state/workbench.js';

export class AppHeader extends BaseComponent {
  private unsub: (() => void) | null = null;

  mount(): void {
    this.draw();
    this.unsub = projectStore.subscribe(() => this.draw());
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  private draw(): void {
    const f = projectStore.currentProject;
    this.render(
      `<div class="bar">
        <div class="brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2">
            <path d="M2 16c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>
            <path d="M2 20c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2 2-2 4-2"/>
            <path d="M7 4l5 5-5 5M12 9h6"/>
          </svg>
          <span>河道地形曲面与堤线建模台</span>
        </div>
        <div class="proj">
          ${
            f
              ? `<span class="code">${f.meta.code}</span>
                 <span class="name">${f.meta.name}</span>
                 <span class="tag">${f.meta.river} / ${f.meta.reach}</span>
                 <span class="tag">v${f.currentVersion}</span>
                 <button id="btn-close" class="danger">关闭项目</button>`
              : `<span class="small">未建档 — 请新建或打开项目</span>
                 <button id="btn-new" class="primary">新建项目建档</button>
                 <button id="btn-open">打开/检索项目</button>`
          }
        </div>
      </div>`,
      `
      .bar { display:flex; align-items:center; justify-content:space-between;
        height:48px; padding:0 16px; background:var(--bg-panel); border-bottom:1px solid var(--border); }
      .brand { display:flex; align-items:center; gap:9px; font-weight:600; letter-spacing:.5px; }
      .proj { display:flex; align-items:center; gap:10px; }
      .code { font-family:var(--mono); color:var(--accent); font-weight:600; }
      .name { color:var(--fg); }
      .small { color:var(--fg-dim); font-size:11px; margin-right:4px; }
      .tag { padding:2px 8px; border:1px solid var(--border); border-radius:10px;
        color:var(--fg-dim); font-size:10px; }
      `
    );
    if (f) {
      this.root.querySelector('#btn-close')!.addEventListener('click', () => {
        workbench.resetSession();
        projectStore.closeProject();
      });
    } else {
      this.root.querySelector('#btn-new')!.addEventListener('click', () => {
        document.body.appendChild(document.createElement('project-dialog'));
      });
      this.root.querySelector('#btn-open')!.addEventListener('click', () => {
        const d = document.createElement('project-dialog');
        d.setAttribute('mode', 'open');
        document.body.appendChild(d);
      });
    }
  }
}
