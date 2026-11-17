<template>
  <div class="compare" v-if="project">
    <div class="panel head">
      <h3>方案版本对比 — {{ project.name }}</h3>
      <div class="pickers" v-if="project.versions.length >= 2">
        <label>版本A
          <select v-model="aId">
            <option v-for="v in project.versions" :key="v.id" :value="v.id">{{ v.name }}({{ v.time }})</option>
          </select>
        </label>
        <label>版本B
          <select v-model="bId">
            <option v-for="v in project.versions" :key="v.id" :value="v.id">{{ v.name }}({{ v.time }})</option>
          </select>
        </label>
      </div>
      <p v-else class="dim">版本不足两个,请先在「光源设计」界面保存方案版本。</p>
    </div>

    <template v-if="A && B">
      <div class="panel">
        <h3>均匀度对比</h3>
        <div class="ubar-row" v-for="row in rows" :key="row.label">
          <span class="lbl">{{ row.label }}</span>
          <div class="bars">
            <div class="bar a"><i :style="{ width: row.wa + '%' }"></i><em>{{ row.fa }}</em></div>
            <div class="bar b"><i :style="{ width: row.wb + '%' }"></i><em>{{ row.fb }}</em></div>
          </div>
          <span class="delta" :style="{ color: row.good ? 'var(--ok)' : 'var(--bad)' }">{{ row.delta }}</span>
        </div>
        <div class="lg"><i class="sw a"></i>{{ A.name }} <i class="sw b"></i>{{ B.name }}</div>
      </div>

      <div class="panel">
        <h3>明细</h3>
        <table>
          <thead><tr><th>指标</th><th>{{ A.name }}</th><th>{{ B.name }}</th><th>变化</th></tr></thead>
          <tbody>
            <tr v-for="r in table" :key="r.k">
              <td>{{ r.k }}</td><td>{{ r.a }}</td><td>{{ r.b }}</td>
              <td :style="{ color: r.good === null ? 'inherit' : r.good ? 'var(--ok)' : 'var(--bad)' }">{{ r.d }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
  <div v-else class="panel" style="margin:40px auto">请先在项目列表选择一个项目。</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { currentProject } from '../store'

const project = computed(() => currentProject())
const aId = ref(''), bId = ref('')

watch(project, p => {
  if (p && p.versions.length) {
    aId.value = p.versions[0].id
    bId.value = p.versions[p.versions.length - 1].id
  }
}, { immediate: true })

const A = computed(() => project.value?.versions.find(v => v.id === aId.value))
const B = computed(() => project.value?.versions.find(v => v.id === bId.value))

function fmt(v, n = 1) { return v === undefined ? '-' : v.toFixed(n) }

const rows = computed(() => {
  if (!A.value || !B.value) return []
  const mk = (label, va, vb, unit, digits = 2, higherBetter = true) => {
    const max = Math.max(va, vb, 1e-6)
    const d = vb - va
    const good = higherBetter ? d >= 0 : d <= 0
    return {
      label, wa: va / max * 100, wb: vb / max * 100,
      fa: fmt(va, digits) + unit, fb: fmt(vb, digits) + unit,
      delta: (d >= 0 ? '+' : '') + fmt(d, digits) + unit, good
    }
  }
  return [
    mk('均匀度 U', A.value.stats.u1, B.value.stats.u1, ''),
    mk('平均照度', A.value.stats.avg, B.value.stats.avg, ''),
    mk('最低照度', A.value.stats.min, B.value.stats.min, ''),
    mk('合格率', A.value.stats.passRate * 100, B.value.stats.passRate * 100, '%', 0),
    mk('暗区数', A.value.dark, B.value.dark, '处', 0, false),
    mk('超限区数', A.value.over, B.value.over, '处', 0, false)
  ]
})

const table = computed(() => {
  if (!A.value || !B.value) return []
  const a = A.value, b = B.value
  const row = (k, va, vb, digits = 2, higherBetter = true) => {
    const d = vb - va
    return {
      k, a: fmt(va, digits), b: fmt(vb, digits),
      d: (d >= 0 ? '+' : '') + fmt(d, digits),
      good: Math.abs(d) < 1e-9 ? null : (higherBetter ? d > 0 : d < 0)
    }
  }
  return [
    row('采样点数', a.stats.n, b.stats.n, 0, true),
    row('平均照度 mW/cm²', a.stats.avg, b.stats.avg),
    row('最小照度 mW/cm²', a.stats.min, b.stats.min),
    row('最大照度 mW/cm²', a.stats.max, b.stats.max),
    row('均匀度 U(最小/平均)', a.stats.u1, b.stats.u1),
    row('均匀度 U0(最小/最大)', a.stats.u0, b.stats.u0),
    row('采样合格率', a.stats.passRate, b.stats.passRate, 3),
    row('暗区数量', a.dark, b.dark, 0, false),
    row('超限区数量', a.over, b.over, 0, false),
    { k: '判定', a: a.stats.pass ? '达标' : '不达标', b: b.stats.pass ? '达标' : '不达标', d: '', good: null }
  ]
})
</script>

<style scoped>
.compare { padding: 12px; display: flex; flex-direction: column; gap: 12px; max-width: 980px; margin: 0 auto; width: 100%; }
.pickers { display: flex; gap: 20px; }
.pickers label { display: flex; align-items: center; gap: 8px; color: var(--dim); }
.dim { color: var(--dim); }
.ubar-row { display: grid; grid-template-columns: 110px 1fr 90px; align-items: center; gap: 10px; margin: 8px 0; }
.lbl { color: var(--dim); font-size: 13px; }
.bars { display: flex; flex-direction: column; gap: 3px; }
.bar { position: relative; height: 14px; background: var(--panel2); border-radius: 3px; }
.bar i { display: block; height: 100%; border-radius: 3px; }
.bar.a i { background: #4f8ff7; }
.bar.b i { background: #ffb300; }
.bar em { position: absolute; right: 6px; top: 0; font-size: 11px; font-style: normal; line-height: 14px; color: #e8eef7; }
.delta { font-family: Consolas, monospace; font-size: 12px; text-align: right; }
.lg { margin-top: 10px; font-size: 12px; color: var(--dim); display: flex; align-items: center; gap: 6px; }
.sw { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin: 0 4px 0 12px; }
.sw.a { background: #4f8ff7; } .sw.b { background: #ffb300; }
</style>
