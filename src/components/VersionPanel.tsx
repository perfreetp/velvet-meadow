import { useState } from 'react';
import { useStore } from '../store';

export default function VersionPanel({ onCompare }: { onCompare: (versionId: string) => void }) {
  const versions = useStore((s) => s.versions);
  const commitVersion = useStore((s) => s.commitVersion);
  const restoreVersion = useStore((s) => s.restoreVersion);
  const deleteVersion = useStore((s) => s.deleteVersion);
  const compareVersionId = useStore((s) => s.compareVersionId);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  return (
    <div className="panel">
      <h3>版本管理</h3>
      <div className="version-form">
        <input
          className="text-input"
          placeholder="版本标签，如 V1 初评 / V2 加灯"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        <textarea
          className="text-input"
          rows={2}
          placeholder="版本说明（改动摘要）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          className="mini-btn primary full"
          onClick={() => {
            if (!label.trim()) return;
            commitVersion(label.trim(), note.trim());
            setLabel('');
            setNote('');
          }}
        >
          提交新版本快照
        </button>
      </div>
      <div className="version-list">
        {versions.length === 0 && <p className="panel-hint">还没有版本，提交后可随时回滚或并排比对。</p>}
        {versions.map((v) => (
          <div key={v.id} className={`version-item ${compareVersionId === v.id ? 'picked' : ''}`}>
            <div className="version-head">
              <b>{v.label}</b>
              <span>{new Date(v.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
            </div>
            {v.note && <div className="version-note">{v.note}</div>}
            <div className="version-meta">
              灯具 {v.data.elements.filter((e) => e.type === 'lamp').length} 盏 ·
              功率 {v.data.elements.reduce((s, e) => s + (e.type === 'lamp' ? e.powerW : 0), 0)}W ·
              批注 {v.data.comments.length} 条
            </div>
            <div className="version-actions">
              <button className="mini-btn" onClick={() => restoreVersion(v.id)}>回滚</button>
              <button className="mini-btn primary" onClick={() => onCompare(v.id)}>与当前并排比对</button>
              <button className="mini-btn danger" onClick={() => deleteVersion(v.id)}>删除</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
