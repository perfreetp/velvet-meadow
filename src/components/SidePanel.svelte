<script lang="ts">
  import { editor } from '../editor/store.svelte';
  import { contourLength, isClosed, isCCW } from '../geometry/contour';
  import { holesBBox } from '../editor/arrange';
  import type { ArrayParams } from '../editor/arrange';
  import type { Hole } from '../geometry/types';

  let arrayCols = $state(3);
  let arrayRows = $state(2);
  let arrayDx = $state(60);
  let arrayDy = $state(60);
  let holeR = $state(10);

  function setBoard(field: 'width' | 'height' | 'thickness', value: number): void {
    if (!Number.isFinite(value) || value <= 0) return;
    editor.updateBoard({ [field]: value });
    editor.runChecks();
  }

  function addPart(): void { editor.addPart(); }
  function selectPart(id: string): void {
    editor.setActivePart(id);
    editor.selection = { kind: 'part', id };
    editor.clearHoleSelection();
  }
  function selectContour(cid: string): void {
    const p = editor.activePart;
    if (!p) return;
    editor.setActivePart(p.id);
    editor.selection = { kind: 'contour', id: cid, partId: p.id };
    editor.clearHoleSelection();
  }

  function addHole(): void {
    const p = editor.activePart;
    if (!p) return;
    // 默认放在零件包围盒中心附近
    const cx = 40 + (p.holes.length % 5) * (holeR * 2 + 10);
    const cy = 40 + Math.floor(p.holes.length / 5) * (holeR * 2 + 10);
    editor.addHole(p.id, cx, cy, holeR);
    editor.runChecks();
  }

  function doArray(): void {
    const p = editor.activePart;
    if (!p || !editor.selectedHoleIds.length) return;
    const params: ArrayParams = { cols: arrayCols, rows: arrayRows, dx: arrayDx, dy: arrayDy };
    const n = editor.arrayHoles(p.id, editor.selectedHoleIds, params);
    if (n) editor.runChecks();
  }

  function suggestPitch(): void {
    const p = editor.activePart;
    if (!p) return;
    const holes = p.holes.filter((h: Hole) => editor.selectedHoleIds.includes(h.id));
    const bb = holesBBox(holes);
    if (bb) {
      arrayDx = Math.round((bb.maxX - bb.minX) + holes[0].r * 2 + 20);
      arrayDy = Math.round((bb.maxY - bb.minY) + holes[0].r * 2 + 20);
    }
  }

  function closeContour(): void {
    const sel = editor.selection;
    if (sel?.kind === 'contour') {
      editor.closeContour(sel.partId, sel.id);
      editor.runChecks();
    }
  }

  function duplicateContour(): void {
    const sel = editor.selection;
    if (sel?.kind === 'contour') editor.duplicateContour(sel.partId, sel.id);
  }

  function removeContour(): void {
    const sel = editor.selection;
    if (sel?.kind === 'contour') editor.removeContour(sel.partId, sel.id);
  }

  function removeHoles(): void {
    const p = editor.activePart;
    if (p && editor.selectedHoleIds.length) {
      editor.removeHoles(p.id, editor.selectedHoleIds);
      editor.runChecks();
    }
  }
</script>

<aside class="side-panel">
  <h3>板材幅面</h3>
  <div class="card">
    <div class="row">
      <span class="lbl">宽 (mm)</span>
      <input type="number" min="1" value={editor.doc.board.width}
        onchange={(e) => setBoard('width', +e.currentTarget.value)} />
    </div>
    <div class="row">
      <span class="lbl">高 (mm)</span>
      <input type="number" min="1" value={editor.doc.board.height}
        onchange={(e) => setBoard('height', +e.currentTarget.value)} />
    </div>
    <div class="row">
      <span class="lbl">板厚 (mm)</span>
      <input type="number" min="1" value={editor.doc.board.thickness}
        onchange={(e) => setBoard('thickness', +e.currentTarget.value)} />
    </div>
    <div class="row">
      <span class="lbl">材料</span>
      <input class="grow" value={editor.doc.board.material}
        onchange={(e) => editor.updateBoard({ material: e.currentTarget.value })} />
    </div>
  </div>

  <h3>板件 ({editor.doc.parts.length})</h3>
  <div class="scroll-list">
    {#each editor.doc.parts as p (p.id)}
      <div class="card part-row" class:active={p.id === editor.doc.activePartId}>
        <button class="grow name-btn" onclick={() => selectPart(p.id)}>
          {p.name}
          <span class="muted mono">({p.x.toFixed(0)},{p.y.toFixed(0)})</span>
        </button>
        <button class="danger" title="删除零件"
          disabled={editor.doc.parts.length <= 1}
          onclick={() => editor.removePart(p.id)}>✕</button>
      </div>
    {/each}
  </div>
  <button onclick={addPart}>+ 新增板件</button>

  <h3>孔位 ({editor.activePart?.holes.length ?? 0})</h3>
  <div class="card">
    <div class="row">
      <span class="lbl">新孔半径</span>
      <input type="number" min="0.5" bind:value={holeR} />
      <button onclick={addHole}>加孔</button>
    </div>
    <div class="scroll-list hole-list">
      {#each editor.activePart?.holes ?? [] as h (h.id)}
        <label class="hole-row">
          <input type="checkbox" data-testid="hole-check" checked={editor.selectedHoleIds.includes(h.id)}
            onchange={() => editor.toggleHoleSelection(h.id, true)} />
          <span class="mono">({h.cx.toFixed(0)},{h.cy.toFixed(0)}) r{h.r}</span>
        </label>
      {/each}
    </div>
    <div class="row">
      <button class="danger" onclick={removeHoles} disabled={!editor.selectedHoleIds.length}>删除选中孔</button>
      <span class="pill">已选 {editor.selectedHoleIds.length}</span>
    </div>
  </div>

  <h3>孔阵列(保持孔距)</h3>
  <div class="card">
    <div class="row">
      <span class="lbl">列数</span><input type="number" min="1" bind:value={arrayCols} />
      <span class="lbl">行数</span><input type="number" min="1" bind:value={arrayRows} />
    </div>
    <div class="row">
      <span class="lbl">列距 mm</span><input type="number" min="1" bind:value={arrayDx} />
    </div>
    <div class="row">
      <span class="lbl">行距 mm</span><input type="number" min="1" bind:value={arrayDy} />
    </div>
    <div class="row">
      <button onclick={suggestPitch}>按选中孔推算间距</button>
      <button class="primary" onclick={doArray} disabled={!editor.selectedHoleIds.length}>阵列复制</button>
    </div>
  </div>

  <h3>轮廓列表 ({editor.activePart?.contours.length ?? 0})</h3>
  <div class="scroll-list">
    {#each editor.activePart?.contours ?? [] as c, i (c.id)}
      <button
        class="card contour-item"
        class:selected={editor.selection?.kind === 'contour' && editor.selection.id === c.id}
        data-testid="contour-item"
        onclick={() => selectContour(c.id)}
      >
        轮廓 {i + 1}
        <span class="pill">{c.segs.length} 段</span>
        <span class="badge {isClosed(c) ? 'minor' : 'major'}">{isClosed(c) ? '闭合' : '开放'}</span>
      </button>
    {/each}
  </div>

  <h3>选中轮廓</h3>
  <div class="card">
    {#if editor.selection?.kind === 'contour'}
      {@const c = editor.findContour(editor.selection.partId, editor.selection.id)}
      {#if c}
        <div class="row"><span class="lbl">图元数</span><span class="mono">{c.segs.length}</span></div>
        <div class="row"><span class="lbl">周长</span><span class="mono">{contourLength(c).toFixed(1)} mm</span></div>
        <div class="row"><span class="lbl">状态</span>
          <span class="badge {isClosed(c) ? 'minor' : 'major'}">{isClosed(c) ? '已闭合' : '开放'}</span>
          <span class="pill">{isCCW(c) ? 'CCW' : 'CW'}</span>
        </div>
        <div class="row">
          {#if !isClosed(c)}<button onclick={closeContour}>闭合轮廓</button>{/if}
          <button onclick={duplicateContour}>复制</button>
          <button class="danger" onclick={removeContour}>删除</button>
        </div>
      {/if}
    {:else}
      <p class="muted">在列表或画布中点选轮廓;锚点可直接拖拽,也可使用左侧 ⊕/⊖ 工具增删。</p>
    {/if}
  </div>
</aside>

<style>
  .part-row { display: flex; gap: 6px; align-items: center; padding: 4px 6px; margin: 4px 0; }
  .part-row.active { border-color: var(--primary); background: var(--primary-soft); }
  .contour-item { display: flex; gap: 6px; align-items: center; width: 100%; text-align: left; margin: 4px 0; }
  .contour-item.selected { border-color: var(--primary); background: var(--primary-soft); font-weight: 600; }
  .lbl { color: var(--muted); min-width: 64px; }
  .name-btn { text-align: left; flex: 1; border: none; background: transparent; }
  .name-btn:hover { background: rgba(0,0,0,0.04); }
  .hole-list { max-height: 150px; }
  .hole-row { display: flex; gap: 8px; align-items: center; padding: 2px 0; cursor: pointer; }
</style>
