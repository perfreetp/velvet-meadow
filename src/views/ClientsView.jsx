import { createSignal, For, Show } from 'solid-js';
import { store } from '../lib/store';
import { fmtDay, uid } from '../lib/constants';

const blank = () => ({ id: '', name: '', store: '', contact: '', phone: '', note: '' });

export default function ClientsView() {
  const [editing, setEditing] = createSignal(null);
  const [form, setForm] = createSignal(blank());

  function openNew() {
    setForm(blank());
    setEditing('new');
  }
  function openEdit(c) {
    setForm({ ...c });
    setEditing(c.id);
  }
  function save() {
    if (!form().name.trim() || !form().store.trim()) {
      alert('客户名称与门店为必填项');
      return;
    }
    store.saveClient({ ...form(), id: form().id || uid('cli') });
    setEditing(null);
  }
  const projectCount = (clientId) => store.state.projects.filter((p) => p.clientId === clientId).length;

  return (
    <div class="page">
      <div class="page-head">
        <h2>客户档案</h2>
        <span class="muted">登记门店、节庆主题与交付信息</span>
        <div class="spacer" />
        <button class="primary" onClick={openNew}>＋ 新增客户</button>
      </div>

      <Show
        when={store.state.clients.length}
        fallback={<div class="empty">暂无客户档案</div>}
      >
        <table class="data">
          <thead>
            <tr>
              <th>客户名称</th><th>门店</th><th>联系人</th><th>电话</th>
              <th>在案方案</th><th>备注</th><th style={{ width: '150px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            <For each={store.state.clients}>
              {(c) => (
                <tr>
                  <td><strong>{c.name}</strong></td>
                  <td>{c.store}</td>
                  <td>{c.contact || '—'}</td>
                  <td>{c.phone || '—'}</td>
                  <td><span class="stat-pill">{projectCount(c.id)} 个</span></td>
                  <td class="muted" style={{ 'max-width': '220px' }}>{c.note || '—'}</td>
                  <td>
                    <div class="row" style={{ gap: '6px' }}>
                      <button onClick={() => openEdit(c)}>编辑</button>
                      <button class="danger" onClick={() => {
                        if (projectCount(c.id) > 0) {
                          alert(`该客户名下还有 ${projectCount(c.id)} 个方案,请先迁移或删除方案`);
                          return;
                        }
                        if (confirm('确定删除该客户档案?')) store.deleteClient(c.id);
                      }}>删除</button>
                    </div>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </Show>

      <Show when={editing()}>
        <div class="modal-mask" onClick={(e) => e.target === e.currentTarget && setEditing(null)}>
          <div class="modal">
            <h3>{editing() === 'new' ? '新增客户档案' : '编辑客户档案'}</h3>
            <div class="field"><label>客户名称 *</label>
              <input value={form().name} onInput={(e) => setForm({ ...form(), name: e.currentTarget.value })} /></div>
            <div class="field"><label>门店 *</label>
              <input value={form().store} placeholder="如:静安嘉里中心店" onInput={(e) => setForm({ ...form(), store: e.currentTarget.value })} /></div>
            <div class="two" style={{ display: 'flex', gap: '10px' }}>
              <div class="field" style={{ flex: 1 }}><label>联系人</label>
                <input value={form().contact} onInput={(e) => setForm({ ...form(), contact: e.currentTarget.value })} /></div>
              <div class="field" style={{ flex: 1 }}><label>电话</label>
                <input value={form().phone} onInput={(e) => setForm({ ...form(), phone: e.currentTarget.value })} /></div>
            </div>
            <div class="field"><label>备注(刀版要求/出血/偏好)</label>
              <textarea value={form().note} onInput={(e) => setForm({ ...form(), note: e.currentTarget.value })} /></div>
            <div class="foot">
              <button onClick={() => setEditing(null)}>取消</button>
              <button class="primary" onClick={save}>保存</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
