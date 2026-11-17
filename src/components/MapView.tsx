import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { CampusEngine, type BoxRect } from '../babylon/CampusEngine';
import { CATEGORY_BY_ID, LAYER_BY_ID, LOD } from '../config';
import { generateCampus } from '../data';
import type { AnyFeature, PointFeature } from '../types';
import {
  addMark, boxIds, categoryFilter, clearMarks, clearMeasure, highlightedIds, hoveredId,
  layerOn, marks, measureSegs, measureTotal, popMeasure, pushMeasure, selectedId, setBoxIds,
  setHoveredId, setSelectedId, setTool, setView, tool, view,
} from '../store';
import Minimap from './Minimap';
import ScaleBar from './ScaleBar';

const data = generateCampus();
export { data };

const LOD_NAME: Record<number, string> = { 0: '总图级 · 楼栋轮廓+主干道', 1: '分区级 · 楼栋+主管线', 2: '街区级 · 次管线+路灯井阀', 3: '近景级 · 消火栓/摄像头/配电箱' };

function lodLevel(h: number) {
  if (h > LOD.outline) return 0;
  if (h > LOD.district) return 1;
  if (h > LOD.street) return 2;
  return 3;
}

export default function MapView() {
  let canvas!: HTMLCanvasElement;
  const [engine, setEngine] = createSignal<CampusEngine | undefined>(undefined);
  const [rect, setRect] = createSignal<BoxRect | null>(null);
  const [tip, setTip] = createSignal<{ f: AnyFeature; x: number; y: number } | null>(null);
  const [, forceTick] = createSignal(0);

  onMount(() => {
    const eng = new CampusEngine(
      canvas,
      data,
      {
        onPick: (f) => setSelectedId(f ? f.id : null),
        onHover: (f, x, y) => {
          setHoveredId(f ? f.id : null);
          setTip(f ? { f, x, y } : null);
        },
        onBoxRect: (r) => {
          setRect(r);
          eng.setBoxRect(r);
        },
        onMeasureSeg: (seg) => pushMeasure(seg),
        onMeasureDouble: (dropLast) => {
          if (dropLast) popMeasure();
          setTool('select');
        },
        onMarkPick: (x, z) => {
          addMark({ x, z, text: '标记 ' + (marks().length + 1), color: '#ff7043' });
          eng.setMarks(marks());
        },
      },
      layerOn,
    );
    eng.onBoxSelect((ids) => setBoxIds(new Set(ids) as Set<string>));
    eng.setView(view());

    // 书签“飞往”
    const goto = (e: Event) => {
      eng.setView((e as CustomEvent).detail);
      setView(eng.getView());
    };
    window.addEventListener('campus:goto', goto);
    onCleanup(() => window.removeEventListener('campus:goto', goto));

    createEffect(() => eng.setLayerOn(layerOn));
    createEffect(() => eng.setCategoryFilter(categoryFilter()));
    createEffect(() => eng.setTool(tool()));
    createEffect(() => eng.setHighlights(highlightedIds()));
    createEffect(() => eng.setMeasure(measureSegs()));
    createEffect(() => eng.setMarks(marks()));

    setEngine(eng);

    // 视口状态同步（节流写入，供鹰眼/比例尺/书签使用）
    const t = setInterval(() => {
      setView(eng.getView());
      forceTick((n) => n + 1);
    }, 120);
    onCleanup(() => clearInterval(t));
    onCleanup(() => eng.dispose());
  });

  const totalPoints = data.points.length;
  const visibleCount = createMemo(() => {
    const v = view();
    let n = 0;
    for (const p of data.points) {
      const meta = CATEGORY_BY_ID[p.category];
      if (!layerOn[p.layer]) continue;
      if (categoryFilter() !== 'all' && p.category !== categoryFilter()) continue;
      if (v.height > meta.maxH) continue;
      n++;
    }
    return n;
  });

  const tipContent = (f: AnyFeature) => {
    if (f.type === 'point') {
      const p = f as PointFeature;
      const meta = CATEGORY_BY_ID[p.category];
      return (
        <>
          <b>{meta.name} {p.code}</b>
          <div class="dim">图层：{LAYER_BY_ID[p.layer].name} · 所属：{p.buildingCode === 'ROAD' ? '道路附属' : p.buildingCode === 'CAMPUS' ? '校园公共区' : p.buildingCode}</div>
          <div class="dim">上次巡检：{p.inspectDate}</div>
        </>
      );
    }
    if (f.type === 'building') {
      return (
        <>
          <b>{f.name}（{f.code}）</b>
          <div class="dim">{LAYER_BY_ID[f.layer].name} · 高 {f.height.toFixed(1)}m</div>
          <div class="dim">上次巡检：{f.inspectDate}</div>
        </>
      );
    }
    if (f.type === 'pipeline') {
      return (
        <>
          <b>{f.name} {f.code}</b>
          <div class="dim">管径 {f.diameter}mm{f.trunk ? ' · 主管' : ' · 支管'}</div>
          <div class="dim">上次巡检：{f.inspectDate}</div>
        </>
      );
    }
    return <b>{f.name}</b>;
  };

  const tipPos = () => {
    const t = tip();
    if (!t) return {};
    const wrapW = canvas?.clientWidth || 800;
    const left = t.x + 16 + 250 > wrapW ? t.x - 250 : t.x + 16;
    return { left: left + 'px', top: Math.max(8, t.y - 10) + 'px' };
  };

  return (
    <div class="map-wrap">
      <canvas ref={canvas} class="map-canvas" />

      <div class="overlay lod-badge">
        <b>{LOD_NAME[lodLevel(view().height)]}</b>
        <div>视口高 {view().height.toFixed(0)}m · 点位可见 {visibleCount().toLocaleString()} / {totalPoints.toLocaleString()}</div>
      </div>

      <div class="overlay zoom-ctrl">
        <button title="放大" onClick={() => engine()?.zoomBy(0.75)}>＋</button>
        <button title="缩小" onClick={() => engine()?.zoomBy(1.33)}>－</button>
        <button title="全图" onClick={() => engine()?.setView({ targetX: 0, targetZ: 0, height: 620 })}>全</button>
      </div>

      <Show when={tip()}>
        <div class="overlay tooltip" style={tipPos()}>{tipContent(tip()!.f)}</div>
      </Show>

      <Show when={rect()}>
        <div
          class="overlay box-rubber"
          style={{
            left: Math.min(rect()!.x0, rect()!.x1) + 'px',
            top: Math.min(rect()!.y0, rect()!.y1) + 'px',
            width: Math.abs(rect()!.x1 - rect()!.x0) + 'px',
            height: Math.abs(rect()!.y1 - rect()!.y0) + 'px',
          }}
        />
      </Show>

      {/* 测距标注 */}
      <Show when={measureSegs().length}>
        <div class="overlay measure-total">
          总长度 <b>{measureTotal().toFixed(1)} m</b>
          <button class="icon-btn" style={{ margin: '0 0 0 8px' }} onClick={() => clearMeasure()}>清空</button>
        </div>
      </Show>
      <MeasureLabels engine={engine} />

      {/* 临时标记标注 */}
      <MarkLabels engine={engine} />

      <div class="overlay minimap">
        <span class="cap">鹰眼</span>
        <Minimap engine={engine} data={data} />
      </div>
      <ScaleBar engine={engine} />
      <Show when={marks().length}>
        <div class="overlay" style={{ bottom: '132px', right: '14px' }}>
          <button class="icon-btn danger" onClick={() => { clearMarks(); engine()?.setMarks([]); }}>清除全部标记（{marks().length}）</button>
        </div>
      </Show>
      <Show when={boxIds().size}>
        <div class="overlay" style={{ top: '12px', left: '50%', transform: 'translateX(-50%)' }}>
          <button class="icon-btn" onClick={() => setBoxIds(new Set<string>())}>取消框选（{boxIds().size} 个要素）</button>
        </div>
      </Show>
    </div>
  );
}

/** 每段测距的中点长度标签（随视图刷新） */
function MeasureLabels(props: { engine: () => CampusEngine | undefined }) {
  const [, tick] = createSignal(0);
  onMount(() => {
    const t = setInterval(() => tick((n) => n + 1), 150);
    onCleanup(() => clearInterval(t));
  });
  const eng = () => props.engine();
  return (
    <Show when={eng()}>
      {measureSegs().map((s) => {
        const p = eng()!.screenOf((s.x1 + s.x2) / 2, (s.z1 + s.z2) / 2);
        return <span class="overlay seg-label" style={{ left: p.x + 'px', top: p.y + 'px' }}>{s.len.toFixed(1)}m</span>;
      })}
    </Show>
  );
}

function MarkLabels(props: { engine: () => CampusEngine | undefined }) {
  const [, tick] = createSignal(0);
  onMount(() => {
    const t = setInterval(() => tick((n) => n + 1), 150);
    onCleanup(() => clearInterval(t));
  });
  const eng = () => props.engine();
  return (
    <Show when={eng()}>
      {marks().map((m, i) => {
        const p = eng()!.screenOf(m.x, m.z);
        return <span class="overlay marker-label" style={{ left: p.x + 'px', top: p.y + 'px' }}>{m.text || '标记' + (i + 1)}</span>;
      })}
    </Show>
  );
}
