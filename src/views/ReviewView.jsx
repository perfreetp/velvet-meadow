import { createSignal, For, Show, createMemo } from 'solid-js';
import { store } from '../lib/store';
import { TOOLS, fmtDate } from '../lib/constants';
import EditorCanvas from '../components/EditorCanvas.jsx';

const STATUS = {
  open: { label: '待处理', cls: 'red' },
  replied: { label: '已回复', cls: 'amber' },
  resolved: { label: '已清零', cls: 'green' }
};

export default function ReviewView() {
  const project = () => store.activeProject();
  const [annText, setAnnText] = createSignal('');
  const [pending, setPending] = createSignal(null); // {type,x,y,points}
  const [replyDrafts, setReplyDrafts] = createSignal({});
  const [diffId, setDiffId] = createSignal('');
  const [toast, setToast] = createSignal(null);
  const notify = (msg, kind = '') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 2600); };

  const versions = () => project()?.versions || [];
  const version = () => versions().find((v) => v.id === store.state.reviewVersionId) || versions().at(-1) || null;

  // 入口可能未指定版本
  if (!store.state.reviewVersionId && versions().length) {
    store.openReview(project().id, versions().at(-1).id);
  }

  const annotations = () => version()?.doc.annotations || [];
  const stats = () => store.annotationStats(annotations());
  const diffDoc = createMemo(() => {
    if (!diffId()) return null;
    const v = versions().find((x) => x.id === diffId());
    return v ? v.doc : null;
  });

  function pickVersion(id) {
    setPending(null);
    setDiffId('');
    store.openReview(project().id, id);
  }

  function onAddPoint(p) {
    setPending({ type: 'point', x: p.x, y: p.y, points: null });
  }
  function onAddArea(points) {
    setPending({ type: 'area', points, x: points[0].x, y: points[0].y });
  }
  function confirmAnnotation() {
    if (!annText().trim()) { notify('请填写批注内容', 'err'); return; }
    const p = pending();
    store.addAnnotation(version().id, { ...p, text: annText().trim() });
    setAnnText('');
    setPending(null);
    store.setTool(TOOLS.SELECT);
    notify('批注已提交', 'ok');
  }
  function cancelAnnotation() {
    setPending(null);
    setAnnText('');
    store.setTool(TOOLS.SELECT);
  }

  function sendReply(annId) {
    const text = (replyDrafts()[annId] || '').trim();
    if (!text) return;
    store.replyAnnotation(version().id, annId, text);
    setReplyDrafts({ ...replyDrafts(), [annId]: '' });
  }

  function doFinalize() {
    const r = store.finalizeVersion(version().id);
    if (!r.ok) notify(r.msg, 'err');
    else notify(`${version().label} 已定稿`, 'ok');
  }

  function backToEditor() {
    store.openEditor(project().id);
  }

  return (
    <div class="page" style={{ display: 'flex', 'flex-direction': 'column', padding: '14px 18px' }}>
      <Show when={toast()}><div class={`toast ${toast().kind}`}>{toast().msg}</div></Show>
      <div class="page-head" style={{ margin: '0 0 12px' }}>
        <button onClick={() => store.go('projects')}>← 方案列表</button>
        <h2>版本审核 · {project()?.name}</h2>
        <span class="muted">交付 {project() ? fmtDate(project().deliveryDate) : '—'}</span>
        <div class="spacer" />
        <button onClick={backToEditor}>进入编辑器修改</button>
        <button
          class="primary"
          disabled={stats().open > 0 || project()?.finalVersionId === version()?.id}
          title={stats().open > 0 ? '批注未清零,禁止定稿' : '标记为定稿'}
          onClick={doFinalize}
        >
          {project()?.finalVersionId === version()?.id ? '✓ 已定稿' : '标记定稿'}
        </button>
      </div>

      <Show when={version()} fallback={<div class="empty">该方案还没有提交过版本,请先到编辑器「提交新版本」</div>}>
        <div class="split" style={{ flex: 1 }}>
          {/* 画布侧 */}
          <div class="canvas-side">
            <div class="toolbar" style={{ border: '1px solid var(--border)', 'border-radius': '10px', 'box-shadow': 'var(--shadow)' }}>
              <span class="group-label">审核工具</span>
              <button class={store.state.tool === TOOLS.SELECT ? 'active' : ''} onClick={() => store.setTool(TOOLS.SELECT)}>➤ 浏览</button>
              <button class={store.state.tool === TOOLS.ANN_POINT ? 'active' : ''} onClick={() => store.setTool(TOOLS.ANN_POINT)}>📍 打点批注</button>
              <button class={store.state.tool === TOOLS.ANN_AREA ? 'active' : ''} onClick={() => store.setTool(TOOLS.ANN_AREA)}>⭕ 圈选区域</button>
              <div class="sep" />
              <label class="checkline muted" style={{ 'font-size': '11.5px' }}>
                叠加对比版本:
                <select value={diffId()} onChange={(e) => setDiffId(e.currentTarget.value)} style={{ width: '150px' }}>
                  <option value="">不对比</option>
                  <For each={versions().filter((v) => v.id !== version().id)}>
                    {(v) => <option value={v.id}>{v.label}</option>}
                  </For>
                </select>
              </label>
              <Show when={diffId()}>
                <span class="tag amber">橙色虚线为对比版,实线为当前 {version().label}</span>
              </Show>
            </div>

            <div class="panel" style={{ flex: 1, 'min-height': 0, position: 'relative', overflow: 'hidden' }}>
              <EditorCanvas
                mode="review"
                doc={version().doc}
                annotations={annotations()}
                diffDoc={diffDoc()}
                onAddPoint={onAddPoint}
                onAddArea={onAddArea}
              />
            </div>

            <Show when={pending()}>
              <div class="panel" style={{ padding: '12px 14px', display: 'flex', gap: '10px', 'align-items': 'flex-start' }}>
                <div style={{ flex: 1 }} class="col">
                  <strong>{pending().type === 'point' ? '打点批注' : '圈选区域批注'}</strong>
                  <textarea placeholder="说明要修改的位置与要求,如:这片叶子再窄 5mm"
                    value={annText()} onInput={(e) => setAnnText(e.currentTarget.value)}
                    style={{ 'margin-top': '6px' }} />
                </div>
                <div class="col" style={{ 'min-width': '96px' }}>
                  <button class="primary" onClick={confirmAnnotation}>提交批注</button>
                  <button onClick={cancelAnnotation}>取消</button>
                </div>
              </div>
            </Show>
          </div>

          {/* 右侧版本与批注 */}
          <div class="review-side">
            <div class="panel" style={{ padding: '12px 14px' }}>
              <h4 style={{ 'margin-bottom': '10px' }}>版本列表</h4>
              <div class="col">
                <For each={[...versions()].reverse()}>
                  {(v) => {
                    const st = store.annotationStats(v.doc.annotations);
                    return (
                      <div class={`version-chip ${v.id === version().id ? 'active' : ''}`} onClick={() => pickVersion(v.id)}>
                        <div class="row">
                          <strong>{v.label}</strong>
                          <div class="spacer" />
                          <Show when={project().finalVersionId === v.id}><span class="tag green">定稿</span></Show>
                          <Show when={st.open > 0}><span class="tag red">{st.open} 待处理</span></Show>
                          <Show when={st.open === 0 && st.total > 0}><span class="tag green">全部清零</span></Show>
                        </div>
                        <span class="muted" style={{ 'font-size': '11.5px' }}>{fmtDate(v.createdAt)} · {v.author}</span>
                        <Show when={v.note}><span style={{ 'font-size': '12px' }}>{v.note}</span></Show>
                      </div>
                    );
                  }}
                </For>
              </div>
            </div>

            <div class="panel" style={{ padding: '12px 14px' }}>
              <div class="row" style={{ 'margin-bottom': '10px' }}>
                <h4>批注处理</h4>
                <div class="spacer" />
                <span class="stat-pill">共 {stats().total} · 待处理 {stats().open} · 已清零 {stats().resolved}</span>
              </div>
              <Show when={stats().open > 0}>
                <div class="tag red" style={{ 'margin-bottom': '10px', padding: '7px 10px' }}>
                  存在未清零批注,该版本无法标记为定稿
                </div>
              </Show>
              <Show when={!annotations().length}>
                <div class="muted" style={{ 'font-size': '12px' }}>暂无批注。用上方「打点批注」或「圈选区域」在画布上提出修改意见。</div>
              </Show>
              <div class="col">
                <For each={annotations()}>
                  {(a) => (
                    <div class="ann-card" style={{ 'border-left': `3px solid ${a.status === 'resolved' ? 'var(--green)' : a.status === 'replied' ? 'var(--amber)' : 'var(--red)'}` }}>
                      <div class="head">
                        <span class="tag blue">{a.type === 'point' ? '📍 打点' : '⭕ 圈选'}</span>
                        <span class={`tag ${STATUS[a.status].cls}`}>{STATUS[a.status].label}</span>
                      </div>
                      <div>{a.text}</div>
                      <Show when={a.carriedFrom}>
                        <div class="muted" style={{ 'font-size': '11px' }}>↩ 自上一版继承,尚未清零</div>
                      </Show>
                      <div class="who">{a.author} · {fmtDate(a.createdAt)} · 坐标 ({a.x.toFixed(0)}, {a.y.toFixed(0)})mm</div>
                      <For each={a.replies}>
                        {(r) => (
                          <div class="reply">
                            <div class="who">{r.author} · {fmtDate(r.at)}</div>
                            <div>{r.text}</div>
                          </div>
                        )}
                      </For>
                      <Show when={a.status !== 'resolved'}>
                        <textarea placeholder="制作方逐条回复处理状态(已修改/有异议/下版处理)"
                          value={replyDrafts()[a.id] || ''}
                          onInput={(e) => setReplyDrafts({ ...replyDrafts(), [a.id]: e.currentTarget.value })} />
                        <div class="row">
                          <button class="primary" onClick={() => sendReply(a.id)}>回复</button>
                          <button onClick={() => store.resolveAnnotation(version().id, a.id)}>标记已清零</button>
                        </div>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
