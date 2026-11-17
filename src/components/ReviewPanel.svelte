<script lang="ts">
  import { editor } from '../editor/store.svelte';
  import { SEVERITY_META, batchPassable, type Severity } from '../geometry/checks';
  import type { Finding } from '../geometry/checks';
  import BatchWorker from '../workers/batch.worker?worker';
  import type { BatchResult } from '../workers/batch.worker';

  let filter = $state<'all' | Severity>('all');
  let batchProgress = $state<{ done: number; total: number } | null>(null);
  let batchResult = $state<BatchResult | null>(null);
  let worker: Worker | null = null;

  const report = () => editor.report;

  const counts = $derived.by(() => {
    const c = { critical: 0, major: 0, minor: 0, open: 0 };
    for (const f of report()?.findings ?? []) {
      c[f.severity]++;
      if (f.status === 'open') c.open++;
    }
    return c;
  });

  const visible = $derived(
    (report()?.findings ?? []).filter(f => filter === 'all' || f.severity === filter)
  );

  const passable = $derived(report() ? batchPassable(report()!) : false);

  function statusLabel(f: Finding): string {
    return { open: '待复核', confirmed: '已确认', rejected: '已驳回', waived: '已豁免' }[f.status];
  }

  function locate(f: Finding): void {
    editor.setActivePart(f.partId);
    const part = editor.findPart(f.partId);
    if (part && part.contours[0]) {
      editor.selection = { kind: 'contour', id: part.contours[0].id, partId: part.id };
    }
  }

  function release(): void {
    if (!passable) return;
    alert('✅ 整批达标,已放行。可导出激光 SVG 交付切割。');
  }

  function rejectBatch(): void {
    if (!report()) return;
    const n = report()!.findings.filter(f => f.status === 'open' || f.status === 'confirmed').length;
    if (!confirm(`确认退回供应方?当前仍有 ${n} 条未驳回/未豁免问题,将随问题清单一并退回。`)) return;
    const lines: string[] = [];
    lines.push(`# 退供问题清单 ${new Date().toLocaleString('zh-CN')}`);
    for (const f of report()!.findings) {
      if (f.status === 'rejected') continue;
      lines.push(`- [${SEVERITY_META[f.severity].label}] ${f.partName}:${f.message} (${statusLabel(f)})`);
    }
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '退供问题清单.md';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /** 批量图纸进来:Worker + OffscreenCanvas 自动跑一遍检查 */
  function runBatch(files: FileList): void {
    const readers = Array.from(files).map(
      f => new Promise<{ name: string; doc: import('../geometry/types').Doc }>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => {
          try {
            const doc = JSON.parse(String(r.result));
            resolve({ name: f.name, doc });
          } catch (e) { reject(e); }
        };
        r.onerror = () => reject(r.error);
        r.readAsText(f);
      })
    );
    Promise.all(readers).then(docs => {
      worker = new BatchWorker();
      batchProgress = { done: 0, total: docs.length };
      worker.onmessage = (ev: MessageEvent) => {
        if (ev.data.type === 'progress') {
          batchProgress = { done: ev.data.done, total: ev.data.total };
        } else if (ev.data.type === 'done') {
          batchResult = ev.data.result as BatchResult;
          batchProgress = null;
          worker?.terminate();
          // 把第一张图纸载入编辑器
          if (docs[0]) {
            editor.loadDoc(docs[0].doc);
            editor.runChecks();
          }
        }
      };
      worker.postMessage({ batchId: `b_${Date.now()}`, docs });
    }).catch(e => alert('批量文件读取失败(请选择工程快照 .json):' + e));
  }

  let batchInput: HTMLInputElement;
</script>

<section class="review-panel">
  <div class="review-head">
    <h3>质量复核</h3>
    <button onclick={() => batchInput.click()}>批量图纸检查</button>
    <input bind:this={batchInput} type="file" accept=".json" multiple hidden
      onchange={(e) => { const f = e.currentTarget.files; if (f?.length) runBatch(f); e.currentTarget.value = ''; }} />
  </div>

  {#if batchProgress}
    <div class="card">
      <div>Worker 检查中… {batchProgress.done}/{batchProgress.total}</div>
      <div class="progress"><div style={`width:${(batchProgress.done / batchProgress.total) * 100}%`}></div></div>
    </div>
  {/if}

  {#if batchResult}
    <div class="card">
      <strong>批量结果(共 {batchResult.items.length} 张)</strong>
      <div class="scroll-list">
        {#each batchResult.items as item (item.name)}
          <div class="batch-row">
            <span class="grow">{item.name}</span>
            {#if item.error}<span class="badge critical">解析失败</span>
            {:else if item.critical + item.major + item.minor === 0}<span class="badge minor">合格</span>
            {:else}
              <span class="badge critical">{item.critical} 严重</span>
              <span class="badge major">{item.major} 主要</span>
              <span class="badge minor">{item.minor} 提示</span>
            {/if}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  {#if report()}
    <div class="summary-cards">
      <div class="sum critical"><b>{counts.critical}</b><span>严重</span></div>
      <div class="sum major"><b>{counts.major}</b><span>主要</span></div>
      <div class="sum minor"><b>{counts.minor}</b><span>提示</span></div>
    </div>

    <div class="filter-row">
      {#each ['all', 'critical', 'major', 'minor'] as f (f)}
        <button class={filter === f ? 'active' : ''} onclick={() => (filter = f as typeof filter)}>
          {f === 'all' ? '全部' : SEVERITY_META[f as Severity].label}
        </button>
      {/each}
    </div>

    <div class="scroll-list findings">
      {#each visible as f (f.id)}
        <div class="card finding {f.status}">
          <div class="finding-top">
            <span class="badge {f.severity}">{SEVERITY_META[f.severity].label}</span>
            <span class="pill">{statusLabel(f)}</span>
          </div>
          <p>{f.message}</p>
          <div class="finding-actions">
            <button onclick={() => locate(f)}>定位</button>
            <button class="primary" data-testid="confirm-btn" disabled={f.status === 'confirmed'}
              onclick={() => editor.setFindingStatus(f.id, 'confirmed')}>确认</button>
            <button data-testid="reject-btn" disabled={f.status === 'rejected'}
              onclick={() => editor.setFindingStatus(f.id, 'rejected')}>驳回</button>
            {#if f.severity !== 'critical'}
              <button disabled={f.status === 'waived'}
                onclick={() => editor.setFindingStatus(f.id, 'waived')}>豁免</button>
            {/if}
          </div>
        </div>
      {/each}
      {#if visible.length === 0}
        <p class="muted empty">该档位下没有问题。</p>
      {/if}
    </div>

    <div class="gate">
      <button class="primary" disabled={!passable} onclick={release}>✅ 整批放行</button>
      <button class="danger" onclick={rejectBatch}>↩ 退回供应方</button>
    </div>
    {#if !passable}
      <p class="muted gate-hint">存在未处理问题,放行已锁定;严重问题不允许豁免。</p>
    {/if}
  {:else}
    <p class="muted empty">点击顶栏「运行检查」或导入批量图纸,问题会按严重 / 主要 / 提示三档列在这里。</p>
  {/if}
</section>

<style>
  .review-panel { display: flex; flex-direction: column; }
  .review-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .review-head h3 { margin: 0; }
  .summary-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 10px 0; }
  .sum { border-radius: 8px; padding: 8px; text-align: center; background: #f6f4ef; }
  .sum b { display: block; font-size: 20px; }
  .sum.critical b { color: var(--danger); }
  .sum.major b { color: #b45309; }
  .sum.minor b { color: var(--info); }
  .sum span { color: var(--muted); font-size: 11px; }
  .filter-row { display: flex; gap: 6px; margin-bottom: 8px; }
  .filter-row button { flex: 1; padding: 4px 0; }
  .findings { max-height: 340px; }
  .finding { padding: 8px; }
  .finding.rejected { opacity: 0.5; }
  .finding-top { display: flex; gap: 6px; align-items: center; }
  .finding p { margin: 6px 0; line-height: 1.45; }
  .finding-actions { display: flex; gap: 5px; flex-wrap: wrap; }
  .finding-actions button { padding: 3px 9px; }
  .gate { display: flex; gap: 8px; margin-top: 10px; }
  .gate button { flex: 1; }
  .gate-hint { font-size: 11px; margin: 6px 0 0; }
  .batch-row { display: flex; gap: 4px; align-items: center; padding: 3px 0; font-size: 12px; }
  .progress { height: 6px; background: #e7e3da; border-radius: 3px; margin-top: 6px; overflow: hidden; }
  .progress div { height: 100%; background: var(--primary); transition: width 0.2s; }
  .empty { margin-top: 14px; line-height: 1.6; }
</style>
