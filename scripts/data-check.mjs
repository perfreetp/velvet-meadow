import { build } from 'esbuild';
const r = await build({
  entryPoints: ['src/data.ts'],
  bundle: true, format: 'esm', write: false, platform: 'node',
});
const code = r.outputFiles[0].text;
const mod = await import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
const d = mod.generateCampus();
const byCat = {};
for (const p of d.points) byCat[p.category] = (byCat[p.category] || 0) + 1;
console.log('buildings:', d.buildings.length);
console.log('roads:', d.roads.length);
console.log('pipelines:', d.pipelines.length, 'trunk:', d.pipelines.filter((p) => p.trunk).length);
console.log('points:', d.points.length);
console.log('by category:', byCat);
console.log('total features:', d.buildings.length + d.roads.length + d.pipelines.length + d.points.length);
const got = d.grid.query(0, 0, 200, 200);
console.log('grid query (0,0)-(200,200) returned:', got.length);
const codes = new Set(d.points.map((p) => p.code));
console.log('unique point codes:', codes.size === d.points.length);
const bcodes = new Set(d.buildings.map((b) => b.code));
console.log('unique building codes:', bcodes.size === d.buildings.length);
// 所有点位都在校园范围内
const inb = d.points.every((p) => p.x >= -620 && p.x <= 620 && p.z >= -420 && p.z <= 420);
console.log('all points inside bounds:', inb);
