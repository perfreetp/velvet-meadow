// 均匀网格空间索引:视口裁剪与点拾取共用。
export class GridIndex {
  constructor(parts, worldW, worldH, cell = 100) {
    this.cell = cell;
    this.cols = Math.ceil(worldW / cell);
    this.rows = Math.ceil(worldH / cell);
    this.cells = new Map();
    for (const p of parts) {
      const [x0, y0, x1, y1] = p.bbox;
      const c0 = Math.max(0, Math.floor(x0 / cell));
      const c1 = Math.min(this.cols - 1, Math.floor(x1 / cell));
      const r0 = Math.max(0, Math.floor(y0 / cell));
      const r1 = Math.min(this.rows - 1, Math.floor(y1 / cell));
      for (let r = r0; r <= r1; r++) {
        for (let c = c0; c <= c1; c++) {
          const k = r * this.cols + c;
          let a = this.cells.get(k);
          if (!a) { a = []; this.cells.set(k, a); }
          a.push(p.id);
        }
      }
    }
  }

  queryRect(x0, y0, x1, y1) {
    const out = new Set();
    const c0 = Math.max(0, Math.floor(x0 / this.cell));
    const c1 = Math.min(this.cols - 1, Math.floor(x1 / this.cell));
    const r0 = Math.max(0, Math.floor(y0 / this.cell));
    const r1 = Math.min(this.rows - 1, Math.floor(y1 / this.cell));
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const a = this.cells.get(r * this.cols + c);
        if (a) for (const id of a) out.add(id);
      }
    }
    return out;
  }

  queryPoint(x, y) {
    const c = Math.floor(x / this.cell);
    const r = Math.floor(y / this.cell);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return [];
    return this.cells.get(r * this.cols + c) || [];
  }
}
