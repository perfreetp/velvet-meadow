// 视觉验证：夜间光斑 / 冬至日照阴影 / 热力图，各等待计算稳定后截图
const base = 'http://localhost:9222';
const res = await fetch(`${base}/json/new?${encodeURIComponent('http://localhost:4173/')}`, { method: 'PUT' });
const tab = await res.json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
const errors = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.text);
};
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Runtime.enable');
const ev = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fs = await import('node:fs');
const DIR = 'D:/ccfb/runs/1000044/workspace/test/shots';
fs.mkdirSync(DIR, { recursive: true });
const shot = async (name) => fs.writeFileSync(`${DIR}/${name}.png`, Buffer.from((await send('Page.captureScreenshot', { format: 'png' })).data, 'base64'));

await sleep(3500);
const setHour = async (h) => ev(`(async()=>{const sl=document.querySelector('.time-slider');sl.value=${h};sl.dispatchEvent(new Event('input',{bubbles:true}))})()`);
const setLayer = async (label, on) => ev(`(()=>{const lab=[...document.querySelectorAll('.layer-line')].find(l=>l.innerText.includes('${label}'));const inp=lab.querySelector('input');if(inp.checked!==${on})inp.click()})()`);
const setPreset = async (name) => ev(`[...document.querySelectorAll('.seg-btn')].find(b=>b.innerText.includes('${name}')).click()`);
const waitHud = async () => { for (let i = 0; i < 12; i++) { await sleep(500); const h = await ev(`document.querySelector('.canvas-hud')?.innerText||''`); if (h.includes('网格')) return; } };

// 1. 夜间 20:00 光斑（关热力、开光斑）
await setLayer('热力图', false);
await setLayer('灯光光斑', true);
await setHour(20);
await waitHud(); await sleep(1200);
await shot('v1-night-lights');

// 2. 冬至正午 12:00 日照与建筑阴影
await setPreset('冬至');
await setHour(12);
await waitHud(); await sleep(1500);
await shot('v2-winter-noon-shadow');

// 3. 夏至 16:00 长阴影
await setPreset('夏至');
await setHour(16);
await waitHud(); await sleep(1500);
await shot('v3-summer-late-shadow');

// 4. 热力图（夏至正午）
await setHour(12);
await setLayer('热力图', true);
await waitHud(); await sleep(1500);
const heatChecked = await ev(`[...document.querySelectorAll('.layer-line')].find(l=>l.innerText.includes('热力图')).querySelector('input').checked`);
await shot('v4-heatmap');

// 5. 夜间热力图：分档色标应展现灯光周围的照度梯度与图例
await setHour(20);
await waitHud(); await sleep(1500);
const legend = await ev(`document.querySelector('.heat-legend')?.innerText || 'MISSING'`);
await shot('v5-heatmap-night');
await setLayer('热力图', false);

console.log('热力勾选状态:', heatChecked);
console.log('图例内容:', legend.replace(/\n/g, ' '));
console.log('运行时异常:', errors.length ? errors.join(' | ') : '无');
ws.close();
await fetch(`${base}/json/close/${tab.id}`);
process.exit(0);
