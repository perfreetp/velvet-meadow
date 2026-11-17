// 编辑现场：全局单例 runes store，编排体素场、历史、层、工具、死角、版本与审批
// $state 深度代理带信号符号，structuredClone/Worker/IndexedDB 都不能直接吃，
// 跨边界前用显式字段映射脱壳为普通对象。
function plainDims(d) {
  return { nx: d.nx, ny: d.ny, nz: d.nz };
}
function plainStats(s) {
  if (!s) return null;
  return {
    quadCount: s.quadCount,
    trianglesBefore: s.trianglesBefore,
    trianglesAfter: s.trianglesAfter,
    verticesAfter: s.verticesAfter,
    decimated: s.decimated,
    collapses: s.collapses,
    angleThresholdDeg: s.angleThresholdDeg,
    triLimit: s.triLimit
  };
}
function plainProject(p) {
  return {
    id: p.id, code: p.code, moldNo: p.moldNo, materialNo: p.materialNo,
    material: p.material, dims: plainDims(p.dims), author: p.author,
    status: p.status, createdAt: p.createdAt, updatedAt: p.updatedAt, archivedAt: p.archivedAt
  };
}
import {
  createField, cloneField, stampDisc, setV, idx, getV, inside,
  encodeRLE, decodeRLE, countVoxels, fieldBoundsMm
} from './voxel/core.js';
import { History } from './voxel/history.js';
import { analyzeDeadAngles, deadByLayer } from './voxel/deadangle.js';
import { normRect, copyRegion, pasteRegion } from './voxel/selection.js';
import { worker3d } from './voxel/worker3d.js';
import * as db from './voxel/db.js';

const ROLE_KEY = 'mvs.role';

export const editor = $state({
  // 项目
  project: null,
  versions: [],
  // 场
  field: null,
  history: null,
  voxelCount: 0,
  // 层
  currentZ: 0,
  hiddenLayers: new Set(),
  lockedLayers: new Set(),
  // 工具
  tool: 'brush',           // brush | eraser | select
  brushRadius: 3,
  mirrorX: false,
  mirrorY: false,
  // 选择与剪贴板
  selectStart: null,
  selectRect: null,
  selectZ0: 0,
  selectZ1: 0,
  clipboard: null,
  pasteOffset: { x: 0, y: 0, z: 0 },
  // 死角
  deadMask: null,
  deadLayerCounts: null,
  deadOn: false,
  toolRadiusMm: 3,
  toolLengthMm: 30,
  // 差异对比
  compareVersion: null,
  compareOn: false,
  // UI
  role: localStorage.getItem(ROLE_KEY) || 'technician',
  busy: '',
  toast: '',
  angleThresholdDeg: 15,
  camera3d: null,
  // 2D 视图
  zoom: 14,
  pan: { x: 0, y: 0 }
});

let toastTimer = null;
export function notify(text, ms = 2600) {
  editor.toast = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (editor.toast = ''), ms);
}

export function setRole(role) {
  editor.role = role;
  localStorage.setItem(ROLE_KEY, role);
}

// ---------- 项目与毛坯 ----------

export async function newProject(input) {
  const nx = Math.round(input.sizeX / 0.5);
  const ny = Math.round(input.sizeY / 0.5);
  const nz = Math.round(input.sizeZ / 0.5);
  const project = {
    id: `prj_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`,
    code: input.code,
    moldNo: input.moldNo.trim(),
    materialNo: input.materialNo.trim(),
    material: input.material,
    dims: { nx, ny, nz },
    author: input.author || '工艺员',
    status: 'editing',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    archivedAt: null
  };
  await db.putProject(project);
  await openProject(project.id);
}

export async function openProject(id) {
  const project = await db.getProject(id);
  if (!project) throw new Error('项目不存在');
  const versions = await db.listVersions(id);
  resetForProject(project, versions);
  if (versions.length) await loadVersion(versions[0].id, { refit: true });
  else notify(`项目 ${project.moldNo} 已建档（编号 ${project.code}）`);
}

function resetForProject(project, versions) {
  editor.project = project;
  editor.versions = versions;
  editor.field = createField(project.dims.nx, project.dims.ny, project.dims.nz);
  editor.history = new History(editor.field);
  editor.currentZ = project.dims.nz - 1;
  editor.hiddenLayers = new Set();
  editor.lockedLayers = new Set();
  editor.voxelCount = 0;
  editor.selectRect = null;
  editor.clipboard = null;
  editor.deadMask = null;
  editor.deadOn = false;
  editor.compareOn = false;
  editor.compareVersion = null;
  editor.busy = '初始化三维视图…';
}

// ---------- 编辑操作 ----------

export function setTool(tool) {
  editor.tool = tool;
  if (tool !== 'select') editor.selectRect = null;
}

function layerWritable(z) {
  return !editor.hiddenLayers.has(z) && !editor.lockedLayers.has(z);
}

export function paintAt(cx, cy, value) {
  const z = editor.currentZ;
  if (!layerWritable(z)) return;
  stampDisc(editor.field, cx, cy, z, editor.brushRadius, value, editor.mirrorX, editor.mirrorY);
}

export function commitStroke(label) {
  editor.history.commit(editor.field, label);
  afterFieldChanged();
}

export function beginSelect(x, y) {
  editor.selectStart = { x, y };
  editor.selectZ0 = editor.currentZ;
  editor.selectZ1 = editor.currentZ;
  editor.selectRect = { x0: x, y0: y, x1: x, y1: y };
}

export function moveSelect(x, y) {
  if (!editor.selectStart) return;
  editor.selectRect = normRect(editor.selectStart, { x, y });
}

export function endSelect() {
  editor.selectStart = null;
}

export function setSelectDepth(z0, z1) {
  editor.selectZ0 = z0;
  editor.selectZ1 = z1;
}

export function copySelection() {
  if (!editor.selectRect) return notify('请先框选区域');
  editor.clipboard = copyRegion(editor.field, editor.selectRect, editor.selectZ0, editor.selectZ1);
  notify(`已复制 ${editor.clipboard.voxels.length} 个体素`);
}

export function pasteClipboard(mode = 'union') {
  if (!editor.clipboard) return notify('剪贴板为空');
  const o = editor.pasteOffset;
  const n = pasteRegion(editor.field, editor.clipboard, [o.x, o.y, o.z], mode);
  editor.history.commit(editor.field, `粘贴（偏移 ${o.x},${o.y},${o.z}）`);
  afterFieldChanged();
  notify(`粘贴完成，写入 ${n} 格`);
}

export function undo() {
  const label = editor.history.undo(editor.field);
  if (label != null) { afterFieldChanged(); notify(`撤销：${label}`); }
}

export function redo() {
  const label = editor.history.redo(editor.field);
  if (label != null) { afterFieldChanged(); notify(`重做：${label}`); }
}

function afterFieldChanged() {
  editor.voxelCount = countVoxels(editor.field);
  if (editor.deadMask) runDeadAnalysis(false);
  sync3D();
  if (editor.compareOn) refreshCompare();
}

// ---------- 层 ----------

export function toggleHide(z) {
  const s = editor.hiddenLayers;
  s.has(z) ? s.delete(z) : s.add(z);
  editor.hiddenLayers = new Set(s);
}

export function toggleLock(z) {
  const s = editor.lockedLayers;
  s.has(z) ? s.delete(z) : s.add(z);
  editor.lockedLayers = new Set(s);
}

export function gotoLayer(z) {
  editor.currentZ = Math.max(0, Math.min(editor.field.nz - 1, z));
}

// ---------- 死角 ----------

export function runDeadAnalysis(announce = true) {
  const r = analyzeDeadAngles(editor.field, editor.toolRadiusMm, editor.toolLengthMm);
  editor.deadMask = r.mask;
  editor.deadLayerCounts = deadByLayer(editor.field, r.mask);
  editor.deadInfo = { dead: r.dead, cavity: r.cavity };
  if (editor.deadOn) worker3d.dead(true, r.mask).then(() => (editor.busy = ''));
  if (announce) notify(`死角分析：${r.dead}/${r.cavity} 格刀具不可达`);
}

export function toggleDeadOverlay(on) {
  editor.deadOn = on;
  if (on) {
    if (!editor.deadMask) runDeadAnalysis(false);
    // $state 代理不能结构化克隆，传普通 Uint8Array 副本
    worker3d.dead(true, new Uint8Array(editor.deadMask)).then(() => (editor.busy = ''));
  } else {
    worker3d.dead(false).then(() => (editor.busy = ''));
  }
}

// ---------- 三维同步 ----------

function applyFieldResponse(msg) {
  editor.busy = '';
  if (msg?.stats) {
    editor.lastStats = msg.stats;
    if (msg.camera) editor.camera3d = msg.camera;
  }
}

let syncQueued = false;
let syncTimer = null;
export function sync3D(refit = false) {
  if (!editor.field) return;
  // refit（重置视角/首次进场）立即发送，不被防抖吞掉
  if (refit) {
    clearTimeout(syncTimer);
    syncQueued = false;
    editor.busy = '同步三维…';
    const rle = encodeRLE(editor.field);
    worker3d.field(rle, plainDims(editor.project.dims), editor.angleThresholdDeg, true).then(applyFieldResponse);
    return;
  }
  if (syncQueued) return;
  syncQueued = true;
  editor.busy = '同步三维…';
  syncTimer = setTimeout(() => {
    syncQueued = false;
    const rle = encodeRLE(editor.field);
    worker3d.field(rle, plainDims(editor.project.dims), editor.angleThresholdDeg, false).then(applyFieldResponse);
  }, 120);
}

worker3d.onEvent((msg) => {
  if (msg.type === 'busy') editor.busy = msg.label;
  if (msg.type === 'idle') editor.busy = '';
  if (msg.type === 'error') { editor.busy = ''; notify('三维任务失败：' + msg.message); }
  // stats/obj/cameraState 是带 reqId 的应答，走各调用处的 Promise；这里只处理主动广播
  if (msg.type === 'diffStats') editor.diffInfo = { added: msg.addedCount, removed: msg.removedCount };
});

// ---------- 版本建档 ----------

export async function saveVersion(label) {
  if (!editor.project) return;
  const nextNo = (editor.versions[0]?.version || 0) + 1;
  const snapshotBytes = encodeRLE(editor.field);
  const doc = await db.putVersion({
    projectId: editor.project.id,
    version: nextNo,
    label: label || `V${nextNo} 存档`,
    dims: plainDims(editor.project.dims),
    snapshot: snapshotBytes,
    author: editor.role === 'leader' ? '组长' : (editor.project.author || '工艺员'),
    status: 'draft',
    stats: plainStats(editor.lastStats)
  });
  editor.versions = [doc, ...editor.versions];
  editor.project.status = 'editing';
  await db.putProject(plainProject(editor.project));
  notify(`已建档 V${nextNo}`);
  return doc;
}

export async function submitVersion(versionId) {
  const list = await db.listVersions(editor.project.id);
  const found = list.find((v) => v.id === versionId);
  // db.listVersions 已返回 IDB 普通对象；显式重映射确保无代理残留
  const doc = {
    id: found.id, projectId: found.projectId, version: found.version, label: found.label,
    dims: { ...found.dims }, snapshot: found.snapshot, author: found.author,
    status: 'submitted', stats: found.stats ? { ...found.stats } : null,
    createdAt: found.createdAt, reviewComment: found.reviewComment || '', reviewedAt: found.reviewedAt
  };
  const saved = await db.putVersion(doc);
  editor.versions = list.map((v) => (v.id === versionId ? saved : v));
  notify(`V${doc.version} 已提交，等待组长审批`);
}

export async function reviewVersion(versionId, decision, comment) {
  const doc = await db.reviewVersion(versionId, decision, comment);
  editor.versions = await db.listVersions(editor.project.id);
  if (decision === 'approve') notify(`V${doc.version} 已通过`);
  else notify(`V${doc.version} 已退回，意见已挂载`);
}

export async function loadVersion(id, { refit = false } = {}) {
  const doc = await db.getVersion(id);
  editor.field = decodeRLE(doc.snapshot, doc.dims.nx, doc.dims.ny, doc.dims.nz);
  editor.history = new History(editor.field);
  editor.voxelCount = countVoxels(editor.field);
  editor.currentZ = editor.field.nz - 1;
  editor.deadMask = null;
  editor.deadOn = false;
  editor.loadedVersion = doc;
  sync3D(refit);
  notify(`已调出 V${doc.version}（${doc.label}）`);
}

// ---------- 差异对比（上一版叠加） ----------

export async function toggleCompare(on) {
  editor.compareOn = on;
  if (!on) {
    worker3d.diff(false);
    return;
  }
  await refreshCompare();
}

async function refreshCompare() {
  // 当前现场 vs 上一版：rleA=上一版，rleB=当前；added=当前新增(绿)，removed=已删除(橙)
  const prev = editor.versions[0];
  if (!prev) return notify('尚无历史版本可对比');
  const rleA = new Uint8Array(prev.snapshot);
  const rleB = encodeRLE(editor.field);
  editor.compareVersion = prev;
  worker3d.diff(true, rleA, rleB);
}

// ---------- 归档 ----------

export async function archiveCurrent(on) {
  editor.project = await db.archiveProject(editor.project.id, on);
  notify(on ? '项目已归档，可在归档库检索' : '已取消归档');
}

export async function exportCurrentOBJ() {
  const meta = {
    moldNo: editor.project.moldNo,
    materialNo: editor.project.materialNo,
    version: editor.loadedVersion?.version ?? 'WIP',
    nx: editor.project.dims.nx,
    ny: editor.project.dims.ny,
    nz: editor.project.dims.nz
  };
  editor.busy = '导出 OBJ…';
  const msg = await worker3d.exportOBJ(meta);
  editor.busy = '';
  const b = fieldBoundsMm(editor.field);
  const blob = new Blob([msg.text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${editor.project.moldNo}_V${meta.version}_${b.x.toFixed(1)}x${b.y.toFixed(1)}x${b.z.toFixed(1)}.obj`;
  a.click();
  URL.revokeObjectURL(url);
  notify('OBJ 已导出（文件头含外形尺寸）');
}

export { cloneField, setV, idx, getV, inside, encodeRLE };
