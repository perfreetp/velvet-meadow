// 编辑历史：RLE 快照栈，撤销/重做，容量上限 50
import { encodeRLE, decodeRLE } from './core.js';

const CAP = 50;

export class History {
  constructor(field) {
    this.nx = field.nx; this.ny = field.ny; this.nz = field.nz;
    this.stack = [{ snap: encodeRLE(field), label: '初始毛坯' }];
    this.pointer = 0;
  }

  /** 提交一次编辑后的现场 */
  commit(field, label) {
    this.stack = this.stack.slice(0, this.pointer + 1);
    this.stack.push({ snap: encodeRLE(field), label });
    if (this.stack.length > CAP) this.stack.shift();
    this.pointer = this.stack.length - 1;
  }

  canUndo() { return this.pointer > 0; }
  canRedo() { return this.pointer < this.stack.length - 1; }

  undo(field) {
    if (!this.canUndo()) return null;
    this.pointer--;
    return this._restore(field);
  }

  redo(field) {
    if (!this.canRedo()) return null;
    this.pointer++;
    return this._restore(field);
  }

  _restore(field) {
    const entry = this.stack[this.pointer];
    const restored = decodeRLE(entry.snap, this.nx, this.ny, this.nz);
    field.data.set(restored.data);
    return entry.label;
  }

  labels() {
    return this.stack.map((e, i) => ({ index: i, label: e.label, current: i === this.pointer }));
  }
}
