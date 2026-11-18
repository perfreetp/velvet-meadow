import { For, Show, createSignal, onMount } from 'solid-js';
import {
  plans, setPlans, currentPlan, setCurrentPlan, loadScene,
  snapshotScene, setReadOnly, showToast, replaceAll, setAnnotations,
} from '../../store/app.js';
import { api, STATUS_META, getRole } from '../../services/api.js';

export default function PlanPanel() {
  const [name, setName] = createSignal(`街区方案 ${new Date().toLocaleDateString('zh-CN')}`);
  const [district, setDistrict] = createSignal('南市历史街区');
  const role = () => getRole();

  const refresh = async () => {
    setPlans(await api.listPlans());
  };
  onMount(refresh);

  const create = async () => {
    if (!name().trim()) return showToast('请填写方案名称', 'warn');
    const plan = await api.createPlan({
      name: name(), district: district(), scene: snapshotScene(),
    });
    setCurrentPlan(plan);
    setReadOnly(false);
    await refresh();
    showToast('草稿已保存', 'ok');
  };

  const save = async () => {
    const plan = currentPlan();
    if (!plan) return showToast('请先新建方案', 'warn');
    try {
      await api.updatePlan(plan.id, {
        name: plan.name, district: plan.district, scene: snapshotScene(),
      });
      await refresh();
      showToast('草稿改动已保存', 'ok');
    } catch (err) { showToast(err.message, 'err'); }
  };

  const open = async (plan) => {
    const full = await api.getPlan(plan.id);
    replaceAll(full.scene);
    setCurrentPlan(full);
    setAnnotations(await api.listAnnotations(full.id));
    const pub = full.status === 'published';
    setReadOnly(pub);
    window.__currentPlanId = () => full.id;
    setTimeout(() => window.__fitView?.(), 50);
    showToast(`已打开「${full.name}」${pub ? '（公示只读）' : ''}`, 'info');
  };

  const transition = async (to) => {
    const plan = currentPlan();
    if (!plan) return;
    try {
      const updated = await api.transition(plan.id, to);
      setCurrentPlan(updated);
      setReadOnly(to === 'published');
      await refresh();
      showToast(`状态已流转为「${STATUS_META[to].label}」`, 'ok');
    } catch (err) { showToast(err.message, 'err'); }
  };

  const remove = async (plan) => {
    if (!confirm(`确认删除草稿「${plan.name}」？`)) return;
    await api.deletePlan(plan.id);
    if (currentPlan()?.id === plan.id) setCurrentPlan(null);
    await refresh();
  };

  return (
    <div class="plan-panel">
      <h3 class="panel-title">方案后台</h3>
      <Show when={role() === 'planner'}>
        <div class="field">
          <label>方案名称</label>
          <input value={name()} onInput={(e) => setName(e.target.value)} />
        </div>
        <div class="field">
          <label>所属街区</label>
          <input value={district()} onInput={(e) => setDistrict(e.target.value)} />
        </div>
        <div class="btn-grid">
          <button class="btn primary" onClick={create}>新建草稿</button>
          <button class="btn" onClick={save} disabled={!currentPlan()}>保存当前场景</button>
        </div>
      </Show>

      <Show when={currentPlan()}>
        <div class="current-plan">
          <div class="cp-head">
            <b>{currentPlan().name}</b>
            <span class="status-badge" style={{ color: STATUS_META[currentPlan().status].tone }}>
              {STATUS_META[currentPlan().status].label}
            </span>
          </div>
          <div class="cp-actions">
            <Show when={currentPlan().status === 'draft' && role() === 'planner'}>
              <button class="btn warn" onClick={() => transition('submitted')}>提交送审</button>
            </Show>
            <Show when={currentPlan().status === 'submitted' && role() === 'reviewer'}>
              <button class="btn ok" onClick={() => transition('published')}>审查通过并公示</button>
              <button class="btn danger" onClick={() => transition('draft')}>退回草稿</button>
            </Show>
            <Show when={currentPlan().status === 'published' && role() === 'reviewer'}>
              <button class="btn danger" onClick={() => transition('draft')}>撤下公示回退</button>
            </Show>
          </div>
          <p class="hint">
            最近更新 {new Date(currentPlan().updatedAt).toLocaleString('zh-CN')}
          </p>
        </div>
      </Show>

      <h4 class="sub-title">方案列表（{plans().length}）</h4>
      <div class="plan-list">
        <For each={plans()}>
          {(p) => (
            <div class="plan-row" classList={{ active: currentPlan()?.id === p.id }}>
              <div class="plan-main" onClick={() => open(p)}>
                <div class="plan-name">{p.name}</div>
                <div class="plan-meta">
                  <span class="status-badge" style={{ color: STATUS_META[p.status].tone }}>
                    {STATUS_META[p.status].label}
                  </span>
                  <span>{p.district}</span>
                  <span>{new Date(p.updatedAt).toLocaleDateString('zh-CN')}</span>
                </div>
              </div>
              <Show when={p.status === 'draft' && role() === 'planner'}>
                <button class="icon-btn danger" onClick={() => remove(p)} title="删除草稿">✕</button>
              </Show>
            </div>
          )}
        </For>
        <Show when={plans().length === 0}>
          <p class="hint">暂无方案，规划员可先新建草稿。</p>
        </Show>
      </div>
    </div>
  );
}
