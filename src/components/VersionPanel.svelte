<script>
  import {
    editor, saveVersion, submitVersion, reviewVersion,
    loadVersion, toggleCompare
  } from '../lib/editor.svelte.js';

  let { onClose } = $props();
  let label = $state('');
  let rejectId = $state(null);
  let rejectComment = $state('');

  async function save() {
    await saveVersion(label.trim());
    label = '';
  }

  async function approve(id) {
    await reviewVersion(id, 'approve');
  }
  async function reject(id) {
    if (!rejectComment.trim()) return;
    await reviewVersion(id, 'reject', rejectComment.trim());
    rejectId = null;
    rejectComment = '';
  }

  const isLeader = $derived(editor.role === 'leader');
  const isTech = $derived(editor.role === 'technician');
  const fmt = (t) => new Date(t).toLocaleString('zh-CN', { hour12: false });
</script>

<div class="modal-mask" onclick={onClose}>
  <div class="modal wide" onclick={(e) => e.stopPropagation()}>
    <div class="head">
      <h2 style="margin:0">版本建档与审批 · {editor.project?.moldNo}</h2>
      <button class="tiny" onclick={onClose}>关闭</button>
    </div>

    <div class="save-row">
      <input placeholder="版本说明，如：粗加工型腔第一版" bind:value={label} />
      <button class="primary" onclick={save}>存为新版本</button>
    </div>

    <div class="vers scroll">
      {#each editor.versions as v (v.id)}
        <article class="ver">
          <div class="ver-head">
            <strong>V{v.version}</strong>
            <span class="tag {v.status}">{
              v.status === 'draft' ? '草稿' :
              v.status === 'submitted' ? '待审批' :
              v.status === 'approved' ? '已通过' : '已退回'
            }</span>
            <span class="muted">{v.author} · {fmt(v.createdAt)}</span>
          </div>
          <p class="label">{v.label}</p>
          {#if v.stats}
            <p class="muted stats">
              三角形 {v.stats.trianglesBefore.toLocaleString()}
              {#if v.stats.decimated}→ {v.stats.trianglesAfter.toLocaleString()}（{v.stats.angleThresholdDeg}°减面）{/if}
            </p>
          {/if}
          {#if v.status === 'rejected'}
            <div class="comment">退回意见：{v.reviewComment}</div>
          {/if}
          <div class="ver-actions">
            <button class="tiny" onclick={() => { loadVersion(v.id, { refit: true }); onClose(); }}>调出叠看</button>
            <button class="tiny" onclick={() => { toggleCompare(true); onClose(); }}>与当前差异</button>
            {#if isTech && v.status === 'draft'}
              <button class="tiny primary" onclick={() => submitVersion(v.id)}>提交审批</button>
            {/if}
            {#if isLeader && v.status === 'submitted'}
              <button class="tiny" style="color:var(--green);border-color:var(--green)" onclick={() => approve(v.id)}>通过</button>
              {#if rejectId === v.id}
                <div class="reject-box">
                  <input placeholder="退回意见（必填）" bind:value={rejectComment} />
                  <button class="tiny danger" onclick={() => reject(v.id)}>确认退回</button>
                  <button class="tiny" onclick={() => (rejectId = null)}>取消</button>
                </div>
              {:else}
                <button class="tiny danger" onclick={() => (rejectId = v.id)}>退回</button>
              {/if}
            {/if}
            {#if isLeader && v.status !== 'submitted'}
              <span class="muted tiny-note">组长视角：仅待审批版本可操作</span>
            {/if}
          </div>
        </article>
      {:else}
        <p class="muted center">还没有存档版本。编辑后点击“存为新版本”按编号建档。</p>
      {/each}
    </div>
  </div>
</div>

<style>
  .modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: grid; place-items: center; z-index: 60; }
  .modal { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 20px; width: 620px; max-width: 94vw; max-height: 86vh; display: flex; flex-direction: column; }
  .modal.wide { width: 680px; }
  .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
  .save-row { display: flex; gap: 8px; margin-bottom: 14px; }
  .vers { display: flex; flex-direction: column; gap: 10px; }
  .ver { border: 1px solid var(--border); border-radius: 8px; padding: 12px; background: var(--panel2); }
  .ver-head { display: flex; align-items: center; gap: 10px; }
  .label { margin: 6px 0 2px; }
  .stats { margin: 2px 0; font-size: 11px; }
  .ver-actions { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; align-items: center; }
  .comment { margin-top: 6px; padding: 7px 10px; border-left: 3px solid var(--red); background: rgba(220,70,70,.12); border-radius: 4px; font-size: 12px; }
  .reject-box { display: flex; gap: 6px; flex: 1; min-width: 240px; }
  .center { text-align: center; padding: 30px; }
  .tiny-note { font-size: 11px; }
</style>
