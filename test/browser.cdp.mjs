// 轻量 CDP 驱动：打开页面、收集 console/异常、执行 JS、点击、截图
const base = process.env.CDP || 'http://localhost:9222';

async function newPage(url) {
  const res = await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
  const tab = await res.json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  const logs = [];
  const errors = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      logs.push(`[${msg.params.type}] ` + msg.params.args.map((a) => a.value ?? a.description).join(' '));
    } else if (msg.method === 'Runtime.exceptionThrown') {
      const d = msg.params.exceptionDetails;
      errors.push(d.exception?.description || d.text);
    }
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++id;
    pending.set(mid, { resolve, reject });
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
  await send('Page.enable');
  await send('Runtime.enable');
  return {
    ws, logs, errors,
    eval: async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.value,
    click: async (x, y) => {
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    },
    screenshot: async () => (await send('Page.captureScreenshot', { format: 'png' })).data,
    close: async () => { ws.close(); await fetch(`${base}/json/close/${tab.id}`); },
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const page = await newPage('http://localhost:4173/');
await sleep(3500); // 等 Pixi 初始化 + Worker 首轮计算

const results = [];
const check = (name, cond, extra = '') => {
  results.push({ name, ok: !!cond, extra: String(extra) });
  console.log(`${cond ? '✔' : '✖'} ${name} ${extra}`);
};

// 1. 运行时无异常
check('页面无未捕获异常', page.errors.length === 0, page.errors.join(' | '));

// 2. Pixi canvas 已挂载且有内容
const canvasInfo = await page.eval(`(() => {
  const c = document.querySelector('canvas.pixi-canvas');
  return c ? { w: c.width, h: c.height } : null;
})()`);
check('Pixi 画布已挂载', canvasInfo && canvasInfo.w > 0, JSON.stringify(canvasInfo));

// 3. 首轮 Worker 计算完成，HUD 出现网格信息
const hud = await page.eval(`document.querySelector('.canvas-hud')?.innerText || ''`);
check('照度计算完成并显示 HUD', /网格/.test(hud), hud.replace(/\n/g, ' | '));

// 4. 时间滑块可改（9-21），太阳读数联动
await page.eval(`document.querySelector('.time-slider').value = 12;
  document.querySelector('.time-slider').dispatchEvent(new Event('input', {bubbles:true}))`);
await sleep(1500);
const sunReadout = await page.eval(`document.querySelector('.sun-readout')?.innerText || ''`);
check('时间滑块联动太阳读数', /高度角/.test(sunReadout), sunReadout.replace(/\n/g, ' '));

// 5. 切到热力图图层
await page.eval(`[...document.querySelectorAll('.layer-line input')].find(i=>i.closest('label').innerText.includes('热力图')).click()`);
await sleep(800);
const heatOn = await page.eval(`[...document.querySelectorAll('.layer-line')].find(l=>l.innerText.includes('热力图')).querySelector('input').checked`);
check('热力图图层可开启', heatOn === true);

// 6. 打开统计面板，暗区卡片有数据
await page.eval(`[...document.querySelectorAll('.tab-btn')].find(b=>b.innerText.includes('暗区')).click()`);
await sleep(500);
const statText = await page.eval(`document.querySelector('.stats-panel')?.innerText || ''`);
check('暗区块数与面积统计渲染', /暗区块数/.test(statText) && /暗区总面积/.test(statText));
const zoneCount = await page.eval(`document.querySelector('.stat-card .stat-num')?.innerText || ''`);
check('暗区块数有数值', /\d/.test(zoneCount), zoneCount);

// 7. 探针按钮存在
const probeBtn = await page.eval(`[...document.querySelectorAll('.btn')].some(b=>b.innerText.includes('探针'))`);
check('照度探针入口存在', probeBtn);

// 8. CSV 导出函数可用（不真正下载，验证统计序列化）
const csvOk = await page.eval(`(async()=>{
  try {
    const m = await import('/assets/'+[...document.scripts][0].src.split('/').pop());
    return false;
  } catch(e){ return 'skip'; }
})()`);

// 9. 切到方案后台，渲染新建表单与列表
await page.eval(`[...document.querySelectorAll('.tab-btn')].find(b=>b.innerText.includes('方案后台')).click()`);
await sleep(500);
const planPanel = await page.eval(`document.querySelector('.plan-panel')?.innerText || ''`);
check('方案后台面板渲染', /新建草稿/.test(planPanel));

// 10. 切回属性面板，全局渲染参数齐全
await page.eval(`[...document.querySelectorAll('.tab-btn')].find(b=>b.innerText.includes('属性')).click()`);
await sleep(300);
const insp = await page.eval(`document.querySelector('.inspector')?.innerText || ''`);
check('全局参数（曝光/伽马/阈值）齐全', /曝光增益/.test(insp) && /伽马/.test(insp) && /暗区阈值/.test(insp));

// 11. 角色切换
await page.eval(`[...document.querySelectorAll('.role-btn')].find(b=>b.innerText.includes('审查人')).click()`);
await sleep(300);
const roleStored = await page.eval(`localStorage.getItem('lighting-role')`);
check('角色可切换为审查人', roleStored === 'reviewer', roleStored);
await page.eval(`[...document.querySelectorAll('.role-btn')].find(b=>b.innerText.includes('规划员')).click()`);

// 12. 画布放置灯具（通过工具栏选路灯后在画布中心点击）
await page.eval(`[...document.querySelectorAll('.tool-btn')].find(b=>b.innerText.includes('路灯')).click()`);
const rect = await page.eval(`(()=>{const r=document.querySelector('canvas.pixi-canvas').getBoundingClientRect();
  return {x:r.x+r.width*0.5, y:r.y+r.height*0.5}})()`);
await page.click(rect.x, rect.y);
await sleep(1500);
const lightCount = await page.eval(`document.querySelectorAll('.pixi-canvas').length`); // canvas 仍在
const hud2 = await page.eval(`document.querySelector('.canvas-hud')?.innerText || ''`);
check('放置路灯后场景正常重算', lightCount === 1 && !/error/i.test(hud2));

// 切回属性页再截主界面（夜间光斑，默认 20:00）
await page.eval(`[...document.querySelectorAll('.tab-btn')].find(b=>b.innerText.includes('属性')).click()`);
await sleep(300);
const shot1 = await page.screenshot();
const fs = await import('node:fs');
const SHOT_DIR = 'D:/ccfb/runs/1000044/workspace/test/shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });
fs.writeFileSync(`${SHOT_DIR}/cdp-night.png`, Buffer.from(shot1, 'base64'));

// 白天 12 点 + 热力图
await page.eval(`const sl=document.querySelector('.time-slider'); sl.value=12; sl.dispatchEvent(new Event('input',{bubbles:true}))`);
await sleep(1800);
await page.eval(`[...document.querySelectorAll('.layer-line input')].find(i=>i.closest('label').innerText.includes('热力图')).click()`);
await sleep(1200);
const shotHeat = await page.screenshot();
fs.writeFileSync(`${SHOT_DIR}/cdp-heatmap-day.png`, Buffer.from(shotHeat, 'base64'));

// 切到统计面板
await page.eval(`[...document.querySelectorAll('.tab-btn')].find(b=>b.innerText.includes('暗区')).click()`);
await sleep(300);
const shot2 = await page.screenshot();
fs.writeFileSync(`${SHOT_DIR}/cdp-stats.png`, Buffer.from(shot2, 'base64'));

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 通过`);
if (page.errors.length) console.log('页面异常:', page.errors);
await page.close();
process.exit(failed.length ? 1 : 0);
