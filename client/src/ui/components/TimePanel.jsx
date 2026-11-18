import { Show, createMemo } from 'solid-js';
import { sim, setSim, solarDate } from '../../store/app.js';
import { sunPosition, SOLAR_PRESETS } from '../../engine/solar.js';

export default function TimePanel() {
  const sun = createMemo(() => {
    const p = SOLAR_PRESETS[sim.solarPreset];
    const d = new Date(2026, p.month - 1, p.day);
    return sunPosition(d, sim.hour, sim.lat, sim.lng);
  });

  const hh = createMemo(() => String(Math.floor(sim.hour)).padStart(2, '0'));
  const mm = createMemo(() => String(Math.round((sim.hour % 1) * 60)).padStart(2, '0'));

  return (
    <div class="time-panel">
      <div class="time-row">
        <div class="time-clock">{hh()}:{mm()}</div>
        <input
          type="range" min="9" max="21" step="0.25"
          value={sim.hour}
          onInput={(e) => setSim('hour', Number(e.target.value))}
          class="time-slider"
        />
        <div class="time-range"><span>09:00</span><span>21:00</span></div>
      </div>
      <div class="time-row solar">
        <div class="seg">
          {Object.entries(SOLAR_PRESETS).map(([k, v]) => (
            <button
              class={`seg-btn ${sim.solarPreset === k ? 'active' : ''}`}
              onClick={() => setSim('solarPreset', k)}
            >
              {v.label} {v.month}/{v.day}
            </button>
          ))}
        </div>
        <div class="sun-readout">
          <div>高度角 <b>{((sun().elev * 180) / Math.PI).toFixed(1)}°</b></div>
          <div>方位角 <b>{((sun().azim * 180) / Math.PI).toFixed(1)}°</b></div>
          <Show when={sun().daylight} fallback={<span class="night-tag">夜间 · 仅人工照明</span>}>
            <span class="day-tag">日照有效</span>
          </Show>
        </div>
        <label class="check-line">
          <input type="checkbox" checked={sim.includeSun}
            onChange={(e) => setSim('includeSun', e.target.checked)} />
          计入太阳直射
        </label>
      </div>
    </div>
  );
}
