<script>
  import { editor, setRole, saveVersion, archiveCurrent, exportCurrentOBJ, sync3D } from '../lib/editor.svelte.js';
  import LayerList from './LayerList.svelte';
  import SliceCanvas from './SliceCanvas.svelte';
  import View3D from './View3D.svelte';
  import ToolPanel from './ToolPanel.svelte';
  import VersionPanel from './VersionPanel.svelte';

  let { onBack } = $props();
  let centerTab = $state('slice'); // slice | 3d
  let showVersions = $state(false);

  const b = $derived(editor.field
    ? { x: editor.field.nx * 0.5, y: editor.field.ny * 0.5, z: editor.field.nz * 0.5 }
    : { x: 0, y: 0, z: 0 });
</script>

<div class="shell">
  <header class="topbar">
    <div class="row">
      <button class="tiny" onclick={onBack}>← 项目库</button>
      <strong>{editor.project?.moldNo}</strong>
      <span class="tag draft">{editor.project?.code}</span>
      <span class="muted">料号 {editor.project?.materialNo} · {editor.project?.material}</span>
      <span class="muted">外形 {b.x}×{b.y}×{b.z} mm</span>
    </div>
    <div class="row">
      <span class="muted">型腔 {editor.voxelCount} 格（{(editor.voxelCount * 0.125).toFixed(1)} cm³）</span>
      <button class="tiny" onclick={() => saveVersion()}>存版本</button>
      <button class="tiny" onclick={() => exportCurrentOBJ()} disabled={!editor.lastStats}>导出 OBJ</button>
      <button class="tiny" onclick={() => archiveCurrent(true)}>归档</button>
      <button class="tiny" onclick={() => (showVersions = true)}>版本/审批</button>
      <select value={editor.role} onchange={(e) => setRole(e.currentTarget.value)} style="width:auto">
        <option value="technician">工艺员</option>
        <option value="leader">组长</option>
      </select>
    </div>
  </header>

  <div class="body">
    <aside class="left">
      <LayerList />
    </aside>

    <main class="center">
      <nav class="tabs">
        <button class={centerTab === 'slice' ? 'active' : ''} onclick={() => (centerTab = 'slice')}>切片编辑（Canvas2D）</button>
        <button class={centerTab === '3d' ? 'active' : ''} onclick={() => { centerTab = '3d'; sync3D(false); }}>三维预览（OffscreenCanvas）</button>
      </nav>
      {#if centerTab === 'slice'}
        <SliceCanvas />
      {:else}
        <View3D />
      {/if}
    </main>

    <aside class="right scroll">
      <ToolPanel />
    </aside>
  </div>
</div>

{#if showVersions}
  <VersionPanel onClose={() => (showVersions = false)} />
{/if}

<style>
  .shell { height: 100%; display: flex; flex-direction: column; }
  .topbar {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 14px; background: var(--panel); border-bottom: 1px solid var(--border);
    gap: 12px; flex: none;
  }
  .body { flex: 1; display: flex; min-height: 0; }
  .left { width: 218px; flex: none; border-right: 1px solid var(--border); background: var(--panel); }
  .right { width: 280px; flex: none; border-left: 1px solid var(--border); background: var(--panel); padding: 12px; }
  .center { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .tabs { display: flex; gap: 6px; padding: 8px 10px 0; flex: none; }
  select option { background: var(--panel2); }
</style>
