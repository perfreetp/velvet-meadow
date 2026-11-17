<script>
  import { editor, toggleHide, toggleLock, gotoLayer } from '../lib/editor.svelte.js';

  const layers = $derived(editor.field
    ? Array.from({ length: editor.field.nz }, (_, i) => editor.field.nz - 1 - i)
    : []);

  const zTop = $derived(editor.field ? (editor.field.nz - 1 - editor.currentZ) * 0.5 : 0);
</script>

<div class="layer-head">
  <h3 style="margin:0">分层列表（0.5mm/层）</h3>
</div>

<div class="slice-slider">
  <label>切片高度：<b>{zTop.toFixed(1)}</b> mm（第 {editor.currentZ + 1}/{editor.field?.nz ?? 0} 层）</label>
  <input
    type="range" min="0" max={(editor.field?.nz ?? 1) - 1} step="1"
    value={editor.currentZ}
    oninput={(e) => gotoLayer(Number(e.currentTarget.value))}
  />
  <div class="row between">
    <button class="tiny" onclick={() => gotoLayer(editor.currentZ - 1)}>↓ 下一层</button>
    <button class="tiny" onclick={() => gotoLayer(editor.currentZ + 1)}>↑ 上一层</button>
  </div>
</div>

<div class="layers scroll">
  {#each layers as z (z)}
    {@const hidden = editor.hiddenLayers.has(z)}
    {@const locked = editor.lockedLayers.has(z)}
    {@const deadN = editor.deadLayerCounts?.[z] ?? 0}
    <div
      class="layer {editor.currentZ === z ? 'current' : ''} {hidden ? 'hidden' : ''}"
      role="button" tabindex="0"
      onclick={() => gotoLayer(z)}
      onkeydown={(e) => e.key === 'Enter' && gotoLayer(z)}
    >
      <span class="lz">L{z + 1}</span>
      <span class="lh muted">{((editor.field.nz - 1 - z) * 0.5).toFixed(1)}mm</span>
      {#if deadN > 0}<span class="dead-badge" title="铣刀不可达体素数">死角 {deadN}</span>{/if}
      <span class="spacer"></span>
      <button
        class="icon {!hidden ? 'on' : ''}" title={hidden ? '显示该层' : '隐藏该层'}
        onclick={(e) => { e.stopPropagation(); toggleHide(z); }}
      >{hidden ? '🚫' : '👁'}</button>
      <button
        class="icon {locked ? 'lock-on' : ''}" title={locked ? '解锁该层' : '锁定该层'}
        onclick={(e) => { e.stopPropagation(); toggleLock(z); }}
      >{locked ? '🔒' : '🔓'}</button>
    </div>
  {/each}
</div>

<style>
  .layer-head { padding: 12px 12px 6px; }
  .slice-slider { padding: 0 12px 10px; border-bottom: 1px solid var(--border); }
  .slice-slider label { margin-bottom: 6px; }
  .between { justify-content: space-between; margin-top: 6px; }
  .layers { height: calc(100% - 150px); }
  .layer {
    display: flex; align-items: center; gap: 6px;
    padding: 6px 10px; border-left: 3px solid transparent; cursor: pointer;
  }
  .layer:hover { background: var(--panel2); }
  .layer.current { border-left-color: var(--accent); background: var(--panel2); }
  .layer.hidden { opacity: 0.45; }
  .lz { font-weight: 600; width: 38px; }
  .lh { font-size: 11px; }
  .spacer { flex: 1; }
  .icon { padding: 1px 5px; border: none; background: none; font-size: 13px; }
  .icon.on { filter: none; }
  .lock-on { color: var(--orange); }
  .dead-badge {
    font-size: 10px; color: #fff; background: var(--red);
    border-radius: 9px; padding: 1px 6px;
  }
</style>
