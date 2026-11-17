<script>
  import { compareIds, hoverId } from '../stores/state';
  import { LAYERS } from '../data/catalog';
  export let parts;
  export let onLocate = () => {};

  function remove(id) {
    compareIds.update((ids) => ids.filter((x) => x !== id));
  }
</script>

{#if $compareIds.length}
  <aside class="panel compare">
    <h3>
      对比清单 <span class="n">{$compareIds.length}/12</span>
      <button class="clear" on:click={() => compareIds.set([])}>清空</button>
    </h3>
    <div class="tblwrap">
      <table>
        <thead>
          <tr><th>件号</th><th>名称</th><th>材质</th><th>图层</th><th>互换机型</th><th></th></tr>
        </thead>
        <tbody>
          {#each $compareIds as id}
            {@const p = parts[id]}
            {#if p}
              <tr
                on:mouseenter={() => hoverId.set(id)}
                on:mouseleave={() => hoverId.set(-1)}
                on:click={() => onLocate(id)}
              >
                <td>{p.partNo}</td>
                <td>{p.name}</td>
                <td>{p.material}</td>
                <td>{LAYERS[p.layer].name}</td>
                <td>{p.models.join(' ')}</td>
                <td><button class="rm" on:click|stopPropagation={() => remove(id)}>×</button></td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  </aside>
{/if}
