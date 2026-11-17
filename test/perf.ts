// 64×64×32 目标规模性能基准
import { VoxelGrid } from '../src/core/VoxelGrid';
import { buildMesh } from '../src/core/Mesher';
import { fillFromBoreholes } from '../src/core/BoreholeFiller';
import type { Borehole } from '../src/types';

const NX = 64;
const NY = 64;
const NZ = 32;

// 场景 1：钻孔插值填充的真实地层
const g1 = new VoxelGrid(NX, NY, NZ, 1);
const bhs: Borehole[] = [];
for (let i = 0; i < 12; i++) {
  const x = (i * 17 + 5) % NX;
  const y = (i * 29 + 8) % NY;
  bhs.push({
    id: 'b' + i,
    name: 'ZK' + i,
    x,
    y,
    elevation: NZ,
    layers: [
      { depth: 4 + (i % 3), materialId: 1 },
      { depth: 10 + (i % 4), materialId: 2 },
      { depth: 18 + (i % 5), materialId: 3 },
      { depth: 28, materialId: 5 }
    ]
  });
}

let t0 = performance.now();
const fill = fillFromBoreholes(g1, bhs);
let t1 = performance.now();
console.log(`钻孔填充：${fill.filled} 体素 / ${fill.columns} 列，耗时 ${(t1 - t0).toFixed(1)} ms`);

t0 = performance.now();
const m1 = buildMesh(g1);
t1 = performance.now();
console.log(`地层场景合面：${m1.faces.length} 面 / ${m1.triangles} 三角面，耗时 ${(t1 - t0).toFixed(1)} ms`);
console.log(`  合面压缩比：${(fill.filled * 6 / m1.faces.length).toFixed(1)}×（相对逐格 6 面）`);

t0 = performance.now();
g1.countVoxels();
t1 = performance.now();
console.log(`体素计数：${(t1 - t0).toFixed(2)} ms`);

// 场景 2：满网格最坏情况（131072 体素）
const g2 = new VoxelGrid(NX, NY, NZ, 1);
g2.data.fill(1);
t0 = performance.now();
const m2 = buildMesh(g2);
t1 = performance.now();
console.log(`\n满网格 ${NX}×${NY}×${NZ}=${g2.data.length} 体素：`);
console.log(`  合面 ${m2.faces.length} 面 / ${m2.triangles} 三角面，耗时 ${(t1 - t0).toFixed(1)} ms（实心块应只有 6 个大面）`);

// 场景 3：棋盘格最坏碎片化（内部面极多）
const g3 = new VoxelGrid(32, 32, 16, 1);
for (let z = 0; z < 16; z++)
  for (let y = 0; y < 32; y++)
    for (let x = 0; x < 32; x++) g3.set(x, y, z, (x + y + z) % 2 === 0 ? 1 : 2);
t0 = performance.now();
const m3 = buildMesh(g3);
t1 = performance.now();
console.log(`\n棋盘格碎片场景 ${32 * 32 * 16} 体素：`);
console.log(`  合面 ${m3.faces.length} 面 / ${m3.triangles} 三角面，耗时 ${(t1 - t0).toFixed(1)} ms`);

// 序列化往返
t0 = performance.now();
const b64 = g1.toBase64();
const restored = VoxelGrid.fromBase64(b64, NX, NY, NZ, 1);
t1 = performance.now();
console.log(`\nbase64 序列化+反序列化（${(b64.length / 1024).toFixed(0)} KB）：${(t1 - t0).toFixed(1)} ms，一致=${restored.data.every((v, i) => v === g1.data[i])}`);
