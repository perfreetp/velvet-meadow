import { BaseComponent, fmtNum } from './base.js';
import { workbench } from '../core/state/workbench.js';

/** 底部状态栏：工具提示、悬停桩号曲率、地形统计 */
export class StatusBar extends BaseComponent {
  private unsub: (() => void) | null = null;
  private hover: { lineId: string; s: number; kappa: number; radius: number } | null = null;

  mount(): void {
    this.draw();
    this.unsub = workbench.subscribe(() => this.draw());
  }

  setHover(h: typeof this.hover): void {
    this.hover = h;
    this.draw();
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  private draw(): void {
    const f = workbench.file;
    const t = workbench.terrain;
    const toolHint: Record<string, string> = {
      select: '选择模式：左键拖拽控制点，右键删除控制点',
      'add-point': '增点模式：在场景中点击，为活动线路插入控制点',
      section: '横断面模式：点击两点确定断面方向',
      'pick-slope': '选段模式：在活动堤线上依次点击起止点'
    };
    this.render(
      `<div class="status">
        <span class="hint">${toolHint[workbench.tool]}</span>
        <span class="spacer"></span>
        ${
          this.hover
            ? `<span class="kv">桩号 <b>${fmtNum(this.hover.s)} m</b></span>
               <span class="kv">曲率 <b>${fmtNum(this.hover.kappa, 5)}/m</b></span>
               <span class="kv">半径 <b>${fmtNum(this.hover.radius)} m</b></span>`
            : ''
        }
        ${t ? `<span class="kv">高程 <b>${fmtNum(t.minZ, 2)}~${fmtNum(t.maxZ, 2)}m</b></span>
               <span class="kv">最大坡度 <b>${fmtNum(t.maxSlope, 2)}°</b></span>
               <span class="kv">网格 <b>${t.cols}×${t.rows}</b></span>` : ''}
        ${f ? `<span class="kv">偏移线 <b>${f.offsetLines.length}</b></span>` : ''}
      </div>`,
      `
      .status { display:flex; align-items:center; gap:16px; height:30px; padding:0 14px;
        background:var(--bg-panel); border-top:1px solid var(--border); font-size:11px; }
      .hint { color:var(--fg-dim); }
      .spacer { flex:1; }
      .kv { color:var(--fg-dim); }
      .kv b { color:var(--accent-2); font-family:var(--mono); margin-left:4px; }
      `
    );
  }
}
