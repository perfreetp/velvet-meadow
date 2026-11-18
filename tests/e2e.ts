// 端到端浏览器测试：建档 → 示例数据 → 曲面/样条 → 偏移 → 横断面 → 选段展开 → 版本 → 报告归档 → 检索
// 运行：npx tsx tests/e2e.ts
import { chromium, type Page } from 'playwright';

const URL = process.env.E2E_URL ?? 'http://127.0.0.1:5174/';
const CODE = `HD-E2E-${Date.now().toString().slice(-6)}`;

let pass = 0;
let fail = 0;
function check(name: string, cond: boolean, extra = ''): void {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.error(`  ✗ ${name} ${extra}`);
  }
}

async function shadow(page: Page, selector: string, inner: string): Promise<string | null> {
  return page.evaluate(
    ({ selector, inner }) => {
      const host = document.querySelector(selector) as HTMLElement & { shadowRoot: ShadowRoot };
      const el = host?.shadowRoot?.querySelector(inner) as HTMLElement | null;
      return el ? el.textContent.trim() : null;
    },
    { selector, inner }
  );
}

async function shadowClick(page: Page, selector: string, inner: string): Promise<void> {
  await page.evaluate(
    ({ selector, inner }) => {
      const host = document.querySelector(selector) as HTMLElement & { shadowRoot: ShadowRoot };
      (host.shadowRoot.querySelector(inner) as HTMLElement).click();
    },
    { selector, inner }
  );
}

async function shadowFill(page: Page, selector: string, inner: string, value: string): Promise<void> {
  await page.evaluate(
    ({ selector, inner, value }) => {
      const host = document.querySelector(selector) as HTMLElement & { shadowRoot: ShadowRoot };
      const input = host.shadowRoot.querySelector(inner) as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    },
    { selector, inner, value }
  );
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1680, height: 980 } });
const errors: string[] = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});
// 统一处理所有 alert/confirm 弹窗
page.on('dialog', (d) => void d.accept());

/** 读取面板中指定标签后的数值（兼容千分位与单位后缀） */
async function kvValue(page: Page, selector: string, label: string): Promise<number | null> {
  return page.evaluate(
    ({ selector, label }) => {
      const host = document.querySelector(selector) as HTMLElement & { shadowRoot: ShadowRoot };
      const divs = [...host.shadowRoot.querySelectorAll('.kv div')];
      const hit = divs.find((d) => d.querySelector('span')?.textContent?.includes(label));
      const raw = hit?.querySelector('b')?.textContent ?? '';
      const n = Number(raw.replace(/,/g, '').replace(/[^0-9.\-]/g, ''));
      return Number.isFinite(n) ? n : null;
    },
    { selector, label }
  );
}

try {
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForSelector('app-header');

  // 1. 建档
  await shadowClick(page, 'app-header', '#btn-new');
  await page.waitForSelector('project-dialog');
  await shadowFill(page, 'project-dialog', 'input[name=code]', CODE);
  await shadowFill(page, 'project-dialog', 'input[name=name]', 'E2E测试河道建模');
  await shadowFill(page, 'project-dialog', 'input[name=river]', '测试河');
  await shadowFill(page, 'project-dialog', 'input[name=reach]', '试验段K0+000');
  await shadowClick(page, 'project-dialog', 'button.primary');
  await page.waitForSelector('project-dialog', { state: 'detached' });
  const badge = await page.locator('#scene-badge').textContent();
  check('项目建档并显示编号', badge!.includes(CODE), badge ?? '');

  // 2. 载入示例数据，等待地形渲染
  await shadowClick(page, 'side-panel', '#sample');
  await page.waitForTimeout(1500);
  const pointStat = await shadow(page, 'side-panel', '.sec .stat b');
  check('示例高程点导入（概况显示点数）', Number((pointStat ?? '0').replace(/,/g, '')) > 500, pointStat ?? '');
  const canvasCount = await page.locator('#scene-host canvas').count();
  check('three.js WebGL 画布挂载', canvasCount >= 1);

  // 3. 样条派生与曲率面板
  await page.waitForTimeout(800);
  const lineLen = await kvValue(page, 'curvature-panel', '线长');
  check('曲率面板计算出中心线线长', lineLen !== null && lineLen > 500, String(lineLen));
  // 4. 高程/坡度/曲率三种着色切换
  for (const mode of ['slope', 'curvature', 'elevation']) {
    await page.evaluate(
      (mode) => {
        const host = document.querySelector('tool-bar') as HTMLElement & { shadowRoot: ShadowRoot };
        const sel = host.shadowRoot.querySelector('#color-sel') as HTMLSelectElement;
        sel.value = mode;
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      },
      mode
    );
    await page.waitForTimeout(300);
  }
  check('三种曲面着色切换无异常', true);

  // 5. 等距偏移生成管理范围线（圆角默认）
  await shadowClick(page, 'side-panel', '.tab[data-tab="offset"]');
  await shadowClick(page, 'side-panel', '[data-off="center"][data-side="both"]');
  await page.waitForTimeout(500);
  const clearBtn = await shadow(page, 'side-panel', '#clear-offset');
  check('双侧等距偏移生成 2 条管理范围线', clearBtn!.includes('2'), clearBtn ?? '');
  // 切换尖角再生成
  await page.evaluate(() => {
    const host = document.querySelector('tool-bar') as HTMLElement & { shadowRoot: ShadowRoot };
    const sel = host.shadowRoot.querySelector('#corner-sel') as HTMLSelectElement;
    sel.value = 'miter';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await shadowClick(page, 'side-panel', '[data-off="crest-left"][data-side="left"]');
  await page.waitForTimeout(400);
  const clearBtn2 = await shadow(page, 'side-panel', '#clear-offset');
  check('尖角模式追加偏移线（共 3 条）', clearBtn2!.includes('3'), clearBtn2 ?? '');

  // 6. 横断面工具：在场景中点击两点
  await page.evaluate(() => {
    const host = document.querySelector('tool-bar') as HTMLElement & { shadowRoot: ShadowRoot };
    (host.shadowRoot.querySelector('[data-tool="section"]') as HTMLElement).click();
  });
  const box = await page.locator('#scene-host canvas').boundingBox();
  await page.mouse.click(box!.x + box!.width * 0.35, box!.y + box!.height * 0.5);
  await page.mouse.click(box!.x + box!.width * 0.65, box!.y + box!.height * 0.5);
  await page.waitForTimeout(600);
  const secWidth = await kvValue(page, 'section-panel', '断面宽');
  check('任意横断面生成并显示断面宽', secWidth !== null && secWidth > 10, String(secWidth));
  const secCanvas = await page.evaluate(() => {
    const host = document.querySelector('section-panel') as HTMLElement & { shadowRoot: ShadowRoot };
    return !!host.shadowRoot.querySelector('#cv');
  });
  check('横断面剖面图绘制', secCanvas);

  // 7. 堤坡选段 → 展开成果
  await page.evaluate(() => {
    const tb = document.querySelector('tool-bar') as HTMLElement & { shadowRoot: ShadowRoot };
    (tb.shadowRoot.querySelector('#line-sel') as HTMLSelectElement).value;
    const sel = tb.shadowRoot.querySelector('#line-sel') as HTMLSelectElement;
    sel.value = 'crest-left';
    sel.dispatchEvent(new Event('change', { bubbles: true }));
    (tb.shadowRoot.querySelector('[data-tool="pick-slope"]') as HTMLElement).click();
  });
  await page.mouse.click(box!.x + box!.width * 0.4, box!.y + box!.height * 0.45);
  await page.mouse.click(box!.x + box!.width * 0.6, box!.y + box!.height * 0.45);
  await page.waitForTimeout(800);
  const area = await kvValue(page, 'unfold-panel', '展开面积');
  check('堤坡选段生成展开预览（展开面积）', area !== null && area > 0, String(area));
  await shadowClick(page, 'unfold-panel', '#commit');
  await page.waitForTimeout(500);
  const savedTitle = await shadow(page, 'unfold-panel', '#saved-list .saved .t');
  check('展开成果保存到项目', savedTitle !== null && savedTitle.includes('左堤顶线'), savedTitle ?? '');

  // 8. 保存加工版本并比对
  await shadowClick(page, 'side-panel', '.tab[data-tab="archive"]');
  await shadowClick(page, 'side-panel', '#save-version');
  await page.waitForSelector('version-dialog');
  const diffRows = await page.evaluate(() => {
    const host = document.querySelector('version-dialog') as HTMLElement & { shadowRoot: ShadowRoot };
    return host.shadowRoot.querySelectorAll('tbody tr').length;
  });
  check('版本比对表 12 项指标', diffRows === 12, `rows=${diffRows}`);
  await shadowClick(page, 'version-dialog', '#ok');
  await page.waitForTimeout(500);
  await shadowClick(page, 'version-dialog', '#close');
  await page.waitForSelector('version-dialog', { state: 'detached' });

  // 9. 生成报告并归档
  await shadowClick(page, 'side-panel', '#make-report');
  await page.waitForTimeout(1000);

  // 10. 档案库检索（按编号）
  await shadowClick(page, 'side-panel', '#view-archives');
  await page.waitForSelector('archive-dialog');
  await shadowFill(page, 'archive-dialog', '#q-code', CODE);
  await shadowClick(page, 'archive-dialog', '#q');
  await page.waitForTimeout(500);
  const recCode = await shadow(page, 'archive-dialog', '.rec .code');
  check('档案库按项目编号检索到归档报告', recCode === CODE, recCode ?? '');
  const dlBtn = await page.evaluate(() => {
    const host = document.querySelector('archive-dialog') as HTMLElement & { shadowRoot: ShadowRoot };
    return !!host.shadowRoot.querySelector('.rec .dl');
  });
  check('归档记录可下载 HTML 报告', dlBtn);
  await shadowClick(page, 'archive-dialog', '.close');

  // 11. 项目检索（按河段关键字）——项目打开时顶栏无打开按钮，直接挂载检索弹窗
  await page.evaluate(() => {
    const d = document.createElement('project-dialog');
    d.setAttribute('mode', 'open');
    document.body.appendChild(d);
  });
  await page.waitForSelector('project-dialog >> visible=true');
  await shadowFill(page, 'project-dialog', '#q-reach', '试验段');
  await shadowClick(page, 'project-dialog', '#q-btn');
  await page.waitForTimeout(500);
  const foundCode = await shadow(page, 'project-dialog', '.item .code');
  check('项目库按河段检索命中', foundCode === CODE, foundCode ?? '');

  // 12. 页面无运行时错误
  check('浏览器控制台无错误', errors.length === 0, errors.join(' | '));
} catch (e) {
  errors.push((e as Error).stack ?? String(e));
  check('E2E 流程未抛异常', false, (e as Error).message);
} finally {
  await page.screenshot({ path: 'tests/e2e-screenshot.png', fullPage: false }).catch(() => undefined);
  await browser.close();
}

console.log(`\nE2E 结果：${pass} 通过，${fail} 失败`);
if (errors.length) console.log('错误明细:\n' + errors.join('\n'));
process.exit(fail ? 1 : 0);
