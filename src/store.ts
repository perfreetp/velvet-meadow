import { create } from 'zustand';
import type {
  Comment,
  Lamp,
  ProjectData,
  SceneElement,
  Vec2,
  VersionSnapshot,
} from './types';
import { createDefaultProject } from './defaultScene';
import { uid } from './engine/geometry';
import { LAMP_CATALOG } from './engine/photometry';

const PROJECT_KEY = 'ncls.project.v1';
const VERSIONS_KEY = 'ncls.versions.v1';

function loadProject(): ProjectData {
  try {
    const raw = localStorage.getItem(PROJECT_KEY);
    if (raw) return JSON.parse(raw) as ProjectData;
  } catch {
    /* ignore */
  }
  return createDefaultProject();
}

function loadVersions(): VersionSnapshot[] {
  try {
    const raw = localStorage.getItem(VERSIONS_KEY);
    if (raw) return JSON.parse(raw) as VersionSnapshot[];
  } catch {
    /* ignore */
  }
  return [];
}

export type Tool =
  | 'select'
  | 'water'
  | 'wall'
  | 'bridgeOpening'
  | 'pier'
  | 'dock'
  | 'route'
  | 'comment';

interface State {
  data: ProjectData;
  versions: VersionSnapshot[];
  selectedId: string | null;
  tool: Tool;
  drawing: Vec2[];
  /** 比对视图数据（为空表示关闭） */
  compareVersionId: string | null;
  /** 仿真脏标记（由 UI 层调度） */
  simVersion: number;

  setTool: (t: Tool) => void;
  addDrawingPoint: (p: Vec2) => void;
  cancelDrawing: () => void;
  finishDrawing: () => void;

  addLamp: (kind: Lamp['kind'], pos: Vec2) => void;
  updateElement: (id: string, patch: Partial<SceneElement>) => void;
  updateLamp: (id: string, patch: Partial<Lamp>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  select: (id: string | null) => void;

  setTime: (h: number) => void;
  setHeatmap: (patch: Partial<Pick<ProjectData, 'heatmapMode' | 'heatmapVisible' | 'darkZoneVisible' | 'luxThreshold'>>) => void;

  addComment: (pos: Vec2, author: string, text: string) => void;
  resolveComment: (id: string) => void;
  replyComment: (id: string, author: string, text: string) => void;

  commitVersion: (label: string, note: string) => void;
  restoreVersion: (id: string) => void;
  deleteVersion: (id: string) => void;
  setCompare: (id: string | null) => void;
  resetProject: () => void;
  importProject: (d: ProjectData) => void;
}

function persist(data: ProjectData) {
  data.meta.updatedAt = Date.now();
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function finishPolyline(tool: Tool, points: Vec2[]): SceneElement | null {
  if (points.length < 2) return null;
  const base = { id: uid(tool), name: defaultName(tool) };
  switch (tool) {
    case 'water':
      return { ...base, type: 'water', points: closePoly(points) };
    case 'wall':
      return { ...base, type: 'wall', points, thickness: 0.8, height: 2.2 };
    case 'bridgeOpening':
      return { ...base, type: 'bridgeOpening', points: closePoly(points) };
    case 'pier':
      return { ...base, type: 'pier', points: closePoly(points), height: 3.5 };
    case 'dock':
      return { ...base, type: 'dock', points: closePoly(points) };
    case 'route':
      return { ...base, type: 'route', points };
    default:
      return null;
  }
}

function closePoly(points: Vec2[]): Vec2[] {
  if (points.length >= 3) {
    const first = points[0];
    const last = points[points.length - 1];
    if (Math.hypot(first.x - last.x, first.y - last.y) < 0.6) return points.slice(0, -1);
  }
  return points;
}

function defaultName(tool: Tool): string {
  const map: Record<string, string> = {
    water: '水面',
    wall: '驳岸挡墙',
    bridgeOpening: '桥洞',
    pier: '桥墩',
    dock: '码头平台',
    route: '航线',
  };
  return map[tool] ?? tool;
}

export const useStore = create<State>((set, get) => ({
  data: loadProject(),
  versions: loadVersions(),
  selectedId: null,
  tool: 'select',
  drawing: [],
  compareVersionId: null,
  simVersion: 0,

  setTool: (t) => set({ tool: t, drawing: [], selectedId: t === 'select' ? get().selectedId : null }),
  addDrawingPoint: (p) => set((s) => ({ drawing: [...s.drawing, p] })),
  cancelDrawing: () => set({ drawing: [] }),
  finishDrawing: () => {
    const { tool, drawing, data } = get();
    const el = finishPolyline(tool, drawing);
    if (el) {
      const next = { ...data, elements: [...data.elements, el] };
      persist(next);
      set({ data: next, drawing: [], selectedId: el.id, simVersion: get().simVersion + 1 });
    } else {
      set({ drawing: [] });
    }
  },

  addLamp: (kind, pos) => {
    const cat = LAMP_CATALOG[kind];
    const lamp: Lamp = {
      id: uid('lamp'),
      type: 'lamp',
      name: `${cat.label} ${get().data.elements.filter((e) => e.type === 'lamp' && e.kind === kind).length + 1}`,
      kind,
      pos,
      aim: kind === 'flood' || kind === 'wallWasher' || kind === 'underwater' ? Math.PI / 2 : 0,
      beamAngleDeg: cat.defaultBeamDeg,
      colorTemp: cat.defaultColorTemp,
      powerW: cat.defaultPowerW,
      height: cat.defaultHeight,
      efficacy: cat.efficacyLmPerW,
    };
    const next = { ...get().data, elements: [...get().data.elements, lamp] };
    persist(next);
    set({ data: next, selectedId: lamp.id, tool: 'select', simVersion: get().simVersion + 1 });
  },

  updateElement: (id, patch) => {
    const next = {
      ...get().data,
      elements: get().data.elements.map((e) => (e.id === id ? ({ ...e, ...patch } as SceneElement) : e)),
    };
    persist(next);
    set({ data: next, simVersion: get().simVersion + 1 });
  },
  updateLamp: (id, patch) => get().updateElement(id, patch),
  removeElement: (id) => {
    const next = { ...get().data, elements: get().data.elements.filter((e) => e.id !== id) };
    persist(next);
    set({ data: next, selectedId: null, simVersion: get().simVersion + 1 });
  },
  duplicateElement: (id) => {
    const src = get().data.elements.find((e) => e.id === id);
    if (!src) return;
    const copy: SceneElement = JSON.parse(JSON.stringify(src));
    copy.id = uid((copy as SceneElement).type);
    copy.name = `${copy.name} 副本`;
    if (copy.type === 'lamp') copy.pos = { x: copy.pos.x + 2, y: copy.pos.y + 2 };
    const next = { ...get().data, elements: [...get().data.elements, copy] };
    persist(next);
    set({ data: next, selectedId: copy.id, simVersion: get().simVersion + 1 });
  },
  select: (id) => set({ selectedId: id }),

  setTime: (h) => {
    const next = { ...get().data, timeHour: h };
    persist(next);
    set({ data: next, simVersion: get().simVersion + 1 });
  },
  setHeatmap: (patch) => {
    const next = { ...get().data, ...patch };
    persist(next);
    set({ data: next, simVersion: get().simVersion + 1 });
  },

  addComment: (pos, author, text) => {
    const c: Comment = {
      id: uid('cmt'),
      pos,
      author: author || '审核人',
      text,
      createdAt: Date.now(),
      replies: [],
      resolved: false,
    };
    const next = { ...get().data, comments: [...get().data.comments, c] };
    persist(next);
    set({ data: next });
  },
  resolveComment: (id) => {
    const next = {
      ...get().data,
      comments: get().data.comments.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c)),
    };
    persist(next);
    set({ data: next });
  },
  replyComment: (id, author, text) => {
    const next = {
      ...get().data,
      comments: get().data.comments.map((c) =>
        c.id === id
          ? {
              ...c,
              replies: [
                ...c.replies,
                { id: uid('rep'), author: author || '制作方', text, createdAt: Date.now() },
              ],
            }
          : c,
      ),
    };
    persist(next);
    set({ data: next });
  },

  commitVersion: (label, note) => {
    const snap: VersionSnapshot = {
      id: uid('ver'),
      label,
      note,
      createdAt: Date.now(),
      data: JSON.parse(JSON.stringify(get().data)),
    };
    const versions = [snap, ...get().versions].slice(0, 20);
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    } catch {
      /* ignore */
    }
    set({ versions });
  },
  restoreVersion: (id) => {
    const snap = get().versions.find((v) => v.id === id);
    if (!snap) return;
    const data: ProjectData = JSON.parse(JSON.stringify(snap.data));
    persist(data);
    set({ data, selectedId: null, compareVersionId: null, simVersion: get().simVersion + 1 });
  },
  deleteVersion: (id) => {
    const versions = get().versions.filter((v) => v.id !== id);
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    } catch {
      /* ignore */
    }
    set({
      versions,
      compareVersionId: get().compareVersionId === id ? null : get().compareVersionId,
    });
  },
  setCompare: (id) => set({ compareVersionId: id }),
  resetProject: () => {
    const data = createDefaultProject();
    persist(data);
    set({ data, selectedId: null, drawing: [], simVersion: get().simVersion + 1 });
  },
  importProject: (d) => {
    persist(d);
    set({ data: d, selectedId: null, drawing: [], simVersion: get().simVersion + 1 });
  },
}));
