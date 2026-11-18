import { layers, setLayers } from '../../store/app.js';

const ITEMS = [
  { key: 'buildings', label: '建筑轮廓' },
  { key: 'lightSpots', label: '灯光光斑' },
  { key: 'heatmap', label: '照度热力图' },
  { key: 'darkOverlay', label: '暗区标红（<20lx）' },
  { key: 'grid', label: '1m 地面网格' },
  { key: 'annotations', label: '公示批注点' },
];

export default function LayerPanel() {
  return (
    <div class="layer-panel">
      <h3 class="panel-title">图层开关</h3>
      {ITEMS.map((it) => (
        <label class="layer-line">
          <input
            type="checkbox"
            checked={layers[it.key]}
            onChange={(e) => setLayers(it.key, e.target.checked)}
          />
          <span>{it.label}</span>
        </label>
      ))}
      <p class="hint">热力图与暗区标红互斥显示；热力图模式下悬停可读取每格照度数值。</p>
    </div>
  );
}
