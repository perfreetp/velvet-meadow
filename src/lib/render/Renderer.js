// WebGPU 线段渲染器。
// 每帧由 CPU 做视口裁剪 + LOD 过滤,只把可见图元的顶点区间作为 draw 调用提交;
// 悬停高亮 / 淡出 / 选中着色通过 uniform + 每零件标志位 storage buffer 在着色器内完成。

const WGSL = /* wgsl */ `
struct U {
  res: vec2f,
  scale: f32,
  cam: vec2f,
  hoverId: f32,
  fade: f32,
  la: array<vec4f, 2>,
};
@group(0) @binding(0) var<uniform> u : U;
@group(0) @binding(1) var<storage, read> flags : array<f32>;

struct VIn {
  @location(0) pos: vec2f,
  @location(1) info: vec2f,
};
struct VOut {
  @builtin(position) pos: vec4f,
  @location(0) color: vec4f,
};

@vertex
fn vs(inp: VIn) -> VOut {
  let partId = u32(inp.info.x);
  let kind = u32(inp.info.y) & 3u;
  let layer = (u32(inp.info.y) >> 2u) & 7u;

  var base = vec3f(0.92, 0.94, 0.97);          // 轮廓
  var a = 1.0;
  if (layer < 4u) { a = u.la[0][layer]; } else { a = u.la[1][0]; }
  if (kind == 1u) { base = vec3f(0.55, 0.63, 0.72); a *= 0.8; }        // 细线
  else if (kind == 2u) { base = vec3f(0.38, 0.50, 0.66); a *= 0.75; }  // 剖面线
  else if (kind == 3u) { base = vec3f(0.95, 0.72, 0.20); a *= 0.95; }  // 尺寸标注

  let f = flags[partId];
  let isHover = u.hoverId >= 0.0 && f32(partId) == u.hoverId;
  if (u.hoverId >= 0.0 && !isHover && f < 1.5) { a *= u.fade; }        // 悬停时淡出其余
  if (f > 2.5) { base = vec3f(0.35, 0.85, 0.92); a = max(a, 0.95); }   // 单选
  else if (f > 1.5) { base = vec3f(0.30, 0.88, 0.55); a = max(a, 0.95); } // 框选
  if (isHover) { base = vec3f(1.0, 0.45, 0.28); a = 1.0; }             // 悬停高亮

  let s = (inp.pos - u.cam) * u.scale;
  var o: VOut;
  o.pos = vec4f(s.x * 2.0 / u.res.x, -s.y * 2.0 / u.res.y, 0.0, 1.0);
  o.color = vec4f(base, a);
  return o;
}

@fragment
fn fs(inp: VOut) -> @location(0) vec4f {
  return inp.color;
}
`;

export class GpuRenderer {
  constructor() {
    this.ok = false;
    this.error = '';
  }

  async init(canvas, vertexData, partCount) {
    if (!navigator.gpu) {
      this.error = '当前浏览器不支持 WebGPU,请使用 Chrome / Edge 113+ 并开启硬件加速。';
      return false;
    }
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) throw new Error('no adapter');
      this.device = await adapter.requestDevice();
    } catch (e) {
      this.error = 'WebGPU 设备初始化失败:' + (e && e.message ? e.message : e);
      return false;
    }
    this.device.lost.then((info) => {
      console.error('WebGPU device lost:', info.message);
      this.ok = false;
    });
    this.device.addEventListener('uncapturederror', (e) => {
      console.error('WebGPU error:', e.error.message);
    });

    this.canvas = canvas;
    this.ctx = canvas.getContext('webgpu');
    this.format = navigator.gpu.getPreferredCanvasFormat();
    this.ctx.configure({ device: this.device, format: this.format, alphaMode: 'opaque' });

    const d = this.device;
    this.vbuf = d.createBuffer({
      size: vertexData.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    d.queue.writeBuffer(this.vbuf, 0, vertexData);

    this.ubuf = d.createBuffer({ size: 64, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    this.flagsBuf = d.createBuffer({
      size: Math.max(4, partCount * 4),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.uData = new Float32Array(16);

    const module = d.createShaderModule({ code: WGSL });
    this.pipe = d.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module,
        entryPoint: 'vs',
        buffers: [{
          arrayStride: 16,
          attributes: [
            { shaderLocation: 0, offset: 0, format: 'float32x2' },
            { shaderLocation: 1, offset: 8, format: 'float32x2' },
          ],
        }],
      },
      fragment: {
        module,
        entryPoint: 'fs',
        targets: [{
          format: this.format,
          blend: {
            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
          },
        }],
      },
      primitive: { topology: 'line-list' },
    });

    this.bindGroup = d.createBindGroup({
      layout: this.pipe.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.ubuf } },
        { binding: 1, resource: { buffer: this.flagsBuf } },
      ],
    });

    this.ok = true;
    return true;
  }

  // 图层归属被后台改动后,就地重写该零件顶点区间
  writePartRange(vertexData, part) {
    if (!this.ok) return;
    this.device.queue.writeBuffer(
      this.vbuf,
      part.vStart * 16,
      vertexData.subarray(part.vStart * 4, (part.vStart + part.vCount) * 4)
    );
  }

  setFlags(flagArray) {
    if (!this.ok) return;
    this.device.queue.writeBuffer(this.flagsBuf, 0, flagArray);
  }

  // draws: [[firstVertex, vertexCount], ...] —— 已按图层顺序排好的可见图元区间
  frame(cam, resW, resH, layerAlpha, hoverId, draws) {
    if (!this.ok) return;
    const u = this.uData;
    u[0] = resW; u[1] = resH; u[2] = cam.scale; u[3] = 0;
    u[4] = cam.x; u[5] = cam.y; u[6] = hoverId; u[7] = 0.12;
    u[8] = layerAlpha[0]; u[9] = layerAlpha[1]; u[10] = layerAlpha[2]; u[11] = layerAlpha[3];
    u[12] = layerAlpha[4]; u[13] = 0; u[14] = 0; u[15] = 0;
    this.device.queue.writeBuffer(this.ubuf, 0, u);

    const enc = this.device.createCommandEncoder();
    const pass = enc.beginRenderPass({
      colorAttachments: [{
        view: this.ctx.getCurrentTexture().createView(),
        clearValue: { r: 0.043, g: 0.059, b: 0.094, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
    });
    pass.setPipeline(this.pipe);
    pass.setBindGroup(0, this.bindGroup);
    pass.setVertexBuffer(0, this.vbuf);
    for (let i = 0; i < draws.length; i++) {
      const d = draws[i];
      pass.draw(d[1], 1, d[0], 0);
    }
    pass.end();
    this.device.queue.submit([enc.finish()]);
  }
}
