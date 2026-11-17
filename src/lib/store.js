// 全局状态:方案 / 版本 / 批注 / 客户档案 / 撤销重做(快照式,上限 100 步)
import { createStore, produce } from 'solid-js/store';
import { STORAGE_KEYS, uid, deepClone } from './constants';
import {
  createShape, makeLeafShape, makePetalShape, booleanOp, removeOverlapEdges,
  smoothHandles, insertNode, deleteNode
} from './geometry';

const HISTORY_LIMIT = 100; // 需求:至少 50 步

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { console.warn('持久化失败', e); }
}

function defaultSettings() {
  return { canvasW: 420, canvasH: 300, showGrid: true, showLabels: true, snap: true };
}

function emptyDoc() {
  const layerId = uid('lyr');
  return {
    shapes: [],
    layers: [{ id: layerId, name: '主图层', parentId: null, locked: false, visible: true }],
    annotations: [],
    settings: defaultSettings()
  };
}

function seedDraft() {
  const doc = emptyDoc();
  const layerId = doc.layers[0].id;
  const leaf = makeLeafShape(120, 150, 90, 42);
  leaf.name = '尤加利叶'; leaf.materialCode = 'LF-012'; leaf.parentId = layerId;
  const leaf2 = makeLeafShape(175, 130, 70, 32);
  leaf2.name = '尤加利叶·副本'; leaf2.materialCode = 'LF-012'; leaf2.parentId = layerId;
  const petal = makePetalShape(250, 160, 78, 50);
  petal.name = '玫瑰花瓣'; petal.materialCode = 'PT-007'; petal.parentId = layerId;
  petal.fill = '#e88aa8';
  doc.shapes = [leaf, leaf2, petal];
  return doc;
}

function seedData() {
  const clientId = uid('cli');
  const projectId = uid('prj');
  const doc = seedDraft();
  const project = {
    id: projectId,
    clientId,
    name: '春日序曲·手捧花',
    festival: '春季新品',
    deliveryDate: Date.now() + 14 * 864e5,
    createdAt: Date.now(),
    finalVersionId: null,
    draftDoc: doc,
    versions: []
  };
  return {
    clients: [{ id: clientId, name: '花漾花艺·静安店', store: '静安嘉里中心店', contact: '林店长', phone: '021-6288-1037', note: '商场档口,刀版需留 3mm 出血', createdAt: Date.now() }],
    projects: [project]
  };
}

const persisted = load(STORAGE_KEYS.projects, null);
const initial = persisted ?? seedData();
if (!persisted) save(STORAGE_KEYS.projects, initial);

const [state, setState] = createStore({
  view: 'projects', // projects | editor | review | clients
  clients: initial.clients,
  projects: initial.projects,
  activeProjectId: null,
  reviewVersionId: null,
  draft: null,
  selection: { shapeIds: [], activeShapeId: null, nodeIndex: null },
  tool: 'select',
  guides: [],
  penDraft: null,
  historyDepth: 0,
  redoDepth: 0,
  diffVersionId: null // 编辑器中叠加对比的版本
});

// 非响应式历史栈
let undoStack = [];
let redoStack = [];
let interactionSnap = null;

function persist() {
  save(STORAGE_KEYS.projects, { clients: state.clients, projects: state.projects });
}

function activeProject() {
  return state.projects.find((p) => p.id === state.activeProjectId) || null;
}

// 仅快照形状/图层/设置,批注独立保留
function docSnapshot() {
  const d = state.draft;
  return { shapes: deepClone(d.shapes), layers: deepClone(d.layers), settings: deepClone(d.settings) };
}
function restoreSnapshot(snap) {
  setState('draft', produce((d) => {
    d.shapes = deepClone(snap.shapes);
    d.layers = deepClone(snap.layers);
    d.settings = deepClone(snap.settings);
  }));
}

function snapshot() {
  undoStack.push(docSnapshot());
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack = [];
  setState({ historyDepth: undoStack.length, redoDepth: 0 });
}

// 交互开始/结束:拖动只在开始时存一次快照,结束统一入栈
function beginInteraction() {
  if (!interactionSnap) interactionSnap = docSnapshot();
}
function endInteraction() {
  if (!interactionSnap) return;
  undoStack.push(interactionSnap);
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  interactionSnap = null;
  redoStack = [];
  setState({ historyDepth: undoStack.length, redoDepth: 0 });
}

function undo() {
  const snap = undoStack.pop();
  if (!snap) return;
  redoStack.push(docSnapshot());
  restoreSnapshot(snap);
  setState({ historyDepth: undoStack.length, redoDepth: redoStack.length, selection: { shapeIds: [], activeShapeId: null, nodeIndex: null }, guides: [] });
}

function redo() {
  const snap = redoStack.pop();
  if (!snap) return;
  undoStack.push(docSnapshot());
  restoreSnapshot(snap);
  setState({ historyDepth: undoStack.length, redoDepth: redoStack.length, selection: { shapeIds: [], activeShapeId: null, nodeIndex: null }, guides: [] });
}

// ---------- 导航 ----------
function go(view) {
  setState({ view, guides: [], penDraft: null });
}
function openEditor(projectId) {
  const p = state.projects.find((x) => x.id === projectId);
  if (!p) return;
  undoStack = []; redoStack = [];
  setState({
    view: 'editor', activeProjectId: projectId, draft: deepClone(p.draftDoc),
    selection: { shapeIds: [], activeShapeId: null, nodeIndex: null },
    tool: 'select', reviewVersionId: null, diffVersionId: null,
    historyDepth: 0, redoDepth: 0
  });
}
function saveDraft() {
  const p = activeProject();
  if (!p || !state.draft) return;
  setState('projects', (ps) => ps.map((x) => (x.id === p.id ? { ...x, draftDoc: deepClone(state.draft) } : x)));
  persist();
}
function closeEditor() {
  saveDraft();
  setState({ view: 'projects', activeProjectId: null, draft: null, guides: [], penDraft: null });
}
function openReview(projectId, versionId) {
  setState({ view: 'review', activeProjectId: projectId, reviewVersionId: versionId, tool: 'select', guides: [], penDraft: null });
}

// ---------- 客户 ----------
function saveClient(client) {
  setState('clients', produce((list) => {
    const i = list.findIndex((c) => c.id === client.id);
    if (i >= 0) list[i] = { ...list[i], ...client };
    else list.push({ ...client, id: client.id || uid('cli'), createdAt: Date.now() });
  }));
  persist();
}
function deleteClient(id) {
  setState('clients', (list) => list.filter((c) => c.id !== id));
  persist();
}

// ---------- 方案 ----------
function createProject(data) {
  const doc = emptyDoc();
  const project = {
    id: uid('prj'),
    clientId: data.clientId,
    name: data.name,
    festival: data.festival || '',
    deliveryDate: data.deliveryDate || null,
    createdAt: Date.now(),
    finalVersionId: null,
    draftDoc: doc,
    versions: []
  };
  setState('projects', (ps) => [project, ...ps]);
  persist();
  return project.id;
}
function updateProjectMeta(id, patch) {
  setState('projects', (ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  persist();
}
function deleteProject(id) {
  setState('projects', (ps) => ps.filter((p) => p.id !== id));
  persist();
}

// ---------- 版本 ----------
function annotationStats(annotations) {
  const open = annotations.filter((a) => a.status !== 'resolved').length;
  const resolved = annotations.length - open;
  return { total: annotations.length, open, resolved };
}

function submitVersion(label, note) {
  const p = activeProject();
  if (!p) return null;
  saveDraft();
  // 继承上一版未清零批注
  const last = p.versions[p.versions.length - 1];
  const carried = last
    ? last.doc.annotations.filter((a) => a.status !== 'resolved').map((a) => ({ ...deepClone(a), carriedFrom: last.id, replies: [] }))
    : [];
  const version = {
    id: uid('ver'),
    label: label || `v${p.versions.length + 1}`,
    note: note || '',
    author: '制作方',
    createdAt: Date.now(),
    doc: deepClone(state.draft),
    annotations: carried
  };
  version.doc.annotations = carried;
  setState('projects', (ps) => ps.map((x) => x.id === p.id ? { ...x, versions: [...x.versions, version] } : x));
  persist();
  return version;
}

function getVersion(projectId, versionId) {
  const p = state.projects.find((x) => x.id === projectId);
  return p?.versions.find((v) => v.id === versionId) || null;
}

function finalizeVersion(versionId) {
  const p = activeProject();
  const v = p?.versions.find((x) => x.id === versionId);
  if (!v) return { ok: false, msg: '版本不存在' };
  const stats = annotationStats(v.doc.annotations);
  if (stats.open > 0) return { ok: false, msg: `仍有 ${stats.open} 条批注未清零,不能定稿` };
  setState('projects', (ps) => ps.map((x) => x.id === p.id ? { ...x, finalVersionId: versionId } : x));
  persist();
  return { ok: true };
}

// ---------- 批注(作用于评审版本) ----------
function addAnnotation(versionId, ann) {
  setState('projects', (ps) => ps.map((p) => p.id !== state.activeProjectId ? p : {
    ...p,
    versions: p.versions.map((v) => {
      if (v.id !== versionId) return v;
      const annotations = [...v.doc.annotations, {
        id: uid('ann'), type: ann.type, x: ann.x, y: ann.y, points: ann.points || null,
        text: ann.text, author: '审核人', createdAt: Date.now(), status: 'open', replies: []
      }];
      return { ...v, doc: { ...v.doc, annotations } };
    })
  }));
  persist();
}
function replyAnnotation(versionId, annId, text, author = '制作方') {
  setState('projects', (ps) => ps.map((p) => p.id !== state.activeProjectId ? p : {
    ...p,
    versions: p.versions.map((v) => {
      if (v.id !== versionId) return v;
      const annotations = v.doc.annotations.map((a) => a.id !== annId ? a : {
        ...a,
        status: 'replied',
        replies: [...a.replies, { id: uid('rep'), author, text, at: Date.now() }]
      });
      return { ...v, doc: { ...v.doc, annotations } };
    })
  }));
  persist();
}
function resolveAnnotation(versionId, annId) {
  setState('projects', (ps) => ps.map((p) => p.id !== state.activeProjectId ? p : {
    ...p,
    versions: p.versions.map((v) => {
      if (v.id !== versionId) return v;
      const annotations = v.doc.annotations.map((a) => a.id !== annId ? a : { ...a, status: 'resolved' });
      return { ...v, doc: { ...v.doc, annotations } };
    })
  }));
  persist();
}

// ---------- 图元操作 ----------
function isShapeEditable(shape) {
  if (shape.locked) return false;
  const layers = state.draft.layers;
  let lid = shape.parentId;
  while (lid) {
    const l = layers.find((x) => x.id === lid);
    if (!l) break;
    if (l.locked || l.visible === false) return false;
    lid = l.parentId;
  }
  return true;
}

function addShape(shape, select = true) {
  snapshot();
  setState('draft', 'shapes', (s) => [...s, shape]);
  if (select) setState('selection', { shapeIds: [shape.id], activeShapeId: shape.id, nodeIndex: null });
}

function addShapes(shapes) {
  snapshot();
  setState('draft', 'shapes', (s) => [...s, ...shapes]);
  setState('selection', { shapeIds: shapes.map((x) => x.id), activeShapeId: shapes[0]?.id || null, nodeIndex: null });
}

function deleteSelection() {
  const ids = new Set(state.selection.shapeIds);
  if (!ids.size) return;
  snapshot();
  setState('draft', 'shapes', (s) => s.filter((x) => !ids.has(x.id)));
  setState('selection', { shapeIds: [], activeShapeId: null, nodeIndex: null });
}

function duplicateSelection() {
  const ids = new Set(state.selection.shapeIds);
  const copies = state.draft.shapes.filter((s) => ids.has(s.id)).map((s) => ({
    ...deepClone(s), id: uid('shp'), name: `${s.name}·副本`,
    points: s.points.map((pt) => ({ ...pt, x: pt.x + 12, y: pt.y + 12, in: pt.in ? { ...pt.in, x: pt.in.x + 12, y: pt.in.y + 12 } : null, out: pt.out ? { ...pt.out, x: pt.out.x + 12, y: pt.out.y + 12 } : null }))
  }));
  if (copies.length) addShapes(copies);
}

function mutateSelectedShapes(mutator) {
  const ids = new Set(state.selection.shapeIds);
  setState('draft', 'shapes', produce((list) => {
    for (const s of list) if (ids.has(s.id)) mutator(s);
  }));
}

function translateShapes(ids, dx, dy) {
  setState('draft', 'shapes', produce((list) => {
    for (const s of list) {
      if (!ids.has(s.id)) continue;
      for (const pt of s.points) {
        pt.x += dx; pt.y += dy;
        if (pt.in) { pt.in.x += dx; pt.in.y += dy; }
        if (pt.out) { pt.out.x += dx; pt.out.y += dy; }
      }
    }
  }));
}

function moveNode(shapeId, idx, x, y, handle) {
  setState('draft', 'shapes', produce((list) => {
    const s = list.find((z) => z.id === shapeId);
    if (!s) return;
    const pt = s.points[idx];
    if (handle === 'in') { pt.in = { x, y }; pt.seg = 'C'; return; }
    if (handle === 'out') { pt.out = { x, y }; pt.seg = 'C'; return; }
    const dx = x - pt.x, dy = y - pt.y;
    pt.x = x; pt.y = y;
    if (pt.in) { pt.in.x += dx; pt.in.y += dy; }
    if (pt.out) { pt.out.x += dx; pt.out.y += dy; }
  }));
}

function setNodeSegment(shapeId, idx, toCurve) {
  snapshot();
  setState('draft', 'shapes', produce((list) => {
    const s = list.find((z) => z.id === shapeId);
    if (!s) return;
    if (toCurve) {
      s.points[idx].seg = 'C';
      smoothHandles(s.points, idx);
    } else {
      const n = s.points.length;
      s.points[idx].seg = 'L';
      s.points[idx].out = null;
      s.points[(idx + 1) % n].in = null;
    }
  }));
}

function insertNodeOnSegment(shapeId, segIdx) {
  const s = state.draft.shapes.find((x) => x.id === shapeId);
  if (!s) return;
  const pts = insertNode(s, segIdx);
  if (!pts) return;
  snapshot();
  setState('draft', 'shapes', produce((list) => {
    list.find((z) => z.id === shapeId).points = pts;
  }));
  setState('selection', { shapeIds: [shapeId], activeShapeId: shapeId, nodeIndex: segIdx + 1 });
}

function deleteNodeAt(shapeId, idx) {
  const s = state.draft.shapes.find((x) => x.id === shapeId);
  if (!s || s.points.length <= 3) return;
  const pts = deleteNode(s, idx);
  if (!pts) return;
  snapshot();
  setState('draft', 'shapes', produce((list) => {
    list.find((z) => z.id === shapeId).points = pts;
  }));
  setState('selection', 'nodeIndex', null);
}

// ---------- 布尔运算 ----------
function applyBoolean(op) {
  const ids = state.selection.shapeIds;
  if (ids.length < 2) return { ok: false, msg: '请至少选择两个闭合路径' };
  const shapes = state.draft.shapes.filter((s) => ids.includes(s.id));
  if (shapes.some((s) => s.closed === false)) return { ok: false, msg: '布尔运算要求闭合路径' };
  let groups;
  try {
    groups = op === 'deoverlap' ? removeOverlapEdges(shapes) : booleanOp(shapes, op);
  } catch (e) {
    return { ok: false, msg: `运算失败:${e.message}` };
  }
  if (!groups.length) return { ok: false, msg: '运算结果为空(差集可能完全相减)' };
  snapshot();
  const base = shapes[0];
  const labelMap = { union: '并集', subtract: '差集', intersect: '交集', xor: '异或', deoverlap: '去重叠' };
  const made = groups.map((pts, i) => createShape({
    name: `${base.name}·${labelMap[op]}${groups.length > 1 ? ` ${i + 1}` : ''}`,
    materialCode: base.materialCode,
    fill: base.fill, stroke: base.stroke, parentId: base.parentId,
    points: pts, type: base.type
  }));
  const idset = new Set(ids);
  setState('draft', 'shapes', produce((list) => {
    for (let i = list.length - 1; i >= 0; i--) {
      if (idset.has(list[i].id)) list.splice(i, 1);
    }
    list.push(...made);
  }));
  setState('selection', { shapeIds: made.map((m) => m.id), activeShapeId: made[0].id, nodeIndex: null });
  return { ok: true, count: made.length };
}

// ---------- 图层 ----------
function addLayer(name) {
  snapshot();
  const layer = { id: uid('lyr'), name: name || `图层 ${state.draft.layers.length + 1}`, parentId: null, locked: false, visible: true };
  setState('draft', 'layers', (l) => [...l, layer]);
  return layer.id;
}
function updateLayer(id, patch) {
  setState('draft', 'layers', produce((list) => {
    const l = list.find((x) => x.id === id);
    if (l) Object.assign(l, patch);
  }));
}
function deleteLayer(id) {
  const layer = state.draft.layers.find((l) => l.id === id);
  if (!layer) return;
  snapshot();
  const childLayers = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const l of state.draft.layers) {
      if (l.parentId && childLayers.has(l.parentId) && !childLayers.has(l.id)) { childLayers.add(l.id); grew = true; }
    }
  }
  setState('draft', produce((d) => {
    const removeLayerIds = new Set(childLayers);
    d.layers = d.layers.filter((l) => !removeLayerIds.has(l.id));
    d.shapes = d.shapes.filter((s) => !removeLayerIds.has(s.parentId));
  }));
  setState('selection', { shapeIds: [], activeShapeId: null, nodeIndex: null });
}
function moveToLayer(shapeIds, layerId) {
  snapshot();
  const ids = new Set(shapeIds);
  setState('draft', 'shapes', produce((list) => {
    for (const s of list) if (ids.has(s.id)) s.parentId = layerId;
  }));
}
function bringForward(shapeIds) {
  snapshot();
  const ids = new Set(shapeIds);
  setState('draft', 'shapes', produce((list) => {
    for (let i = list.length - 2; i >= 0; i--) {
      if (ids.has(list[i].id) && !ids.has(list[i + 1].id)) {
        const [x] = list.splice(i, 1);
        list.splice(i + 1, 0, x);
      }
    }
  }));
}
function sendBackward(shapeIds) {
  snapshot();
  const ids = new Set(shapeIds);
  setState('draft', 'shapes', produce((list) => {
    for (let i = 1; i < list.length; i++) {
      if (ids.has(list[i].id) && !ids.has(list[i - 1].id)) {
        const [x] = list.splice(i, 1);
        list.splice(i - 1, 0, x);
      }
    }
  }));
}

function setTool(tool) {
  setState({ tool, guides: [], penDraft: null, selection: tool === 'select' ? state.selection : { shapeIds: state.selection.shapeIds, activeShapeId: state.selection.activeShapeId, nodeIndex: null } });
}
function setSelection(sel) {
  setState('selection', (cur) => ({ ...cur, ...sel }));
}
function setGuides(guides) {
  setState('guides', guides);
}
function setPenDraft(d) {
  setState('penDraft', d);
}
function updateSettings(patch) {
  setState('draft', 'settings', produce((s) => Object.assign(s, patch)));
}
function setDiffVersion(id) {
  setState('diffVersionId', id);
}

export const store = {
  state,
  go, openEditor, closeEditor, saveDraft, openReview,
  saveClient, deleteClient,
  createProject, updateProjectMeta, deleteProject,
  submitVersion, getVersion, finalizeVersion, annotationStats,
  addAnnotation, replyAnnotation, resolveAnnotation,
  addShape, addShapes, deleteSelection, duplicateSelection,
  mutateSelectedShapes, translateShapes, moveNode, setNodeSegment,
  insertNodeOnSegment, deleteNodeAt,
  applyBoolean,
  addLayer, updateLayer, deleteLayer, moveToLayer, bringForward, sendBackward,
  setTool, setSelection, setGuides, setPenDraft, updateSettings, setDiffVersion,
  snapshot, undo, redo, beginInteraction, endInteraction,
  isShapeEditable,
  activeProject
};
