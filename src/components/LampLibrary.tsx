import { LAMP_CATALOG } from '../engine/photometry';
import { LAMP_KIND_LABEL, type LampKind } from '../types';

const KIND_ICON: Record<LampKind, string> = {
  flood: '◢',
  wallWasher: '▬',
  underwater: '≈◦',
  lanternString: '🏮',
};

export default function LampLibrary() {
  return (
    <div className="panel">
      <h3>灯具库</h3>
      <p className="panel-hint">拖入画布放置，或点击后在画布落点</p>
      <div className="lamp-grid">
        {(Object.keys(LAMP_CATALOG) as LampKind[]).map((kind) => {
          const cat = LAMP_CATALOG[kind];
          return (
            <div
              key={kind}
              className="lamp-card"
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/x-lamp-kind', kind);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              title={`${cat.label}｜默认 ${cat.defaultPowerW}W / ${cat.defaultColorTemp}K / 光效 ${cat.efficacyLmPerW}lm·W⁻¹`}
            >
              <div className="lamp-card-icon">{KIND_ICON[kind]}</div>
              <div className="lamp-card-name">{LAMP_KIND_LABEL[kind]}</div>
              <div className="lamp-card-spec">
                {cat.defaultPowerW}W · {cat.defaultColorTemp}K
              </div>
              <div className="lamp-card-spec">
                {cat.defaultBeamDeg > 0 ? `光束角 ${cat.defaultBeamDeg}°` : '全向发光'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
