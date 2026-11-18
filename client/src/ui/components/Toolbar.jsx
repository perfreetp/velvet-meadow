import { tool, setTool, readOnly, scene, setScene, showToast } from '../../store/app.js';
import { importGeoJSON, exportGeoJSON, sceneBounds } from '../../engine/scene.js';

const TOOLS = [
  { id: 'select', icon: '▣', label: '选择/移动', key: 'V' },
  { id: 'building', icon: '⌂', label: '放置建筑', key: 'B' },
  { id: 'street', icon: '💡', label: '路灯', key: 'L' },
  { id: 'courtyard', icon: '◉', label: '庭院灯', key: 'C' },
  { id: 'wallwash', icon: '▰', label: '洗墙灯', key: 'W' },
  { id: 'pan', icon: '✥', label: '平移视图', key: 'H' },
];

export default function Toolbar() {
  let fileRef;

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const { buildings, bounds } = importGeoJSON(text);
      if (!buildings.length) throw new Error('未识别到 Polygon 面要素');
      setScene('buildings', buildings);
      if (bounds) setScene('bounds', {
        minX: Math.floor(bounds.minX - 15), minY: Math.floor(bounds.minY - 15),
        maxX: Math.ceil(bounds.maxX + 15), maxY: Math.ceil(bounds.maxY + 15),
      });
      else setScene('bounds', sceneBounds(buildings));
      showToast(`已导入 ${buildings.length} 栋建筑`, 'ok');
      window.__fitView?.();
    } catch (err) {
      showToast(`导入失败：${err.message}`, 'err');
    } finally {
      e.target.value = '';
    }
  };

  const onExportGeo = () => {
    const blob = new Blob([JSON.stringify(exportGeoJSON(scene.buildings), null, 2)], { type: 'application/geo+json' });
    download(blob, '建筑轮廓.geojson');
  };

  const onClear = () => {
    if (!confirm('清空当前场景中的全部建筑与灯具？')) return;
    setScene('buildings', []);
    setScene('lights', []);
    setScene('bounds', { minX: 0, minY: 0, maxX: 120, maxY: 90 });
  };

  return (
    <div class="toolbar">
      {TOOLS.map((t) => (
        <button
          class={`tool-btn ${tool() === t.id ? 'active' : ''}`}
          disabled={readOnly() && t.id !== 'pan' && t.id !== 'select'}
          onClick={() => setTool(t.id)}
          title={`${t.label}（${t.key}）`}
        >
          <span class="tool-icon">{t.icon}</span>
          <span class="tool-label">{t.label}</span>
        </button>
      ))}
      <span class="tool-sep" />
      <button class="tool-btn" disabled={readOnly()} onClick={() => fileRef.click()} title="导入 GeoJSON 建筑轮廓">
        <span class="tool-icon">⇪</span><span class="tool-label">导入</span>
      </button>
      <input ref={fileRef} type="file" accept=".json,.geojson" hidden onChange={onImport} />
      <button class="tool-btn" onClick={onExportGeo} title="导出建筑轮廓 GeoJSON">
        <span class="tool-icon">⇩</span><span class="tool-label">导出轮廓</span>
      </button>
      <button class="tool-btn danger" disabled={readOnly()} onClick={onClear}>
        <span class="tool-icon">✕</span><span class="tool-label">清空</span>
      </button>
    </div>
  );
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
