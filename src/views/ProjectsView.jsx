import { createSignal, For, Show } from 'solid-js';
import { store } from '../lib/store';
import { fmtDay } from '../lib/constants';

export default function ProjectsView() {
  const [showNew, setShowNew] = createSignal(false);
  const [form, setForm] = createSignal({ name: '', clientId: '', festival: '', deliveryDate: '' });
  const [toast, setToast] = createSignal(null);

  const notify = (msg, kind = '') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 2400);
  };

  function create() {
    if (!form().name.trim()) return notify('请填写方案名称', 'err');
    if (!form().clientId) return notify('请选择客户门店', 'err');
    const id = store.createProject({
      name: form().name.trim(),
      clientId: form().clientId,
      festival: form().festival.trim(),
      deliveryDate: form().deliveryDate ? new Date(form().deliveryDate).getTime() : null
    });
    setShowNew(false);
    setForm({ name: '', clientId: '', festival: '', deliveryDate: '' });
    store.openEditor(id);
  }

  const clientName = (id) => store.state.clients.find((c) => c.id === id)?.name || '—';

  return (
    <div class="page">
      <Show when={toast()}><div class={`toast ${toast().kind}`}>{toast().msg}</div></Show>
      <div class="page-head">
        <h2>方案管理</h2>
        <span class="muted">共 {store.state.projects.length} 个花艺方案</span>
        <div class="spacer" />
        <button class="primary" onClick={() => setShowNew(true)}>＋ 新建方案</button>
      </div>

      <Show
        when={store.state.projects.length}
        fallback={<div class="empty">还没有方案,点击「新建方案」开始第一份花型设计</div>}
      >
        <div class="grid-cards">
          <For each={store.state.projects}>
            {(p) => {
              const stats = store.annotationStats(
                p.versions.flatMap((v) => v.doc.annotations.filter((a) => a.status !== 'resolved'))
              );
              const finalV = p.versions.find((v) => v.id === p.finalVersionId);
              return (
                <div class="panel card">
                  <div class="row">
                    <h3>{p.name}</h3>
                    <div class="spacer" />
                    <Show when={finalV}><span class="tag green">已定稿 · {finalV.label}</span></Show>
                  </div>
                  <div class="meta">
                    <div>门店:{clientName(p.clientId)}</div>
                    <div>节庆主题:{p.festival || '—'}</div>
                    <div>交付日期:{fmtDay(p.deliveryDate)}</div>
                    <div>版本数:{p.versions.length} · 图元:{p.draftDoc.shapes.length}</div>
                    <Show when={stats.open > 0}>
                      <span class="tag red">未清零批注 {stats.open} 条</span>
                    </Show>
                  </div>
                  <div class="actions">
                    <button class="primary" onClick={() => store.openEditor(p.id)}>进入编辑</button>
                    <button onClick={() => store.openReview(p.id, p.versions[p.versions.length - 1]?.id)} disabled={!p.versions.length}>
                      版本审核{p.versions.length ? ` (${p.versions.length})` : ''}
                    </button>
                    <button class="danger" onClick={() => {
                      if (confirm(`确定删除方案「${p.name}」及其全部版本?`)) store.deleteProject(p.id);
                    }}>删除</button>
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </Show>

      <Show when={showNew()}>
        <div class="modal-mask" onClick={(e) => e.target === e.currentTarget && setShowNew(false)}>
          <div class="modal">
            <h3>新建花艺方案</h3>
            <div class="field">
              <label>方案名称</label>
              <input placeholder="如:中秋月桂·礼盒花" value={form().name}
                onInput={(e) => setForm({ ...form(), name: e.currentTarget.value })} />
            </div>
            <div class="field">
              <label>客户门店</label>
              <select value={form().clientId} onChange={(e) => setForm({ ...form(), clientId: e.currentTarget.value })}>
                <option value="">请选择客户档案</option>
                <For each={store.state.clients}>
                  {(c) => <option value={c.id}>{c.name}({c.store})</option>}
                </For>
              </select>
              <Show when={!store.state.clients.length}>
                <span class="muted" style={{ 'font-size': '11.5px' }}>没有客户?先到「客户档案」登记</span>
              </Show>
            </div>
            <div class="field">
              <label>节庆主题</label>
              <input placeholder="如:情人节 / 春节 / 开业花篮" value={form().festival}
                onInput={(e) => setForm({ ...form(), festival: e.currentTarget.value })} />
            </div>
            <div class="field">
              <label>交付日期</label>
              <input type="date" value={form().deliveryDate}
                onInput={(e) => setForm({ ...form(), deliveryDate: e.currentTarget.value })} />
            </div>
            <div class="foot">
              <button onClick={() => setShowNew(false)}>取消</button>
              <button class="primary" onClick={create}>创建并进入编辑</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
