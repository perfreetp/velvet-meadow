<script>
  import { onMount } from 'svelte';
  import { editor, toggleCompare, toggleDeadOverlay } from '../lib/editor.svelte.js';
  import { worker3d } from '../lib/voxel/worker3d.js';

  let canvasEl = $state(null);
  let initialized = false;
  let wire = $state(false);
  let camDebug = $state('');
  let dragging = false;
  let last = null;

  onMount(async () => {
    const parent = canvasEl.parentElement;
    const w = parent.clientWidth, h = parent.clientHeight;
    await worker3d.init(canvasEl, Math.min(720, w), Math.min(560, h));
    initialized = true;
    const ro = new ResizeObserver(() => {
      const pw = parent.clientWidth, ph = parent.clientHeight;
      worker3d.resize(Math.max(200, Math.min(720, pw)), Math.max(180, Math.min(560, ph)));
    });
    ro.observe(parent);
    ro.observe(parent);
    // Worker 就绪后等首帧 field 到达，再让 worker 自行 refit 并回读相机
    setTimeout(async () => {
      try {
        const resp = await worker3d.refit();
        if (resp?.camera) {
          yaw = resp.camera.yaw; pitch = resp.camera.pitch; dist = resp.camera.dist;
          editor.camera3d = resp.camera;
        }
      } catch { /* 场未就绪时忽略，用户可点重置视角 */ }
    }, 300);
    return () => ro.disconnect();
  });

  // 轨道相机（本地维护角度）；Worker refit 回传后同步并立即推送
  let yaw = 0.7, pitch = 0.5, dist = 200;
  $effect(() => {
    const c = editor.camera3d;
    if (c) {
      yaw = c.yaw; pitch = c.pitch; dist = c.dist;
      worker3d.camera({ yaw, pitch, dist });
    }
  });

  function pushCam() {
    worker3d.camera({ yaw, pitch, dist });
  }

  function onDown(ev) { dragging = true; last = { x: ev.clientX, y: ev.clientY }; canvasEl.setPointerCapture(ev.pointerId); }
  function onMove(ev) {
    if (!dragging) return;
    yaw += (ev.clientX - last.x) * 0.01;
    pitch = Math.max(-1.35, Math.min(1.35, pitch + (ev.clientY - last.y) * 0.01));
    last = { x: ev.clientX, y: ev.clientY };
    pushCam();
  }
  function onUp() { dragging = false; }
  function onWheel(ev) {
    ev.preventDefault();
    dist = Math.max(20, dist * (ev.deltaY > 0 ? 1.1 : 0.9));
    pushCam();
  }

  async function resetView() {
    const resp = await worker3d.refit();
    if (resp?.camera) {
      yaw = resp.camera.yaw; pitch = resp.camera.pitch; dist = resp.camera.dist;
      editor.camera3d = resp.camera;
      camDebug = `dist=${resp.camera.dist.toFixed(1)} target=[${resp.camera.target.map((n) => n.toFixed(1)).join(',')}]`;
    }
  }

  function toggleWire() {
    wire = !wire;
    worker3d.wire(wire);
  }
</script>

<div class="view3d">
  <canvas
    bind:this={canvasEl}
    onpointerdown={onDown}
    onpointermove={onMove}
    onpointerup={onUp}
    onwheel={onWheel}
  ></canvas>

  <div class="overlay top-left">
    <div class="row" style="gap:6px; flex-wrap:wrap">
      <button class="tiny {wire ? 'active' : ''}" onclick={toggleWire}>线框</button>
      <button class="tiny {editor.deadOn ? 'active' : ''}" onclick={() => toggleDeadOverlay(!editor.deadOn)}>
        死角标色
      </button>
      <button class="tiny {editor.compareOn ? 'active' : ''}" onclick={() => toggleCompare(!editor.compareOn)}>
        与上一版叠加对比
      </button>
      <button class="tiny" onclick={resetView}>重置视角</button>    </div>
  </div>

  <div class="overlay top-right">
    {#if editor.lastStats}
      {@const stats = editor.lastStats}
      <h3 style="margin:0 0 6px">网格统计</h3>
      <p>合并 Quad：{stats.quadCount.toLocaleString()}</p>
      <p>减面前三角形：<b>{stats.trianglesBefore.toLocaleString()}</b></p>
      <p>减面后三角形：<b class={stats.decimated ? 'hl' : ''}>{stats.trianglesAfter.toLocaleString()}</b></p>
      <p>顶点数：{stats.verticesAfter.toLocaleString()}</p>
      {#if stats.decimated}
        <p class="muted">角度阈值 {stats.angleThresholdDeg}° · 折叠 {stats.collapses.toLocaleString()} 次</p>
        <p class="muted">降幅 {((1 - stats.trianglesAfter / stats.trianglesBefore) * 100).toFixed(1)}%</p>
      {:else}
        <p class="muted">未超 30 万面阈值，无需减面</p>
      {/if}
    {/if}
  </div>

  <div class="overlay bottom-left">
    {#if editor.deadOn}
      <span class="legend"><i style="background:#dc4646"></i> 铣刀不可达死角</span>
    {/if}
    {#if editor.compareOn}
      <span class="legend"><i style="background:#46cd6e"></i> 本版新增</span>
      <span class="legend"><i style="background:#eb822d"></i> 上一版已移除</span>
      {#if editor.diffInfo}
        <span class="muted">+{editor.diffInfo.added} / -{editor.diffInfo.removed} 格</span>
      {/if}
    {/if}
    <span class="legend"><i style="background:#5aaad0"></i> 型腔表面</span>
  </div>

  <div class="overlay bottom-right muted">
    {#if camDebug}<span data-cam>{camDebug}</span> · {/if}拖动旋转 · 滚轮缩放（OffscreenCanvas 软件渲染）
  </div>
</div>

<style>
  .view3d { flex: 1; position: relative; min-height: 0; background: #12151a; }
  canvas { width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; }
  canvas:active { cursor: grabbing; }
  .overlay { position: absolute; background: rgba(20,23,29,.82); border: 1px solid var(--border); border-radius: 8px; padding: 10px 12px; }
  .top-left { top: 10px; left: 10px; max-width: 60%; }
  .top-right { top: 10px; right: 10px; min-width: 190px; }
  .bottom-left { bottom: 10px; left: 10px; display: flex; gap: 14px; align-items: center; }
  .bottom-right { bottom: 10px; right: 10px; font-size: 11px; }
  p { margin: 3px 0; font-size: 12px; }
  .hl { color: var(--green); }
  .legend { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; }
  .legend i { width: 11px; height: 11px; border-radius: 3px; display: inline-block; }
</style>
