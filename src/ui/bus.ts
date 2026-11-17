// 轻量跨组件事件总线（视图间联动、全局命令）
type Handler = (payload?: any) => void;

class EventBus {
  private map = new Map<string, Set<Handler>>();

  on(event: string, fn: Handler): () => void {
    if (!this.map.has(event)) this.map.set(event, new Set());
    this.map.get(event)!.add(fn);
    return () => this.map.get(event)?.delete(fn);
  }

  emit(event: string, payload?: any): void {
    for (const fn of this.map.get(event) ?? []) fn(payload);
  }
}

export const bus = new EventBus();

/** 全局事件名 */
export const EVT = {
  SELECTION_BOX: 'selection-box',       // 俯视图完成框选 {box}
  SECTION_DRAWN: 'section-drawn',       // 剖面线完成 {line}
  OPEN_SECTION: 'open-section',         // 打开剖面分析 {id}
  REQUEST_SAVE: 'request-save',
  REQUEST_UNDO: 'request-undo',
  REQUEST_REDO: 'request-redo',
  STATS_UPDATE: 'stats-update',         // {voxels, triangles}
  TOAST: 'toast'                        // {type, text}
} as const;
