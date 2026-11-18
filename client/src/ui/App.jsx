import { createSignal, onCleanup, onMount, Show, createMemo } from 'solid-js';
import Toolbar from './components/Toolbar.jsx';
import CanvasStage from './components/CanvasStage.jsx';
import Inspector from './components/Inspector.jsx';
import TimePanel from './components/TimePanel.jsx';
import LayerPanel from './components/LayerPanel.jsx';
import StatsPanel from './components/StatsPanel.jsx';
import PlanPanel from './components/PlanPanel.jsx';
import ReviewPanel from './components/ReviewPanel.jsx';
import Toast from './components/Toast.jsx';
import { getRole, setRole } from '../services/api.js';
import { showToast } from '../store/app.js';

const ROLES = [
  { value: 'planner', label: '规划员' },
  { value: 'reviewer', label: '审查人' },
  { value: 'public', label: '公众' },
];

export default function App() {
  const [role, setRoleState] = createSignal(getRole());
  const [tab, setTab] = createSignal('inspector'); // inspector | stats | plans | review

  onMount(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const map = { v: 'select', b: 'building', l: 'street', c: 'courtyard', w: 'wallwash', h: 'pan' };
      if (map[e.key]) window.__setTool?.(map[e.key]);
      if (e.key === 'Delete' || e.key === 'Backspace') window.__deleteSelected?.();
    };
    window.addEventListener('keydown', onKey);
    onCleanup(() => window.removeEventListener('keydown', onKey));
  });

  const switchRole = (r) => {
    setRole(r);
    setRoleState(r);
    showToast(`已切换为${ROLES.find((x) => x.value === r).label}视角`, 'info');
  };

  const tabs = createMemo(() => [
    { id: 'inspector', label: '属性' },
    { id: 'stats', label: '暗区/统计' },
    { id: 'plans', label: '方案后台' },
    { id: 'review', label: '审查/公示' },
  ]);

  return (
    <div class="app-shell">
      <header class="topbar">
        <div class="brand">
          <span class="brand-mark">巷</span>
          <div>
            <h1>历史街区布光预览台</h1>
            <p>日照校核 · 夜间照明 · 暗区识别 · 方案送审公示</p>
          </div>
        </div>
        <Toolbar />
        <div class="role-switch">
          {ROLES.map((r) => (
            <button
              class={`role-btn ${role() === r.value ? 'active' : ''}`}
              onClick={() => switchRole(r.value)}
              title="演示环境：切换角色视角"
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <main class="workspace">
        <aside class="left-rail">
          <div class="tab-row">
            {tabs().map((t) => (
              <button class={`tab-btn ${tab() === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
          <div class="tab-body">
            <Show when={tab() === 'inspector'}>
              <Inspector />
              <LayerPanel />
            </Show>
            <Show when={tab() === 'stats'}>
              <StatsPanel />
            </Show>
            <Show when={tab() === 'plans'}>
              <PlanPanel />
            </Show>
            <Show when={tab() === 'review'}>
              <ReviewPanel />
            </Show>
          </div>
        </aside>

        <section class="stage-wrap">
          <CanvasStage />
          <TimePanel />
        </section>
      </main>

      <Toast />
    </div>
  );
}
