import type { LineDerivation, ProjectFile, ProjectStats } from '../../types';

export function computeStats(
  file: ProjectFile,
  derivations: Map<string, LineDerivation>,
  terrain: { minZ: number; maxZ: number; maxSlope: number } | null
): ProjectStats {
  const center = derivations.get('center');
  const crestL = derivations.get('crest-left');
  const crestR = derivations.get('crest-right');
  const alertCount = [...derivations.values()].reduce((sum, d) => {
    let n = 0;
    let prev = false;
    for (const a of d.alerts) {
      if (a && !prev) n++; // 连续突变合并计为一段
      prev = a;
    }
    return sum + n;
  }, 0);

  return {
    pointCount: file.elevPoints.length,
    centerControlCount: file.centerControls.length,
    crestLeftCount: file.crestLeftControls.length,
    crestRightCount: file.crestRightControls.length,
    offsetLineCount: file.offsetLines.length,
    centerLength: center?.totalLength ?? 0,
    crestLeftLength: crestL?.totalLength ?? 0,
    crestRightLength: crestR?.totalLength ?? 0,
    minElev: terrain?.minZ ?? 0,
    maxElev: terrain?.maxZ ?? 0,
    maxSlopeDeg: terrain?.maxSlope ?? 0,
    alertSegmentCount: alertCount
  };
}

export function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '∞';
  return n.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
