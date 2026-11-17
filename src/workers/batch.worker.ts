/// <reference lib="webworker" />
import type { Doc } from '../geometry/types';
import { checkDoc, type Finding } from '../geometry/checks';
import { rasterizeContour } from '../render/canvas';

export interface BatchJob {
  batchId: string;
  docs: { name: string; doc: Doc }[];
}

export interface BatchResult {
  batchId: string;
  finishedAt: number;
  items: {
    name: string;
    findings: Finding[];
    critical: number;
    major: number;
    minor: number;
    rasterPixels: number;
    error?: string;
  }[];
}

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (ev: MessageEvent<BatchJob>) => {
  const job = ev.data;
  const items: BatchResult['items'] = [];
  for (const entry of job.docs) {
    try {
      const findings = checkDoc(entry.doc);
      // OffscreenCanvas 光栅化:统计首件轮廓像素面积,作为越界/退化图元的辅助校验
      let rasterPixels = 0;
      const firstPart = entry.doc.parts[0];
      if (firstPart?.contours[0] && typeof OffscreenCanvas !== 'undefined') {
        const img = rasterizeContour(firstPart.contours[0], 2);
        if (img) {
          for (let i = 3; i < img.data.length; i += 4) if (img.data[i] > 0) rasterPixels++;
        }
      }
      items.push({
        name: entry.name,
        findings,
        critical: findings.filter(f => f.severity === 'critical').length,
        major: findings.filter(f => f.severity === 'major').length,
        minor: findings.filter(f => f.severity === 'minor').length,
        rasterPixels
      });
    } catch (e) {
      items.push({
        name: entry.name,
        findings: [],
        critical: 0, major: 0, minor: 0, rasterPixels: 0,
        error: e instanceof Error ? e.message : String(e)
      });
    }
    // 每张图处理完回传一次进度
    ctx.postMessage({ type: 'progress', batchId: job.batchId, done: items.length, total: job.docs.length });
  }
  const result: BatchResult = { batchId: job.batchId, finishedAt: Date.now(), items };
  ctx.postMessage({ type: 'done', result });
};
