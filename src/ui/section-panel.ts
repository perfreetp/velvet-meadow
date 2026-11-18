import { BaseComponent, fmtNum } from './base.js';
import { workbench } from '../core/state/workbench.js';

export class SectionPanel extends BaseComponent {
  private unsub: (() => void) | null = null;

  mount(): void {
    this.draw();
    this.unsub = workbench.subscribe(() => this.draw());
  }

  disconnectedCallback(): void {
    this.unsub?.();
  }

  private draw(): void {
    const sec = workbench.section;
    this.render(
      `<h3>任意横断面</h3>
      <div id="content"></div>`,
      `
      canvas { width:100%; border:1px solid var(--border); border-radius:8px; background:var(--bg-input); }
      .kv { display:grid; grid-template-columns:1fr 1fr; gap:4px 10px; font-size:11px; margin:8px 0; }
      .kv div { display:flex; justify-content:space-between; background:var(--bg-panel-2);
        border-radius:5px; padding:4px 7px; }
      .kv b { font-family:var(--mono); }
      .hint { color:var(--fg-dim); font-size:10px; line-height:1.6; }
      `
    );
    const host = this.$('#content');
    if (!sec || sec.samples.length < 2) {
      host.innerHTML = `<div class="hint">选择顶部「横断面」工具，在场景中点击两点拉设任意断面；<br>断面曲线按地形实测高程绘制。</div>`;
      return;
    }
    const zs = sec.samples.map((p) => p.z);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);
    const maxD = sec.samples[sec.samples.length - 1].distance;
    host.innerHTML = `
      <canvas id="cv" width="360" height="170"></canvas>
      <div class="kv">
        <div><span>断面宽</span><b>${fmtNum(maxD)} m</b></div>
        <div><span>采样数</span><b>${sec.samples.length}</b></div>
        <div><span>最低高程</span><b>${fmtNum(minZ, 3)} m</b></div>
        <div><span>最高高程</span><b>${fmtNum(maxZ, 3)} m</b></div>
        <div><span>高差</span><b>${fmtNum(maxZ - minZ, 3)} m</b></div>
        <div><span>起点坐标</span><b>${fmtNum(sec.a.x, 1)}, ${fmtNum(sec.a.y, 1)}</b></div>
      </div>`;
    this.drawProfile(this.$('#cv') as HTMLCanvasElement, sec.samples, minZ, maxZ);
  }

  private drawProfile(cv: HTMLCanvasElement, samples: { distance: number; z: number }[], minZ: number, maxZ: number): void {
    const ctx = cv.getContext('2d')!;
    const W = cv.width;
    const H = cv.height;
    const padL = 44;
    const padR = 10;
    const padT = 12;
    const padB = 24;
    const pw = W - padL - padR;
    const ph = H - padT - padB;
    const maxD = samples[samples.length - 1].distance;
    const zRange = Math.max(maxZ - minZ, 0.1);
    const X = (d: number) => padL + (d / maxD) * pw;
    const Y = (z: number) => padT + (1 - (z - minZ) / zRange) * ph;

    ctx.strokeStyle = '#24324a';
    ctx.fillStyle = '#8fa3bc';
    ctx.font = '10px monospace';
    for (let g = 0; g <= 4; g++) {
      const y = padT + (ph * g) / 4;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(W - padR, y);
      ctx.stroke();
      ctx.fillText((maxZ - (zRange * g) / 4).toFixed(1), 2, y + 3);
      const x = padL + (pw * g) / 4;
      ctx.fillText(`${Math.round((maxD * g) / 4)}m`, x - 12, H - 6);
    }

    // 填充与曲线
    ctx.beginPath();
    samples.forEach((p, i) => {
      const x = X(p.distance);
      const y = Y(p.z);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.lineTo(X(maxD), padT + ph);
    ctx.lineTo(padL, padT + ph);
    ctx.closePath();
    ctx.fillStyle = 'rgba(244,114,182,0.15)';
    ctx.fill();
  }
}
