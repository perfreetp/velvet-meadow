<script>
  import { boxMode, role, adminOpen, visibleStats } from '../stores/state';
  export let segCount = 0;
  export let onZoomIn = () => {};
  export let onZoomOut = () => {};
  export let onReset = () => {};
</script>

<header class="toolbar">
  <span class="title">注塑机零件图册</span>
  <span class="badge">WebGPU</span>
  <span class="stat">图元 {segCount.toLocaleString()}</span>
  <span class="stat">可见零件 {$visibleStats.parts} · 提交图元 {$visibleStats.draws}</span>
  <div class="spacer"></div>
  <button on:click={onZoomOut} title="缩小">−</button>
  <button on:click={onZoomIn} title="放大">＋</button>
  <button on:click={onReset} title="复位视图">复位</button>
  <button class:active={$boxMode} on:click={() => boxMode.update((v) => !v)} title="拖框选择多个零件生成对比清单">
    框选对比
  </button>
  <select bind:value={$role} title="切换角色以使用对应后台权限">
    <option value="operator">运营</option>
    <option value="supervisor">技术主管</option>
  </select>
  <button on:click={() => adminOpen.set(true)}>后台管理</button>
</header>
