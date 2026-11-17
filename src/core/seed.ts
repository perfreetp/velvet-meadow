import type { ClassInfo, Exercise, GapMark, PathData, Student, DocumentData } from './types';
import { uid } from './math2d';
import { DocumentStore } from './store';

function makeStudent(no: string, name: string): Student {
  return { id: uid('stu'), studentNo: no, name };
}

/** 由点列构造路径，arcEdges 指定需要转成圆弧的边索引及 bulge */
function makePath(name: string, color: string, pts: [number, number][], arcEdges: Record<number, number>): PathData {
  const anchors = pts.map(([x, y]) => ({ id: uid('a'), x, y }));
  const segs = anchors.map((a, i) => {
    const b = anchors[(i + 1) % anchors.length];
    const bulge = arcEdges[i];
    return bulge !== undefined
      ? { id: uid('s'), type: 'arc' as const, a: a.id, b: b.id, bulge }
      : { id: uid('s'), type: 'line' as const, a: a.id, b: b.id };
  });
  return { id: uid('path'), name, anchors, segs, color, closed: true };
}

/** 典型断屑槽截面轮廓（带圆弧的闭合槽型，80x50mm 画布） */
export function buildGroovePath(): PathData {
  // 逆时针轮廓：底部平台 -> 前刀面斜坡 -> 槽底圆弧 -> 后壁 -> 顶面
  const pts: [number, number][] = [
    [12, 38],
    [30, 38],
    [38, 33],
    [46, 28],
    [56, 27],
    [64, 30],
    [68, 36],
    [68, 42],
    [58, 44],
    [22, 44],
    [14, 42]
  ];
  return makePath('断屑槽主轮廓', '#60a5fa', pts, {
    2: 0.45,   // 斜坡入槽弧
    3: -0.35,  // 槽底反向弧
    5: 0.3,    // 出槽弧
    9: 0.25    // 顶面圆角
  });
}

export interface SeedData {
  classes: ClassInfo[];
  exercises: Exercise[];
}

export async function buildSeedData(): Promise<SeedData> {
  const cls: ClassInfo = {
    id: uid('class'),
    name: '数控车 2601 班',
    createdAt: Date.now(),
    students: [
      makeStudent('20260101', '张伟'),
      makeStudent('20260102', '李娜'),
      makeStudent('20260103', '王强'),
      makeStudent('20260104', '陈静')
    ]
  };

  const fullPath = buildGroovePath();
  // 缺口：移除第 4~6 号锚点（槽底到后壁一段），学员需补齐
  const gapA = fullPath.anchors[3];
  const gapB = fullPath.anchors[7];
  const missingIds = fullPath.anchors.slice(4, 7).map(a => a.id);

  const store = new DocumentStore();
  store.doc.width = 80;
  store.doc.height = 50;
  store.doc.grid = 2;
  const layer = store.doc.layers[0];
  layer.name = '槽型轮廓层';
  layer.pathIds = [fullPath.id];
  store.doc.paths[fullPath.id] = JSON.parse(JSON.stringify(fullPath));

  const referencePaths: Record<string, PathData> = {
    [fullPath.id]: JSON.parse(JSON.stringify(fullPath))
  };

  // 模板：裁掉缺口段，得到开放路径
  const tplPath = store.doc.paths[fullPath.id];
  const idxA = tplPath.anchors.findIndex(a => a.id === gapA.id);
  const removeIdSet = new Set(missingIds);
  tplPath.anchors = tplPath.anchors.filter(a => !removeIdSet.has(a.id));
  tplPath.segs = tplPath.segs.filter(s => !removeIdSet.has(s.a) && !removeIdSet.has(s.b));
  tplPath.closed = false;
  void idxA;

  const gap: GapMark = {
    id: uid('gap'),
    pathId: tplPath.id,
    anchorA: gapA.id,
    anchorB: gapB.id,
    missingAnchorIds: missingIds
  };

  const exercise: Exercise = {
    id: uid('ex'),
    title: '练习 1：补齐断屑槽槽底缺口',
    description: '图中橙色标记之间为缺失段。请用折线与圆弧工具补齐槽型，使轮廓重新闭合；再绘制一条辅助轮廓与主轮廓做一次差集运算。',
    classId: cls.id,
    createdAt: Date.now(),
    template: store.snapshot,
    referencePaths,
    gaps: [gap],
    expectedIntersections: 2
  };

  return { classes: [cls], exercises: [exercise] };
}

export function emptyDocument(): DocumentData {
  return DocumentStore.createDefault();
}
