// 三维 Worker 的 Promise 化客户端
let worker = null;
let seq = 0;
const pending = new Map();
const listeners = new Set();

function ensureWorker() {
  if (worker) return worker;
  worker = new Worker(new URL('../../workers/view3d.worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = (ev) => {
    const msg = ev.data;
    // 带 reqId 的是请求应答：resolve 对应 Promise，不再广播给全局监听器
    if (msg.reqId && pending.has(msg.reqId)) {
      pending.get(msg.reqId).resolve(msg);
      pending.delete(msg.reqId);
      return;
    }
    for (const fn of listeners) fn(msg);
  };
  worker.onerror = (ev) => {
    for (const [, p] of pending) p.reject(new Error(ev.message));
    pending.clear();
  };
  return worker;
}

function send(type, payload = {}, transfer = []) {
  const w = ensureWorker();
  const reqId = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(reqId, { resolve, reject });
    w.postMessage({ type, reqId, ...payload }, transfer);
  });
}

export const worker3d = {
  onEvent(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  init(canvas, w, h) {
    const off = canvas.transferControlToOffscreen();
    return send('init', { canvas: off, w, h }, [off]);
  },
  resize(w, h) { return send('resize', { w, h }); },
  camera(camera) { ensureWorker().postMessage({ type: 'camera', camera }); },
  wire(on) { ensureWorker().postMessage({ type: 'wire', on }); },
  field(rle, dims, angleThresholdDeg, refit = false) {
    return send('field', { rle, dims, angleThresholdDeg, refit });
  },
  dead(on, mask = null) {
    return on ? send('dead', { on, mask }) : send('dead', { on });
  },
  diff(on, rleA = null, rleB = null) {
    if (!on) return send('diff', { on });
    return send('diff', { on, rleA, rleB });
  },
  exportOBJ(meta) { return send('export', { meta }); },
  getCamera() { return send('getCamera', {}); },
  refit() { return send('refit', {}); },
  render() { ensureWorker().postMessage({ type: 'render' }); }
};
