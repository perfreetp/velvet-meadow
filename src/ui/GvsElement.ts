// Web Component 基类：Shadow DOM + 样式注入 + 重绘调度
import { CSS_TOKENS } from './styles';

export abstract class GvsElement extends HTMLElement {
  protected root: ShadowRoot;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  protected render(): void {
    const style = document.createElement('style');
    style.textContent = CSS_TOKENS + this.styles();
    this.root.replaceChildren(style, ...this.template());
    this.afterRender();
  }

  protected styles(): string {
    return '';
  }

  protected abstract template(): Node[];

  protected afterRender(): void {
    // 子类按需实现
  }

  connectedCallback(): void {
    this.render();
  }

  protected $(sel: string): HTMLElement | null {
    return this.root.querySelector(sel);
  }

  protected $all(sel: string): HTMLElement[] {
    return Array.from(this.root.querySelectorAll(sel));
  }

  protected h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: Record<string, string | number | boolean | EventListener | null | undefined> = {},
    ...children: (Node | string | Array<Node | string>)[]
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      } else {
        el.setAttribute(k, String(v));
      }
    }
    for (const c of children.flat()) el.append(typeof c === 'string' ? document.createTextNode(c) : c);
    return el;
  }
}
