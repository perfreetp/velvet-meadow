// 参数面板:生成参数、级别透明度、编辑/锁定、底图导入、归档

import { app } from '../state.js';
import { GenParams, LEVEL_NAMES } from '../types.js';

interface SliderDef {
  key: keyof GenParams;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
}

const SLIDERS: SliderDef[] = [
  { key: 'mainDirection', label: '主沟走向', min: -90, max: 90, step: 1, unit: '°' },
  { key: 'bifurcationAngle', label: '分叉角度', min: 15, max: 75, step: 1, unit: '°' },
  { key: 'branchDensity', label: '支沟密度', min: 0, max: 8, step: 0.1, unit: ' 条/km' },
  { key: 'capillaryDensity', label: '毛细沟密度', min: 0, max: 10, step: 0.1, unit: ' 条/km' },
  { key: 'meanderAmp', label: '曲流幅度', min: 0, max: 60, step: 1, unit: ' m' },
];

export class ControlPanel extends HTMLElement {
  private root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    app.addEventListener('params-changed', () => this.syncParams());
    app.addEventListener('network-changed', () => this.syncStats());
    app.addEventListener('selection-changed', () => this.syncSelection());
  }

  private render(): void {
    this.root.innerHTML = `
      <style>
        :host { display:block; font: 13px/1.5 system-ui, sans-serif; color:#222; }
        h3 { margin: 14px 0 6px; font-size: 13px; color:#0b5; border-bottom:1px solid #ddd; padding-bottom:3px; }
        h3:first-child { margin-top: 0; }
        .row { display:flex; align-items:center; gap:6px; margin:4px 0; }
        .row label { flex: 0 0 62px; color:#555; }
        .row input[type=range] { flex:1; min-width:0; }
        .row .val { flex:0 0 64px; text-align:right; font-family:monospace; font-size:12px; }
        .row input[type=number], .row input[type=text] { flex:1; min-width:0; padding:3px 6px; border:1px solid #bbb; border-radius:4px; }
        button { padding:5px 10px; border:1px solid #0a7; background:#0a7; color:#fff; border-radius:4px; cursor:pointer; font-size:13px; }
        button.ghost { background:#fff; color:#0a7; }
        button.warn { background:#c50; border-color:#c50; }
        button:disabled { opacity:.4; cursor:default; }
        .btns { display:flex; flex-wrap:wrap; gap:6px; margin:6px 0; }
        table { border-collapse:collapse; width:100%; font-size:12px; }
        td, th { border:1px solid #ddd; padding:2px 6px; text-align:right; }
        th { background:#f2f5f2; }
        .sel { font-size:12px; color:#555; background:#f6f6f2; border:1px dashed #bbb; border-radius:4px; padding:4px 6px; margin:4px 0; }
        .hint { font-size:11px; color:#888; }
      </style>

      <h3>生成参数</h3>
      <div class="row"><label>随机种子</label>
        <input type="number" id="seed" step="1">
        <button class="ghost" id="dice" title="随机换一个种子">🎲</button>
      </div>
      <div id="sliders"></div>
      <div class="btns">
        <button id="gen">生成 / 整体重生成</button>
      </div>
      <div class="hint">同参数+同种子结果完全一致;锁定段在重生成时保持形态并自动接回新网络。</div>

      <h3>级别透明度</h3>
      <div id="opacities"></div>

      <h3>手动编辑 / 锁定</h3>
      <div class="btns">
        <button class="ghost" id="editToggle">进入编辑模式</button>
        <button class="ghost" id="lockBtn" disabled>锁定选中</button>
        <button class="ghost" id="unlockBtn" disabled>解锁选中</button>
      </div>
      <div class="sel" id="selInfo">未选中沟段(编辑模式下点击沟道选取,拖拽顶点修形,双击插入顶点)</div>

      <h3>航拍底图</h3>
      <div class="btns">
        <button class="ghost" id="importMap">导入底图…</button>
        <button class="ghost" id="clearMap">清除</button>
        <input type="file" id="mapFile" accept="image/*" hidden>
      </div>
      <div class="hint" id="mapName">未导入</div>

      <h3>统计</h3>
      <div id="stats"></div>

      <h3>归档</h3>
      <div class="row"><label>区域</label><input type="text" id="region" placeholder="如:苏北辐射沙洲"></div>
      <div class="row"><label>档案名</label><input type="text" id="arcName" placeholder="如:2026 春季断面"></div>
      <div class="btns"><button id="archiveBtn">归档当前网络</button></div>
      <div class="hint" id="archiveMsg"></div>
    `;

    // 参数滑条
    const sliders = this.root.querySelector('#sliders')!;
    for (const def of SLIDERS) {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<label>${def.label}</label>
        <input type="range" min="${def.min}" max="${def.max}" step="${def.step}" data-key="${def.key}">
        <span class="val" data-val="${def.key}"></span>`;
      sliders.appendChild(row);
      row.querySelector('input')!.addEventListener('input', (e) => {
        const v = parseFloat((e.target as HTMLInputElement).value);
        app.setParams({ [def.key]: v } as Partial<GenParams>);
      });
    }

    // 透明度滑条
    const ops = this.root.querySelector('#opacities')!;
    LEVEL_NAMES.forEach((name, i) => {
      const row = document.createElement('div');
      row.className = 'row';
      row.innerHTML = `<label>${name}</label>
        <input type="range" min="0" max="1" step="0.05" value="1" data-op="${i}">
        <span class="val" data-opval="${i}">1.00</span>`;
      ops.appendChild(row);
      row.querySelector('input')!.addEventListener('input', (e) => {
        const v = parseFloat((e.target as HTMLInputElement).value);
        const o = [...app.opacities] as [number, number, number];
        o[i] = v;
        app.setOpacities(o);
        (ops.querySelector(`[data-opval="${i}"]`) as HTMLElement).textContent = v.toFixed(2);
      });
    });

    // 种子
    const seedInput = this.root.querySelector<HTMLInputElement>('#seed')!;
    seedInput.addEventListener('change', () => {
      const v = Math.floor(parseFloat(seedInput.value));
      if (Number.isFinite(v)) app.setParams({ seed: v });
    });
    this.root.querySelector('#dice')!.addEventListener('click', () => {
      app.setParams({ seed: Math.floor(Math.random() * 1e9) });
    });

    this.root.querySelector('#gen')!.addEventListener('click', () => app.generate());

    // 编辑模式
    this.root.querySelector('#editToggle')!.addEventListener('click', () => {
      app.editMode = !app.editMode;
      app.dispatchEvent(new CustomEvent('editmode-changed'));
      this.syncEditBtn();
    });

    this.root.querySelector('#lockBtn')!.addEventListener('click', () => {
      if (app.selectedId) app.setLocked(app.selectedId, true);
      this.syncSelection();
    });
    this.root.querySelector('#unlockBtn')!.addEventListener('click', () => {
      if (app.selectedId) app.setLocked(app.selectedId, false);
      this.syncSelection();
    });

    // 底图
    const file = this.root.querySelector<HTMLInputElement>('#mapFile')!;
    this.root.querySelector('#importMap')!.addEventListener('click', () => file.click());
    file.addEventListener('change', () => {
      const f = file.files?.[0];
      if (f) {
        void app.setBasemap(f).then(() => this.syncBasemap());
      }
    });
    this.root.querySelector('#clearMap')!.addEventListener('click', () => {
      app.clearBasemap();
      this.syncBasemap();
    });

    // 归档
    this.root.querySelector('#archiveBtn')!.addEventListener('click', () => {
      const region = this.root.querySelector<HTMLInputElement>('#region')!.value.trim();
      const name = this.root.querySelector<HTMLInputElement>('#arcName')!.value.trim();
      const msg = this.root.querySelector('#archiveMsg')!;
      if (!region) {
        msg.textContent = '请填写区域后再归档。';
        return;
      }
      void app
        .archiveCurrent(region, name)
        .then((id) => {
          msg.textContent = `已归档:${id}`;
        })
        .catch((err: Error) => {
          msg.textContent = `归档失败:${err.message}`;
        });
    });

    this.syncParams();
    this.syncStats();
    this.syncSelection();
  }

  private syncParams(): void {
    const p = app.params;
    (this.root.querySelector('#seed') as HTMLInputElement).value = String(p.seed);
    for (const def of SLIDERS) {
      const input = this.root.querySelector<HTMLInputElement>(`input[data-key="${def.key}"]`);
      const val = this.root.querySelector(`[data-val="${def.key}"]`);
      if (input) input.value = String(p[def.key]);
      if (val) val.textContent = `${p[def.key]}${def.unit}`;
    }
  }

  private syncStats(): void {
    const el = this.root.querySelector('#stats');
    if (!el) return;
    const n = app.network;
    if (!n) {
      el.innerHTML = '<div class="hint">尚未生成</div>';
      return;
    }
    const s = n.stats;
    const rows = LEVEL_NAMES.map(
      (name, i) =>
        `<tr><td>${name}</td><td>${s.counts[i]}</td><td>${(s.lengths[i] / 1000).toFixed(2)}</td></tr>`,
    ).join('');
    const locked = n.segments.filter((x) => x.locked).length;
    el.innerHTML = `<table>
      <tr><th>级别</th><th>条数</th><th>总长(km)</th></tr>${rows}
      <tr><td>合计</td><td>${s.counts[0] + s.counts[1] + s.counts[2]}</td><td>${(s.totalLength / 1000).toFixed(2)}</td></tr>
      </table>
      <div class="hint">交汇 ${s.junctions} 处 · 密度 ${s.density.toFixed(2)} km/km² · 锁定 ${locked} 段</div>`;
  }

  private syncSelection(): void {
    const info = this.root.querySelector('#selInfo');
    const lockBtn = this.root.querySelector<HTMLButtonElement>('#lockBtn');
    const unlockBtn = this.root.querySelector<HTMLButtonElement>('#unlockBtn');
    if (!info || !lockBtn || !unlockBtn) return;
    const sel = app.selected;
    if (!sel) {
      info.textContent = '未选中沟段(编辑模式下点击沟道选取,拖拽顶点修形,双击插入顶点)';
      lockBtn.disabled = true;
      unlockBtn.disabled = true;
      return;
    }
    info.textContent = `选中:${sel.id} · ${LEVEL_NAMES[sel.level]} · 长 ${sel.length.toFixed(0)} m · ${
      sel.locked ? '已锁定' : '未锁定'
    }${sel.custom ? ' · 手动修编' : ''}`;
    lockBtn.disabled = sel.locked;
    unlockBtn.disabled = !sel.locked;
  }

  private syncEditBtn(): void {
    const btn = this.root.querySelector<HTMLButtonElement>('#editToggle');
    if (btn) btn.textContent = app.editMode ? '退出编辑模式' : '进入编辑模式';
  }

  private syncBasemap(): void {
    const el = this.root.querySelector('#mapName');
    if (el) el.textContent = app.basemap ? `已导入:${app.basemap.name}` : '未导入';
  }
}

customElements.define('tcn-controls', ControlPanel);
