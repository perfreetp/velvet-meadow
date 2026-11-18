import type { BoundaryLine, ElevPoint, Vec2 } from '../../types.js';

/** 解析通用文本高程表：每行 "x,y,z" 或 "x y z"，支持表头与常见分隔符 */
export function parseElevationText(text: string): ElevPoint[] {
  const out: ElevPoint[] = [];
  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/[\s,;\t]+/).filter(Boolean);
    if (parts.length < 3) continue;
    const nums = parts.slice(0, 3).map(Number);
    if (nums.some((n) => !Number.isFinite(n))) continue;
    // 跳过表头行
    if (parts.slice(0, 3).some((p) => Number.isNaN(Number(p)))) continue;
    out.push({ x: nums[0], y: nums[1], z: nums[2], section: parts[3] });
  }
  if (out.length === 0) throw new Error('未解析到有效高程点（每行需包含 x,y,z 三个数值）');
  return out;
}

/** 解析边界折线文本：每行 x,y；空行或 "#closed" 表示闭合环 */
export function parseBoundaryText(text: string, name: string): BoundaryLine {
  const pts: Vec2[] = [];
  let closed = false;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line.toLowerCase().startsWith('#closed')) {
      closed = true;
      continue;
    }
    if (line.startsWith('#')) continue;
    const parts = line.split(/[\s,;\t]+/).filter(Boolean);
    if (parts.length < 2) continue;
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
  }
  if (pts.length < 3) throw new Error('边界至少需要 3 个点');
  return {
    id: crypto.randomUUID(),
    name,
    points: pts,
    closed,
    kind: 'boundary'
  };
}

interface GeoJsonGeom {
  type: string;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
}

/** 轻量 GeoJSON 解析：Point 取高程点；LineString/Polygon 取边界 */
export function parseGeoJson(text: string): { elev: ElevPoint[]; boundaries: BoundaryLine[] } {
  const doc = JSON.parse(text) as { features?: { geometry: GeoJsonGeom; properties?: Record<string, unknown> }[] };
  const features = doc.features ?? [];
  const elev: ElevPoint[] = [];
  const boundaries: BoundaryLine[] = [];

  const pushElev = (c: number[]) => {
    if (c.length >= 3 && c.every((v) => Number.isFinite(v))) {
      elev.push({ x: c[0], y: c[1], z: c[2] });
    }
  };

  for (const f of features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Point') {
      pushElev(g.coordinates as number[]);
    } else if (g.type === 'MultiPoint') {
      for (const c of g.coordinates as number[][]) pushElev(c);
    } else if (g.type === 'LineString') {
      const pts = (g.coordinates as number[][]).map((c) => ({ x: c[0], y: c[1] }));
      if (pts.length >= 2) {
        boundaries.push({
          id: crypto.randomUUID(),
          name: String(f.properties?.name ?? '边界线'),
          points: pts,
          closed: false,
          kind: 'boundary'
        });
      }
    } else if (g.type === 'Polygon') {
      const ring = (g.coordinates as number[][][])[0];
      const pts = ring.map((c) => ({ x: c[0], y: c[1] }));
      // GeoJSON 环首尾重复，去掉
      if (pts.length > 1) {
        const a = pts[0];
        const b = pts[pts.length - 1];
        if (Math.hypot(a.x - b.x, a.y - b.y) < 1e-9) pts.pop();
      }
      if (pts.length >= 3) {
        boundaries.push({
          id: crypto.randomUUID(),
          name: String(f.properties?.name ?? '河道边界'),
          points: pts,
          closed: true,
          kind: 'boundary'
        });
      }
    }
  }
  if (elev.length === 0 && boundaries.length === 0) {
    throw new Error('GeoJSON 中未找到 Point 高程点或 LineString/Polygon 边界');
  }
  return { elev, boundaries };
}

export function downloadText(filename: string, content: string, mime = 'text/plain'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
