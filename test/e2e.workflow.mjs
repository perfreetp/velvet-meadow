// 端到端 UI 工作流：通过真实控件走 草稿→送审→退回→重审→公示，验证前后端接线
const BASE = 'http://localhost:5174';
const CDP = 'http://localhost:9222';
const res = await fetch(`${CDP}/json/new?${encodeURIComponent(BASE)}`, { method: 'PUT' });
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
const results = [];
const check = (n, c, x = '') => { results.push(c); console.log(`${c ? '✔' : '✖'} ${n} ${x}`); };
const clickBtn = async (txt) => ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.innerText.includes('${txt}')&&!x.disabled);if(!b)return 'MISSING';b.click();return 'OK'})()`);
const openTab = async (txt) => ev(`[...document.querySelectorAll('.tab-btn')].find(b=>b.innerText.includes('${txt}')).click()`);
const role = async (r) => ev(`[...document.querySelectorAll('.role-btn')].find(b=>b.innerText.includes('${r}')).click()`);
const waitFor = async (fn, label) => { for (let i = 0; i < 20; i++) { if (await fn()) return true; await sleep(300); } console.log('  等待超时: ' + label); return false; };

await sleep(3500);
check('初始无异常', errors.length === 0, errors.join('|'));

// 1. 规划员在方案后台建草稿
await role('规划员'); await sleep(200);
await openTab('方案后台'); await sleep(400);
const planName = 'E2E联调院落方案';
await ev(`(()=>{const inp=document.querySelector('.plan-panel .field input');inp.value='${planName}';inp.dispatchEvent(new Event('input',{bubbles:true}))})()`);
check('点击新建草稿', (await clickBtn('新建草稿')) === 'OK');
await waitFor(async () => (await ev(`document.querySelectorAll('.plan-row').length`)) >= 1, '方案出现在列表');
const listedName = await ev(`document.querySelector('.plan-row .plan-name')?.innerText || ''`);
check('列表显示新方案', listedName.includes(planName), listedName);
const badge = await ev(`document.querySelector('.current-plan .status-badge')?.innerText || ''`);
check('初始状态为草稿', badge.includes('草稿'), badge);

// 2. 提交送审
check('提交送审按钮可点', (await clickBtn('提交送审')) === 'OK');
await waitFor(async () => (await ev(`document.querySelector('.current-plan .status-badge')?.innerText || ''`)).includes('送审'), '状态变送审');
check('状态已变为送审', (await ev(`document.querySelector('.current-plan .status-badge')?.innerText || ''`)).includes('送审'));

// 3. 切审查人，写退回意见
await role('审查人'); await sleep(300);
await openTab('审查/公示'); await sleep(400);
check('退回选项存在', (await clickBtn('退回修改')) === 'OK');
await ev(`(()=>{const ta=document.querySelector('.review-box textarea.ta');ta.value='巷口照度不足，请增加庭院灯';ta.dispatchEvent(new Event('input',{bubbles:true}))})()`);
check('提交退回意见', (await clickBtn('提交审查意见')) === 'OK');
await sleep(800);
const reviewShown = await ev(`document.querySelectorAll('.review-item.reject').length`);
check('退回意见显示在记录中', reviewShown >= 1, `count=${reviewShown}`);

// 4. 回到规划员，确认方案已自动回草稿
await role('规划员'); await sleep(300);
await openTab('方案后台'); await sleep(400);
const afterReject = await ev(`document.querySelector('.current-plan .status-badge')?.innerText || ''`);
check('退回后自动回到草稿', afterReject.includes('草稿'), afterReject);

// 5. 重新送审 → 审查人同意 → 公示
check('重新提交送审', (await clickBtn('提交送审')) === 'OK');
await waitFor(async () => (await ev(`document.querySelector('.current-plan .status-badge')?.innerText || ''`)).includes('送审'), '重审状态');
await role('审查人'); await sleep(300);
await openTab('审查/公示'); await sleep(300);
check('选择同意', (await clickBtn('同意')) === 'OK');
await ev(`(()=>{const ta=document.querySelector('.review-box textarea.ta');ta.value='修改到位，同意公示';ta.dispatchEvent(new Event('input',{bubbles:true}))})()`);
check('提交同意意见', (await clickBtn('提交审查意见')) === 'OK');
await sleep(600);
await openTab('方案后台'); await sleep(300);
check('审查通过并公示', (await clickBtn('审查通过并公示')) === 'OK');
await waitFor(async () => (await ev(`document.querySelector('.current-plan .status-badge')?.innerText || ''`)).includes('公示'), '状态变公示');
const pubBadge = await ev(`document.querySelector('.current-plan .status-badge')?.innerText || ''`);
check('状态已变为公示', pubBadge.includes('公示'), pubBadge);

// 6. 公示方案出现批注入口
await openTab('审查/公示'); await sleep(400);
const annoBtn = await ev(`[...document.querySelectorAll('button')].some(b=>b.innerText.includes('在画布上标点批注'))`);
check('公示后显示标点批注入口', annoBtn === true);
const lockedHint = await ev(`document.querySelector('.hint.locked')?.innerText || ''`);
check('显示只读锁定提示', lockedHint.includes('只读'), lockedHint);

// 7. 后端持久化核验：刷新后方案仍在
await ev(`location.reload()`);
await sleep(3500);
await openTab('方案后台'); await sleep(500);
const afterReload = await ev(`[...document.querySelectorAll('.plan-row .plan-name')].some(n=>n.innerText.includes('${planName}'))`);
check('刷新后方案持久化保留', afterReload === true);

const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} 通过；异常: ${errors.length ? errors.join('|') : '无'}`);
ws.close();
await fetch(`${CDP}/json/close/${tab.id}`);
process.exit(failed ? 1 : 0);
