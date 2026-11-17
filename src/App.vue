<template>
  <div class="app">
    <header class="topbar">
      <div class="brand">UV固化线 · 光源布置与照度预览</div>
      <nav>
        <router-link to="/projects">项目 / 下单</router-link>
        <router-link to="/design">光源设计</router-link>
        <router-link to="/compare">版本对比</router-link>
        <router-link to="/review">审核交付</router-link>
      </nav>
      <div class="right">
        <span v-if="proj" class="cur" :title="proj.name">当前:{{ proj.name }}</span>
        <label class="role">
          角色
          <select v-model="store.role">
            <option value="customer">客户</option>
            <option value="maker">制作员</option>
            <option value="supervisor">主管</option>
          </select>
        </label>
      </div>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { store, currentProject } from './store'
const proj = computed(() => currentProject())
</script>

<style>
:root {
  --bg: #0b111b; --panel: #131c2b; --panel2: #182335; --line: #26344a;
  --fg: #d7e1ee; --dim: #8494ab; --accent: #ffb300; --blue: #4f8ff7;
  --ok: #69f0ae; --bad: #ff5252; --warn: #ffb74d;
}
* { box-sizing: border-box; }
body { font-family: "Microsoft YaHei", "PingFang SC", system-ui, sans-serif; color: var(--fg); font-size: 14px; }
.app { min-height: 100vh; display: flex; flex-direction: column; }
.topbar { display: flex; align-items: center; gap: 18px; padding: 0 16px; height: 52px;
  background: var(--panel); border-bottom: 1px solid var(--line); flex: none; }
.brand { font-weight: 700; color: var(--accent); letter-spacing: 1px; white-space: nowrap; }
.topbar nav { display: flex; gap: 4px; }
.topbar nav a { color: var(--dim); text-decoration: none; padding: 6px 12px; border-radius: 6px; }
.topbar nav a.router-link-active { color: #fff; background: var(--panel2); }
.topbar .right { margin-left: auto; display: flex; align-items: center; gap: 14px; }
.cur { color: var(--dim); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.role select { background: var(--panel2); color: var(--fg); border: 1px solid var(--line); border-radius: 4px; padding: 3px 6px; margin-left: 6px; }
main { flex: 1; min-height: 0; display: flex; flex-direction: column; }
h3 { margin: 0 0 8px; font-size: 13px; color: var(--dim); text-transform: uppercase; letter-spacing: 1px; }
.panel { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 12px; }
button { background: var(--blue); color: #fff; border: none; border-radius: 6px; padding: 6px 14px; cursor: pointer; font-size: 13px; }
button:disabled { background: #2a3a52; color: #7b8aa0; cursor: not-allowed; }
button.ghost { background: transparent; border: 1px solid var(--line); color: var(--fg); }
button.danger { background: #c62828; }
button.ok { background: #2e7d32; }
input, select { background: var(--panel2); color: var(--fg); border: 1px solid var(--line); border-radius: 4px; padding: 5px 8px; font-size: 13px; }
input[type=range] { padding: 0; }
.badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 12px; color: #0b111b; font-weight: 600; }
table { border-collapse: collapse; width: 100%; }
th, td { border-bottom: 1px solid var(--line); padding: 7px 8px; text-align: left; font-size: 13px; }
th { color: var(--dim); font-weight: 600; }
.mono { font-family: Consolas, monospace; font-size: 12px; }
</style>
