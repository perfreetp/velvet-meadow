// 全局轻提示
import { GvsElement } from './GvsElement';
import { bus, EVT } from './bus';

interface ToastItem {
  id: number;
  type: 'ok' | 'warn' | 'info';
  text: string;
}

export class ToastHost extends GvsElement {
  private items: ToastItem[] = [];
  private seq = 0;

  protected styles(): string {
    return `
      :host { position: fixed; right: 18px; bottom: 18px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; }
      .toast {
        padding: 9px 14px; border-radius: 8px; color: #fff; font-size: 13px;
        box-shadow: 0 6px 18px rgba(15,23,42,.25); animation: in .2s ease; max-width: 380px;
      }
      .ok { background: #059669; }
      .warn { background: #d97706; }
      .info { background: #334155; }
      @keyframes in { from { transform: translateY(8px); opacity: 0; } to { transform: none; opacity: 1; } }
    `;
  }

  protected template(): Node[] {
    return [this.h('div', { class: 'host' })];
  }

  protected afterRender(): void {
    bus.on(EVT.TOAST, (p: { type: ToastItem['type']; text: string }) => {
      const id = ++this.seq;
      this.items.push({ id, type: p.type ?? 'info', text: p.text });
      this.draw();
      setTimeout(() => {
        this.items = this.items.filter((t) => t.id !== id);
        this.draw();
      }, 3600);
    });
  }

  private draw(): void {
    const host = this.root.querySelector('.host') as HTMLElement;
    host.replaceChildren(...this.items.map((t) => this.h('div', { class: `toast ${t.type}` }, t.text)));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'toast-host': ToastHost;
  }
}
