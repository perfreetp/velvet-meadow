import type { DocumentData, PathData } from './types';
import { arcGeom } from './math2d';
import { eachSeg, segEndpoints } from './geometry';

function fmt(n: number): string {
  return (Math.round(n * 1000) / 1000).toString();
}

/** 单条路径转 SVG path d 字符串（世界坐标，单位 mm） */
export function pathToSvgD(path: PathData): string {
  const segs = eachSeg(path);
  if (segs.length === 0) return '';
  const [firstA] = segEndpoints(path, segs[0]);
  let d = `M ${fmt(firstA.x)} ${fmt(firstA.y)}`;

  for (const seg of segs) {
    const [a, b] = segEndpoints(path, seg);
    if (seg.type === 'line') {
      d += ` L ${fmt(b.x)} ${fmt(b.y)}`;
    } else {
      const g = arcGeom(a, b, seg.bulge);
      if (!g) {
        d += ` L ${fmt(b.x)} ${fmt(b.y)}`;
        continue;
      }
      // SVG A 命令：sweep-flag 与本系统 bulge 同向（逆时针=1，屏幕坐标 y 向下时仍按数学坐标导出）
      const sweep = g.ccw ? 1 : 0;
      d += ` A ${fmt(g.radius)} ${fmt(g.radius)} 0 0 ${sweep} ${fmt(b.x)} ${fmt(b.y)}`;
    }
  }
  if (path.closed) d += ' Z';
  return d;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, ch => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;'
  }[ch]!));
}

/**
 * 导出实际尺寸 SVG（width/height 单位 mm），按图层分组并带图层名。
 */
export function exportSvg(doc: DocumentData, includeIntersections = true): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${fmt(doc.width)}mm" height="${fmt(doc.height)}mm" ` +
    `viewBox="0 0 ${fmt(doc.width)} ${fmt(doc.height)}" ` +
    `data-unit="mm">`
  );
  lines.push(`<title>断屑槽轮廓导出 ${new Date().toLocaleString('zh-CN')}</title>`);
  lines.push(`<rect x="0" y="0" width="${fmt(doc.width)}" height="${fmt(doc.height)}" fill="#0b111a"/>`);

  for (const layer of doc.layers) {
    if (!layer.visible) continue;
    lines.push(`<g id="layer-${escapeXml(layer.id)}" data-layer-name="${escapeXml(layer.name)}" ` +
      `data-locked="${layer.locked ? '1' : '0'}">`);
    for (const pid of layer.pathIds) {
      const path = doc.paths[pid];
      if (!path) continue;
      const d = pathToSvgD(path);
      lines.push(
        `  <path id="path-${escapeXml(path.id)}" data-path-name="${escapeXml(path.name)}" ` +
        `d="${d}" fill="none" stroke="${path.color}" stroke-width="0.15" ` +
        `stroke-linejoin="round" stroke-linecap="round" data-closed="${path.closed ? '1' : '0'}"/>`
      );
    }
    lines.push('</g>');
  }

  if (includeIntersections && doc.intersections.length) {
    lines.push('<g id="intersections" data-layer-name="布尔交点">');
    for (const ip of doc.intersections) {
      lines.push(
        `  <circle cx="${fmt(ip.x)}" cy="${fmt(ip.y)}" r="0.35" fill="none" stroke="#ef4444" stroke-width="0.12"/>`
      );
    }
    lines.push('</g>');
  }

  lines.push('</svg>');
  return lines.join('\n');
}

export function downloadSvg(doc: DocumentData, filename: string): void {
  const svg = exportSvg(doc);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
