import { chromium } from 'playwright';
import path from 'node:path';

const BASE = process.env.E2E_BASE || 'http://localhost:5199';
let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name} ${extra}`); }
}

async function main(): Promise<void> {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('dialog', d => d.accept().catch(() => {}));

  await page.goto(BASE);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(300);

  // 用 setInputFiles 上传两张批量图纸
  const fileInput = page.locator('.review-panel input[type="file"]');
  await fileInput.setInputFiles([
    path.resolve('tests/fixtures/good.json'),
    path.resolve('tests/fixtures/bad.json')
  ]);

  // 等待 Worker 完成(批量结果卡片出现)
  await page.locator('.batch-row').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(500);

  const batchText = await page.locator('.review-panel').innerText();
  check('批量结果列出两张图纸', batchText.includes('good.json') && batchText.includes('bad.json'));
  check('合格图纸标记为合格', /合格/.test(batchText));
  check('问题图纸统计出严重项', (batchText.match(/严重/g) || []).length >= 1, batchText.slice(0, 120));

  // 第一张图纸被载入编辑器并自动跑了检查
  await page.waitForTimeout(300);
  const hasReport = await page.locator('.summary-cards').count();
  check('首图载入并生成检查报告', hasReport === 1);

  // 门禁:用一个确定带问题的图纸(bad.json)载入后,存在 open 问题时放行必须锁定
  const fileInput2 = page.locator('.review-panel input[type="file"]');
  await fileInput2.setInputFiles([path.resolve('tests/fixtures/bad.json')]);
  await page.locator('.summary-cards').waitFor({ timeout: 10000 });
  await page.waitForTimeout(300);
  const releaseBtn = page.getByRole('button', { name: /整批放行/ });
  const releaseDisabled = await releaseBtn.isDisabled();
  check('有未处理问题时放行锁定', releaseDisabled);

  // 驳回所有问题后放行解锁(逐条驳回)
  const rejectBtns = page.locator('[data-testid="reject-btn"]:not([disabled])');
  const n = await rejectBtns.count();
  check('问题图纸确实产生了待复核条目', n > 0, `实际 ${n}`);
  for (let i = 0; i < n; i++) {
    await rejectBtns.first().click();
    await page.waitForTimeout(30);
  }
  await page.waitForTimeout(200);
  const stillDisabled = await releaseBtn.isDisabled();
  // 全部驳回后按 batchPassable 规则应可放行(驳回=认可无需整改)
  check('全部驳回后放行解锁', !stillDisabled);

  check('Worker 批检全程无错误', errors.length === 0, errors.slice(0, 3).join(' | '));

  console.log(`\n批量检查 E2E:${pass} 通过, ${fail} 失败`);
  await browser.close();
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
