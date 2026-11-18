import type { ArchiveRecord, ProjectFile, ProjectStats, UnfoldResult } from '../../types';
import type { DiffEntry } from './version-diff';
import { fmt } from './stats';

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export interface ReportInput {
  file: ProjectFile;
  stats: ProjectStats;
  diff: DiffEntry[];
  unfolds: UnfoldResult[];
  alertSummary: { lineName: string; count: number; maxRate: number; minRadius: number }[];
}

/** 生成自包含 HTML 成果报告（归档用） */
export function buildReportHtml(input: ReportInput): string {
  const { file, stats, diff, unfolds, alertSummary } = input;
  const m = file.meta;

  const diffRows = diff
    .map(
      (d) => `<tr class="${d.changed ? 'chg' : ''}">
      <td>${esc(d.label)}</td><td>${d.oldValue}</td><td>${d.newValue}</td>
      <td class="${d.delta.startsWith('-') ? 'neg' : d.delta.startsWith('+') || d.delta === '新增' ? 'pos' : ''}">${d.delta}</td>
    </tr>`
    )
    .join('');

  const alertRows = alertSummary.length
    ? alertSummary
        .map(
          (a) => `<tr><td>${esc(a.lineName)}</td><td>${a.count}</td>
        <td>${fmt(a.maxRate, 6)}</td><td>${fmt(a.minRadius, 2)}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="4" class="empty">无曲率突变段</td></tr>';

  const unfoldRows = unfolds.length
    ? unfolds
        .map(
          (u, i) => `<tr>
        <td>${i + 1}</td><td>${esc(u.lineName)}</td>
        <td>桩段 ${u.segStart}–${u.segEnd}</td>
        <td>${fmt(u.area, 2)}</td><td>${fmt(u.slopeLength, 2)}</td>
        <td>${fmt(u.width, 2)}</td><td>${fmtDate(u.createdAt)}</td></tr>`
        )
        .join('')
    : '<tr><td colspan="7" class="empty">暂无堤坡展开成果</td></tr>';

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>河道建模成果报告 ${esc(m.code)}</title>
<style>
  body{font-family:"Microsoft YaHei",system-ui,sans-serif;margin:32px;color:#1f2937;background:#fff}
  h1{font-size:22px;border-bottom:3px solid #0e7490;padding-bottom:10px;color:#0e7490}
  h2{font-size:16px;margin-top:28px;color:#155e75;border-left:4px solid #0e7490;padding-left:8px}
  table{border-collapse:collapse;width:100%;font-size:12px;margin-top:8px}
  th,td{border:1px solid #cbd5e1;padding:6px 9px;text-align:right}
  th{background:#ecfeff;color:#155e75}
  td:first-child,th:first-child{text-align:left}
  tr.chg{background:#fffbeb}
  .pos{color:#b45309;font-weight:600}.neg{color:#b91c1c;font-weight:600}
  .meta{display:grid;grid-template-columns:repeat(3,1fr);gap:6px 24px;font-size:13px}
  .meta b{color:#475569;font-weight:normal;margin-right:6px}
  .empty{text-align:center;color:#94a3b8}
  .foot{margin-top:40px;font-size:11px;color:#94a3b8;text-align:center}
  .tag{display:inline-block;background:#0e7490;color:#fff;border-radius:4px;padding:2px 8px;font-size:11px}
</style></head><body>
<h1>河道地形曲面与堤线建模成果报告 <span class="tag">v${file.currentVersion}</span></h1>
<div class="meta">
  <div><b>项目编号</b>${esc(m.code)}</div>
  <div><b>项目名称</b>${esc(m.name)}</div>
  <div><b>河流</b>${esc(m.river)}</div>
  <div><b>河段</b>${esc(m.reach)}</div>
  <div><b>建档日期</b>${fmtDate(m.createdAt)}</div>
  <div><b>建模日期</b>${fmtDate(m.updatedAt)}</div>
</div>

<h2>一、关键指标与历史版本比对</h2>
<table><thead><tr><th>指标</th><th>上一版本</th><th>当前版本</th><th>变化量</th></tr></thead>
<tbody>${diffRows}</tbody></table>

<h2>二、曲率突变预警</h2>
<table><thead><tr><th>线路</th><th>突变段数</th><th>最大曲率变化率(1/m²)</th><th>最小曲率半径(m)</th></tr></thead>
<tbody>${alertRows}</tbody></table>

<h2>三、堤坡测地线展开成果</h2>
<table><thead><tr><th>序号</th><th>所属堤线</th><th>选中段</th><th>展开面积(m²)</th><th>坡长(m)</th><th>条带宽(m)</th><th>生成时间</th></tr></thead>
<tbody>${unfoldRows}</tbody></table>

<h2>四、作业参数</h2>
<table><thead><tr><th>参数</th><th>取值</th></tr></thead><tbody>
  <tr><td>等距偏移距离</td><td>${file.settings.offsetDistance} m</td></tr>
  <tr><td>角部处理</td><td>${{ round: '圆角', miter: '尖角', bevel: '斜切' }[file.settings.cornerMode]}</td></tr>
  <tr><td>地形网格间距</td><td>${file.settings.gridSpacing} m</td></tr>
  <tr><td>IDW 幂 / 搜索半径</td><td>${file.settings.idwPower} / ${file.settings.idwRadius} m</td></tr>
  <tr><td>曲率突变阈值</td><td>${file.settings.curvatureAlert} 1/m²</td></tr>
</tbody></table>

<div class="foot">水利测绘院 · 河道地形曲面与堤线建模台自动生成 · ${fmtDate(Date.now())}</div>
</body></html>`;
}

export function archiveRecordFromReport(file: ProjectFile, reportHtml: string, stats: ProjectStats): ArchiveRecord {
  return {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    projectCode: file.meta.code,
    projectName: file.meta.name,
    river: file.meta.river,
    reach: file.meta.reach,
    version: file.currentVersion,
    reportName: `${file.meta.code}_v${file.currentVersion}_成果报告.html`,
    reportHtml,
    snapshot: stats
  };
}
