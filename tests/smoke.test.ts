// 不依赖 DOM 的端到端逻辑冒烟：store 历史 + 评分 + 种子数据
import { DocumentStore } from '../src/core/store';
import { buildSeedData } from '../src/core/seed';
import { autoScore } from '../src/core/scoring';
import { booleanOp } from '../src/core/boolean';
import { uid } from '../src/core/math2d';

let pass = 0, fail = 0;
const ok = (n: string, c: boolean, e='') => { c ? (pass++, console.log('  ✓', n)) : (fail++, console.error('  ✗', n, e)); };

const seed = await buildSeedData();
const ex = seed.exercises[0];

// 学员从零补齐：载入模板，模拟把参考轮廓放回去
const store = new DocumentStore(JSON.parse(JSON.stringify(ex.template)));
ok('模板载入后无闭合路径', Object.values(store.doc.paths).every(p => !p.closed));
const before = autoScore(store.doc, ex);
ok('缺口状态自动分较低', before.closure < 40, `closure=${before.closure}`);

// 补齐
for (const [pid, ref] of Object.entries(ex.referencePaths)) {
  store.doc.paths[pid] = JSON.parse(JSON.stringify(ref));
}
const after = autoScore(store.doc, ex);
ok('补齐后闭合度满分', after.closure === 40, `got ${after.closure}`);

// 撤销重做链路（在补齐文档上做编辑）
const hist0 = Object.keys(store.doc.paths).length;
store.addLayer('测试层');
ok('加图层可撤销', store.canUndo);
store.undo();
ok('撤销移除图层', store.doc.layers.length === 1);
store.redo();
ok('重做恢复图层', store.doc.layers.length === 2);
void hist0;

// 图层锁定后不可编辑判定
const locked = store.doc.layers[0];
locked.locked = true;
ok('锁定层不可编辑', !store.isPathEditable(locked.pathIds[0]));
locked.locked = false;
ok('解锁后可编辑', store.isPathEditable(locked.pathIds[0]));

// 布尔运算在补齐的真实槽型上不崩溃
const paths = Object.values(store.doc.paths).filter(p => p.closed);
ok('存在闭合轮廓', paths.length >= 1);

// 构造第二个相交矩形验证布尔链路
function rect(x0:number,y0:number,x1:number,y1:number) {
  const pts=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]] as [number,number][];
  const anchors=pts.map(([x,y])=>({id:uid('a'),x,y}));
  const segs=anchors.map((a,i)=>{const b=anchors[(i+1)%4];return {id:uid('s'),type:'line' as const,a:a.id,b:b.id};});
  return {id:uid('path'),name:'r',anchors,segs,color:'#fff',closed:true};
}
const r1 = rect(20,30,50,45), r2 = rect(40,35,70,50);
const u = booleanOp(r1,r2,'union');
const d = booleanOp(r1,r2,'difference');
const i = booleanOp(r1,r2,'intersection');
ok('并集有结果', u.paths.length>=1 && u.intersections.length===2);
ok('差集有结果', d.paths.length>=1);
ok('交集有结果', i.paths.length>=1);
ok('结果轮廓边锚点一致', i.paths.every(p=>p.segs.length===p.anchors.length));

console.log(`\n冒烟结果：${pass} 通过，${fail} 失败`);
if (fail) process.exit(1);
