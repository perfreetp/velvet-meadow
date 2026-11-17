<script>
  import { layerState } from '../stores/state';
  import { LAYERS } from '../data/catalog';
  export let counts = [];

  function toggle(i) {
    layerState.update((s) => {
      s[i] = { ...s[i], visible: !s[i].visible };
      return s;
    });
  }
  function setAlpha(i, v) {
    layerState.update((s) => {
      s[i] = { ...s[i], alpha: +v };
      return s;
    });
  }
</script>

<aside class="panel layers">
  <h3>图层</h3>
  {#each LAYERS as layer, i}
    <div class="layer-row" class:off={!$layerState[i].visible}>
      <label>
        <input type="checkbox" checked={$layerState[i].visible} on:change={() => toggle(i)} />
        <span class="dot" style="background:{layer.color}"></span>
        <span class="lname">{layer.name}</span>
        <span class="count">{counts[i] ?? 0}</span>
      </label>
      <input
        type="range"
        min="0.05"
        max="1"
        step="0.05"
        value={$layerState[i].alpha}
        disabled={!$layerState[i].visible}
        on:input={(e) => setAlpha(i, e.currentTarget.value)}
        title="透明度"
      />
    </div>
  {/each}
  <p class="hint">拖动滑杆实时调整图层透明度;缩放图纸可查看 LOD 分级细节。</p>
</aside>
