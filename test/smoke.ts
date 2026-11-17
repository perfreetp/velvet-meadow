// 核心算法冒烟测试：node --import tsx 不需要，直接用 vite 的 SSR 加载 TS
import { VoxelGrid, brushCoords, applyVoxelEdit } from '../src/core/VoxelGrid';
import { buildMesh } from '../src/core/Mesher';
import { fillFromBoreholes } from '../src/core/BoreholeFiller';
import { editWithMirror, expandMirror } from '../src/core/Mirror';
import { copyBox, pasteClipboard, translateBox, normalizeBox } from '../src/core/Clipboard';
import { buildProfile } from '../src/core/Section';
import { exportGLB, exportOBJ, exportColorTable, buildDeliveryZip } from '../src/core/Exporters';
import { isoProject, screenToRay, raycastVoxel } from '../src/core/Isometric';
import type { Borehole } from '../src/types';

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

// 1. 网格读写 + 计数
const g = new VoxelGrid(8, 8, 8, 1);
g.set(0, 0, 0, 1);
g.set(7, 7, 7, 2);
check('越界 set 被忽略', g.get(99, 0, 0) === 0);
check('体素计数', g.countVoxels() === 2);

// 2. 单个实体格 -> 6 个面、12 个三角形
const g2 = new VoxelGrid(4, 4, 4, 1);
g2.set(1, 1, 1, 3);
const m1 = buildMesh(g2);
check('单格产生 6 面', m1.faces.length === 6, `实际 ${m1.faces.length}`);
check('三角面数 = 面数×2', m1.triangles === 12);
check('所有面材质正确', m1.faces.every((f) => f.materialId === 3));
const normals = new Set(m1.faces.map((f) => f.normal.join(',')));
check('六个朝向齐全', normals.size === 6);

// 3. 内部面剔除 + 贪心合面：2×1×1 相邻两格，共享面剔除后外包络合并为 6 面
const g3 = new VoxelGrid(4, 4, 4, 1);
g3.set(1, 1, 1, 1);
g3.set(2, 1, 1, 1);
const m2 = buildMesh(g3);
check('相邻格剔除内部面并贪心合并（6 面）', m2.faces.length === 6, `实际 ${m2.faces.length}`);

// 4. 顶面合并为 1 个 3×1 大矩形（x 方向跨度 2 格 → 顶点跨度 2）
const topFaces = m2.faces.filter((f) => f.normal.join(',') === '0,0,1');
check('同向同材质贪心合并为单矩形', topFaces.length === 1 && topFaces[0].vertices.length === 4);
const widths = topFaces[0].vertices.map((v) => v.x);
check('合并矩形 x 跨度为 2', Math.max(...widths) - Math.min(...widths) === 2);

// 5. 不同材质不合并：共享面两侧都保留（6+6-2=10），且接触面材质分别正确
const g4 = new VoxelGrid(4, 4, 4, 1);
g4.set(1, 1, 1, 1);
g4.set(2, 1, 1, 2);
const m3 = buildMesh(g4);
check('异材质相邻保留接触面（10 面）', m3.faces.length === 10, `实际 ${m3.faces.length}`);
const contact1 = m3.faces.filter((f) => f.materialId === 1 && f.normal.join(',') === '1,0,0');
const contact2 = m3.faces.filter((f) => f.materialId === 2 && f.normal.join(',') === '-1,0,0');
check('接触面两侧材质各自正确', contact1.length === 1 && contact2.length === 1);

// 6. 实心 2×2×2 块 = 6 大面（每面 2×2 合并）
const g5 = new VoxelGrid(4, 4, 4, 1);
for (let x = 0; x < 2; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) g5.set(x, y, z, 1);
const m4 = buildMesh(g5);
check('实心块合并为 6 面', m4.faces.length === 6, `实际 ${m4.faces.length}`);
check('实心块 12 三角形', m4.triangles === 12);

// 7. 笔刷
const single = brushCoords('single', { x: 3, y: 3, z: 3 }, 2);
check('单格笔刷 1 点', single.length === 1);
const sphere = brushCoords('sphere', { x: 4, y: 4, z: 4 }, 1);
check('球形笔刷 r=1 含 7 格', sphere.length === 7, `实际 ${sphere.length}`);
const rect = brushCoords('rect', { x: 4, y: 4, z: 4 }, 1);
check('矩形笔刷 r=1 含 27 格', rect.length === 27);

// 8. 镜像
const g6 = new VoxelGrid(8, 8, 4, 1);
editWithMirror(g6, [{ x: 0, y: 2, z: 0 }], 5, true, false);
check('X 镜像同步写入', g6.get(0, 2, 0) === 5 && g6.get(7, 2, 0) === 5);
editWithMirror(g6, [{ x: 1, y: 0, z: 0 }], 6, false, true);
check('Y 镜像同步写入', g6.get(1, 0, 0) === 6 && g6.get(1, 7, 0) === 6);
editWithMirror(g6, [{ x: 0, y: 0, z: 0 }], 7, true, true);
check('双镜像四象限', g6.get(0, 0, 0) === 7 && g6.get(7, 0, 0) === 7 && g6.get(0, 7, 0) === 7 && g6.get(7, 7, 0) === 7);
const expanded = expandMirror(g6, [{ x: 1, y: 1, z: 0 }], true, true);
check('双镜像展开 4 点去重', expanded.length === 4);

// 9. 钻孔 IDW 填充
const g7 = new VoxelGrid(16, 16, 12, 1);
const boreholes: Borehole[] = [
  { id: 'a', name: 'ZK01', x: 2, y: 8, elevation: 12, layers: [{ depth: 3, materialId: 1 }, { depth: 7, materialId: 2 }, { depth: 11, materialId: 3 }] },
  { id: 'b', name: 'ZK02', x: 13, y: 8, elevation: 12, layers: [{ depth: 4, materialId: 1 }, { depth: 8, materialId: 2 }, { depth: 11, materialId: 3 }] }
];
const fill = fillFromBoreholes(g7, boreholes);
check('IDW 填充覆盖全部列', fill.columns === 16 * 16, `实际 ${fill.columns}`);
check('IDW 填充产生体素', fill.filled > 0);
check('钻孔正下方第一层材质', g7.get(2, 8, 0) === 1);
check('钻孔正下方深层材质', g7.get(2, 8, 10) === 3);
check('中部列也被插值填充', g7.get(8, 8, 0) === 1);

// 10. 剪贴板复制/粘贴/平移
const g8 = new VoxelGrid(8, 8, 8, 1);
g8.set(1, 1, 1, 4);
g8.set(2, 1, 1, 4);
const box = normalizeBox({ x: 1, y: 1, z: 1 }, { x: 2, y: 1, z: 1 });
const clip = copyBox(g8, box);
check('复制得到 2 个实体格', clip.cells.length === 2);
const pasted = pasteClipboard(g8, clip, { x: 4, y: 4, z: 4 });
check('粘贴 2 格', pasted === 2 && g8.get(4, 4, 4) === 4 && g8.get(5, 4, 4) === 4);
translateBox(g8, box, 0, 2, 0);
check('平移后原位清空', g8.get(1, 1, 1) === 0 && g8.get(2, 1, 1) === 0);
check('平移后新位有值', g8.get(1, 3, 1) === 4 && g8.get(2, 3, 1) === 4);

// 11. 剖面分析
const g9 = new VoxelGrid(10, 10, 8, 1);
for (let x = 0; x < 10; x++) {
  g9.set(x, 5, 0, 1);
  g9.set(x, 5, 1, 1);
  g9.set(x, 5, 2, 2);
}
const mats = [
  { id: 1, name: '黏土', color: '#c9a86a', pattern: '' },
  { id: 2, name: '砂岩', color: '#9d9489', pattern: '' }
];
const profile = buildProfile(g9, { id: 's', name: 'L1', points: [{ x: 0, y: 5 }, { x: 9, y: 5 }] }, mats);
check('剖面采样列数 ≈ 长度', profile.columns.length >= 9);
check('最大深度 3m', profile.maxDepth === 3);
check('层厚表含 2 类材质', profile.thickness.length === 2);
const clay = profile.thickness.find((t) => t.materialId === 1)!;
check('黏土层厚 2m', clay.avgThick === 2 && clay.minThick === 2 && clay.maxThick === 2);

// 12. DDA 射线拾取
const g10 = new VoxelGrid(8, 8, 8, 1);
g10.set(2, 2, 2, 9);
const t = { scale: 20, ox: 200, oy: 200 };
// 把该格中心投影回屏幕，再反投影为射线，应命中
const center = isoProject(2.5, 2.5, 2.5, t);
const ray = screenToRay(center.x, center.y, t, 8);
const hit = raycastVoxel(g10, ray);
check('DDA 射线命中实体格', !!hit && hit.coord.x === 2 && hit.coord.y === 2 && hit.coord.z === 2, hit ? JSON.stringify(hit.coord) : '未命中');
const rayMiss = screenToRay(5, 5, t, 8);
check('空格射线返回 null', raycastVoxel(g10, rayMiss) === null);

// 13. 导出
const mesh = buildMesh(g5);
const glb = exportGLB(mesh, mats.length ? [{ ...mats[0], id: 1 }] : [], 'test');
check('GLB 魔数正确', new Uint8Array(await glb.arrayBuffer())[0] === 0x67);
const glbBytes = new Uint8Array(await glb.arrayBuffer());
const magic = String.fromCharCode(...glbBytes.slice(0, 4));
check('GLB 头 glTF', magic === 'glTF');
const { obj, mtl } = exportOBJ(mesh, [{ id: 1, name: '黏土', color: '#c9a86a', pattern: '' }], 'test');
const objText = await obj.text();
check('OBJ 含顶点与面', objText.includes('v ') && objText.includes('f ') && objText.includes('usemtl'));
check('MTL 含 newmtl', (await mtl.text()).includes('newmtl'));
const csv = exportColorTable(mats, g9);
const csvText = await csv.text();
check('CSV 含表头与材质', csvText.includes('材质ID') && csvText.includes('黏土'));
const zip = await buildDeliveryZip([{ name: 'a.txt', blob: new Blob(['hello'], { type: 'text/plain' }) }]);
check('ZIP 生成且非空', zip.size > 30);
const zipBytes = new Uint8Array(await zip.arrayBuffer());
check('ZIP 本地头魔数', zipBytes[0] === 0x50 && zipBytes[1] === 0x4b);

// 14. base64 往返
const b64 = g5.toBase64();
const restored = VoxelGrid.fromBase64(b64, 4, 4, 4, 1);
check('base64 序列化往返一致', restored.data.every((v, i) => v === g5.data[i]));

// 15. applyVoxelEdit 擦除
const changed = applyVoxelEdit(g2, [{ x: 1, y: 1, z: 1 }], 0);
check('擦除返回旧值', changed.size === 1 && g2.get(1, 1, 1) === 0);

console.log(`\n结果：${pass} 通过 / ${fail} 失败`);
if (fail > 0) process.exit(1);
