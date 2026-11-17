import { useStore } from '../store';
import { timeCurve } from '../engine/photometry';

export default function TimeSlider() {
  const timeHour = useStore((s) => s.data.timeHour);
  const setTime = useStore((s) => s.setTime);
  const curve = timeCurve(timeHour);
  const hh = Math.floor(timeHour);
  const mm = Math.round((timeHour - hh) * 60);

  return (
    <div className="panel time-panel">
      <div className="time-head">
        <h3>夜游时刻</h3>
        <div className="time-clock">
          {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}
        </div>
      </div>
      <input
        type="range"
        min={18}
        max={23}
        step={0.05}
        value={timeHour}
        className="time-slider"
        onChange={(e) => setTime(Number(e.target.value))}
      />
      <div className="time-ticks">
        {[18, 19, 20, 21, 22, 23].map((h) => (
          <span key={h}>{h}:00</span>
        ))}
      </div>
      <div className="curve-bars">
        <div className="curve-item">
          <span>天空余晖</span>
          <div className="bar"><i style={{ width: `${curve.skyGlow * 100}%`, background: 'linear-gradient(90deg,#7c5cff,#ff9d5c)' }} /></div>
          <em>{(curve.skyGlow * 100).toFixed(0)}%</em>
        </div>
        <div className="curve-item">
          <span>灯光调光</span>
          <div className="bar"><i style={{ width: `${curve.lampDimming * 100}%`, background: 'linear-gradient(90deg,#ffd166,#ffb347)' }} /></div>
          <em>{(curve.lampDimming * 100).toFixed(0)}%</em>
        </div>
      </div>
      <p className="panel-hint">
        18:00 黄昏余晖最强、灯具低功率预热；19:30 后满功率；22:30 后进入节能时段。
        天空颜色与灯光亮度均按平滑曲线过渡。
      </p>
    </div>
  );
}
