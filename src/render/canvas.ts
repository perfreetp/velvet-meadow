import type { Doc, Contour, Vec } from '../geometry/types';
import { flatten } from '../geometry/segments';
import { contourAnchors, contourPolyline } from '../geometry/contour';
import type { GuideLine } from '../geometry/snap';
import { isPartOutOfBoard, partWorldBBox } from '../geometry/checks';
import type { AnchorRef } from '../editor/store.svelte';

export interface ViewTransform {
  scale: number; // px per mm
  offsetX: number; // 世界原点在屏幕上的位置(px)
  offsetY: number;
}

export interface RenderOpts {
  doc: Doc;
  view: ViewTransform;
  width: number;
  height: number;
  selectedContourId: string | null;
  selectedHoleIds: string[];
  selectedPartId: string | null;
  dragAnchor: AnchorRef | null;
  guides: GuideLine[];
  snapPoint: Vec | null;
  hoverPoint: Vec | null;
  outOfBoardPartIds: Set<string>;
  previewContour: Contour | null; // 绘制中的临时轮廓(零件本地坐标)
  previewPartId: string | null;
  findings: { points: Vec[]; severity: string }[];
}

/** 用 OffscreenCanvas 预渲染板材网格(缩放/板幅变化时才重建) */
export class GridCache {
  private canvas: OffscreenCanvas | HTMLCanvasElement;
  private key = '';
  constructor() {
    if (typeof OffscreenCanvas !== 'undefined') {
      this.canvas = new OffscreenCanvas(1, 1);
    } else {
      this.canvas = document.createElement('canvas');
    }
  }

  get valid(): boolean { return this.key !== ''; }

  invalidate(): void { this.key = ''; }

  draw(ctx: CanvasRenderingContext2D, view: ViewTransform, boardW: number, boardH: number, cssW: number, cssH: number): void {
    const key = `${boardW}x${boardH}@${view.scale.toFixed(4)}`;
    const pw = Math.max(1, Math.ceil(boardW * view.scale));
    const ph = Math.max(1, Math.ceil(boardH * view.scale));
    if (key !== this.key || this.canvas.width !== pw || this.canvas.height !== ph) {
      this.canvas.width = pw;
      this.canvas.height = ph;
      const c = this.canvas.getContext('2d')!;
      c.clearRect(0, 0, pw, ph);
      // 板材底色
      c.fillStyle = '#f7f4ec';
      c.fillRect(0, 0, pw, ph);
      // 网格:细格 10mm,粗格 100mm
      const minor = 10 * view.scale;
      const major = 100 * view.scale;
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(120,110,90,0.18)';
      c.beginPath();
      for (let x = minor; x < pw; x += minor) { c.moveTo(x, 0); c.lineTo(x, ph); }
      for (let y = minor; y < ph; y += minor) { c.moveTo(0, y); c.lineTo(pw, y); }
      c.stroke();
      c.strokeStyle = 'rgba(120,110,90,0.38)';
      c.beginPath();
      for (let x = major; x < pw; x += major) { c.moveTo(x, 0); c.lineTo(x, ph); }
      for (let y = major; y < ph; y += major) { c.moveTo(0, y); c.lineTo(pw, y); }
      c.stroke();
      // 板边框
      c.strokeStyle = '#57534e';
      c.lineWidth = 2;
      c.strokeRect(1, 1, pw - 2, ph - 2);
      this.key = key;
    }
    ctx.drawImage(this.canvas, view.offsetX, view.offsetY);
  }
}

export function worldToScreen(p: Vec, view: ViewTransform): Vec {
  return { x: p.x * view.scale + view.offsetX, y: p.y * view.scale + view.offsetY };
}
export function screenToWorld(p: Vec, view: ViewTransform): Vec {
  return { x: (p.x - view.offsetX) / view.scale, y: (p.y - view.offsetY) / view.scale };
}

function pathFromContour(ctx: CanvasRenderingContext2D, c: Contour, tx: number, ty: number, scale: number): void {
  ctx.beginPath();
  for (const s of c.segs) {
    const a = { x: (s.a.x + tx) * scale, y: (s.a.y + ty) * scale };
    const b = { x: (s.b.x + tx) * scale, y: (s.b.y + ty) * scale };
    if (s.type === 'line') {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    } else if (s.type === 'arc') {
      const r = Math.hypot(s.a.x - s.c.x, s.a.y - s.c.y) * scale;
      ctx.moveTo(a.x, a.y);
      ctx.arc((s.c.x + tx) * scale, (s.c.y + ty) * scale, r,
        Math.atan2(s.a.y - s.c.y, s.a.x - s.c.x),
        Math.atan2(s.b.y - s.c.y, s.b.x - s.c.x), !s.ccw);
    } else {
      ctx.moveTo(a.x, a.y);
      ctx.bezierCurveTo(
        (s.c1.x + tx) * scale, (s.c1.y + ty) * scale,
        (s.c2.x + tx) * scale, (s.c2.y + ty) * scale,
        b.x, b.y
      );
    }
  }
  if (c.closed) ctx.closePath();
}

export function render(ctx: CanvasRenderingContext2D, opts: RenderOpts): void {
  const { doc, view, width, height } = opts;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#e9e7e1';
  ctx.fillRect(0, 0, width, height);

  // 网格(OffscreenCanvas 缓存)
  gridCache.draw(ctx, view, doc.board.width, doc.board.height, width, height);

  const outSet = opts.outOfBoardPartIds;

  // 零件
  for (const part of doc.parts) {
    const isActive = part.id === doc.activePartId;
    const out = outSet.has(part.id) || isPartOutOfBoard(doc, part);
    // 零件包围盒
    const bb = partWorldBBox(part);
    const p0 = worldToScreen({ x: bb.minX, y: bb.minY }, view);
    const p1 = worldToScreen({ x: bb.maxX, y: bb.maxY }, view);
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = opts.selectedPartId === part.id ? '#2563eb' : 'rgba(60,60,60,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y);
    ctx.restore();

    ctx.fillStyle = 'rgba(40,40,40,0.65)';
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(part.name, p0.x, Math.max(14, p0.y - 6));

    // 轮廓
    for (const c of part.contours) {
      const selected = opts.selectedContourId === c.id;
      pathFromContour(ctx, c, part.x, part.y, view.scale);
      ctx.lineWidth = selected ? 2.5 : 1.6;
      ctx.strokeStyle = out ? '#e5484d' : selected ? '#2563eb' : isActive ? '#15803d' : '#78716c';
      ctx.stroke();

      if (selected) {
        // 锚点
        const anchors = contourAnchors(c);
        for (let i = 0; i < anchors.length; i++) {
          const a = anchors[i];
          const sp = worldToScreen({ x: a.x + part.x, y: a.y + part.y }, view);
          const isDrag = opts.dragAnchor?.contourId === c.id && opts.dragAnchor.anchor === i;
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, isDrag ? 6 : 4, 0, Math.PI * 2);
          ctx.fillStyle = isDrag ? '#f59e0b' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#2563eb';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    // 孔
    for (const h of part.holes) {
      const sp = worldToScreen({ x: h.cx + part.x, y: h.cy + part.y }, view);
      const r = h.r * view.scale;
      const holeOut = sp.x - r < view.offsetX || sp.y - r < view.offsetY ||
        sp.x + r > view.offsetX + doc.board.width * view.scale ||
        sp.y + r > view.offsetY + doc.board.height * view.scale;
      const selected = opts.selectedHoleIds.includes(h.id);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, r, 0, Math.PI * 2);
      ctx.strokeStyle = holeOut ? '#e5484d' : selected ? '#2563eb' : '#b91c1c';
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.stroke();
      if (selected) {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
      }
      // 十字中心线
      ctx.save();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = holeOut ? 'rgba(229,72,77,0.6)' : 'rgba(185,28,28,0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sp.x - r - 5, sp.y); ctx.lineTo(sp.x + r + 5, sp.y);
      ctx.moveTo(sp.x, sp.y - r - 5); ctx.lineTo(sp.x, sp.y + r + 5);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 绘制中的预览轮廓
  if (opts.previewContour && opts.previewPartId) {
    const part = opts.doc.parts.find(p => p.id === opts.previewPartId);
    if (part) {
      pathFromContour(ctx, opts.previewContour, part.x, part.y, view.scale);
      ctx.strokeStyle = '#7c3aed';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // 检查问题定位标记
  for (const f of opts.findings) {
    const color = f.severity === 'critical' ? '#e5484d' : f.severity === 'major' ? '#f5a524' : '#3b82f6';
    for (const pt of f.points) {
      const sp = worldToScreen(pt, view);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 7, 0, Math.PI * 2);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // 吸附参考线
  for (const g of opts.guides) {
    const a = worldToScreen(g.from, view);
    const b = worldToScreen(g.to, view);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = g.kind === 'hole-center' ? '#db2777' : '#0891b2';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.restore();
  }
  if (opts.snapPoint) {
    const sp = worldToScreen(opts.snapPoint, view);
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 6, 0, Math.PI * 2);
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(sp.x - 9, sp.y); ctx.lineTo(sp.x + 9, sp.y);
    ctx.moveTo(sp.x, sp.y - 9); ctx.lineTo(sp.x, sp.y + 9);
    ctx.stroke();
  }
}

export const gridCache = new GridCache();

/** 供 Worker 批检使用:在 OffscreenCanvas 上光栅化轮廓做辅助判定 */
export function rasterizeContour(c: Contour, resolution = 2): ImageData | null {
  if (typeof OffscreenCanvas === 'undefined') return null;
  const pts = contourPolyline(c, 0.2);
  if (pts.length < 3) return null;
  const minX = Math.min(...pts.map(p => p.x));
  const minY = Math.min(...pts.map(p => p.y));
  const maxX = Math.max(...pts.map(p => p.x));
  const maxY = Math.max(...pts.map(p => p.y));
  const w = Math.max(2, Math.ceil((maxX - minX) * resolution));
  const h = Math.max(2, Math.ceil((maxY - minY) * resolution));
  const cv = new OffscreenCanvas(w, h);
  const ctx = cv.getContext('2d') as unknown as CanvasRenderingContext2D | null;
  if (!ctx) return null;
  ctx.scale(resolution, resolution);
  ctx.translate(-minX, -minY);
  pathFromContour(ctx, c, 0, 0, 1);
  ctx.fillStyle = '#000';
  ctx.fill();
  return ctx.getImageData(0, 0, w, h);
}
