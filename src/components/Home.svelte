<script>
  import { onMount } from 'svelte';
  import * as db from '../lib/voxel/db.js';
  import { newProject, openProject, notify } from '../lib/editor.svelte.js';

  let { key = 0 } = $props();
  let projects = $state([]);
  let showNew = $state(false);
  let tab = $state('active'); // active | archive
  let q = $state({ moldNo: '', materialNo: '', from: '', to: '' });

  const form = $state({
    code: '', moldNo: '', materialNo: '', material: 'P20',
    sizeX: 120, sizeY: 100, sizeZ: 60, author: ''
  });

  async function loadList() {
    projects = tab === 'archive'
      ? await db.searchArchive({
          moldNo: q.moldNo, materialNo: q.materialNo,
          from: q.from ? new Date(q.from).getTime() : undefined,
          to: q.to ? new Date(q.to).getTime() + 86399999 : undefined
        })
      : (await db.listProjects()).filter((p) => !p.archivedAt);
  }

  onMount(loadList);
  $effect(() => { void key; loadList(); });
  $effect(() => { void tab; loadList(); });

  async function create() {
    if (!form.moldNo || !form.materialNo) return notify('模号和料号必填');
    if (form.sizeX <= 0 || form.sizeY <= 0 || form.sizeZ <= 0) return notify('毛坯尺寸需大于 0');
    form.code = form.code || `MVS-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
    await newProject({ ...form });
  }

  async function toggleArchive(p) {
    await db.archiveProject(p.id, !p.archivedAt);
    await loadList();
  }

  async function remove(p) {
    if (!confirm(`确认删除项目 ${p.moldNo} 及其全部版本？`)) return;
    await db.deleteProject(p.id);
    await loadList();
  }

  const fmt = (t) => new Date(t).toLocaleString('zh-CN', { hour12: false });
  const dims = (p) => `${p.dims.nx * 0.5}×${p.dims.ny * 0.5}×${p.dims.nz * 0.5}mm`;
</script>

<div class="home">
  <header>
    <div>
      <h1>型腔粗坯体素建模工具</h1>
      <p class="muted">0.5mm 分层体素场 · 镜像编辑 · 死角分析 · 网格减面 · 版本审批归档</p>
    </div>
    <button class="primary" onclick={() => (showNew = true)}>+ 新建模仁毛坯</button>
  </header>

  <nav class="tabs">
    <button class={tab === 'active' ? 'active' : ''} onclick={() => (tab = 'active')}>在制项目</button>
    <button class={tab === 'archive' ? 'active' : ''} onclick={() => (tab = 'archive')}>归档检索</button>
  </nav>

  {#if tab === 'archive'}
    <div class="search">
      <div><label>模号</label><input placeholder="如 M2026" bind:value={q.moldNo} oninput={loadList} /></div>
      <div><label>料号</label><input placeholder="如 MAT-08" bind:value={q.materialNo} oninput={loadList} /></div>
      <div><label>归档日期起</label><input type="date" bind:value={q.from} onchange={loadList} /></div>
      <div><label>止</label><input type="date" bind:value={q.to} onchange={loadList} /></div>
    </div>
  {/if}

  <div class="grid scroll">
    {#each projects as p (p.id)}
      <article class="card">
        <div class="card-head">
          <strong>{p.moldNo}</strong>
          {#if p.archivedAt}<span class="tag draft">已归档</span>{/if}
        </div>
        <p class="muted">编号 {p.code}</p>
        <dl>
          <div><dt>料号</dt><dd>{p.materialNo}（{p.material}）</dd></div>
          <div><dt>外形</dt><dd>{dims(p)}</dd></div>
          <div><dt>更新</dt><dd>{fmt(p.updatedAt)}</dd></div>
        </dl>
        <div class="card-actions">
          <button class="primary tiny" onclick={() => openProject(p.id)}>打开</button>
          <button class="tiny" onclick={() => toggleArchive(p)}>{p.archivedAt ? '取消归档' : '归档'}</button>
          <button class="tiny danger" onclick={() => remove(p)}>删除</button>
        </div>
      </article>
    {:else}
      <p class="muted empty">{tab === 'archive' ? '没有匹配的归档项目' : '还没有项目，点击右上角新建模仁毛坯'}</p>
    {/each}
  </div>
</div>

{#if showNew}
  <div class="modal-mask" onclick={() => (showNew = false)}>
    <div class="modal" onclick={(e) => e.stopPropagation()}>
      <h2>新建模仁毛坯（0.5mm/格）</h2>
      <div class="two-col">
        <div class="field"><label>建档编号（留空自动生成）</label><input bind:value={form.code} placeholder="MVS-2026-00001" /></div>
        <div class="field"><label>模号 *</label><input bind:value={form.moldNo} /></div>
        <div class="field"><label>料号 *</label><input bind:value={form.materialNo} /></div>
        <div class="field">
          <label>钢材</label>
          <select bind:value={form.material}>
            <option>P20</option><option>718H</option><option>S136</option><option>NAK80</option><option>H13</option>
          </select>
        </div>
        <div class="field"><label>X 尺寸 mm</label><input type="number" step="0.5" bind:value={form.sizeX} /></div>
        <div class="field"><label>Y 尺寸 mm</label><input type="number" step="0.5" bind:value={form.sizeY} /></div>
        <div class="field"><label>Z 尺寸 mm</label><input type="number" step="0.5" bind:value={form.sizeZ} /></div>
        <div class="field"><label>工艺员</label><input bind:value={form.author} placeholder="姓名" /></div>
      </div>
      <p class="muted">体素场规模：{Math.round(form.sizeX / 0.5)} × {Math.round(form.sizeY / 0.5)} × {Math.round(form.sizeZ / 0.5)} 格
        （{Math.round(form.sizeX / 0.5) * Math.round(form.sizeY / 0.5) * Math.round(form.sizeZ / 0.5)} 格）</p>
      <div class="row right">
        <button onclick={() => (showNew = false)}>取消</button>
        <button class="primary" onclick={create}>建档并进入</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .home { padding: 22px 28px; height: 100%; display: flex; flex-direction: column; }
  header { display: flex; justify-content: space-between; align-items: flex-start; }
  h1 { margin: 0 0 4px; font-size: 20px; }
  .tabs { margin: 18px 0 12px; display: flex; gap: 8px; }
  .search { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; padding-bottom: 20px; }
  .card { background: var(--panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; }
  .card-head { display: flex; justify-content: space-between; align-items: center; }
  dl { margin: 10px 0; display: grid; gap: 5px; }
  dl div { display: flex; gap: 8px; }
  dt { color: var(--muted); width: 42px; flex: none; }
  dd { margin: 0; }
  .card-actions { display: flex; gap: 8px; margin-top: 10px; }
  .empty { grid-column: 1 / -1; text-align: center; padding: 50px; }
  .modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: grid; place-items: center; z-index: 50; }
  .modal { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: 22px; width: 560px; max-width: 92vw; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
  .right { justify-content: flex-end; }
</style>
