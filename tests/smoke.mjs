// 端到端冒烟测试:四界面 + 核心功能链路
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const EXE = path.join(homedir(), 'AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe');
const BASE = 'http://127.0.0.1:5173/';
const SHOTS = './tests/shots';
mkdirSync(SHOTS, { recursive: true });

const errors = [];
let passed = 0;
function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { errors.push(`${name} ${extra}`); console.log(`  ✗ ${name} ${extra}`); }
}

const browser = await chromium.launch({
  executablePath: EXE, headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
});
const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const worldToScreen = async (wx, wy) => {
  const box = await page.locator('canvas.editor-canvas').boundingBox();
  const v = await page.evaluate(() => window.__viewState
    ? { zoom: window.__viewState().zoom, panX: window.__viewState().panX, panY: window.__viewState().panY }
    : { zoom: 1, panX: 40, panY: 40 });
  return { x: box.x + wx * v.zoom + v.panX, y: box.y + wy * v.zoom + v.panY };
};

// ---------- 1. 方案管理 ----------
console.log('\n[1] 方案管理(种子数据)');
await page.goto(BASE);
await page.waitForSelector('.grid-cards .card');
check('种子方案存在', (await page.locator('.grid-cards .card h3').first().textContent()).includes('春日序曲'));
await page.screenshot({ path: `${SHOTS}/01-projects.png` });

// ---------- 2. 进入编辑器,画布渲染 ----------
console.log('\n[2] 编辑器与 Canvas2D 渲染');
await page.locator('button.primary', { hasText: '进入编辑' }).click();
await page.waitForSelector('canvas.editor-canvas');
await page.waitForTimeout(600);
const shapeCount = () => page.evaluate(() => window.__store.state.draft.shapes.length);
check('种子 3 个图元', (await shapeCount()) === 3, `got ${await shapeCount()}`);
await page.screenshot({ path: `${SHOTS}/02-editor.png` });

// ---------- 3. 钢笔工具画闭合路径 ----------
console.log('\n[3] 钢笔自由路径 + 角度吸附');
// 先单测 H/V/45° 角度吸附纯函数
const snapCase = await page.evaluate(async () => {
  const { snapAngle } = await import('/src/lib/snapping.js');
  const origin = { x: 0, y: 0 };
  const nearH = snapAngle(50, 2, origin.x, origin.y);   // 接近水平
  const nearV = snapAngle(2, 50, origin.x, origin.y);   // 接近垂直
  const near45 = snapAngle(50, 52, origin.x, origin.y); // 接近 45°
  const far = snapAngle(50, 25, origin.x, origin.y);    // ~26.6°,不吸附
  return {
    horizontal: Math.abs(nearH.y) < 0.01,
    vertical: Math.abs(nearV.x) < 0.01,
    diag45: Math.abs(near45.x - near45.y) < 0.5,
    untouched: far.x === 50 && far.y === 25
  };
});
check('角度吸附:水平/垂直/45°/不吸附', Object.values(snapCase).every(Boolean), JSON.stringify(snapCase));
await page.locator('.toolbar button', { hasText: '钢笔' }).click();
const pts = [[60, 60], [120, 55], [150, 110], [110, 150], [55, 120]];
for (const [x, y] of pts) {
  const p = await worldToScreen(x, y);
  await page.mouse.click(p.x, p.y);
}
// 回车闭合(比双击更确定,避免双击首击重复加锚点)
await page.keyboard.press('Enter');
await page.waitForTimeout(300);
check('钢笔生成新图元', (await shapeCount()) === 4, `got ${await shapeCount()}`);
const penShape = await page.evaluate(() => {
  const s = window.__store.state.draft.shapes.at(-1);
  return { closed: s.closed, nodes: s.points.length, name: s.name };
});
check('钢笔路径闭合且节点保留', penShape.closed === true && penShape.nodes >= 5, JSON.stringify(penShape));

// ---------- 4. 节点增删 / 直曲互转 ----------
console.log('\n[4] 节点编辑');
await page.locator('.toolbar button', { hasText: '节点' }).click();
// 选中钢笔画的最后一个图元
await page.evaluate(() => {
  const s = window.__store;
  const id = s.state.draft.shapes.at(-1).id;
  s.setSelection({ shapeIds: [id], activeShapeId: id, nodeIndex: null });
});
const before = await page.evaluate(() => window.__store.state.draft.shapes.at(-1).points.length);
// 点第一条直线段的真实中点
const segMid = await page.evaluate(() => {
  const sh = window.__store.state.draft.shapes.at(-1);
  const a = sh.points[0], c = sh.points[1];
  return { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2 };
});
const midP = await worldToScreen(segMid.x, segMid.y);
await page.mouse.click(midP.x, midP.y);
await page.waitForTimeout(250);
const after = await page.evaluate(() => window.__store.state.draft.shapes.at(-1).points.length);
check('点击线段插入节点', after === before + 1, `${before} -> ${after}`);
await page.locator('button', { hasText: '转曲线段' }).click();
await page.waitForTimeout(150);
const isCurve = await page.evaluate(() => {
  const s = window.__store.state.draft.shapes.at(-1);
  const i = window.__store.state.selection.nodeIndex;
  return s.points[i].seg === 'C' && !!s.points[i].out;
});
check('直线段转曲线段并生成手柄', isCurve);
await page.locator('button', { hasText: '转直线段' }).click();
const isLine = await page.evaluate(() => {
  const s = window.__store.state.draft.shapes.at(-1);
  return s.points[window.__store.state.selection.nodeIndex].seg === 'L';
});
check('曲线段转回直线段', isLine);
const delBefore = await page.evaluate(() => window.__store.state.draft.shapes.at(-1).points.length);
await page.locator('button.danger', { hasText: '删除该节点' }).click();
await page.waitForTimeout(150);
const delAfter = await page.evaluate(() => window.__store.state.draft.shapes.at(-1).points.length);
check('删除节点', delAfter === delBefore - 1);

// ---------- 5. 布尔运算 ----------
console.log('\n[5] 布尔运算(并差交异或 + 去重叠)');
await page.locator('.toolbar button', { hasText: '选择' }).click();

// 5a. 框选交互单独验证:在空白区域新建两个已知位置的矩形,精确框选
const mq = await page.evaluate(async () => {
  const geo = await import('/src/lib/geometry.js');
  const s = window.__store;
  const r1 = geo.makeRectShape(330, 240, 40, 40);
  const r2 = geo.makeRectShape(380, 240, 40, 40);
  s.addShapes([r1, r2]);
  return { ids: [r1.id, r2.id] };
});
const q1 = await worldToScreen(305, 215);
const q2 = await worldToScreen(405, 265);
await page.mouse.move(q1.x, q1.y);
await page.mouse.down();
await page.mouse.move(q2.x, q2.y, { steps: 6 });
await page.mouse.up();
await page.waitForTimeout(200);
const mqSel = await page.evaluate(() => window.__store.state.selection.shapeIds);
check('框选完整包含的两个图元', mqSel.length === 2 && mq.ids.every((id) => mqSel.includes(id)), `got ${mqSel.length}`);
// 删除这两个测试矩形,回到原状态
await page.keyboard.press('Delete');
await page.waitForTimeout(150);

// 5b. 布尔运算:让两片叶子真实重叠后再运算(种子叶子初始不相交)
await page.evaluate(() => {
  const s = window.__store;
  const leaves = s.state.draft.shapes.filter((x) => x.name.startsWith('尤加利叶'));
  // 把第二片叶子平移到与第一片大面积重叠
  if (leaves.length === 2) s.translateShapes(new Set([leaves[1].id]), -30, 10);
  const ids = leaves.map((x) => x.id);
  s.setSelection({ shapeIds: ids, activeShapeId: ids[0], nodeIndex: null });
});
const selN = await page.evaluate(() => window.__store.state.selection.shapeIds.length);
check('选中两个重叠叶片做布尔', selN === 2, `got ${selN}`);
const n0 = await shapeCount();
await page.locator('.boolean-bar button', { hasText: '并集' }).click();
await page.waitForTimeout(300);
const unionInfo = await page.evaluate(() => {
  const made = window.__store.state.draft.shapes.filter((x) => x.name.includes('并集'));
  return { count: window.__store.state.draft.shapes.length, made: made.length, editable: made.every((m) => m.points.length >= 3) };
});
check('并集替换原对象且结果保留可编辑节点', unionInfo.count === n0 - 1 && unionInfo.made >= 1 && unionInfo.editable, JSON.stringify(unionInfo));
// 撤销并集,再测其余运算
await page.keyboard.press('Control+z');
await page.waitForTimeout(200);
check('撤销布尔', (await shapeCount()) === n0);
for (const op of ['差集', '交集', '异或']) {
  await page.evaluate(() => {
    const s = window.__store;
    const ids = s.state.draft.shapes.filter((x) => x.name.startsWith('尤加利叶')).map((x) => x.id);
    s.setSelection({ shapeIds: ids, activeShapeId: ids[0], nodeIndex: null });
  });
  await page.locator('.boolean-bar button', { hasText: op }).first().click();
  await page.waitForTimeout(250);
  const ok = await page.evaluate((o) => window.__store.state.draft.shapes.some((s) => s.name.includes(o)), op);
  check(`${op}运算`, ok);
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(150);
}
// 去重叠
await page.evaluate(() => {
  const s = window.__store;
  const ids = s.state.draft.shapes.filter((x) => x.name.startsWith('尤加利叶')).map((x) => x.id);
  s.setSelection({ shapeIds: ids, activeShapeId: ids[0], nodeIndex: null });
});
await page.locator('button', { hasText: '去重叠' }).click();
await page.waitForTimeout(300);
const deover = await page.evaluate(() => window.__store.state.draft.shapes.some((s) => s.name.includes('去重叠')));
check('重叠叶片去重叠边', deover);
await page.keyboard.press('Control+z');

// ---------- 6. 撤销重做 ≥50 步 ----------
console.log('\n[6] 历史栈(50+ 步)');
const depth = await page.evaluate(async () => {
  const { makeLeafShape } = await import('/src/lib/geometry.js');
  const s = window.__store;
  for (let i = 0; i < 60; i++) s.addShape(makeLeafShape(300 + (i % 5) * 4, 60 + i * 3, 20, 10), false);
  return s.state.historyDepth;
});
check('连续 60 步入栈', depth >= 60, `depth=${depth}`);
const beforeUndo = await shapeCount();
for (let i = 0; i < 55; i++) await page.keyboard.press('Control+z');
await page.waitForTimeout(300);
const afterUndo = await shapeCount();
check('连撤 55 步', afterUndo === beforeUndo - 55, `${beforeUndo} -> ${afterUndo}`);
check('撤销计数正确', await page.evaluate(() => window.__store.state.redoDepth >= 55));
for (let i = 0; i < 55; i++) await page.keyboard.press('Control+y');
await page.waitForTimeout(300);
check('重做 55 步恢复', (await shapeCount()) === beforeUndo);

// ---------- 7. 图层分组与锁定 ----------
console.log('\n[7] 图层树');
const layers0 = await page.evaluate(() => window.__store.state.draft.layers.length);
await page.locator('.side-head button', { hasText: '分组' }).click();
const layers1 = await page.evaluate(() => window.__store.state.draft.layers.length);
check('新建图层分组', layers1 === layers0 + 1);
const lockWorks = await page.evaluate(() => {
  const s = window.__store;
  const id = s.state.draft.shapes[0].id;
  s.snapshot();
  s.setSelection({ shapeIds: [id], activeShapeId: id, nodeIndex: null });
  s.mutateSelectedShapes((x) => { x.locked = true; });
  return s.state.draft.shapes.find((x) => x.id === id).locked;
});
check('图元可锁定', lockWorks);
await page.screenshot({ path: `${SHOTS}/03-editor-tools.png` });

// 7b. 移动对齐吸附与参考线
console.log('\n[7b] 对象对齐吸附 + 移动参考线');
await page.evaluate(() => {
  const s = window.__store;
  const id = s.state.draft.shapes[0].id;
  s.setSelection({ shapeIds: [id], activeShapeId: id, nodeIndex: null });
});
const guideShape = await page.evaluate(async () => {
  const geo = await import('/src/lib/geometry.js');
  const snap = await import('/src/lib/snapping.js');
  const d = window.__store.state.draft;
  const target = d.shapes[0];
  const others = d.shapes.slice(1);
  const b = geo.shapeBounds(target);
  const ref = geo.shapeBounds(others[0]);
  // 移动包围盒的左边缘比参考对象左边缘只差 3px(在 6px 阈值内),应触发垂直吸附+参考线
  const moving = { ...b, minX: ref.minX - 3, maxX: ref.minX - 3 + b.width, cx: ref.minX - 3 + b.width / 2 };
  const r = snap.snapBounds(moving, others, new Set([target.id]));
  return { snapped: Math.abs(r.dx) > 0, hasGuide: r.guides.length > 0, guideOrient: r.guides[0]?.orient, dx: r.dx };
});
check('移动时边距吸附并生成参考线', guideShape.snapped && guideShape.hasGuide && guideShape.guideOrient === 'v', JSON.stringify(guideShape));

// ---------- 8. SVG 导出(保留分组/命名/编号) ----------
console.log('\n[8] SVG 刀版导出');
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.locator('button', { hasText: '导出 SVG 刀版' }).click()
]);
const svgPath = await download.path();
const svg = await (await import('node:fs/promises')).readFile(svgPath, 'utf8');
check('SVG 含图层 g 分组', svg.includes('data-type="layer"'));
check('SVG 图元带命名', svg.includes('data-name='));
check('SVG 保留花材编号', svg.includes('data-material-code="LF-012"'));
check('SVG 含刀版尺寸标注 mm', svg.includes('mm') && svg.includes('data-width-mm'));
check('SVG 含 path 刀线路径', svg.includes('<path d="M'));

// ---------- 9. 提交两个版本 ----------
console.log('\n[9] 版本提交');
await page.locator('button.primary', { hasText: '提交新版本' }).click();
await page.locator('.modal textarea').fill('首版:两片叶 + 花瓣');
await page.locator('.modal button.primary', { hasText: '确认提交' }).click();
await page.waitForTimeout(300);
// 再改一点,提交 v2
await page.evaluate(() => {
  const s = window.__store;
  s.snapshot();
  s.mutateSelectedShapes; // noop 防 tree-shake
  const shp = s.state.draft.shapes.find((x) => x.materialCode === 'PT-007');
  if (shp) shp.fill = '#d4567f';
});
await page.locator('button.primary', { hasText: '提交新版本' }).click();
await page.waitForSelector('.modal');
await page.locator('.modal textarea').fill('二版:花瓣改色');
await page.locator('.modal button.primary', { hasText: '确认提交' }).click();
await page.waitForTimeout(300);
const vCount = await page.evaluate(() => window.__store.activeProject().versions.length);
check('生成两个版本', vCount === 2, `got ${vCount}`);
// 编辑器内差异叠加(右侧面板的 .diff-select,index 1 = 第一个版本)
await page.selectOption('.diff-select', { index: 1 });
await page.waitForTimeout(300);
check('编辑器可叠加旧版差异', (await page.locator('.diff-banner').count()) === 1);
await page.locator('.diff-banner button', { hasText: '退出对比' }).click();

// ---------- 10. 版本审核:批注/回复/清零/定稿拦截 ----------
console.log('\n[10] 版本审核全链路');
await page.locator('nav button', { hasText: '版本审核' }).click();
await page.waitForSelector('.version-chip');
const chips = await page.locator('.version-chip').count();
check('审核页列出两版', chips === 2);
// 打点批注
await page.locator('.toolbar button', { hasText: '打点批注' }).click();
const ap = await worldToScreen(120, 150);
await page.mouse.click(ap.x, ap.y);
await page.waitForSelector('textarea[placeholder*="叶子"]');
await page.locator('textarea[placeholder*="叶子"]').fill('这片叶子再窄 5mm');
await page.locator('button.primary', { hasText: '提交批注' }).click();
await page.waitForTimeout(300);
check('打点批注出现', (await page.locator('.ann-card').count()) >= 1);
// 圈选批注
await page.locator('.toolbar button', { hasText: '圈选区域' }).click();
const ring = [[200, 100], [280, 100], [280, 200], [200, 200]];
for (const [x, y] of ring) {
  const p = await worldToScreen(x, y);
  await page.mouse.click(p.x, p.y);
}
const dc = await worldToScreen(200, 100);
await page.mouse.dblclick(dc.x, dc.y);
await page.waitForSelector('textarea[placeholder*="叶子"]');
await page.locator('textarea[placeholder*="叶子"]').fill('圈出的区域弧度要更饱满');
await page.locator('button.primary', { hasText: '提交批注' }).click();
await page.waitForTimeout(300);
check('圈选区域批注', (await page.locator('.ann-card').count()) >= 2);
// 定稿按钮应禁用
const finDisabled = await page.locator('button.primary[title*="批注未清零"]').isDisabled();
check('批注未清零禁止定稿', finDisabled);
// 逐条回复 + 清零
const cards = page.locator('.ann-card');
const n = await cards.count();
for (let i = 0; i < n; i++) {
  const card = cards.nth(i);
  await card.locator('textarea').fill('已按要求调整,请复核');
  await card.locator('button.primary', { hasText: '回复' }).click();
  await page.waitForTimeout(150);
  await card.locator('button', { hasText: '标记已清零' }).click();
  await page.waitForTimeout(150);
}
check('批注全部清零', await page.evaluate(() => {
  const v = window.__store.activeProject().versions.at(-1);
  return v.doc.annotations.every((a) => a.status === 'resolved');
}));
await page.screenshot({ path: `${SHOTS}/04-review.png` });
// 定稿
await page.locator('button.primary', { hasText: '标记定稿' }).click();
await page.waitForTimeout(300);
const finalized = await page.evaluate(() => {
  const p = window.__store.activeProject();
  return p.finalVersionId === p.versions.at(-1).id;
});
check('清零后可定稿', finalized);
// 版本叠加对比
await page.selectOption('.toolbar select', { index: 1 });
await page.waitForTimeout(300);
check('审核页版本叠加下拉可用', (await page.locator('.tag.amber', { hasText: '橙色虚线' }).count()) === 1);

// ---------- 11. 客户档案 ----------
console.log('\n[11] 客户档案');
await page.locator('nav button', { hasText: '客户档案' }).click();
await page.waitForSelector('table.data');
const rows0 = await page.locator('table.data tbody tr').count();
await page.locator('button.primary', { hasText: '新增客户' }).click();
await page.locator('.modal input').nth(0).fill('莳光花礼');
await page.locator('.modal input').nth(1).fill('陆家嘴 IFC 店');
await page.locator('.modal input').nth(2).fill('周经理');
await page.locator('.modal input').nth(3).fill('021-5012-8899');
await page.locator('.modal textarea').fill('七夕主题,提前 3 天交付');
await page.locator('.modal button.primary', { hasText: '保存' }).click();
await page.waitForTimeout(300);
const rows1 = await page.locator('table.data tbody tr').count();
check('客户登记(门店/联系人/备注)', rows1 === rows0 + 1);
await page.screenshot({ path: `${SHOTS}/05-clients.png` });

// ---------- 12. Babylon 3D 预览 ----------
console.log('\n[12] Babylon.js 三维预览');
await page.locator('nav button', { hasText: '方案编辑' }).click();
await page.waitForSelector('.babylon-canvas');
await page.waitForTimeout(2500);
const gl = await page.locator('.babylon-canvas').evaluate((el) => {
  const c = el.getContext('webgl2') || el.getContext('webgl');
  return c ? { w: el.width, h: el.height } : null;
});
check('Babylon WebGL 画布就绪', !!gl && gl.w > 0, JSON.stringify(gl));
const meshN = await page.evaluate(() => window.__fvsBab ? window.__fvsBab.scene.meshes.length : 0);
check('花束图元拉伸为 3D Mesh', meshN >= 3, `meshes=${meshN}`);
// 拖拽旋转相机不报错
const bb = await page.locator('.babylon-canvas').boundingBox();
await page.mouse.move(bb.x + 150, bb.y + 120);
await page.mouse.down();
await page.mouse.move(bb.x + 60, bb.y + 80, { steps: 8 });
await page.mouse.up();
await page.waitForTimeout(500);
await page.screenshot({ path: `${SHOTS}/06-babylon-3d.png` });

// ---------- 13. 持久化 ----------
console.log('\n[13] localStorage 持久化');
const persisted = await page.evaluate(() => {
  const raw = localStorage.getItem('fvs.projects.v1');
  const d = JSON.parse(raw);
  return { projects: d.projects.length, clients: d.clients.length, versions: d.projects[0].versions.length };
});
check('方案/版本/客户均已持久化', persisted.projects >= 1 && persisted.clients >= 2 && persisted.versions >= 2, JSON.stringify(persisted));
await page.reload();
await page.waitForSelector('.grid-cards .card');
const afterReload = await page.evaluate(() => JSON.parse(localStorage.getItem('fvs.projects.v1')).clients.length);
check('刷新后数据保留', afterReload >= 2);

// ---------- 汇总 ----------
console.log(`\n结果:${passed} 项通过,${errors.length} 项失败`);
if (errors.length) {
  console.log('\n失败/错误:');
  for (const e of errors.slice(0, 20)) console.log(' - ' + e);
}
await browser.close();
process.exit(errors.length ? 1 : 0);
