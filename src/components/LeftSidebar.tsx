import { createSignal, For, Show } from 'solid-js';
import { CATEGORIES, CATEGORY_FILTERS, LAYERS } from '../config';
import type { LayerId, ToolMode } from '../types';
import {
  addBookmark, bookmarks, categoryFilter, clearMeasure, layerOn, marks, measureSegs,
  removeBookmark, setCategoryFilter, setLayerOn, setTool, tool, view,
} from '../store';
import { data } from './MapView';

const TOOLS: { id: ToolMode; name: string; hint: string }[] = [
  { id: 'select', name: '点选', hint: '单击要素穿透选中最上层，侧栏查看详情' },
  { id: 'box', name: '框选', hint: '按住拖拽框选视口内可见要素，批量高亮描边' },
  { id: 'measure', name: '测距', hint: '逐点点击绘制测距折线，双击或右键结束' },
  { id: 'mark', name: '标记', hint: '在地图上点击放置临时标记（仅本次会话）' },
];

const LAYER_COUNT: Partial<Record<LayerId, () => number>> = {
  building: () => data.buildings.filter((b) => b.layer === 'building').length,
  dorm: () => data.buildings.filter((b) => b.layer === 'dorm').length,
  canteen: () => data.buildings.filter((b) => b.layer === 'canteen').length,
  pipeline: () => data.pipelines.length,
  fire: () => data.points.filter((p) => p.layer === 'fire').length,
  security: () => data.points.filter((p) => p.layer === 'security').length,
  power: () => data.points.filter((p) => p.layer === 'power').length,
  road: () => data.roads.length,
};

export default function LeftSidebar() {
  const [bmName, setBmName] = createSignal('');

  const toggle = (id: LayerId) => setLayerOn(id, (v) => !v);
  const allOn = () => LAYERS.every((l) => layerOn[l.id]);
  const toggleAll = () => {
    const v = !allOn();
    LAYERS.forEach((l) => setLayerOn(l.id, v));
  };

  return (
    <div class="sidebar">
      <div class="card">
        <h3>
          图层控制
          <button class="icon-btn" onClick={toggleAll}>{allOn() ? '全部关闭' : '全部打开'}</button>
        </h3>
        <For each={LAYERS}>
          {(l) => (
            <div class="layer-row">
              <span class="dot" style={{ background: l.color }} />
              <span class="name">{l.name}</span>
              <span class="cnt">{LAYER_COUNT[l.id]?.()}</span>
              <div class={'switch' + (layerOn[l.id] ? ' on' : '')} onClick={() => toggle(l.id)} />
            </div>
          )}
        </For>
      </div>

      <div class="card">
        <h3>作业工具</h3>
        <div class="tool-grid">
          <For each={TOOLS}>
            {(t) => (
              <button class={tool() === t.id ? 'active' : ''} onClick={() => setTool(t.id)}>{t.name}</button>
            )}
          </For>
        </div>
        <div class="tool-hint">{TOOLS.find((t) => t.id === tool())?.hint}</div>
        <Show when={tool() === 'measure'}>
          <div class="count-line">已测 {measureSegs().length} 段
            <button class="icon-btn" style={{ float: 'right' }} onClick={clearMeasure}>清空测距</button>
          </div>
        </Show>
      </div>

      <div class="card">
        <h3>按类别过滤</h3>
        <div class="filter-row">
          <select value={categoryFilter()} onChange={(e) => setCategoryFilter(e.currentTarget.value as any)}>
            <For each={CATEGORY_FILTERS}>{(c) => <option value={c.id}>{c.name}</option>}</For>
          </select>
        </div>
        <div class="count-line">
          <For each={CATEGORIES}>
            {(c) => (
              <span style={{ 'margin-right': '8px', 'white-space': 'nowrap' }}>
                <span style={{ color: c.color }}>●</span> {c.name}
              </span>
            )}
          </For>
        </div>
      </div>

      <div class="card">
        <h3>书签视角</h3>
        <div class="filter-row">
          <input
            placeholder="视角名称，如：北区宿舍"
            value={bmName()}
            onInput={(e) => setBmName(e.currentTarget.value)}
          />
          <button
            class="primary"
            onClick={() => {
              addBookmark(bmName(), view());
              setBmName('');
            }}
          >
            存当前
          </button>
        </div>
        <Show when={bookmarks().length} fallback={<div class="empty">暂无书签，缩放定位后点“存当前”</div>}>
          <For each={bookmarks()}>
            {(bm) => (
              <div class="bookmark-row">
                <span class="nm" title={bm.name}>{bm.name}</span>
                <span style={{ color: 'var(--text-dim)' }}>{bm.createdAt.slice(5)}</span>
                <button
                  class="icon-btn"
                  onClick={() => window.dispatchEvent(new CustomEvent('campus:goto', { detail: bm.view }))}
                >
                  飞往
                </button>
                <button class="icon-btn danger" onClick={() => removeBookmark(bm.id)}>删</button>
              </div>
            )}
          </For>
        </Show>
      </div>

      <div class="card">
        <h3>临时标记 {marks().length ? `（${marks().length}）` : ''}</h3>
        <Show when={marks().length} fallback={<div class="empty">选“标记”工具后在地图上点击放置</div>}>
          <For each={marks()}>
            {(m, i) => (
              <div class="mark-row">
                <span style={{ color: m.color }}>▲</span>
                <span class="nm">{m.text || '标记 ' + (i() + 1)}</span>
                <span style={{ color: 'var(--text-dim)' }}>{m.x.toFixed(0)}, {m.z.toFixed(0)}</span>
              </div>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
