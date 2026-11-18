/** Web Component 基类：Shadow DOM + 共享深色主题样式片段 */
const SHARED_CSS = `
:host {
  display: block;
  color: var(--fg);
  font-family: var(--font);
  font-size: 12px;
}
* { box-sizing: border-box; }
button {
  background: var(--bg-panel-2);
  color: var(--fg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
  font-size: 12px;
}
button:hover { border-color: var(--accent); color: var(--accent); }
button.primary { background: #0e3a52; border-color: var(--accent); color: #e0f2fe; }
button.primary:hover { background: #125070; }
button.danger:hover { border-color: var(--danger); color: var(--danger); }
button:disabled { opacity: .4; cursor: not-allowed; }
button.active { background: #0e3a52; border-color: var(--accent); color: var(--accent); }
input, select {
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--fg);
  padding: 5px 8px;
  font-size: 12px;
  outline: none;
  width: 100%;
}
input:focus, select:focus { border-color: var(--accent); }
label { color: var(--fg-dim); display: block; margin-bottom: 3px; font-size: 11px; }
.field { margin-bottom: 9px; }
.row { display: flex; gap: 8px; align-items: center; }
h3 { margin: 0 0 10px; font-size: 13px; color: var(--accent); }
.small { font-size: 11px; color: var(--fg-dim); }
table { width: 100%; border-collapse: collapse; font-size: 11px; }
th, td { border-bottom: 1px solid var(--border); padding: 5px 6px; text-align: left; }
th { color: var(--fg-dim); font-weight: normal; }
.scroll { overflow: auto; }
.tag { display:inline-block; padding:1px 7px; border-radius: 10px; font-size:10px;
  background: var(--bg-panel-2); border:1px solid var(--border); color: var(--fg-dim); }
.tag.warn { color: var(--warn); border-color: var(--warn); }
.tag.ok { color: var(--ok); border-color: var(--ok); }
`;

export abstract class BaseComponent extends HTMLElement {
  protected root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  protected render(html: string, css = ''): void {
    this.root.innerHTML = `<style>${SHARED_CSS}${css}</style>${html}`;
  }

  $(sel: string): HTMLElement {
    const el = this.root.querySelector(sel);
    if (!el) throw new Error(`元素未找到: ${sel}`);
    return el as HTMLElement;
  }

  $all(sel: string): HTMLElement[] {
    return [...this.root.querySelectorAll(sel)] as HTMLElement[];
  }

  connectedCallback(): void {
    this.mount();
  }

  abstract mount(): void;
}

/** 简易模态框基类 */
export abstract class ModalComponent extends BaseComponent {
  protected backdrop: HTMLDivElement | null = null;

  protected renderModal(title: string, bodyHtml: string, css = ''): void {
    this.render(
      `<div class="backdrop">
        <div class="dialog" role="dialog" aria-modal="true">
          <div class="dlg-head"><span>${title}</span><button class="close" title="关闭">✕</button></div>
          <div class="dlg-body">${bodyHtml}</div>
        </div>
      </div>`,
      `${css}
      :host { position: fixed; inset: 0; z-index: 1000; }
      .backdrop { position: fixed; inset:0; background: rgba(5,10,18,.65);
        display:flex; align-items:center; justify-content:center; }
      .dialog { background: var(--bg-panel); border:1px solid var(--border); border-radius:10px;
        width: min(720px, 92vw); max-height: 86vh; display:flex; flex-direction:column;
        box-shadow: 0 18px 60px rgba(0,0,0,.55); }
      .dlg-head { display:flex; justify-content:space-between; align-items:center;
        padding: 12px 16px; border-bottom:1px solid var(--border); font-weight:600; color:var(--accent); }
      .dlg-body { padding: 16px; overflow:auto; }
      .close { padding: 2px 8px; }`
    );
    this.backdrop = this.$('.backdrop') as HTMLDivElement;
    this.$('.close').addEventListener('click', () => this.remove());
    this.backdrop.addEventListener('pointerdown', (e) => {
      if (e.target === this.backdrop) this.remove();
    });
  }
}

export function fmtNum(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '∞';
  return n.toLocaleString('zh-CN', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtDate(ts: number): string {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
