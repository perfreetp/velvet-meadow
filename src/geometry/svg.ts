import type { Contour, Segment, Vec, Part, Doc, Hole } from './types';
import { uid } from './types';
import { GEOM_EPS, dist, normAngle, pointInPolygon } from './math';
import { arcFromPoints } from './segments';
import { makeContour, contourPolyline } from './contour';
import { contourArea } from './boolean';

function fmt(n: number): string {
  return (Math.round(n * 1000) / 1000).toString();
}

export function segToPath(s: Segment, first: boolean): string {
  const head = first ? `M${fmt(s.a.x)},${fmt(s.a.y)}` : '';
  if (s.type === 'line') return `${head}L${fmt(s.b.x)},${fmt(s.b.y)}`;
  if (s.type === 'cubic') {
    return `${head}C${fmt(s.c1.x)},${fmt(s.c1.y)} ${fmt(s.c2.x)},${fmt(s.c2.y)} ${fmt(s.b.x)},${fmt(s.b.y)}`;
  }
  // arc -> SVG A 命令(y 向下:canvas ccw=true 对应 sweep-flag=0)
  const r = dist(s.a, s.c);
  const large = sweepLargeFlag(s) ? 1 : 0;
  const sweep = s.ccw ? 0 : 1;
  return `${head}A${fmt(r)},${fmt(r)} 0 ${large} ${sweep} ${fmt(s.b.x)},${fmt(s.b.y)}`;
}

function sweepLargeFlag(s: Extract<Segment, { type: 'arc' }>): boolean {
  const a0 = normAngle(Math.atan2(s.a.y - s.c.y, s.a.x - s.c.x));
  const a1 = normAngle(Math.atan2(s.b.y - s.c.y, s.b.x - s.c.x));
  let d = s.ccw ? a1 - a0 : a0 - a1;
  d = normAngle(d);
  return d > Math.PI;
}

export function contourToPathD(c: Contour): string {
  if (!c.segs.length) return '';
  const parts = c.segs.map((s, i) => segToPath(s, i === 0));
  if (c.closed) parts.push('Z');
  return parts.join(' ');
}

/** 整张板材导出为激光切割 SVG(mm 单位,evenodd 填充) */
export function exportDocSVG(doc: Doc): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${fmt(doc.board.width)}mm" height="${fmt(doc.board.height)}mm" viewBox="0 0 ${fmt(doc.board.width)} ${fmt(doc.board.height)}">`
  );
  lines.push(`<rect x="0" y="0" width="${fmt(doc.board.width)}" height="${fmt(doc.board.height)}" fill="none" stroke="#888" stroke-width="0.1"/>`);
  for (const part of doc.parts) {
    lines.push(`<g id="${svgId(part.id, part.name)}" data-part="${escapeXml(part.name)}" transform="translate(${fmt(part.x)},${fmt(part.y)})">`);
    for (const c of part.contours) {
      lines.push(
        `  <path d="${contourToPathD(c)}" fill="none" stroke="#0a0" stroke-width="0.15" fill-rule="evenodd"/>`
      );
    }
    for (const h of part.holes) {
      lines.push(
        `  <circle cx="${fmt(h.cx)}" cy="${fmt(h.cy)}" r="${fmt(h.r)}" fill="none" stroke="#c00" stroke-width="0.15"/>`
      );
    }
    lines.push('</g>');
  }
  lines.push('</svg>');
  return lines.join('\n');
}

function svgId(id: string, name: string): string {
  return escapeXml((name || id).replace(/[^\w一-龥-]/g, '_'));
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, ch => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]!));
}

/* ------------------------------- 导入 ------------------------------- */

interface PathCmd {
  cmd: string;
  args: number[];
}

function tokenizePath(d: string): PathCmd[] {
  const out: PathCmd[] = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/gi;
  let m: RegExpExecArray | null;
  let cur: PathCmd | null = null;
  while ((m = re.exec(d))) {
    if (m[1]) {
      cur = { cmd: m[1], args: [] };
      out.push(cur);
    } else if (cur) {
      cur.args.push(parseFloat(m[2]));
    }
  }
  return out;
}

/** 解析 SVG path 为若干闭合/开放轮廓 */
export function parseSVGPaths(svgText: string): Contour[] {
  const contours: Contour[] = [];
  const rePath = /<path\b[^>]*\bd="([^"]*)"[^>]*>/gi;
  let pm: RegExpExecArray | null;
  while ((pm = rePath.exec(svgText))) {
    contours.push(...parseD(pm[1]));
  }
  const reCircle = /<circle\b[^>]*>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = reCircle.exec(svgText))) {
    const cx = attrNum(cm[0], 'cx'), cy = attrNum(cm[0], 'cy'), r = attrNum(cm[0], 'r');
    if (r > 0) contours.push(circleContour(cx, cy, r));
  }
  const reRect = /<rect\b[^>]*>/gi;
  let rm: RegExpExecArray | null;
  while ((rm = reRect.exec(svgText))) {
    const x = attrNum(rm[0], 'x'), y = attrNum(rm[0], 'y');
    const w = attrNum(rm[0], 'width'), h = attrNum(rm[0], 'height');
    if (w > 0 && h > 0) contours.push(rectContour(x, y, w, h));
  }
  return contours;
}

function attrNum(tag: string, name: string): number {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"(-?[\\d.]+)"`, 'i'));
  return m ? parseFloat(m[1]) : 0;
}

export function circleContour(cx: number, cy: number, r: number): Contour {
  const a: Vec = { x: cx + r, y: cy };
  const b: Vec = { x: cx - r, y: cy };
  const c: Vec = { x: cx, y: cy };
  const s1: Segment = { id: uid('ar'), type: 'arc', a, b, c, ccw: true };
  const s2: Segment = { id: uid('ar'), type: 'arc', a: b, b: a, c, ccw: true };
  return makeContour([s1, s2], true);
}

function rectContour(x: number, y: number, w: number, h: number): Contour {
  const p = (dx: number, dy: number): Vec => ({ x: x + dx, y: y + dy });
  const segs: Segment[] = [
    { id: uid('ln'), type: 'line', a: p(0, 0), b: p(w, 0) },
    { id: uid('ln'), type: 'line', a: p(w, 0), b: p(w, h) },
    { id: uid('ln'), type: 'line', a: p(w, h), b: p(0, h) },
    { id: uid('ln'), type: 'line', a: p(0, h), b: p(0, 0) }
  ];
  return makeContour(segs, true);
}

function parseD(d: string): Contour[] {
  const cmds = tokenizePath(d);
  const contours: Contour[] = [];
  let segs: Segment[] = [];
  let cur: Vec = { x: 0, y: 0 };
  let start: Vec = { x: 0, y: 0 };
  let lastCtrl: Vec | null = null;
  let lastCmd = '';

  const finish = (closed: boolean) => {
    if (segs.length) contours.push(makeContour(segs, closed));
    segs = [];
  };

  for (const { cmd, args } of cmds) {
    const rel = cmd === cmd.toLowerCase() && cmd !== 'Z' && cmd !== 'z';
    const C = cmd.toUpperCase();
    const P = (x: number, y: number): Vec => rel ? { x: cur.x + x, y: cur.y + y } : { x, y };
    let k = 0;
    const step = (n: number) => args.slice(k, k + n).map(Number);
    switch (C) {
      case 'M': {
        const [x, y] = args;
        if (segs.length) finish(false);
        cur = P(x, y); start = { ...cur }; segs = [];
        k = 2;
        // 后续隐式 L
        while (k < args.length) {
          const to = P(args[k], args[k + 1]);
          segs.push({ id: uid('ln'), type: 'line', a: { ...cur }, b: to });
          cur = to; k += 2;
        }
        break;
      }
      case 'L': {
        while (k < args.length) {
          const to = P(args[k], args[k + 1]);
          segs.push({ id: uid('ln'), type: 'line', a: { ...cur }, b: to });
          cur = to; k += 2;
        }
        break;
      }
      case 'H': {
        while (k < args.length) {
          const to = P(args[k], 0); to.y = cur.y;
          if (!rel) to.x = args[k];
          segs.push({ id: uid('ln'), type: 'line', a: { ...cur }, b: to });
          cur = to; k += 1;
        }
        break;
      }
      case 'V': {
        while (k < args.length) {
          const to: Vec = { x: cur.x, y: rel ? cur.y + args[k] : args[k] };
          segs.push({ id: uid('ln'), type: 'line', a: { ...cur }, b: to });
          cur = to; k += 1;
        }
        break;
      }
      case 'C': {
        while (k + 5 < args.length + 1 && k + 5 <= args.length) {
          const [x1, y1, x2, y2, x, y] = step(6); k += 6;
          const c1 = P(x1, y1), c2 = P(x2, y2), b = P(x, y);
          segs.push({ id: uid('cb'), type: 'cubic', a: { ...cur }, c1, c2, b });
          lastCtrl = c2; cur = b;
        }
        break;
      }
      case 'S': {
        while (k + 3 <= args.length) {
          const [x2, y2, x, y] = step(4); k += 4;
          const c1 = lastCmd === 'C' || lastCmd === 'S'
            ? { x: 2 * cur.x - lastCtrl!.x, y: 2 * cur.y - lastCtrl!.y }
            : { ...cur };
          const c2 = P(x2, y2), b = P(x, y);
          segs.push({ id: uid('cb'), type: 'cubic', a: { ...cur }, c1, c2, b });
          lastCtrl = c2; cur = b;
        }
        break;
      }
      case 'Q': {
        while (k + 3 <= args.length) {
          const [x1, y1, x, y] = step(4); k += 4;
          const c1 = P(x1, y1), b = P(x, y);
          // 二次贝塞尔升三次
          const qc1: Vec = { x: cur.x + 2 / 3 * (c1.x - cur.x), y: cur.y + 2 / 3 * (c1.y - cur.y) };
          const qc2: Vec = { x: b.x + 2 / 3 * (c1.x - b.x), y: b.y + 2 / 3 * (c1.y - b.y) };
          segs.push({ id: uid('cb'), type: 'cubic', a: { ...cur }, c1: qc1, c2: qc2, b });
          lastCtrl = c1; cur = b;
        }
        break;
      }
      case 'A': {
        while (k + 7 <= args.length) {
          const [rx, ry, , , sweep, x, y] = step(7); k += 7;
          const b = P(x, y);
          const seg = arcFromSVGArc(cur, rx, ry, sweep === 1, b);
          if (seg) segs.push(seg);
          cur = b;
        }
        break;
      }
      case 'Z': {
        if (segs.length && dist(cur, start) > GEOM_EPS) {
          segs.push({ id: uid('ln'), type: 'line', a: { ...cur }, b: { ...start } });
        }
        cur = { ...start };
        finish(true);
        break;
      }
    }
    if (C !== 'Z') lastCmd = C;
    if (C !== 'S' && C !== 'C' && C !== 'Q') lastCtrl = null;
  }
  finish(false);
  return contours;
}

/** SVG A 命令转 ArcSeg(y 向下:sweep=1 为顺时针 => ccw=false) */
function arcFromSVGArc(p0: Vec, rx: number, ry: number, sweepPositive: boolean, p1: Vec): Segment | null {
  if (rx < GEOM_EPS || ry < GEOM_EPS) {
    return { id: uid('ln'), type: 'line', a: { ...p0 }, b: { ...p1 } };
  }
  if (Math.abs(rx - ry) > 1e-6) {
    // 椭圆弧:用三点拟合成近似圆弧
    const mid: Vec = { x: (p0.x + p1.x) / 2, y: (p0.y + p1.y) / 2 };
    const s = arcFromPoints(p0, mid, p1);
    return s;
  }
  // 求圆心
  const dx = (p0.x - p1.x) / 2, dy = (p0.y - p1.y) / 2;
  const d2 = dx * dx + dy * dy;
  let r = rx;
  if (r * r < d2) r = Math.sqrt(d2) + 1e-6;
  const h = Math.sqrt(Math.max(0, r * r - d2));
  const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
  const sign = sweepPositive ? -1 : 1;
  const center: Vec = { x: mx + sign * h * (dy / r), y: my - sign * h * (dx / r) };
  return { id: uid('ar'), type: 'arc', a: { ...p0 }, b: { ...p1 }, c: center, ccw: !sweepPositive };
}

/** 从导入轮廓构造零件(按包含关系区分外轮廓与孔) */
export function contoursToPart(contours: Contour[], name: string): Part {
  const closed = contours.filter(c => c.closed);
  const holes: Hole[] = [];
  const outers: Contour[] = [];
  // 面积最小的闭合轮廓且被其他轮廓包含 => 圆孔导入
  for (const c of closed) {
    const poly = contourPolyline(c, 0.1);
    const center = poly.reduce((acc, p) => ({ x: acc.x + p.x / poly.length, y: acc.y + p.y / poly.length }), { x: 0, y: 0 });
    const contained = closed.some(other => other !== c && pointInPolygon(center, contourPolyline(other, 0.1)));
    if (contained) holes.push({ id: uid('h'), cx: center.x, cy: center.y, r: Math.sqrt(contourArea(c) / Math.PI) });
    else outers.push(c);
  }
  return {
    id: uid('p'),
    name,
    x: 0,
    y: 0,
    contours: outers.length ? outers : contours.filter(c => !c.closed),
    holes
  };
}
