import { reactive, watch } from 'vue'
import { sampleWorkpieces, calcStats } from './engine/lighting'

export const WORKSHOP = { w: 14, h: 9 }          // 车间平面(米)
export const CONVEYOR = { y: 4.5, x0: 0.8, x1: 13.2, z: 0.8 } // 输送链

const KEY = 'uv-curing-tool-v1'

export function defaultWorkItems() {
  return ['上件工位', '除尘/前处理', '底漆喷涂', '流平', 'UV固化', '下件检验']
    .map((name, i) => ({ id: 'w' + i, name, done: false }))
}

export function defaultParams() {
  return { shift: 'day', stdMin: 60, stdMax: 140, uStd: 0.7, surfaceZ: 0.35 }
}

// 沿输送链自动摆放工件
export function autoPlaceWorkpieces(scheme, n = 6) {
  const span = CONVEYOR.x1 - CONVEYOR.x0
  scheme.workpieces = []
  for (let i = 0; i < n; i++) {
    scheme.workpieces.push({
      id: 'wp' + Math.random().toString(36).slice(2, 7),
      name: '工件' + (i + 1),
      x: +(CONVEYOR.x0 + span * (i + 0.5) / n).toFixed(2),
      y: CONVEYOR.y,
      w: 0.9, d: 0.6, h: 0.35
    })
  }
}

export function defaultScheme() {
  const s = { lamps: [], workpieces: [], params: defaultParams() }
  autoPlaceWorkpieces(s, 6)
  return s
}

function seed() {
  const scheme = defaultScheme()
  scheme.lamps = [
    { id: 'L1', model: 'hg-1k', name: '高压汞灯管 1kW', x: 4.5, y: 4.5, z: 2.3, angle: 12, yaw: 90, power: 1000, range: 3.5, locked: false },
    { id: 'L2', model: 'hg-1k', name: '高压汞灯管 1kW', x: 7.0, y: 4.5, z: 2.3, angle: -12, yaw: 90, power: 1000, range: 3.5, locked: false },
    { id: 'L3', model: 'led-300', name: 'UV-LED线光源 300W', x: 9.5, y: 4.5, z: 1.8, angle: 0, yaw: 90, power: 300, range: 2.5, locked: false }
  ]
  const demo = {
    id: 'P-demo', name: '汽车内饰件UV固化线', customer: '华骏汽配', product: 'ABS内饰面板',
    qty: 12000, deadline: '2026-12-15', status: '设计中', rework: 1,
    createdAt: '2026-11-10 09:30',
    history: [
      { time: '2026-11-10 09:30', action: '客户下单', by: '客户' },
      { time: '2026-11-12 14:00', action: '提交审核', by: '制作员' },
      { time: '2026-11-13 10:20', action: '审核退回:固化段均匀度不足', by: '主管' }
    ],
    workItems: defaultWorkItems(),
    scheme,
    versions: []
  }
  // 预置两个版本,便于版本对比演示
  const v1lamps = scheme.lamps.slice(0, 2).map(l => ({ ...l, z: 2.6, angle: 0 }))
  const mkVer = (name, time, lamps) => {
    const snap = { lamps: JSON.parse(JSON.stringify(lamps)), workpieces: scheme.workpieces, params: scheme.params }
    const stats = calcStats(sampleWorkpieces(snap), snap.params)
    return { id: 'v' + name, name, time, snapshot: JSON.parse(JSON.stringify(snap)), stats, dark: 0, over: 0 }
  }
  demo.versions.push(mkVer('V1-初版两灯', '2026-11-11 16:40', v1lamps))
  demo.versions.push(mkVer('V2-补LED线光', '2026-11-14 11:05', scheme.lamps))
  return { role: 'maker', currentProjectId: 'P-demo', projects: [demo] }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) { /* 忽略损坏的缓存 */ }
  return null
}

export const store = reactive(load() || seed())

watch(store, () => {
  try { localStorage.setItem(KEY, JSON.stringify(store)) } catch (e) { /* 存储满时忽略 */ }
}, { deep: true })

export function currentProject() {
  return store.projects.find(p => p.id === store.currentProjectId) || null
}

export function log(project, action) {
  const roleName = { customer: '客户', maker: '制作员', supervisor: '主管' }[store.role] || store.role
  project.history.push({ time: new Date().toLocaleString('zh-CN', { hour12: false }), action, by: roleName })
}

export const STATUS_COLOR = {
  '已下单': '#64b5f6', '设计中': '#ffb74d', '待审核': '#ba68c8',
  '审核通过': '#81c784', '已交付': '#4db6ac'
}
