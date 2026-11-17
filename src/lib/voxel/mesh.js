// 网格提取与减面：
// 1) 对 6 个方向分别做贪心矩形合并，把相邻共面体素面合并成大 Quad
// 2) Quad 转三角形网格（顶点焊接）
// 3) 超过面数阈值时，按角度阈值做边折叠减面
import { getV, fieldBoundsMm } from './core.js';

// 六个方向：法线轴、正负、两切向轴
const DIRS = [
  { n: 0, s: -1, u: 1, v: 2 },  // -X
  { n: 0, s: 1, u: 1, v: 2 },   // +X
  { n: 1, s: -1, u: 0, v: 2 },  // -Y
  { n: 1, s: 1, u: 0, v: 2 },   // +Y
  { n: 2, s: -1, u: 0, v: 1 },  // -Z
  { n: 2, s: 1, u: 0, v: 1 }    // +Z
];

function facePresent(f, x, y, z, d) {
  // 型腔体素（1）朝向实体/外界（0）的面才需要输出
  if (getV(f, x, y, z) !== 1) return false;
  const n = [x, y, z];
  n[d.n] += d.s;
  return getV(f, n[0], n[1], n[2]) === 0;
}

/**
 * 贪心网格：每个方向、每一层做 2D 矩形合并。
 * 返回 quads: {normal:[x,y,z], corners:[[mm*3]...4], dirIndex}
 */
export function extractGreedyQuads(f) {
  const vs = f.voxel;
  const quads = [];
  const dims = [f.nx, f.ny, f.nz];

  for (let di = 0; di < DIRS.length; di++) {
    const d = DIRS[di];
    const layerAxis = d.n;
    const aAxis = d.u;
    const bAxis = d.v;
    const na = dims[aAxis];
    const nb = dims[bAxis];
    const mask = new Uint8Array(na * nb);

    for (let layer = 0; layer < dims[layerAxis]; layer++) {
      // 该层的边界面掩码
      for (let b = 0; b < nb; b++) {
        for (let a = 0; a < na; a++) {
          const c = [0, 0, 0];
          c[layerAxis] = layer;
          c[aAxis] = a;
          c[bAxis] = b;
          mask[b * na + a] = facePresent(f, c[0], c[1], c[2], d) ? 1 : 0;
        }
      }
      // 贪心矩形合并：逐行扫描，向下吞并同宽全 1 行
      const used = new Uint8Array(na * nb);
      for (let b = 0; b < nb; b++) {
        let a = 0;
        while (a < na) {
          if (used[b * na + a] || !mask[b * na + a]) { a++; continue; }
          let a1 = a;
          while (a1 < na && !used[b * na + a1] && mask[b * na + a1]) a1++;
          const w = a1 - a;
          let b1 = b + 1;
          outer: while (b1 < nb) {
            for (let aa = a; aa < a1; aa++) {
              if (used[b1 * na + aa] || !mask[b1 * na + aa]) break outer;
            }
            b1++;
          }
          for (let bb = b; bb < b1; bb++) {
            for (let aa = a; aa < a1; aa++) used[bb * na + aa] = 1;
          }
          quads.push(makeQuad(d, di, layer, a, b, a1 - a, b1 - b, vs));
          a = a1;
        }
      }
    }
  }
  return quads;
}

function makeQuad(d, dirIndex, layer, a0, b0, wa, wb, vs) {
  // 层坐标（法线方向上的面位置）
  const nLayer = d.s > 0 ? layer + 1 : layer;
  const c00 = [0, 0, 0], c10 = [0, 0, 0], c11 = [0, 0, 0], c01 = [0, 0, 0];
  const put = (target, av, bv) => {
    target[d.n] = nLayer * vs;
    target[d.u] = av * vs;
    target[d.v] = bv * vs;
  };
  put(c00, a0, b0);
  put(c10, a0 + wa, b0);
  put(c11, a0 + wa, b0 + wb);
  put(c01, a0, b0 + wb);
  const normal = [0, 0, 0];
  normal[d.n] = d.s;
  return { normal, corners: [c00, c10, c11, c01], dirIndex };
}

/** Quad 列表转焊接顶点的三角形网格 */
export function quadsToTriMesh(quads) {
  const keyMap = new Map();
  const positions = [];
  const indices = [];
  const vKey = (p) => `${p[0].toFixed(3)}_${p[1].toFixed(3)}_${p[2].toFixed(3)}`;
  const vert = (p) => {
    const k = vKey(p);
    let id = keyMap.get(k);
    if (id === undefined) {
      id = positions.length / 3;
      positions.push(p[0], p[1], p[2]);
      keyMap.set(k, id);
    }
    return id;
  };
  for (const q of quads) {
    const [c0, c1, c2, c3] = q.corners;
    const a = vert(c0), b = vert(c1), c = vert(c2), d2 = vert(c3);
    // 绕序与法线方向保持一致（右手系，外向）
    if (q.normal[0] < 0 || q.normal[1] < 0 || q.normal[2] < 0) {
      indices.push(a, c, b, a, d2, c);
    } else {
      indices.push(a, b, c, a, c, d2);
    }
  }
  return {
    positions: Float32Array.from(positions),
    indices: Uint32Array.from(indices),
    triCount: indices.length / 3
  };
}

// ---------- 角度阈值边折叠减面 ----------

const pairKey = (a, b) => (a < b ? a * 1000003 + b : b * 1000003 + a);

function buildTopology(mesh) {
  const { positions, indices } = mesh;
  const triCount = indices.length / 3;
  const triV = new Int32Array(indices);
  const edgeMap = new Map();
  const edges = [];
  for (let t = 0; t < triCount; t++) {
    const o = t * 3;
    const a = triV[o], b = triV[o + 1], c = triV[o + 2];
    for (const [u, v] of [[a, b], [b, c], [c, a]]) {
      const k = pairKey(u, v);
      let e = edgeMap.get(k);
      if (!e) {
        e = { id: edges.length, a: u, b: v, t1: t, t2: -1, dead: false, ver: 0 };
        edgeMap.set(k, e);
        edges.push(e);
      } else {
        e.t2 = t;
      }
    }
  }
  const vCount = positions.length / 3;
  const incident = new Array(vCount); // 顶点 -> 关联边 id 集合
  const vTris = new Array(vCount);     // 顶点 -> 关联三角形 id 集合
  for (let i = 0; i < vCount; i++) { incident[i] = new Set(); vTris[i] = new Set(); }
  for (const e of edges) { incident[e.a].add(e.id); incident[e.b].add(e.id); }
  for (let t = 0; t < triCount; t++) {
    const o = t * 3;
    vTris[triV[o]].add(t); vTris[triV[o + 1]].add(t); vTris[triV[o + 2]].add(t);
  }
  return { triV, edges, edgeMap, incident, vTris };
}

function ensureNormal(positions, triV, t, normals, valid) {
  if (valid[t]) return;
  const o = t * 3;
  const a = triV[o], b = triV[o + 1], c = triV[o + 2];
  const ux = positions[b * 3] - positions[a * 3];
  const uy = positions[b * 3 + 1] - positions[a * 3 + 1];
  const uz = positions[b * 3 + 2] - positions[a * 3 + 2];
  const vx = positions[c * 3] - positions[a * 3];
  const vy = positions[c * 3 + 1] - positions[a * 3 + 1];
  const vz = positions[c * 3 + 2] - positions[a * 3 + 2];
  const nx = uy * vz - uz * vy;
  const ny = uz * vx - ux * vz;
  const nz = ux * vy - uy * vx;
  const len = Math.hypot(nx, ny, nz) || 1;
  normals[o] = nx / len; normals[o + 1] = ny / len; normals[o + 2] = nz / len;
  valid[t] = 1;
}

/** 边两侧面法线夹角（度）；边界边或邻面已删则 Infinity */
function edgeAngleDeg(e, positions, triV, trisAlive, normals, valid) {
  if (e.t2 < 0 || !trisAlive[e.t1] || !trisAlive[e.t2]) return Infinity;
  ensureNormal(positions, triV, e.t1, normals, valid);
  ensureNormal(positions, triV, e.t2, normals, valid);
  const o1 = e.t1 * 3, o2 = e.t2 * 3;
  const dot = Math.min(1, Math.max(-1,
    normals[o1] * normals[o2] + normals[o1 + 1] * normals[o2 + 1] + normals[o1 + 2] * normals[o2 + 2]));
  return Math.acos(dot) * 180 / Math.PI;
}

// 最小二叉堆
class MinHeap {
  constructor() { this.h = []; }
  get size() { return this.h.length; }
  push(item) {
    const h = this.h;
    h.push(item);
    let i = h.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (h[p].key <= h[i].key) break;
      [h[p], h[i]] = [h[i], h[p]];
      i = p;
    }
  }
  pop() {
    const h = this.h;
    const top = h[0];
    const last = h.pop();
    if (h.length) {
      h[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = l + 1;
        let m = i;
        if (l < h.length && h[l].key < h[m].key) m = l;
        if (r < h.length && h[r].key < h[m].key) m = r;
        if (m === i) break;
        [h[m], h[i]] = [h[i], h[m]];
        i = m;
      }
    }
    return top;
  }
}

/**
 * 按角度阈值减面：折叠相邻面法线夹角 ≤ angleThresholdDeg 的边。
 * targetTriCount 为目标三角形数，到达即停。
 * 性能要点：Set 邻接、法线懒缓存、堆按版本判旧且周期性重建、平行边合并。
 */
export function decimate(mesh, angleThresholdDeg, targetTriCount) {
  const before = mesh.triCount;
  if (before <= targetTriCount) {
    return { mesh, before, after: before, collapses: 0, reduced: false };
  }
  const positions = Array.from(mesh.positions);
  const { triV, edges, edgeMap, incident, vTris } = buildTopology(mesh);
  const totalTris = triV.length / 3;
  const trisAlive = new Uint8Array(totalTris).fill(1);
  const normals = new Float32Array(triV.length);
  const normalValid = new Uint8Array(totalTris);
  let triCount = before;

  const heap = new MinHeap();
  const pushIfFoldable = (e) => {
    const ang = edgeAngleDeg(e, positions, triV, trisAlive, normals, normalValid);
    if (isFinite(ang) && ang <= angleThresholdDeg) {
      e.ver++;
      heap.push({ key: ang, edgeId: e.id, ver: e.ver });
    }
  };
  for (const e of edges) pushIfFoldable(e);
  let liveEdgeCount = edges.length;

  // 堆膨胀（陈旧条目过多）时按当前拓扑重建
  const rebuildHeap = () => {
    heap.h.length = 0;
    for (const e of edges) {
      if (e.dead) continue;
      const ang = edgeAngleDeg(e, positions, triV, trisAlive, normals, normalValid);
      if (isFinite(ang) && ang <= angleThresholdDeg) {
        e.ver++;
        heap.push({ key: ang, edgeId: e.id, ver: e.ver });
      }
    }
  };

  const killTri = (t) => {
    if (!trisAlive[t]) return;
    trisAlive[t] = 0;
    triCount--;
    const o = t * 3;
    vTris[triV[o]].delete(t);
    vTris[triV[o + 1]].delete(t);
    vTris[triV[o + 2]].delete(t);
  };

  let collapses = 0;
  while (heap.size && triCount > targetTriCount) {
    if (heap.size > liveEdgeCount * 4 + 2000) rebuildHeap();
    const item = heap.pop();
    const e = edges[item.edgeId];
    if (!e || e.dead || item.ver !== e.ver) continue;
    if (e.t2 < 0 || !trisAlive[e.t1] || !trisAlive[e.t2]) continue;

    // 折叠到中点：保留 a，移除 b
    const keep = e.a, gone = e.b;
    positions[keep * 3] = (positions[keep * 3] + positions[gone * 3]) / 2;
    positions[keep * 3 + 1] = (positions[keep * 3 + 1] + positions[gone * 3 + 1]) / 2;
    positions[keep * 3 + 2] = (positions[keep * 3 + 2] + positions[gone * 3 + 2]) / 2;

    // 共享边的两个面删除
    killTri(e.t1);
    killTri(e.t2);

    // gone 关联的其它三角形顶点替换；退化面删除
    for (const t of [...vTris[gone]]) {
      const o = t * 3;
      for (let k = 0; k < 3; k++) if (triV[o + k] === gone) triV[o + k] = keep;
      vTris[keep].add(t);
      if (triV[o] === triV[o + 1] || triV[o + 1] === triV[o + 2] || triV[o + 2] === triV[o]) killTri(t);
      else normalValid[t] = 0;
    }
    vTris[gone].clear();

    // 边手术：gone 的边改接到 keep
    const touched = new Set();
    for (const eid of [...incident[gone]]) {
      const ed = edges[eid];
      if (ed.dead || ed === e) continue;
      const oldKey = pairKey(ed.a, ed.b);
      if (ed.a === gone) ed.a = keep;
      else ed.b = keep;
      incident[gone].delete(eid);
      edgeMap.delete(oldKey);
      if (ed.a === ed.b) {
        ed.dead = true;
        liveEdgeCount--;
        continue;
      }
      // 平行边合并（折叠后两条边端点相同）
      const pk = pairKey(ed.a, ed.b);
      const other = edgeMap.get(pk);
      if (other && other !== ed && !other.dead) {
        const ts = [ed.t1, ed.t2, other.t1, other.t2].filter((x) => x >= 0 && trisAlive[x]);
        other.t1 = ts[0] ?? -1;
        other.t2 = ts[1] ?? -1;
        ed.dead = true;
        liveEdgeCount--;
        incident[keep].delete(ed.id);
        touched.add(other);
        continue;
      }
      edgeMap.set(pk, ed);
      incident[keep].add(ed.id);
      touched.add(ed);
    }
    edgeMap.delete(pairKey(keep, gone));
    e.dead = true;
    liveEdgeCount--;
    incident[keep].delete(e.id);
    incident[gone].clear();

    // keep 周围受影响的边重新评估
    for (const eid of incident[keep]) touched.add(edges[eid]);
    for (const ed of touched) if (!ed.dead) pushIfFoldable(ed);
    collapses++;
  }

  // 压缩输出
  const remap = new Map();
  const outPos = [];
  const outIdx = [];
  const mapV = (v) => {
    let id = remap.get(v);
    if (id === undefined) {
      id = outPos.length / 3;
      remap.set(v, id);
      outPos.push(positions[v * 3], positions[v * 3 + 1], positions[v * 3 + 2]);
    }
    return id;
  };
  for (let t = 0; t < totalTris; t++) {
    if (!trisAlive[t]) continue;
    const o = t * 3;
    outIdx.push(mapV(triV[o]), mapV(triV[o + 1]), mapV(triV[o + 2]));
  }
  const out = {
    positions: Float32Array.from(outPos),
    indices: Uint32Array.from(outIdx),
    triCount: outIdx.length / 3
  };
  return { mesh: out, before, after: out.triCount, collapses, reduced: out.triCount < before };
}

/** 完整建模管线：体素场 -> 合并 Quad -> 三角网格 -> 必要时减面 */
export function buildMesh(field, { angleThresholdDeg = 15, triLimit = 300000 } = {}) {
  const quads = extractGreedyQuads(field);
  const raw = quadsToTriMesh(quads);
  const dec = decimate(raw, angleThresholdDeg, triLimit);
  return {
    quads,
    mesh: dec.mesh,
    stats: {
      quadCount: quads.length,
      trianglesBefore: dec.before,
      trianglesAfter: dec.after,
      verticesAfter: dec.mesh.positions.length / 3,
      decimated: dec.reduced,
      collapses: dec.collapses,
      angleThresholdDeg,
      triLimit
    }
  };
}

/** 导出 OBJ，外形尺寸与项目信息写在文件头注释中 */
export function exportOBJ(mesh, meta = {}) {
  const b = fieldBoundsMm({ nx: meta.nx ?? 0, ny: meta.ny ?? 0, nz: meta.nz ?? 0, voxel: 0.5 });
  const lines = [
    '# 型腔粗坯体素建模导出',
    `# 模号: ${meta.moldNo || '-'}  料号: ${meta.materialNo || '-'}  版本: V${meta.version ?? '-'}`,
    `# 外形尺寸: ${b.x.toFixed(1)} x ${b.y.toFixed(1)} x ${b.z.toFixed(1)} mm`,
    `# 体素: 0.5mm  三角形数: ${mesh.triCount}  顶点数: ${mesh.positions.length / 3}`,
    `# 导出时间: ${meta.exportedAt || new Date().toISOString()}`
  ];
  const p = mesh.positions;
  for (let i = 0; i < p.length; i += 3) {
    lines.push(`v ${p[i].toFixed(3)} ${p[i + 1].toFixed(3)} ${p[i + 2].toFixed(3)}`);
  }
  for (let i = 0; i < mesh.indices.length; i += 3) {
    lines.push(`f ${mesh.indices[i] + 1} ${mesh.indices[i + 1] + 1} ${mesh.indices[i + 2] + 1}`);
  }
  return lines.join('\n') + '\n';
}
