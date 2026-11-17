// 照度计算引擎:UV灯管分段线光源 + 余弦分布 + 平方反比 + 工件AABB遮挡(软阴影)
import { reactive, watch } from 'vue'

export const LAMP_LIBRARY = [
  { id: 'hg-1k',  name: '高压汞灯管 1kW',   length: 1.2, power: 1000, k: 0.10, m: 2.0, desc: '通用固化,光谱宽' },
  { id: 'hg-2k',  name: '高压汞灯管 2kW',   length: 1.6, power: 2000, k: 0.10, m: 2.0, desc: '大幅面高能量' },
  { id: 'led-300', name: 'UV-LED线光源 300W', length: 0.8, power: 300,  k: 0.17, m: 1.5, desc: '窄光谱,热辐射低' },
  { id: 'mh-500', name: '金属卤素灯 500W',  length: 1.0, power: 500,  k: 0.12, m: 2.2, desc: '铁灯,深层固化' }
]

export function lampModel(lamp) {
  return LAMP_LIBRARY.find(m => m.id === lamp.model) || LAMP_LIBRARY[0]
}

const SEG = 8 // 每根灯管分段数 → 软阴影

// 单个采样点 P={x,y,z} 处的辐照度 (mW/cm²,已标定)
export function pointIrradiance(lamp, P, boxes) {
  const psi = (lamp.yaw || 0) * Math.PI / 180
  const th = (lamp.angle || 0) * Math.PI / 180
  const Tx = Math.cos(psi), Ty = Math.sin(psi)              // 灯管轴向(平面)
  const Dx = -Math.sin(th) * Math.sin(psi)                  // 出射主方向
  const Dy = Math.sin(th) * Math.cos(psi)
  const Dz = -Math.cos(th)
  const model = lampModel(lamp)
  const len = model.length
  const segP = lamp.power / SEG
  let E = 0
  for (let i = 0; i < SEG; i++) {
    const s = (i + 0.5) / SEG - 0.5
    const S = { x: lamp.x + Tx * s * len, y: lamp.y + Ty * s * len, z: lamp.z }
    const vx = P.x - S.x, vy = P.y - S.y, vz = P.z - S.z
    const d2 = vx * vx + vy * vy + vz * vz
    if (d2 < 1e-8) continue
    const d = Math.sqrt(d2)
    const cosA = (Dx * vx + Dy * vy + Dz * vz) / d   // 与出射方向夹角余弦
    if (cosA <= 0) continue
    const cosI = -vz / d                              // 被照面(水平)入射余弦
    if (cosI <= 0) continue
    let e = segP * model.k * Math.pow(cosA, model.m) * cosI / d2
    if (lamp.range && d > lamp.range) {               // 超出有效照射距离后加速衰减
      const f = lamp.range / d
      e *= f * f
    }
    if (!occluded(S, P, boxes)) E += e                // 该分段被挡 → 贡献为0(分段→软阴影)
  }
  return E
}

// 线段 S→P 是否被任一工件盒遮挡( slab 法 )
function occluded(S, P, boxes) {
  for (const b of boxes) {
    const dx = P.x - S.x, dy = P.y - S.y, dz = P.z - S.z
    let t0 = 0.001, t1 = 0.999
    let ok = true
    const axes = [[S.x, dx, b.minx, b.maxx], [S.y, dy, b.miny, b.maxy], [S.z, dz, b.minz, b.maxz]]
    for (const [o, d, mn, mx] of axes) {
      if (Math.abs(d) < 1e-9) { if (o < mn || o > mx) { ok = false; break } continue }
      let ta = (mn - o) / d, tb = (mx - o) / d
      if (ta > tb) { const t = ta; ta = tb; tb = t }
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb)
      if (t0 > t1) { ok = false; break }
    }
    if (ok) return true
  }
  return false
}

export function workpieceBoxes(scheme) {
  return scheme.workpieces.map(wp => ({
    minx: wp.x - wp.w / 2, maxx: wp.x + wp.w / 2,
    miny: wp.y - wp.d / 2, maxy: wp.y + wp.d / 2,
    minz: 0.8, maxz: 0.8 + wp.h
  }))
}

export const AMBIENT = { day: 1.5, night: 0.15 } // 白班/夜班环境光(mW/cm²)

// 全车间平面网格照度(在照射面高度;工件占据处取工件顶面)
export function computeGrid(scheme, workshop) {
  const cell = 0.15
  const cols = Math.ceil(workshop.w / cell)
  const rows = Math.ceil(workshop.h / cell)
  const planeZ = 0.8 + scheme.params.surfaceZ
  const boxes = workpieceBoxes(scheme)
  const amb = AMBIENT[scheme.params.shift] || 0
  const data = new Float32Array(cols * rows)
  let max = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * cell, y = (r + 0.5) * cell
      let z = planeZ
      for (const wp of scheme.workpieces) {
        if (Math.abs(x - wp.x) < wp.w / 2 && Math.abs(y - wp.y) < wp.d / 2) {
          z = Math.max(z, 0.8 + wp.h + 0.01)
        }
      }
      const P = { x, y, z }
      let E = amb
      for (const lamp of scheme.lamps) E += pointIrradiance(lamp, P, boxes)
      data[r * cols + c] = E
      if (E > max) max = E
    }
  }
  return { cols, rows, cell, data, max }
}

// 工件表面采样点
export function sampleWorkpieces(scheme) {
  const boxes = workpieceBoxes(scheme)
  const amb = AMBIENT[scheme.params.shift] || 0
  const pts = []
  for (const wp of scheme.workpieces) {
    const nx = Math.max(2, Math.round(wp.w / 0.12))
    const ny = Math.max(2, Math.round(wp.d / 0.12))
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const P = {
          x: wp.x - wp.w / 2 + (i + 0.5) * wp.w / nx,
          y: wp.y - wp.d / 2 + (j + 0.5) * wp.d / ny,
          z: 0.8 + wp.h + 0.01
        }
        let E = amb
        for (const lamp of scheme.lamps) E += pointIrradiance(lamp, P, boxes)
        pts.push({ x: P.x, y: P.y, z: P.z, e: E, wp: wp.name })
      }
    }
  }
  return pts
}

export function calcStats(samples, params) {
  if (!samples.length) return { n: 0, avg: 0, min: 0, max: 0, u0: 0, u1: 0, passRate: 0, pass: false }
  let min = Infinity, max = 0, sum = 0, ok = 0
  for (const p of samples) {
    sum += p.e
    if (p.e < min) min = p.e
    if (p.e > max) max = p.e
    if (p.e >= params.stdMin && p.e <= params.stdMax) ok++
  }
  const avg = sum / samples.length
  const u1 = avg > 0 ? min / avg : 0
  return {
    n: samples.length, avg, min, max,
    u0: max > 0 ? min / max : 0, u1,
    passRate: ok / samples.length,
    pass: min >= params.stdMin && u1 >= params.uStd && max <= params.stdMax
  }
}

// 连通区域提取(暗区 below / 超限 above)
export function zones(grid, threshold, mode) {
  const { cols, rows, cell, data } = grid
  const visited = new Uint8Array(cols * rows)
  const out = []
  const match = mode === 'below' ? (e => e < threshold) : (e => e > threshold)
  for (let i = 0; i < data.length; i++) {
    if (visited[i] || !match(data[i])) continue
    const stack = [i]; visited[i] = 1
    const cells = []
    let ext = mode === 'below' ? Infinity : 0
    while (stack.length) {
      const idx = stack.pop()
      const r = Math.floor(idx / cols), c = idx % cols
      const x = (c + 0.5) * cell, y = (r + 0.5) * cell
      cells.push([x, y])
      const e = data[idx]
      ext = mode === 'below' ? Math.min(ext, e) : Math.max(ext, e)
      const nb = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]]
      for (const [nr, nc] of nb) {
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
        const ni = nr * cols + nc
        if (!visited[ni] && match(data[ni])) { visited[ni] = 1; stack.push(ni) }
      }
    }
    if (cells.length >= 3) {
      let cx = 0, cy = 0
      for (const [x, y] of cells) { cx += x; cy += y }
      cx /= cells.length; cy /= cells.length
      let r = 0
      for (const [x, y] of cells) r = Math.max(r, Math.hypot(x - cx, y - cy))
      out.push({
        cx: +cx.toFixed(2), cy: +cy.toFixed(2),
        r: +(r + cell / 2).toFixed(2),
        area: +(cells.length * cell * cell).toFixed(3),
        n: cells.length, ext: +ext.toFixed(1),
        cells: cells.slice(0, 10).map(([x, y]) => [+x.toFixed(2), +y.toFixed(2)])
      })
    }
  }
  return out.sort((a, b) => b.area - a.area)
}

// 仿真状态:方案变化后防抖重算
export function createSim(project, workshop) {
  const sim = reactive({
    grid: null, cols: 0, rows: 0, cell: 0.15, max: 0,
    samples: [], stats: null, dark: [], over: [], version: 0
  })
  let timer = null
  function recompute() {
    const s = project.scheme
    const g = computeGrid(s, workshop)
    sim.grid = g.data; sim.cols = g.cols; sim.rows = g.rows; sim.cell = g.cell; sim.max = g.max
    sim.samples = sampleWorkpieces(s)
    sim.stats = calcStats(sim.samples, s.params)
    sim.dark = zones(g, s.params.stdMin, 'below')
    sim.over = zones(g, s.params.stdMax, 'above')
    sim.version++
  }
  watch(() => project.scheme, () => { clearTimeout(timer); timer = setTimeout(recompute, 120) }, { deep: true })
  recompute()
  return sim
}
