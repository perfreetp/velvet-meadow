import { createMemo, createRoot, createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import type {
  Bookmark, LayerId, Mark, MeasureSeg, OrderStatus, PointCategory, ToolMode, ViewState, WorkOrder, WorkerStat,
} from './types';
import { LAYERS, MAX_H } from './config';

// 单例全局状态：用 createRoot 托管，避免模块级响应式原语的 dispose 警告
export const WORKERS = ['张师傅', '李师傅', '王师傅', '赵师傅'];
export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '待分派',
  dispatched: '施工中',
  submitted: '待质检',
  done: '已完工',
  returned: '已退回',
};

// 外层绑定（createRoot 内赋值，组件侧命名导入不变）
let layerOn: Record<LayerId, boolean>;
let setLayerOn: (id: LayerId, v: boolean | ((prev: boolean) => boolean)) => void = null as any;
let categoryFilter: () => PointCategory | 'all';
let setCategoryFilter: (v: PointCategory | 'all') => void;
let tool: () => ToolMode;
let setTool: (t: ToolMode) => void;
let selectedId: () => string | null;
let setSelectedId: (id: string | null) => void;
let boxIds: () => Set<string>;
let setBoxIds: (s: Set<string>) => void;
let hoveredId: () => string | null;
let setHoveredId: (id: string | null) => void;
let highlightedIds: () => Set<string>;
let view: () => ViewState;
let setView: (v: ViewState) => void;
let bookmarks: () => Bookmark[];
let addBookmark: (name: string, v: ViewState) => void;
let removeBookmark: (id: string) => void;
let marks: () => Mark[];
let addMark: (m: Omit<Mark, 'id'>) => void;
let clearMarks: () => void;
let measureSegs: () => MeasureSeg[];
let pushMeasure: (seg: MeasureSeg) => void;
let popMeasure: () => void;
let clearMeasure: () => void;
let measureTotal: () => number;
let orders: WorkOrder[];
let createOrder: (input: {
  title: string; category: WorkOrder['category']; featureId: string; featureCode: string; content: string;
}) => WorkOrder;
let dispatchOrder: (id: string, assignee: string) => void;
let submitOrder: (id: string, resultNote: string) => void;
let qaPass: (id: string) => void;
let qaReturn: (id: string, note: string) => void;
let workerStats: () => WorkerStat[];

createRoot(() => {
  // ---------------- 图层 / 过滤 / 工具 ----------------
  const initialLayerOn = () =>
    Object.fromEntries(LAYERS.map((l) => [l.id, l.on])) as Record<LayerId, boolean>;
  const [lo, setLo] = createStore<Record<LayerId, boolean>>(initialLayerOn());
  layerOn = lo;
  setLayerOn = (id: LayerId, v: boolean | ((prev: boolean) => boolean)) => setLo(id, v as any);

  const [cf, scf] = createSignal<PointCategory | 'all'>('all');
  categoryFilter = cf; setCategoryFilter = scf;
  const [tl, stl] = createSignal<ToolMode>('select');
  tool = tl; setTool = stl;

  // ---------------- 选择与高亮（切换图层不丢：状态独立于场景） ----------------
  const [sid, ssid] = createSignal<string | null>(null);
  selectedId = sid; setSelectedId = ssid;
  const [bids, sbids] = createSignal<Set<string>>(new Set());
  boxIds = bids; setBoxIds = sbids;
  const [hid, shid] = createSignal<string | null>(null);
  hoveredId = hid; setHoveredId = shid;

  highlightedIds = createMemo<Set<string>>(() => {
    const s = new Set(bids());
    const id = sid();
    if (id) s.add(id);
    return s;
  });

  // ---------------- 视图 / 书签 / 测量 / 临时标记 ----------------
  const [vw, svw] = createSignal<ViewState>({ targetX: 0, targetZ: 0, height: MAX_H });
  view = vw; setView = svw;

  const BOOKMARK_KEY = 'campus-bookmarks-v1';
  const loadBookmarks = (): Bookmark[] => {
    try {
      return JSON.parse(localStorage.getItem(BOOKMARK_KEY) || '[]');
    } catch {
      return [];
    }
  };
  const [bms, setBms] = createSignal<Bookmark[]>(loadBookmarks());
  bookmarks = bms;
  addBookmark = (name, v) => {
    const bm: Bookmark = {
      id: 'BM' + Date.now().toString(36),
      name: name || '视角 ' + (bms().length + 1),
      view: { ...v },
      createdAt: new Date().toISOString().slice(0, 10),
    };
    const next = [...bms(), bm];
    setBms(next);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
  };
  removeBookmark = (id) => {
    const next = bms().filter((b) => b.id !== id);
    setBms(next);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
  };

  const [mks, setMks] = createSignal<Mark[]>([]);
  marks = mks;
  addMark = (m) =>
    setMks((arr) => [...arr, { ...m, id: 'MK' + Date.now().toString(36) + Math.floor(Math.random() * 1e3) }]);
  clearMarks = () => setMks([]);

  const [segs, setSegs] = createSignal<MeasureSeg[]>([]);
  measureSegs = segs;
  pushMeasure = (seg) => setSegs((arr) => [...arr, seg]);
  popMeasure = () => setSegs((arr) => arr.slice(0, -1));
  clearMeasure = () => setSegs([]);
  measureTotal = createMemo(() => segs().reduce((s, x) => s + x.len, 0));

  // ---------------- 工单流转 ----------------
  let orderSeq = 1000;
  const [wo, setWo] = createStore<WorkOrder[]>([]);
  orders = wo;

  createOrder = (input) => {
    const o: WorkOrder = {
      id: 'WO' + ++orderSeq,
      title: input.title,
      category: input.category,
      featureId: input.featureId,
      featureCode: input.featureCode,
      content: input.content,
      assignee: null,
      status: 'pending',
      reworkCount: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      dispatchedAt: null,
      submittedAt: null,
      finishedAt: null,
      qaNote: '',
      resultNote: '',
    };
    setWo((arr) => [o, ...arr]);
    return o;
  };

  dispatchOrder = (id, assignee) => {
    setWo((o) => o.id === id, {
      assignee,
      status: 'dispatched' as OrderStatus,
      dispatchedAt: new Date().toISOString().slice(0, 10),
    });
  };
  submitOrder = (id, resultNote) => {
    setWo((o) => o.id === id, {
      status: 'submitted' as OrderStatus,
      resultNote,
      submittedAt: new Date().toISOString().slice(0, 10),
    });
  };
  qaPass = (id) => {
    setWo((o) => o.id === id, {
      status: 'done' as OrderStatus,
      finishedAt: new Date().toISOString().slice(0, 10),
    });
  };
  qaReturn = (id, note) => {
    setWo((o) => o.id === id, (w) => ({
      status: 'dispatched' as OrderStatus,
      reworkCount: w.reworkCount + 1,
      qaNote: note,
    }));
  };

  workerStats = createMemo<WorkerStat[]>(() => {
    const map = new Map<string, WorkerStat>();
    for (const w of WORKERS) {
      map.set(w, { worker: w, total: 0, done: 0, rework: 0, reworkRate: 0, pending: 0 });
    }
    for (const o of wo) {
      if (!o.assignee) continue;
      const s = map.get(o.assignee)!;
      s.total++;
      if (o.status === 'done') s.done++;
      if (o.status === 'dispatched') s.pending++;
      s.rework += o.reworkCount;
    }
    return [...map.values()].map((s) => ({
      ...s,
      // 返工率 = 累计退回次数 ÷ 承接工单总数
      reworkRate: s.total > 0 ? s.rework / s.total : 0,
    }));
  });
});

export {
  layerOn, setLayerOn, categoryFilter, setCategoryFilter, tool, setTool,
  selectedId, setSelectedId, boxIds, setBoxIds, hoveredId, setHoveredId, highlightedIds,
  view, setView, bookmarks, addBookmark, removeBookmark,
  marks, addMark, clearMarks,
  measureSegs, pushMeasure, popMeasure, clearMeasure, measureTotal,
  orders, createOrder, dispatchOrder, submitOrder, qaPass, qaReturn, workerStats,
};
