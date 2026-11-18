import { createStore, produce } from 'solid-js/store';
import { createSignal } from 'solid-js';
import { sampleScene, makeLight, makeBuilding, sceneBounds, uid } from '../engine/scene.js';
import { SOLAR_PRESETS } from '../engine/solar.js';

const initial = sampleScene();

export const [scene, setScene] = createStore({
  buildings: initial.buildings,
  lights: initial.lights,
  blocks: initial.blocks,
  bounds: initial.bounds,
});

// 仿真参数
export const [sim, setSim] = createStore({
  hour: 20,
  solarPreset: 'summer',
  lat: 39.9042,
  lng: 116.4074,
  cell: 1,
  exposure: 1,
  gamma: 2.2,
  includeSun: true,
  darkThreshold: 20,
});

// 图层开关
export const [layers, setLayers] = createStore({
  buildings: true,
  lightSpots: true,
  heatmap: false,
  grid: true,
  darkOverlay: true,
  annotations: true,
});

// 工具与选中
export const [tool, setTool] = createSignal('select'); // select | building | street | courtyard | wallwash | pan | annotate
export const [selection, setSelection] = createStore({ kind: null, id: null });
export const [drawing, setDrawing] = createStore({ active: false, points: [] });

// 计算结果与状态
export const [result, setResult] = createSignal(null);
export const [computing, setComputing] = createSignal(false);
export const [stats, setStats] = createSignal(null);

// 后台工作流
export const [plans, setPlans] = createSignal([]);
export const [currentPlan, setCurrentPlan] = createSignal(null); // 已保存的方案元数据
export const [reviews, setReviews] = createSignal([]);
export const [annotations, setAnnotations] = createSignal([]);
export const [readOnly, setReadOnly] = createSignal(false);

// 通用提示
export const [toast, setToast] = createSignal(null);
let toastTimer = null;
export function showToast(msg, kind = 'info') {
  setToast({ msg, kind });
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => setToast(null), 3200);
}

export function solarDate() {
  const p = SOLAR_PRESETS[sim.solarPreset];
  return { month: p.month, day: p.day };
}

// ---------- 场景变更 ----------
export function addBuildingAt(x, y) {
  const b = makeBuilding(x, y, scene.blocks[0]?.id || 'B1');
  setScene('buildings', (list) => [...list, b]);
  setSelection({ kind: 'building', id: b.id });
  setTool('select');
  return b;
}

export function addLightAt(type, x, y) {
  const light = makeLight(type, x, y);
  setScene('lights', (list) => [...list, light]);
  setSelection({ kind: 'light', id: light.id });
  setTool('select');
  return light;
}

export function updateSelected(patch) {
  const { kind, id } = selection;
  if (!id) return;
  const key = kind === 'light' ? 'lights' : 'buildings';
  setScene(key, (list) => list.map((it) => (it.id === id ? { ...it, ...patch } : it)));
}

export function removeSelected() {
  const { kind, id } = selection;
  if (!id || readOnly()) return;
  if (kind === 'light') setScene('lights', (list) => list.filter((l) => l.id !== id));
  if (kind === 'building') setScene('buildings', (list) => list.filter((b) => b.id !== id));
  setSelection({ kind: null, id: null });
}

export function moveEntity(kind, id, x, y) {
  const key = kind === 'light' ? 'lights' : 'buildings';
  setScene(key, (list) => list.map((it) => (it.id === id ? { ...it, x, y } : it)));
}

export function moveBuildingVertex(buildingId, index, x, y) {
  setScene('buildings', (b) => b.id === buildingId,
    'polygon', (poly) => poly.map((p, i) => (i === index ? { x, y } : p)));
}

export function loadScene(next) {
  setScene({
    buildings: next.buildings || [],
    lights: next.lights || [],
    blocks: next.blocks || [],
    bounds: next.bounds || sceneBounds(next.buildings || []),
  });
  setSelection({ kind: null, id: null });
}

export function replaceAll(payload) {
  if (payload.buildings) setScene('buildings', payload.buildings);
  if (payload.lights) setScene('lights', payload.lights);
  if (payload.blocks) setScene('blocks', payload.blocks);
  if (payload.bounds) setScene('bounds', payload.bounds);
  else setScene('bounds', sceneBounds(payload.buildings || scene.buildings));
  setSelection({ kind: null, id: null });
}

export function snapshotScene() {
  return {
    buildings: JSON.parse(JSON.stringify(scene.buildings)),
    lights: JSON.parse(JSON.stringify(scene.lights)),
    blocks: JSON.parse(JSON.stringify(scene.blocks)),
    bounds: JSON.parse(JSON.stringify(scene.bounds)),
  };
}

export { uid };
