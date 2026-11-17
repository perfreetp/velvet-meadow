<script>
  import {
    editor, setTool, undo, redo, copySelection, pasteClipboard,
    runDeadAnalysis, setSelectDepth
  } from '../lib/editor.svelte.js';

  const tools = [
    { id: 'brush', label: '画笔（堆体素）', icon: '🖌' },
    { id: 'eraser', label: '擦除（删体素）', icon: '🧽' },
    { id: 'select', label: '框选', icon: '▭' }
  ];

  const f = $derived(editor.field);
</script>

<h3>编辑工具</h3>
<div class="tool-grid">
  {#each tools as t}
    <button class={editor.tool === t.id ? 'active' : ''} onclick={() => setTool(t.id)}>
      <span>{t.icon}</span>{t.label}
    </button>
  {/each}
</div>
<div class="row" style="margin:8px 0">
  <button class="tiny" onclick={undo} disabled={!editor.history?.canUndo()}>↶ 撤销</button>
  <button class="tiny" onclick={redo} disabled={!editor.history?.canRedo()}>↷ 重做</button>
</div>

{#if editor.tool !== 'select'}
  <div class="field">
    <label>画笔半径：{editor.brushRadius} 格（{(editor.brushRadius * 0.5).toFixed(1)} mm）</label>
    <input type="range" min="1" max="12" step="1" bind:value={editor.brushRadius} />
  </div>
{/if}

<h3>镜像对称</h3>
<div class="row" style="gap:14px">
  <label style="display:flex;align-items:center;gap:6px;margin:0">
    <input type="checkbox" bind:checked={editor.mirrorX} /> 沿 X 轴镜像
  </label>
  <label style="display:flex;align-items:center;gap:6px;margin:0">
    <input type="checkbox" bind:checked={editor.mirrorY} /> 沿 Y 轴镜像
  </label>
</div>

{#if editor.tool === 'select'}
  <h3>框选与粘贴</h3>
  {#if editor.selectRect}
    {@const r = editor.selectRect}
    <p class="muted" style="margin:4px 0">
      选区 X {r.x0}–{r.x1}，Y {r.y0}–{r.y1}
    </p>
    <div class="field">
      <label>层范围 Z（含）</label>
      <div class="row">
        <input type="number" min="0" max={f.nz - 1} value={editor.selectZ0}
          oninput={(e) => setSelectDepth(+e.currentTarget.value, editor.selectZ1)} />
        <span>–</span>
        <input type="number" min="0" max={f.nz - 1} value={editor.selectZ1}
          oninput={(e) => setSelectDepth(editor.selectZ0, +e.currentTarget.value)} />
      </div>
    </div>
    <button class="tiny primary" onclick={copySelection} style="width:100%">复制选区</button>
  {:else}
    <p class="muted">在切片画布上拖出矩形框选</p>
  {/if}

  {#if editor.clipboard}
    {@const c = editor.clipboard}
    <h3>剪贴板（{c.voxels.length} 格）</h3>
    <div class="grid3">
      <div><label>偏移 X（格）</label><input type="number" bind:value={editor.pasteOffset.x} /></div>
      <div><label>偏移 Y（格）</label><input type="number" bind:value={editor.pasteOffset.y} /></div>
      <div><label>偏移 Z（格）</label><input type="number" bind:value={editor.pasteOffset.z} /></div>
    </div>
    <p class="muted" style="margin:2px 0 6px">
      毫米偏移：{(editor.pasteOffset.x * 0.5).toFixed(1)}, {(editor.pasteOffset.y * 0.5).toFixed(1)}, {(editor.pasteOffset.z * 0.5).toFixed(1)}
    </p>
    <div class="row">
      <button class="tiny primary" onclick={() => pasteClipboard('union')}>叠加粘贴</button>
      <button class="tiny" onclick={() => pasteClipboard('replace')}>替换粘贴</button>
    </div>
  {/if}
{/if}

<h3>铣削死角分析</h3>
<div class="grid2">
  <div><label>刀具半径 mm</label><input type="number" step="0.5" min="0" bind:value={editor.toolRadiusMm} /></div>
  <div><label>有效刀长 mm</label><input type="number" step="0.5" min="0.5" bind:value={editor.toolLengthMm} /></div>
</div>
<button class="tiny" style="width:100%;margin-top:6px" onclick={() => runDeadAnalysis(true)}>重新分析可达性</button>
{#if editor.deadInfo}
  <p style="margin:6px 0">
    不可达 <b style="color:var(--red)">{editor.deadInfo.dead}</b> /
    型腔 {editor.deadInfo.cavity} 格
  </p>
{/if}

<h3>网格减面</h3>
<div class="field">
  <label>角度阈值：{editor.angleThresholdDeg}°（超过 30 万面时生效）</label>
  <input type="range" min="1" max="45" step="1" bind:value={editor.angleThresholdDeg} />
</div>

<style>
  h3 { border-top: 1px solid var(--border); padding-top: 10px; }
  h3:first-of-type { border-top: none; padding-top: 0; }
  .tool-grid { display: grid; grid-template-columns: 1fr; gap: 6px; }
  .tool-grid button { text-align: left; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
</style>
