import { For, Show, createSignal, onMount, createEffect } from 'solid-js';
import {
  currentPlan, setCurrentPlan, reviews, setReviews, annotations, setAnnotations,
  setTool, setReadOnly, readOnly, scene, showToast,
} from '../../store/app.js';
import { api, getRole } from '../../services/api.js';

export default function ReviewPanel() {
  const [outcome, setOutcome] = createSignal('reject');
  const [comment, setComment] = createSignal('');
  const [reviewer, setReviewer] = createSignal('张工');
  const [note, setNote] = createSignal('');
  const role = () => getRole();

  const load = async () => {
    const plan = currentPlan();
    if (!plan) { setReviews([]); setAnnotations([]); return; }
    setReviews(await api.listReviews(plan.id));
    setAnnotations(await api.listAnnotations(plan.id));
  };
  onMount(load);
  createEffect(() => { currentPlan()?.id; load(); });

  const submitReview = async () => {
    const plan = currentPlan();
    if (!plan) return showToast('请先在方案后台打开送审方案', 'warn');
    if (!comment().trim()) return showToast('审查意见不能为空', 'warn');
    try {
      await api.addReview(plan.id, {
        outcome: outcome(), comment: comment(), reviewer: reviewer(),
      });
      setComment('');
      await load();
      // 后端可能已因退回改变方案状态，重新拉取并同步只读标记
      const refreshed = await api.getPlan(plan.id);
      setCurrentPlan(refreshed);
      setReadOnly(refreshed.status === 'published');
      showToast(outcome() === 'reject' ? '已退回，方案回到草稿状态' : '审查意见已记录', 'ok');
    } catch (err) { showToast(err.message, 'err'); }
  };

  const enterAnnotate = () => {
    if (!currentPlan() || currentPlan().status !== 'published') {
      return showToast('只有公示中的方案可以标点批注', 'warn');
    }
    setTool('annotate');
    showToast('在画布上点击位置即可批注', 'info');
  };

  const submitNote = async () => {
    const plan = currentPlan();
    if (!plan) return;
    if (!note().trim()) return;
    try {
      const c = scene.bounds;
      await api.addAnnotation(plan.id, {
        x: (c.minX + c.maxX) / 2, y: (c.minY + c.maxY) / 2, text: note(),
      });
      setNote('');
      await load();
      showToast('批注已发布', 'ok');
    } catch (err) { showToast(err.message, 'err'); }
  };

  return (
    <div class="review-panel">
      <h3 class="panel-title">审查意见与公示批注</h3>

      <Show when={role() === 'reviewer'}>
        <div class="review-box">
          <h4 class="sub-title">审查人意见（仅送审中可填）</h4>
          <div class="seg">
            <button class={`seg-btn ${outcome() === 'reject' ? 'active danger' : ''}`}
              onClick={() => setOutcome('reject')}>退回修改</button>
            <button class={`seg-btn ${outcome() === 'approve' ? 'active ok' : ''}`}
              onClick={() => setOutcome('approve')}>同意</button>
          </div>
          <div class="field">
            <label>署名</label>
            <input value={reviewer()} onInput={(e) => setReviewer(e.target.value)} />
          </div>
          <textarea class="ta" rows="4" placeholder="填写保护规划符合性、照度达标、光污染控制等意见…"
            value={comment()} onInput={(e) => setComment(e.target.value)} />
          <button class="btn primary" onClick={submitReview}>提交审查意见</button>
        </div>
      </Show>

      <h4 class="sub-title">意见记录（{reviews().length}）</h4>
      <div class="review-list">
        <For each={reviews()}>
          {(r) => (
            <div class={`review-item ${r.outcome}`}>
              <div class="ri-head">
                <span class={`ri-tag ${r.outcome}`}>{r.outcome === 'reject' ? '退回' : '同意'}</span>
                <b>{r.reviewer}</b>
                <span class="ri-time">{new Date(r.createdAt).toLocaleString('zh-CN')}</span>
              </div>
              <p>{r.comment}</p>
            </div>
          )}
        </For>
        <Show when={reviews().length === 0}><p class="hint">暂无审查意见。</p></Show>
      </div>

      <Show when={currentPlan()?.status === 'published'}>
        <div class="anno-box">
          <h4 class="sub-title">公示批注（只读画布，公众可标点）</h4>
          <button class="btn primary" onClick={enterAnnotate}>在画布上标点批注</button>
          <Show when={role() === 'public'}>
            <textarea class="ta" rows="2" placeholder="或直接提交文字意见…"
              value={note()} onInput={(e) => setNote(e.target.value)} />
            <button class="btn" onClick={submitNote}>提交文字意见</button>
          </Show>
          <div class="anno-list">
            <For each={annotations()}>
              {(a) => (
                <div class="anno-item">
                  <div class="anno-head">
                    <b>{a.author}</b>
                    <span>{new Date(a.createdAt).toLocaleDateString('zh-CN')}</span>
                  </div>
                  <p>{a.text}</p>
                  <div class="anno-pos">标注点 ({a.x.toFixed(1)}, {a.y.toFixed(1)})</div>
                </div>
              )}
            </For>
          </div>
        </div>
      </Show>

      <Show when={readOnly()}>
        <p class="hint locked">🔒 公示模式：场景与灯具参数只读，仅可查看与批注。</p>
      </Show>
    </div>
  );
}
