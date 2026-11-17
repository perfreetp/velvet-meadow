import { useStore, type Tool } from '../store';

const TOOLS: { id: Tool; label: string; icon: string; hint: string }[] = [
  { id: 'select', label: '选择', icon: '➤', hint: 'V' },
  { id: 'water', label: '水面', icon: '≈', hint: '多边形' },
  { id: 'wall', label: '驳岸', icon: '▤', hint: '折线' },
  { id: 'bridgeOpening', label: '桥洞', icon: '▭', hint: '多边形' },
  { id: 'pier', label: '桥墩', icon: '■', hint: '多边形' },
  { id: 'dock', label: '码头', icon: '▱', hint: '多边形' },
  { id: 'route', label: '航线', icon: '⤳', hint: '折线' },
  { id: 'comment', label: '批注', icon: '✎', hint: '打点' },
];

export default function Toolbar() {
  const tool = useStore((s) => s.tool);
  const setTool = useStore((s) => s.setTool);
  const finishDrawing = useStore((s) => s.finishDrawing);
  const cancelDrawing = useStore((s) => s.cancelDrawing);
  const drawing = useStore((s) => s.drawing);

  return (
    <div className="toolbar">
      {TOOLS.map((t) => (
        <button
          key={t.id}
          className={`tool-btn ${tool === t.id ? 'active' : ''}`}
          title={`${t.label}（${t.hint}）`}
          onClick={() => setTool(t.id)}
        >
          <span className="tool-icon">{t.icon}</span>
          <span className="tool-label">{t.label}</span>
        </button>
      ))}
      {drawing.length > 0 && tool !== 'select' && (
        <div className="draw-actions">
          <button className="mini-btn primary" onClick={finishDrawing}>
            完成绘制（{drawing.length} 点）
          </button>
          <button className="mini-btn" onClick={cancelDrawing}>
            取消
          </button>
        </div>
      )}
      {tool !== 'select' && drawing.length === 0 && (
        <div className="draw-tip">
          在画布上单击逐点绘制，折线至少 2 点，多边形至少 3 点
        </div>
      )}
    </div>
  );
}
