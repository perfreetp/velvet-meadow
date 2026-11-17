import { useState } from 'react';
import { useStore } from '../store';

interface Props {
  onLocate: (x: number, y: number) => void;
}

export default function CommentsPanel({ onLocate }: Props) {
  const comments = useStore((s) => s.data.comments);
  const replyComment = useStore((s) => s.replyComment);
  const resolveComment = useStore((s) => s.resolveComment);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const open = comments.filter((c) => !c.resolved);
  const done = comments.filter((c) => c.resolved);

  return (
    <div className="panel">
      <h3>
        审核批注
        <span className={`badge ${open.length ? 'badge-red' : 'badge-green'}`}>
          待处理 {open.length}
        </span>
      </h3>
      <p className="panel-hint">
        选择左侧「批注」工具后在画布打点，审核人提出问题，制作方逐条回复，解决后归档。
      </p>
      {comments.length === 0 && <p className="panel-hint">暂无批注。</p>}
      <div className="cmt-list">
        {[...open, ...done].map((c) => (
          <div key={c.id} className={`cmt-item ${c.resolved ? 'resolved' : ''}`}>
            <div className="cmt-head">
              <span className="cmt-author">{c.author}</span>
              <span className="cmt-time">{new Date(c.createdAt).toLocaleString('zh-CN', { hour12: false })}</span>
              <button className="link-btn" onClick={() => onLocate(c.pos.x, c.pos.y)}>定位</button>
            </div>
            <div className="cmt-text">{c.text}</div>
            <div className="cmt-replies">
              {c.replies.map((r) => (
                <div key={r.id} className="cmt-reply">
                  <b>{r.author}：</b>
                  {r.text}
                </div>
              ))}
            </div>
            {!c.resolved && (
              <div className="cmt-input-row">
                <input
                  className="text-input"
                  placeholder="制作方回复…"
                  value={drafts[c.id] ?? ''}
                  onChange={(e) => setDrafts({ ...drafts, [c.id]: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && drafts[c.id]?.trim()) {
                      replyComment(c.id, '制作方', drafts[c.id].trim());
                      setDrafts({ ...drafts, [c.id]: '' });
                    }
                  }}
                />
                <button
                  className="mini-btn primary"
                  onClick={() => {
                    const t = drafts[c.id]?.trim();
                    if (!t) return;
                    replyComment(c.id, '制作方', t);
                    setDrafts({ ...drafts, [c.id]: '' });
                  }}
                >
                  回复
                </button>
                <button className="mini-btn" onClick={() => resolveComment(c.id)}>
                  解决
                </button>
              </div>
            )}
            {c.resolved && <div className="resolved-tag">已解决 · 点击可重新打开</div>}
            {c.resolved && (
              <button className="link-btn" onClick={() => resolveComment(c.id)}>重新打开</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
