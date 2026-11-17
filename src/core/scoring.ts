import type { DocumentData, Exercise, Submission } from './types';
import { closureRatio, flattenPath, isPathClosed } from './geometry';
import { allIntersections } from './boolean';
import { pointInPolygon } from './math2d';

export interface AutoScoreResult {
  closure: number;
  intersection: number;
  total: number;
  detail: string;
  closedCount: number;
  totalCount: number;
  intersectionCount: number;
}

/**
 * 自动评分（满分 100，自动部分占 60）：
 * - 闭合度 40 分：所有路径的平均闭合率
 * - 交点数 20 分：与题目期望交点数比较（expectedIntersections < 0 时按闭合度折算）
 */
export function autoScore(doc: DocumentData, exercise: Exercise): AutoScoreResult {
  const paths = Object.values(doc.paths);
  const totalCount = paths.length;
  const closedCount = paths.filter(isPathClosed).length;

  const closure = totalCount === 0
    ? 0
    : paths.reduce((s, p) => s + closureRatio(p), 0) / totalCount;
  const closureScore = Math.round(closure * 40);

  // 统计当前文档路径两两交点总数
  let intersectionCount = 0;
  for (let i = 0; i < paths.length; i++) {
    for (let j = i + 1; j < paths.length; j++) {
      intersectionCount += allIntersections(paths[i], paths[j]).length;
    }
  }

  let intersectionScore: number;
  let detail: string;
  if (exercise.expectedIntersections >= 0) {
    if (exercise.expectedIntersections === 0) {
      intersectionScore = intersectionCount === 0 ? 20 : Math.max(0, 20 - intersectionCount * 4);
    } else {
      const ratio = Math.min(1, intersectionCount / exercise.expectedIntersections);
      intersectionScore = Math.round(ratio * 20);
    }
    detail = `闭合路径 ${closedCount}/${totalCount}，闭合率 ${(closure * 100).toFixed(0)}%；` +
      `交点 ${intersectionCount}/${exercise.expectedIntersections}`;
  } else {
    intersectionScore = Math.round(closure * 20);
    detail = `闭合路径 ${closedCount}/${totalCount}，闭合率 ${(closure * 100).toFixed(0)}%；交点 ${intersectionCount} 个（本题未设交点目标）`;
  }

  return {
    closure: closureScore,
    intersection: intersectionScore,
    total: closureScore + intersectionScore,
    detail,
    closedCount,
    totalCount,
    intersectionCount
  };
}

/** 缺口补齐评估：学员锚点与参考轮廓的覆盖率（供老师复核参考，不直接计分） */
export function gapCoverage(doc: DocumentData, exercise: Exercise): { covered: number; total: number; ratio: number } {
  let total = 0;
  let covered = 0;
  const tol = Math.max(0.8, doc.grid * 0.6);
  for (const gap of exercise.gaps) {
    const refPath = exercise.referencePaths[gap.pathId];
    if (!refPath) continue;
    const studentPts = Object.values(doc.paths).flatMap(p => flattenPath(p, 0.1).pts);
    for (const aid of gap.missingAnchorIds) {
      const ref = refPath.anchors.find(a => a.id === aid);
      if (!ref) continue;
      total++;
      if (studentPts.some(p => Math.hypot(p.x - ref.x, p.y - ref.y) <= tol)) covered++;
    }
  }
  return { covered, total, ratio: total === 0 ? 1 : covered / total };
}

/** 班级汇总统计 */
export interface ClassSummary {
  studentId: string;
  studentName: string;
  submitted: number;
  reviewed: number;
  avgAuto: number;
  avgFinal: number;
  maxFinal: number;
  minFinal: number;
  /** 高频错题（习题 id -> 出错人数，最终分 < 60） */
  weakExercises: { exerciseId: string; title: string; failCount: number }[];
}

export function summarizeClass(submissions: Submission[], exerciseTitles: Map<string, string>): ClassSummary[] {
  const byStudent = new Map<string, Submission[]>();
  for (const s of submissions) {
    const arr = byStudent.get(s.studentId) ?? [];
    arr.push(s);
    byStudent.set(s.studentId, arr);
  }
  const out: ClassSummary[] = [];
  for (const [studentId, list] of byStudent) {
    const finals = list.filter(s => s.finalScore !== null).map(s => s.finalScore!);
    const autoAvg = list.reduce((sum, s) => sum + s.autoScore.total, 0) / Math.max(1, list.length);
    const failByExercise = new Map<string, number>();
    for (const s of list) {
      const score = s.finalScore ?? s.autoScore.total;
      if (score < 60) failByExercise.set(s.exerciseId, (failByExercise.get(s.exerciseId) ?? 0) + 1);
    }
    out.push({
      studentId,
      studentName: list[0].studentName,
      submitted: list.length,
      reviewed: list.filter(s => s.reviewed).length,
      avgAuto: Math.round(autoAvg * 10) / 10,
      avgFinal: finals.length ? Math.round((finals.reduce((a, b) => a + b, 0) / finals.length) * 10) / 10 : 0,
      maxFinal: finals.length ? Math.max(...finals) : 0,
      minFinal: finals.length ? Math.min(...finals) : 0,
      weakExercises: [...failByExercise.entries()]
        .map(([exerciseId, failCount]) => ({
          exerciseId, title: exerciseTitles.get(exerciseId) ?? exerciseId, failCount
        }))
        .sort((a, b) => b.failCount - a.failCount)
    });
  }
  return out.sort((a, b) => b.avgFinal - a.avgFinal);
}

/** 导出班级汇总 CSV */
export function summaryToCsv(rows: ClassSummary[]): string {
  const header = ['学号', '姓名', '提交数', '已复核', '自动均分', '最终均分', '最高分', '最低分', '薄弱习题'];
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([
      r.studentId, r.studentName, r.submitted, r.reviewed, r.avgAuto, r.avgFinal,
      r.maxFinal, r.minFinal, r.weakExercises.map(w => `${w.title}(${w.failCount}次)`).join('；')
    ].map(esc).join(','));
  }
  return '﻿' + lines.join('\n');
}

/** 点是否落在任一闭合路径内（练习诊断用） */
export function pointInsideAnyPath(doc: DocumentData, p: { x: number; y: number }): boolean {
  for (const path of Object.values(doc.paths)) {
    if (!isPathClosed(path)) continue;
    if (pointInPolygon(p, flattenPath(path).pts)) return true;
  }
  return false;
}
