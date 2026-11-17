<script lang="ts">
  import { editor } from '../editor/store.svelte';
  import type { BoolOp } from '../geometry/boolean';

  let fileInput: HTMLInputElement;
  let batchInput: HTMLInputElement;

  function undo(): void { editor.undo(); }
  function redo(): void { editor.redo(); }

  function doBoolean(op: BoolOp): void {
    const sel = editor.selection;
    if (sel?.kind !== 'contour') {
      alert('请先选中一个轮廓,再选择与之运算的第二个闭合轮廓');
      return;
    }
    const part = editor.findPart(sel.partId);
    if (!part) return;
    const closed = part.contours.filter(c => c.closed && c.id !== sel.id);
    if (!closed.length) {
      alert('当前零件没有第二个闭合轮廓可参与运算');
      return;
    }
    const ok = editor.booleanTwo(sel.partId, sel.id, closed[0].id, op);
    if (!ok) alert('布尔运算失败:请确认两个轮廓均闭合且有有效交点');
    else editor.runChecks();
  }

  function unionAll(): void {
    const part = editor.activePart;
    if (!part) return;
    editor.unionPart(part.id);
    editor.runChecks();
  }

  function exportSVG(): void {
    const svg = editor.exportSVG();
    download(`板材_${editor.doc.board.width}x${editor.doc.board.height}.svg`, svg, 'image/svg+xml');
  }

  function exportIssueList(): void {
    if (!editor.report) return;
    const lines: string[] = [];
    lines.push(`# 图纸问题清单  生成时间:${new Date().toLocaleString('zh-CN')}`);
    lines.push(`板幅:${editor.doc.board.width}×${editor.doc.board.height}mm  图纸数:${editor.report.drawingCount}`);
    lines.push('');
    const rank = { critical: 0, major: 1, minor: 2 } as const;
    const sorted = [...editor.report.findings].sort((a, b) => rank[a.severity] - rank[b.severity]);
    for (const f of sorted) {
      lines.push(`- [${f.severity.toUpperCase()}] (${f.status}) ${f.partName}:${f.message}`);
    }
    lines.push('');
    lines.push(editor.report.passed ? '结论:整批达标,准予放行' : '结论:整批不达标,退回供应方整改');
    download('问题清单.md', lines.join('\n'), 'text/markdown');
  }

  function download(name: string, content: string, mime: string): void {
    const blob = new Blob([content], { type: `${mime};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
  }

  function onImport(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const part = editor.importSVG(String(reader.result), file.name.replace(/\.svg$/i, ''));
        alert(`导入成功:零件「${part.name}」,${part.contours.length} 个轮廓,${part.holes.length} 个孔`);
        editor.runChecks();
      } catch (err) {
        alert('SVG 解析失败:' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function saveSnapshot(): void {
    download('工程快照.json', JSON.stringify(editor.doc, null, 2), 'application/json');
  }

  function loadSnapshot(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const doc = JSON.parse(String(reader.result));
        if (!doc.board || !Array.isArray(doc.parts)) throw new Error('文件结构不正确');
        editor.loadDoc(doc);
      } catch (err) {
        alert('快照加载失败:' + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  function newDoc(): void {
    if (confirm('新建空白板材?当前未导出的修改仍保留在浏览器历史中。')) editor.newDoc();
  }
</script>

<header class="topbar">
  <span class="brand">🛠 板式件矢量轮廓编辑器</span>
  <div class="group">
    <button onclick={newDoc}>新建</button>
    <button onclick={() => fileInput.click()}>导入 SVG</button>
    <input bind:this={fileInput} type="file" accept=".svg,image/svg+xml" hidden onchange={onImport} />
    <button onclick={saveSnapshot}>保存快照</button>
    <button onclick={() => batchInput.click()}>加载快照</button>
    <input bind:this={batchInput} type="file" accept=".json,application/json" hidden onchange={loadSnapshot} />
    <button class="primary" onclick={exportSVG}>导出激光 SVG</button>
  </div>
  <div class="sep"></div>
  <div class="group">
    <button onclick={undo} disabled={!editor.history.canUndo}>↶ 撤销</button>
    <button onclick={redo} disabled={!editor.history.canRedo}>↷ 重做</button>
    <span class="pill">历史 {editor.historyTick ? editor.history.depth : editor.history.depth}/50</span>
  </div>
  <div class="sep"></div>
  <div class="group">
    <button onclick={() => doBoolean('union')}>并集</button>
    <button onclick={() => doBoolean('subtract')}>差集</button>
    <button onclick={() => doBoolean('intersect')}>交集</button>
    <button onclick={unionAll} title="当前零件全部闭合轮廓两两合并">全部合并</button>
  </div>
  <div class="sep"></div>
  <div class="group">
    <button onclick={() => editor.runChecks()}>🔍 运行检查</button>
    <button onclick={exportIssueList} disabled={!editor.report}>导出问题清单</button>
  </div>
</header>
