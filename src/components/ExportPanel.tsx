import { useMemo } from 'react';
import { useStore } from '../store';
import { buildReport, downloadFile, reportToCSV } from '../engine/exporter';
import { LAMP_KIND_LABEL } from '../types';
import type { SimResult } from '../types';

export default function ExportPanel({ sim }: { sim: SimResult | null }) {
  const data = useStore((s) => s.data);
  const report = useMemo(() => buildReport(data, sim), [data, sim]);

  return (
    <div className="panel">
      <h3>灯具清单与功率</h3>
      <div className="export-summary">
        <div><em>{report.lampCount}</em><span>灯具总数</span></div>
        <div><em>{report.totalPowerW}</em><span>总功率 W</span></div>
        <div><em>{(report.totalPowerW / 1000).toFixed(2)}</em><span>kW</span></div>
      </div>
      <div className="kind-chips">
        {(Object.keys(report.byKind) as (keyof typeof report.byKind)[]).map((k) => (
          <span key={k} className="kind-chip">
            {LAMP_KIND_LABEL[k]} ×{report.byKind[k].count}（{report.byKind[k].powerW}W）
          </span>
        ))}
      </div>
      <div className="seg-table-wrap">
        <table className="seg-table">
          <thead>
            <tr>
              <th>航线段</th><th>长度m</th><th>灯具</th><th>功率W</th><th>均照度</th><th>暗区</th>
            </tr>
          </thead>
          <tbody>
            {report.segments.map((s) => (
              <tr key={s.index} className={s.darkZoneCount > 0 ? 'row-warn' : ''}>
                <td>第{s.index + 1}段</td>
                <td>{s.lengthM.toFixed(1)}</td>
                <td>{s.lampCount}</td>
                <td>{s.powerW}</td>
                <td>{s.meanLux.toFixed(1)}</td>
                <td>{s.darkZoneCount}</td>
              </tr>
            ))}
            {report.segments.length === 0 && (
              <tr><td colSpan={6} className="muted">尚未绘制航线</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {report.unassignedLamps.length > 0 && (
        <p className="panel-hint warn">
          {report.unassignedLamps.length} 盏灯距航线超过 30m，未归入航线段，导出时单列。
        </p>
      )}
      <div className="export-actions">
        <button
          className="mini-btn primary"
          onClick={() =>
            downloadFile(
              `${data.meta.name}-灯具清单.csv`,
              reportToCSV(report),
              'text/csv;charset=utf-8',
            )
          }
        >
          导出 CSV 清单
        </button>
        <button
          className="mini-btn"
          onClick={() =>
            downloadFile(
              `${data.meta.name}-方案数据.json`,
              JSON.stringify({ report, project: data }, null, 2),
              'application/json',
            )
          }
        >
          导出 JSON
        </button>
      </div>
    </div>
  );
}
