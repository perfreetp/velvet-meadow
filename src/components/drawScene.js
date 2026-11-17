// Canvas2D 场景绘制:网格 / 路径 / 节点手柄 / 参考线 / 标注 / 版本叠加对比
import { shapeToD, shapeBounds } from '../lib/geometry';

const pathCache = new WeakMap();
export function shapePath2D(shape) {
  let p = pathCache.get(shape);
  if (p) return p;
  p = new Path2D(shapeToD(shape));
  pathCache.set(shape, p);
  return p;
}
export function invalidatePathCache() {
  // WeakMap 随对象回收自动失效,占位以便扩展
}

export function drawScene(ctx, canvas, view, doc, ui) {
  const { zoom, panX, panY } = view;
  const dpr = view.dpr || 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
  ctx.fillStyle = '#eef1f4';
  ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

  ctx.save();
  ctx.translate(panX, panY);
  ctx.scale(zoom, zoom);

  const { canvasW, canvasH, showGrid, showLabels } = doc.settings;

  // 画布底板(单位 mm)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  if (showGrid) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvasW, canvasH);
    ctx.clip();
    ctx.strokeStyle = '#e3e8ee';
    ctx.lineWidth = 0.4 / zoom;
    const step = 10;
    for (let x = step; x < canvasW; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvasH); ctx.stroke();
    }
    for (let y = step; y < canvasH; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvasW, y); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.strokeStyle = '#9aa7b4';
  ctx.lineWidth = 1 / zoom;
  ctx.strokeRect(0, 0, canvasW, canvasH);

  // 版本差异叠加(旧版轮廓在下)
  if (ui.diffDoc) {
    for (const s of ui.diffDoc.shapes) {
      if (s.visible === false) continue;
      const path = shapePath2D(s);
      ctx.save();
      ctx.strokeStyle = 'rgba(180, 90, 30, 0.85)';
      ctx.setLineDash([4 / zoom, 3 / zoom]);
      ctx.lineWidth = 1.2 / zoom;
      ctx.stroke(path);
      ctx.restore();
    }
  }

  const sel = new Set(ui.selection?.shapeIds || []);
  const lockedSet = ui.lockedSet || new Set();

  // 图元
  for (const s of doc.shapes) {
    if (s.visible === false) continue;
    const path = shapePath2D(s);
    ctx.save();
    if (lockedSet.has(s.id)) ctx.globalAlpha = 0.55;
    ctx.fillStyle = s.fill || '#88a';
    ctx.globalAlpha *= 0.82;
    ctx.fill(path);
    ctx.globalAlpha = lockedSet.has(s.id) ? 0.55 : 1;
    ctx.strokeStyle = s.stroke || '#335';
    ctx.lineWidth = (s.strokeWidth ?? 0.4);
    ctx.lineJoin = 'round';
    ctx.stroke(path);
    ctx.restore();

    // 花材编号 + 尺寸标注
    if (showLabels) {
      const b = shapeBounds(s);
      ctx.save();
      ctx.font = `${4.2 / zoom}px ui-sans-serif, system-ui, sans-serif`;
      ctx.textBaseline = 'bottom';
      const label = s.materialCode ? `${s.materialCode}` : s.name;
      const size = `${b.width.toFixed(0)}×${b.height.toFixed(0)}`;
      const tx = b.minX, ty = b.minY - 2 / zoom;
      ctx.fillStyle = 'rgba(255,255,255,0.78)';
      const w1 = ctx.measureText(`${label} ${size}mm`).width + 2 / zoom;
      ctx.fillRect(tx - 0.5 / zoom, ty - 4.6 / zoom, w1, 5.2 / zoom);
      ctx.fillStyle = '#1d4d33';
      ctx.fillText(label, tx, ty);
      ctx.fillStyle = '#5b6b78';
      ctx.fillText(`${size}mm`, tx + ctx.measureText(label).width + 1.5 / zoom, ty);
      ctx.restore();
    }
  }

  // 选中框
  for (const s of doc.shapes) {
    if (!sel.has(s.id)) continue;
    const b = shapeBounds(s);
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1 / zoom;
    ctx.setLineDash([3 / zoom, 2 / zoom]);
    ctx.strokeRect(b.minX, b.minY, b.width, b.height);
    ctx.restore();
  }

  // 钢笔草稿
  if (ui.penDraft && ui.penDraft.length) {
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1 / zoom;
    ctx.beginPath();
    ctx.moveTo(ui.penDraft[0].x, ui.penDraft[0].y);
    for (let i = 1; i < ui.penDraft.length; i++) ctx.lineTo(ui.penDraft[i].x, ui.penDraft[i].y);
    if (ui.penCursor) ctx.lineTo(ui.penCursor.x, ui.penCursor.y);
    ctx.stroke();
    for (const pt of ui.penDraft) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#2563eb';
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2.2 / zoom, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // 节点与控制点
  if (ui.activeShape && (ui.tool === 'node' || ui.tool === 'pen')) {
    const s = ui.activeShape;
    ctx.save();
    const path = shapePath2D(s);
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 1.2 / zoom;
    ctx.stroke(path);
    const activeIdx = ui.selection?.nodeIndex;
    s.points.forEach((pt, i) => {
      // 控制手柄连线
      if (pt.seg === 'C') {
        ctx.strokeStyle = 'rgba(29,78,216,0.7)';
        ctx.lineWidth = 0.8 / zoom;
        if (pt.out) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.out.x, pt.out.y); ctx.stroke(); }
        if (pt.in) { ctx.beginPath(); ctx.moveTo(pt.x, pt.y); ctx.lineTo(pt.in.x, pt.in.y); ctx.stroke(); }
      }
    });
    s.points.forEach((pt, i) => {
      const r = (activeIdx === i ? 3.2 : 2.4) / zoom;
      ctx.fillStyle = activeIdx === i ? '#1d4ed8' : '#ffffff';
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1 / zoom;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      if (pt.seg === 'C') {
        for (const h of [pt.in, pt.out]) {
          if (!h) continue;
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#b45309';
          ctx.beginPath();
          ctx.arc(h.x, h.y, 2 / zoom, 0, Math.PI * 2);
          ctx.fill(); ctx.stroke();
        }
      }
    });
    ctx.restore();
  }

  // 对齐参考线
  if (ui.guides?.length) {
    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 0.8 / zoom;
    for (const g of ui.guides) {
      ctx.beginPath();
      if (g.orient === 'v') {
        ctx.moveTo(g.pos, -2000); ctx.lineTo(g.pos, 2000);
      } else {
        ctx.moveTo(-2000, g.pos); ctx.lineTo(2000, g.pos);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // 批注(评审工具的点/圈选在评审视图单独传 ui.annotations)
  if (ui.annotations?.length) {
    for (const a of ui.annotations) {
      ctx.save();
      if (a.type === 'point') {
        ctx.fillStyle = a.status === 'resolved' ? '#16a34a' : '#dc2626';
        ctx.beginPath();
        ctx.arc(a.x, a.y, 3.5 / zoom, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1 / zoom;
        ctx.stroke();
      } else if (a.type === 'area' && a.points?.length > 2) {
        ctx.beginPath();
        ctx.moveTo(a.points[0].x, a.points[0].y);
        for (let i = 1; i < a.points.length; i++) ctx.lineTo(a.points[i].x, a.points[i].y);
        ctx.closePath();
        ctx.fillStyle = a.status === 'resolved' ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.10)';
        ctx.fill();
        ctx.strokeStyle = a.status === 'resolved' ? '#16a34a' : '#dc2626';
        ctx.lineWidth = 1.2 / zoom;
        ctx.setLineDash([4 / zoom, 3 / zoom]);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 矩形/椭圆创建中的预览
  if (ui.areaDraft && ui.areaDraft.length) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ui.areaDraft[0].x, ui.areaDraft[0].y);
    for (let i = 1; i < ui.areaDraft.length; i++) ctx.lineTo(ui.areaDraft[i].x, ui.areaDraft[i].y);
    ctx.fillStyle = 'rgba(220,38,38,0.08)';
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 1.2 / zoom;
    ctx.setLineDash([4 / zoom, 3 / zoom]);
    ctx.fill(); ctx.stroke();
    for (const pt of ui.areaDraft) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2 / zoom, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
    }
    ctx.restore();
  }

  if (ui.creating) {
    const c = ui.creating;
    ctx.save();
    ctx.strokeStyle = '#2563eb';
    ctx.fillStyle = 'rgba(37,99,235,0.10)';
    ctx.lineWidth = 1 / zoom;
    const x = Math.min(c.x0, c.x1), y = Math.min(c.y0, c.y1);
    const w = Math.abs(c.x1 - c.x0), h = Math.abs(c.y1 - c.y0);
    if (c.kind === 'rect') {
      ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
    } else {
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
    }
    ctx.restore();
  }

  // 框选
  if (ui.marquee) {
    const m = ui.marquee;
    ctx.save();
    ctx.fillStyle = 'rgba(37,99,235,0.08)';
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 0.8 / zoom;
    ctx.fillRect(Math.min(m.x0, m.x1), Math.min(m.y0, m.y1), Math.abs(m.x1 - m.x0), Math.abs(m.y1 - m.y0));
    ctx.strokeRect(Math.min(m.x0, m.x1), Math.min(m.y0, m.y1), Math.abs(m.x1 - m.x0), Math.abs(m.y1 - m.y0));
    ctx.restore();
  }

  ctx.restore();
}
