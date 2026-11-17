<script lang="ts">
  import { editor } from '../editor/store.svelte';
  import { isPartOutOfBoard } from '../geometry/checks';

  const outCount = $derived(editor.doc.parts.filter(p => isPartOutOfBoard(editor.doc, p)).length);
  const openCount = $derived(editor.report?.findings.filter(f => f.status === 'open').length ?? 0);
</script>

<footer class="statusbar">
  <span>板幅 {editor.doc.board.width}×{editor.doc.board.height}×{editor.doc.board.thickness}mm</span>
  <span>零件 {editor.doc.parts.length}</span>
  <span>工具: {editor.tool}</span>
  <span class={outCount ? 'bad' : 'ok'}>
    {outCount ? `⚠ ${outCount} 个零件越界(画布红色)` : '✓ 全部在板幅内'}
  </span>
  {#if editor.report}
    <span class={openCount ? 'bad' : 'ok'}>
      {openCount ? `${openCount} 条问题待复核` : '✓ 复核完成'}
    </span>
  {/if}
  <span style="margin-left:auto" class="muted">Ctrl+Z 撤销 · Ctrl+Shift+Z 重做 · 滚轮缩放 · 空格平移 · 双击结束绘制</span>
</footer>

<style>
  .muted { color: #a8a29e; }
</style>
