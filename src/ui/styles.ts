/* 全局设计令牌与共享样式（Shadow DOM 内通过 <style> 引用） */
export const CSS_TOKENS = `
:host {
  --bg: #f4f6f9;
  --panel: #ffffff;
  --panel-2: #eef1f5;
  --border: #d4dae2;
  --text: #1f2937;
  --text-2: #5b6675;
  --primary: #2563eb;
  --primary-d: #1d4ed8;
  --danger: #dc2626;
  --warn: #d97706;
  --ok: #059669;
  --accent: #0891b2;
  --shadow: 0 1px 3px rgba(15, 23, 42, .12), 0 4px 14px rgba(15, 23, 42, .08);
  --radius: 8px;
  font-family: "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
  color: var(--text);
  font-size: 13px;
}
* { box-sizing: border-box; }
button {
  font: inherit;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--text);
  border-radius: 6px;
  padding: 5px 12px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
button:hover { background: var(--panel-2); border-color: #b6bfcc; }
button.primary { background: var(--primary); border-color: var(--primary); color: #fff; }
button.primary:hover { background: var(--primary-d); }
button.danger { color: var(--danger); border-color: #f0b4b4; }
button.warn { color: var(--warn); border-color: #ecc98f; }
button[disabled] { opacity: .45; cursor: not-allowed; }
button.active { background: var(--primary); border-color: var(--primary); color: #fff; }
input, select, textarea {
  font: inherit;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 8px;
  background: #fff;
  color: var(--text);
  width: 100%;
}
input[type="range"] { padding: 0; }
input[type="checkbox"] { width: auto; }
label { color: var(--text-2); display: block; margin-bottom: 3px; font-size: 12px; }
.field { margin-bottom: 10px; }
.row { display: flex; gap: 8px; align-items: center; }
.row > * { flex: 1; }
.tag {
  display: inline-block; padding: 2px 8px; border-radius: 999px;
  font-size: 12px; background: var(--panel-2); border: 1px solid var(--border);
}
.tag.ordered { background: #e0e7ff; color: #3730a3; border-color: #c3cdf5; }
.tag.in_progress { background: #fef3c7; color: #92400e; border-color: #f5dd9a; }
.tag.submitted { background: #cffafe; color: #155e75; border-color: #9ee3ef; }
.tag.rework { background: #fee2e2; color: #991b1b; border-color: #f3b4b4; }
.tag.delivered { background: #d1fae5; color: #065f46; border-color: #9ee8cf; }
.panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.panel-h {
  font-weight: 600;
  padding: 9px 12px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(#fbfcfe, #f3f5f8);
  border-radius: var(--radius) var(--radius) 0 0;
}
.panel-b { padding: 12px; }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { border: 1px solid var(--border); padding: 4px 7px; text-align: left; }
th { background: var(--panel-2); font-weight: 600; }
.scroll { overflow: auto; }
.muted { color: var(--text-2); }
.mono { font-family: Consolas, "Courier New", monospace; }
hr { border: none; border-top: 1px solid var(--border); margin: 10px 0; }
.swatch { width: 14px; height: 14px; border-radius: 3px; border: 1px solid rgba(0,0,0,.25); display: inline-block; vertical-align: middle; }
`;
