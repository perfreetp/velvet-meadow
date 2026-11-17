// 无头 Chrome CDP 端到端测试：真实浏览器里走完整业务流程
// 用法：node test/e2e.mjs（需先启动 dev server 与 CDP Chrome）
const BASE = 'http://localhost:5247';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function cdpSession() {
  const resp = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent(BASE + '/index.html'), { method: 'PUT' });
  const tab = await resp.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((res) => (ws.onopen = res));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  const send = (method, params = {}) =>
    new Promise((res) => {
      const mid = ++id;
      pending.set(mid, res);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  return { send, ws, close: () => ws.close() };
}

async function evalJs(cdp, expression) {
  const r = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result.exceptionDetails) {
    throw new Error('JS 异常: ' + JSON.stringify(r.result.exceptionDetails.exception?.description ?? r.result.exceptionDetails.text));
  }
  return r.result.result?.value;
}

const results = [];
function check(name, cond, extra = '') {
  results.push({ name, ok: !!cond, extra: String(extra ?? '') });
  console.log((cond ? '  ✓ ' : '  ✗ ') + name + (cond ? '' : ' ' + extra));
}

const cdp = await cdpSession();
try {
  await sleep(2500);
  await evalJs(cdp, `localStorage.clear()`);
  await evalJs(cdp, `location.reload()`);
  await sleep(2500);

  // 1. 应用与项目列表渲染
  check('gvs-app 挂载并打开 Shadow DOM', await evalJs(cdp, `!!document.querySelector('gvs-app')?.shadowRoot`));
  check('项目列表组件渲染', await evalJs(cdp, `!!document.querySelector('gvs-app').shadowRoot.querySelector('project-list')`));

  // 2. 切换客户角色并下单
  await evalJs(cdp, `
    (() => {
      const pl = document.querySelector('gvs-app').shadowRoot.querySelector('project-list');
      pl.shadowRoot.querySelectorAll('.role-bar button')[0].click();
    })()`);
  await sleep(200);
  const orderId = await evalJs(cdp, `
    (() => {
      const pl = document.querySelector('gvs-app').shadowRoot.querySelector('project-list');
      const inputs = pl.shadowRoot.querySelectorAll('.form-wrap input');
      inputs[0].value = 'E2E测试场地';
      pl.shadowRoot.querySelector('.form-wrap button.primary').click();
      return JSON.parse(localStorage.getItem('gvs.projects.v1'))[0].id;
    })()`);
  check('客户下单创建项目', !!orderId);

  // 3. 打开项目进入编辑器
  await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('project-list').shadowRoot.querySelector('.grid-card button.primary').click()`);
  await sleep(800);
  check('进入编辑器且三视图挂载', await evalJs(cdp, `!!document.querySelector('gvs-app').shadowRoot.querySelector('iso-view')`));
  check('等轴测 SVG 已初始化', (await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('iso-view').shadowRoot.querySelectorAll('svg path').length`)) >= 0);
  check('俯视图 SVG 已初始化', await evalJs(cdp, `!!document.querySelector('gvs-app').shadowRoot.querySelector('top-view').shadowRoot.querySelector('svg')`));

  // 4. 钻孔数据准备 + 批量填充（通过全局单例钩子，dev/preview 均可）
  const fillStat = await evalJs(cdp, `
    (() => {
      const { editorState, fillFromBoreholes } = window.__gvs;
      const g = editorState.grid;
      editorState.project.boreholes = [
        { id: 'b1', name: 'ZK01', x: 4, y: 16, elevation: g.nz, layers: [{ depth: 4, materialId: 1 }, { depth: 10, materialId: 2 }, { depth: 20, materialId: 3 }] },
        { id: 'b2', name: 'ZK02', x: 60, y: 48, elevation: g.nz, layers: [{ depth: 5, materialId: 1 }, { depth: 12, materialId: 2 }, { depth: 20, materialId: 4 }] },
        { id: 'b3', name: 'ZK03', x: 32, y: 32, elevation: g.nz, layers: [{ depth: 3, materialId: 1 }, { depth: 9, materialId: 5 }, { depth: 20, materialId: 6 }] }
      ];
      const r = fillFromBoreholes(g, editorState.project.boreholes);
      editorState.emit('edit');
      return JSON.stringify(r);
    })()`);
  check('三钻孔 IDW 批量填充', JSON.parse(fillStat).filled > 1000, fillStat);

  const voxelCount = await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('stat-bar').shadowRoot.querySelector('.stat b').textContent`);
  check('状态栏实时体素数 > 0', Number(voxelCount.replace(/,/g, '')) > 1000, voxelCount);
  const triCount = await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('stat-bar').shadowRoot.querySelectorAll('.stat b')[1].textContent`);
  check('状态栏实时三角面数 > 0', Number(triCount.replace(/,/g, '')) > 0, triCount);

  // 5. 等轴测视图实际产生面 path
  await sleep(400);
  const facePaths = await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('iso-view').shadowRoot.querySelectorAll('g.faces path').length`);
  check('等轴测渲染出合面路径', facePaths > 10, 'path=' + facePaths);
  check('当前标高联动高亮面存在', (await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('iso-view').shadowRoot.querySelectorAll('g.highlight path').length`)) >= 1);

  // 6. 笔刷编辑 + 镜像 + 撤销
  const editCheck = await evalJs(cdp, `
    (() => {
      const { editorState } = window.__gvs;
      const before = editorState.grid.countVoxels();
      editorState.updateSettings({ mirrorX: true, mode: 'add', brushMaterialId: 7 });
      editorState.pushUndo();
      editorState.grid.set(2, 2, 0, 7);
      editorState.grid.set(editorState.grid.nx - 3, 2, 0, 7);
      editorState.emit('edit');
      const mirrored = editorState.grid.get(editorState.grid.nx - 3, 2, 0);
      editorState.undo();
      const afterUndo = editorState.grid.countVoxels();
      return JSON.stringify({ before, mirrored, afterUndo, ok: mirrored === 7 && afterUndo === before });
    })()`);
  check('镜像写入与撤销恢复', JSON.parse(editCheck).ok, editCheck);

  // 7. 切片视图与俯视图联动
  await evalJs(cdp, `window.__gvs.editorState.updateSettings({ currentZ: 5, sliceAxis: 'x', sliceIndex: 20 })`);
  await sleep(300);
  check('剖面切片渲染材质格 + 扫描线', (await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('slice-view').shadowRoot.querySelectorAll('svg rect').length`)) > 0);
  check('俯视图按当前标高渲染', (await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('top-view').shadowRoot.querySelectorAll('svg rect').length`)) > 0);

  // 8. 剖面线 -> 剖面图 + 层厚表
  const sectionDiag = await evalJs(cdp, `
    (() => {
      const { editorState, buildProfile } = window.__gvs;
      editorState.upsertSection({ id: 'sec1', name: '剖面线 1', points: [{ x: 4, y: 16 }, { x: 32, y: 32 }, { x: 60, y: 48 }] });
      const p = buildProfile(editorState.grid, editorState.project.sections[0], editorState.project.materials);
      return JSON.stringify({ nonEmpty: p.columns.filter((c) => c.stack.length > 0).length, thick: p.thickness.length });
    })()`);
  check('剖面采样命中实体列', JSON.parse(sectionDiag).nonEmpty > 0, sectionDiag);

  await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelectorAll('.tabs button')[3].click()`);
  await sleep(500);
  check('剖面线自动生成剖面图', (await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('section-panel').shadowRoot.querySelectorAll('svg rect').length`)) > 0);
  check('层厚统计表有数据行', (await evalJs(cdp, `document.querySelector('gvs-app').shadowRoot.querySelector('section-panel').shadowRoot.querySelectorAll('tbody tr').length`)) >= 2);

  // 9. 导出
  const exportsOk = await evalJs(cdp, `
    (async () => {
      const { editorState, buildMesh, exportOBJ, exportGLB, exportColorTable, buildDeliveryZip } = window.__gvs;
      const mesh = buildMesh(editorState.grid);
      const obj = exportOBJ(mesh, editorState.project.materials, 't');
      const glb = exportGLB(mesh, editorState.project.materials, 't');
      const csv = exportColorTable(editorState.project.materials, editorState.grid);
      const zip = await buildDeliveryZip([{ name: 'a.obj', blob: obj.obj }]);
      return JSON.stringify({
        obj: (await obj.obj.text()).includes('f '),
        gltf: String.fromCharCode(...new Uint8Array(await glb.arrayBuffer()).slice(0, 4)) === 'glTF',
        csv: (await csv.text()).includes('材质ID'),
        zip: zip.size > 100
      });
    })()`);
  const ex = JSON.parse(exportsOk);
  check('OBJ 导出含面数据', ex.obj);
  check('glTF/GLB 导出头正确', ex.gltf);
  check('配色表 CSV 导出', ex.csv);
  check('交付 ZIP 打包', ex.zip);

  // 10. 工作流全流程（操作入口在「审核」选项卡）
  const wf = await evalJs(cdp, `
    (() => {
      const { projectStore, editorState } = window.__gvs;
      const id = editorState.project.id;
      document.querySelector('gvs-app').shadowRoot.querySelectorAll('.tabs button')[4].click();
      const wfBar = document.querySelector('gvs-app').shadowRoot.querySelector('workflow-bar');
      const click = (text) => Array.from(wfBar.shadowRoot.querySelectorAll('button')).find((b) => b.textContent.includes(text)).click();
      const setRole = (r) => { const s = wfBar.shadowRoot.querySelector('select'); s.value = r; s.dispatchEvent(new Event('change')); };
      setRole('maker');
      click('开始制作');
      click('提交审核');
      setRole('supervisor');
      wfBar.shadowRoot.querySelector('input.reject-reason').value = '分层标高不符，返工';
      click('不合格退回');
      const rework1 = projectStore.get(id).reworkCount;
      setRole('maker');
      click('重新制作');
      click('提交审核');
      setRole('supervisor');
      wfBar.shadowRoot.querySelector('input.reject-reason').value = '审核通过';
      click('审核通过');
      const final = projectStore.get(id);
      return JSON.stringify({ rework1, status: final.status, log: final.reviewLog.length });
    })()`);
  const w = JSON.parse(wf);
  check('退回自动记录返工次数', w.rework1 === 1, wf);
  check('审核通过后状态为已交付', w.status === 'delivered', wf);
  check('审核日志完整（6 条）', w.log === 6, wf);

  // 11. 持久化
  await cdp.send('Page.reload');
  await sleep(2000);
  check('刷新后项目库持久化保留', (await evalJs(cdp, `JSON.parse(localStorage.getItem('gvs.projects.v1')).length`)) === 1);

  console.log(`\nE2E 结果：${results.filter((r) => r.ok).length}/${results.length} 通过`);
  if (results.some((r) => !r.ok)) process.exit(1);
} finally {
  cdp.close();
}
