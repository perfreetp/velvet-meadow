import { useStore } from '../store';
import type { SimResult } from '../types';

export default function HeatmapPanel({ sim }: { sim: SimResult | null }) {
  const data = useStore((s) => s.data);
  const setHeatmap = useStore((s) => s.setHeatmap);

  return (
    <div className="panel">
      <h3>照度热力图</h3>
      <div className="seg-control">
        {(['total', 'direct', 'reflected'] as const).map((m) => (
          <button
            key={m}
            className={`seg-btn ${data.heatmapMode === m ? 'active' : ''}`}
            onClick={() => setHeatmap({ heatmapMode: m })}
          >
            {m === 'total' ? '总照度' : m === 'direct' ? '直射' : '水面反射'}
          </button>
        ))}
      </div>
      <label className="check-row">
        <input
          type="checkbox"
          checked={data.heatmapVisible}
          onChange={(e) => setHeatmap({ heatmapVisible: e.target.checked })}
        />
        显示热力图
      </label>
      <label className="check-row">
        <input
          type="checkbox"
          checked={data.darkZoneVisible}
          onChange={(e) => setHeatmap({ darkZoneVisible: e.target.checked })}
        />
        暗区自动标红（低于 {data.luxThreshold} lux）
      </label>
      <label className="prop-row">
        <span className="prop-label">暗区阈值 {data.luxThreshold} lux</span>
        <input
          type="range" min={5} max={50} step={1} value={data.luxThreshold}
          onChange={(e) => setHeatmap({ luxThreshold: Number(e.target.value) })}
        />
      </label>
      {sim && (
        <div className="stat-grid">
          <div><em>{sim.stats.meanLux.toFixed(1)}</em><span>平均 lux</span></div>
          <div><em>{sim.stats.minLux.toFixed(1)}</em><span>最低 lux</span></div>
          <div><em>{sim.stats.maxLux.toFixed(1)}</em><span>最高 lux</span></div>
          <div className={sim.stats.pctBelowThreshold > 0 ? 'warn' : ''}>
            <em>{sim.stats.pctBelowThreshold.toFixed(1)}%</em><span>低于阈值水面</span>
          </div>
        </div>
      )}
      <div className="legend">
        <span>低</span>
        <div className="legend-bar" />
        <span>高</span>
      </div>
    </div>
  );
}
