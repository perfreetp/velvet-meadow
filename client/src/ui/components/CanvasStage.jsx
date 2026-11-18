import { onCleanup, onMount, createEffect, createMemo, Show } from 'solid-js';
import { PixiStage } from '../../pixi/PixiStage.js';
import { LightingClient } from '../../workers/LightingClient.js';
import {
  scene, sim, layers, tool, setTool, selection, setSelection,
  result, setResult, computing, setComputing, stats, setStats,
  addBuildingAt, addLightAt, moveEntity, moveBuildingVertex,
  readOnly, annotations, setAnnotations, currentPlan, solarDate, showToast,
} from '../../store/app.js';
import { computeBlockStats } from '../../engine/stats.js';

export default function CanvasStage() {
  let canvasRef;
  let stage;
  const client = new LightingClient();
  let renderQueued = false;
  let computeSeq = 0;

  const getState = () => ({
    scene, sim, layers, tool: tool(), selection,
    result: result(), readOnly: readOnly(), annotations: annotations(),
  });

  const hooks = {
    getState,
    onPick: (sel) => !readOnly() && setSelection(sel),
    onPlace: (type, wp) => { if (!readOnly()) addLightAt(type, wp.x, wp.y); },
    onCanvasClick: (wp) => { if (!readOnly()) addBuildingAt(wp.x, wp.y); },
    onDrag: (kind, id, x, y) => { if (!readOnly()) moveEntity(kind, id, x, y); },
    onVertexDrag: (id, index, x, y) => { if (!readOnly()) moveBuildingVertex(id, index, x, y); },
    onAnnotate: async (wp) => {
      const text = window.prompt('输入公示批注内容：');
      if (!text || !text.trim()) return;
      const plan = window.__currentPlanId?.();
      if (!plan) { showToast('请先在后台打开一个公示方案', 'warn'); return; }
      try {
        const { api } = await import('../../services/api.js');
        await api.addAnnotation(plan, { x: wp.x, y: wp.y, text: text.trim() });
        window.__reloadAnnotations?.();
        showToast('批注已提交', 'ok');
      } catch (err) {
        showToast(err.message, 'err');
      }
    },
  };

  onMount(async () => {
    stage = new PixiStage(canvasRef, hooks);
    await stage.init();
    stage.renderAll();
    scheduleCompute();
  });

  onCleanup(() => {
    client.dispose();
    stage?.destroy();
  });

  // ---------- 计算调度：参数/场景变化后防抖重算 ----------
  const computeSignature = createMemo(() => JSON.stringify({
    b: scene.buildings.map((b) => [b.id, b.floors, b.polygon]),
    l: scene.lights,
    bounds: scene.bounds,
    sim,
  }));

  createEffect(() => {
    computeSignature(); // 订阅
    scheduleCompute();
  });

  let timer = null;
  function scheduleCompute() {
    clearTimeout(timer);
    timer = setTimeout(runCompute, 120);
  }

  async function runCompute() {
    if (!stage) return;
    const my = ++computeSeq;
    setComputing(true);
    try {
      const r = await client.compute({
        buildings: scene.buildings,
        lights: scene.lights,
        bounds: scene.bounds,
        cell: sim.cell,
        hour: sim.hour,
        solarDate: solarDate(),
        lat: sim.lat,
        lng: sim.lng,
        exposure: sim.exposure,
        gamma: sim.gamma,
        includeSun: sim.includeSun,
        darkThreshold: sim.darkThreshold,
      });
      if (my !== computeSeq) return; // 已有更新的任务
      setResult(r);
      const st = computeBlockStats(r, scene.buildings, scene.blocks, sim.darkThreshold);
      setStats(st);
      window.__lastStats = st;
    } catch (err) {
      showToast(`照度计算失败：${err.message}`, 'err');
    } finally {
      if (my === computeSeq) setComputing(false);
    }
  }

  // ---------- 渲染调度：结果或图层变化时重绘 ----------
  createEffect(() => {
    result(); layers; selection; annotations();
    if (!stage || renderQueued) return;
    renderQueued = true;
    queueMicrotask(() => {
      renderQueued = false;
      stage?.renderAll();
    });
  });

  // 暴露给全局快捷键/其他面板
  window.__setTool = (t) => { if (!readOnly() || t === 'pan' || t === 'annotate') setTool(t); };
  window.__deleteSelected = () => {
    import('../../store/app.js').then((m) => m.removeSelected());
  };
  window.__fitView = () => stage?.fitToBounds(scene.bounds);
  window.__exportPNG = () => stage?.exportPNG();
  window.__currentPlanId = () => currentPlan()?.id || null;
  window.__reloadAnnotations = async () => {
    const { api } = await import('../../services/api.js');
    const id = currentPlan()?.id;
    if (id) setAnnotations(await api.listAnnotations(id));
  };

  return (
    <div class="canvas-host">
      <canvas ref={canvasRef} class="pixi-canvas" />
      <div class="canvas-hud">
        <Show when={computing()}>
          <span class="hud-chip computing">计算中…</span>
        </Show>
        <Show when={result()}>
          <span class="hud-chip">
            网格 {result().cols}×{result().rows}（{result().cell}m）· 峰值 {result().maxLux.toFixed(1)} lx
          </span>
          <Show when={result().sun}>
            <span class="hud-chip">
              太阳高度 {((result().sun.elev * 180) / Math.PI).toFixed(1)}°
              {result().sun.daylight ? '' : '（地平线下）'}
            </span>
          </Show>
        </Show>
        <Show when={stats()}>
          <span class="hud-chip warn">
            暗区块 {stats().summary.zoneCount} 个 · 暗区 {(stats().summary.darkRatio * 100).toFixed(1)}%
          </span>
        </Show>
      </div>

      <Show when={layers.heatmap}>
        <div class="heat-legend">
          <div class="hl-title">照度热力 (lx)</div>
          <div class="hl-row"><span class="hl-swatch" style={{ background: 'rgb(224,38,48)' }} /><b>&lt;20</b><i>暗区</i></div>
          <div class="hl-row"><span class="hl-swatch" style={{ background: 'rgb(240,138,46)' }} /><b>20–50</b><i>不足</i></div>
          <div class="hl-row"><span class="hl-swatch" style={{ background: 'rgb(238,210,70)' }} /><b>50–100</b><i>基本</i></div>
          <div class="hl-row"><span class="hl-swatch" style={{ background: 'rgb(150,214,92)' }} /><b>100–300</b><i>良好</i></div>
          <div class="hl-row"><span class="hl-swatch" style={{ background: 'rgb(58,180,130)' }} /><b>300–1000</b><i>充足</i></div>
          <div class="hl-row"><span class="hl-swatch" style={{ background: 'rgb(44,130,214)' }} /><b>&gt;1000</b><i>充沛</i></div>
        </div>
      </Show>
      <div class="canvas-tip">
        滚轮缩放 · Shift 拖拽平移 · 选中建筑后拖动蓝点改轮廓 · 快捷键 V/B/L/C/W/H
      </div>
    </div>
  );
}
