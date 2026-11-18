// 公众公示标点批注：CDP 拦截 prompt 弹窗，验证画布点击→批注落库→渲染
const BASE = 'http://localhost:5174';
const CDP = 'http://localhost:9222';

// 先通过 API 确保存在一个已公示方案
const roleHeaders = (r) => ({ 'content-type': 'application/json', 'x-role': r });
let plan = await (await fetch(`${BASE}/api/plans`, { headers: roleHeaders('planner') })).json()
  .then((l) => l.find((p) => p.status === 'published'));
if (!plan) {
  const created = await (await fetch(`${BASE}/api/plans`, {
    method: 'POST', headers: roleHeaders('planner'),
    body: JSON.stringify({
      name: '批注验证方案', district: '测试街区',
      scene: { buildings: [], lights: [], bounds: { minX: 0, minY: 0, maxX: 40, maxY: 30 } },
    }),
  })).json();
  const pid = created.id;
  await fetch(`${BASE}/api/plans/${pid}/transition`, { method: 'POST', headers: roleHeaders('planner'), body: JSON.stringify({ to: 'submitted' }) });
  await fetch(`${BASE}/api/plans/${pid}/reviews`, { method: 'POST', headers: roleHeaders('reviewer'), body: JSON.stringify({ outcome: 'approve', comment: 'ok', reviewer: '测试' }) });
  plan = await (await fetch(`${BASE}/api/plans/${pid}/transition`, { method: 'POST', headers: roleHeaders('reviewer'), body: JSON.stringify({ to: 'published' }) })).json();
}
console.log('公示方案:', plan.id, plan.status);

const res = await fetch(`${CDP}/json/new?${encodeURIComponent(BASE)}`, { method: 'PUT' });
const tab = await res.json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
const errors = [];
let dialogHandled = false;
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
  // 自动响应 prompt 弹窗
  if (m.method === 'Page.javascriptDialogOpening') {
    dialogHandled = true;
    send('Page.handleJavaScriptDialog', { accept: true, promptText: '建议此处保留暖黄庭院灯' });
  }
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable'); await send('Page.enable');
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ok = (n, c, x = '') => console.log(`${c ? '✔' : '✖'} ${n} ${x}`);

await sleep(3500);
// 切公众角色，打开公示方案
await ev(`[...document.querySelectorAll('.role-btn')].find(b=>b.innerText.includes('公众')).click()`);
await sleep(200);
await ev(`[...document.querySelectorAll('.tab-btn')].find(b=>b.innerText.includes('方案后台')).click()`);
await sleep(400);
await ev(`[...document.querySelectorAll('.plan-row')].find(r=>r.innerText.includes('${plan.id}')||true)?.querySelector('.plan-main').click()`);
await sleep(800);

// 进入批注模式并在画布点击（locked 提示与批注入口都在审查/公示页）
await ev(`[...document.querySelectorAll('.tab-btn')].find(b=>b.innerText.includes('审查/公示')).click()`);
await sleep(400);
const readOnly = await ev(`document.querySelector('.hint.locked')?.innerText || ''`);
ok('公众打开公示方案为只读', readOnly.includes('只读'), readOnly);
const entered = await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('在画布上标点批注'));if(b){b.click();return 'OK'}return 'MISSING'})()`);
ok('进入标点批注模式', entered === 'OK');
const rect = await ev(`(()=>{const r=document.querySelector('canvas.pixi-canvas').getBoundingClientRect();return {x:r.x+r.width*0.4,y:r.y+r.height*0.45}})()`);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: rect.x, y: rect.y, button: 'left', clickCount: 1 });
await sleep(1500);
ok('prompt 弹窗被 CDP 自动应答', dialogHandled);

// 后端核验批注落库
const notes = await (await fetch(`${BASE}/api/plans/${plan.id}/annotations`)).json();
const found = notes.some((a) => a.text === '建议此处保留暖黄庭院灯' && a.author === '公众');
ok('批注已落库且署名公众', found, `共 ${notes.length} 条`);

// 画布上渲染出批注点
await sleep(800);
const annoRendered = await ev(`document.querySelectorAll('.anno-item').length`);
ok('批注显示在公示面板', annoRendered >= 1, `count=${annoRendered}`);
ok('全程无异常', errors.length === 0, errors.join('|'));

ws.close();
await fetch(`${CDP}/json/close/${tab.id}`);
process.exit(found && dialogHandled ? 0 : 1);
