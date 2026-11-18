// WebGPU 渲染器:单次 draw 绘制全部河道三角网格,
// uniform 携带视图变换与三级透明度,底图走独立纹理管线。
import { FLOATS_PER_VERTEX } from './geometry.js';
const MESH_SHADER = /* wgsl */ `
struct Uniforms {
  transform : vec4f, // sx, sy, tx, ty : clip = world * s + t
  opacity   : vec4f, // 三级透明度 + 保留
};
@group(0) @binding(0) var<uniform> u : Uniforms;

struct VIn {
  @location(0) pos   : vec2f,
  @location(1) color : vec3f,
  @location(2) level : f32,
};
struct VOut {
  @builtin(position) pos : vec4f,
  @location(0) color : vec4f,
};
@vertex fn vs(inp : VIn) -> VOut {
  var o : VOut;
  o.pos = vec4f(
    inp.pos.x * u.transform.x + u.transform.z,
    inp.pos.y * u.transform.y + u.transform.w, 0.0, 1.0);
  let lv = i32(inp.level + 0.5);
  o.color = vec4f(inp.color, u.opacity[lv]);
  return o;
}
@fragment fn fs(inp : VOut) -> @location(0) vec4f {
  return inp.color;
}
`;
const QUAD_SHADER = /* wgsl */ `
struct Uniforms {
  transform : vec4f,
  opacity   : vec4f,
};
@group(0) @binding(0) var<uniform> u : Uniforms;
@group(0) @binding(1) var texSampler : sampler;
@group(0) @binding(2) var tex : texture_2d<f32>;

struct VOut {
  @builtin(position) pos : vec4f,
  @location(0) uv : vec2f,
};
@vertex fn vs(@builtin(vertex_index) vi : u32) -> VOut {
  // 世界坐标下的单位矩形(覆盖底图范围),由 u.opacity.w 暂存不用
  var pos = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0),
    vec2f(0.0, 0.0), vec2f(1.0, 1.0), vec2f(0.0, 1.0));
  var uv = pos[vi];
  var o : VOut;
  // u.transform 为世界->裁剪;底图世界矩形经 u.opacity 不便传,改用第二组常量:
  o.pos = vec4f(
    (u.transform.z + uv.x * u.opacity.z) * u.transform.x,
    (u.transform.w + uv.y * u.opacity.w) * u.transform.y, 0.0, 1.0);
  o.uv = uv;
  return o;
}
@fragment fn fs(inp : VOut) -> @location(0) vec4f {
  let c = textureSample(tex, texSampler, inp.uv);
  return vec4f(c.rgb, c.a * 0.85);
}
`;
// 底图管线单独用一份 uniform:transform = (sx, sy, 世界原点x映射, 世界原点y映射),
// opacity.z/w = 底图世界宽高。clip = (world0 + uv*size) * s,其中 world0*s 已含平移。
export class WebGpuRenderer {
    kind = 'webgpu';
    device;
    context;
    format;
    meshPipeline;
    quadPipeline;
    uniformBuf;
    quadUniformBuf;
    meshBindGroup;
    quadBindGroup = null;
    vertexBuf = null;
    vertexCount = 0;
    canvas;
    cam = { cx: 2000, cy: 1500, scale: 0.25 };
    opacities = [1, 1, 1];
    basemapSize = { w: 4000, h: 3000 };
    hasBasemap = false;
    constructor(canvas, device, context, format) {
        this.canvas = canvas;
        this.device = device;
        this.context = context;
        this.format = format;
        const meshMod = device.createShaderModule({ code: MESH_SHADER });
        this.meshPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: meshMod,
                entryPoint: 'vs',
                buffers: [
                    {
                        arrayStride: FLOATS_PER_VERTEX * 4,
                        attributes: [
                            { shaderLocation: 0, offset: 0, format: 'float32x2' },
                            { shaderLocation: 1, offset: 8, format: 'float32x3' },
                            { shaderLocation: 2, offset: 20, format: 'float32' },
                        ],
                    },
                ],
            },
            fragment: {
                module: meshMod,
                entryPoint: 'fs',
                targets: [
                    {
                        format,
                        blend: {
                            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                        },
                    },
                ],
            },
            primitive: { topology: 'triangle-list' },
        });
        const quadMod = device.createShaderModule({ code: QUAD_SHADER });
        this.quadPipeline = device.createRenderPipeline({
            layout: 'auto',
            vertex: { module: quadMod, entryPoint: 'vs' },
            fragment: {
                module: quadMod,
                entryPoint: 'fs',
                targets: [
                    {
                        format,
                        blend: {
                            color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha' },
                            alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha' },
                        },
                    },
                ],
            },
            primitive: { topology: 'triangle-list' },
        });
        this.uniformBuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        this.quadUniformBuf = device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
        this.meshBindGroup = device.createBindGroup({
            layout: this.meshPipeline.getBindGroupLayout(0),
            entries: [{ binding: 0, resource: { buffer: this.uniformBuf } }],
        });
    }
    static async create(canvas) {
        if (!navigator.gpu)
            return null;
        try {
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter)
                return null;
            const device = await adapter.requestDevice();
            const context = canvas.getContext('webgpu');
            if (!context)
                return null;
            const format = navigator.gpu.getPreferredCanvasFormat();
            context.configure({ device, format, alphaMode: 'premultiplied' });
            return new WebGpuRenderer(canvas, device, context, format);
        }
        catch {
            return null;
        }
    }
    setScene(scene) {
        const mesh = scene.mesh;
        this.vertexCount = mesh.vertexCount;
        const bytes = mesh.data.byteLength;
        if (!this.vertexBuf || this.vertexBuf.size < bytes) {
            this.vertexBuf?.destroy();
            this.vertexBuf = this.device.createBuffer({
                size: Math.max(bytes, 256),
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
        }
        this.device.queue.writeBuffer(this.vertexBuf, 0, mesh.data);
    }
    setBasemap(bmp, worldW, worldH) {
        this.hasBasemap = !!bmp;
        this.basemapSize = { w: worldW, h: worldH };
        if (!bmp) {
            this.quadBindGroup = null;
            return;
        }
        const tex = this.device.createTexture({
            size: [bmp.width, bmp.height],
            format: 'rgba8unorm',
            usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT,
        });
        this.device.queue.copyExternalImageToTexture({ source: bmp }, { texture: tex }, [bmp.width, bmp.height]);
        const sampler = this.device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
        this.quadBindGroup = this.device.createBindGroup({
            layout: this.quadPipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: this.quadUniformBuf } },
                { binding: 1, resource: sampler },
                { binding: 2, resource: tex.createView() },
            ],
        });
    }
    setCamera(cx, cy, scale) {
        this.cam = { cx, cy, scale };
    }
    setOpacities(o) {
        this.opacities = [...o];
    }
    resize(cssW, cssH, dpr) {
        const w = Math.max(1, Math.floor(cssW * dpr));
        const h = Math.max(1, Math.floor(cssH * dpr));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }
    transform() {
        const w = this.canvas.width || 1;
        const h = this.canvas.height || 1;
        const sx = this.cam.scale / (w / 2);
        const sy = -this.cam.scale / (h / 2);
        return [sx, sy, -this.cam.cx * sx, -this.cam.cy * sy];
    }
    render() {
        const [sx, sy, tx, ty] = this.transform();
        // opacity 第 4 分量固定为海面透明度
        this.device.queue.writeBuffer(this.uniformBuf, 0, new Float32Array([sx, sy, tx, ty, this.opacities[0], this.opacities[1], this.opacities[2], 0.5]));
        if (this.quadBindGroup) {
            // 底图:世界矩形 [0,0]-[w,h] 映射
            this.device.queue.writeBuffer(this.quadUniformBuf, 0, new Float32Array([sx, sy, tx / sx, ty / sy, this.basemapSize.w, this.basemapSize.h, 0, 0]));
        }
        const encoder = this.device.createCommandEncoder();
        const view = this.context.getCurrentTexture().createView();
        const pass = encoder.beginRenderPass({
            colorAttachments: [
                {
                    view,
                    clearValue: { r: 0.93, g: 0.92, b: 0.88, a: 1 },
                    loadOp: 'clear',
                    storeOp: 'store',
                },
            ],
        });
        if (this.quadBindGroup && this.hasBasemap) {
            pass.setPipeline(this.quadPipeline);
            pass.setBindGroup(0, this.quadBindGroup);
            pass.draw(6);
        }
        if (this.vertexBuf && this.vertexCount > 0) {
            pass.setPipeline(this.meshPipeline);
            pass.setBindGroup(0, this.meshBindGroup);
            pass.setVertexBuffer(0, this.vertexBuf);
            pass.draw(this.vertexCount);
        }
        pass.end();
        this.device.queue.submit([encoder.finish()]);
    }
    dispose() {
        this.vertexBuf?.destroy();
        this.uniformBuf.destroy();
        this.quadUniformBuf.destroy();
    }
}
//# sourceMappingURL=renderer-webgpu.js.map