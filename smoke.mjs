// 冒烟测试:驱动本机 Chrome 打开图册,验证渲染与核心交互。
import puppeteer from 'puppeteer-core';

const browser = await puppeteer.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: 'new',
  args: ['--enable-unsafe-webgpu', '--use-webgpu-adapter=swiftshader', '--window-size=1600,950'],
  defaultViewport: { width: 1600, height: 900 },
});
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGE: ' + e.message));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clickBtn = (text) => page.evaluate((t) => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes(t));
  if (b) b.click();
  return !!b;
}, text);

await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle0' });
await sleep(3000);

// 1. 放大到锁模区,验证 LOD(剖面线/尺寸标注)
await page.mouse.move(800, 400);
for (let i = 0; i < 12; i++) { await page.mouse.wheel({ deltaY: -240 }); await sleep(50); }
await sleep(800);
await page.screenshot({ path: 'smoke-zoomed.png' });
console.log('ZOOMED:', (await page.evaluate(() => document.querySelector('.toolbar').innerText)).split('\n').slice(2, 4).join(' '));

// 2. 悬停高亮 + 点选
await page.mouse.move(800, 400);
await sleep(400);
await page.mouse.click(800, 400);
await sleep(600);
const info = await page.evaluate(() => document.querySelector('.info')?.innerText);
console.log('INFO:', info ? info.replace(/\n/g, ' ').slice(0, 120) : '(未弹出)');
await page.screenshot({ path: 'smoke-select.png' });

// 3. 框选对比
console.log('框选按钮:', await clickBtn('框选对比'));
await page.mouse.move(400, 250);
await page.mouse.down();
await page.mouse.move(1100, 650, { steps: 8 });
await page.mouse.up();
await sleep(600);
const cmp = await page.evaluate(() => document.querySelector('.compare')?.innerText);
console.log('COMPARE:', cmp ? cmp.replace(/\n/g, ' ').slice(0, 100) : '(未生成)');
await page.screenshot({ path: 'smoke-boxselect.png' });
await clickBtn('框选对比'); // 退出框选模式

// 4. 图层开关:关掉「锁模」
await page.evaluate(() => {
  const rows = [...document.querySelectorAll('.layer-row')];
  rows[1].querySelector('input[type=checkbox]').click();
});
await sleep(500);
await page.screenshot({ path: 'smoke-layer-off.png' });
console.log('图层开关: 已截图');

// 5. 后台管理:运营改图层归属 → 提交 → 技术主管发布
console.log('后台按钮:', await clickBtn('后台管理'));
await sleep(500);
await page.evaluate(() => {
  const sel = document.querySelector('.modal tbody tr select.cell:last-of-type')
    || [...document.querySelectorAll('.modal tbody tr')][0].querySelectorAll('select')[1];
  sel.value = '3';
  sel.dispatchEvent(new Event('change', { bubbles: true }));
});
console.log('提交审核:', await clickBtn('提交审核'));
await sleep(400);
await page.select('.toolbar select', 'supervisor');
await sleep(300);
console.log('审核发布:', await clickBtn('审核发布'));
await sleep(500);
await page.screenshot({ path: 'smoke-admin.png' });
const verRows = await page.evaluate(() => document.querySelector('.modal tbody')?.innerText.replace(/\n/g, ' ').slice(0, 150));
console.log('VERSIONS:', verRows);

// 6. 查看统计
await page.evaluate(() => [...document.querySelectorAll('.modal nav button')].find((b) => b.textContent.includes('查看统计')).click());
await sleep(400);
const stats = await page.evaluate(() => document.querySelector('.modal tbody')?.innerText.replace(/\n/g, ' ').slice(0, 120));
console.log('STATS:', stats);

console.log('CONSOLE ERRORS:', errors.filter((e) => !e.includes('404')).slice(0, 5).join(' | ') || '无');
await browser.close();
