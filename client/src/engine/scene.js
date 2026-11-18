// 场景模型：默认值、GeoJSON 导入、样板场景
import { kelvinToRGB } from './color.js';

let seq = 1;
export function uid(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}${Math.floor(performance.now() % 1000).toString(36)}`;
}

export const LIGHT_DEFAULTS = {
  street: { label: '路灯', height: 8, radius: 18, cct: 3000, power: 12, size: 0.4 },
  courtyard: { label: '庭院灯', height: 3.5, radius: 8, cct: 2700, power: 5, size: 0.25 },
  wallwash: { label: '洗墙灯', height: 2.5, radius: 6, cct: 2200, power: 8, size: 0.15 },
};

export function makeLight(type, x, y, extra = {}) {
  const d = LIGHT_DEFAULTS[type];
  return {
    id: uid('light'),
    type, x, y,
    height: d.height,
    radius: d.radius,
    cct: d.cct,
    power: d.power,
    size: d.size,
    washTarget: null,
    ...extra,
  };
}

export function makeBuilding(x, y, blockId = 'B1') {
  const w = 12 + Math.round(performance.now() % 8);
  const h = 8 + Math.round(performance.now() % 6);
  return {
    id: uid('bld'),
    name: `建筑 ${seq}`,
    blockId,
    blockName: '街坊一',
    floors: 2,
    polygon: rectanglePolygon(x - w / 2, y - h / 2, w, h),
  };
}

export function rectanglePolygon(x, y, w, h) {
  return [
    { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h },
  ];
}

// 从 GeoJSON FeatureCollection 导入：Polygon/MultiPolygon 面要素 -> 建筑
export function importGeoJSON(text, fallbackBlock = 'B1') {
  const doc = JSON.parse(text);
  const features = doc.type === 'FeatureCollection' ? doc.features
    : doc.type === 'Feature' ? [doc] : [];
  const buildings = [];
  let bounds = null;
  for (const f of features) {
    const geom = f.geometry || f;
    if (!geom || (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon')) continue;
    const props = f.properties || {};
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    for (const rings of polys) {
      const ring = rings[0]; // 只取外环
      const polygon = ring.slice(0, -1).map(([x, y]) => ({ x, y }));
      if (polygon.length < 3) continue;
      const b = {
        id: uid('bld'),
        name: props.name || props.NAME || `导入建筑 ${buildings.length + 1}`,
        blockId: props.blockId || props.block || fallbackBlock,
        blockName: props.blockName || '导入街坊',
        floors: clampFloors(props.floors || props.layers || props['层数']),
        polygon,
      };
      buildings.push(b);
      bounds = extendBounds(bounds, polygon);
    }
  }
  return { buildings, bounds };
}

function clampFloors(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 2;
  return Math.max(1, Math.min(40, Math.round(n)));
}

export function extendBounds(bounds, polygon) {
  const xs = polygon.map((p) => p.x), ys = polygon.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  if (!bounds) return { minX, minY, maxX, maxY };
  return {
    minX: Math.min(bounds.minX, minX), minY: Math.min(bounds.minY, minY),
    maxX: Math.max(bounds.maxX, maxX), maxY: Math.max(bounds.maxY, maxY),
  };
}

export function sceneBounds(buildings, padding = 15) {
  let bounds = null;
  for (const b of buildings) bounds = extendBounds(bounds, b.polygon);
  if (!bounds) return { minX: 0, minY: 0, maxX: 120, maxY: 90 };
  return {
    minX: Math.floor(bounds.minX - padding),
    minY: Math.floor(bounds.minY - padding),
    maxX: Math.ceil(bounds.maxX + padding),
    maxY: Math.ceil(bounds.maxY + padding),
  };
}

export function exportGeoJSON(buildings) {
  return {
    type: 'FeatureCollection',
    features: buildings.map((b) => ({
      type: 'Feature',
      properties: { name: b.name, blockId: b.blockId, blockName: b.blockName, floors: b.floors },
      geometry: {
        type: 'Polygon',
        coordinates: [b.polygon.map((p) => [p.x, p.y]).concat([[b.polygon[0].x, b.polygon[0].y]])],
      },
    })),
  };
}

// 内置样板：两排围合式民居 + 三条巷弄 + 预置灯具
export function sampleScene() {
  const buildings = [];
  const blocks = [
    { id: 'B1', name: '街坊一', polygon: rectanglePolygon(0, 0, 60, 80) },
    { id: 'B2', name: '街坊二', polygon: rectanglePolygon(66, 0, 60, 80) },
  ];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const x = 6 + col * 28;
      const y = 6 + row * 19;
      buildings.push({
        id: uid('bld'), name: `民居 ${buildings.length + 1}`,
        blockId: 'B1', blockName: '街坊一',
        floors: 1 + ((row + col) % 3),
        polygon: rectanglePolygon(x, y, 18, 11),
      });
    }
  }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 2; col++) {
      const x = 72 + col * 28;
      const y = 6 + row * 19;
      buildings.push({
        id: uid('bld'), name: `民居 ${buildings.length + 1}`,
        blockId: 'B2', blockName: '街坊二',
        floors: 2 + ((row + 1) % 2),
        polygon: rectanglePolygon(x, y, 18, 11),
      });
    }
  }
  // 中央主街（两街坊之间 x≈63）纵向布灯
  const lights = [
    makeLight('street', 63, 8), makeLight('street', 63, 28),
    makeLight('street', 63, 48), makeLight('street', 63, 68),
  ];
  // 两街坊内部横向巷弄（每排建筑间 y≈25/44/63）补灯
  for (const y of [25, 44, 63]) {
    lights.push(makeLight('street', 34, y));
    lights.push(makeLight('street', 100, y));
  }
  // 庭院灯落在院落中心
  lights.push(makeLight('courtyard', 30, 14), makeLight('courtyard', 96, 14));
  lights.push(makeLight('courtyard', 30, 52), makeLight('courtyard', 96, 52));
  // 洗墙灯打亮沿街立面
  lights.push(makeLight('wallwash', 6, 19, { washTarget: { x: 6, y: 17 } }));
  lights.push(makeLight('wallwash', 72, 19, { washTarget: { x: 72, y: 17 } }));
  lights.push(makeLight('wallwash', 6, 57, { washTarget: { x: 6, y: 55 } }));
  lights.push(makeLight('wallwash', 72, 57, { washTarget: { x: 72, y: 55 } }));
  return {
    buildings, lights, blocks,
    bounds: { minX: -5, minY: -5, maxX: 137, maxY: 90 },
  };
}

export { kelvinToRGB };
