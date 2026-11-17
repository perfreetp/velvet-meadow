// 第二轮验证：悬停气泡、测距、临时标记、书签、类别过滤、看板
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9334;
const URL = 'http://localhost:5217/';
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, '--disable-gpu', '--no-sandbox', '--window-size=1600,900', 'about:blank']);
const get = async (p) => (await fetch(`http://localhost:${PORT}${p}`)).json();

try {
  let targets;
  for (let i = 0; i < 40; i++) { try { targets = await get('/json'); break; } catch { await sleep(250); } }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let mid = 1;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  });
  const cdp = (method, params = {}) => new Promise((res) => { const id = mid++; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const ev = async (expr) => {
    const r = await cdp('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    return r.exceptionDetails ? { __error: r.exceptionDetails.exception?.description || r.exceptionDetails.text } : r.result.value;
  };
  await cdp('Page.enable');
  await cdp('Page.navigate', { url: URL });
  await sleep(3000);

  // 放大到街区级
  for (let i = 0; i < 4; i++) { await cdp('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 800, y: 450, deltaY: -400 }); await sleep(150); }
  await sleep(500);

  // 1. 悬停气泡：移动到点密集区，检查 tooltip 出现
  await cdp('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 700, y: 400 });
  await sleep(400);
  const tip = await ev(`document.querySelector('.tooltip')?.innerText || 'NO-TIP'`);
  console.log('悬停气泡:', JSON.stringify(tip).slice(0, 160));

  // 2. 测距：切工具，点击三个点，双击结束
  await ev(`[...document.querySelectorAll('.tool-grid button')].find(b=>b.textContent==='测距').click()`);
  const click = async (x, y) => {
    await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(150);
  };
  await click(500, 350); await click(700, 350); await click(700, 550);
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 700, y: 550, button: 'left', clickCount: 2 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 700, y: 550, button: 'left', clickCount: 2 });
  await sleep(400);
  const measure = await ev(`document.querySelector('.measure-total')?.innerText || 'NO-MEASURE'`);
  console.log('测距:', JSON.stringify(measure));

  // 3. 临时标记
  await ev(`[...document.querySelectorAll('.tool-grid button')].find(b=>b.textContent==='标记').click()`);
  await click(900, 500); await click(950, 520);
  await sleep(300);
  const marks = await ev(`document.querySelectorAll('.mark-row').length`);
  const markers = await ev(`document.querySelectorAll('.marker-label').length`);
  console.log('临时标记 行数/地图标签:', marks, '/', markers);

  // 4. 书签：存当前视角
  await ev(`document.querySelector('.bookmark-row input, .card input').value='北区测试视角'`);
  await ev(`(() => {
    const inp = [...document.querySelectorAll('.card input')].find(i=>i.placeholder && i.placeholder.includes('视角'));
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;
    setter.call(inp, '北区测试视角'); inp.dispatchEvent(new Event('input',{bubbles:true}));
  })()`);
  await ev(`[...document.querySelectorAll('button')].find(b=>b.textContent==='存当前').click()`);
  await sleep(300);
  const bm = await ev(`[...document.querySelectorAll('.bookmark-row .nm')].map(n=>n.textContent)`);
  const bmStored = await ev(`localStorage.getItem('campus-bookmarks-v1')?.length || 0`);
  console.log('书签:', JSON.stringify(bm), 'localStorage 字节:', bmStored);

  // 5. 类别过滤：只看消火栓
  await ev(`(() => {
    const sel = document.querySelector('.filter-row select');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;
    setter.call(sel, 'hydrant'); sel.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await sleep(400);
  const filterBadge = await ev(`document.querySelector('.lod-badge').innerText`);
  console.log('过滤消火栓后:', JSON.stringify(filterBadge).replace(/\\n/g, ' | '));

  // 6. 看板数据
  await ev(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent==='看板').click()`);
  await sleep(300);
  const dash = await ev(`document.querySelector('table.dash')?.innerText || 'NO-DASH'`);
  console.log('看板:', JSON.stringify(dash).slice(0, 200));

  const shot = await cdp('Page.captureScreenshot', { format: 'png' });
  writeFileSync('/tmp/round2.png', Buffer.from(shot.data, 'base64'));
  ws.close();
} catch (e) {
  console.error('失败:', e);
} finally {
  chrome.kill();
}
