// Web Worker：接收场景参数，调用 computeLighting，回传可转移的 TypedArray
import { computeLighting } from '../engine/lighting.js';

self.onmessage = (e) => {
  const { jobId, input } = e.data;
  try {
    const result = computeLighting(input);
    self.postMessage(
      {
        jobId,
        ok: true,
        result: {
          cols: result.cols,
          rows: result.rows,
          cell: result.cell,
          bounds: result.bounds,
          maxLux: result.maxLux,
          sun: result.sun,
          darkZones: result.darkZones,
          lux: result.lux.buffer,
          sunLux: result.sunLux.buffer,
          artificialLux: result.artificialLux.buffer,
          display: result.display.buffer,
          heat: result.heat.buffer,
          darkMask: result.darkMask.buffer,
          buildingMask: result.buildingMask.buffer,
        },
      },
      [result.lux.buffer, result.sunLux.buffer, result.artificialLux.buffer,
       result.display.buffer, result.heat.buffer, result.darkMask.buffer,
       result.buildingMask.buffer]
    );
  } catch (err) {
    self.postMessage({ jobId, ok: false, error: String(err && err.message || err) });
  }
};
