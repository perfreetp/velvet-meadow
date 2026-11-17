// 编辑器状态总线：当前项目、网格、设置的集中管理与变更通知
import type { Borehole, EditorSettings, Material, ProjectData, SectionLine } from '../types';
import { VoxelGrid, brushCoords, type VoxelCoord } from '../core/VoxelGrid';
import { editWithMirror } from '../core/Mirror';
import { projectStore } from './ProjectStore';

type Listener = (reason: string) => void;

export class EditorState {
  project!: ProjectData;
  grid!: VoxelGrid;
  settings: EditorSettings = {
    tool: 'single',
    mode: 'add',
    brushMaterialId: 1,
    brushSize: 1,
    currentZ: 0,
    mirrorX: false,
    mirrorY: false,
    sliceAxis: 'x',
    sliceIndex: 0
  };
  /** 三维视图是否按切片位置裁剪 */
  sliceCrop = false;
  /** 剪贴板（内存） */
  clipboard: { sx: number; sy: number; sz: number; cells: { x: number; y: number; z: number; v: number }[] } | null = null;

  private undoStack: Uint8Array[] = [];
  private redoStack: Uint8Array[] = [];
  private readonly MAX_UNDO = 60;

  private listeners = new Set<Listener>();
  private dirty = false;

  /** 在一次成组编辑前压入快照 */
  pushUndo(): void {
    this.undoStack.push(this.grid.data.slice());
    if (this.undoStack.length > this.MAX_UNDO) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  undo(): void {
    const snap = this.undoStack.pop();
    if (!snap) return;
    this.redoStack.push(this.grid.data.slice());
    this.grid.data = snap;
    this.emit('undo');
  }

  redo(): void {
    const snap = this.redoStack.pop();
    if (!snap) return;
    this.undoStack.push(this.grid.data.slice());
    this.grid.data = snap;
    this.emit('redo');
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  load(project: ProjectData): void {
    this.project = project;
    this.grid = VoxelGrid.fromBase64(project.voxelsB64, project.nx, project.ny, project.nz, project.cell);
    this.settings.currentZ = 0;
    this.settings.sliceIndex = Math.floor(project.nx / 2);
    this.dirty = false;
    this.emit('load');
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(reason: string): void {
    this.dirty = true;
    for (const fn of this.listeners) fn(reason);
  }

  get isDirty(): boolean {
    return this.dirty;
  }

  markSaved(): void {
    this.dirty = false;
  }

  persist(): void {
    this.project.voxelsB64 = this.grid.toBase64();
    projectStore.save(this.project);
    this.markSaved();
  }

  // ---- 材质 / 钻孔 / 剖面线维护 ----
  updateMaterials(materials: Material[]): void {
    this.project.materials = materials;
    this.emit('materials');
  }

  upsertBorehole(bh: Borehole): void {
    const i = this.project.boreholes.findIndex((b) => b.id === bh.id);
    if (i >= 0) this.project.boreholes[i] = bh;
    else this.project.boreholes.push(bh);
    this.emit('boreholes');
  }

  removeBorehole(id: string): void {
    this.project.boreholes = this.project.boreholes.filter((b) => b.id !== id);
    this.emit('boreholes');
  }

  upsertSection(s: SectionLine): void {
    const i = this.project.sections.findIndex((x) => x.id === s.id);
    if (i >= 0) this.project.sections[i] = s;
    else this.project.sections.push(s);
    this.emit('sections');
  }

  removeSection(id: string): void {
    this.project.sections = this.project.sections.filter((s) => s.id !== id);
    this.emit('sections');
  }

  updateSettings(patch: Partial<EditorSettings>): void {
    Object.assign(this.settings, patch);
    this.emit('settings');
  }

  /** 俯视图笔刷：对列上当前 z 层（rect/sphere 则按笔刷半径的三维范围）编辑 */
  paintColumn(x: number, y: number): void {
    const s = this.settings;
    const center: VoxelCoord = { x, y, z: s.currentZ };
    const tool = s.tool === 'rect' || s.tool === 'sphere' ? s.tool : 'single';
    const coords = tool === 'single' ? [center] : brushCoords(tool, center, s.brushSize);
    const value = s.mode === 'erase' ? 0 : s.brushMaterialId;
    editWithMirror(this.grid, coords, value, s.mirrorX, s.mirrorY);
    this.emit('edit');
  }
}

export const editorState = new EditorState();
