// 通过 CDP 驱动无头 Chrome：缩放到近景级、点选、切图层，截图并回读控制台
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9333;
const URL = 'http://localhost:5217/';

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu', '--no-sandbox',
  '--window-size=1600,900', 'about:blank',
]);

const get = async (path) => (await fetch(`http://localhost:${PORT}${path}`)).json();

try {
  // 等调试端口
  let targets;
  for (let i = 0; i < 40; i++) {
    try { targets = await get('/json'); break; } catch { await sleep(250); }
  }
  const page = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let mid = 1;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg.result);
      pending.delete(msg.id);
    }
  });
  const cdp = (method, params = {}) =>
    new Promise((res) => {
      const id = mid++;
      pending.set(id, res);
      ws.send(JSON.stringify({ id, method, params }));
    });
  const evalJs = async (expr) => {
    const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) {
      return { __error: r.exceptionDetails.exception?.description || r.exceptionDetails.text };
    }
    return r.result.value;
  };
  await cdp('Page.enable');
  await cdp('Page.navigate', { url: URL });
  await sleep(3500);

  // 1. 读取初始 LOD 与点位可见性
  const lod0 = await evalJs(`document.querySelector('.lod-badge').innerText`);
  console.log('初始 LOD:', JSON.stringify(lod0));

  // 2. 缩放：在画布中心滚轮放大，先停在街区级观察点群
  for (let i = 0; i < 4; i++) {
    await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 800, y: 450, deltaY: -400, deltaX: 0 });
    await sleep(180);
  }
  await sleep(700);
  const lodMid = await evalJs(`document.querySelector('.lod-badge').innerText`);
  console.log('街区级 LOD:', JSON.stringify(lodMid));
  const shotMid = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync('/tmp/street-level.png', Buffer.from(shotMid.data, 'base64'));

  // 再放大到近景级
  for (let i = 0; i < 4; i++) {
    await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 800, y: 450, deltaY: -400, deltaX: 0 });
    await sleep(150);
  }
  await sleep(700);
  const lod1 = await evalJs(`document.querySelector('.lod-badge').innerText`);
  console.log('放大后 LOD:', JSON.stringify(lod1));

  // 3. 截图：近景级应出现消火栓/摄像头等小点
  const shot1 = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync('/tmp/zoom-in.png', Buffer.from(shot1.data, 'base64'));

  // 4. 点选中心要素，检查详情面板出现编号
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 800, y: 450, button: 'left', clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 800, y: 450, button: 'left', clickCount: 1, buttons: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 800, y: 450, button: 'left', clickCount: 1 });
  await sleep(600);
  const detail = await evalJs(`document.querySelector('.sidebar.right .kv')?.innerText || 'NO-DETAIL'`);
  console.log('点选详情:', JSON.stringify(detail).slice(0, 200));
  const shot2 = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync('/tmp/picked.png', Buffer.from(shot2.data, 'base64'));

  // 5. 关闭消防图层，确认计数变化且高亮不丢（若选中的是消防点）
  const switches = await evalJs(`[...document.querySelectorAll('.layer-row .switch')].map(s=>s.className)`);
  console.log('图层开关状态数:', switches.length);
  await evalJs(`document.querySelectorAll('.layer-row .switch')[4].click()`); // 消防设施
  await sleep(400);
  const lod2 = await evalJs(`document.querySelector('.lod-badge').innerText`);
  console.log('关消防后 LOD:', JSON.stringify(lod2));

  // 6. 框选：切到框选工具并拖拽（回到街区级，要素更密集）
  for (let i = 0; i < 4; i++) {
    await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 800, y: 450, deltaY: 400, deltaX: 0 });
    await sleep(120);
  }
  await sleep(500);
  await evalJs(`[...document.querySelectorAll('.tool-grid button')].find(b=>b.textContent==='框选').click()`);
  await sleep(200);
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 600, y: 300, button: 'left', clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 1000, y: 600, button: 'left', buttons: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 1000, y: 600, button: 'left', clickCount: 1 });
  await sleep(500);
  const boxInfo = await evalJs(`[...document.querySelectorAll('button')].map(b=>b.textContent).find(t=>t.includes('取消框选')) || 'NO-BOX'`);
  console.log('框选结果:', JSON.stringify(boxInfo));
  const shot3 = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync('/tmp/boxselect.png', Buffer.from(shot3.data, 'base64'));

  // 7. 工单全流程：建单->分派->提交->质检不合格退回->合格
  await evalJs(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('要素详情')).click()`);
  // 直接通过 store 模块验证流转（DOM 路径较深，用模块单例更可靠）
  const flow = await evalJs(`(async () => {
    const s = await import('/src/store.ts');
    const wo = s.createOrder({title:'测试消火栓漏水', category:'hydrant', featureId:'P-1', featureCode:'XFH0001', content:'CDP自动化测试'});
    s.dispatchOrder(wo.id, '张师傅');
    s.submitOrder(wo.id, '已更换密封件');
    s.qaReturn(wo.id, '压力测试不达标');
    const afterReturn = s.orders.find(o=>o.id===wo.id);
    const ret = { status: afterReturn.status, rework: afterReturn.reworkCount, note: afterReturn.qaNote };
    s.submitOrder(wo.id, '重新维修并复测合格');
    s.qaPass(wo.id);
    const done = s.orders.find(o=>o.id===wo.id);
    return JSON.stringify({afterReturn: ret, finalStatus: done.status, stats: s.workerStats().find(x=>x.worker==='张师傅')});
  })()`);
  console.log('工单流转:', flow);

  console.log('截图已写入 /tmp/zoom-in.png /tmp/picked.png /tmp/boxselect.png');
  ws.close();
} catch (e) {
  console.error('CDP 测试失败:', e);
} finally {
  chrome.kill();
}
