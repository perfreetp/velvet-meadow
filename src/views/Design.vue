<template>
  <div class="design-wrap">
    <DesignMain v-if="project" :key="project.id" :project="project" />
    <div v-else class="empty panel">
      <p>还没有选择项目。</p>
      <router-link to="/projects"><button>去项目列表选择 / 下单</button></router-link>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { currentProject } from '../store'
import DesignMain from './DesignMain.vue'
const project = computed(() => currentProject())
</script>

<style scoped>
.design-wrap { flex: 1; min-height: 0; display: flex; }
.empty { margin: 40px auto; text-align: center; }
</style>
