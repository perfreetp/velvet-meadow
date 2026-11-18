import { For, Show, createSignal } from 'solid-js';
import { result, stats, scene, sim, currentPlan, showToast, layers, setLayers, tool, setTool } from '../../store/app.js';
import { statsToCSV, darkZonesToCSV } from '../../engine/stats.js';
import { api } from '../../services/api.js';

export default function StatsPanel() {
  const [probe, setProbe] = createSignal(null);

  const enterProbe = () => {
    if (!layers.heatmap) setLayers('heatmap', true);
    setTool('probe');
    showToast('探针模式：在画布上点击或移动读取每格照度，按 V 退出', 'info');
  };

  const download = (content, name, mime = 'text/csv;charset=utf-8') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const exportStatsCSV = () => {
    if (!stats()) return;
    download(statsToCSV(stats()), `照度统计_${Date.now()}.csv`);
    showToast('照度统计 CSV 已导出', 'ok');
  };

  const exportDarkCSV = () => {
    const r = result();
    if (!r) return;
    download(darkZonesToCSV(r.darkZones, r.cell), `暗区清单_${Date.now()}.csv`);
  };

  const exportPNG = async () => {
    const dataUrl = await window.__exportPNG?.();
    if (!dataUrl) { showToast('画布尚未就绪', 'warn'); return; }
    const a = document.createElement('a');
    a.href = dataUrl; a.download = `布光效果图_${Date.now()}.png`; a.click();
    showToast('效果图 PNG 已导出', 'ok');
  };

  const syncStats = async () => {
    const plan = currentPlan();
    if (!plan) { showToast('请先在「方案后台」保存方案再回传统计', 'warn'); return; }
    try {
      await api.putStats(plan.id, stats());
      showToast('街坊统计已同步到后台', 'ok');
    } catch (err) { showToast(err.message, 'err'); }
  };

  // 探针：点击网格读单格照度
  const probeAt = (gx, gy) => {
    const r = result();
    if (!r) return;
    const idx = gy * r.cols + gx;
    setProbe({
      gx, gy,
      lux: r.lux[idx], sun: r.sunLux[idx], artificial: r.artificialLux[idx],
      dark: !!r.darkMask[idx],
    });
  };
  window.__probeCell = probeAt;

  return (
    <div class="stats-panel">
      <h3 class="panel-title">暗区识别（阈值 {sim.darkThreshold} lx）</h3>
      <Show when={stats()} fallback={<p class="hint">等待计算结果…</p>}>
        <div class="stat-cards">
          <div class="stat-card">
            <div class="stat-num">{stats().summary.zoneCount}</div>
            <div class="stat-label">暗区块数</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{stats().summary.darkAreaM2.toLocaleString()}<small>m²</small></div>
            <div class="stat-label">暗区总面积</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{(stats().summary.darkRatio * 100).toFixed(1)}<small>%</small></div>
            <div class="stat-label">暗区占比</div>
          </div>
          <div class="stat-card">
            <div class="stat-num">{stats().summary.avgLux.toFixed(1)}<small>lx</small></div>
            <div class="stat-label">全域平均照度</div>
          </div>
        </div>

        <h4 class="sub-title">暗区块清单（按面积降序，前 12）</h4>
        <div class="zone-list">
          <For each={result().darkZones.slice(0, 12)}>
            {(z, i) => (
              <div class="zone-row" classList={{ severe: z.areaM2 >= 20 }}>
                <span class="zone-idx">#{i() + 1}</span>
                <span>{z.cells} 格</span>
                <span>{z.areaM2} m²</span>
                <span class="zone-pos">
                  ({z.worldBBox.minX},{z.worldBBox.minY})–({z.worldBBox.maxX},{z.worldBBox.maxY}) m
                </span>
              </div>
            )}
          </For>
          <Show when={result().darkZones.length === 0}>
            <p class="hint ok">未发现低于阈值的暗区格。</p>
          </Show>
        </div>

        <h4 class="sub-title">各街坊平均照度与暗区占比</h4>
        <table class="data-table">
          <thead>
            <tr><th>街坊</th><th>平均(lx)</th><th>面积(m²)</th><th>暗区占比</th></tr>
          </thead>
          <tbody>
            <For each={stats().blocks}>
              {(b) => (
                <tr>
                  <td>{b.blockName}</td>
                  <td>{b.avgLux}</td>
                  <td>{b.areaM2}</td>
                  <td classList={{ bad: b.darkRatio > 0.2 }}>
                    {(b.darkRatio * 100).toFixed(1)}%
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>

        <Show when={probe()}>
          <div class={`probe-box ${probe().dark ? 'dark' : ''}`}>
            格 ({probe().gx}, {probe().gy})：总照度 {probe().lux.toFixed(2)} lx
            （日照 {probe().sun.toFixed(1)} / 灯光 {probe().artificial.toFixed(1)}）
            {probe().dark && <b> · 低于 {sim.darkThreshold}lx 标红</b>}
          </div>
        </Show>

        <div class="btn-grid">
          <button class="btn" classList={{ primary: tool() === 'probe' }} onClick={enterProbe}>照度探针（逐格读数）</button>
          <button class="btn" onClick={exportStatsCSV}>导出照度 CSV</button>
          <button class="btn" onClick={exportDarkCSV}>导出暗区 CSV</button>
          <button class="btn" onClick={exportPNG}>导出效果图 PNG</button>
          <button class="btn" onClick={syncStats}>回传统计到后台</button>
        </div>
        <p class="hint">
          建筑总数 {scene.buildings.length} 栋 · 灯具 {scene.lights.length} 盏；
          切到热力图后，可用探针按钮（画布左下角）逐格读数。
        </p>
      </Show>
    </div>
  );
}
