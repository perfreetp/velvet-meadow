<template>
  <div class="canvas-wrap" @drop.prevent="onDrop" @dragover.prevent>
    <canvas ref="cv"
      @pointerdown="down" @pointermove="move" @pointerup="up" @pointerleave="up"></canvas>
    <div class="legend">
      <span>0</span><i></i><span>{{ legendMax }} mW/cm²</span>
    </div>
    <div class="hint">从左侧灯库拖入灯管 · 拖动调整位置 · 点击选中</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { WORKSHOP, CONVEYOR } from '../store'
import { LAMP_LIBRARY, lampModel } from '../engine/lighting'

const props = defineProps(['project', 'sim', 'selected'])
const emit = defineEmits(['select'])
const cv = ref(null)
const dpr = window.devicePixelRatio || 1
const view = { s: 50, ox: 40, oy: 40 }
let drag = null
let heatCache = null, heatVer = -1
let ro = null

const legendMax = computed(() => Math.round(Math.max(props.project.scheme.params.stdMax * 1.3, props.sim.max)))

function toScreen(x, y) { return [view.ox + x * view.s, view.oy + y * view.s] }
function toWorld(px, py) { return [(px - view.ox) / view.s, (py - view.oy) / view.s] }

function resize() {
  const el = cv.value, wrap = el.parentElement
  const w = wrap.clientWidth, h = wrap.clientHeight
  if (!w || !h) return
  el.width = w * dpr; el.height = h * dpr
  el.style.width = w + 'px'; el.style.height = h + 'px'
  const pad = 34
  view.s = Math.min((w - 2 * pad) / WORKSHOP.w, (h - 2 * pad) / WORKSHOP.h)
  view.ox = (w - WORKSHOP.w * view.s) / 2
  view.oy = (h - WORKSHOP.h * view.s) / 2
  draw()
}

// 伪彩色:蓝→青→绿→黄→红
function heatColor(t) {
  t = Math.min(1, Math.max(0, t))
  const hue = 240 - 240 * t
  return hsl(hue, 90, 42 + 14 * t)
}
function hsl(h, s, l) {
  s /= 100; l /= 100
  const k = n => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function buildHeat() {
  const { cols, rows, grid } = { cols: props.sim.cols, rows: props.sim.rows, grid: props.sim.grid }
  const oc = document.createElement('canvas')
  oc.width = cols; oc.height = rows
  const octx = oc.getContext('2d')
  const img = octx.createImageData(cols, rows)
  const scale = Math.max(props.project.scheme.params.stdMax * 1.3, props.sim.max, 1)
  for (let i = 0; i < grid.length; i++) {
    const [r, g, b] = heatColor(grid[i] / scale)
    img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255
  }
  octx.putImageData(img, 0, 0)
  heatCache = oc
  heatVer = props.sim.version
}

function draw() {
  const el = cv.value
  if (!el) return
  const ctx = el.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  const W = el.width / dpr, H = el.height / dpr
  const scheme = props.project.scheme
  const P = scheme.params

  ctx.fillStyle = '#0d1420'
  ctx.fillRect(0, 0, W, H)

  // 车间地面
  const [fx, fy] = toScreen(0, 0)
  const fw = WORKSHOP.w * view.s, fh = WORKSHOP.h * view.s
  ctx.fillStyle = '#141e2d'
  ctx.fillRect(fx, fy, fw, fh)

  // 伪彩色照度层
  if (props.sim.grid) {
    if (heatVer !== props.sim.version) buildHeat()
    ctx.save()
    ctx.globalAlpha = 0.82
    ctx.imageSmoothingEnabled = true
    ctx.drawImage(heatCache, fx, fy, fw, fh)
    ctx.restore()
  }

  // 网格(1m)
  ctx.strokeStyle = 'rgba(120,150,190,0.14)'
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let x = 0; x <= WORKSHOP.w; x++) { const [sx] = toScreen(x, 0); ctx.moveTo(sx, fy); ctx.lineTo(sx, fy + fh) }
  for (let y = 0; y <= WORKSHOP.h; y++) { const [, sy] = toScreen(0, y); ctx.moveTo(fx, sy); ctx.lineTo(fx + fw, sy) }
  ctx.stroke()

  // 墙体
  ctx.strokeStyle = '#5a6b85'
  ctx.lineWidth = 3
  ctx.strokeRect(fx, fy, fw, fh)
  ctx.fillStyle = '#7d8ca3'
  ctx.font = '11px sans-serif'
  ctx.fillText(`车间 ${WORKSHOP.w}m × ${WORKSHOP.h}m (坐标单位:m)`, fx + 6, fy + 14)

  // 输送链
  const [cx0, cy] = toScreen(CONVEYOR.x0, CONVEYOR.y)
  const [cx1] = toScreen(CONVEYOR.x1, CONVEYOR.y)
  const halfW = 0.3 * view.s
  ctx.strokeStyle = '#8d9db5'
  ctx.lineWidth = 2
  ctx.strokeRect(cx0, cy - halfW, cx1 - cx0, halfW * 2)
  ctx.beginPath()
  ctx.strokeStyle = 'rgba(160,180,205,0.55)'
  ctx.lineWidth = 1
  for (let x = cx0 + 8; x < cx1; x += 14) { ctx.moveTo(x, cy - halfW); ctx.lineTo(x + 7, cy + halfW) }
  ctx.stroke()
  // 方向箭头
  ctx.fillStyle = '#8d9db5'
  ctx.beginPath()
  ctx.moveTo(cx1 + 12, cy); ctx.lineTo(cx1 - 2, cy - 6); ctx.lineTo(cx1 - 2, cy + 6)
  ctx.fill()
  ctx.font = '11px sans-serif'
  ctx.fillText('输送链 →', cx0 + 4, cy - halfW - 5)

  // 工件
  for (const wp of scheme.workpieces) {
    const [wx, wy] = toScreen(wp.x - wp.w / 2, wp.y - wp.d / 2)
    const ww = wp.w * view.s, wh = wp.d * view.s
    const sel = props.selected && props.selected.type === 'wp' && props.selected.id === wp.id
    ctx.fillStyle = sel ? 'rgba(79,143,247,0.45)' : 'rgba(30,42,60,0.78)'
    ctx.strokeStyle = sel ? '#4f8ff7' : '#93a5c0'
    ctx.lineWidth = sel ? 2 : 1.2
    ctx.fillRect(wx, wy, ww, wh)
    ctx.strokeRect(wx, wy, ww, wh)
    ctx.fillStyle = '#c9d6e8'
    ctx.font = '10px sans-serif'
    ctx.fillText(`${wp.name} h=${wp.h}m`, wx + 3, wy + 11)
  }

  // 暗区(低于标准)——红虚线圈
  ctx.font = 'bold 11px sans-serif'
  props.sim.dark.forEach((z, i) => {
    const [zx, zy] = toScreen(z.cx, z.cy)
    ctx.strokeStyle = '#ff1744'
    ctx.lineWidth = 1.8
    ctx.setLineDash([5, 4])
    ctx.beginPath(); ctx.arc(zx, zy, z.r * view.s, 0, Math.PI * 2); ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = '#ff5252'
    ctx.fillText(`暗区${i + 1} ${z.ext}`, zx - 24, zy - z.r * view.s - 4)
  })
  // 超限区——橙实线圈
  props.sim.over.forEach((z, i) => {
    const [zx, zy] = toScreen(z.cx, z.cy)
    ctx.strokeStyle = '#ff9100'
    ctx.lineWidth = 1.8
    ctx.beginPath(); ctx.arc(zx, zy, z.r * view.s, 0, Math.PI * 2); ctx.stroke()
    ctx.fillStyle = '#ffb74d'
    ctx.fillText(`超限${i + 1} ${z.ext}`, zx - 24, zy + z.r * view.s + 13)
  })

  // 采样点
  for (const p of props.sim.samples) {
    const [px, py] = toScreen(p.x, p.y)
    ctx.fillStyle = p.e < P.stdMin ? '#ff5252' : p.e > P.stdMax ? '#ffb74d' : '#69f0ae'
    ctx.beginPath(); ctx.arc(px, py, 2.4, 0, Math.PI * 2); ctx.fill()
  }

  // 灯管
  for (const lamp of scheme.lamps) {
    const model = lampModel(lamp)
    const [lx, ly] = toScreen(lamp.x, lamp.y)
    const sel = props.selected && props.selected.type === 'lamp' && props.selected.id === lamp.id
    const psi = (lamp.yaw || 0) * Math.PI / 180
    const th = (lamp.angle || 0) * Math.PI / 180
    ctx.save()
    ctx.translate(lx, ly)
    ctx.rotate(psi)
    const L = model.length * view.s
    ctx.fillStyle = sel ? 'rgba(255,179,0,0.35)' : 'rgba(255,213,79,0.22)'
    ctx.strokeStyle = sel ? '#ffb300' : '#ffd54f'
    ctx.lineWidth = sel ? 2.5 : 1.5
    ctx.beginPath()
    ctx.roundRect(-L / 2, -5, L, 10, 5)
    ctx.fill(); ctx.stroke()
    ctx.restore()
    // 照射方向箭头(倾角在平面上的投影)
    const dx = -Math.sin(th) * Math.sin(psi), dy = Math.sin(th) * Math.cos(psi)
    const alen = (12 + Math.abs(lamp.angle) * 0.9)
    ctx.strokeStyle = '#ffe082'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(lx, ly)
    ctx.lineTo(lx + dx * alen, ly + dy * alen)
    ctx.stroke()
    ctx.fillStyle = sel ? '#ffb300' : '#e8d9a0'
    ctx.font = '10px sans-serif'
    const tag = `${lamp.name.split(' ')[0]} z=${lamp.z}m ∠${lamp.angle}°`
    ctx.fillText(tag, lx + 8, ly - 8)
    if (lamp.locked) {
      ctx.font = '12px sans-serif'
      ctx.fillText('🔒', lx - 18, ly - 6)
    }
  }
}

// ---------- 交互 ----------
function pos(e) {
  const r = cv.value.getBoundingClientRect()
  return [e.clientX - r.left, e.clientY - r.top]
}
function hitLamp(wx, wy) {
  const lamps = props.project.scheme.lamps
  for (let i = lamps.length - 1; i >= 0; i--) {
    if (Math.hypot(lamps[i].x - wx, lamps[i].y - wy) < 0.35) return lamps[i]
  }
  return null
}
function hitWp(wx, wy) {
  const wps = props.project.scheme.workpieces
  for (let i = wps.length - 1; i >= 0; i--) {
    const w = wps[i]
    if (Math.abs(wx - w.x) < w.w / 2 && Math.abs(wy - w.y) < w.d / 2) return w
  }
  return null
}
function down(e) {
  const [px, py] = pos(e)
  const [wx, wy] = toWorld(px, py)
  const lamp = hitLamp(wx, wy)
  if (lamp) {
    emit('select', { type: 'lamp', id: lamp.id })
    if (!lamp.locked) drag = { kind: 'lamp', obj: lamp, ox: lamp.x - wx, oy: lamp.y - wy }
    return
  }
  const wp = hitWp(wx, wy)
  if (wp) {
    emit('select', { type: 'wp', id: wp.id })
    drag = { kind: 'wp', obj: wp, ox: wp.x - wx, oy: wp.y - wy }
    return
  }
  emit('select', null)
}
function move(e) {
  if (!drag) return
  const [px, py] = pos(e)
  const [wx, wy] = toWorld(px, py)
  drag.obj.x = +Math.min(WORKSHOP.w - 0.2, Math.max(0.2, wx + drag.ox)).toFixed(2)
  drag.obj.y = +Math.min(WORKSHOP.h - 0.2, Math.max(0.2, wy + drag.oy)).toFixed(2)
}
function up() { drag = null }

function onDrop(e) {
  const id = e.dataTransfer.getData('text/plain')
  const model = LAMP_LIBRARY.find(m => m.id === id)
  if (!model) return
  const [px, py] = pos(e)
  let [wx, wy] = toWorld(px, py)
  wx = +Math.min(WORKSHOP.w - 0.3, Math.max(0.3, wx)).toFixed(2)
  wy = +Math.min(WORKSHOP.h - 0.3, Math.max(0.3, wy)).toFixed(2)
  const lamp = {
    id: 'L' + Math.random().toString(36).slice(2, 7),
    model: model.id, name: model.name,
    x: wx, y: wy, z: 2.2, angle: 12, yaw: 90,
    power: model.power, range: 3.5, locked: false
  }
  props.project.scheme.lamps.push(lamp)
  emit('select', { type: 'lamp', id: lamp.id })
}

onMounted(() => {
  resize()
  ro = new ResizeObserver(resize)
  ro.observe(cv.value.parentElement)
})
onBeforeUnmount(() => ro && ro.disconnect())
watch(() => [props.sim.version, props.project.scheme, props.selected], draw, { deep: true })
</script>

<style scoped>
.canvas-wrap { position: relative; flex: 1; min-height: 0; overflow: hidden; background: #0d1420; }
canvas { display: block; width: 100%; height: 100%; touch-action: none; cursor: crosshair; }
.legend { position: absolute; right: 14px; bottom: 12px; display: flex; align-items: center; gap: 6px;
  background: rgba(10,16,26,0.75); padding: 5px 10px; border-radius: 6px; font-size: 11px; color: #c9d6e8; }
.legend i { width: 110px; height: 10px; border-radius: 5px;
  background: linear-gradient(90deg, hsl(240,90%,42%), hsl(180,90%,48%), hsl(120,90%,50%), hsl(60,90%,52%), hsl(0,90%,56%)); }
.hint { position: absolute; left: 14px; bottom: 12px; font-size: 11px; color: #6d7f99;
  background: rgba(10,16,26,0.6); padding: 4px 8px; border-radius: 6px; }
</style>
