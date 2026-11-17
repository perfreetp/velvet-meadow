import { createMemo, createSignal, For, Match, Show, Switch } from 'solid-js';
import { CATEGORY_BY_ID, LAYER_BY_ID } from '../config';
import type { AnyFeature, PointCategory, WorkOrder } from '../types';
import {
  boxIds, createOrder, dispatchOrder, highlightedIds, orders, qaPass, qaReturn,
  selectedId, STATUS_LABEL, submitOrder, workerStats, WORKERS,
} from '../store';
import { data } from './MapView';

type Tab = 'detail' | 'orders' | 'dash';

export default function RightSidebar() {
  const [tab, setTab] = createSignal<Tab>('detail');

  return (
    <div class="sidebar right">
      <div class="tabs">
        <button class={tab() === 'detail' ? 'active' : ''} onClick={() => setTab('detail')}>要素详情</button>
        <button class={tab() === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>
          工单 <span style={{ color: 'var(--warn)' }}>{orders.length}</span>
        </button>
        <button class={tab() === 'dash' ? 'active' : ''} onClick={() => setTab('dash')}>看板</button>
      </div>
      <Switch>
        <Match when={tab() === 'detail'}><DetailPanel /></Match>
        <Match when={tab() === 'orders'}><OrderPanel /></Match>
        <Match when={tab() === 'dash'}><DashPanel /></Match>
      </Switch>
    </div>
  );
}

function DetailPanel() {
  const feature = createMemo<AnyFeature | null>(() => {
    const id = selectedId();
    return id ? data.featureById.get(id) || null : null;
  });
  const boxList = createMemo(() => [...boxIds()].map((id) => data.featureById.get(id)).filter(Boolean).slice(0, 200));

  return (
    <Show when={feature()} fallback={
      <div class="card">
        <h3>要素详情</h3>
        <div class="empty">
          未选中要素。<br />
          用“点选”单击地图要素；点位重叠时自动穿透到最上层。
        </div>
        <Show when={highlightedIds().size}>
          <div class="count-line">当前高亮 <b>{highlightedIds().size}</b> 个要素（切换图层不会丢失）</div>
        </Show>
        <Show when={boxList().length}>
          <h3 style={{ 'margin-top': '12px' }}>框选清单（前 {boxList().length} 项）</h3>
          <For each={boxList()}>{(f) => <div class="bookmark-row"><span class="nm">{codeOf(f!)}</span><span class="tag">{typeName(f!)}</span></div>}</For>
        </Show>
      </div>
    }>
      {(f) => (
        <>
          <div class="card">
            <h3>要素详情 <span class={'tag ' + f()!.layer}>{LAYER_BY_ID[f()!.layer].name}</span></h3>
            <DetailKv f={f()!} />
          </div>
          <NewOrderCard f={f()!} />
          <Show when={boxList().length}>
            <div class="card">
              <h3>框选清单（{boxIds().size}，显示前 {boxList().length} 项）</h3>
              <For each={boxList()}>{(bf) => <div class="bookmark-row"><span class="nm">{codeOf(bf!)}</span><span class="tag">{typeName(bf!)}</span></div>}</For>
            </div>
          </Show>
        </>
      )}
    </Show>
  );
}

function DetailKv(props: { f: AnyFeature }) {
  const f = () => props.f;
  return (
    <Switch>
      <Match when={f().type === 'point'}>
        {(() => {
          const p = f() as Extract<AnyFeature, { type: 'point' }>;
          const meta = CATEGORY_BY_ID[p.category];
          return (
            <div class="kv">
              <span class="k">编号</span><span>{p.code}</span>
              <span class="k">类别</span><span><span style={{ color: meta.color }}>●</span> {meta.name}</span>
              <span class="k">所属楼栋</span><span>{p.buildingCode === 'ROAD' ? '道路附属设施' : p.buildingCode === 'CAMPUS' ? '校园公共区' : p.buildingCode}</span>
              <span class="k">坐标</span><span>X {p.x.toFixed(1)} / Z {p.z.toFixed(1)}</span>
              <span class="k">上次巡检</span><span>{p.inspectDate}</span>
            </div>
          );
        })()}
      </Match>
      <Match when={f().type === 'building'}>
        {(() => {
          const b = f() as Extract<AnyFeature, { type: 'building' }>;
          return (
            <div class="kv">
              <span class="k">编号</span><span>{b.code}</span>
              <span class="k">名称</span><span>{b.name}</span>
              <span class="k">占地</span><span>{b.w.toFixed(1)} × {b.d.toFixed(1)} m</span>
              <span class="k">楼高</span><span>{b.height.toFixed(1)} m</span>
              <span class="k">上次巡检</span><span>{b.inspectDate}</span>
            </div>
          );
        })()}
      </Match>
      <Match when={f().type === 'pipeline'}>
        {(() => {
          const p = f() as Extract<AnyFeature, { type: 'pipeline' }>;
          return (
            <div class="kv">
              <span class="k">编号</span><span>{p.code}</span>
              <span class="k">管线</span><span>{p.name}{p.trunk ? '（主管）' : '（支管）'}</span>
              <span class="k">管径</span><span>{p.diameter} mm</span>
              <span class="k">长度</span><span>{Math.hypot(p.x2 - p.x1, p.z2 - p.z1).toFixed(1)} m</span>
              <span class="k">上次巡检</span><span>{p.inspectDate}</span>
            </div>
          );
        })()}
      </Match>
      <Match when={f().type === 'road'}>
        {(() => {
          const r = f() as Extract<AnyFeature, { type: 'road' }>;
          return (
            <div class="kv">
              <span class="k">道路</span><span>{r.name}</span>
              <span class="k">路宽</span><span>{r.width} m</span>
              <span class="k">长度</span><span>{Math.hypot(r.x2 - r.x1, r.z2 - r.z1).toFixed(1)} m</span>
            </div>
          );
        })()}
      </Match>
    </Switch>
  );
}

function NewOrderCard(props: { f: AnyFeature }) {
  const [title, setTitle] = createSignal('');
  const [content, setContent] = createSignal('');
  const [done, setDone] = createSignal('');

  const category = (): PointCategory | 'building' | 'pipeline' | 'road' =>
    props.f.type === 'point' ? (props.f as any).category : props.f.type;

  const submit = () => {
    if (!title().trim()) return;
    const wo = createOrder({
      title: title().trim(),
      category: category(),
      featureId: props.f.id,
      featureCode: codeOf(props.f),
      content: content().trim(),
    });
    setDone(wo.id);
    setTitle('');
    setContent('');
    setTimeout(() => setDone(''), 2500);
  };

  return (
    <div class="card">
      <h3>前台接单 · 建单分派</h3>
      <div class="count-line" style={{ margin: '0 0 8px' }}>关联要素：<b>{codeOf(props.f)}</b></div>
      <input placeholder="报修事项标题，如：消火栓漏水" value={title()} onInput={(e) => setTitle(e.currentTarget.value)}
        style={{ width: '100%', 'margin-bottom': '6px' }} />
      <textarea placeholder="故障描述 / 报修内容" rows={3} value={content()} onInput={(e) => setContent(e.currentTarget.value)}
        style={{ width: '100%', 'margin-bottom': '8px', resize: 'vertical' }} />
      <button class="primary" style={{ width: '100%' }} onClick={submit}>提交工单进入待分派</button>
      <Show when={done()}><div class="count-line" style={{ color: 'var(--ok)' }}>工单 {done()} 已创建，请到“工单”页分派师傅</div></Show>
    </div>
  );
}

// ---------------- 工单流转 ----------------
function OrderPanel() {
  const [role, setRole] = createSignal<'dispatcher' | 'worker' | 'qa'>('dispatcher');
  const [worker, setWorker] = createSignal(WORKERS[0]);
  return (
    <>
      <div class="tabs">
        <button class={role() === 'dispatcher' ? 'active' : ''} onClick={() => setRole('dispatcher')}>前台分派</button>
        <button class={role() === 'worker' ? 'active' : ''} onClick={() => setRole('worker')}>师傅施工</button>
        <button class={role() === 'qa' ? 'active' : ''} onClick={() => setRole('qa')}>质检抽查</button>
      </div>
      <Switch>
        <Match when={role() === 'dispatcher'}>
          <For each={orders} fallback={<div class="empty">暂无工单，在要素详情页接单建单</div>}>
            {(o) => (
              <div class="wo-item">
                <span class={'status ' + o.status}>{STATUS_LABEL[o.status]}</span>
                <div class="tt">{o.title}</div>
                <div class="meta">{o.id} · {o.featureCode} · 建单 {o.createdAt}{o.assignee ? ' · ' + o.assignee : ''}{o.reworkCount ? ` · 返工 ${o.reworkCount} 次` : ''}</div>
                <Show when={o.content}><div style={{ 'font-size': '11px', color: 'var(--text-dim)' }}>{o.content}</div></Show>
                <Show when={o.status === 'pending'}>
                  <DispatchRow o={o} />
                </Show>
              </div>
            )}
          </For>
        </Match>

        <Match when={role() === 'worker'}>
          <div class="filter-row" style={{ 'margin-bottom': '8px' }}>
            <select value={worker()} onChange={(e) => setWorker(e.currentTarget.value)}>
              <For each={WORKERS}>{(w) => <option>{w}</option>}</For>
            </select>
          </div>
          <For each={orders.filter((o) => o.assignee === worker() && (o.status === 'dispatched' || o.status === 'submitted'))}
            fallback={<div class="empty">当前没有进行中的工单</div>}>
            {(o) => (
              <div class="wo-item">
                <span class={'status ' + o.status}>{STATUS_LABEL[o.status]}</span>
                <div class="tt">{o.title}</div>
                <div class="meta">{o.id} · {o.featureCode}{o.reworkCount ? ` · 第 ${o.reworkCount + 1} 次处理` : ''}</div>
                <Show when={o.qaNote}><div style={{ 'font-size': '11px', color: '#ef9a9a' }}>退回意见：{o.qaNote}</div></Show>
                <Show when={o.status === 'dispatched'}>
                  <WorkerSubmit o={o} />
                </Show>
                <Show when={o.status === 'submitted'}>
                  <div class="count-line" style={{ color: '#ce93d8' }}>已提交完工说明，等待质检抽查</div>
                  <div style={{ 'font-size': '11px', color: 'var(--text-dim)' }}>{o.resultNote}</div>
                </Show>
              </div>
            )}
          </For>
        </Match>

        <Match when={role() === 'qa'}>
          <For each={orders.filter((o) => o.status === 'submitted')} fallback={<div class="empty">没有待质检的完工工单</div>}>
            {(o) => (
              <div class="wo-item">
                <span class="status submitted">待质检</span>
                <div class="tt">{o.title}</div>
                <div class="meta">{o.id} · {o.featureCode} · {o.assignee} · 提交 {o.submittedAt}</div>
                <div style={{ 'font-size': '11px', color: 'var(--text-dim)' }}>完工说明：{o.resultNote}</div>
                <QaActions o={o} />
              </div>
            )}
          </For>
          <h3 style={{ 'margin-top': '10px' }}>已完工归档（{orders.filter((o) => o.status === 'done').length}）</h3>
          <For each={orders.filter((o) => o.status === 'done').slice(0, 10)}>
            {(o) => (
              <div class="wo-item" style={{ opacity: 0.75 }}>
                <span class="status done">已完工</span>
                <div class="tt">{o.title}</div>
                <div class="meta">{o.id} · {o.assignee}{o.reworkCount ? ` · 返工 ${o.reworkCount} 次` : ''}</div>
              </div>
            )}
          </For>
        </Match>
      </Switch>
    </>
  );
}

function DispatchRow(props: { o: WorkOrder }) {
  const [assignee, setAssignee] = createSignal(WORKERS[0]);
  return (
    <div class="wo-actions">
      <select style={{ flex: 1 }} value={assignee()} onChange={(e) => setAssignee(e.currentTarget.value)}>
        <For each={WORKERS}>{(w) => <option>{w}</option>}</For>
      </select>
      <button class="primary" onClick={() => dispatchOrder(props.o.id, assignee())}>分派</button>
    </div>
  );
}

function WorkerSubmit(props: { o: WorkOrder }) {
  const [note, setNote] = createSignal('');
  return (
    <>
      <textarea rows={2} placeholder="完工情况说明（更换部件、测试结果等）" value={note()}
        onInput={(e) => setNote(e.currentTarget.value)} style={{ width: '100%', 'margin-top': '6px' }} />
      <div class="wo-actions">
        <button class="primary" disabled={!note().trim()} onClick={() => { submitOrder(props.o.id, note().trim()); setNote(''); }}>
          完工提交
        </button>
      </div>
    </>
  );
}

function QaActions(props: { o: WorkOrder }) {
  const [note, setNote] = createSignal('');
  return (
    <>
      <textarea rows={2} placeholder="抽查不合格时填写退回原因" value={note()}
        onInput={(e) => setNote(e.currentTarget.value)} style={{ width: '100%', 'margin-top': '6px' }} />
      <div class="wo-actions">
        <button class="primary" onClick={() => qaPass(props.o.id)}>抽查合格 · 归档</button>
        <button class="danger" disabled={!note().trim()} onClick={() => { qaReturn(props.o.id, note().trim()); setNote(''); }}>
          不合格退回
        </button>
      </div>
    </>
  );
}

// ---------------- 看板 ----------------
function DashPanel() {
  const stats = workerStats();
  const maxTotal = Math.max(1, ...stats.map((s) => s.total));
  const totalRework = stats.reduce((a, s) => a + s.rework, 0);
  const doneCount = orders.filter((o) => o.status === 'done').length;
  return (
    <div class="card">
      <h3>师傅绩效看板</h3>
      <div class="count-line">
        总工单 <b>{orders.length}</b> · 已完工 <b>{doneCount}</b> · 累计返工 <b>{totalRework}</b>
      </div>
      <table class="dash">
        <thead>
          <tr><th>师傅</th><th>承接</th><th>完工</th><th>在办</th><th>返工率</th></tr>
        </thead>
        <tbody>
          <For each={stats}>
            {(s) => (
              <tr>
                <td>{s.worker}</td>
                <td>
                  {s.total}
                  <div class="bar"><i style={{ width: (s.total / maxTotal * 100) + '%' }} /></div>
                </td>
                <td style={{ color: 'var(--ok)' }}>{s.done}</td>
                <td>{s.pending}</td>
                <td>
                  <span style={{ color: s.reworkRate > 0.3 ? 'var(--danger)' : s.reworkRate > 0.1 ? 'var(--warn)' : 'var(--text)' }}>
                    {(s.reworkRate * 100).toFixed(1)}%
                  </span>
                  <div class="bar">
                    <i class={s.reworkRate > 0.3 ? 'bad' : s.reworkRate > 0.1 ? 'warn' : ''}
                      style={{ width: Math.min(100, s.reworkRate * 100) + '%' }} />
                  </div>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      <div class="tool-hint" style={{ 'margin-top': '8px' }}>
        返工率 = 累计退回次数 ÷ 处理工单总数；质检每退回一次自动 +1 并重新回到师傅在办列表。
      </div>
    </div>
  );
}

function codeOf(f: AnyFeature): string {
  return f.type === 'road' ? f.name : (f as any).code;
}
function typeName(f: AnyFeature): string {
  if (f.type === 'point') return CATEGORY_BY_ID[f.category].name;
  if (f.type === 'building') return f.name;
  if (f.type === 'pipeline') return f.name;
  return '道路';
}
