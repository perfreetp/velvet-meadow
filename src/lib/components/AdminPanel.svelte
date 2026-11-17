<script>
  import {
    role, versions, draftChanges, analytics,
    submitVersion, publishVersion, rejectVersion,
  } from '../stores/state';
  import { LAYERS, MATERIALS } from '../data/catalog';

  export let parts;
  export let onApply = () => {}; // 发布后把变更应用到图册 + 渲染器
  export let onClose = () => {};

  let tab = 'assign';
  let search = '';
  let page = 0;
  const PAGE = 30;

  $: kw = search.trim().toUpperCase();
  $: filtered = kw
    ? parts.filter((p) => p.partNo !== 'FRAME' && (p.partNo.includes(kw) || p.name.includes(search.trim())))
    : parts.filter((p) => p.partNo !== 'FRAME');
  $: pageCount = Math.max(1, Math.ceil(filtered.length / PAGE));
  $: page = Math.min(page, pageCount - 1);
  $: pageParts = filtered.slice(page * PAGE, page * PAGE + PAGE);
  $: draftCount = Object.keys($draftChanges).length;

  function setDraft(id, field, value) {
    draftChanges.update((d) => {
      const c = { ...(d[id] || {}) };
      c[field] = value;
      return { ...d, [id]: c };
    });
  }

  function doSubmit() {
    if (submitVersion()) tab = 'review';
  }

  function doPublish(ver) {
    const list = publishVersion(ver);
    onApply(ver.changes, list);
  }

  const fmtDwell = (s) => (s >= 60 ? `${Math.floor(s / 60)}分${Math.round(s % 60)}秒` : `${Math.round(s)}秒`);
  $: statRows = Object.entries($analytics)
    .map(([id, s]) => ({ p: parts[+id], ...s }))
    .filter((r) => r.p)
    .sort((a, b) => b.views - a.views || b.dwell - a.dwell)
    .slice(0, 100);

  const statusText = { pending: '待审核', published: '已发布', rejected: '已驳回' };
</script>

<div class="modal-mask" on:click={onClose}>
  <div class="modal" on:click|stopPropagation>
    <header>
      <h3>图册后台管理</h3>
      <nav>
        <button class:active={tab === 'assign'} on:click={() => (tab = 'assign')}>图层归属</button>
        <button class:active={tab === 'review'} on:click={() => (tab = 'review')}>
          版本审核{#if $versions.some((v) => v.status === 'pending')}
            <i class="dot"></i>
          {/if}
        </button>
        <button class:active={tab === 'stats'} on:click={() => (tab = 'stats')}>查看统计</button>
      </nav>
      <span class="role-tag">当前角色:{$role === 'operator' ? '运营' : '技术主管'}</span>
      <button class="close" on:click={onClose}>×</button>
    </header>

    {#if tab === 'assign'}
      <div class="bar">
        <input placeholder="搜索件号 / 名称…" bind:value={search} />
        <span class="muted">草稿 {draftCount} 项</span>
        {#if $role === 'operator'}
          <button class="primary" disabled={!draftCount} on:click={doSubmit}>提交审核</button>
        {:else}
          <span class="muted">技术主管请在「版本审核」中处理提交</span>
        {/if}
      </div>
      <div class="tblwrap tall">
        <table>
          <thead>
            <tr><th>件号</th><th>名称</th><th>材质</th><th>图层归属</th><th>草稿</th></tr>
          </thead>
          <tbody>
            {#each pageParts as p (p.id)}
              {@const d = $draftChanges[p.id]}
              <tr class:dirty={!!d}>
                <td>{p.partNo}</td>
                <td>
                  <input
                    class="cell"
                    value={d?.name ?? p.name}
                    disabled={$role !== 'operator'}
                    on:change={(e) => setDraft(p.id, 'name', e.currentTarget.value)}
                  />
                </td>
                <td>
                  <select
                    class="cell"
                    value={d?.material ?? p.material}
                    disabled={$role !== 'operator'}
                    on:change={(e) => setDraft(p.id, 'material', e.currentTarget.value)}
                  >
                    {#each MATERIALS as m}<option value={m}>{m}</option>{/each}
                  </select>
                </td>
                <td>
                  <select
                    class="cell"
                    value={d?.layer ?? p.layer}
                    disabled={$role !== 'operator'}
                    on:change={(e) => setDraft(p.id, 'layer', +e.currentTarget.value)}
                  >
                    {#each LAYERS as l}<option value={l.id}>{l.name}</option>{/each}
                  </select>
                </td>
                <td>{d ? '●' : ''}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="pager">
        <button disabled={page === 0} on:click={() => (page -= 1)}>上一页</button>
        <span>{page + 1} / {pageCount}(共 {filtered.length} 件)</span>
        <button disabled={page >= pageCount - 1} on:click={() => (page += 1)}>下一页</button>
      </div>
    {:else if tab === 'review'}
      <div class="tblwrap tall">
        <table>
          <thead>
            <tr><th>版本</th><th>提交时间</th><th>提交人</th><th>变更数</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>V1</td><td>—</td><td>系统</td><td>—</td>
              <td><span class="tag pub">已发布</span></td><td></td>
            </tr>
            {#each $versions as ver (ver.id)}
              <tr>
                <td>{ver.id}</td>
                <td>{ver.ts}</td>
                <td>{ver.by}</td>
                <td>{Object.keys(ver.changes).length}</td>
                <td>
                  <span class="tag" class:pub={ver.status === 'published'} class:rej={ver.status === 'rejected'}>
                    {statusText[ver.status]}
                  </span>
                </td>
                <td>
                  {#if ver.status === 'pending' && $role === 'supervisor'}
                    <button class="primary sm" on:click={() => doPublish(ver)}>审核发布</button>
                    <button class="sm" on:click={() => rejectVersion(ver)}>驳回</button>
                  {:else if ver.status === 'pending'}
                    <span class="muted">等待技术主管审核</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <div class="tblwrap tall">
        <table>
          <thead>
            <tr><th>#</th><th>件号</th><th>名称</th><th>查看次数</th><th>累计停留</th></tr>
          </thead>
          <tbody>
            {#each statRows as r, i}
              <tr>
                <td>{i + 1}</td>
                <td>{r.p.partNo}</td>
                <td>{r.p.name}</td>
                <td>{r.views}</td>
                <td>{fmtDwell(r.dwell)}</td>
              </tr>
            {:else}
              <tr><td colspan="5" class="muted">暂无数据 —— 在图纸上点选零件后开始统计</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
