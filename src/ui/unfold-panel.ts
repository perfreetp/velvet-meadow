import { BaseComponent, fmtDate, fmtNum } from './base.js';
import { workbench, LINE_NAMES } from '../core/state/workbench.js';

export class UnfoldPanel extends BaseComponent {
  private unsub: (() => void) | null = null;

  mount(): void {
    this.draw();
    this.unsub = workbench.subscribe(() => this.draw());
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  private draw(): void {
    const f = workbench.file;
    const preview = workbench.unfoldPreview;
    this.render(
      `<h3>堤坡测地线展开</h3>
      <div id="body"></div>`,
      `
      .hint { color:var(--fg-dim); font-size:10px; line-height:1.6; }
      canvas { width:100%; border:1px solid var(--border); border-radius:8px; background:var(--bg-input); }
      .kv { display:grid; grid-template-columns:1fr 1fr; gap:4px 10px; font-size:11px; margin:8px 0; }
      .kv div { display:flex; justify-content:space-between; background:var(--bg-panel-2);
        border-radius:5px; padding:4px 7px; }
      .kv b { font-family:var(--mono); color:var(--accent-2); }
      .controls { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:8px 0; }
      .saved { border:1px solid var(--border); border-radius:6px; padding:7px 9px; margin-top:7px;
        font-size:10px; background:var(--bg-panel-2); }
      .saved .t { color:var(--accent); margin-bottom:3px; }
      `
    );
    const host = this.$('#body');
    if (!f) {
      host.innerHTML = `<div class="hint">打开项目后使用「堤坡选段」工具，在活动堤线上点选起止位置。</div>`;
      return;
    }
    host.innerHTML = `
      <div class="controls">
        <div class="field"><label>条带宽 (m)</label><input type="number" id="width" value="40" min="1" step="1"></div>
        <div class="field"><label>展开侧</label>
          <select id="side"><option value="left">左侧坡</option><option value="right">右侧坡</option></select></div>
      </div>
      <div class="hint">① 顶部选「堤坡选段」工具 ② 在活动堤线（${LINE_NAMES[workbench.activeLine]}）上依次点选起点、终点 ③ 预览并保存成果图</div>
      <div id="preview"></div>
      <h3 style="margin-top:14px">已保存成果（${f.unfoldResults.length}）</h3>
      <div id="saved-list"></div>`;

    const widthInput = this.$('#width') as HTMLInputElement;
    const sideInput = this.$('#side') as HTMLSelectElement;
    const rerun = () => {
      const pick = workbench.slopePick;
      if (!pick) return;
      workbench.previewUnfold(pick.lineId, pick.startIdx, pick.endIdx, {
        width: Math.max(1, Number(widthInput.value) || 40),
        crossStep: Math.max(1, f.settings.gridSpacing),
        side: sideInput.value as 'left' | 'right'
      });
    };
    widthInput.addEventListener('change', rerun);
    sideInput.addEventListener('change', rerun);

    if (preview) {
      this.drawPreview();
    } else {
      this.$('#preview').innerHTML = `<div class="hint" style="padding:8px 0">尚未选段</div>`;
    }
    this.drawSaved();
  }

  private drawPreview(): void {
    const u = workbench.unfoldPreview!;
    const host = this.$('#preview');
    host.innerHTML = `
      <canvas id="cv" width="360" height="150"></canvas>
      <div class="kv">
        <div><span>展开面积</span><b>${fmtNum(u.area)} m²</b></div>
        <div><span>平均坡长</span><b>${fmtNum(u.slopeLength)} m</b></div>
        <div><span>条带宽</span><b>${fmtNum(u.width)} m</b></div>
        <div><span>沿堤桩长</span><b>${fmtNum(u.bounds.maxX)} m</b></div>
      </div>
      <div class="row" style="display:flex;gap:8px">
        <button class="primary" id="commit" style="flex:1">保存为展开成果</button>
        <button id="dl">下载成果图PNG</button>
      </div>`;
    this.drawStrip(this.$('#cv') as HTMLCanvasElement);
    this.$('#commit').addEventListener('click', async () => {
      await workbench.commitUnfold();
      alert('展开成果已保存到当前项目');
    });
    this.$('#dl').addEventListener('click', () => {
      const cv = this.$('#cv') as HTMLCanvasElement;
      const a = document.createElement('a');
      a.href = cv.toDataURL('image/png');
      a.download = `${u.lineName}_展开成果_${fmtNum(u.area, 1)}m2.png`;
      a.click();
    });
  }

  /** 展开平面成果图：条带轮廓 + 桩号 + 高程注记 */
  private drawStrip(cv: HTMLCanvasElement): void {
    const u = workbench.unfoldPreview!;
    const ctx = cv.getContext('2d')!;
    const W = cv.width;
    const H = cv.height;
    const padL = 38;
    const padR = 14;
    const padT = 18;
    const padB = 26;
    const pw = W - padL - padR;
    const ph = H - padT - padB;
    const sx = pw / Math.max(u.bounds.maxX, 1);
    const sy = ph / Math.max(u.bounds.maxY, 1);
    const X = (x: number) => padL + x * sx;
    const Y = (y: number) => padR + y * sy + 4;

    ctx.fillStyle = '#8fa3bc';
    ctx.font = '10px monospace';
    ctx.strokeStyle = '#24324a';
    for (let g = 0; g <= 4; g++) {
      const x = padL + (pw * g) / 4;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, H - padB);
      ctx.stroke();
      ctx.fillText(`${Math.round((u.bounds.maxX * g) / 4)}m`, x - 12, H - 8);
    }

    // 条带填充
    ctx.beginPath();
    u.outline.top.forEach((p, i) => (i === 0 ? ctx.moveTo(X(p.x), Y(p.y)) : ctx.lineTo(X(p.x), Y(p.y))));
    [...u.outline.bottom].reverse().forEach((p) => ctx.lineTo(X(p.x), Y(p.y)));
    ctx.closePath();
    ctx.fillStyle = 'rgba(251,146,60,0.18)';
    ctx.fill();
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // 堤顶线与坡脚线标注
    ctx.strokeStyle = '#fbbf24';
    ctx.beginPath();
    u.outline.top.forEach((p, i) => (i === 0 ? ctx.moveTo(X(p.x), Y(p.y)) : ctx.lineTo(X(p.x), Y(p.y))));
    ctx.stroke();

    // 高程注记（每隔若干站点）
    ctx.fillStyle = '#7dd3fc';
    const step = Math.max(1, Math.floor(u.stations.length / 6));
    u.stations.forEach((st, i) => {
      if (i % step !== 0) return;
      ctx.fillText(`${st.z.toFixed(1)}`, X(st.s) - 10, padT + 10);
    });
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('堤顶线 →', padL, padT - 5);
    ctx.fillStyle = '#fb923c';
    ctx.fillText(`坡脚 ← 坡长 ${fmtNum(u.slopeLength)}m`, padL, H - padB + 16);
    ctx.fillStyle = '#8fa3bc';
    ctx.fillText(`展开面积 ${fmtNum(u.area, 2)} m²`, padL, 12);
  }

  private drawSaved(): void {
    const list = this.$('#saved-list');
    const items = workbench.file!.unfoldResults;
    if (!items.length) {
      list.innerHTML = `<div class="hint">暂无</div>`;
      return;
    }
    list.innerHTML = items
      .map(
        (u, i) => `<div class="saved">
        <div class="t">#${i + 1} ${u.lineName}（桩段 ${u.segStart}–${u.segEnd}）</div>
        <div>面积 ${fmtNum(u.area)} m² ｜ 坡长 ${fmtNum(u.slopeLength)} m ｜ 宽 ${fmtNum(u.width)} m ｜ ${fmtDate(u.createdAt)}</div>
      </div>`
      )
      .join('');
  }
}
