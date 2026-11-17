// 诊断提交审批按钮
const CDP = 'http://127.0.0.1:9222';
const list = await (await fetch(`${CDP}/json`)).json();
const page = list.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let seq = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const id = ++seq; pending.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  return r.result?.result?.value;
};
console.log('role select value:', await ev(`document.querySelector('.topbar select')?.value`));
console.log('all ver buttons:', await ev(`[...document.querySelectorAll('.ver-actions button')].map(b=>b.textContent.trim())`));
console.log('submit found:', await ev(`!![...document.querySelectorAll('.ver-actions button')].find(b=>b.textContent.includes('提交'))`));
console.log('ver tags:', await ev(`[...document.querySelectorAll('.vers .tag')].map(t=>t.textContent)`));
// 直接调 store
console.log('versions in store:', await ev(`(await import('/src/lib/editor.svelte.js')).editor.versions.map(v=>({v:v.version,st:v.status,id:v.id}))`));
const id = await ev(`(await import('/src/lib/editor.svelte.js')).editor.versions[0]?.id`);
console.log('first version id:', id);
if (id) {
  const mod = await ev(`(async()=>{const m=await import('/src/lib/editor.svelte.js'); await m.submitVersion('${id}'); return m.editor.versions.map(v=>v.status);})()`);
  console.log('after direct submitVersion:', mod);
}
ws.close(); process.exit(0);
