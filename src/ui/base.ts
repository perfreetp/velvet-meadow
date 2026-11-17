/** 组件基类：Shadow DOM + 模板 + 简易样式封装 */
export abstract class BaseComponent extends HTMLElement {
  protected shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback(): void {
    this.render();
    this.afterRender();
  }

  protected abstract render(): void;

  protected afterRender(): void {
    // 子类覆盖
  }

  protected $(sel: string): HTMLElement | null {
    return this.shadow.querySelector(sel);
  }

  protected $all(sel: string): HTMLElement[] {
    return [...this.shadow.querySelectorAll(sel)] as HTMLElement[];
  }

  protected rerender(): void {
    this.render();
    this.afterRender();
  }

  protected emitEvent(name: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
  }
}

export const sharedCss = `
:host {
  --bg: #0f172a;
  --panel: #1e293b;
  --panel-2: #273449;
  --border: #334155;
  --text: #e2e8f0;
  --muted: #94a3b8;
  --accent: #38bdf8;
  --accent-2: #818cf8;
  --danger: #ef4444;
  --ok: #22c55e;
  --warn: #f59e0b;
  font-family: "Segoe UI", "Microsoft YaHei", system-ui, sans-serif;
  font-size: 13px;
  color: var(--text);
  box-sizing: border-box;
}
* { box-sizing: border-box; }
button {
  font: inherit;
  color: var(--text);
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: background .15s, border-color .15s;
}
button:hover:not(:disabled) { background: #334155; border-color: var(--accent); }
button:disabled { opacity: .4; cursor: not-allowed; }
button.primary { background: #0369a1; border-color: #0ea5e9; }
button.primary:hover:not(:disabled) { background: #0284c7; }
button.danger { background: #7f1d1d; border-color: #ef4444; }
button.active { background: #075985; border-color: var(--accent); color: #e0f2fe; }
button.icon { padding: 4px 8px; }
input, select, textarea {
  font: inherit;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 8px;
  width: 100%;
}
input[type="range"] { padding: 0; }
input[type="color"] { padding: 2px; height: 32px; }
label { color: var(--muted); display: block; margin-bottom: 4px; font-size: 12px; }
.row { display: flex; gap: 8px; align-items: center; }
.col { display: flex; flex-direction: column; gap: 8px; }
.muted { color: var(--muted); }
.small { font-size: 11px; }
.tag {
  display: inline-block; padding: 1px 7px; border-radius: 10px;
  background: var(--panel-2); border: 1px solid var(--border);
  font-size: 11px; color: var(--muted);
}
.tag.ok { color: #bbf7d0; border-color: #166534; }
.tag.warn { color: #fde68a; border-color: #92400e; }
.tag.err { color: #fecaca; border-color: #991b1b; }
.scroll { overflow: auto; }
.scroll::-webkit-scrollbar { width: 8px; height: 8px; }
.scroll::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
h2, h3, h4 { margin: 0; font-weight: 600; }
.panel-title {
  font-size: 12px; text-transform: uppercase; letter-spacing: .08em;
  color: var(--muted); margin-bottom: 8px;
}
hr { border: none; border-top: 1px solid var(--border); margin: 10px 0; }
.toast-wrap { position: fixed; right: 16px; bottom: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 9999; }
.toast {
  background: var(--panel); border: 1px solid var(--accent);
  border-radius: 8px; padding: 10px 14px; max-width: 340px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
  animation: slide-in .2s ease;
}
.toast.warn { border-color: var(--warn); }
.toast.err { border-color: var(--danger); }
@keyframes slide-in { from { transform: translateX(20px); opacity: 0; } to { transform: none; opacity: 1; } }
table { width: 100%; border-collapse: collapse; font-size: 12px; }
th, td { text-align: left; padding: 7px 8px; border-bottom: 1px solid var(--border); }
th { color: var(--muted); font-weight: 500; position: sticky; top: 0; background: var(--panel); }
.empty { color: var(--muted); text-align: center; padding: 28px 12px; border: 1px dashed var(--border); border-radius: 8px; }
`;

let toastHost: HTMLElement | null = null;

export function toast(message: string, kind: 'info' | 'warn' | 'err' = 'info', duration = 2600): void {
  if (!toastHost) {
    toastHost = document.createElement('div');
    toastHost.className = 'toast-wrap';
    document.body.appendChild(toastHost);
  }
  const el = document.createElement('div');
  el.className = `toast ${kind === 'info' ? '' : kind}`;
  el.textContent = message;
  toastHost.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity .3s';
    setTimeout(() => el.remove(), 320);
  }, duration);
}
