// 生成批量检查用的工程快照:一张合格、一张带越界和自交
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('tests/fixtures', { recursive: true });
const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);
const P = (x, y) => ({ x, y });
const line = (a, b) => ({ id: uid('ln'), type: 'line', a, b });
const rect = (x, y, w, h) => ({ id: uid('ct'), closed: true, segs: [
  line(P(x,y),P(x+w,y)), line(P(x+w,y),P(x+w,y+h)),
  line(P(x+w,y+h),P(x,y+h)), line(P(x,y+h),P(x,y))] });
const doc = (parts, board = { width: 1000, height: 800, thickness: 18, material: '塑料板' }) =>
  ({ version: 1, board, parts, activePartId: parts[0].id });
const part = (name, contours, holes = []) => ({ id: uid('p'), name, x: 20, y: 20, contours, holes });

// 合格件
const good = doc([part('合格件', [rect(0, 0, 200, 150)], [{ id: uid('h'), cx: 60, cy: 60, r: 8 }])]);
// 越界件(零件 x 偏移后超出板幅)+ 自交轮廓
const bowtie = { id: uid('ct'), closed: true, segs: [
  line(P(0,0),P(100,100)), line(P(100,100),P(100,0)),
  line(P(100,0),P(0,100)), line(P(0,100),P(0,0))] };
const bad = doc([part('问题件', [rect(0, 0, 900, 700), bowtie],
  [{ id: uid('h'), cx: 50, cy: 50, r: 30 }, { id: uid('h'), cx: 90, cy: 50, r: 30 }])]);
bad.parts[0].x = 950; // 推到板外
writeFileSync('tests/fixtures/good.json', JSON.stringify(good, null, 2));
writeFileSync('tests/fixtures/bad.json', JSON.stringify(bad, null, 2));
console.log('fixtures written');
