import { createSignal, For, Show, createMemo } from 'solid-js';
import { store } from '../lib/store';
import { TOOLS, fmtDay } from '../lib/constants';
import EditorCanvas from '../components/EditorCanvas.jsx';
import BabylonPreview from '../components/BabylonPreview.jsx';
import { downloadSVG } from '../lib/svgExport';
import { shapeBounds } from '../lib/geometry';

const TOOLDEFS = [
  { id: TOOLS.SELECT, label: '选择', icon: '➤', key: 'V' },
  { id: TOOLS.PEN, label: '钢笔', icon: '✎', key: 'P' },
  { id: TOOLS.NODE, label: '节点', icon: '◉', key: 'N' },
  { id: TOOLS.RECT, label: '矩形', icon: '▭', key: 'R' },
  { id: TOOLS.ELLIPSE, label: '椭圆', icon: '◯', key: 'O' },
  { id: TOOLS.HAND, label: '平移', icon: '✋', key: 'H' }
];

export default function EditorView() {
  const [toast, setToast] = createSignal(null);
  const [showSubmit, setShowSubmit] = createSignal(false);
  const [vForm, setVForm] = createSignal({ label: '', note: '' });
  const notify = (msg, kind = '') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 2600); };

  const project = () => store.activeProject();
  const doc = () => store.state.draft;
  const selIds = () => store.state.selection.shapeIds;
  const activeShape = () => doc()?.shapes.find((s) => s.id === store.state.selection.activeShapeId);
  const activeNode = () => store.state.selection.nodeIndex;

  const diffVersion = () => {
    const id = store.state.diffVersionId;
    if (!id) return null;
    return project()?.versions.find((v) => v.id === id) || null;
  };

  function doBoolean(op) {
    const r = store.applyBoolean(op);
    if (!r.ok) notify(r.msg, 'err');
    else notify(`${op === 'deoverlap' ? '去重叠' : '布尔运算'}完成,生成 ${r.count} 个可编辑路径`, 'ok');
  }

  function submit() {
    const n = project().versions.length + 1;
    const v = store.submitVersion(vForm().label || `v${n}`, vForm().note);
    setShowSubmit(false);
    setVForm({ label: '', note: '' });
    notify(`已提交 ${v.label},审核人可在版本审核中批注`, 'ok');
  }

  // ---- 图层树 ----
  function TreeRow(props) {
    const node = props.node;
    const isShape = node.kind === 'shape';
    const selected = () => !isShape ? false : selIds().includes(node.id);
    const depth = props.depth || 0;
    return (
      <div class="tree-node">
        <div
          class={`tree-row ${selected() ? 'selected' : ''}`}
          style={{ 'padding-left': `${7 + depth * 12}px` }}
          onClick={() => {
            if (isShape) store.setSelection({ shapeIds: [node.id], activeShapeId: node.id, nodeIndex: null });
          }}
        >
          <span class="tree-ico">{isShape ? (node.type === 'leaf' ? '🍃' : '🌸') : '📁'}</span>
          <span class="name">{node.name}{isShape && node.materialCode ? ` · ${node.materialCode}` : ''}</span>
          <button class="mini" title={node.visible === false ? '显示' : '隐藏'}
            onClick={(e) => { e.stopPropagation(); store.updateLayer(node.id, { visible: !(node.visible !== false) }); }}>
            {node.visible === false ? '🚫' : '👁'}
          </button>
          <Show when={!isShape}>
            <button class="mini" title={node.locked ? '解锁' : '锁定'}
              onClick={(e) => { e.stopPropagation(); store.updateLayer(node.id, { locked: !node.locked }); }}>
              {node.locked ? '🔒' : '🔓'}
            </button>
          </Show>
          <Show when={isShape}>
            <button class="mini" title={node.locked ? '解锁' : '锁定'}
              onClick={(e) => { e.stopPropagation(); lockShape(node.id); }}>
              {node.locked ? '🔒' : '🔓'}
            </button>
          </Show>
        </div>
        <Show when={node.children?.length}>
          <div class="tree-children">
            <For each={node.children}>{(ch) => <TreeRow node={ch} depth={depth + 1} />}</For>
          </div>
        </Show>
      </div>
    );
  }

  const tree = createMemo(() => {
    if (!doc()) return [];
    const layerMap = new Map(doc().layers.map((l) => [l.id, { ...l, children: [] }]));
    const roots = [];
    for (const l of doc().layers) {
      const n = layerMap.get(l.id);
      if (l.parentId && layerMap.has(l.parentId)) layerMap.get(l.parentId).children.push(n);
      else roots.push(n);
    }
    for (const s of doc().shapes) {
      const node = { ...s };
      if (s.parentId && layerMap.has(s.parentId)) layerMap.get(s.parentId).children.push(node);
      else roots.push(node);
    }
    return roots;
  });

  function lockShape(id) {
    store.snapshot();
    const cur = new Set(selIds());
    store.setSelection({ shapeIds: [id], activeShapeId: id, nodeIndex: null });
    store.mutateSelectedShapes((s) => { s.locked = !s.locked; });
    const still = [...cur].filter((x) => x !== id);
    store.setSelection({ shapeIds: still, activeShapeId: still[0] || null, nodeIndex: null });
  }

  return (
    <div class="editor-layout">
      <Show when={toast()}><div class={`toast ${toast().kind}`}>{toast().msg}</div></Show>

      <div class="toolbar">
        <button onClick={() => store.closeEditor()} title="返回方案列表">← 返回</button>
        <div class="sep" />
        <For each={TOOLDEFS}>
          {(t) => (
            <button class={store.state.tool === t.id ? 'active' : ''} title={`${t.label} (${t.key})`}
              onClick={() => store.setTool(t.id)}>
              <span>{t.icon}</span>{t.label}
            </button>
          )}
        </For>
        <div class="sep" />
        <button title="撤销 Ctrl+Z" disabled={!store.state.historyDepth} onClick={() => store.undo()}>↶ 撤销({store.state.historyDepth})</button>
        <button title="重做 Ctrl+Y" disabled={!store.state.redoDepth} onClick={() => store.redo()}>↷ 重做({store.state.redoDepth})</button>
        <div class="sep" />
        <button title="复制 Ctrl+D" disabled={!selIds().length} onClick={() => store.duplicateSelection()}>复制</button>
        <button title="删除 Delete" class="danger" disabled={!selIds().length} onClick={() => store.deleteSelection()}>删除</button>
        <div class="spacer" />
        <button onClick={() => { downloadSVG(project(), doc(), { withAnnotations: doc().settings.showLabels }); notify('SVG 刀版已导出(保留分组与命名)', 'ok'); }}>
          ⬇ 导出 SVG 刀版
        </button>
        <button class="primary" onClick={() => setShowSubmit(true)}>提交新版本</button>
      </div>

      <div class="editor-main">
        {/* 左:图层树 */}
        <div class="side">
          <div class="side-head">
            图层树
            <button class="mini" title="新建图层分组" onClick={() => store.addLayer()}>＋ 分组</button>
          </div>
          <div class="side-body">
            <For each={tree()}>
              {(n) => <TreeRow node={n} depth={0} />}
            </For>
            <Show when={!tree().length}><div class="muted" style={{ padding: '12px 4px' }}>暂无内容</div></Show>
            <Show when={doc()?.layers.length > 1}>
              <div style={{ 'margin-top': '12px' }}>
                <button class="danger" style={{ width: '100%' }}
                  onClick={() => {
                    const id = doc().layers[doc().layers.length - 1].id;
                    if (confirm('删除该图层分组及其下图元?')) store.deleteLayer(id);
                  }}>删除最后一个分组</button>
              </div>
            </Show>
          </div>
        </div>

        {/* 中:画布 + 3D */}
        <div class="canvas-area">
          <EditorCanvas mode="edit" doc={doc()} />
          <BabylonPreview shapes={doc()?.shapes || []} />
          <Show when={diffVersion()}>
            <div class="diff-banner" style={{ position: 'absolute', top: '12px', left: '12px', 'z-index': '3' }}>
              <span>🔍 差异叠加:{diffVersion().label}(橙色虚线为旧版,实线为当前草稿)</span>
              <div class="legend"><span><i class="old" />旧版</span><span><i class="new" />当前</span></div>
              <button onClick={() => store.setDiffVersion(null)}>退出对比</button>
            </div>
          </Show>
        </div>

        {/* 右:属性 + 布尔 + 设置 */}
        <div class="side right">
          <div class="side-head">属性与运算</div>
          <div class="side-body">
            <div class="prop-group">
              <h4>布尔运算(需选中 ≥2 个闭合路径,结果保留可编辑节点)</h4>
              <div class="boolean-bar">
                <button disabled={selIds().length < 2} onClick={() => doBoolean('union')}>∪ 并集</button>
                <button disabled={selIds().length < 2} onClick={() => doBoolean('subtract')}>− 差集</button>
                <button disabled={selIds().length < 2} onClick={() => doBoolean('intersect')}>∩ 交集</button>
                <button disabled={selIds().length < 2} onClick={() => doBoolean('xor')}>⊕ 异或</button>
              </div>
              <button style={{ width: '100%', 'margin-top': '6px' }} disabled={selIds().length < 2}
                onClick={() => doBoolean('deoverlap')}>🧲 重叠叶片去重叠边</button>
            </div>

            <Show when={activeShape()}>
              <div class="prop-group">
                <h4>图元属性</h4>
                <div class="field"><label>名称</label>
                  <input value={activeShape().name}
                    onInput={(e) => { store.snapshot(); store.mutateSelectedShapes((s) => { if (s.id === activeShape().id) s.name = e.currentTarget.value; }); }} />
                </div>
                <div class="field"><label>花材编号</label>
                  <input value={activeShape().materialCode || ''} placeholder="如 LF-012 / PT-007"
                    onInput={(e) => { store.snapshot(); store.mutateSelectedShapes((s) => { if (s.id === activeShape().id) s.materialCode = e.currentTarget.value; }); }} />
                </div>
                <div class="field">
                  <label>颜色</label>
                  <div class="swatch-row">
                    <input type="color" value={activeShape().fill}
                      onInput={(e) => store.mutateSelectedShapes((s) => { s.fill = e.currentTarget.value; })} />
                    <input type="color" value={activeShape().stroke} title="描边色"
                      onInput={(e) => store.mutateSelectedShapes((s) => { s.stroke = e.currentTarget.value; })} />
                    <span class="muted" style={{ 'font-size': '11px' }}>填充 / 描边</span>
                  </div>
                </div>
                <div class="field">
                  <label>尺寸(mm,自动测量)</label>
                  <div class="two">
                    <div><input value={shapeBounds(activeShape()).width.toFixed(1)} disabled /></div>
                    <div><input value={shapeBounds(activeShape()).height.toFixed(1)} disabled /></div>
                  </div>
                </div>
                <div class="field">
                  <label>图层归属</label>
                  <select value={activeShape().parentId || ''}
                    onChange={(e) => store.moveToLayer([activeShape().id], e.currentTarget.value)}>
                    <For each={doc().layers}>{(l) => <option value={l.id}>{l.name}</option>}</For>
                  </select>
                </div>
                <div class="row" style={{ 'margin-top': '4px' }}>
                  <button onClick={() => store.bringForward(selIds())} disabled={!selIds().length}>上移一层</button>
                  <button onClick={() => store.sendBackward(selIds())} disabled={!selIds().length}>下移一层</button>
                  <button class="danger" onClick={() => lockShape(activeShape().id)}>{activeShape().locked ? '解锁' : '锁定'}</button>
                </div>
              </div>

              <Show when={store.state.tool === TOOLS.NODE && activeNode() !== null}>
                <div class="prop-group">
                  <h4>节点 #{activeNode() + 1}(共 {activeShape().points.length} 个)</h4>
                  <div class="row">
                    <button onClick={() => store.setNodeSegment(activeShape().id, activeNode(), true)}>转曲线段</button>
                    <button onClick={() => store.setNodeSegment(activeShape().id, activeNode(), false)}>转直线段</button>
                  </div>
                  <button class="danger" style={{ width: '100%', 'margin-top': '6px' }}
                    disabled={activeShape().points.length <= 3}
                    onClick={() => store.deleteNodeAt(activeShape().id, activeNode())}>删除该节点</button>
                  <div class="muted" style={{ 'font-size': '11px', 'margin-top': '6px' }}>
                    节点工具下点击任意曲线段可在该位置插入节点;拖橙色方块调贝塞尔手柄。
                  </div>
                </div>
              </Show>
            </Show>

            <div class="prop-group">
              <h4>画布与吸附(单位 mm)</h4>
              <label class="checkline"><input type="checkbox" checked={doc().settings.snap}
                onChange={(e) => store.updateSettings({ snap: e.currentTarget.checked })} />对象边距/中心对齐吸附 + 移动参考线</label>
              <label class="checkline" style={{ 'margin-top': '6px' }}><input type="checkbox" checked={doc().settings.showGrid}
                onChange={(e) => store.updateSettings({ showGrid: e.currentTarget.checked })} />显示网格</label>
              <label class="checkline" style={{ 'margin-top': '6px' }}><input type="checkbox" checked={doc().settings.showLabels}
                onChange={(e) => store.updateSettings({ showLabels: e.currentTarget.checked })} />画布标注花材编号与尺寸</label>
              <div class="two" style={{ display: 'flex', gap: '8px', 'margin-top': '8px' }}>
                <div class="field" style={{ flex: 1 }}><label>画布宽</label>
                  <input type="number" value={doc().settings.canvasW}
                    onInput={(e) => store.updateSettings({ canvasW: +e.currentTarget.value || 100 })} /></div>
                <div class="field" style={{ flex: 1 }}><label>画布高</label>
                  <input type="number" value={doc().settings.canvasH}
                    onInput={(e) => store.updateSettings({ canvasH: +e.currentTarget.value || 100 })} /></div>
              </div>
            </div>

            <div class="prop-group">
              <h4>版本差异叠加</h4>
              <Show when={project().versions.length}
                fallback={<div class="muted" style={{ 'font-size': '11.5px' }}>提交第一个版本后即可两版叠加看差异</div>}>
                <select class="diff-select" value={store.state.diffVersionId || ''}
                  onChange={(e) => store.setDiffVersion(e.currentTarget.value || null)}>
                  <option value="">不对比</option>
                  <For each={project().versions}>{(v) => <option value={v.id}>{v.label} · {fmtDay(v.createdAt)}</option>}</For>
                </select>
              </Show>
            </div>
          </div>
        </div>
      </div>

      {/* 提交版本弹窗 */}
      <Show when={showSubmit()}>
        <div class="modal-mask" onClick={(e) => e.target === e.currentTarget && setShowSubmit(false)}>
          <div class="modal">
            <h3>提交新版本</h3>
            <div class="muted" style={{ 'font-size': '12px' }}>
              每次提交生成不可变新版本;上一版未清零的批注会自动带入新版继续跟踪。
            </div>
            <div class="field"><label>版本标签</label>
              <input placeholder={`默认 v${project().versions.length + 1}`} value={vForm().label}
                onInput={(e) => setVForm({ ...vForm(), label: e.currentTarget.value })} /></div>
            <div class="field"><label>版本说明(本版改动)</label>
              <textarea placeholder="如:花瓣收窄 8mm,叶片去重边" value={vForm().note}
                onInput={(e) => setVForm({ ...vForm(), note: e.currentTarget.value })} /></div>
            <div class="foot">
              <button onClick={() => setShowSubmit(false)}>取消</button>
              <button class="primary" onClick={submit}>确认提交</button>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}
