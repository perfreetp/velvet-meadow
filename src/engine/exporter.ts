import type { Lamp, ProjectData, SceneRoute, Vec2, SimResult } from '../types';
import { LAMP_KIND_LABEL } from '../types';
import { LAMP_CATALOG } from './photometry';
import {
  dist,
  pointPolylineDist,
  polylineLength,
  samplePolyline,
} from './geometry';

export interface RouteSegmentReport {
  index: number;
  from: Vec2;
  to: Vec2;
  lengthM: number;
  lamps: { id: string; name: string; kind: Lamp['kind']; powerW: number; colorTemp: number }[];
  powerW: number;
  lampCount: number;
  meanLux: number;
  darkZoneCount: number;
}

export interface ExportReport {
  projectName: string;
  exportedAt: number;
  timeHour: number;
  totalPowerW: number;
  lampCount: number;
  byKind: Record<Lamp['kind'], { count: number; powerW: number }>;
  segments: RouteSegmentReport[];
  unassignedLamps: Lamp[];
}

const ASSOC_MAX_DIST = 30; // 灯具归属航线段的最大垂直距离 m

function nearestSegmentIndex(route: SceneRoute, p: Vec2): { idx: number; d: number } {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < route.points.length - 1; i++) {
    const a = route.points[i];
    const b = route.points[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    const q = { x: a.x + t * dx, y: a.y + t * dy };
    const d = dist(p, q);
    if (d < bestD) { bestD = d; best = i; }
  }
  return { idx: best, d: bestD };
}

export function buildReport(
  data: ProjectData,
  sim: SimResult | null,
): ExportReport {
  const routes = data.elements.filter((e): e is SceneRoute => e.type === 'route');
  const lamps = data.elements.filter((e): e is Lamp => e.type === 'lamp');
  const byKind = Object.fromEntries(
    (Object.keys(LAMP_CATALOG) as Lamp['kind'][]).map((k) => [k, { count: 0, powerW: 0 }]),
  ) as ExportReport['byKind'];
  for (const l of lamps) {
    byKind[l.kind].count++;
    byKind[l.kind].powerW += l.powerW;
  }

  const segments: RouteSegmentReport[] = [];
  const assigned = new Set<string>();

  routes.forEach((route, ri) => {
    for (let i = 0; i < route.points.length - 1; i++) {
      const a = route.points[i];
      const b = route.points[i + 1];
      segments.push({
        index: segments.length,
        from: a,
        to: b,
        lengthM: dist(a, b),
        lamps: [],
        powerW: 0,
        lampCount: 0,
        meanLux: 0,
        darkZoneCount: 0,
      });
    }
    void ri;
  });

  const unassigned: Lamp[] = [];
  for (const lamp of lamps) {
    let chosen: { route: number; idx: number; d: number } | null = null;
    for (let ri = 0; ri < routes.length; ri++) {
      const r = nearestSegmentIndex(routes[ri], lamp.pos);
      if (chosen === null || r.d < chosen.d) {
        chosen = { route: ri, idx: r.idx, d: r.d };
      }
    }
    if (chosen && chosen.d <= ASSOC_MAX_DIST && routes.length) {
      // 多航线时换算成全局段号
      let base = 0;
      for (let ri = 0; ri < chosen.route; ri++) base += routes[ri].points.length - 1;
      const seg = segments[base + chosen.idx];
      seg.lamps.push({
        id: lamp.id,
        name: lamp.name,
        kind: lamp.kind,
        powerW: lamp.powerW,
        colorTemp: lamp.colorTemp,
      });
      seg.powerW += lamp.powerW;
      seg.lampCount++;
      assigned.add(lamp.id);
    } else {
      unassigned.push(lamp);
    }
  }

  // 用仿真结果给每段补平均照度与暗区数
  if (sim) {
    for (const seg of segments) {
      const routeLine = [seg.from, seg.to];
      let sum = 0, cnt = 0, dark = 0;
      const seen = new Set<number>();
      const steps = Math.max(2, Math.ceil(seg.lengthM / sim.cellSize));
      for (let s = 0; s <= steps; s++) {
        const sample = samplePolyline(routeLine, (seg.lengthM * s) / steps);
        if (!sample) continue;
        // 航线两侧 3m 带宽采样
        for (const off of [-3, 0, 3]) {
          const p = {
            x: sample.pos.x - sample.dir.y * off,
            y: sample.pos.y + sample.dir.x * off,
          };
          const cx = Math.floor((p.x - sim.gridOrigin.x) / sim.cellSize);
          const cy = Math.floor((p.y - sim.gridOrigin.y) / sim.cellSize);
          if (cx < 0 || cy < 0 || cx >= sim.cols || cy >= sim.rows) continue;
          const idx = cy * sim.cols + cx;
          if (!sim.inWater[idx] || seen.has(idx)) continue;
          seen.add(idx);
          sum += sim.total[idx];
          cnt++;
          if (sim.total[idx] < data.luxThreshold) dark++;
        }
      }
      seg.meanLux = cnt ? sum / cnt : 0;
      seg.darkZoneCount = sim.darkZones.filter((dz) => {
        const d = pointPolylineDist(dz.centroid, routeLine);
        return d <= 6;
      }).length;
    }
  }

  return {
    projectName: data.meta.name,
    exportedAt: Date.now(),
    timeHour: data.timeHour,
    totalPowerW: lamps.reduce((s, l) => s + l.powerW, 0),
    lampCount: lamps.length,
    byKind,
    segments,
    unassignedLamps: unassigned,
  };
}

export function reportToCSV(report: ExportReport): string {
  const rows: string[] = [];
  rows.push('# 内河夜游布光灯具清单');
  rows.push(`方案,${report.projectName}`);
  rows.push(`导出时间,${new Date(report.exportedAt).toLocaleString('zh-CN')}`);
  rows.push(`预览时刻,${report.timeHour.toFixed(1)}:00`);
  rows.push(`灯具总数,${report.lampCount}`);
  rows.push(`总功率(W),${report.totalPowerW}`);
  rows.push('');
  rows.push('灯型,数量,功率合计(W)');
  for (const k of Object.keys(report.byKind) as Lamp['kind'][]) {
    rows.push(`${LAMP_KIND_LABEL[k]},${report.byKind[k].count},${report.byKind[k].powerW}`);
  }
  rows.push('');
  rows.push('航线段,段长(m),灯具数,功率(W),平均照度(lux),暗区数,灯具明细');
  for (const s of report.segments) {
    const detail = s.lamps
      .map((l) => `${l.name}(${LAMP_KIND_LABEL[l.kind]}/${l.powerW}W/${l.colorTemp}K)`)
      .join('；');
    rows.push(
      `第${s.index + 1}段,${s.lengthM.toFixed(1)},${s.lampCount},${s.powerW},${s.meanLux.toFixed(1)},${s.darkZoneCount},"${detail}"`,
    );
  }
  if (report.unassignedLamps.length) {
    rows.push('');
    rows.push('未归属航线的灯具');
    for (const l of report.unassignedLamps) {
      rows.push(`${l.name},${LAMP_KIND_LABEL[l.kind]},${l.powerW}W,${l.colorTemp}K`);
    }
  }
  return '﻿' + rows.join('\n');
}

export function downloadFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function totalRouteLength(data: ProjectData): number {
  return data.elements
    .filter((e): e is SceneRoute => e.type === 'route')
    .reduce((s, r) => s + polylineLength(r.points), 0);
}
