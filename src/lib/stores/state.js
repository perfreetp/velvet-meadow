// 全局状态:图层、选择、框选、角色、后台版本与查看统计。
import { writable } from 'svelte/store';
import { LAYERS } from '../data/catalog';

const load = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v ?? d;
  } catch {
    return d;
  }
};

export const layerState = writable(LAYERS.map(() => ({ visible: true, alpha: 1 })));
export const hoverId = writable(-1);
export const selectedId = writable(-1);
export const compareIds = writable([]);
export const boxMode = writable(false);
export const role = writable('operator'); // operator=运营 / supervisor=技术主管
export const adminOpen = writable(false);
export const dataVersion = writable(0); // 发布后 +1,驱动图层计数等刷新
export const visibleStats = writable({ parts: 0, draws: 0 });

// ---- 查看统计(查看次数 / 停留时长) ----
export const analytics = writable(load('imcat.analytics', {}));

export function recordView(id) {
  if (id < 0) return;
  analytics.update((a) => {
    const e = a[id] || { views: 0, dwell: 0 };
    e.views += 1;
    a[id] = e;
    return a;
  });
}

let pendingDwell = {};
export function recordDwell(id, sec) {
  if (id < 0 || !isFinite(sec) || sec <= 0) return;
  pendingDwell[id] = (pendingDwell[id] || 0) + sec;
}
export function flushDwell() {
  const keys = Object.keys(pendingDwell);
  if (!keys.length) return;
  analytics.update((a) => {
    for (const k of keys) {
      const e = a[k] || { views: 0, dwell: 0 };
      e.dwell += pendingDwell[k];
      a[k] = e;
    }
    return a;
  });
  pendingDwell = {};
}

// ---- 后台:草稿 / 版本 / 已发布变更 ----
export const draftChanges = writable(load('imcat.draft', {})); // {partId: {layer?, name?, material?}}
export const versions = writable(load('imcat.versions', [])); // [{id, ts, by, status, changes}]
export const publishedChanges = writable(load('imcat.published', [])); // [{partId, ...changes}]

export function submitVersion() {
  let changes;
  draftChanges.subscribe((d) => (changes = d))();
  if (!Object.keys(changes).length) return false;
  versions.update((v) => [
    ...v,
    {
      id: 'V' + (v.length + 2),
      ts: new Date().toLocaleString('zh-CN'),
      by: '运营',
      status: 'pending',
      changes,
    },
  ]);
  draftChanges.set({});
  return true;
}

export function publishVersion(ver) {
  ver.status = 'published';
  versions.update((v) => [...v]);
  const list = Object.entries(ver.changes).map(([partId, ch]) => ({ partId: +partId, ...ch }));
  publishedChanges.update((p) => [...p, ...list]);
  return list;
}

export function rejectVersion(ver) {
  ver.status = 'rejected';
  versions.update((v) => [...v]);
}

// ---- 持久化 ----
if (typeof localStorage !== 'undefined') {
  analytics.subscribe((a) => localStorage.setItem('imcat.analytics', JSON.stringify(a)));
  versions.subscribe((v) => localStorage.setItem('imcat.versions', JSON.stringify(v)));
  draftChanges.subscribe((d) => localStorage.setItem('imcat.draft', JSON.stringify(d)));
  publishedChanges.subscribe((p) => localStorage.setItem('imcat.published', JSON.stringify(p)));
}
