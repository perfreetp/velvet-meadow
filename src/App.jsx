import { Show, Match, Switch } from 'solid-js';
import { store } from './lib/store';
import ProjectsView from './views/ProjectsView.jsx';
import EditorView from './views/EditorView.jsx';
import ReviewView from './views/ReviewView.jsx';
import ClientsView from './views/ClientsView.jsx';

const NAV = [
  { id: 'projects', label: '方案管理' },
  { id: 'editor', label: '方案编辑' },
  { id: 'review', label: '版本审核' },
  { id: 'clients', label: '客户档案' }
];

export default function App() {
  const go = (id) => {
    if (id === 'editor') {
      const p = store.state.projects.find((x) => x.id === store.state.activeProjectId);
      if (p) store.openEditor(p.id);
      else if (store.state.projects[0]) store.openEditor(store.state.projects[0].id);
      else alert('请先在方案管理中新建方案');
      return;
    }
    if (id === 'review') {
      const p = store.state.projects.find((x) => x.id === store.state.activeProjectId);
      const target = p || store.state.projects[0];
      if (!target) { alert('还没有方案'); return; }
      if (!target.versions.length) { alert('该方案还没有提交过版本'); return; }
      store.openReview(target.id, target.versions.at(-1).id);
      return;
    }
    store.go(id);
  };

  return (
    <div class="app">
      <header class="topbar">
        <div class="logo">🌿 花型矢量工作台<small>Floral Vector Studio</small></div>
        <nav class="nav">
          {NAV.map((n) => (
            <button
              class={store.state.view === n.id ? 'active' : ''}
              onClick={() => go(n.id)}
            >{n.label}</button>
          ))}
        </nav>
        <div class="right">
          <Show when={store.state.activeProjectId && store.state.view !== 'projects' && store.state.view !== 'clients'}>
            <span class="who">
              当前方案:{store.activeProject()?.name}
            </span>
          </Show>
          <span class="who">制作方工作台</span>
        </div>
      </header>

      <main class="view-body">
        <Switch>
          <Match when={store.state.view === 'projects'}><ProjectsView /></Match>
          <Match when={store.state.view === 'editor'}>
            <Show when={store.state.draft} fallback={<div class="page"><div class="empty">请从方案管理打开一个方案</div></div>}>
              <EditorView />
            </Show>
          </Match>
          <Match when={store.state.view === 'review'}><ReviewView /></Match>
          <Match when={store.state.view === 'clients'}><ClientsView /></Match>
        </Switch>
      </main>
    </div>
  );
}
