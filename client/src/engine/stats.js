// 街坊级统计：平均照度、暗区占比；CSV 导出
import { polygonCentroid, pointInPolygon } from './geometry.js';

/**
 * @param result computeLighting 的输出
 * @param buildings 建筑（含 blockId / blockName）
 * @param blocks 街坊定义 [{id,name,polygon}]，缺省时按建筑 blockId 聚合
 */
export function computeBlockStats(result, buildings, blocks, darkThreshold = 20) {
  const { cols, rows, cell, bounds, lux, darkMask } = result;
  const out = [];

  const regions = blocks && blocks.length
    ? blocks.map((b) => ({ id: b.id, name: b.name || b.id, polygon: b.polygon }))
    : deriveBlocksFromBuildings(buildings);

  for (const region of regions) {
    let sum = 0, count = 0, dark = 0;
    let minLux = Infinity, maxLux = 0;
    for (let gy = 0; gy < rows; gy++) {
      for (let gx = 0; gx < cols; gx++) {
        const px = bounds.minX + (gx + 0.5) * cell;
        const py = bounds.minY + (gy + 0.5) * cell;
        if (!pointInPolygon(px, py, region.polygon)) continue;
        const idx = gy * cols + gx;
        if (result.buildingMask[idx]) continue; // 建筑占地不纳入地面照度统计
        const v = lux[idx];
        sum += v; count++;
        if (v < minLux) minLux = v;
        if (v > maxLux) maxLux = v;
        if (darkMask[idx]) dark++;
      }
    }
    if (count === 0) continue;
    out.push({
      blockId: region.id,
      blockName: region.name,
      cells: count,
      areaM2: count * cell * cell,
      avgLux: round(sum / count, 2),
      minLux: round(minLux === Infinity ? 0 : minLux, 2),
      maxLux: round(maxLux, 2),
      darkCells: dark,
      darkAreaM2: dark * cell * cell,
      darkRatio: round(dark / count, 4),
    });
  }

  // 全域汇总（仅非建筑格）
  let totalCells = 0, totalDark = 0, totalSum = 0;
  for (let i = 0; i < cols * rows; i++) {
    if (result.buildingMask[i]) continue;
    totalCells++;
    totalSum += lux[i];
    if (darkMask[i]) totalDark++;
  }
  const summary = {
    totalCells,
    totalAreaM2: totalCells * cell * cell,
    avgLux: round(totalSum / totalCells, 2),
    darkCells: totalDark,
    darkAreaM2: totalDark * cell * cell,
    darkRatio: round(totalDark / totalCells, 4),
    darkThreshold,
    zoneCount: result.darkZones.length,
  };
  return { blocks: out, summary };
}

function deriveBlocksFromBuildings(buildings) {
  const map = new Map();
  for (const b of buildings) {
    const id = b.blockId || 'default';
    if (!map.has(id)) {
      map.set(id, { id, name: b.blockName || `街坊 ${id}`, points: [] });
    }
    const c = polygonCentroid(b.polygon);
    map.get(id).points.push(c);
  }
  // 没有街坊边界时退化为点集合（统计会在调用处兜底），这里给一个足够大的包络圆方盒
  return [...map.values()].map((g) => {
    const xs = g.points.map((p) => p.x), ys = g.points.map((p) => p.y);
    const minX = Math.min(...xs) - 20, maxX = Math.max(...xs) + 20;
    const minY = Math.min(...ys) - 20, maxY = Math.max(...ys) + 20;
    return {
      id: g.id, name: g.name,
      polygon: [
        { x: minX, y: minY }, { x: maxX, y: minY },
        { x: maxX, y: maxY }, { x: minX, y: maxY },
      ],
    };
  });
}

function round(v, digits) {
  const f = 10 ** digits;
  return Math.round(v * f) / f;
}

export function statsToCSV(stats) {
  const header = ['街坊编号', '街坊名称', '统计格数', '面积(m²)', '平均照度(lx)', '最小照度(lx)', '最大照度(lx)', '暗区格数', '暗区面积(m²)', '暗区占比'];
  const lines = [header.join(',')];
  for (const b of stats.blocks) {
    lines.push([
      b.blockId, b.blockName, b.cells, b.areaM2, b.avgLux, b.minLux, b.maxLux,
      b.darkCells, b.darkAreaM2, `${(b.darkRatio * 100).toFixed(2)}%`,
    ].join(','));
  }
  const s = stats.summary;
  lines.push('');
  lines.push(['全域汇总', '', s.totalCells, s.totalAreaM2, s.avgLux, '', '', s.darkCells, s.darkAreaM2, `${(s.darkRatio * 100).toFixed(2)}%`].join(','));
  lines.push(`暗区阈值,${s.darkThreshold}lx,暗区块数,${s.zoneCount}`);
  return '﻿' + lines.join('\n'); // BOM，Excel 直接打开不乱码
}

export function darkZonesToCSV(zones) {
  const header = ['暗区块编号', '格数', '面积(m²)', '西x(m)', '北y(m)', '东x(m)', '南y(m)'];
  const lines = [header.join(',')];
  for (const z of zones) {
    const b = z.worldBBox;
    lines.push([
      z.id + 1, z.cells, z.areaM2,
      b.minX, b.minY, b.maxX, b.maxY,
    ].join(','));
  }
  return '﻿' + lines.join('\n');
}
