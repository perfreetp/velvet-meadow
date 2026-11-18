// 确定性验证:同参数+同种子 => 完全一致;换种子 => 变化;锁定段重生成后形态不变。
// 运行:node scripts/verify.mjs
import { generateNetwork } from '../dist/generator.js';
import { DEFAULT_PARAMS } from '../dist/types.js';

const P = { ...DEFAULT_PARAMS, seed: 42, mainDirection: 10, bifurcationAngle: 40, branchDensity: 3, capillaryDensity: 5, meanderAmp: 25 };

const a = generateNetwork(P);
const b = generateNetwork(P);
const c = generateNetwork({ ...P, seed: 43 });

const sig = (n) => JSON.stringify(n.segments.map((s) => [s.id, s.points, s.widths]));

let ok = true;
const check = (name, cond) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) ok = false;
};

check('同参数+同种子 => 几何完全一致', sig(a) === sig(b));
check('换种子 => 网络变化', sig(a) !== sig(c));
check('三级结构齐全', a.stats.counts[0] > 0 && a.stats.counts[1] > 0 && a.stats.counts[2] > 0);
check('宽度自沟口向沟头衰减', a.segments.every((s) => s.widths[s.widths.length - 1] <= s.widths[0] + 1e-9));

// 锁定段:改主沟走向后整体重生成,锁定段形态不变
const locked = a.segments.filter((s) => s.id === 'M.1').map((s) => ({ ...s, locked: true, custom: true }));
check('测试用锁定段存在', locked.length === 1);
const regen = generateNetwork({ ...P, mainDirection: 35 }, locked);
const kept = regen.segments.find((s) => s.id === 'M.1');
check('重生成后锁定段仍在', !!kept);
check('锁定段形态不变', kept && JSON.stringify(kept.points) === JSON.stringify(locked[0].points));
check('锁定段已接回新网络(parentId 有效)', kept && (kept.parentId === null || regen.segments.some((s) => s.id === kept.parentId)));
const links = regen.segments.filter((s) => s.id.includes('#link'));
console.log(`      连接段数量: ${links.length}`);
console.log(`      统计: 主干 ${a.stats.counts[0]} 支沟 ${a.stats.counts[1]} 毛细沟 ${a.stats.counts[2]},总长 ${(a.stats.totalLength / 1000).toFixed(2)} km,密度 ${a.stats.density.toFixed(2)} km/km²`);

process.exit(ok ? 0 : 1);
