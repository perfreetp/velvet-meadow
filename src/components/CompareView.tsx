import { useMemo, useRef } from 'react';
import { useStore } from '../store';
import SceneCanvas from './SceneCanvas';
import { useSimulation } from '../hooks/useSimulation';
import { simulate } from '../engine/simulation';
import { LAMP_KIND_LABEL } from '../types';
import type { ProjectData, SceneElement } from '../types';
import type { CameraState } from '../three/ThreeStage';

interface DiffEntry {
  kind: 'add' | 'remove' | 'change';
  name: string;
  detail: string;
}

function diffProjects(a: ProjectData, b: ProjectData): DiffEntry[] {
  const mapA = new Map(a.elements.map((e) => [e.id, e]));
  const mapB = new Map(b.elements.map((e) => [e.id, e]));
  const out: DiffEntry[] = [];
  for (const [id, elB] of mapB) {
    const elA = mapA.get(id);
    if (!elA) {
      out.push({ kind: 'add', name: elB.name, detail: `新增${elB.type === 'lamp' ? LAMP_KIND_LABEL[elB.kind] : elB.type}` });
      continue;
    }
    if (elA.type === 'lamp' && elB.type === 'lamp') {
      const changes: string[] = [];
      if (elA.powerW !== elB.powerW) changes.push(`功率 ${elA.powerW}→${elB.powerW}W`);
      if (elA.colorTemp !== elB.colorTemp) changes.push(`色温 ${elA.colorTemp}→${elB.colorTemp}K`);
      if (elA.beamAngleDeg !== elB.beamAngleDeg) changes.push(`光束角 ${elA.beamAngleDeg}→${elB.beamAngleDeg}°`);
      if (Math.abs(elA.aim - elB.aim) > 0.01) changes.push('投光方向调整');
      if (Math.hypot(elA.pos.x - elB.pos.x, elA.pos.y - elB.pos.y) > 0.05) changes.push('灯位移动');
      if (elA.height !== elB.height) changes.push(`高度 ${elA.height}→${elB.height}m`);
      if (changes.length) out.push({ kind: 'change', name: elB.name, detail: changes.join('；') });
    } else if (JSON.stringify(elA) !== JSON.stringify(elB)) {
      out.push({ kind: 'change', name: elB.name, detail: '几何/属性变化' });
    }
  }
  for (const [id, elA] of mapA) {
    if (!mapB.has(id)) {
      out.push({
        kind: 'remove',
        name: elA.name,
        detail: `删除${elA.type === 'lamp' ? LAMP_KIND_LABEL[(elA as SceneElement & { kind: keyof typeof LAMP_KIND_LABEL }).kind] : elA.type}`,
      });
    }
  }
  const cmtDiff = b.comments.length - a.comments.length;
  if (cmtDiff !== 0) {
    out.push({
      kind: 'change',
      name: '批注',
      detail: cmtDiff > 0 ? `新增 ${cmtDiff} 条批注` : `减少 ${-cmtDiff} 条批注`,
    });
  }
  return out;
}

export default function CompareView({ versionId, onClose }: { versionId: string; onClose: () => void }) {
  const current = useStore((s) => s.data);
  const version = useStore((s) => s.versions.find((v) => v.id === versionId));
  const camRef = useRef<CameraState | null>(null);
  const simCurrent = useSimulation(current, 0);
  const simVersion = useMemo(() => (version ? simulate(version.data) : null), [version]);

  if (!version) return null;
  const diff = diffProjects(version.data, current);
  const powerA = version.data.elements.reduce((s, e) => s + (e.type === 'lamp' ? e.powerW : 0), 0);
  const powerB = current.elements.reduce((s, e) => s + (e.type === 'lamp' ? e.powerW : 0), 0);

  return (
    <div className="compare-overlay">
      <div className="compare-head">
        <h3>版本并排比对（相机缩放/平移双向联动）</h3>
        <button className="mini-btn primary" onClick={onClose}>退出比对</button>
      </div>
      <div className="compare-stage">
        <div className="compare-pane">
          <div className="pane-title">
            {version.label}
            <span>{new Date(version.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
            <em>{powerA} W · 平均照度 {simVersion?.stats.meanLux.toFixed(1) ?? '-'} lux</em>
          </div>
          <SceneCanvas data={version.data} sim={simVersion} sharedCam={camRef} height="100%" />
        </div>
        <div className="compare-pane">
          <div className="pane-title current">
            当前工作区
            <em>{powerB} W · 平均照度 {simCurrent?.stats.meanLux.toFixed(1) ?? '-'} lux</em>
          </div>
          <SceneCanvas
            data={current}
            sim={simCurrent}
            sharedCam={camRef}
            height="100%"
          />
        </div>
      </div>
      <div className="compare-diff">
        <h4>
          差异清单
          <span className="badge badge-red">{diff.length} 项</span>
          <span className={`delta ${powerB - powerA >= 0 ? 'up' : 'down'}`}>
            总功率变化 {powerB - powerA >= 0 ? '+' : ''}{powerB - powerA} W
          </span>
        </h4>
        <div className="diff-list">
          {diff.length === 0 && <p className="panel-hint ok">两个版本内容一致。</p>}
          {diff.map((d, i) => (
            <div key={i} className={`diff-item diff-${d.kind}`}>
              <span className="diff-tag">
                {d.kind === 'add' ? '新增' : d.kind === 'remove' ? '删除' : '修改'}
              </span>
              <b>{d.name}</b>
              <span>{d.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
