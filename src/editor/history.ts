import type { Doc } from '../geometry/types';

const STORAGE_KEY = 'panel-editor-doc-v1';
const HISTORY_KEY = 'panel-editor-history-v1';
export const HISTORY_LIMIT = 50; // 远超要求的 30 步

export interface PersistedHistory {
  past: Doc[];
  future: Doc[];
}

export function cloneDoc(doc: Doc): Doc {
  return JSON.parse(JSON.stringify(doc)) as Doc;
}

export class History {
  past: Doc[] = [];
  future: Doc[] = [];
  private listeners = new Set<() => void>();

  /** 执行一次变更前调用:压入当前快照 */
  push(current: Doc): void {
    this.past.push(cloneDoc(current));
    if (this.past.length > HISTORY_LIMIT) this.past.shift();
    this.future = [];
    this.persist(current);
    this.emit();
  }

  undo(current: Doc): Doc {
    const prev = this.past.pop();
    if (!prev) return current;
    this.future.unshift(cloneDoc(current));
    this.persist(prev);
    this.emit();
    return prev;
  }

  redo(current: Doc): Doc {
    const next = this.future.shift();
    if (!next) return current;
    this.past.push(cloneDoc(current));
    this.persist(next);
    this.emit();
    return next;
  }

  get canUndo(): boolean { return this.past.length > 0; }
  get canRedo(): boolean { return this.future.length > 0; }
  get depth(): number { return this.past.length; }

  /** 刷新页面后恢复:返回 [文档, 历史] */
  static restore(): [Doc | null, PersistedHistory] {
    if (typeof localStorage === 'undefined') return [null, { past: [], future: [] }];
    try {
      const rawDoc = localStorage.getItem(STORAGE_KEY);
      const rawHist = localStorage.getItem(HISTORY_KEY);
      const doc = rawDoc ? (JSON.parse(rawDoc) as Doc) : null;
      const hist: PersistedHistory = rawHist
        ? JSON.parse(rawHist)
        : { past: [], future: [] };
      return [doc, hist];
    } catch {
      return [null, { past: [], future: [] }];
    }
  }

  hydrate(h: PersistedHistory): void {
    this.past = h.past ?? [];
    this.future = h.future ?? [];
    this.emit();
  }

  reset(current: Doc): void {
    this.past = [];
    this.future = [];
    this.persist(current);
    this.emit();
  }

  /** 立即把当前文档写入持久化(不入历史栈),用于拖拽/绘制结束后保存中间态 */
  save(current: Doc): void {
    this.persist(current);
  }

  private persist(current: Doc): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      const h: PersistedHistory = { past: this.past, future: this.future };
      localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
    } catch {
      // 存储满或被禁用时静默降级,内存历史仍可用
    }
  }

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit(): void { this.listeners.forEach(fn => fn()); }
}
