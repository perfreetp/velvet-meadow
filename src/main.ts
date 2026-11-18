import './styles.css';
import './layout.css';
import { registerComponents } from './ui/components.js';
import { RiverScene } from './three/river-scene.js';
import { projectStore } from './core/archive/project-store.js';
import { workbench, type LineId } from './core/state/workbench.js';
import { computeStats } from './core/archive/stats.js';
import { diffWithPrevious } from './core/archive/version-diff.js';
import { buildReportHtml, archiveRecordFromReport } from './core/archive/report.js';
import { downloadText } from './core/io/importers.js';

registerComponents();

const host = document.getElementById('scene-host')!;
const badge = document.getElementById('scene-badge')!;
const scene = new RiverScene(host);
const statusBar = document.querySelector('status-bar')! as unknown as {
  setHover: (h: { lineId: string; s: number; kappa: number; radius: number } | null) => void;
};

scene.onSectionDrawn = (a, b) => {
  workbench.setSection(a, b);
};
scene.onSlopePicked = (lineId: LineId, a: number, b: number) => {
  const f = workbench.file;
  if (!f) return;
  const width = 40;
  const side = lineId === 'crest-right' ? 'right' : 'left';
  const result = workbench.previewUnfold(lineId, a, b, {
    width,
    crossStep: Math.max(1, f.settings.gridSpacing),
    side
  });
  if (result) scene.rebuildSlopeHighlight();
};
scene.onHoverStation = (info) => {
  statusBar.setHover(info ? { ...info, lineId: info.lineId } : null);
};

// 工具栏事件
document.addEventListener('z-scale', ((e: CustomEvent<number>) => scene.setZExaggeration(e.detail)) as EventListener);
document.addEventListener('fit-view', () => scene.fitView());
document.addEventListener('export-png', () => scene.exportPng());

// 报告与归档
document.addEventListener('make-report', () => {
  const f = workbench.file;
  if (!f) return;
  const stats = computeStats(f, workbench.derivations, workbench.terrain);
  const diff = diffWithPrevious(f.versions, stats);
  const html = buildReportHtml({
    file: f,
    stats,
    diff,
    unfolds: f.unfoldResults,
    alertSummary: workbench.alertSummary()
  });
  const record = archiveRecordFromReport(f, html, stats);
  void projectStore.archive(record).then(() => {
    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
    alert(`报告已归档：${record.reportName}`);
  });
});

// 工程 JSON 导出
document.addEventListener('export-project', () => {
  const f = workbench.file;
  if (!f) return;
  downloadText(`${f.meta.code}_工程.json`, JSON.stringify(f, null, 2), 'application/json');
});

/**
 * 状态 → 场景 的同步。按刷新域增量重建，避免控制点拖拽时重建地形。
 */
let lastProjectCode = '';
workbench.subscribe(() => {
  const f = workbench.file;
  const fl = workbench.flags;
  badge.textContent = f
    ? `${f.meta.code} ｜ ${f.meta.river}/${f.meta.reach} ｜ 控制点 中${f.centerControls.length} 左${f.crestLeftControls.length} 右${f.crestRightControls.length}`
    : '未建档';

  if (!f) {
    scene.setTerrain(null);
    scene.fullRefresh();
    lastProjectCode = '';
    return;
  }

  if (f.meta.code !== lastProjectCode) {
    lastProjectCode = f.meta.code;
    workbench.recomputeTerrain();
    workbench.recomputeLines();
    scene.setTerrain(workbench.terrain);
    scene.fullRefresh();
    return;
  }

  if (fl.terrain) scene.setTerrain(workbench.terrain);
  if (fl.lines) scene.rebuildAllLines();
  if (fl.boundaries) scene.rebuildBoundaries();
  if (fl.section) {
    if (workbench.section) scene.showSection(workbench.section.a, workbench.section.b);
    else scene.clearSection();
  }
  if (fl.slope) scene.rebuildSlopeHighlight();
});
