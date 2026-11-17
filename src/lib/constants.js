// 全局常量与工具
export const STORAGE_KEYS = {
  projects: 'fvs.projects.v1',
  clients: 'fvs.clients.v1',
  meta: 'fvs.meta.v1'
};

export const TOOLS = {
  SELECT: 'select',
  PEN: 'pen',
  NODE: 'node',
  RECT: 'rect',
  ELLIPSE: 'ellipse',
  HAND: 'hand',
  ANN_POINT: 'ann_point',
  ANN_AREA: 'ann_area'
};

export const SHAPE_TYPES = {
  LEAF: 'leaf',
  PETAL: 'petal',
  CUSTOM: 'custom'
};

let _id = 0;
export function uid(prefix = 'id') {
  _id += 1;
  return `${prefix}_${Date.now().toString(36)}_${_id}_${Math.floor(Math.random() * 1e4).toString(36)}`;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

// 文档全部为纯 JSON 数据;不能用 structuredClone —— Solid store 对象是 Proxy,会抛 DataCloneError
export function deepClone(o) {
  return JSON.parse(JSON.stringify(o));
}

export function round2(v) {
  return Math.round(v * 100) / 100;
}

export function fmtDate(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDay(ts) {
  if (!ts) return '—';
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
