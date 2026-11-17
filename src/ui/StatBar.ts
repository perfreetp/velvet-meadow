// 状态栏：实时体素数 / 三角面数 / 导出 OBJ、glTF(GLB)、配色表、交付 ZIP
import { GvsElement } from './GvsElement';
import { editorState } from '../state/EditorState';
import { buildMesh } from '../core/Mesher';
import { exportOBJ, exportGLB, exportColorTable, buildDeliveryZip } from '../core/Exporters';
import { bus, EVT } from './bus';

export class StatBar extends GvsElement {
  private voxels = 0;
  private triangles = 0;
  private raf = 0;

  protected styles(): string {
    return `
      :host { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
      .stat { background: var(--panel-2); border: 1px solid var(--border); border-radius: 6px; padding: 4px 12px; font-variant-numeric: tabular-nums; }
      .stat b { font-size: 15px; color: var(--primary); }
      .spacer { flex: 1; }
      .dirty { color: var(--warn); font-size: 12px; }
    `;
  }

  protected template(): Node[] {
    const host = this.h('div');
    host.append(
      this.h('span', { class: 'stat' }, '体素数 '),
      this.h('span', { class: 'stat' }, '三角面数 '),
      this.h('span', { class: 'dirty' })
    );
    const spacer = this.h('span', { class: 'spacer' });
    host.append(spacer);
    host.append(
      this.h('button', { onClick: () => this.save() }, '保存项目'),
      this.h('button', { onClick: () => this.downloadOBJ() }, '导出 OBJ'),
      this.h('button', { onClick: () => this.downloadGLB() }, '导出 glTF'),
      this.h('button', { onClick: () => this.downloadCSV() }, '配色表 CSV'),
      this.h('button', { class: 'primary', onClick: () => this.delivery() }, '导出交付包')
    );
    return [host];
  }

  protected afterRender(): void {
    editorState.subscribe(() => this.schedule());
    this.update();
  }

  private schedule(): void {
    // rAF 合帧：连续笔刷编辑时每帧最多算一次，既实时又不阻塞
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.update());
  }

  private update(): void {
    const g = editorState.grid;
    this.voxels = g.countVoxels();
    this.triangles = buildMesh(g).triangles;
    const spans = this.$all('.stat');
    spans[0].innerHTML = `体素数 <b>${this.voxels.toLocaleString()}</b>`;
    spans[1].innerHTML = `三角面数 <b>${this.triangles.toLocaleString()}</b>`;
    const dirty = this.$('.dirty') as HTMLElement;
    dirty.textContent = editorState.isDirty ? '● 未保存' : '○ 已保存';
  }

  private save(): void {
    editorState.persist();
    this.update();
    bus.emit(EVT.TOAST, { type: 'ok', text: '项目已保存到本地项目库' });
  }

  private currentMesh() {
    return buildMesh(editorState.grid);
  }

  private download(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  private baseName(): string {
    return editorState.project.id + '_' + editorState.project.name.replace(/[\\/:*?"<>|\s]+/g, '_');
  }

  downloadOBJ(): void {
    const mesh = this.currentMesh();
    const { obj, mtl } = exportOBJ(mesh, editorState.project.materials, this.baseName());
    this.download(mtl, this.baseName() + '.mtl');
    setTimeout(() => this.download(obj, this.baseName() + '.obj'), 300);
    bus.emit(EVT.TOAST, { type: 'ok', text: 'OBJ + MTL 已导出' });
  }

  downloadGLB(): void {
    const mesh = this.currentMesh();
    const blob = exportGLB(mesh, editorState.project.materials, this.baseName());
    this.download(blob, this.baseName() + '.glb');
    bus.emit(EVT.TOAST, { type: 'ok', text: 'glTF 2.0 二进制(GLB) 已导出' });
  }

  downloadCSV(): void {
    const blob = exportColorTable(editorState.project.materials, editorState.grid);
    this.download(blob, this.baseName() + '_配色表.csv');
  }

  async delivery(): Promise<void> {
    editorState.persist();
    const mesh = this.currentMesh();
    const { obj, mtl } = exportOBJ(mesh, editorState.project.materials, this.baseName());
    const glb = exportGLB(mesh, editorState.project.materials, this.baseName());
    const csv = exportColorTable(editorState.project.materials, editorState.grid);
    const projectJson = new Blob([JSON.stringify(editorState.project, null, 2)], { type: 'application/json' });
    const readme = new Blob(
      [
        `交付说明\n项目：${editorState.project.name}\n编号：${editorState.project.id}\n网格：${editorState.project.nx}×${editorState.project.ny}×${editorState.project.nz}，单格 ${editorState.project.cell}m\n体素数：${this.voxels}\n三角面数：${this.triangles}\n生成时间：${new Date().toLocaleString('zh-CN')}\n文件：OBJ+MTL、glTF(GLB)、配色表CSV、项目JSON`
      ],
      { type: 'text/plain;charset=utf-8' }
    );
    const zip = await buildDeliveryZip([
      { name: this.baseName() + '.obj', blob: obj },
      { name: this.baseName() + '.mtl', blob: mtl },
      { name: this.baseName() + '.glb', blob: glb },
      { name: this.baseName() + '_配色表.csv', blob: csv },
      { name: this.baseName() + '_项目数据.json', blob: projectJson },
      { name: '交付说明.txt', blob: readme }
    ]);
    this.download(zip, this.baseName() + '_交付包.zip');
    bus.emit(EVT.TOAST, { type: 'ok', text: '交付包 ZIP 已生成（OBJ/glTF/配色表/项目数据/说明）' });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'stat-bar': StatBar;
  }
}
