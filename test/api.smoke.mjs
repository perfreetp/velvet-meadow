// 端到端工作流冒烟：角色权限 / 三态流转 / 退回轮次 / 公示批注 / 统计回传
const BASE = 'http://localhost:8787';

async function call(method, path, role, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', 'x-role': role },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  return { status: res.status, data };
}

const assert = (cond, msg) => {
  if (!cond) { console.error('✖ ' + msg); process.exitCode = 1; }
  else console.log('✔ ' + msg);
};

const scene = {
  buildings: [{ id: 'b1', floors: 2, polygon: [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }] }],
  lights: [],
  bounds: { minX: 0, minY: 0, maxX: 40, maxY: 30 },
};

// 1. 公众不能建方案
let r = await call('POST', '/api/plans', 'public', { name: 'x', scene });
assert(r.status === 403, '公众不能新建方案');

// 2. 规划员建草稿
r = await call('POST', '/api/plans', 'planner', { name: '南市河沿街布光方案', district: '南市历史街区', scene });
assert(r.status === 201 && r.data.round === 1, '规划员建草稿，初始轮次=1');
const pid = r.data.id;

// 3. 审查人不能改草稿
r = await call('PUT', `/api/plans/${pid}`, 'reviewer', { name: 'hack' });
assert(r.status === 403, '审查人不能编辑草稿');

// 4. 送审（轮次 1→2）
r = await call('POST', `/api/plans/${pid}/transition`, 'planner', { to: 'submitted' });
assert(r.status === 200 && r.data.status === 'submitted' && r.data.round === 2, '草稿送审，轮次+1');

// 5. 送审后编辑被拒
r = await call('PUT', `/api/plans/${pid}`, 'planner', { scene });
assert(r.status === 409, '送审中编辑返回 409');

// 6. 审查退回，自动回草稿，意见带轮次 2
r = await call('POST', `/api/plans/${pid}/reviews`, 'reviewer', {
  outcome: 'reject', comment: '12号院门口照度不足20lx，请补庭院灯', reviewer: '张工',
});
assert(r.status === 201 && r.data.round === 2, '退回意见记录轮次=2');
r = await call('GET', `/api/plans/${pid}`, 'planner');
assert(r.data.status === 'draft', '退回后方案自动回到草稿');

// 7. 重新送审（轮次 2→3），本轮无退回 → 可公示
r = await call('POST', `/api/plans/${pid}/transition`, 'planner', { to: 'submitted' });
assert(r.data.round === 3 && r.data.status === 'submitted', '修改后重新送审，轮次=3');

// 7b. 同轮退回后不能直接公示
await call('POST', `/api/plans/${pid}/reviews`, 'reviewer', {
  outcome: 'reject', comment: '仍需调整色温', reviewer: '张工',
});
r = await call('POST', `/api/plans/${pid}/transition`, 'reviewer', { to: 'published' });
assert(r.status === 409, '本轮有退回意见时公示被拦截');
r = await call('GET', `/api/plans/${pid}`, 'planner');
assert(r.data.status === 'draft', '第二次退回后仍回草稿');

// 8. 第三轮送审 + 通过意见 + 公示
r = await call('POST', `/api/plans/${pid}/transition`, 'planner', { to: 'submitted' });
assert(r.data.round === 4, '第三次送审轮次=4');
r = await call('POST', `/api/plans/${pid}/reviews`, 'reviewer', {
  outcome: 'approve', comment: '修改到位，同意公示', reviewer: '张工',
});
assert(r.status === 201, '同意意见提交成功');
r = await call('POST', `/api/plans/${pid}/transition`, 'reviewer', { to: 'published' });
assert(r.status === 200 && r.data.status === 'published', '审查通过并公示');

// 9. 公众标点批注
r = await call('POST', `/api/plans/${pid}/annotations`, 'public', {
  x: 12.5, y: 8.2, text: '希望保留老宅门口的暖光',
});
assert(r.status === 201 && r.data.author === '公众', '公众公示批注成功，默认署名公众');

// 10. 非法坐标被拒
r = await call('POST', `/api/plans/${pid}/annotations`, 'public', { x: 'a', y: 1, text: 'x' });
assert(r.status === 400, '批注坐标非法返回 400');

// 11. 回传统计并读回
r = await call('PUT', `/api/plans/${pid}/stats`, 'planner', {
  blocks: [{ blockId: 'B1', blockName: '街坊一', avgLux: 32.4, darkRatio: 0.12 }],
  summary: { totalCells: 1200, darkRatio: 0.12, zoneCount: 4 },
});
assert(r.status === 200 && r.data.generatedAt, '街坊统计回传成功');
r = await call('GET', `/api/plans/${pid}/stats`, 'planner');
assert(r.data.blocks[0].avgLux === 32.4, '统计读回一致');

// 12. 公众不能回传统计
r = await call('PUT', `/api/plans/${pid}/stats`, 'public', { blocks: [], summary: {} });
assert(r.status === 403, '公众不能回传统计');

// 13. 列表瘦身（无 scene）
r = await call('GET', '/api/plans', 'planner');
assert(Array.isArray(r.data) && r.data.length === 1 && !('scene' in r.data[0]), '方案列表不含 scene 大字段');

// 14. 公示方案不能删除
r = await call('DELETE', `/api/plans/${pid}`, 'planner');
assert(r.status === 409, '公示状态不可删除');

console.log(process.exitCode ? '\nSMOKE FAILED' : '\nALL SMOKE CHECKS PASSED');
