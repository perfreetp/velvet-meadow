import type { Doc, Part, Contour, Hole, Segment, Vec, Board } from '../geometry/types';
import { uid } from '../geometry/types';
import { History } from './history';
import { translateContour, cloneContour, moveAnchor, insertAnchor, deleteAnchor, hitAnchor, hitSegment } from '../geometry/contour';
import { booleanOp, unionAll, type BoolOp } from '../geometry/boolean';
import { checkDoc, type Finding, type BatchReport } from '../geometry/checks';
import { duplicateHolesArray, pushNeighbors, type ArrayParams } from './arrange';
import { exportDocSVG, parseSVGPaths, contoursToPart } from '../geometry/svg';
import { createDoc, defaultBoard } from './factory';

export type Tool = 'select' | 'line' | 'arc' | 'freehand' | 'add-anchor' | 'delete-anchor';

export interface AnchorRef {
  partId: string;
  contourId: string;
  anchor: number;
}
export type Selection =
  | { kind: 'part'; id: string }
  | { kind: 'contour'; id: string; partId: string }
  | { kind: 'anchor'; ref: AnchorRef }
  | { kind: 'holes'; partId: string; holeIds: string[] };

class EditorStore {
  doc = $state<Doc>(createDoc());
  tool = $state<Tool>('select');
  selection = $state<Selection | null>(null);
  selectedHoleIds = $state<string[]>([]);
  history = new History();
  historyTick = $state(0);
  report = $state<BatchReport | null>(null);
  dirty = $state(false);

  constructor() {
    const [restored, hist] = History.restore();
    if (restored && restored.parts) {
      this.doc = restored;
      this.history.hydrate(hist);
    }
    this.history.subscribe(() => (this.historyTick++));
  }

  get activePart(): Part | undefined {
    return this.doc.parts.find(p => p.id === this.doc.activePartId);
  }

  findPart(id: string): Part | undefined { return this.doc.parts.find(p => p.id === id); }
  findContour(partId: string, cid: string): Contour | undefined {
    return this.findPart(partId)?.contours.find(c => c.id === cid);
  }

  /* ---------------- 历史 ---------------- */
  /**
   * 在一次变更前调用:把当前状态快照压入撤销栈。
   * 注意:只快照、不替换 this.doc —— history.push 内部已深拷贝,
   * 后续对 this.doc 的就地修改保持有效,撤销时再恢复快照。
   */
  commit(): void {
    this.history.push(this.doc);
    this.dirty = true;
    this.scheduleSave();
  }
  undo(): void {
    this.doc = this.history.undo(this.doc);
    this.selection = null;
    this.selectedHoleIds = [];
    this.history.save(this.doc);
  }
  redo(): void {
    this.doc = this.history.redo(this.doc);
    this.selection = null;
    this.selectedHoleIds = [];
    this.history.save(this.doc);
  }

  private saveQueued = false;
  /** 微任务合并落盘:同一同步块内的多次修改只写一次,且写入的是最终态 */
  private scheduleSave(): void {
    if (this.saveQueued) return;
    this.saveQueued = true;
    queueMicrotask(() => {
      this.saveQueued = false;
      this.history.save(this.doc);
    });
  }

  /* ---------------- 持久化 ---------------- */
  /** 拖拽/绘制结束后把当前内存态落盘(不入撤销栈) */
  save(): void {
    this.history.save(this.doc);
  }

  /* ---------------- 板/零件 ---------------- */
  updateBoard(patch: Partial<Board>): void {
    this.commit();
    Object.assign(this.doc.board, patch);
  }

  addPart(name?: string): Part {
    this.commit();
    const p: Part = {
      id: uid('p'),
      name: name ?? `板件 ${this.doc.parts.length + 1}`,
      x: 60, y: 60,
      contours: [], holes: []
    };
    this.doc.parts.push(p);
    this.doc.activePartId = p.id;
    return p;
  }

  removePart(id: string): void {
    if (this.doc.parts.length <= 1) return;
    this.commit();
    this.doc.parts = this.doc.parts.filter(p => p.id !== id);
    if (this.doc.activePartId === id) this.doc.activePartId = this.doc.parts[0].id;
    this.selection = null;
  }

  setActivePart(id: string): void { this.doc.activePartId = id; }

  movePart(id: string, nx: number, ny: number, dx: number, dy: number): void {
    const p = this.findPart(id);
    if (!p) return;
    p.x = nx; p.y = ny;
    pushNeighbors(this.doc, id, dx, dy);
  }

  /* ---------------- 轮廓编辑 ---------------- */
  addContour(partId: string, c: Contour): void {
    this.commit();
    this.findPart(partId)?.contours.push(c);
  }

  removeContour(partId: string, cid: string): void {
    this.commit();
    const p = this.findPart(partId);
    if (p) p.contours = p.contours.filter(c => c.id !== cid);
    this.selection = null;
  }

  closeContour(partId: string, cid: string): void {
    const c = this.findContour(partId, cid);
    if (!c || c.closed) return;
    this.commit();
    c.closed = true;
  }

  dragAnchor(ref: AnchorRef, to: Vec): void {
    const c = this.findContour(ref.partId, ref.contourId);
    if (c) moveAnchor(c, ref.anchor, to);
  }

  insertAnchorAt(partId: string, cid: string, worldPoint: Vec, tol: number): boolean {
    const c = this.findContour(partId, cid);
    if (!c) return false;
    const hit = hitSegment(c, worldPoint, tol);
    if (!hit) return false;
    this.commit();
    insertAnchor(c, hit.index, hit.t);
    this.history.save(this.doc);
    return true;
  }

  deleteAnchorAt(partId: string, cid: string, worldPoint: Vec, tol: number): boolean {
    const c = this.findContour(partId, cid);
    if (!c) return false;
    const idx = hitAnchor(c, worldPoint, tol);
    if (idx < 0) return false;
    this.commit();
    deleteAnchor(c, idx);
    this.history.save(this.doc);
    return true;
  }

  /** 对同一零件内选中的两个闭合轮廓做布尔运算 */
  booleanTwo(partId: string, cidA: string, cidB: string, op: BoolOp): boolean {
    const p = this.findPart(partId);
    if (!p) return false;
    const a = p.contours.find(c => c.id === cidA);
    const b = p.contours.find(c => c.id === cidB);
    if (!a || !b || !a.closed || !b.closed) return false;
    const result = booleanOp(op, a, b);
    if (!result.length) return false;
    // 先改当前文档,再入历史栈(commit 会快照当前态并替换为克隆)
    p.contours = p.contours.filter(c => c.id !== cidA && c.id !== cidB);
    p.contours.push(...result);
    this.commit();
    this.selection = null;
    return true;
  }

  /** 对零件的全部闭合轮廓两两合并 */
  unionPart(partId: string): void {
    const p = this.findPart(partId);
    if (!p) return;
    const closed = p.contours.filter(c => c.closed);
    if (closed.length < 2) return;
    const open = p.contours.filter(c => !c.closed);
    const merged = unionAll(closed);
    p.contours = [...open, ...merged];
    this.commit();
  }

  translateContour(partId: string, cid: string, dx: number, dy: number): void {
    const c = this.findContour(partId, cid);
    if (c) translateContour(c, dx, dy);
  }

  duplicateContour(partId: string, cid: string): void {
    const p = this.findPart(partId);
    const c = p?.contours.find(x => x.id === cid);
    if (!p || !c) return;
    this.commit();
    const copy = cloneContour(c);
    translateContour(copy, 10, 10);
    p.contours.push(copy);
  }

  /* ---------------- 孔 ---------------- */
  addHole(partId: string, cx: number, cy: number, r = 10): Hole {
    this.commit();
    const h: Hole = { id: uid('h'), cx, cy, r };
    this.findPart(partId)?.holes.push(h);
    this.selectedHoleIds = [h.id];
    this.selection = { kind: 'holes', partId, holeIds: [h.id] };
    this.history.save(this.doc);
    return h;
  }

  removeHoles(partId: string, ids: string[]): void {
    this.commit();
    const p = this.findPart(partId);
    if (p) p.holes = p.holes.filter(h => !ids.includes(h.id));
    this.selectedHoleIds = [];
    this.history.save(this.doc);
  }

  arrayHoles(partId: string, ids: string[], params: ArrayParams): number {
    const p = this.findPart(partId);
    if (!p || !ids.length) return 0;
    const created = duplicateHolesArray(p, ids, params);
    if (!created.length) return 0;
    this.commit();
    p.holes.push(...created);
    // 阵列后选中全部孔(原件 + 新件),保持孔距可见
    this.selectedHoleIds = p.holes.map(h => h.id);
    this.selection = { kind: 'holes', partId, holeIds: this.selectedHoleIds };
    this.history.save(this.doc);
    return created.length;
  }

  toggleHoleSelection(id: string, additive: boolean): void {
    if (additive) {
      this.selectedHoleIds = this.selectedHoleIds.includes(id)
        ? this.selectedHoleIds.filter(x => x !== id)
        : [...this.selectedHoleIds, id];
    } else {
      this.selectedHoleIds = [id];
    }
  }

  clearHoleSelection(): void { this.selectedHoleIds = []; }

  /* ---------------- 导入导出 ---------------- */
  importSVG(svgText: string, name: string): Part {
    const contours = parseSVGPaths(svgText);
    const part = contoursToPart(contours, name);
    this.commit();
    this.doc.parts.push(part);
    this.doc.activePartId = part.id;
    return part;
  }

  exportSVG(): string { return exportDocSVG(this.doc); }

  loadDoc(doc: Doc): void {
    this.doc = doc;
    this.history.reset(doc);
    this.selection = null;
    this.selectedHoleIds = [];
    this.report = null;
  }

  newDoc(): void {
    this.doc = createDoc();
    this.history.reset(this.doc);
    this.selection = null;
    this.report = null;
  }

  /* ---------------- 批量检查/复核 ---------------- */
  runChecks(): BatchReport {
    const findings = checkDoc(this.doc);
    this.report = {
      findings,
      checkedAt: Date.now(),
      drawingCount: this.doc.parts.length,
      passed: findings.length === 0
    };
    return this.report;
  }

  setFindingStatus(id: string, status: Finding['status']): void {
    const f = this.report?.findings.find(x => x.id === id);
    if (f) f.status = status;
  }

  rejectAllOpen(): void {
    this.report?.findings.forEach(f => { if (f.status === 'open') f.status = 'rejected'; });
  }
}

export const editor = new EditorStore();
