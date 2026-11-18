import { BaseComponent } from './base.js';
import { projectStore } from '../core/archive/project-store.js';
import { workbench, LINE_NAMES, type LineId } from '../core/state/workbench.js';
import { parseBoundaryText, parseElevationText, parseGeoJson } from '../core/io/importers.js';
import { generateSampleData } from '../core/io/sample-data.js';

export class SidePanel extends BaseComponent {
  private unsub: (() => void) | null = null;
  private tab: 'data' | 'model' | 'offset' | 'archive' = 'data';

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
      `<div class="tabs">
        ${(['data', 'model', 'offset', 'archive'] as const)
          .map((t) => `<button class="tab ${this.tab === t ? 'active' : ''}" data-tab="${t}">${{ data: '数据', model: '建模参数', offset: '管理范围', archive: '版本归档' }[t]}</button>`)
          .join('')}
      </div>
      <div class="body scroll">${f ? this.body() : `<div class="empty">请先新建或打开项目</div>`}</div>`,
      `
      :host { display:flex; flex-direction:column; height:100%; background:var(--bg-panel); }
      .tabs { display:flex; border-bottom:1px solid var(--border); }
      .tab { flex:1; border:none; border-radius:0; background:transparent;
        padding:9px 0; color:var(--fg-dim); border-bottom:2px solid transparent; }
      .tab.active { color:var(--accent); border-bottom-color:var(--accent); background:var(--bg-panel-2); }
      .body { flex:1; padding:12px; overflow-y:auto; }
      .empty { color:var(--fg-dim); text-align:center; padding:40px 0; }
      .sec { border:1px solid var(--border); border-radius:8px; padding:10px; margin-bottom:12px; background:var(--bg-panel-2); }
      .sec h4 { margin:0 0 8px; font-size:12px; color:var(--accent-2); }
      .stat { display:flex; justify-content:space-between; padding:3px 0; font-size:11px; }
      .stat b { font-family:var(--mono); color:var(--fg); }
      .btnrow { display:flex; gap:6px; flex-wrap:wrap; }
      .btnrow button { flex:1; min-width:86px; }
      input[type=number] { width:100%; }
      .hint { color:var(--fg-dim); font-size:10px; margin-top:3px; line-height:1.5; }
      .file-label { display:block; text-align:center; border:1px dashed var(--border); border-radius:6px;
        padding:9px; cursor:pointer; color:var(--fg-dim); font-size:11px; }
      .file-label:hover { border-color:var(--accent); color:var(--accent); }
      input[type=file] { display:none; }
      `
    );
    this.$all('.tab').forEach((t) =>
      t.addEventListener('click', () => {
        this.tab = (t as HTMLElement).dataset.tab as typeof this.tab;
        this.draw();
      })
    );
    if (f) this.bindBody();
  }

  private body(): string {
    const f = workbench.file!;
    if (this.tab === 'data') return this.dataTab();
    if (this.tab === 'model') return this.modelTab();
    if (this.tab === 'offset') return this.offsetTab();
    return this.archiveTab();
  }

  private dataTab(): string {
    const f = workbench.file!;
    return `
      <div class="sec">
        <h4>数据概况</h4>
        <div class="stat"><span>断面高程点</span><b>${f.elevPoints.length}</b></div>
        <div class="stat"><span>河道边界</span><b>${f.boundaries.length} 条</b></div>
        <div class="stat"><span>中心线控制点</span><b>${f.centerControls.length}</b></div>
        <div class="stat"><span>左/右堤顶控制点</span><b>${f.crestLeftControls.length} / ${f.crestRightControls.length}</b></div>
        <div class="stat"><span>展开成果</span><b>${f.unfoldResults.length} 个</b></div>
      </div>
      <div class="sec">
        <h4>断面高程点导入</h4>
        <label class="file-label">选择高程文件（.csv/.txt，每行 x,y,z[,断面号]）
          <input type="file" id="elev-file" accept=".csv,.txt"></label>
        <div class="hint">也支持 GeoJSON（Point/MultiPoint 取高程）</div>
      </div>
      <div class="sec">
        <h4>河道边界导入</h4>
        <label class="file-label">选择边界文件（.csv/.txt，每行 x,y；#closed 标闭合）
          <input type="file" id="boundary-file" accept=".csv,.txt,.geojson,.json"></label>
      </div>
      <div class="sec">
        <h4>演示数据</h4>
        <div class="btnrow"><button id="sample" class="primary">载入示例河道</button></div>
        <div class="hint">一键生成 1.2km 弯曲河道的断面点、边界与三条样条控制点</div>
      </div>`;
  }

  private modelTab(): string {
    const s = workbench.file!.settings;
    return `
      <div class="sec">
        <h4>地形插值（IDW）</h4>
        <div class="field"><label>网格间距 (m)</label><input type="number" id="gridSpacing" value="${s.gridSpacing}" min="1" step="1"></div>
        <div class="field"><label>IDW 幂参数</label><input type="number" id="idwPower" value="${s.idwPower}" min="1" max="6" step="0.5"></div>
        <div class="field"><label>搜索半径 (m)</label><input type="number" id="idwRadius" value="${s.idwRadius}" min="5" step="5"></div>
        <button id="rebuild-terrain" class="primary" style="width:100%">重建地形曲面</button>
      </div>
      <div class="sec">
        <h4>样条与曲率</h4>
        <div class="field"><label>沿线重采样间距 (m)</label><input type="number" id="resampleSpacing" value="${s.resampleSpacing}" min="0.5" step="0.5"></div>
        <div class="field"><label>曲率突变阈值 (1/m²)</label><input type="number" id="curvatureAlert" value="${s.curvatureAlert}" min="0.00001" step="0.0001" style="font-family:var(--mono)"></div>
        <button id="rebuild-lines" style="width:100%">重算样条/曲率</button>
      </div>`;
  }

  private offsetTab(): string {
    const f = workbench.file!;
    return `
      <div class="sec">
        <h4>等距偏移参数</h4>
        <div class="field"><label>偏移距离 (m)</label><input type="number" id="offsetDistance" value="${f.settings.offsetDistance}" min="1" step="1"></div>
        <div class="hint">角部方式在顶部工具栏切换：圆角 / 尖角 / 斜切</div>
      </div>
      <div class="sec">
        <h4>生成管理范围平行线</h4>
        ${(Object.keys(LINE_NAMES) as LineId[])
          .map(
            (id) => `<div class="stat"><span>${LINE_NAMES[id]}</span>
              <span class="btnrow" style="flex:0 0 auto">
                <button data-off="${id}" data-side="left">左偏</button>
                <button data-off="${id}" data-side="right">右偏</button>
                <button data-off="${id}" data-side="both">双侧</button>
              </span></div>`
          )
          .join('')}
        <div style="margin-top:8px"><button id="clear-offset" class="danger" style="width:100%">清空管理范围线（${f.offsetLines.length} 条）</button></div>
      </div>`;
  }

  private archiveTab(): string {
    const f = workbench.file!;
    return `
      <div class="sec">
        <h4>版本加工</h4>
        <div class="field"><label>加工说明</label><input id="version-note" placeholder="如：修正 K0+600 段堤线走向"></div>
        <button id="save-version" class="primary" style="width:100%">保存加工版本并比对历史</button>
        <div class="hint">当前版本 v${f.currentVersion}，历史版本 ${f.versions.length} 个</div>
      </div>
      <div class="sec">
        <h4>成果归档</h4>
        <button id="make-report" class="primary" style="width:100%;margin-bottom:6px">生成报告并归档</button>
        <button id="view-archives" style="width:100%">查看档案库 / 检索</button>
      </div>
      <div class="sec">
        <h4>项目文件</h4>
        <div class="btnrow">
          <button id="export-proj">导出工程JSON</button>
          <button id="import-proj">导入工程</button>
        </div>
      </div>`;
  }

  private bindBody(): void {
    const f = workbench.file!;
    if (this.tab === 'data') {
      this.$('#elev-file').addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
          if (file.name.match(/geojson|json$/i)) {
            const { elev, boundaries } = parseGeoJson(text);
            await projectStore.update((pf) => {
              pf.elevPoints = elev;
              pf.boundaries.push(...boundaries);
            });
          } else {
            const pts = parseElevationText(text);
            await projectStore.update((pf) => (pf.elevPoints = pts));
          }
          workbench.recomputeTerrain();
          workbench.recomputeLines();
          alert('导入成功');
        } catch (err) {
          alert((err as Error).message);
        }
      });
      this.$('#boundary-file').addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const text = await file.text();
        try {
          if (file.name.match(/geojson|json$/i)) {
            const { boundaries } = parseGeoJson(text);
            await projectStore.update((pf) => pf.boundaries.push(...boundaries));
          } else {
            const line = parseBoundaryText(text, file.name.replace(/\.[^.]+$/, ''));
            await projectStore.update((pf) => pf.boundaries.push(line));
          }
          workbench.recomputeTerrain();
        } catch (err) {
          alert((err as Error).message);
        }
      });
      this.$('#sample').addEventListener('click', async () => {
        const s = generateSampleData();
        await projectStore.update((pf) => {
          pf.elevPoints = s.elev;
          pf.boundaries = [s.boundary];
          pf.centerControls = s.center;
          pf.crestLeftControls = s.crestLeft;
          pf.crestRightControls = s.crestRight;
          pf.offsetLines = [];
        });
        workbench.recomputeTerrain();
        workbench.recomputeLines();
      });
    } else if (this.tab === 'model') {
      const num = (id: string) => Number((this.$(id) as HTMLInputElement).value);
      this.$('#rebuild-terrain').addEventListener('click', async () => {
        await projectStore.update((pf) => {
          pf.settings.gridSpacing = num('#gridSpacing');
          pf.settings.idwPower = num('#idwPower');
          pf.settings.idwRadius = num('#idwRadius');
        });
        workbench.recomputeTerrain();
      });
      this.$('#rebuild-lines').addEventListener('click', async () => {
        await projectStore.update((pf) => {
          pf.settings.resampleSpacing = num('#resampleSpacing');
          pf.settings.curvatureAlert = num('#curvatureAlert');
        });
        workbench.recomputeLines();
      });
    } else if (this.tab === 'offset') {
      (this.$('#offsetDistance') as HTMLInputElement).addEventListener('change', async (e) => {
        const v = Number((e.target as HTMLInputElement).value);
        await projectStore.update((pf) => (pf.settings.offsetDistance = Math.max(1, v)));
      });
      this.$all('[data-off]').forEach((b) =>
        b.addEventListener('click', async () => {
          try {
            await workbench.generateOffset(
              (b as HTMLElement).dataset.off as LineId,
              (b as HTMLElement).dataset.side as 'left' | 'right' | 'both'
            );
          } catch (err) {
            alert((err as Error).message);
          }
        })
      );
      this.$('#clear-offset').addEventListener('click', () => workbench.clearOffsets());
    } else {
      this.$('#save-version').addEventListener('click', () => {
        const d = document.createElement('version-dialog') as unknown as { note: string };
        d.note = (this.$('#version-note') as HTMLInputElement).value || '常规加工';
        document.body.appendChild(d as unknown as Node);
      });
      this.$('#make-report').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('make-report', { bubbles: true, composed: true }));
      });
      this.$('#view-archives').addEventListener('click', () => {
        document.body.appendChild(document.createElement('archive-dialog'));
      });
      this.$('#export-proj').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('export-project', { bubbles: true, composed: true }));
      });
      this.$('#import-proj').addEventListener('click', () => {
        const inp = document.createElement('input');
        inp.type = 'file';
        inp.accept = '.json';
        inp.onchange = async () => {
          const file = inp.files?.[0];
          if (!file) return;
          const data = JSON.parse(await file.text());
          await projectStore.update(() => Object.assign(projectStore.currentProject!, structuredClone(data)));
          workbench.recomputeTerrain();
          workbench.recomputeLines();
        };
        inp.click();
      });
    }
  }
}
