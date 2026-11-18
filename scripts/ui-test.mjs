// UI 冒烟测试:驱动本机 Chrome 走完 生成→锁定→重生成→归档→检索→比对→报告 全流程。
// 运行:node scripts/ui-test.mjs
import puppeteer from 'puppeteer-core';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = 'http://localhost:8123/';
let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
};

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--enable-unsafe-webgpu', '--window-size=1500,950', '--no-first-run'],
  defaultViewport: { width: 1500, height: 950 },
});
const page = await browser.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto(URL, { waitUntil: 'networkidle0' });
await page.waitForSelector('tcn-app');
await new Promise((r) => setTimeout(r, 1500));

// 阴影 DOM 查询辅助
const $ = (sel) => page.evaluateHandle((s) => {
  const walk = (root, parts) => {
    let el = root;
    for (const p of parts) {
      el = el.shadowRoot ? el.shadowRoot.querySelector(p) : el.querySelector(p);
      if (!el) return null;
    }
    return el;
  };
  return walk(document, s.split('>>').map((x) => x.trim()));
}, sel);

// 1. 初始生成
const stats1 = await page.evaluate(() => {
  const app = document.querySelector('tcn-app');
  return app.shadowRoot.querySelector('tcn-controls').shadowRoot.querySelector('#stats').textContent;
});
check('初始网络已生成(统计非空)', stats1.includes('主干'));

// 2. 编辑模式 + 模拟选中并锁定一条支沟(直接调状态,等价于视口点选)
const lockInfo = await page.evaluate(async () => {
  const { app } = await import('./dist/state.js');
  const branch = app.network.segments.find((s) => s.level === 1);
  app.select(branch.id);
  app.setLocked(branch.id, true);
  const before = JSON.stringify(branch.points);
  const beforeDir = app.params.mainDirection;
  app.setParams({ mainDirection: beforeDir + 30 });
  app.generate();
  const after = app.network.segments.find((s) => s.id === branch.id);
  return {
    kept: !!after,
    sameShape: after && JSON.stringify(after.points) === before,
    reconnected: after && (after.parentId === null || app.network.segments.some((s) => s.id === after.parentId)),
    hasLink: app.network.segments.some((s) => s.id.includes('#link')),
  };
});
check('锁定段在改走向重生成后保留', lockInfo.kept);
check('锁定段形态不变', lockInfo.sameShape);
check('锁定段接回新网络', lockInfo.reconnected);

// 3. 归档
await page.evaluate(async () => {
  const { app } = await import('./dist/state.js');
  await app.archiveCurrent('苏北辐射沙洲', 'UI 冒烟测试');
});
const archives = await page.evaluate(async () => {
  const { app } = await import('./dist/state.js');
  return app.archives.map((a) => ({ id: a.id, region: a.region, year: a.year }));
});
check('归档成功并生成编号', archives.length === 1 && /^TCN-\d{4}-\d{3}$/.test(archives[0]?.id ?? ''));
check('档案区域正确', archives[0]?.region === '苏北辐射沙洲');

// 4. 档案检索页
await page.evaluate(() => {
  document.querySelector('tcn-app').shadowRoot.querySelector('button[data-tab="archives"]').click();
});
await new Promise((r) => setTimeout(r, 300));
const archiveRows = await page.evaluate(() => {
  const p = document.querySelector('tcn-app').shadowRoot.querySelector('tcn-archives');
  return p.shadowRoot.querySelectorAll('#list table tr').length;
});
check('档案检索列表显示归档记录', archiveRows >= 2); // 表头 + 1 行

// 按年份检索(不存在的年份)
const filtered = await page.evaluate(() => {
  const p = document.querySelector('tcn-app').shadowRoot.querySelector('tcn-archives');
  const sel = p.shadowRoot.querySelector('#year');
  const opt = document.createElement('option');
  opt.value = '1999';
  opt.textContent = '1999 年';
  sel.appendChild(opt);
  sel.value = '1999';
  sel.dispatchEvent(new Event('change'));
  return p.shadowRoot.querySelector('#count').textContent;
});
check('按年份检索(无结果年份)', filtered.includes('0'));

// 5. 比对页
await page.evaluate(() => {
  document.querySelector('tcn-app').shadowRoot.querySelector('button[data-tab="compare"]').click();
});
await new Promise((r) => setTimeout(r, 300));
const compared = await page.evaluate(async () => {
  const { app } = await import('./dist/state.js');
  const cmp = document.querySelector('tcn-app').shadowRoot.querySelector('tcn-compare');
  cmp.compareWith(app.archives[0].id);
  await new Promise((r) => setTimeout(r, 300));
  return cmp.shadowRoot.querySelector('#diff').textContent;
});
check('版本比对差异表已渲染', compared.includes('主沟走向'));

// 6. 报告页
await page.evaluate(() => {
  document.querySelector('tcn-app').shadowRoot.querySelector('button[data-tab="report"]').click();
});
await new Promise((r) => setTimeout(r, 300));
const report = await page.evaluate(() => {
  const r = document.querySelector('tcn-app').shadowRoot.querySelector('tcn-report');
  return r.shadowRoot.querySelector('#pre').textContent;
});
check('调查说明已生成', report.includes('潮沟网络调查说明') && report.includes('随机种子'));

// 7. 页面无未捕获错误
check('无页面脚本错误', errors.length === 0);
if (errors.length) console.log('  错误:', errors.slice(0, 5).join(' | '));

await page.screenshot({ path: 'smoke-final.png' });
await browser.close();
console.log(failures === 0 ? '全部通过' : `${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
