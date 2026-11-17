// 截图脚本：建项目->填充->截图三视图，输出到 test/shots/
import { mkdirSync, writeFileSync } from 'node:fs';

const resp = await fetch('http://127.0.0.1:9222/json/new?' + encodeURIComponent('http://localhost:5247/index.html'), { method: 'PUT' });
const tab = await resp.json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
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
await new Promise((r) => setTimeout(r, 2000));
await send('Runtime.evaluate', { expression: 'localStorage.clear()' });
await send('Page.reload');
await new Promise((r) => setTimeout(r, 2200));

// 下单并进入编辑器
await send('Runtime.evaluate', {
  expression: `
    (async () => {
      const pl = document.querySelector('gvs-app').shadowRoot.querySelector('project-list');
      pl.shadowRoot.querySelectorAll('.role-bar button')[0].click();
      await new Promise(r => setTimeout(r, 100));
      pl.shadowRoot.querySelector('.form-wrap button.primary').click();
      await new Promise(r => setTimeout(r, 200));
      pl.shadowRoot.querySelector('.grid-card button.primary').click();
      await new Promise(r => setTimeout(r, 800));
      const { editorState, fillFromBoreholes } = window.__gvs;
      const g = editorState.grid;
      editorState.project.boreholes = [
        { id: 'b1', name: 'ZK01', x: 6, y: 10, elevation: g.nz, layers: [{ depth: 4, materialId: 1 }, { depth: 10, materialId: 2 }, { depth: 20, materialId: 3 }, { depth: 28, materialId: 6 }] },
        { id: 'b2', name: 'ZK02', x: 56, y: 14, elevation: g.nz, layers: [{ depth: 5, materialId: 1 }, { depth: 12, materialId: 2 }, { depth: 22, materialId: 5 }, { depth: 28, materialId: 6 }] },
        { id: 'b3', name: 'ZK03', x: 30, y: 48, elevation: g.nz, layers: [{ depth: 3, materialId: 1 }, { depth: 9, materialId: 4 }, { depth: 18, materialId: 5 }, { depth: 28, materialId: 7 }] },
        { id: 'b4', name: 'ZK04', x: 50, y: 52, elevation: g.nz, layers: [{ depth: 6, materialId: 2 }, { depth: 14, materialId: 4 }, { depth: 24, materialId: 6 }, { depth: 28, materialId: 7 }] }
      ];
      fillFromBoreholes(g, editorState.project.boreholes);
      editorState.upsertSection({ id: 'sec1', name: '剖面线 1', points: [{ x: 6, y: 10 }, { x: 30, y: 48 }, { x: 56, y: 14 }] });
      editorState.updateSettings({ currentZ: 3, sliceIndex: 24 });
      editorState.emit('edit');
      await new Promise(r => setTimeout(r, 600));
    })()`,
  awaitPromise: true
});
await new Promise((r) => setTimeout(r, 800));

// 设置较大视口
await send('Emulation.setDeviceMetricsOverride', { width: 1600, height: 1000, deviceScaleFactor: 1, mobile: false });
await new Promise((r) => setTimeout(r, 600));

mkdirSync('test/shots', { recursive: true });
const shot = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('test/shots/editor.png', Buffer.from(shot.result.data, 'base64'));
console.log('已保存 test/shots/editor.png');

// 切到剖面选项卡截图
await send('Runtime.evaluate', {
  expression: `document.querySelector('gvs-app').shadowRoot.querySelectorAll('.tabs button')[3].click()`
});
await new Promise((r) => setTimeout(r, 700));
const shot2 = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('test/shots/section.png', Buffer.from(shot2.result.data, 'base64'));
console.log('已保存 test/shots/section.png');

// 切到审核选项卡
await send('Runtime.evaluate', {
  expression: `document.querySelector('gvs-app').shadowRoot.querySelectorAll('.tabs button')[4].click()`
});
await new Promise((r) => setTimeout(r, 400));
const shot3 = await send('Page.captureScreenshot', { format: 'png' });
writeFileSync('test/shots/workflow.png', Buffer.from(shot3.result.data, 'base64'));
console.log('已保存 test/shots/workflow.png');

ws.close();
process.exit(0);
