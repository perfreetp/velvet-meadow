// 主线程侧 Worker 客户端：串行排队 + 可取消过期任务，避免滑块拖动时堆积计算
export class LightingClient {
  constructor() {
    this.worker = new Worker(new URL('./lighting.worker.js', import.meta.url), { type: 'module' });
    this.seq = 0;
    this.pending = new Map();
    this.worker.onmessage = (e) => {
      const { jobId, ok, result, error } = e.data;
      const job = this.pending.get(jobId);
      if (!job) return;
      this.pending.delete(jobId);
      if (!ok) { job.reject(new Error(error)); return; }
      const restored = {
        ...result,
        lux: new Float32Array(result.lux),
        sunLux: new Float32Array(result.sunLux),
        artificialLux: new Float32Array(result.artificialLux),
        display: new Uint8ClampedArray(result.display),
        heat: new Float32Array(result.heat),
        darkMask: new Uint8Array(result.darkMask),
        buildingMask: new Uint8Array(result.buildingMask),
      };
      job.resolve(restored);
    };
    this.worker.onerror = (e) => {
      for (const { reject } of this.pending.values()) reject(new Error(e.message));
      this.pending.clear();
    };
  }

  // Solid store 是 Proxy，无法被结构化克隆，发送前用 JSON 往返脱壳为纯对象
  compute(input) {
    const jobId = ++this.seq;
    const plain = JSON.parse(JSON.stringify(input));
    return new Promise((resolve, reject) => {
      this.pending.set(jobId, { resolve, reject });
      this.worker.postMessage({ jobId, input: plain });
    });
  }

  dispose() {
    this.worker.terminate();
    this.pending.clear();
  }
}
