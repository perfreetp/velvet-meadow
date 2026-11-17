<template>
  <div class="projects">
    <div class="panel order">
      <h3>客户下单 · 新建项目</h3>
      <div class="form">
        <label>项目名称<input v-model="form.name" placeholder="如:保险杠UV喷涂线"></label>
        <label>客户<input v-model="form.customer" placeholder="客户名称"></label>
        <label>产品/材质<input v-model="form.product" placeholder="如:PP保险杠"></label>
        <label>数量(件/月)<input type="number" v-model.number="form.qty" min="1"></label>
        <label>截止时间<input type="date" v-model="form.deadline"></label>
        <label>照度标准(mW/cm²)
          <div style="display:flex;gap:6px;align-items:center">
            <input type="number" v-model.number="form.stdMin" style="width:70px"> ~
            <input type="number" v-model.number="form.stdMax" style="width:70px">
          </div>
        </label>
      </div>
      <button @click="create" :disabled="!form.name || !form.customer">创建项目</button>
      <span v-if="store.role !== 'customer'" class="tip">当前角色为{{ roleName }},实际系统中此入口仅客户可见</span>
    </div>

    <div class="panel list">
      <h3>项目列表</h3>
      <table>
        <thead><tr>
          <th>项目</th><th>客户</th><th>状态</th><th>返工</th><th>截止</th><th>剩余</th><th>版本</th><th>操作</th>
        </tr></thead>
        <tbody>
          <tr v-for="p in store.projects" :key="p.id" :class="{ cur: p.id === store.currentProjectId }">
            <td>{{ p.name }}</td>
            <td>{{ p.customer }}</td>
            <td><span class="badge" :style="{ background: STATUS_COLOR[p.status] || '#888' }">{{ p.status }}</span></td>
            <td :style="{ color: p.rework > 0 ? 'var(--warn)' : 'inherit' }">{{ p.rework }}次</td>
            <td>{{ p.deadline }}</td>
            <td :style="{ color: remain(p) < 3 ? 'var(--bad)' : 'inherit' }">{{ remain(p) }}天</td>
            <td>{{ p.versions.length }}</td>
            <td class="ops">
              <button class="ghost" @click="open(p)">设计</button>
              <button class="ghost" @click="goReview(p)">审核</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { store, defaultScheme, defaultWorkItems, log, STATUS_COLOR } from '../store'

const router = useRouter()
const form = reactive({ name: '', customer: '', product: '', qty: 5000, deadline: '2026-12-31', stdMin: 60, stdMax: 140 })
const roleName = computed(() => ({ customer: '客户', maker: '制作员', supervisor: '主管' }[store.role]))

function remain(p) {
  return Math.max(0, Math.ceil((new Date(p.deadline) - Date.now()) / 86400000))
}
function create() {
  const scheme = defaultScheme()
  scheme.params.stdMin = form.stdMin
  scheme.params.stdMax = form.stdMax
  const p = {
    id: 'P' + Date.now(),
    name: form.name, customer: form.customer, product: form.product,
    qty: form.qty, deadline: form.deadline,
    status: '已下单', rework: 0,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    history: [], workItems: defaultWorkItems(), scheme, versions: []
  }
  store.projects.push(p)
  store.currentProjectId = p.id
  log(p, '客户下单')
  form.name = ''; form.customer = ''; form.product = ''
}
function open(p) {
  store.currentProjectId = p.id
  if (p.status === '已下单') { p.status = '设计中'; log(p, '开始设计') }
  router.push('/design')
}
function goReview(p) {
  store.currentProjectId = p.id
  router.push('/review')
}
</script>

<style scoped>
.projects { display: grid; grid-template-columns: 340px 1fr; gap: 12px; padding: 12px; align-items: start; }
.order .form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
.order label { display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--dim); }
.tip { font-size: 11px; color: var(--dim); margin-left: 8px; }
tr.cur td { background: rgba(79, 143, 247, 0.08); }
.ops button { padding: 3px 10px; font-size: 12px; margin-right: 4px; }
</style>
