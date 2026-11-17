const list = await (await fetch('http://127.0.0.1:9222/json')).json();
const ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0; const pend = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const id = ++seq; pend.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (x) => {
  const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) return { __error: r.result.exceptionDetails.text };
  return r.result?.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 确保在工作区三维页
const inWs = await ev(`!!document.querySelector('.topbar strong')`);
console.log('in workspace:', inWs);
if (!inWs) {
  await ev(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('在制项目'))?.click()`);
  await sleep(400);
  await ev(`[...document.querySelectorAll('.card button')].find(b=>b.textContent.includes('打开'))?.click()`);
  await sleep(2000);
}
await ev(`[...document.querySelectorAll('.tabs button')].find(b=>b.textContent.includes('三维'))?.click()`);
await sleep(1500);
// 点重置视角，等待 refit 回读
await ev(`[...document.querySelectorAll('.top-left button')].find(b=>b.textContent.includes('重置视角'))?.click()`);
await sleep(1500);
const cam = await ev(`(async()=>{const w=await import('/src/lib/voxel/worker3d.js'); const r=await w.worker3d.getCamera(); return r.camera;})()`);
console.log('worker camera after reset:', JSON.stringify(cam));
const ed = await ev(`(async()=>{const e=await import('/src/lib/editor.svelte.js'); return {cam3d:e.editor.camera3d, voxel:e.editor.voxelCount};})()`);
console.log('editor state:', JSON.stringify(ed));
ws.close(); process.exit(0);
