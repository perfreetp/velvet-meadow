import { Show, Match, Switch, createMemo } from 'solid-js';
import {
  scene, selection, setSelection, updateSelected, removeSelected,
  readOnly, sim, setSim,
} from '../../store/app.js';
import { LIGHT_TEMPERATURES } from '../../engine/color.js';

const TYPE_LABEL = { street: '路灯', courtyard: '庭院灯', wallwash: '洗墙灯' };

export default function Inspector() {
  const selectedLight = createMemo(() =>
    selection.kind === 'light' ? scene.lights.find((l) => l.id === selection.id) : null);
  const selectedBuilding = createMemo(() =>
    selection.kind === 'building' ? scene.buildings.find((b) => b.id === selection.id) : null);

  return (
    <div class="inspector">
      <Switch>
        <Match when={selectedLight()}>
          {(l) => (
            <>
              <h3 class="panel-title">{TYPE_LABEL[l().type]}参数</h3>
              <NumberField label="挂高 (m)" value={l().height} min={0.5} max={30} step={0.1}
                disabled={readOnly()}
                onCommit={(v) => updateSelected({ height: v })} />
              <NumberField label="照射半径 (m)" value={l().radius} min={1} max={60} step={0.5}
                disabled={readOnly()}
                onCommit={(v) => updateSelected({ radius: v })} />
              <NumberField label="发光强度/光通量 (klm)" value={l().power} min={0.5} max={60} step={0.5}
                disabled={readOnly()}
                onCommit={(v) => updateSelected({ power: v })} />
              <div class="field">
                <label>色温 (K)</label>
                <select disabled={readOnly()}
                  value={l().cct}
                  onChange={(e) => updateSelected({ cct: Number(e.target.value) })}>
                  {LIGHT_TEMPERATURES.map((t) => (
                    <option value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input type="range" min="1800" max="6500" step="100"
                  value={l().cct} disabled={readOnly()}
                  onInput={(e) => updateSelected({ cct: Number(e.target.value) })} />
              </div>
              <NumberField label="光源尺寸 (m，半影柔化)" value={l().size} min={0.05} max={2} step={0.05}
                disabled={readOnly()}
                onCommit={(v) => updateSelected({ size: v })} />
              <Show when={l().type === 'wallwash'}>
                <button class="btn small" disabled={readOnly()}
                  onClick={() => updateSelected({
                    washTarget: { x: l().x, y: l().y - l().radius * 0.8 },
                  })}>
                  重置洗墙朝向（正上方墙面）
                </button>
                <p class="hint">拖动洗墙灯位置后，可点此把照射方向重新对准邻近墙面。</p>
              </Show>
              <div class="coord-readout">
                坐标 X {l().x.toFixed(1)} · Y {l().y.toFixed(1)}
              </div>
              <button class="btn danger" disabled={readOnly()}
                onClick={() => { removeSelected(); setSelection({ kind: null, id: null }); }}>
                删除该灯具
              </button>
            </>
          )}
        </Match>

        <Match when={selectedBuilding()}>
          {(b) => (
            <>
              <h3 class="panel-title">建筑属性</h3>
              <div class="field">
                <label>名称</label>
                <input value={b().name} disabled={readOnly()}
                  onInput={(e) => updateSelected({ name: e.target.value })} />
              </div>
              <NumberField label="层数（层高 3m）" value={b().floors} min={1} max={40} step={1}
                disabled={readOnly()}
                onCommit={(v) => updateSelected({ floors: Math.round(v) })} />
              <div class="field">
                <label>所属街坊</label>
                <input value={b().blockName} disabled={readOnly()}
                  onInput={(e) => updateSelected({ blockName: e.target.value, blockId: e.target.value })} />
              </div>
              <div class="coord-readout">
                建筑高度 {(b().floors * 3).toFixed(1)} m · 顶点 {b().polygon.length} 个
              </div>
              <p class="hint">选中后可拖动轮廓蓝色顶点调整形状，拖动整体平移。</p>
              <button class="btn danger" disabled={readOnly()}
                onClick={() => { removeSelected(); setSelection({ kind: null, id: null }); }}>
                删除该建筑
              </button>
            </>
          )}
        </Match>

        <Match when={true}>
          <h3 class="panel-title">全局渲染参数</h3>
          <NumberField label="网格尺寸 (m)" value={sim.cell} min={0.5} max={4} step={0.5}
            onCommit={(v) => setSim('cell', v)} />
          <NumberField label="曝光增益" value={sim.exposure} min={0.2} max={4} step={0.1}
            onCommit={(v) => setSim('exposure', v)} />
          <NumberField label="显示伽马 γ" value={sim.gamma} min={1.2} max={3} step={0.05}
            onCommit={(v) => setSim('gamma', v)} />
          <NumberField label="暗区阈值 (lx)" value={sim.darkThreshold} min={1} max={100} step={1}
            onCommit={(v) => setSim('darkThreshold', v)} />
          <div class="field">
            <label>纬度 / 经度</label>
            <div class="dual">
              <input type="number" value={sim.lat} step="0.001"
                onInput={(e) => setSim('lat', Number(e.target.value))} />
              <input type="number" value={sim.lng} step="0.001"
                onInput={(e) => setSim('lng', Number(e.target.value))} />
            </div>
          </div>
          <p class="hint">
            在画布上选择灯具或建筑以编辑单项参数。左侧工具栏可放置三类光源，光源尺寸越大阴影边缘（半影）越柔和。
          </p>
        </Match>
      </Switch>
    </div>
  );
}

function NumberField(props) {
  let local;
  return (
    <div class="field">
      <label>{props.label}</label>
      <input
        ref={local}
        type="number"
        value={props.value}
        min={props.min} max={props.max} step={props.step}
        disabled={props.disabled}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) props.onCommit(v);
        }}
      />
    </div>
  );
}
