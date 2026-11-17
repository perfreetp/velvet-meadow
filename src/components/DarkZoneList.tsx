import type { SimResult } from '../types';
import { useStore } from '../store';

interface Props {
  sim: SimResult | null;
  onLocate: (x: number, y: number) => void;
}

export default function DarkZoneList({ sim, onLocate }: Props) {
  const threshold = useStore((s) => s.data.luxThreshold);
  const zones = sim?.darkZones ?? [];

  return (
    <div className="panel">
      <h3>
        暗区清单
        <span className={`badge ${zones.length ? 'badge-red' : 'badge-green'}`}>
          {zones.length} 处
        </span>
      </h3>
      {zones.length === 0 && <p className="panel-hint ok">水面照度全部 ≥ {threshold} lux，无暗区。</p>}
      <div className="dz-list">
        {zones.map((dz, i) => (
          <button key={dz.id} className="dz-item" onClick={() => onLocate(dz.centroid.x, dz.centroid.y)}>
            <div className="dz-title">
              <span className="dz-no">#{i + 1}</span>
              <span>暗区 {dz.areaM2.toFixed(1)} m²</span>
            </div>
            <div className="dz-meta">
              最低 {dz.minLux.toFixed(1)} lux · 平均 {dz.avgLux.toFixed(1)} lux
            </div>
            <div className="dz-meta">
              坐标 ({dz.centroid.x.toFixed(1)}, {dz.centroid.y.toFixed(1)}) · 点击定位
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
