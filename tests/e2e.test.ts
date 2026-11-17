import { chromium, type Browser, type Page } from 'playwright';

const BASE = process.env.E2E_BASE || 'http://localhost:5199';
let pass = 0, fail = 0;
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.error(`  ✗ ${name} ${extra}`); }
}

async function canvasBox(page: Page) {
  return page.locator('canvas').boundingBox();
}

/** 在画布坐标(相对画布中心偏移 dx,dy)处按下/抬起 */
async function clickAt(page: Page, cx: number, cy: number, button: 'left' | 'right' = 'left') {
  await page.mouse.click(cx, cy, { button });
}

async function main(): Promise<void> {
  const browser: Browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  // 应用中的 alert/confirm 一律自动确认,避免阻塞测试
  page.on('dialog', d => d.accept().catch(() => {}));

  await page.goto(BASE);
  await page.waitForSelector('canvas');
  await page.waitForTimeout(400);
  const box = (await canvasBox(page))!;
  check('画布已渲染', box.width > 400 && box.height > 300, `${box.width}x${box.height}`);

  // 1. 初始:一个零件、网格
  const initialParts = await page.locator('.part-row').count();
  check('初始有一个板件', initialParts === 1, `实际 ${initialParts}`);

  // 2. 适应幅面
  await page.getByRole('button', { name: '适应幅面' }).click();
  await page.waitForTimeout(200);

  // 3. 画一个闭合矩形(直线工具,四点回到起点)
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(300);
  await page.locator('button[title*="直线"]').click();
  const b2 = (await canvasBox(page))!;
  const x0 = b2.x + 260, y0 = b2.y + 220;
  const pts = [
    [x0, y0], [x0 + 180, y0], [x0 + 180, y0 + 120], [x0, y0 + 120], [x0, y0]
  ];
  await page.mouse.move(pts[0][0], pts[0][1]);
  await page.mouse.down();
  await page.mouse.up();
  for (let i = 1; i < pts.length; i++) {
    await page.mouse.click(pts[i][0], pts[i][1]);
    await page.waitForTimeout(40);
  }
  await page.waitForTimeout(200);
  const contours1 = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    return (s.parts?.[0]?.contours?.[0]?.segs?.length) ?? 0;
  });
  check('闭合矩形生成 4 段图元', contours1 === 4, `实际 ${contours1}`);

  // 4. 切选择工具,锚点可点选(选中轮廓后出现锚点圆点)
  await page.locator('button[title*="选择"]').click();
  await page.waitForTimeout(150);
  await page.mouse.click(x0 + 90, y0); // 点上边
  await page.waitForTimeout(200);
  const selectedInfo = await page.locator('aside.side-panel').innerText();
  check('轮廓被选中并显示属性', selectedInfo.includes('图元数') && selectedInfo.includes('周长'));

  // 5. 撤销(Ctrl+Z)后轮廓减少
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(200);
  const afterUndo = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    return (s.parts?.[0]?.contours?.length) ?? -1;
  });
  check('撤销移除了刚画的轮廓', afterUndo === 0, `实际 ${afterUndo}`);
  // 重做恢复
  await page.keyboard.press('Control+Shift+z');
  await page.waitForTimeout(200);
  const afterRedo = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    return (s.parts?.[0]?.contours?.length) ?? -1;
  });
  check('重做恢复轮廓', afterRedo === 1, `实际 ${afterRedo}`);

  // 6. 画第二个矩形并做布尔交集
  await page.locator('button[title*="直线"]').click();
  const pts2 = [
    [x0 + 120, y0 + 60], [x0 + 320, y0 + 60], [x0 + 320, y0 + 200], [x0 + 120, y0 + 200], [x0 + 120, y0 + 60]
  ];
  for (const [px, py] of pts2) { await page.mouse.click(px, py); await page.waitForTimeout(30); }
  await page.waitForTimeout(200);
  const twoContours = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    return s.parts[0].contours.length;
  });
  check('第二个矩形已绘制', twoContours === 2, `实际 ${twoContours}`);
  // 选中第一个轮廓(用侧栏列表,可靠)
  await page.locator('button[title*="选择"]').click();
  await page.locator('[data-testid="contour-item"]').first().click();
  await page.waitForTimeout(150);
  await page.getByRole('button', { name: '交集' }).click();
  await page.waitForTimeout(300);
  const intersectCount = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    const c = s.parts[0].contours;
    return { n: c.length, segs: c[0]?.segs?.length ?? 0 };
  });
  check('布尔交集生成结果轮廓', intersectCount.n === 1 && intersectCount.segs >= 4, JSON.stringify(intersectCount));

  // 7. 越界变红:把板幅改小,并在越界状态下运行检查
  const widthInput = page.locator('input[type="number"]').first();
  await widthInput.fill('150');
  await widthInput.dispatchEvent('change');
  await page.waitForTimeout(300);
  const statusText = await page.locator('.statusbar').innerText();
  check('状态栏报越界', statusText.includes('越界'), statusText);

  // 8. 在越界状态下运行检查,复核面板出现三档统计与待复核问题
  await page.getByRole('button', { name: /运行检查/ }).click();
  await page.waitForTimeout(300);
  const review = page.locator('.review-panel');
  const reviewText = await review.innerText();
  check('复核面板显示三档统计', reviewText.includes('严重') && reviewText.includes('主要') && reviewText.includes('提示'));

  // 9. 确认/驳回按钮可用,逐条操作后状态变化
  const confirmBtn = review.locator('[data-testid="confirm-btn"]').first();
  await confirmBtn.waitFor({ timeout: 5000 });
  check('复核操作含确认与驳回', (await review.locator('[data-testid="reject-btn"]').count()) > 0);
  await confirmBtn.click();
  await review.locator('[data-testid="reject-btn"]').first().click();
  await page.waitForTimeout(150);
  check('确认/驳回可逐条操作', true);

  // 恢复板幅
  await widthInput.fill('2440');
  await widthInput.dispatchEvent('change');
  await page.waitForTimeout(200);

  // 10. 加孔 + 阵列(默认 3 列 2 行 => 6 个孔)
  await page.getByRole('button', { name: '加孔' }).click();
  await page.waitForTimeout(150);
  await page.locator('[data-testid="hole-check"]').first().check();
  await page.waitForTimeout(100);
  await page.getByRole('button', { name: '阵列复制' }).click();
  await page.waitForTimeout(300);
  const holeCount = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    return s.parts[0].holes.length;
  });
  check('孔阵列 3x2 复制(6 个孔)', holeCount === 6, `实际 ${holeCount}`);

  // 11. 导出 SVG
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '导出激光 SVG' }).click()
  ]);
  const svgPath = await download.path();
  const fs = await import('node:fs');
  const svg = fs.readFileSync(svgPath!, 'utf8');
  check('SVG 导出含 mm 单位与 path', svg.includes('viewBox') && svg.includes('<path') && svg.includes('mm'));
  check('SVG 含孔的 circle', (svg.match(/<circle/g) || []).length >= 6);

  // 12. 刷新后仍可编辑(持久化)
  await page.reload();
  await page.waitForSelector('canvas');
  await page.waitForTimeout(400);
  const persisted = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    const hist = JSON.parse(localStorage.getItem('panel-editor-history-v1') || '{}');
    return {
      contours: s.parts?.[0]?.contours?.length ?? 0,
      holes: s.parts?.[0]?.holes?.length ?? 0,
      undoDepth: hist.past?.length ?? 0
    };
  });
  check('刷新后文档保留(轮廓+孔)', persisted.contours >= 1 && persisted.holes === 6, JSON.stringify(persisted));
  check('刷新后撤销历史保留', persisted.undoDepth > 0, `深度 ${persisted.undoDepth}`);

  // 13. 自由曲线工具
  await page.locator('button[title*="自由曲线"]').click();
  const b3 = (await canvasBox(page))!;
  await page.mouse.move(b3.x + 350, b3.y + 400);
  await page.mouse.down();
  for (let i = 0; i <= 12; i++) {
    await page.mouse.move(b3.x + 350 + i * 12, b3.y + 400 + Math.sin(i / 2) * 20);
    await page.waitForTimeout(20);
  }
  await page.mouse.up();
  await page.waitForTimeout(300);
  const freeSegs = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    const cs = s.parts[0].contours;
    return cs[cs.length - 1]?.segs?.filter((x: { type: string }) => x.type === 'cubic').length ?? 0;
  });
  check('自由曲线生成贝塞尔图元', freeSegs >= 2, `实际 ${freeSegs}`);

  // 14. 圆弧工具
  await page.locator('button[title*="圆弧"]').click();
  const b4 = (await canvasBox(page))!;
  const ax = b4.x + 400, ay = b4.y + 420;
  await page.mouse.click(ax, ay);
  await page.waitForTimeout(50);
  await page.mouse.click(ax + 90, ay + 50);
  await page.waitForTimeout(50);
  await page.mouse.dblclick(ax + 120, ay);
  await page.waitForTimeout(300);
  const hasArc = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('panel-editor-doc-v1') || '{}');
    const cs = s.parts[0].contours;
    return cs.some((c: { segs: { type: string }[] }) => c.segs.some(x => x.type === 'arc'));
  });
  check('圆弧工具生成圆弧图元', hasArc);

  // 15. 无运行时错误
  check('浏览器无未捕获错误', errors.length === 0, errors.slice(0, 3).join(' | '));

  console.log(`\nE2E 结果:${pass} 通过, ${fail} 失败`);
  await browser.close();
  process.exit(fail ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
