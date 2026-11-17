// SVG 导出:保留图层树分组与图元命名,附带花材编号与尺寸标注,供包装厂做刀版
import { shapeToD, shapeBounds } from './geometry';
import { fmtDay } from './constants';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function buildTree(layers, shapes) {
  const roots = [];
  const map = new Map();
  for (const l of layers) map.set(l.id, { ...l, children: [] });
  for (const s of shapes) {
    const node = { ...s, isShape: true };
    if (s.parentId && map.has(s.parentId)) map.get(s.parentId).children.push(node);
    else roots.push(node);
  }
  for (const l of layers) {
    const node = map.get(l.id);
    if (l.parentId && map.has(l.parentId)) map.get(l.parentId).children.push(node);
    else if (!l.parentId) roots.push(node);
  }
  return roots;
}

function renderNode(node, depth, withAnnotations) {
  const pad = '  '.repeat(depth);
  if (!node.isShape) {
    const items = node.children.map((c) => renderNode(c, depth + 1, withAnnotations)).join('\n');
    return `${pad}<g id="${esc(node.id)}" data-name="${esc(node.name)}" data-type="layer"${node.locked ? ' data-locked="true"' : ''}${node.visible === false ? ' style="display:none"' : ''}>
${items}
${pad}</g>`;
  }
  if (node.visible === false) return '';
  const b = shapeBounds(node);
  const attrs = [
    `id="${esc(node.id)}"`,
    `data-name="${esc(node.name)}"`,
    `data-type="shape"`,
    `data-material-code="${esc(node.materialCode || '')}"`,
    `data-width-mm="${b.width.toFixed(2)}"`,
    `data-height-mm="${b.height.toFixed(2)}"`
  ];
  const label = withAnnotations
    ? `\n${pad}  <text x="${b.minX.toFixed(1)}" y="${(b.minY - 4).toFixed(1)}" font-size="5" fill="#1d4d33" font-family="sans-serif">${esc(node.materialCode || node.name)} · ${b.width.toFixed(1)}×${b.height.toFixed(1)}mm</text>`
    : '';
  return `${pad}<g ${attrs.join(' ')}>
${pad}  <path d="${shapeToD(node)}" fill="${esc(node.fill)}" fill-opacity="0.85" stroke="${esc(node.stroke)}" stroke-width="${node.strokeWidth ?? 0.4}" stroke-linejoin="round"/>${label}
${pad}</g>`;
}

export function exportSVG(project, doc, { withAnnotations = true } = {}) {
  const tree = buildTree(doc.layers, doc.shapes);
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of doc.shapes) {
    if (s.visible === false) continue;
    const b = shapeBounds(s);
    minX = Math.min(minX, b.minX); minY = Math.min(minY, b.minY);
    maxX = Math.max(maxX, b.maxX); maxY = Math.max(maxY, b.maxY);
  }
  if (!isFinite(minX)) { minX = 0; minY = 0; maxX = 400; maxY = 300; }
  const pad = 20;
  minX -= pad; minY -= pad; maxX += pad; maxY += pad;
  const w = (maxX - minX).toFixed(1);
  const h = (maxY - minY).toFixed(1);
  const body = tree.map((n) => renderNode(n, 1, withAnnotations)).filter(Boolean).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(1)} ${minY.toFixed(1)} ${w} ${h}" width="${w}mm" height="${h}mm" data-unit="mm">
  <metadata>
    <project id="${esc(project.id)}" name="${esc(project.name)}"/>
    <festival>${esc(project.festival || '')}</festival>
    <delivery>${esc(project.deliveryDate ? fmtDay(project.deliveryDate) : '')}</delivery>
    <exported>${esc(new Date().toISOString())}</exported>
  </metadata>
${body}
</svg>
`;
}

export function downloadSVG(project, doc, opts) {
  const svg = exportSVG(project, doc, opts);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[\\/:*?"<>|]/g, '_')}_刀版.svg`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
