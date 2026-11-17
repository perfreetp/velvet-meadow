<template>
  <div class="review" v-if="project">
    <div class="panel info">
      <h3>项目信息</h3>
      <div class="grid">
        <div><span>项目</span><b>{{ project.name }}</b></div>
        <div><span>客户</span><b>{{ project.customer }}</b></div>
        <div><span>产品</span><b>{{ project.product }}</b></div>
        <div><span>数量</span><b>{{ project.qty }} 件/月</b></div>
        <div><span>状态</span><b><span class="badge" :style="{ background: STATUS_COLOR[project.status] || '#888' }">{{ project.status }}</span></b></div>
        <div><span>返工次数</span><b :style="{ color: project.rework ? 'var(--warn)' : 'inherit' }">{{ project.rework }} 次</b></div>
        <div><span>截止时间</span><b>{{ project.deadline }}(剩 {{ remain }} 天)</b></div>
        <div><span>方案版本</span><b>{{ project.versions.length }} 个</b></div>
      </div>
      <div v-if="project.lastReject" class="reject">最近退回原因:{{ project.lastReject }}</div>
    </div>

    <div class="panel">
      <h3>工位条目(制作员逐项完成)</h3>
      <div v-for="w in project.workItems" :key="w.id" class="wi">
        <label>
          <input type="checkbox" v-model="w.done" :disabled="store.role !== 'maker' || project.status === '已交付'">
          <span :class="{ done: w.done }">{{ w.name }}</span>
        </label>
        <em>{{ w.done ? '已完成' : '待完成' }}</em>
      </div>
      <div class="actions">
        <button @click="submitReview" :disabled="!canSubmit">提交审核</button>
        <span class="tip" v-if="!allDone">全部工位完成后才能提交审核</span>
        <span class="tip" v-else-if="store.role !== 'maker'">需制作员角色提交</span>
      </div>
    </div>

    <div class="panel">
      <h3>主管审核</h3>
      <template v-if="project.status === '待审核'">
        <textarea v-model="rejectReason" placeholder="退回原因(退回时填写,如:固化段均匀度不足)"></textarea>
        <div class="actions">
          <button class="ok" @click="approve" :disabled="store.role !== 'supervisor'">审核通过</button>
          <button class="danger" @click="reject" :disabled="store.role !== 'supervisor' || !rejectReason.trim()">退回返工</button>
          <span class="tip" v-if="store.role !== 'supervisor'">需主管角色操作</span>
        </div>
      </template>
      <p v-else class="dim">当前状态「{{ project.status }}」,{{ project.status === '审核通过' ? '可执行打包交付。' : '待制作员提交审核。' }}</p>
      <div class="actions" v-if="project.status === '审核通过'">
        <button @click="deliver" :disabled="store.role !== 'supervisor'">打包交付(导出交付包)</button>
      </div>
      <p v-if="project.status === '已交付'" class="okline">✔ 已于 {{ project.deliveredAt }} 打包交付</p>
    </div>

    <div class="panel">
      <h3>流转记录</h3>
      <div v-for="(h, i) in [...project.history].reverse()" :key="i" class="hist">
        <span class="mono">{{ h.time }}</span> <b>{{ h.by }}</b> {{ h.action }}
      </div>
    </div>
  </div>
  <div v-else class="panel" style="margin:40px auto">请先在项目列表选择一个项目。</div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { store, currentProject, log, STATUS_COLOR } from '../store'

const project = computed(() => currentProject())
const rejectReason = ref('')

const remain = computed(() => project.value
  ? Math.max(0, Math.ceil((new Date(project.value.deadline) - Date.now()) / 86400000)) : 0)
const allDone = computed(() => project.value && project.value.workItems.every(w => w.done))
const canSubmit = computed(() => project.value && allDone.value
  && store.role === 'maker'
  && ['设计中', '已下单'].includes(project.value.status))

function submitReview() {
  project.value.status = '待审核'
  log(project.value, '提交审核')
}
function approve() {
  project.value.status = '审核通过'
  log(project.value, '审核通过')
}
function reject() {
  project.value.rework++
  project.value.status = '设计中'
  project.value.lastReject = rejectReason.value.trim()
  log(project.value, `审核退回:${project.value.lastReject}(第${project.value.rework}次返工)`)
  rejectReason.value = ''
}
function deliver() {
  const p = project.value
  const payload = {
    项目: { 名称: p.name, 客户: p.customer, 产品: p.product, 数量: p.qty, 截止时间: p.deadline, 返工次数: p.rework },
    交付时间: new Date().toLocaleString('zh-CN', { hour12: false }),
    最终方案: p.scheme,
    版本记录: p.versions.map(v => ({ 名称: v.name, 时间: v.time, 统计: v.stats })),
    工位条目: p.workItems,
    流转记录: p.history
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${p.name}_UV方案交付包.json`
  a.click()
  URL.revokeObjectURL(a.href)
  p.status = '已交付'
  p.deliveredAt = new Date().toLocaleString('zh-CN', { hour12: false })
  log(p, '打包交付')
}
</script>

<style scoped>
.review { padding: 12px; display: flex; flex-direction: column; gap: 12px; max-width: 860px; margin: 0 auto; width: 100%; }
.info .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.info .grid span { display: block; font-size: 11px; color: var(--dim); }
.reject { margin-top: 10px; padding: 8px 10px; background: rgba(255, 23, 68, 0.1);
  border: 1px solid rgba(255, 23, 68, 0.4); border-radius: 6px; font-size: 13px; }
.wi { display: flex; justify-content: space-between; align-items: center; padding: 7px 4px; border-bottom: 1px solid var(--line); }
.wi label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.wi .done { color: var(--ok); text-decoration: line-through; }
.wi em { font-style: normal; font-size: 12px; color: var(--dim); }
.actions { display: flex; gap: 10px; align-items: center; margin-top: 12px; }
.tip { font-size: 12px; color: var(--dim); }
.dim { color: var(--dim); }
textarea { width: 100%; min-height: 60px; background: var(--panel2); color: var(--fg);
  border: 1px solid var(--line); border-radius: 6px; padding: 8px; font-size: 13px; }
.hist { padding: 5px 0; border-bottom: 1px dashed var(--line); font-size: 13px; }
.hist .mono { color: var(--dim); margin-right: 8px; }
.okline { color: var(--ok); }
</style>
