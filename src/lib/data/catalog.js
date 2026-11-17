// 图册数据生成:一台注塑机的装配图拆成 5 个图层,约 2250 个零件、2 万+ 图元。
// 每个零件包含 4 类图元(kind):0=轮廓 1=细线 2=剖面线 3=尺寸标注,
// 顶点交错布局 [x, y, partId, kind|layer<<2],供 WebGPU 一次性上传。

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const WORLD_W = 2400;
export const WORLD_H = 1500;

export const LAYERS = [
  { id: 0, code: 'JB', name: '机身', color: '#7ea6e0', region: [60, 120, 700, 900] },
  { id: 1, code: 'SM', name: '锁模', color: '#8fd18f', region: [760, 120, 1400, 900] },
  { id: 2, code: 'SC', name: '射出', color: '#e0c07e', region: [1460, 120, 2340, 900] },
  { id: 3, code: 'YY', name: '液压', color: '#d18fb8', region: [60, 980, 1400, 1440] },
  { id: 4, code: 'DQ', name: '电气', color: '#9fd6d2', region: [1460, 980, 2340, 1440] },
];

const NAME_POOLS = [
  ['床身底座', '机身立板', '加强筋板', '地脚支座', '导轨安装板', '防护罩壳', '油箱壳体', '横梁', '支撑立柱', '尾板', '检修门', '减震垫铁'],
  ['动模板', '定模板', '尾板', '哥林柱', '调模螺母', '曲肘连杆', '十字头', '锁模油缸', '顶出油缸', '顶针板', '调模马达座', '模板滑脚'],
  ['射胶料筒', '螺杆', '射嘴', '前机筒', '射胶油缸', '熔胶马达', '料斗', '加热圈', '射台移动油缸', '止逆环', '螺杆头', '法兰'],
  ['液压泵', '比例阀', '换向阀', '溢流阀', '蓄能器', '滤油器', '冷却器', '油管接头', '压力表', '阀块', '油泵电机', '油箱盖'],
  ['控制器', '触摸屏', '接触器', '断路器', '继电器', '开关电源', '伺服驱动器', '热电偶', '限位开关', '急停按钮', '接线端子排', '变压器'],
];

export const MATERIALS = ['45#钢', '40Cr', 'QT500-7', 'HT250', '6061铝合金', 'H62黄铜', '304不锈钢', 'POM工程塑料', '65Mn弹簧钢', 'GCr15轴承钢'];
export const MODELS = ['IM-120', 'IM-180', 'IM-250', 'IM-320', 'IM-450', 'IM-650'];

const PARTS_PER_LAYER = 450; // 5 × 450 = 2250 个零件

function makePart(rng, layer, idx, id) {
  const [x0, y0, x1, y1] = layer.region;
  const cx = x0 + 50 + rng() * (x1 - x0 - 100);
  const cy = y0 + 40 + rng() * (y1 - y0 - 80);
  const w = 16 + rng() * 64;
  const h = 12 + rng() * 56;

  // 零件轮廓多边形
  const n = 6 + Math.floor(rng() * 5);
  const poly = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const rj = 0.62 + rng() * 0.38;
    poly.push(cx + Math.cos(a) * w * 0.5 * rj, cy + Math.sin(a) * h * 0.5 * rj);
  }
  let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
  for (let i = 0; i < poly.length; i += 2) {
    bx0 = Math.min(bx0, poly[i]); bx1 = Math.max(bx1, poly[i]);
    by0 = Math.min(by0, poly[i + 1]); by1 = Math.max(by1, poly[i + 1]);
  }

  const segs = [[], [], [], []];
  // kind 0:轮廓
  for (let k = 0; k < n; k++) {
    const k2 = (k + 1) % n;
    segs[0].push([poly[k * 2], poly[k * 2 + 1], poly[k2 * 2], poly[k2 * 2 + 1]]);
  }
  // kind 1:内部细线(结构线/中心线)
  const thinN = 2 + Math.floor(rng() * 4);
  for (let k = 0; k < thinN; k++) {
    const mx = bx0 + (bx1 - bx0) * (0.15 + rng() * 0.7);
    const my = by0 + (by1 - by0) * (0.15 + rng() * 0.7);
    if (rng() < 0.5) segs[1].push([bx0 + 2, my, bx1 - 2, my]);
    else segs[1].push([mx, by0 + 2, mx, by1 - 2]);
  }
  // kind 2:剖面线(45°,裁剪到包围盒)
  const bw = bx1 - bx0, bh = by1 - by0;
  const step = 7 + rng() * 5;
  for (let c = bx0 - by1; c < bx1 - by0; c += step) {
    // 直线 y = x - c 与包围盒求交
    const pts = [];
    const yA = bx0 - c, yB = bx1 - c, xA = by0 + c, xB = by1 + c;
    if (yA >= by0 && yA <= by1) pts.push([bx0, yA]);
    if (yB >= by0 && yB <= by1) pts.push([bx1, yB]);
    if (xA >= bx0 && xA <= bx1) pts.push([xA, by0]);
    if (xB >= bx0 && xB <= bx1) pts.push([xB, by1]);
    if (pts.length >= 2) segs[2].push([pts[0][0], pts[0][1], pts[1][0], pts[1][1]]);
  }
  // kind 3:尺寸标注(零件下方的水平尺寸线 + 两端箭头)
  const dy = by1 + 9;
  segs[3].push([bx0, dy, bx1, dy]);
  segs[3].push([bx0, dy - 3, bx0, dy + 3]);
  segs[3].push([bx1, dy - 3, bx1, dy + 3]);
  segs[3].push([bx0, dy, bx0 + 5, dy - 2]);
  segs[3].push([bx1, dy, bx1 - 5, dy - 2]);

  const pool = NAME_POOLS[layer.id];
  const base = pool[idx % pool.length];
  const round = Math.floor(idx / pool.length);
  const name = round === 0 ? base : `${base}-${round + 1}`;
  const mCount = 2 + Math.floor(rng() * 3);
  const models = [];
  for (let k = 0; k < mCount; k++) {
    const m = MODELS[Math.floor(rng() * MODELS.length)];
    if (!models.includes(m)) models.push(m);
  }

  return {
    id,
    layer: layer.id,
    partNo: `${layer.code}-${String(idx + 1).padStart(3, '0')}`,
    name,
    material: MATERIALS[Math.floor(rng() * MATERIALS.length)],
    models,
    cx, cy,
    bbox: [bx0, by0, bx1, by1],
    poly,
    segs,
    dimText: `${Math.round(bw)}`,
    dimPos: [cx, dy + 13],
    adj: [],
  };
}

export function buildCatalog() {
  const rng = mulberry32(20261118);
  const parts = [];
  const verts = [];

  for (const layer of LAYERS) {
    for (let i = 0; i < PARTS_PER_LAYER; i++) {
      const p = makePart(rng, layer, i, parts.length);
      assemble(p, verts);
      parts.push(p);
    }
  }

  // 图框 + 标题栏(特殊零件,始终提交)
  const frame = makeFramePart(parts.length);
  assemble(frame, verts);
  parts.push(frame);
  const frameId = frame.id;

  // 相邻零件:同图层内按中心距取最近 4 个
  for (const layer of LAYERS) {
    const lp = parts.filter((p) => p.layer === layer.id && p.id !== frameId);
    for (const p of lp) {
      const d = lp
        .filter((q) => q !== p)
        .map((q) => ({ q, d: (q.cx - p.cx) ** 2 + (q.cy - p.cy) ** 2 }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 4);
      p.adj = d.map((x) => x.q.id);
    }
  }

  const vertexData = new Float32Array(verts);
  const segCount = vertexData.length / 8;
  return { parts, vertexData, frameId, segCount };
}

function assemble(p, verts) {
  p.ranges = {};
  p.vStart = verts.length / 4;
  for (let kind = 0; kind < 4; kind++) {
    const start = verts.length / 4;
    for (const s of p.segs[kind]) {
      const meta = kind | (p.layer << 2);
      verts.push(s[0], s[1], p.id, meta, s[2], s[3], p.id, meta);
    }
    p.ranges[kind] = [start, verts.length / 4 - start];
  }
  p.vCount = verts.length / 4 - p.vStart;
  delete p.segs;
}

function makeFramePart(id) {
  const segs = [[], [], [], []];
  const m = 30;
  segs[0].push([m, m, WORLD_W - m, m], [WORLD_W - m, m, WORLD_W - m, WORLD_H - m],
    [WORLD_W - m, WORLD_H - m, m, WORLD_H - m], [m, WORLD_H - m, m, m]);
  // 标题栏
  const tx = WORLD_W - 560, ty = WORLD_H - 130;
  segs[1].push([tx, ty, WORLD_W - m, ty], [tx, ty, tx, WORLD_H - m],
    [tx, ty + 45, WORLD_W - m, ty + 45], [tx + 180, ty, tx + 180, WORLD_H - m]);
  // 分区刻度
  for (let x = 200; x < WORLD_W; x += 200) segs[1].push([x, m, x, m + 8], [x, WORLD_H - m - 8, x, WORLD_H - m]);
  for (let y = 150; y < WORLD_H; y += 150) segs[1].push([m, y, m + 8, y], [WORLD_W - m - 8, y, WORLD_W - m, y]);
  return {
    id, layer: 0, partNo: 'FRAME', name: '图框', material: '-', models: [],
    cx: WORLD_W / 2, cy: WORLD_H / 2,
    bbox: [m, m, WORLD_W - m, WORLD_H - m],
    poly: [m, m, WORLD_W - m, m, WORLD_W - m, WORLD_H - m, m, WORLD_H - m],
    segs, dimText: '', dimPos: [0, 0], adj: [],
  };
}
