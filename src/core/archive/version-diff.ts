import type { ProjectStats, VersionInfo } from '../../types';

export interface DiffEntry {
  label: string;
  oldValue: string;
  newValue: string;
  delta: string;
  changed: boolean;
}

const FIELDS: { key: keyof ProjectStats; label: string; digits?: number }[] = [
  { key: 'pointCount', label: '高程点数' },
  { key: 'centerControlCount', label: '中心线控制点数' },
  { key: 'crestLeftCount', label: '左堤顶控制点数' },
  { key: 'crestRightCount', label: '右堤顶控制点数' },
  { key: 'offsetLineCount', label: '管理范围线条数' },
  { key: 'centerLength', label: '中心线长度(m)', digits: 2 },
  { key: 'crestLeftLength', label: '左堤顶线长度(m)', digits: 2 },
  { key: 'crestRightLength', label: '右堤顶线长度(m)', digits: 2 },
  { key: 'minElev', label: '最低高程(m)', digits: 3 },
  { key: 'maxElev', label: '最高高程(m)', digits: 3 },
  { key: 'maxSlopeDeg', label: '最大坡度(°)', digits: 2 },
  { key: 'alertSegmentCount', label: '曲率突变段数' }
];

function num(v: number, d = 0): string {
  return v.toLocaleString('zh-CN', { minimumFractionDigits: d, maximumFractionDigits: d });
}

/** 与上一版本比对；无历史版本时返回空 */
export function diffWithPrevious(versions: VersionInfo[], current: ProjectStats): DiffEntry[] {
  if (versions.length === 0) {
    return FIELDS.map((f) => ({
      label: f.label,
      oldValue: '—',
      newValue: num(current[f.key], f.digits),
      delta: '新增',
      changed: true
    }));
  }
  const prev = versions[versions.length - 1].stats;
  return FIELDS.map((f) => {
    const a = prev[f.key];
    const b = current[f.key];
    const d = b - a;
    return {
      label: f.label,
      oldValue: num(a, f.digits),
      newValue: num(b, f.digits),
      delta: d === 0 ? '0' : (d > 0 ? '+' : '') + num(d, f.digits),
      changed: d !== 0
    };
  });
}
