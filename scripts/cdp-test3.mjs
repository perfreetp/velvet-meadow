// 第三轮：用缩放按钮（不依赖滚轮）验证类别过滤 + 点选穿透优先级 + 高亮保持
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9335;
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
  await cdp('Page.navigate', { url: 'http://localhost:5217/' });
  await sleep(3000);

  // 点放大按钮 9 次到近景级
  for (let i = 0; i < 9; i++) { await ev(`document.querySelector('.zoom-ctrl button').click()`); await sleep(120); }
  await sleep(500);
  console.log('放大后:', JSON.stringify(await ev(`document.querySelector('.lod-badge').innerText`)).replace(/\\n/g, ' | '));

  // 只过滤消火栓
  await ev(`(() => {
    const sel = document.querySelector('.filter-row select');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;
    setter.call(sel, 'hydrant'); sel.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await sleep(500);
  const afterFilter = await ev(`document.querySelector('.lod-badge').innerText`);
  console.log('过滤消火栓:', JSON.stringify(afterFilter).replace(/\\n/g, ' | '));
  const hydrantTotal = 274;
  console.log('应只显消火栓，总数应为', hydrantTotal);

  // 恢复全部
  await ev(`(() => {
    const sel = document.querySelector('.filter-row select');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype,'value').set;
    setter.call(sel, 'all'); sel.dispatchEvent(new Event('change',{bubbles:true}));
  })()`);
  await sleep(400);

  // 点选穿透：在一个位置模拟，读详情类别（应为高优先级类别）
  await cdp('Input.dispatchMouseEvent', { type: 'mousePressed', x: 800, y: 450, button: 'left', clickCount: 1 });
  await cdp('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 800, y: 450, button: 'left', clickCount: 1 });
  await sleep(400);
  console.log('点选穿透详情:', JSON.stringify(await ev(`document.querySelector('.sidebar.right .kv')?.innerText || 'NONE'`)).slice(0, 120));

  // 关闭该要素所属图层，验证高亮 id 仍保留（侧栏详情不丢）
  const beforeId = await ev(`document.querySelector('.kv .k') ? 'has-detail' : 'none'`);
  console.log('关图层前详情:', beforeId);
  await ev(`document.querySelectorAll('.layer-row .switch')[4].click()`); // 关消防
  await sleep(400);
  console.log('关消防后详情仍在:', await ev(`document.querySelector('.sidebar.right .kv') ? 'KEPT' : 'LOST'`));

  // 重新打开，高亮仍应存在（halo 恢复）
  await ev(`document.querySelectorAll('.layer-row .switch')[4].click()`);
  await sleep(400);
  console.log('重开后高亮集合大小:', await ev(`(window.__none, document.querySelectorAll('.marker-label').length)`));

  ws.close();
} catch (e) {
  console.error('失败:', e);
} finally {
  chrome.kill();
}
