import type {
  BoundaryLine,
  ColorMode,
  CornerMode,
  ElevPoint,
  LineDerivation,
  ProjectFile,
  SectionSample,
  TerrainMeshData,
  UnfoldResult,
  Vec2
} from '../../types.js';
import { deriveSplineLine } from '../geometry/spline.js';
import { buildTerrainMesh, sampleSection } from '../geometry/terrain.js';
import { unfoldSlope, type UnfoldOptions } from '../geometry/unfold.js';
import { buildOffsetLines } from '../geometry/offset.js';
import { projectStore } from '../archive/project-store.js';

export type LineId = 'center' | 'crest-left' | 'crest-right';
export type ToolMode = 'select' | 'add-point' | 'section' | 'pick-slope';

export interface SectionState {
  a: Vec2;
  b: Vec2;
  samples: SectionSample[];
}

export interface AlertSummary {
  lineId: LineId;
  lineName: string;
  count: number;
  maxRate: number;
  minRadius: number;
}

type Listener = () => void;

/** 刷新域，供视图层按需重建场景对象 */
export interface RefreshFlags {
  terrain: boolean;
  lines: boolean;
  boundaries: boolean;
  section: boolean;
  slope: boolean;
}

export const LINE_NAMES: Record<LineId, string> = {
  center: '河道中心线',
  'crest-left': '左堤顶线',
  'crest-right': '右堤顶线'
};

class WorkbenchStore {
  terrain: TerrainMeshData | null = null;
  derivations = new Map<LineId, LineDerivation>();
  tool: ToolMode = 'select';
  activeLine: LineId = 'center';
  section: SectionState | null = null;
  /** 堤坡选段（派生线索引起止） */
  slopePick: { lineId: LineId; startIdx: number; endIdx: number } | null = null;
  unfoldPreview: UnfoldResult | null = null;
  private listeners = new Set<Listener>();
  /** 最近一次变更涉及的刷新域 */
  flags: RefreshFlags = { terrain: false, lines: false, boundaries: false, section: false, slope: false };

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  emit(flags?: Partial<RefreshFlags>): void {
    if (flags) Object.assign(this.flags, flags);
    for (const fn of this.listeners) fn();
    this.flags = { terrain: false, lines: false, boundaries: false, section: false, slope: false };
  }

  get file(): ProjectFile | null {
    return projectStore.currentProject;
  }

  setTool(tool: ToolMode): void {
    this.tool = tool;
    if (tool !== 'pick-slope') this.slopePick = null;
    if (tool !== 'section') this.section = null;
    this.emit({ section: true, slope: true });
  }

  setActiveLine(line: LineId): void {
    this.activeLine = line;
    this.emit({ lines: true });
  }

  // —— 派生计算 ——
  recomputeLines(): void {
    const f = this.file;
    if (!f) return;
    const s = f.settings;
    this.derivations.clear();
    const map: [LineId, Vec2[]][] = [
      ['center', f.centerControls],
      ['crest-left', f.crestLeftControls],
      ['crest-right', f.crestRightControls]
    ];
    for (const [id, controls] of map) {
      const d = deriveSplineLine(id, controls, s);
      if (d) this.derivations.set(id, d);
    }
    this.emit({ lines: true, slope: true });
  }

  recomputeTerrain(): void {
    const f = this.file;
    if (!f || f.elevPoints.length < 3) {
      this.terrain = null;
      this.emit({ terrain: true });
      return;
    }
    const poly = f.boundaries.find((b) => b.closed)?.points ?? null;
    this.terrain = buildTerrainMesh(
      f.elevPoints,
      poly,
      f.settings.gridSpacing,
      f.settings.idwPower,
      f.settings.idwRadius
    );
    this.emit({ terrain: true, lines: true, boundaries: true });
  }

  setColorMode(mode: ColorMode): void {
    if (!this.file) return;
    this.file.settings.colorMode = mode;
    void projectStore.save();
    this.emit({ terrain: true });
  }

  setCornerMode(mode: CornerMode): void {
    if (!this.file) return;
    this.file.settings.cornerMode = mode;
    void projectStore.save();
    this.emit();
  }

  // —— 控制点编辑 ——
  controlsOf(line: LineId): Vec2[] {
    const f = this.file!;
    if (line === 'center') return f.centerControls;
    if (line === 'crest-left') return f.crestLeftControls;
    return f.crestRightControls;
  }

  async addControlPoint(line: LineId, p: Vec2): Promise<void> {
    await projectStore.update((f) => {
      const arr = line === 'center' ? f.centerControls : line === 'crest-left' ? f.crestLeftControls : f.crestRightControls;
      // 按 x 排序插入，保证样条顺序稳定（河道整体沿 x 走向）
      let idx = arr.findIndex((q) => q.x > p.x);
      if (idx < 0) idx = arr.length;
      arr.splice(idx, 0, { ...p });
    });
    this.recomputeLines();
  }

  async moveControlPoint(line: LineId, index: number, p: Vec2): Promise<void> {
    await projectStore.update((f) => {
      const arr = line === 'center' ? f.centerControls : line === 'crest-left' ? f.crestLeftControls : f.crestRightControls;
      if (arr[index]) Object.assign(arr[index], p);
    });
    this.recomputeLines();
  }

  async deleteControlPoint(line: LineId, index: number): Promise<void> {
    await projectStore.update((f) => {
      const arr = line === 'center' ? f.centerControls : line === 'crest-left' ? f.crestLeftControls : f.crestRightControls;
      arr.splice(index, 1);
    });
    this.recomputeLines();
  }

  // —— 等距偏移 ——
  async generateOffset(lineId: LineId, side: 'left' | 'right' | 'both'): Promise<void> {
    const f = this.file;
    if (!f) return;
    const src = this.derivations.get(lineId);
    if (!src) throw new Error('该线路控制点不足，无法偏移');
    const { offsetDistance, cornerMode } = f.settings;
    const made = buildOffsetLines(src.points, false, offsetDistance, cornerMode, side);
    await projectStore.update((pf) => {
      for (const m of made) {
        const line: BoundaryLine = {
          id: crypto.randomUUID(),
          name: `${LINE_NAMES[lineId]}-管理范围${m.side === 'left' ? '左' : '右'}侧 ${offsetDistance}m`,
          points: m.points,
          closed: false,
          kind: 'offset'
        };
        pf.offsetLines.push(line);
      }
    });
    this.emit({ boundaries: true });
  }

  async clearOffsets(): Promise<void> {
    await projectStore.update((f) => {
      f.offsetLines = [];
    });
    this.emit({ boundaries: true });
  }

  // —— 横断面 ——
  setSection(a: Vec2, b: Vec2): void {
    if (!this.terrain) return;
    this.section = { a, b, samples: sampleSection(this.terrain, a, b, Math.max(2, this.terrain.spacing)) };
    this.emit({ section: true });
  }

  // —— 堤坡展开 ——
  previewUnfold(lineId: LineId, startIdx: number, endIdx: number, opts: UnfoldOptions): UnfoldResult | null {
    if (!this.terrain) return null;
    const d = this.derivations.get(lineId);
    if (!d) return null;
    this.slopePick = { lineId, startIdx, endIdx };
    this.unfoldPreview = unfoldSlope(
      this.terrain,
      d,
      startIdx,
      endIdx,
      opts,
      crypto.randomUUID(),
      Date.now(),
      LINE_NAMES[lineId]
    );
    this.emit({ slope: true });
    return this.unfoldPreview;
  }

  async commitUnfold(): Promise<void> {
    if (!this.unfoldPreview || !this.file) return;
    const result = structuredClone(this.unfoldPreview);
    await projectStore.update((f) => {
      f.unfoldResults.push(result);
    });
    this.emit({ slope: true });
  }

  setElevPoints(points: ElevPoint[]): void {
    if (!this.file) return;
    this.file.elevPoints = points;
    void projectStore.save().then(() => this.recomputeTerrain());
  }

  alertSummary(): AlertSummary[] {
    const out: AlertSummary[] = [];
    for (const [id, d] of this.derivations) {
      let count = 0;
      let prev = false;
      let maxRate = 0;
      let minRadius = Infinity;
      for (let i = 0; i < d.alerts.length; i++) {
        if (d.alerts[i] && !prev) count++;
        prev = d.alerts[i];
        if (d.alerts[i]) {
          maxRate = Math.max(maxRate, Math.abs(d.curvatureRates[i]));
          minRadius = Math.min(minRadius, d.radii[i]);
        }
      }
      if (count > 0) out.push({ lineId: id, lineName: LINE_NAMES[id], count, maxRate, minRadius });
    }
    return out;
  }

  /** 重置内存态（切换项目时） */
  resetSession(): void {
    this.terrain = null;
    this.derivations.clear();
    this.section = null;
    this.slopePick = null;
    this.unfoldPreview = null;
    this.tool = 'select';
    this.emit({ terrain: true, lines: true, boundaries: true, section: true, slope: true });
  }
}

export const workbench = new WorkbenchStore();
