<script>
  import { analytics } from '../stores/state';
  import { LAYERS } from '../data/catalog';
  export let part; // 当前选中零件
  export let parts;
  export let onLocate = () => {};

  $: stat = part ? $analytics[part.id] : null;
  const fmtDwell = (s) => (s >= 60 ? `${Math.floor(s / 60)}分${Math.round(s % 60)}秒` : `${Math.round(s)}秒`);
</script>

{#if part}
  <aside class="panel info">
    <h3>零件信息</h3>
    <div class="kv"><span>件号</span><b>{part.partNo}</b></div>
    <div class="kv"><span>名称</span><b>{part.name}</b></div>
    <div class="kv"><span>材质</span><b>{part.material}</b></div>
    <div class="kv"><span>所属图层</span><b>{LAYERS[part.layer].name}</b></div>
    <div class="kv"><span>互换机型</span>
      <b>{part.models.length ? part.models.join(' / ') : '—'}</b>
    </div>
    <div class="kv"><span>被查看</span><b>{stat ? stat.views : 0} 次 · 停留 {stat ? fmtDwell(stat.dwell) : '0秒'}</b></div>

    <h4>相邻零件</h4>
    <div class="adj">
      {#each part.adj as id}
        {@const q = parts[id]}
        {#if q}
          <button on:click={() => onLocate(id)} title="定位到该零件">
            <em>{q.partNo}</em> {q.name}
          </button>
        {/if}
      {/each}
    </div>
  </aside>
{/if}
