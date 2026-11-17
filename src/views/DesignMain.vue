<template>
  <div class="design">
    <!-- 左栏:灯库 + 选中对象属性 -->
    <aside class="side left">
      <div class="panel">
        <h3>灯库(拖入画布)</h3>
        <div v-for="m in LAMP_LIBRARY" :key="m.id" class="lib-item" draggable="true"
          @dragstart="e => e.dataTransfer.setData('text/plain', m.id)">
          <b>{{ m.name }}</b>
          <span>{{ m.desc }} · 管长{{ m.length }}m · 额定{{ m.power }}W</span>
        </div>
      </div>

      <div class="panel" v-if="selLamp">
        <h3>灯管参数 {{ selLamp.locked ? '🔒已锁定' : '' }}</h3>
        <div class="row"><label>高度 z</label>
          <input type="range" min="1.2" max="3" step="0.05" v-model.number="selLamp.z" :disabled="selLamp.locked">
          <span class="val">{{ selLamp.z }}m</span></div>
        <div class="row"><label>倾角</label>
          <input type="range" min="-60" max="60" step="1" v-model.number="selLamp.angle" :disabled="selLamp.locked">
          <span class="val">{{ selLamp.angle }}°</span></div>
        <div class="row"><label>水平转角</label>
          <input type="range" min="0" max="180" step="5" v-model.number="selLamp.yaw" :disabled="selLamp.locked">
          <span class="val">{{ selLamp.yaw }}°</span></div>
        <div class="row"><label>功率</label>
          <input type="range" min="50" :max="lampModel(selLamp).power" step="10" v-model.number="selLamp.power" :disabled="selLamp.locked">
          <span class="val">{{ selLamp.power }}W</span></div>
        <div class="row"><label>照射距离</label>
          <input type="range" min="1" max="6" step="0.1" v-model.number="selLamp.range" :disabled="selLamp.locked">
          <span class="val">{{ selLamp.range }}m</span></div>
        <div class="row btns">
          <button class="ghost" @click="selLamp.locked = !selLamp">{{ selLamp.locked ? '解锁' : '锁定' }}</button>
          <button class="danger" @click="removeLamp(selLamp.id)">删除</button>
        </div>
      </div>

      <div class="panel" v-else-if="selWp">
        <h3>工件 {{ selWp.name }}</h3>
        <div class="row"><label>宽 w</label>
          <input type="range" min="0.3" max="2" step="0.05" v-model.number="selWp.w"><span class="val">{{ selWp.w }}m</span></div>
        <div class="row"><label>深 d</label>
          <input type="range" min="0.3" max="1.5" step="0.05" v-model.number="selWp.d"><span class="val">{{ selWp.d }}m</span></div>
        <div class="row"><label>高 h</label>
          <input type="range" min="0.1" max="0.8" step="0.05" v-model.number="selWp.h"><span class="val">{{ selWp.h }}m</span></div>
        <div class="row btns">
          <button class="danger" @click="removeWp(selWp.id)">删除</button>
        </div>
      </div>

      <div class="panel">
        <h3>工件摆放</h3>
        <div class="row btns">
          <button class="ghost" @click="addWp">添加工件</button>
          <button class="ghost" @click="autoPlace">沿链自动摆放</button>
        </div>
        <div class="row"><label>锁定操作</label>
          <button class="ghost" @click="lockAll(true)">全锁</button>
          <button class="ghost" @click="lockAll(false)">全解锁</button>
        </div>
      </div>
    </aside>

    <!-- 中间:画布 -->
    <section class="center">
      <div class="toolbar">
        <button :class="{ ghost: view !== '2d' }" @click="view = '2d'">俯视照度图</button>
        <button :class="{ ghost: view !== '3d' }" @click="view = '3d'">3D 预览</button>
        <span class="sp"></span>
        <button :class="['shift', { on: scheme.params.shift === 'day' }]" @click="scheme.params.shift = 'day'">☀ 白班</button>
        <button :class="['shift', { on: scheme.params.shift === 'night' }]" @click="scheme.params.shift = 'night'">🌙 夜班</button>
      </div>
      <HeatmapCanvas v-show="view === '2d'" :project="project" :sim="sim" :selected="selected" @select="selected = $event" />
      <ThreeView v-if="view === '3d'" :project="project" />
    </section>

    <!-- 右栏:标准 / 统计 / 暗区超限 / 版本 -->
    <aside class="side right">
      <div class="panel">
        <h3>验收标准</h3>
        <div class="row"><label>照度下限</label>
          <input type="number" v-model.number="scheme.params.stdMin" style="width:70px"> mW/cm²</div>
        <div class="row"><label>照度上限</label>
          <input type="number" v-model.number="scheme.params.stdMax" style="width:70px"> mW/cm²</div>
        <div class="row"><label>均匀度≥</label>
          <input type="number" v-model.number="scheme.params.uStd" step="0.05" min="0.3" max="0.95" style="width:70px"></div>
        <div class="row"><label>照射面高</label>
          <input type="number" v-model.number="scheme.params.surfaceZ" step="0.05" min="0" max="1" style="width:70px"> m(输送面以上)</div>
      </div>

      <div class="panel" v-if="sim.stats">
        <h3>采样统计({{ sim.stats.n }}点)</h3>
        <div class="stat"><span>平均照度</span><b>{{ sim.stats.avg.toFixed(1) }}</b></div>
        <div class="stat"><span>最小 / 最大</span><b>{{ sim.stats.min.toFixed(1) }} / {{ sim.stats.max.toFixed(1) }}</b></div>
        <div class="stat"><span>均匀度 U=最小/平均</span>
          <b :style="{ color: sim.stats.u1 >= scheme.params.uStd ? 'var(--ok)' : 'var(--bad)' }">{{ sim.stats.u1.toFixed(2) }}</b></div>
        <div class="ubar"><i :style="{ width: Math.min(100, sim.stats.u1 / scheme.params.uStd * 100) + '%' }"
          :class="{ bad: sim.stats.u1 < scheme.params.uStd }"></i></div>
        <div class="stat"><span>采样合格率</span><b>{{ (sim.stats.passRate * 100).toFixed(0) }}%</b></div>
        <div class="stat"><span>判定</span>
          <b :style="{ color: sim.stats.pass ? 'var(--ok)' : 'var(--bad)' }">{{ sim.stats.pass ? '✔ 达标' : '✘ 不达标' }}</b></div>
      </div>

      <div class="panel zones">
        <h3>暗区(低于{{ scheme.params.stdMin }}) {{ sim.dark.length }}处</h3>
        <div v-for="(z, i) in sim.dark" :key="'d' + i" class="zone dark">
          <b>暗区{{ i + 1 }}</b> 中心({{ z.cx }}, {{ z.cy }}) 面积{{ z.area }}m² 最低{{ z.ext }}
          <div class="mono">{{ z.cells.map(c => `(${c[0]},${c[1]})`).join(' ') }}<span v-if="z.n > 10"> …共{{ z.n }}格</span></div>
        </div>
        <h3 style="margin-top:10px">超限(高于{{ scheme.params.stdMax }}) {{ sim.over.length }}处</h3>
        <div v-for="(z, i) in sim.over" :key="'o' + i" class="zone over">
          <b>超限{{ i + 1 }}</b> 中心({{ z.cx }}, {{ z.cy }}) 面积{{ z.area }}m² 峰值{{ z.ext }}
          <div class="mono">{{ z.cells.map(c => `(${c[0]},${c[1]})`).join(' ') }}<span v-if="z.n > 10"> …共{{ z.n }}格</span></div>
        </div>
      </div>

      <div class="panel">
        <h3>方案版本</h3>
        <div class="row">
          <input v-model="verName" placeholder="版本名,如 V2-加密固化段" style="flex:1">
          <button @click="saveVersion">存版本</button>
        </div>
        <div v-for="v in project.versions" :key="v.id" class="ver">
          <div>
            <b>{{ v.name }}</b> <span class="dim">{{ v.time }}</span><br>
            <span class="dim">U={{ v.stats.u1.toFixed(2) }} 平均{{ v.stats.avg.toFixed(1) }} 暗区{{ v.dark }} 超限{{ v.over }}</span>
          </div>
          <div class="vb">
            <button class="ghost" @click="loadVersion(v)">载入</button>
            <button class="ghost" @click="delVersion(v.id)">删</button>
          </div>
        </div>
        <router-link to="/compare"><button class="ghost" style="width:100%;margin-top:6px">去版本对比 →</button></router-link>
      </div>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { WORKSHOP, CONVEYOR, autoPlaceWorkpieces } from '../store'
import { LAMP_LIBRARY, lampModel, createSim } from '../engine/lighting'
import HeatmapCanvas from '../components/HeatmapCanvas.vue'
import ThreeView from '../components/ThreeView.vue'

const props = defineProps(['project'])
const scheme = props.project.scheme
const sim = createSim(props.project, WORKSHOP)
const selected = ref(null)
const view = ref('2d')
const verName = ref('')

const selLamp = computed(() => selected.value?.type === 'lamp'
  ? scheme.lamps.find(l => l.id === selected.value.id) : null)
const selWp = computed(() => selected.value?.type === 'wp'
  ? scheme.workpieces.find(w => w.id === selected.value.id) : null)

function removeLamp(id) {
  const i = scheme.lamps.findIndex(l => l.id === id)
  if (i >= 0) scheme.lamps.splice(i, 1)
  selected.value = null
}
function removeWp(id) {
  const i = scheme.workpieces.findIndex(w => w.id === id)
  if (i >= 0) scheme.workpieces.splice(i, 1)
  selected.value = null
}
function addWp() {
  scheme.workpieces.push({
    id: 'wp' + Math.random().toString(36).slice(2, 7),
    name: '工件' + (scheme.workpieces.length + 1),
    x: 3 + scheme.workpieces.length * 0.8, y: CONVEYOR.y, w: 0.9, d: 0.6, h: 0.35
  })
}
function autoPlace() { autoPlaceWorkpieces(scheme, 6) }
function lockAll(v) { scheme.lamps.forEach(l => { l.locked = v }) }

function saveVersion() {
  const name = verName.value.trim() || `V${props.project.versions.length + 1}`
  props.project.versions.push({
    id: 'v' + Date.now(),
    name,
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    snapshot: JSON.parse(JSON.stringify({ lamps: scheme.lamps, workpieces: scheme.workpieces, params: scheme.params })),
    stats: JSON.parse(JSON.stringify(sim.stats)),
    dark: sim.dark.length, over: sim.over.length
  })
  verName.value = ''
}
function loadVersion(v) {
  const s = JSON.parse(JSON.stringify(v.snapshot))
  scheme.lamps = s.lamps
  scheme.workpieces = s.workpieces
  Object.assign(scheme.params, s.params)
  selected.value = null
}
function delVersion(id) {
  const i = props.project.versions.findIndex(v => v.id === id)
  if (i >= 0) props.project.versions.splice(i, 1)
}
</script>

<style scoped>
.design { flex: 1; min-height: 0; display: grid; grid-template-columns: 270px 1fr 320px; gap: 8px; padding: 8px; }
.side { display: flex; flex-direction: column; gap: 8px; overflow-y: auto; min-height: 0; }
.center { display: flex; flex-direction: column; min-height: 0; gap: 8px; }
.toolbar { display: flex; gap: 6px; align-items: center; }
.toolbar .sp { flex: 1; }
.shift { background: var(--panel2); color: var(--dim); border: 1px solid var(--line); }
.shift.on { background: var(--accent); color: #1a1200; font-weight: 700; }
.lib-item { border: 1px dashed var(--line); border-radius: 6px; padding: 7px 9px; margin-bottom: 6px;
  cursor: grab; display: flex; flex-direction: column; gap: 2px; background: var(--panel2); }
.lib-item span { font-size: 11px; color: var(--dim); }
.row { display: flex; align-items: center; gap: 8px; margin: 7px 0; font-size: 13px; }
.row label { width: 62px; flex: none; color: var(--dim); }
.row input[type=range] { flex: 1; }
.row .val { width: 52px; text-align: right; font-family: Consolas, monospace; font-size: 12px; }
.row.btns { gap: 6px; }
.stat { display: flex; justify-content: space-between; margin: 5px 0; font-size: 13px; }
.stat span { color: var(--dim); }
.ubar { height: 6px; background: var(--panel2); border-radius: 3px; overflow: hidden; margin: 4px 0 8px; }
.ubar i { display: block; height: 100%; background: var(--ok); }
.ubar i.bad { background: var(--bad); }
.zones { max-height: 260px; overflow-y: auto; }
.zone { font-size: 12px; padding: 5px 7px; border-radius: 5px; margin-bottom: 5px; }
.zone.dark { background: rgba(255, 23, 68, 0.12); border: 1px solid rgba(255, 23, 68, 0.4); }
.zone.over { background: rgba(255, 145, 0, 0.1); border: 1px solid rgba(255, 145, 0, 0.4); }
.zone .mono { color: var(--dim); margin-top: 3px; word-break: break-all; }
.ver { display: flex; justify-content: space-between; align-items: center; gap: 6px;
  border-top: 1px solid var(--line); padding: 6px 0; font-size: 12px; }
.ver .vb { display: flex; gap: 4px; flex: none; }
.ver button { padding: 3px 8px; font-size: 12px; }
.dim { color: var(--dim); }
</style>
