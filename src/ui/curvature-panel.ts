import { BaseComponent, fmtNum } from './base.js';
import { workbench, LINE_NAMES, type LineId } from '../core/state/workbench.js';

export class CurvaturePanel extends BaseComponent {
  private unsub: (() => void) | null = null;
  private canvas: HTMLCanvasElement | null = null;

  mount(): void {
    this.draw();
    this.unsub = workbench.subscribe(() => this.draw());
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  private draw(): void {
    const f = workbench.file;
    this.render(
      `<div class="head">
        <h3>沿线曲率分析</h3>
        <select id="sel" style="width:130px">
          ${(Object.keys(LINE_NAMES) as LineId[]).map((id) => `<option value="${id}" ${workbench.activeLine === id ? 'selected' : ''}>${LINE_NAMES[id]}</option>`).join('')}
        </select>
      </div>
      <canvas id="chart" width="360" height="180"></canvas>
      <div id="info"></div>
      <div id="alerts"></div>`,
      `
      :host { display:flex; flex-direction:column; gap:8px; }
      .head { display:flex; justify-content:space-between; align-items:center; }
      canvas { width:100%; border:1px solid var(--border); border-radius:8px; background:var(--bg-input); }
      .kv { display:grid; grid-template-columns:1fr 1fr; gap:4px 10px; font-size:11px; }
      .kv div { display:flex; justify-content:space-between; background:var(--bg-panel-2);
        border-radius:5px; padding:4px 7px; }
      .kv b { font-family:var(--mono); }
      .alert-item { font-size:10px; padding:5px 8px; border:1px solid var(--alert);
        border-radius:6px; color:var(--warn); margin-top:5px; background:rgba(255,90,78,.08); }
      .okline { color:var(--ok); font-size:11px; padding:6px 0; }
      `
    );
    (this.$('#sel') as HTMLSelectElement).addEventListener('change', (e) => {
      workbench.setActiveLine((e.target as HTMLSelectElement).value as LineId);
    });
    this.canvas = this.$('#chart') as HTMLCanvasElement;
    if (f) this.updateChart();
  }

  private updateChart(): void {
    const id = workbench.activeLine;
    const d = workbench.derivations.get(id);
    const info = this.$('#info');
    const alerts = this.$('#alerts');
    if (!d) {
      info.innerHTML = `<div class="small">控制点不足 2 个，无法生成样条</div>`;
      alerts.innerHTML = '';
      return;
    }

    const finiteRadii = d.radii.filter((r) => Number.isFinite(r));
    const minR = finiteRadii.length ? Math.min(...finiteRadii) : Infinity;
    const maxAbsK = Math.max(...d.curvatures.map(Math.abs));
    const alertSegs: [number, number][] = [];
    let start = -1;
    d.alerts.forEach((a, i) => {
      if (a && start < 0) start = i;
      if ((!a || i === d.alerts.length - 1) && start >= 0) {
        alertSegs.push([start, a ? i : i - 1]);
        start = -1;
      }
    });

    info.innerHTML = `<div class="kv">
      <div><span>线长</span><b>${fmtNum(d.totalLength)} m</b></div>
      <div><span>采样点</span><b>${d.points.length}</b></div>
      <div><span>最大曲率</span><b>${fmtNum(maxAbsK, 5)}/m</b></div>
      <div><span>最小半径</span><b>${fmtNum(minR)} m</b></div>
    </div>`;

    alerts.innerHTML = alertSegs.length
      ? alertSegs
          .map(([a, b]) => {
            let mr = Infinity;
            for (let i = a; i <= b; i++) mr = Math.min(mr, d.radii[i]);
            return `<div class="alert-item">⚠ 突变段 桩号 ${fmtNum(d.arcLengths[a])}–${fmtNum(d.arcLengths[b])} m｜最小半径 ${fmtNum(mr)} m</div>`;
          })
          .join('')
      : `<div class="okline">✓ 全线曲率变化平稳，无突变预警</div>`;

    this.drawChart(d.arcLengths, d.curvatures, d.alerts, d.totalLength);
  }

  /** 双轴示意：曲率柱（含突变红色标记），零线居中 */
  private drawChart(s: number[], k: number[], alerts: boolean[], total: number): void {
    const cv = this.canvas!;
    const ctx = cv.getContext('2d')!;
    const W = cv.width;
    const H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const padL = 42;
    const padR = 10;
    const padT = 14;
    const padB = 24;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;
    const maxK = Math.max(1e-6, ...k.map(Math.abs));
    const zeroY = padT + plotH / 2;

    // 网格与坐标
    ctx.strokeStyle = '#24324a';
    ctx.fillStyle = '#8fa3bc';
    ctx.font = '10px monospace';
    ctx.lineWidth = 1;
    for (let g = 0; g <= 4; g++) {
      const y = padT + (plotH * g) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      const val = maxK * (1 - g / 2);
      ctx.fillText(val.toExponential(1), 2, y + 3);
    }
    // x 轴桩号
    for (let g = 0; g <= 4; g++) {
      const x = padL + (plotW * g) / 4;
      ctx.fillText(`${Math.round((total * g) / 4)}m`, x - 12, H - 6);
    }

    // 曲率折线
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    k.forEach((kk, i) => {
      const x = padL + (s[i] / total) * plotW;
      const y = zeroY - (kk / maxK) * (plotH / 2 - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 突变段红色背景
    ctx.fillStyle = 'rgba(255,90,78,0.28)';
    let segStart = -1;
    for (let i = 0; i <= alerts.length; i++) {
      const a = i < alerts.length && alerts[i];
      if (a && segStart < 0) segStart = i;
      if ((!a || i === alerts.length) && segStart >= 0) {
        const x0 = padL + (s[segStart] / total) * plotW;
        const x1 = padL + (s[Math.max(segStart, i - 1)] / total) * plotW;
        ctx.fillRect(x0, padT, Math.max(2, x1 - x0), plotH);
        segStart = -1;
      }
    }

    // 重绘折线使其位于红色之上
    ctx.strokeStyle = '#7dd3fc';
    ctx.beginPath();
    k.forEach((kk, i) => {
      const x = padL + (s[i] / total) * plotW;
      const y = zeroY - (kk / maxK) * (plotH / 2 - 4);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#8fa3bc';
    ctx.fillText('κ (1/m)', 2, padT - 2);
  }
}
