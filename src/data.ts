import type {
  BuildingFeature, CampusData, LayerId, PipelineFeature, PointCategory, PointFeature, RoadFeature,
} from './types';
import { SpatialGrid } from './types';

// ---------- 确定性随机（mulberry32），保证每次生成数据一致 ----------
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = rng(20261118);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];

function dateBefore(daysMax: number): string {
  const d = new Date(2026, 10, 18);
  d.setDate(d.getDate() - Math.floor(rand() * daysMax));
  return d.toISOString().slice(0, 10);
}

const BUILDING_KINDS: { layer: LayerId; prefix: string; nameBase: string; count: number; hMin: number; hMax: number }[] = [
  { layer: 'building', prefix: 'J', nameBase: '教学楼', count: 26, hMin: 18, hMax: 34 },
  { layer: 'dorm', prefix: 'S', nameBase: '学生宿舍', count: 22, hMin: 16, hMax: 30 },
  { layer: 'canteen', prefix: 'C', nameBase: '食堂', count: 5, hMin: 7, hMax: 12 },
];

const CAMPUS_W = 1200;
const CAMPUS_D = 800;

export function generateCampus(): CampusData {
  const buildings: BuildingFeature[] = [];
  const points: PointFeature[] = [];
  const pipelines: PipelineFeature[] = [];
  const roads: RoadFeature[] = [];

  // ---------- 楼栋：网格分区排布，避免重叠 ----------
  const cols = 9;
  const cellW = 118;
  const cellD = 105;
  let codeSeq = 1;
  const slots: { x: number; z: number }[] = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < cols; c++) {
      // 留出校门广场与中央绿地
      if (r === 3 && (c === 3 || c === 4 || c === 5)) continue;
      if (r === 6 && c === 4) continue;
      slots.push({
        x: -CAMPUS_W / 2 + 80 + c * cellW + (r % 2 ? 14 : 0),
        z: -CAMPUS_D / 2 + 80 + r * cellD,
      });
    }
  }
  // 打乱槽位分配
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  let si = 0;
  for (const kind of BUILDING_KINDS) {
    for (let k = 0; k < kind.count; k++) {
      const slot = slots[si++];
      const w = 46 + rand() * 26;
      const d = 34 + rand() * 20;
      const code = kind.prefix + String(codeSeq++).padStart(3, '0');
      buildings.push({
        id: 'B-' + code,
        type: 'building',
        layer: kind.layer,
        code,
        name: kind.nameBase + (kind.layer === 'canteen' ? ['', '（二）', '（三）', '（四）', '（五）'][k] : String(k + 1) + '号楼'),
        x: slot.x,
        z: slot.z,
        w,
        d,
        height: kind.hMin + rand() * (kind.hMax - kind.hMin),
        inspectDate: dateBefore(120),
      });
    }
  }

  // ---------- 道路：主干道环路 + 网格次干道 ----------
  const mainRoads: [number, number, number, number][] = [
    [-560, -300, 560, -300],
    [-560, 300, 560, 300],
    [-560, -300, -560, 300],
    [560, -300, 560, 300],
    [-560, 0, 560, 0],
    [0, -360, 0, 360],
  ];
  mainRoads.forEach(([x1, z1, x2, z2], i) =>
    roads.push({ id: 'RM-' + i, type: 'road', layer: 'road', name: '主干道' + (i + 1), x1, z1, x2, z2, width: 18 }),
  );
  const minorXs = [-420, -280, -140, 140, 280, 420];
  minorXs.forEach((x, i) =>
    roads.push({ id: 'RX-' + i, type: 'road', layer: 'road', name: '校园支路X' + (i + 1), x1: x, z1: -360, x2: x, z2: 360, width: 9 }),
  );
  const minorZs = [-180, 180];
  minorZs.forEach((z, i) =>
    roads.push({ id: 'RZ-' + i, type: 'road', layer: 'road', name: '校园支路Z' + (i + 1), x1: -560, z1: z, x2: 560, z2: z, width: 9 }),
  );

  // ---------- 管线：沿道路敷设的主管 + 楼栋入户支管 ----------
  const pipeKinds = [
    { name: '给水管道', diameter: 200 },
    { name: '中水管道', diameter: 150 },
    { name: '雨污管道', diameter: 400 },
    { name: '电力管沟', diameter: 300 },
    { name: '通信管道', diameter: 100 },
  ];
  let pipeSeq = 1;
  for (const kind of pipeKinds) {
    // 主管沿环路与中轴
    const trunk: [number, number, number, number][] = [
      [-540, -285, 540, -285],
      [-540, 285, 540, 285],
      [-20, -345, -20, 345],
    ];
    for (const [x1, z1, x2, z2] of trunk) {
      pipelines.push(mkPipe(pipeSeq++, kind.name, kind.diameter, x1, z1, x2, z2, true));
    }
    // 每栋楼一条入户支管（从最近道路接入）
    for (const b of buildings) {
      const horiz = rand() > 0.5;
      const x1 = b.x;
      const z1 = b.z;
      const x2 = horiz ? (b.x > 0 ? 540 : -540) : b.x;
      const z2 = horiz ? b.z : (b.z > 0 ? 285 : -285);
      pipelines.push(mkPipe(pipeSeq++, kind.name, kind.diameter, x1, z1, x2, z2, false));
    }
  }

  // ---------- 点状设施 ----------
  let ptSeq = 1;
  const addPoint = (category: PointCategory, layer: LayerId, x: number, z: number, buildingCode: string) => {
    points.push({
      id: 'P-' + String(ptSeq).padStart(5, '0'),
      type: 'point',
      layer,
      category,
      code: categoryCode(category) + String(ptSeq).padStart(4, '0'),
      buildingCode,
      x,
      z,
      inspectDate: dateBefore(90),
    });
    ptSeq++;
  };

  for (const b of buildings) {
    // 每栋楼：消火栓 2~3、摄像头 3~5、配电箱 1~2
    const nHyd = 2 + Math.floor(rand() * 2);
    const nCam = 3 + Math.floor(rand() * 3);
    const nBox = 1 + Math.floor(rand() * 2);
    for (let i = 0; i < nHyd; i++) {
      const ang = rand() * Math.PI * 2;
      addPoint('hydrant', 'fire', b.x + Math.cos(ang) * (b.w / 2 + 4), b.z + Math.sin(ang) * (b.d / 2 + 4), b.code);
    }
    for (let i = 0; i < nCam; i++) {
      const ang = (i / nCam) * Math.PI * 2 + rand();
      addPoint('camera', 'security', b.x + Math.cos(ang) * (b.w / 2 + 2), b.z + Math.sin(ang) * (b.d / 2 + 2), b.code);
    }
    for (let i = 0; i < nBox; i++) {
      addPoint('powerbox', 'power', b.x + (rand() - 0.5) * b.w, b.z + (rand() - 0.5) * b.d, b.code);
    }
    // 楼周路灯
    const nLight = 4 + Math.floor(rand() * 3);
    for (let i = 0; i < nLight; i++) {
      addPoint('light', 'power', b.x + (rand() - 0.5) * (b.w + 30), b.z + (rand() - 0.5) * (b.d + 30), b.code);
    }
    // 入户管阀门、检查井
    addPoint('valve', 'pipeline', b.x, b.z - b.d / 2 - 6, b.code);
    addPoint('manhole', 'pipeline', b.x + 6, b.z - b.d / 2 - 10, b.code);
    if (rand() > 0.5) addPoint('gndnode', 'power', b.x - b.w / 2 - 3, b.z, b.code);
  }

  // 道路沿线公共设施（量大，撑起上万要素）
  for (const r of roads) {
    const len = Math.hypot(r.x2 - r.x1, r.z2 - r.z1);
    const step = 18;
    const n = Math.floor(len / step);
    const dx = (r.x2 - r.x1) / len;
    const dz = (r.z2 - r.z1) / len;
    for (let i = 1; i < n; i++) {
      const t = i * step;
      const x = r.x1 + dx * t;
      const z = r.z1 + dz * t;
      addPoint('light', 'power', x - dz * (r.width / 2 + 2), z + dx * (r.width / 2 + 2), 'ROAD');
      addPoint('manhole', 'pipeline', x + dz * 4, z - dx * 4, 'CAMPUS');
      if (r.width >= 18 && i % 2 === 0) addPoint('hydrant', 'fire', x + dz * (r.width / 2 + 3), z - dx * (r.width / 2 + 3), 'CAMPUS');
      if (i % 3 === 0) addPoint('camera', 'security', x, z, 'CAMPUS');
      if (i % 4 === 0) addPoint('valve', 'pipeline', x - dz * 5, z + dx * 5, 'CAMPUS');
      if (i % 5 === 0) addPoint('powerbox', 'power', x - dz * (r.width / 2 + 4), z + dx * (r.width / 2 + 4), 'ROAD');
      if (i % 3 === 0) addPoint('gndnode', 'power', x + dz * (r.width / 2 + 5), z - dx * (r.width / 2 + 5), 'CAMPUS');
    }
  }

  // 校园网格地下设施：检查井 + 接地端子密铺（总量过万的主力）
  const GRID = 12;
  let gridSeq = 0;
  for (let gx = -CAMPUS_W / 2 + GRID; gx < CAMPUS_W / 2; gx += GRID) {
    for (let gz = -CAMPUS_D / 2 + GRID; gz < CAMPUS_D / 2; gz += GRID) {
      // 避开楼栋占地
      const occupied = buildings.some(
        (b) => Math.abs(gx - b.x) < b.w / 2 + 3 && Math.abs(gz - b.z) < b.d / 2 + 3,
      );
      if (occupied) continue;
      const jx = gx + (rand() - 0.5) * 3;
      const jz = gz + (rand() - 0.5) * 3;
      addPoint(gridSeq % 2 === 0 ? 'manhole' : 'light', gridSeq % 2 === 0 ? 'pipeline' : 'power', jx, jz, 'CAMPUS');
      if (gridSeq % 2 === 1) addPoint('gndnode', 'power', jx + 2.2, jz + 2.2, 'CAMPUS');
      gridSeq++;
    }
  }

  const grid = new SpatialGrid(points);
  const featureById = new Map<string, BuildingFeature | PointFeature | PipelineFeature | RoadFeature>();
  buildings.forEach((f) => featureById.set(f.id, f));
  points.forEach((f) => featureById.set(f.id, f));
  pipelines.forEach((f) => featureById.set(f.id, f));
  roads.forEach((f) => featureById.set(f.id, f));

  return {
    bounds: { minX: -600, maxX: 600, minZ: -400, maxZ: 400 },
    buildings,
    points,
    pipelines,
    roads,
    grid,
    featureById,
  };
}

function mkPipe(seq: number, name: string, diameter: number, x1: number, z1: number, x2: number, z2: number, trunk: boolean): PipelineFeature {
  return {
    id: 'L-' + String(seq).padStart(4, '0'),
    type: 'pipeline',
    layer: 'pipeline',
    code: 'PN' + String(seq).padStart(4, '0'),
    name,
    x1, z1, x2, z2,
    diameter,
    trunk,
    inspectDate: dateBefore(180),
  };
}

function categoryCode(c: PointCategory): string {
  return ({
    hydrant: 'XFH', camera: 'SXT', powerbox: 'PDX', light: 'LD',
    manhole: 'JCJ', valve: 'FM', gndnode: 'JDD',
  })[c];
}
