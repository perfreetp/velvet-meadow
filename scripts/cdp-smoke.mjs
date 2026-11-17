// CDP 端到端冒烟：驱动无头 Edge 完成 建档→画笔→镜像→死角→三维渲染→版本提交 全流程
const CDP = 'http://127.0.0.1:9222';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const list = await (await fetch(`${CDP}/json`)).json();
const page = list.find((t) => t.type === 'page');
if (!page) throw new Error('未找到 page target');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));

let seq = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') {
    logs.push('EXCEPTION: ' + JSON.stringify(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  }
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
    logs.push('CONSOLE.ERROR: ' + m.params.args.map((a) => a.value || a.description).join(' '));
  }
};
function send(method, params = {}) {
  return new Promise((res) => {
    const id = ++seq;
    pending.set(id, res);
    ws.send(JSON.stringify({ id, method, params }));
  });
}
async function ev(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) {
    logs.push('EVAL ERROR: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result;
  }
  return r.result?.result?.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: 'http://localhost:5173/' });
await sleep(1800);
// 固定工艺员角色（localStorage 可能残留组长）
await ev(`localStorage.setItem('mvs.role','technician')`);

// 1) 打开新建对话框并填表
await ev(`document.querySelector('header button').click()`);
await sleep(300);
await ev(`(function(){
  const set=(el,v)=>{el.value=String(v);
    el.dispatchEvent(new Event('input',{bubbles:true})); el.dispatchEvent(new Event('change',{bubbles:true}));};
  const ins=document.querySelectorAll('.modal input');
  set(ins[1],'M-CDTEST'); set(ins[2],'MAT-99');
  set(ins[4],80); set(ins[5],60); set(ins[6],40);
})()`);
await sleep(200);
const voxelInfo = await ev(`document.querySelector('.modal .muted')?.textContent`);
console.log('建档规模提示:', voxelInfo);
await ev(`document.querySelector('.modal button.primary').click()`);
await sleep(2000);

// 2) 进入工作区，确认层列表与切片画布
const layerCount = await ev(`document.querySelectorAll('.layer').length`);
const topbar = await ev(`document.querySelector('.topbar strong')?.textContent`);
console.log('顶栏模号:', topbar, '| 层数:', layerCount);

// 3) 画笔涂抹：向画布派发真实指针事件（格 10,10 一带，半径 3）
await ev(`(function(){
  const c=document.querySelector('.canvas-wrap canvas'); const r=c.getBoundingClientRect();
  const pts=[[120,120],[140,125],[160,130],[180,140],[150,170]];
  function pe(type,x,y){c.dispatchEvent(new PointerEvent(type,{bubbles:true,clientX:r.left+x,clientY:r.top+y,pointerId:1,button:0}));}
  pe('pointerdown',pts[0][0],pts[0][1]);
  for(const [x,y] of pts.slice(1)) pe('pointermove',x,y);
  pe('pointerup',pts[pts.length-1][0],pts[pts.length-1][1]);
})()`);
await sleep(400);
const voxelCount = await ev(`[...document.querySelectorAll('.topbar .muted')].map(e=>e.textContent).find(t=>t.includes('型腔')) || '缺统计'`);
console.log('顶栏统计:', voxelCount);

// 4) 开启 X 镜像再涂一笔
await ev(`document.querySelectorAll('.right input[type=checkbox]')[0].click()`);
await ev(`(function(){
  const c=document.querySelector('.canvas-wrap canvas'); const r=c.getBoundingClientRect();
  function pe(type,x,y){c.dispatchEvent(new PointerEvent(type,{bubbles:true,clientX:r.left+x,clientY:r.top+y,pointerId:1,button:0}));}
  pe('pointerdown',200,200); pe('pointermove',220,210); pe('pointerup',220,210);
})()`);
await sleep(400);

// 5) 死角分析（先把刀具半径设为 1mm，避免默认 3mm 把小腔全部判死）
await ev(`(function(){const ins=document.querySelectorAll('.right input[type=number]');
  ins[0].value='1';
  ins[0].dispatchEvent(new Event('input',{bubbles:true}));})()`);
await ev(`[...document.querySelectorAll('.right button')].find(b=>b.textContent.includes('重新分析'))?.click()`);
await sleep(600);
const deadText = await ev(`[...document.querySelectorAll('.right p')].map(p=>p.textContent).find(t=>t.includes('不可达')) || '无死角文本'`);
console.log('死角分析:', deadText.replace(/\s+/g, ' ').trim());

// 6) 切到三维（OffscreenCanvas Worker 软件渲染）
await ev(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('三维'))?.click()`);
await sleep(2500);
// 用页面真实按钮触发重置视角，从 DOM 读回 worker 实际相机（避免模块重新导入产生新 worker 实例）
await ev(`[...document.querySelectorAll('.top-left button')].find(b=>b.textContent.includes('重置视角'))?.click()`);
await sleep(1800);
const camAfterReset = await ev(`document.querySelector('[data-cam]')?.textContent || '未读到相机'`);
console.log('refit 后 worker 相机:', camAfterReset);
const shot3d = await send('Page.captureScreenshot', { format: 'png' });
if (shot3d.result?.data) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync('D:/ccfb/runs/1000049/workspace/.smoke/cdp-3d.png', Buffer.from(shot3d.result.data, 'base64'));
  console.log('3D 截图已保存');
}
const stats = await ev(`document.querySelector('.top-right')?.innerText.replace(/\\n/g,' | ') || '统计面板缺失'`);
console.log('三维统计面板:', stats);

// 7) 开死角标色叠加，再截图
await ev(`[...document.querySelectorAll('.top-left button')].find(b=>b.textContent.includes('死角'))?.click()`);
await sleep(2500);
const shotDead = await send('Page.captureScreenshot', { format: 'png' });
if (shotDead.result?.data) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync('D:/ccfb/runs/1000049/workspace/.smoke/cdp-dead.png', Buffer.from(shotDead.result.data, 'base64'));
  console.log('死角截图已保存');
}

// 8) 存版本，再打开版本面板查状态
await ev(`[...document.querySelectorAll('.topbar button')].find(b=>b.textContent.includes('存版本'))?.click()`);
await sleep(800);
await ev(`[...document.querySelectorAll('.topbar button')].find(b=>b.textContent.includes('版本/审批'))?.click()`);
await sleep(600);
const verStatus = await ev(`[...document.querySelectorAll('.vers .tag')].map(t=>t.textContent).join(',') || '无版本'`);
console.log('版本状态:', verStatus);
// 9) 切组长角色前，先确保是工艺员完成提交（角色持久化在 localStorage）
await ev(`(function(){const s=document.querySelector('.topbar select');
  s.value='technician'; s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
await sleep(300);
console.log('当前角色:', await ev(`document.querySelector('.topbar select').value`));
console.log('版本区按钮:', await ev(`[...document.querySelectorAll('.ver-actions button')].map(b=>b.textContent.trim())`));
await ev(`[...document.querySelectorAll('.ver-actions button')].find(b=>b.textContent.includes('提交审批'))?.click()`);
await sleep(600);
const verStatus2 = await ev(`[...document.querySelectorAll('.vers .tag')].map(t=>t.textContent).join(',')`);
console.log('提交后状态:', verStatus2);

// 10) 切组长角色，审批通过
await ev(`(function(){const s=document.querySelector('.topbar select');
  s.value='leader'; s.dispatchEvent(new Event('change',{bubbles:true}));})()`);
await sleep(300);
await ev(`[...document.querySelectorAll('.ver-actions button')].find(b=>b.textContent.trim()==='通过')?.click()`);
await sleep(500);
const verStatus3 = await ev(`[...document.querySelectorAll('.vers .tag')].map(t=>t.textContent).join(',')`);
console.log('审批后状态:', verStatus3);
const rejectBtnExists = await ev(`!![...document.querySelectorAll('.ver-actions button')].find(b=>b.textContent.includes('退回'))`);
console.log('退回按钮可见(待审批态应为false，已通过后隐藏):', rejectBtnExists);

// 10) 回切片页截图
await ev(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('切片'))?.click()`);
await sleep(800);
const shotSlice = await send('Page.captureScreenshot', { format: 'png' });
if (shotSlice.result?.data) {
  const { writeFileSync } = await import('node:fs');
  writeFileSync('D:/ccfb/runs/1000049/workspace/.smoke/cdp-slice.png', Buffer.from(shotSlice.result.data, 'base64'));
  console.log('切片截图已保存');
}

console.log('\\n=== 浏览器侧错误日志 ===');
console.log(logs.length ? logs.join('\\n') : '（无异常）');
ws.close();
process.exit(0);
