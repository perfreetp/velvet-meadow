import { useStore } from '../store';
import { LAMP_CATALOG } from '../engine/photometry';
import { LAMP_KIND_LABEL, type Lamp, type SceneWall } from '../types';
import { deg2rad } from '../engine/geometry';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="prop-row">
      <span className="prop-label">{label}</span>
      {children}
    </label>
  );
}

function NumberSlider({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <Row label={`${label} ${value}${unit}`}>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </Row>
  );
}

export default function Inspector() {
  const selectedId = useStore((s) => s.selectedId);
  const data = useStore((s) => s.data);
  const updateLamp = useStore((s) => s.updateLamp);
  const updateElement = useStore((s) => s.updateElement);
  const removeElement = useStore((s) => s.removeElement);
  const duplicateElement = useStore((s) => s.duplicateElement);

  const el = data.elements.find((e) => e.id === selectedId);
  if (!el) {
    return (
      <div className="panel inspector">
        <h3>属性检查器</h3>
        <p className="panel-hint">
          选择灯具可调节发光角度、色温、功率与投光方向；
          选择驳岸/桥墩可编辑高度与厚度；拖动手柄可移动灯位或顶点。
        </p>
      </div>
    );
  }

  if (el.type === 'lamp') {
    const lamp = el as Lamp;
    const cat = LAMP_CATALOG[lamp.kind];
    return (
      <div className="panel inspector">
        <h3>{LAMP_KIND_LABEL[lamp.kind]}</h3>
        <Row label="名称">
          <input
            className="text-input"
            value={lamp.name}
            onChange={(e) => updateLamp(lamp.id, { name: e.target.value })}
          />
        </Row>
        <NumberSlider label="功率" value={lamp.powerW} min={2} max={500} step={1} unit="W"
          onChange={(v) => updateLamp(lamp.id, { powerW: v })} />
        <NumberSlider label="色温" value={lamp.colorTemp} min={1800} max={6500} step={100} unit="K"
          onChange={(v) => updateLamp(lamp.id, { colorTemp: v })} />
        {lamp.beamAngleDeg > 0 ? (
          <NumberSlider label="发光角度" value={lamp.beamAngleDeg} min={6} max={120} step={1} unit="°"
            onChange={(v) => updateLamp(lamp.id, { beamAngleDeg: v })} />
        ) : (
          <Row label="发光角度">
            <button className="mini-btn" onClick={() => updateLamp(lamp.id, { beamAngleDeg: cat.defaultBeamDeg || 30 })}>
              改为定向光束
            </button>
          </Row>
        )}
        {lamp.beamAngleDeg <= 0 && (
          <Row label="全向发光">
            <button className="mini-btn" onClick={() => updateLamp(lamp.id, { beamAngleDeg: 0 })}>
              保持全向
            </button>
          </Row>
        )}
        <NumberSlider label="投光方向" value={Math.round((lamp.aim * 180) / Math.PI)} min={-180} max={180} step={1} unit="°"
          onChange={(v) => updateLamp(lamp.id, { aim: deg2rad(v) })} />
        <div className="aim-dial">
          <div
            className="aim-arrow"
            style={{ transform: `rotate(${lamp.aim}rad)` }}
            onClick={() => updateLamp(lamp.id, { aim: lamp.aim + Math.PI / 12 })}
            title="点击顺时针旋转 15°"
          >
            ➤
          </div>
          <span className="aim-coord">
            x {lamp.pos.x.toFixed(1)} / y {lamp.pos.y.toFixed(1)} / h {lamp.height.toFixed(1)}m
          </span>
        </div>
        <NumberSlider label="安装高度" value={lamp.height} min={-1} max={12} step={0.1} unit="m"
          onChange={(v) => updateLamp(lamp.id, { height: v })} />
        <NumberSlider label="光效" value={lamp.efficacy} min={20} max={160} step={1} unit="lm/W"
          onChange={(v) => updateLamp(lamp.id, { efficacy: v })} />
        <div className="inspector-actions">
          <button className="mini-btn" onClick={() => duplicateElement(lamp.id)}>复制</button>
          <button className="mini-btn danger" onClick={() => removeElement(lamp.id)}>删除</button>
        </div>
      </div>
    );
  }

  return (
    <div className="panel inspector">
      <h3>{el.type === 'wall' ? '驳岸挡墙' : el.type === 'pier' ? '桥墩' : el.name}</h3>
      <Row label="名称">
        <input
          className="text-input"
          value={el.name}
          onChange={(e) => updateElement(el.id, { name: e.target.value })}
        />
      </Row>
      {el.type === 'wall' && (
        <>
          <NumberSlider label="挡墙高度" value={(el as SceneWall).height} min={0.3} max={8} step={0.1} unit="m"
            onChange={(v) => updateElement(el.id, { height: v } as never)} />
          <NumberSlider label="墙体厚度" value={(el as SceneWall).thickness} min={0.2} max={4} step={0.1} unit="m"
            onChange={(v) => updateElement(el.id, { thickness: v } as never)} />
        </>
      )}
      {el.type === 'pier' && (
        <NumberSlider label="桥墩高度" value={(el as { height: number }).height} min={0.5} max={10} step={0.1} unit="m"
          onChange={(v) => updateElement(el.id, { height: v } as never)} />
      )}
      <p className="panel-hint">
        顶点：选中后拖动画布上的蓝色手柄。
        {el.type === 'wall' || el.type === 'pier'
          ? '该要素参与灯光遮挡，高度越高阴影越长，半影随灯—墙距离变化。'
          : ''}
      </p>
      <div className="inspector-actions">
        <button className="mini-btn" onClick={() => duplicateElement(el.id)}>复制</button>
        <button className="mini-btn danger" onClick={() => removeElement(el.id)}>删除</button>
      </div>
    </div>
  );
}
