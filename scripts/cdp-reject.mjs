// 退回流程验证：新建第二版 → 提交 → 组长退回（带意见）→ 意见挂在版本上
const CDP = 'http://127.0.0.1:9222';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const list = await (await fetch(`${CDP}/json`)).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0; const pending = new Map(); const logs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') logs.push('EX: ' + JSON.stringify(m.params.exceptionDetails.text));
};
const send = (method, params = {}) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

// 重新打开在制项目（上一轮结束后回到了项目库，可能停在归档检索标签）
await send('Page.enable');
await ev(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('在制项目'))?.click()`);
await sleep(500);
const hasCard = await ev(`!![...document.querySelectorAll('.card button')].find(b=>b.textContent.includes('打开'))`);
if (!hasCard) {
  console.log('未找到在制项目，先跑 cdp-smoke 建档'); process.exit(1);
}
await ev(`[...document.querySelectorAll('.card button')].find(b=>b.textContent.includes('打开'))?.click()`);
await sleep(2000);

// 打开版本面板（当前已有 V1 approved）
await ev(`[...document.querySelectorAll('.topbar button')].find(b=>b.textContent.includes('版本/审批'))?.click()`);
await sleep(600);

// 回切片，再涂几笔存 V2
await ev(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('切片'))?.click()`);
await sleep(300);
await ev(`(function(){
  const c=document.querySelector('.canvas-wrap canvas'); const r=c.getBoundingClientRect();
  function pe(type,x,y){c.dispatchEvent(new PointerEvent(type,{bubbles:true,clientX:r.left+x,clientY:r.top+y,pointerId:2,button:0}));}
  pe('pointerdown',260,120); pe('pointermove',280,140); pe('pointermove',300,160); pe('pointerup',300,160);
})()`);
await sleep(400);
await ev(`[...document.querySelectorAll('.topbar button')].find(b=>b.textContent.includes('存版本'))?.click()`);
await sleep(700);
await ev(`[...document.querySelectorAll('.topbar button')].find(b=>b.textContent.includes('版本/审批'))?.click()`);
await sleep(500);
console.log('版本标签:', await ev(`[...document.querySelectorAll('.vers .tag')].map(t=>t.textContent).join(',')`));

// 工艺员提交 V2（最新一版）
await ev(`(function(){const s=document.querySelector('.topbar select'); s.value='technician'; s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
await sleep(200);
await ev(`[...document.querySelectorAll('.ver-actions button')].find(b=>b.textContent.includes('提交审批'))?.click()`);
await sleep(500);
console.log('提交后:', await ev(`[...document.querySelectorAll('.vers .tag')].map(t=>t.textContent).join(',')`));

// 组长退回，填意见
await ev(`(function(){const s=document.querySelector('.topbar select'); s.value='leader'; s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
await sleep(200);
await ev(`[...document.querySelectorAll('.ver-actions button')].find(b=>b.textContent.trim()==='退回')?.click()`);
await sleep(300);
await ev(`(function(){const i=document.querySelector('.reject-box input'); i.value='侧壁圆角未达R3要求，请补料重画'; i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
await sleep(200);
await ev(`[...document.querySelectorAll('.reject-box button')].find(b=>b.textContent.includes('确认退回'))?.click()`);
await sleep(500);
console.log('退回后标签:', await ev(`[...document.querySelectorAll('.vers .tag')].map(t=>t.textContent).join(',')`));
const comment = await ev(`document.querySelector('.comment')?.textContent || '未找到退回意见'`);
console.log('挂载意见:', comment);

// 回首页：在制列表可检索到该项目
await ev(`document.querySelector('.topbar button')?.click()`);
await sleep(500);
const activeCards = await ev(`document.querySelectorAll('.card').length`);
console.log('在制项目卡片数:', activeCards);
const moldText = await ev(`document.querySelector('.card strong')?.textContent || '无'`);
console.log('卡片模号:', moldText);
// 归档后再用模号检索
await ev(`[...document.querySelectorAll('.card button')].find(b=>b.textContent.trim()==='归档')?.click()`);
await sleep(500);
await ev(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('归档检索'))?.click()`);
await sleep(300);
await ev(`(function(){const i=document.querySelector('.search input'); i.value='M-CDTEST'; i.dispatchEvent(new Event('input',{bubbles:true}));})()`);
await sleep(400);
const archivedCards = await ev(`document.querySelectorAll('.card').length`);
console.log('归档后按模号检索命中:', archivedCards);

console.log(logs.length ? '异常: ' + logs.join(';') : '（无异常）');
ws.close(); process.exit(0);
