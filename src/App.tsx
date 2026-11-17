import { useEffect, useState } from 'react';
import { useStore } from './store';
import SceneCanvas from './components/SceneCanvas';
import Toolbar from './components/Toolbar';
import LampLibrary from './components/LampLibrary';
import Inspector from './components/Inspector';
import TimeSlider from './components/TimeSlider';
import HeatmapPanel from './components/HeatmapPanel';
import DarkZoneList from './components/DarkZoneList';
import CommentsPanel from './components/CommentsPanel';
import ExportPanel from './components/ExportPanel';
import VersionPanel from './components/VersionPanel';
import CompareView from './components/CompareView';
import { useSimulation } from './hooks/useSimulation';
import { locateBus } from './locateBus';

type Tab = 'inspect' | 'heat' | 'comment' | 'export' | 'version';

const TABS: { id: Tab; label: string }[] = [
  { id: 'inspect', label: '属性' },
  { id: 'heat', label: '照度/暗区' },
  { id: 'comment', label: '批注' },
  { id: 'export', label: '清单导出' },
  { id: 'version', label: '版本' },
];

export default function App() {
  const data = useStore((s) => s.data);
  const simVersion = useStore((s) => s.simVersion);
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const finishDrawing = useStore((s) => s.finishDrawing);
  const cancelDrawing = useStore((s) => s.cancelDrawing);
  const drawing = useStore((s) => s.drawing);
  const compareVersionId = useStore((s) => s.compareVersionId);
  const setCompare = useStore((s) => s.setCompare);
  const resetProject = useStore((s) => s.resetProject);
  const importProject = useStore((s) => s.importProject);
  const [tab, setTab] = useState<Tab>('inspect');
  const sim = useSimulation(data, simVersion);

  // 键盘快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') cancelDrawing();
      if (e.key === 'Enter' && drawing.length) finishDrawing();
      const map: Record<string, typeof tool> = {
        v: 'select', w: 'water', q: 'wall', b: 'bridgeOpening',
        p: 'pier', d: 'dock', r: 'route', c: 'comment',
      };
      if (map[e.key.toLowerCase()]) setTool(map[e.key.toLowerCase()]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawing.length, finishDrawing, cancelDrawing, setTool]);

  const handleLocate = (x: number, y: number) => {
    locateBus.locate(x, y);
  };

  const onImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          if (parsed.project?.elements) importProject(parsed.project);
          else if (parsed.elements) importProject(parsed);
          else alert('文件格式不正确');
        } catch {
          alert('JSON 解析失败');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-mark">夜航</span>
          <div>
            <h1>{data.meta.name}</h1>
            <span className="sub">城市内河夜游航线二维布光预览工作室</span>
          </div>
        </div>
        <div className="header-stats">
          <span>灯具 {sim?.stats.lampCount ?? 0} 盏</span>
          <span>总功率 {sim?.stats.totalPowerW ?? 0} W</span>
          <span>均照度 {sim?.stats.meanLux.toFixed(1) ?? '-'} lux</span>
          <span className={sim && sim.darkZones.length ? 'warn-text' : 'ok-text'}>
            暗区 {sim?.darkZones.length ?? 0} 处
          </span>
          <span className="muted">仿真 {sim?.elapsedMs.toFixed(0) ?? '-'} ms</span>
        </div>
        <div className="header-actions">
          <button className="mini-btn" onClick={onImport}>导入方案</button>
          <button className="mini-btn danger" onClick={() => { if (confirm('恢复为内置示例场景？当前未提交版本的改动将丢失。')) resetProject(); }}>
            重置示例
          </button>
        </div>
      </header>

      <div className="layout">
        <aside className="left-rail">
          <Toolbar />
          <LampLibrary />
        </aside>

        <main className="stage-area">
          <div className="canvas-wrap">
            <SceneCanvas data={data} sim={sim} height="100%" />
            <div className="canvas-hud">
              <div>滚轮缩放 · 右键/中键平移 · 左键选择拖动 · Enter 完成绘制 · Esc 取消</div>
              {tool !== 'select' && <div className="hud-tool">当前工具：{tool}</div>}
            </div>
          </div>
          <TimeSlider />
        </main>

        <aside className="right-panel">
          <div className="tab-bar">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === 'comment' && data.comments.some((c) => !c.resolved) && (
                  <i className="tab-dot" />
                )}
                {t.id === 'heat' && sim && sim.darkZones.length > 0 && (
                  <i className="tab-dot red" />
                )}
              </button>
            ))}
          </div>
          <div className="tab-body">
            {tab === 'inspect' && <Inspector />}
            {tab === 'heat' && (
              <>
                <HeatmapPanel sim={sim} />
                <DarkZoneList sim={sim} onLocate={handleLocate} />
              </>
            )}
            {tab === 'comment' && <CommentsPanel onLocate={handleLocate} />}
            {tab === 'export' && <ExportPanel sim={sim} />}
            {tab === 'version' && <VersionPanel onCompare={(id) => setCompare(id)} />}
          </div>
        </aside>
      </div>

      {compareVersionId && (
        <CompareView versionId={compareVersionId} onClose={() => setCompare(null)} />
      )}
    </div>
  );
}
