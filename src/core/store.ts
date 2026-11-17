import type {
  Anchor, DocumentData, IntersectionPoint, LayerData, PathData, Segment, Vec2
} from './types';
import { arcGeom, angleParam, arcPoint, uid } from './math2d';
import { eachSeg, getAnchor } from './geometry';

interface HistoryEntry {
  label: string;
  snapshot: DocumentData;
}

const MAX_HISTORY = 100;

function cloneDoc(doc: DocumentData): DocumentData {
  return JSON.parse(JSON.stringify(doc)) as DocumentData;
}

export class DocumentStore extends EventTarget {
  doc: DocumentData;
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  /** 当前选择的路径 id（布尔运算需要选两条） */
  selectedPathIds: string[] = [];
  selectedAnchor: { pathId: string; anchorId: string } | null = null;
  /** 批量操作期间暂不记录历史 */
  private batching = false;
  private batchLabel = '';

  constructor(doc?: DocumentData) {
    super();
    this.doc = doc ?? DocumentStore.createDefault();
  }

  static createDefault(): DocumentData {
    const layerId = uid('layer');
    return {
      width: 80,
      height: 50,
      grid: 2,
      layers: [{ id: layerId, name: '图层 1', visible: true, locked: false, color: '#60a5fa', pathIds: [] }],
      paths: {},
      activeLayerId: layerId,
      intersections: []
    };
  }

  load(doc: DocumentData): void {
    this.doc = cloneDoc(doc);
    this.undoStack = [];
    this.redoStack = [];
    this.selectedPathIds = [];
    this.selectedAnchor = null;
    this.emit('load');
  }

  get snapshot(): DocumentData {
    return cloneDoc(this.doc);
  }

  /** 记录一次操作前的状态 */
  private pushHistory(label: string): void {
    if (this.batching) return;
    this.undoStack.push({ label, snapshot: cloneDoc(this.doc) });
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
    this.redoStack = [];
  }

  beginBatch(label: string): void {
    if (this.batching) return;
    this.batching = true;
    this.batchLabel = label;
    this.undoStack.push({ label, snapshot: cloneDoc(this.doc) });
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
    this.redoStack = [];
  }

  endBatch(): void {
    if (!this.batching) return;
    this.batching = false;
    this.emit('history');
    this.emit('change');
  }

  undo(): void {
    const entry = this.undoStack.pop();
    if (!entry) return;
    this.redoStack.push({ label: entry.label, snapshot: cloneDoc(this.doc) });
    this.doc = entry.snapshot;
    this.selectedPathIds = this.selectedPathIds.filter(id => this.doc.paths[id]);
    this.selectedAnchor = null;
    this.emit('history');
    this.emit('change');
  }

  redo(): void {
    const entry = this.redoStack.pop();
    if (!entry) return;
    this.undoStack.push({ label: entry.label, snapshot: cloneDoc(this.doc) });
    this.doc = entry.snapshot;
    this.selectedPathIds = this.selectedPathIds.filter(id => this.doc.paths[id]);
    this.selectedAnchor = null;
    this.emit('history');
    this.emit('change');
  }

  get canUndo(): boolean { return this.undoStack.length > 0; }
  get canRedo(): boolean { return this.redoStack.length > 0; }
  get undoLabel(): string { return this.undoStack.at(-1)?.label ?? ''; }
  get redoLabel(): string { return this.redoStack.at(-1)?.label ?? ''; }

  private emit(type: string): void {
    this.dispatchEvent(new CustomEvent(type, { detail: null }));
  }

  // ---------- 图层 ----------

  get activeLayer(): LayerData {
    return this.doc.layers.find(l => l.id === this.doc.activeLayerId) ?? this.doc.layers[0];
  }

  addLayer(name?: string): LayerData {
    this.pushHistory('新增图层');
    const colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185'];
    const layer: LayerData = {
      id: uid('layer'),
      name: name ?? `图层 ${this.doc.layers.length + 1}`,
      visible: true,
      locked: false,
      color: colors[this.doc.layers.length % colors.length],
      pathIds: []
    };
    this.doc.layers.push(layer);
    this.doc.activeLayerId = layer.id;
    this.emit('change');
    return layer;
  }

  toggleLayerVisible(id: string): void {
    const l = this.doc.layers.find(x => x.id === id);
    if (!l) return;
    this.pushHistory(l.visible ? '隐藏图层' : '显示图层');
    l.visible = !l.visible;
    this.emit('change');
  }

  toggleLayerLock(id: string): void {
    const l = this.doc.layers.find(x => x.id === id);
    if (!l) return;
    this.pushHistory(l.locked ? '解锁图层' : '锁定图层');
    l.locked = !l.locked;
    this.emit('change');
  }

  renameLayer(id: string, name: string): void {
    const l = this.doc.layers.find(x => x.id === id);
    if (!l) return;
    this.pushHistory('重命名图层');
    l.name = name;
    this.emit('change');
  }

  removeLayer(id: string): void {
    if (this.doc.layers.length <= 1) return;
    this.pushHistory('删除图层');
    const l = this.doc.layers.find(x => x.id === id);
    if (!l) return;
    for (const pid of l.pathIds) delete this.doc.paths[pid];
    this.doc.layers = this.doc.layers.filter(x => x.id !== id);
    if (this.doc.activeLayerId === id) this.doc.activeLayerId = this.doc.layers[0].id;
    this.selectedPathIds = this.selectedPathIds.filter(pid => this.doc.paths[pid]);
    this.emit('change');
  }

  setActiveLayer(id: string): void {
    if (!this.doc.layers.some(l => l.id === id)) return;
    this.doc.activeLayerId = id;
    this.emit('change');
  }

  isPathEditable(pathId: string): boolean {
    const layer = this.layerOfPath(pathId);
    return !!layer && layer.visible && !layer.locked;
  }

  layerOfPath(pathId: string): LayerData | undefined {
    return this.doc.layers.find(l => l.pathIds.includes(pathId));
  }

  visiblePaths(): PathData[] {
    return this.doc.layers
      .filter(l => l.visible)
      .flatMap(l => l.pathIds)
      .map(id => this.doc.paths[id])
      .filter(Boolean);
  }

  // ---------- 路径 ----------

  addPath(path: PathData, layerId?: string): void {
    this.pushHistory('新增路径');
    const layer = this.doc.layers.find(l => l.id === (layerId ?? this.doc.activeLayerId))!;
    layer.pathIds.push(path.id);
    this.doc.paths[path.id] = path;
    this.emit('change');
  }

  removePath(pathId: string): void {
    if (!this.doc.paths[pathId]) return;
    this.pushHistory('删除路径');
    const layer = this.layerOfPath(pathId);
    if (layer) layer.pathIds = layer.pathIds.filter(id => id !== pathId);
    delete this.doc.paths[pathId];
    this.selectedPathIds = this.selectedPathIds.filter(id => id !== pathId);
    this.selectedAnchor = null;
    this.emit('change');
  }

  renamePath(pathId: string, name: string): void {
    const p = this.doc.paths[pathId];
    if (!p) return;
    this.pushHistory('重命名路径');
    p.name = name;
    this.emit('change');
  }

  duplicatePath(pathId: string): void {
    const src = this.doc.paths[pathId];
    if (!src) return;
    this.pushHistory('复制路径');
    const copy: PathData = JSON.parse(JSON.stringify(src));
    copy.id = uid('path');
    copy.name = `${src.name} 副本`;
    copy.anchors.forEach(a => { a.id = uid('a'); a.x += 2; a.y += 2; });
    const idMap = new Map(src.anchors.map((a, i) => [a.id, copy.anchors[i].id]));
    copy.segs.forEach(s => {
      s.id = uid('s');
      s.a = idMap.get(s.a)!;
      s.b = idMap.get(s.b)!;
    });
    this.layerOfPath(pathId)?.pathIds.push(copy.id);
    this.doc.paths[copy.id] = copy;
    this.emit('change');
  }

  /** 新建一条空路径并返回 */
  beginPath(): PathData {
    const path: PathData = {
      id: uid('path'),
      name: `路径 ${Object.keys(this.doc.paths).length + 1}`,
      anchors: [],
      segs: [],
      color: this.activeLayer.color,
      closed: false
    };
    this.pushHistory('开始绘制');
    this.activeLayer.pathIds.push(path.id);
    this.doc.paths[path.id] = path;
    this.emit('change');
    return path;
  }

  appendAnchor(pathId: string, point: Vec2, type: 'line' | 'arc', bulge = 0): Anchor {
    const path = this.doc.paths[pathId];
    const anchor: Anchor = { id: uid('a'), x: point.x, y: point.y };
    path.anchors.push(anchor);
    if (path.anchors.length >= 2) {
      const prev = path.anchors[path.anchors.length - 2];
      const seg: Segment = type === 'arc'
        ? { id: uid('s'), type: 'arc', a: prev.id, b: anchor.id, bulge }
        : { id: uid('s'), type: 'line', a: prev.id, b: anchor.id };
      path.segs.push(seg);
    }
    return anchor;
  }

  /** 闭合当前绘制路径（最后一条边连回首点） */
  closePath(pathId: string, type: 'line' | 'arc', bulge = 0): void {
    const path = this.doc.paths[pathId];
    if (path.anchors.length < 3 || path.closed) return;
    const first = path.anchors[0];
    const last = path.anchors[path.anchors.length - 1];
    const seg: Segment = type === 'arc'
      ? { id: uid('s'), type: 'arc', a: last.id, b: first.id, bulge }
      : { id: uid('s'), type: 'line', a: last.id, b: first.id };
    path.segs.push(seg);
    path.closed = true;
    this.emit('change');
  }

  /** 在一条边的中间插入锚点（保持圆弧形状：拆成两段弧） */
  insertAnchorOnEdge(pathId: string, segId: string, point: Vec2): Anchor {
    this.pushHistory('插入锚点');
    const path = this.doc.paths[pathId];
    const segIdx = path.segs.findIndex(s => s.id === segId);
    if (segIdx < 0) throw new Error('边不存在');
    const seg = path.segs[segIdx];
    const anchor: Anchor = { id: uid('a'), x: point.x, y: point.y };
    const anchorIdx = path.anchors.findIndex(a => a.id === seg.a) + 1;
    path.anchors.splice(anchorIdx, 0, anchor);

    if (seg.type === 'line') {
      const s1: Segment = { id: uid('s'), type: 'line', a: seg.a, b: anchor.id };
      const s2: Segment = { id: uid('s'), type: 'line', a: anchor.id, b: seg.b };
      path.segs.splice(segIdx, 1, s1, s2);
    } else {
      // 圆弧拆分：保持原圆弧形状，按插入点参数 t 拆成两段
      const a = getAnchor(path, seg.a)!;
      const b = getAnchor(path, seg.b)!;
      const g = arcGeom(a, b, seg.bulge);
      if (!g) {
        path.segs.splice(segIdx, 1,
          { id: uid('s'), type: 'line', a: seg.a, b: anchor.id },
          { id: uid('s'), type: 'line', a: anchor.id, b: seg.b });
      } else {
        const t = angleParam(g, point) ?? 0.5;
        const midPt = arcPoint(g, t);
        anchor.x = midPt.x; anchor.y = midPt.y;
        const g1Sweep = g.sweep * t;
        const g2Sweep = g.sweep * (1 - t);
        const s1: Segment = { id: uid('s'), type: 'arc', a: seg.a, b: anchor.id, bulge: Math.tan(g1Sweep / 4) };
        const s2: Segment = { id: uid('s'), type: 'arc', a: anchor.id, b: seg.b, bulge: Math.tan(g2Sweep / 4) };
        path.segs.splice(segIdx, 1, s1, s2);
      }
    }
    this.emit('change');
    return anchor;
  }

  /** 拖动锚点（相邻弧段保持圆心角，即曲率随之调整） */
  moveAnchor(pathId: string, anchorId: string, point: Vec2, record = true): void {
    const path = this.doc.paths[pathId];
    if (!path) return;
    if (record) this.pushHistory('移动锚点');
    const anchor = getAnchor(path, anchorId);
    if (!anchor) return;
    anchor.x = point.x;
    anchor.y = point.y;
    // bulge 不动 => 弦长变化时圆心角 tan(θ/4)=bulge 保持，θ 不变，曲率半径随弦长自适应
    this.emit('change');
  }

  /** 切换某条边的直/弧类型（弧用一个默认 bulge） */
  toggleSegmentArc(pathId: string, segId: string): void {
    this.pushHistory('切换圆弧');
    const path = this.doc.paths[pathId];
    const seg = path.segs.find(s => s.id === segId);
    if (!seg) return;
    if (seg.type === 'line') {
      const arc: Segment = { id: uid('s'), type: 'arc', a: seg.a, b: seg.b, bulge: 0.35 };
      path.segs[path.segs.indexOf(seg)] = arc;
    } else {
      const line: Segment = { id: uid('s'), type: 'line', a: seg.a, b: seg.b };
      path.segs[path.segs.indexOf(seg)] = line;
    }
    this.emit('change');
  }

  /** 修改圆弧 bulge（曲率） */
  setBulge(pathId: string, segId: string, bulge: number): void {
    const path = this.doc.paths[pathId];
    const seg = path.segs.find(s => s.id === segId);
    if (!seg || seg.type !== 'arc') return;
    this.pushHistory('调整曲率');
    seg.bulge = Math.max(-2, Math.min(2, bulge));
    this.emit('change');
  }

  setPathClosed(pathId: string, closed: boolean): void {
    const path = this.doc.paths[pathId];
    if (!path || path.closed === closed) return;
    this.pushHistory(closed ? '闭合路径' : '开放路径');
    if (closed) {
      if (path.anchors.length >= 3) {
        const first = path.anchors[0], last = path.anchors[path.anchors.length - 1];
        path.segs.push({ id: uid('s'), type: 'line', a: last.id, b: first.id });
        path.closed = true;
      }
    } else {
      path.segs.pop();
      path.closed = false;
    }
    this.emit('change');
  }

  // ---------- 选择 ----------

  togglePathSelection(pathId: string): void {
    const idx = this.selectedPathIds.indexOf(pathId);
    if (idx >= 0) this.selectedPathIds.splice(idx, 1);
    else {
      if (this.selectedPathIds.length >= 2) this.selectedPathIds.shift();
      this.selectedPathIds.push(pathId);
    }
    this.emit('select');
  }

  clearSelection(): void {
    this.selectedPathIds = [];
    this.selectedAnchor = null;
    this.emit('select');
  }

  selectAnchor(pathId: string, anchorId: string): void {
    this.selectedAnchor = { pathId, anchorId };
    this.emit('select');
  }

  setIntersections(points: IntersectionPoint[]): void {
    this.doc.intersections = points;
    this.emit('change');
  }

  clearIntersections(): void {
    if (this.doc.intersections.length === 0) return;
    this.pushHistory('清除交点');
    this.doc.intersections = [];
    this.emit('change');
  }

  /** 布尔运算结果入库（可撤销） */
  addBooleanResult(paths: PathData[], intersections: IntersectionPoint[], label: string): void {
    this.pushHistory(label);
    const layer = this.activeLayer;
    for (const p of paths) {
      layer.pathIds.push(p.id);
      this.doc.paths[p.id] = p;
    }
    this.doc.intersections = intersections;
    this.selectedPathIds = paths.map(p => p.id).slice(0, 2);
    this.emit('change');
  }

  // ---------- 工具 ----------

  allAnchorPoints(excludePath?: string): Vec2[] {
    const pts: Vec2[] = [];
    for (const path of this.visiblePaths()) {
      if (path.id === excludePath) continue;
      pts.push(...path.anchors);
    }
    return pts;
  }

  segCount(pathId: string): number {
    return eachSeg(this.doc.paths[pathId]).length;
  }
}
