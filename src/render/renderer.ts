import type { IntersectionPoint, PathData, Vec2 } from '../core/types';
import { arcGeom, tessellateArc } from '../core/math2d';
import { eachSeg, flattenPath, segEndpoints } from '../core/geometry';

export interface Camera {
  /** 世界坐标（mm）-> 屏幕像素（CSS px） */
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface RenderOptions {
  width: number;
  height: number;
  grid: number;
  paths: PathData[];
  /** 路径是否可编辑（决定锚点是否显示） */
  editable: (pathId: string) => boolean;
  selectedPathIds: string[];
  selectedAnchor: { pathId: string; anchorId: string } | null;
  intersections: IntersectionPoint[];
  /** 正在绘制中的临时预览点 */
  preview?: { points: Vec2[]; closed: boolean; dashed: boolean; color: string } | null;
  snapMarker?: { point: Vec2; kind: 'grid' | 'anchor' | 'none'; constraint?: number; origin?: Vec2 } | null;
  hoverAnchor?: { pathId: string; anchorId: string } | null;
  /** 缺口提示标记（练习模式） */
  gapEnds?: Vec2[];
}

interface V2f { x: number; y: number }

const VERT = `#version 300 es
layout(location=0) in vec2 a_pos;
layout(location=1) in vec4 a_color;
layout(location=2) in float a_size;
uniform vec2 u_resolution;
uniform float u_dpr;
out vec4 v_color;
out float v_size;
void main() {
  vec2 clip = vec2(
    (a_pos.x / u_resolution.x) * 2.0 - 1.0,
    1.0 - (a_pos.y / u_resolution.y) * 2.0
  );
  gl_Position = vec4(clip, 0.0, 1.0);
  v_color = a_color;
  v_size = a_size * u_dpr;
  gl_PointSize = v_size;
}`;

const FRAG = `#version 300 es
precision highp float;
in vec4 v_color;
in float v_size;
uniform int u_mode; // 0=三角形 1=圆点
out vec4 outColor;
void main() {
  if (u_mode == 1) {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float edge = smoothstep(1.0, 0.8, r2);
    outColor = vec4(v_color.rgb, v_color.a * edge);
  } else {
    outColor = v_color;
  }
}`;

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [96, 165, 250];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

function rgba(hex: string, a: number): [number, number, number, number] {
  const [r, g, b] = hexToRgb(hex);
  return [r / 255, g / 255, b / 255, a];
}

export class Renderer {
  private gl: WebGL2RenderingContext;
  private prog: WebGLProgram;
  private vbo: WebGLBuffer;
  private vao: WebGLVertexArrayObject;
  private uRes: WebGLUniformLocation;
  private uDpr: WebGLUniformLocation;
  private uMode: WebGLUniformLocation;
  private camera: Camera = { scale: 10, offsetX: 40, offsetY: 40 };
  private dpr = 1;
  private triData: number[] = [];
  private pointData: number[] = [];

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false });
    if (!gl) throw new Error('当前浏览器不支持 WebGL2');
    this.gl = gl;
    this.prog = this.createProgram(VERT, FRAG);
    this.vao = gl.createVertexArray()!;
    this.vbo = gl.createBuffer()!;
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    const stride = 7 * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 4, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 1, gl.FLOAT, false, stride, 6 * 4);
    this.uRes = gl.getUniformLocation(this.prog, 'u_resolution')!;
    this.uDpr = gl.getUniformLocation(this.prog, 'u_dpr')!;
    this.uMode = gl.getUniformLocation(this.prog, 'u_mode')!;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  }

  private createProgram(vs: string, fs: string): WebGLProgram {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        throw new Error('着色器编译失败: ' + gl.getShaderInfoLog(sh));
      }
      return sh;
    };
    const p = gl.createProgram()!;
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error('着色器链接失败: ' + gl.getProgramInfoLog(p));
    }
    return p;
  }

  getCamera(): Camera { return { ...this.camera }; }
  setCamera(c: Camera): void { this.camera = { ...c }; }

  fitView(docW: number, docH: number, cssW: number, cssH: number): void {
    const pad = 40;
    const s = Math.min((cssW - pad * 2) / docW, (cssH - pad * 2) / docH);
    this.camera = {
      scale: s,
      offsetX: (cssW - docW * s) / 2,
      offsetY: (cssH - docH * s) / 2
    };
  }

  worldToScreen(p: Vec2): V2f {
    return {
      x: p.x * this.camera.scale + this.camera.offsetX,
      y: p.y * this.camera.scale + this.camera.offsetY
    };
  }

  screenToWorld(p: V2f): Vec2 {
    return {
      x: (p.x - this.camera.offsetX) / this.camera.scale,
      y: (p.y - this.camera.offsetY) / this.camera.scale
    };
  }

  zoom(factor: number, center: V2f): void {
    const before = this.screenToWorld(center);
    this.camera.scale = Math.max(0.5, Math.min(200, this.camera.scale * factor));
    this.camera.offsetX = center.x - before.x * this.camera.scale;
    this.camera.offsetY = center.y - before.y * this.camera.scale;
  }

  pan(dx: number, dy: number): void {
    this.camera.offsetX += dx;
    this.camera.offsetY += dy;
  }

  resize(cssW: number, cssH: number): void {
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    const canvas = this.gl.canvas as HTMLCanvasElement;
    canvas.width = Math.round(cssW * this.dpr);
    canvas.height = Math.round(cssH * this.dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
  }

  private pushTri(x: number, y: number, c: [number, number, number, number]): void {
    this.triData.push(x, y, c[0], c[1], c[2], c[3], 0);
  }

  private pushPoint(x: number, y: number, sizePx: number, c: [number, number, number, number]): void {
    this.pointData.push(x, y, c[0], c[1], c[2], c[3], sizePx);
  }

  /** 屏幕空间粗线（三角带） */
  private line2D(a: V2f, b: V2f, widthPx: number, color: string, alpha = 1, dashed = false): void {
    const c = rgba(color, alpha);
    const dx = b.x - a.x, dy = b.y - a.y;
    const l = Math.hypot(dx, dy);
    if (l < 1e-6) return;
    const nx = (-dy / l) * widthPx / 2;
    const ny = (dx / l) * widthPx / 2;

    const drawSpan = (p0: V2f, p1: V2f) => {
      const ex = p1.x - p0.x, ey = p1.y - p0.y;
      const enx = (-ey / l) * widthPx / 2;
      const eny = (ex / l) * widthPx / 2;
      const q1 = { x: p0.x + enx, y: p0.y + eny };
      const q2 = { x: p0.x - enx, y: p0.y - eny };
      const q3 = { x: p1.x + enx, y: p1.y + eny };
      const q4 = { x: p1.x - enx, y: p1.y - eny };
      this.pushTri(q1.x, q1.y, c); this.pushTri(q2.x, q2.y, c);
      this.pushTri(q3.x, q3.y, c);
      this.pushTri(q2.x, q2.y, c); this.pushTri(q4.x, q4.y, c); this.pushTri(q3.x, q3.y, c);
    };

    if (!dashed) {
      drawSpan(a, b);
      return;
    }
    const dashLen = 7, gapLen = 5;
    const ux = dx / l, uy = dy / l;
    let t = 0;
    while (t < l) {
      const t1 = Math.min(l, t + dashLen);
      drawSpan({ x: a.x + ux * t, y: a.y + uy * t }, { x: a.x + ux * t1, y: a.y + uy * t1 });
      t += dashLen + gapLen;
    }
    void nx; void ny;
  }

  private polyline2D(pts: V2f[], widthPx: number, color: string, alpha = 1, dashed = false, closed = false): void {
    for (let i = 0; i < pts.length - 1; i++) this.line2D(pts[i], pts[i + 1], widthPx, color, alpha, dashed);
    if (closed && pts.length > 2) this.line2D(pts[pts.length - 1], pts[0], widthPx, color, alpha, dashed);
  }

  private ring(cx: number, cy: number, r: number, widthPx: number, color: string, alpha = 1): void {
    const seg = 24;
    const c = rgba(color, alpha);
    const ro = r + widthPx / 2, ri = Math.max(0, r - widthPx / 2);
    for (let i = 0; i < seg; i++) {
      const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
      const p = (rad: number, ang: number) => [cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad] as const;
      const [o0x, o0y] = p(ro, a0), [o1x, o1y] = p(ro, a1);
      const [i0x, i0y] = p(ri, a0), [i1x, i1y] = p(ri, a1);
      this.pushTri(o0x, o0y, c); this.pushTri(i0x, i0y, c); this.pushTri(o1x, o1y, c);
      this.pushTri(i0x, i0y, c); this.pushTri(i1x, i1y, c); this.pushTri(o1x, o1y, c);
    }
  }

  render(opts: RenderOptions): void {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const cssW = canvas.clientWidth, cssH = canvas.clientHeight;
    this.triData = [];
    this.pointData = [];

    // 背景
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.075, 0.09, 0.12, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    this.drawGrid(opts.width, opts.height, opts.grid);

    // 路径
    for (const path of opts.paths) {
      const selected = opts.selectedPathIds.includes(path.id);
      const editable = opts.editable(path.id);
      const alpha = editable ? 1 : 0.55;
      const w = selected ? 3 : 2;
      const { pts } = flattenPath(path, 0.05);
      const screen = pts.map(p => this.worldToScreen(p));
      this.polyline2D(screen, w, path.color, alpha, false, path.closed);

      if (editable) {
        // 圆弧 bulge 控制手柄（小弧顶标记）
        for (const seg of eachSeg(path)) {
          if (seg.type !== 'arc') continue;
          const [a, b] = segEndpoints(path, seg);
          const g = arcGeom(a, b, seg.bulge);
          if (!g) continue;
          const apex = this.worldToScreen({
            x: g.center.x + g.radius * Math.cos(g.startAngle + g.sweep / 2),
            y: g.center.y + g.radius * Math.sin(g.startAngle + g.sweep / 2)
          });
          this.pushPoint(apex.x, apex.y, 7, rgba('#fbbf24', 0.9));
        }
        // 锚点
        for (const anchor of path.anchors) {
          const s = this.worldToScreen(anchor);
          const isSel = opts.selectedAnchor?.pathId === path.id && opts.selectedAnchor.anchorId === anchor.id;
          const isHover = opts.hoverAnchor?.pathId === path.id && opts.hoverAnchor.anchorId === anchor.id;
          if (isSel) {
            this.ring(s.x, s.y, 6, 2, '#f8fafc');
            this.pushPoint(s.x, s.y, 8, rgba(path.color, 1));
          } else if (isHover) {
            this.ring(s.x, s.y, 5.5, 1.5, '#e2e8f0');
            this.pushPoint(s.x, s.y, 7, rgba(path.color, 1));
          } else {
            this.pushPoint(s.x, s.y, 7, rgba(path.color, 1));
            this.ring(s.x, s.y, 3.5, 1, '#0f172a', 0.9);
          }
        }
      }
    }

    // 预览（绘制中的路径）
    if (opts.preview) {
      const screen = opts.preview.points.map(p => this.worldToScreen(p));
      this.polyline2D(screen, 2, opts.preview.color, 0.9, opts.preview.dashed, opts.preview.closed);
      for (const p of screen) this.pushPoint(p.x, p.y, 6, rgba(opts.preview.color, 0.95));
    }

    // 交点高亮
    for (const ip of opts.intersections) {
      const s = this.worldToScreen(ip);
      this.ring(s.x, s.y, 8, 2.5, '#ef4444');
      this.ring(s.x, s.y, 12, 1, '#ef4444', 0.4);
      this.pushPoint(s.x, s.y, 6, rgba('#fecaca', 1));
    }

    // 缺口端点
    for (const g of opts.gapEnds ?? []) {
      const s = this.worldToScreen(g);
      this.ring(s.x, s.y, 9, 2, '#f97316');
    }

    // 吸附/约束辅助
    if (opts.snapMarker) {
      const m = opts.snapMarker;
      if (m.kind !== 'none' && m.point) {
        const s = this.worldToScreen(m.point);
        this.ring(s.x, s.y, 10, 1.5, m.kind === 'grid' ? '#22d3ee' : '#a3e635');
      }
      if (m.constraint !== undefined && m.origin) {
        const o = this.worldToScreen(m.origin);
        const ang = (m.constraint * Math.PI) / 180;
        const L = 1400;
        this.line2D(
          { x: o.x - Math.cos(ang) * L, y: o.y - Math.sin(ang) * L },
          { x: o.x + Math.cos(ang) * L, y: o.y + Math.sin(ang) * L },
          1, '#94a3b8', 0.7, true
        );
      }
    }

    this.flush(cssW, cssH);
  }

  private drawGrid(docW: number, docH: number, grid: number): void {
    const tl = this.screenToWorld({ x: 0, y: 0 });
    const br = this.screenToWorld({ x: (this.gl.canvas as HTMLCanvasElement).clientWidth, y: (this.gl.canvas as HTMLCanvasElement).clientHeight });
    const x0 = Math.max(0, Math.floor(tl.x / grid) * grid);
    const x1 = Math.min(docW, Math.ceil(br.x / grid) * grid);
    const y0 = Math.max(0, Math.floor(tl.y / grid) * grid);
    const y1 = Math.min(docH, Math.ceil(br.y / grid) * grid);

    // 画布边框
    const a = this.worldToScreen({ x: 0, y: 0 });
    const b = this.worldToScreen({ x: docW, y: 0 });
    const c = this.worldToScreen({ x: docW, y: docH });
    const d = this.worldToScreen({ x: 0, y: docH });
    this.polyline2D([a, b, c, d], 1.5, '#475569', 0.9, false, true);

    for (let x = x0; x <= x1 + 1e-9; x += grid) {
      const major = Math.abs(x / grid - Math.round(x / grid / 5) * 5) < 1e-6;
      const p0 = this.worldToScreen({ x, y: 0 });
      const p1 = this.worldToScreen({ x, y: docH });
      this.line2D(p0, p1, 1, major ? '#334155' : '#1e293b', major ? 0.8 : 0.6);
    }
    for (let y = y0; y <= y1 + 1e-9; y += grid) {
      const major = Math.abs(y / grid - Math.round(y / grid / 5) * 5) < 1e-6;
      const p0 = this.worldToScreen({ x: 0, y });
      const p1 = this.worldToScreen({ x: docW, y });
      this.line2D(p0, p1, 1, major ? '#334155' : '#1e293b', major ? 0.8 : 0.6);
    }
  }

  private flush(cssW: number, cssH: number): void {
    const gl = this.gl;
    gl.useProgram(this.prog);
    gl.bindVertexArray(this.vao);
    gl.uniform2f(this.uRes, cssW, cssH);
    gl.uniform1f(this.uDpr, this.dpr);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.uniform1i(this.uMode, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.triData), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, this.triData.length / 7);

    if (this.pointData.length) {
      gl.uniform1i(this.uMode, 1);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.pointData), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.POINTS, 0, this.pointData.length / 7);
    }
  }
}

export function arcTessellationPoints(path: PathData): number {
  let n = 0;
  for (const seg of eachSeg(path)) {
    if (seg.type === 'arc') {
      const [a, b] = segEndpoints(path, seg);
      const g = arcGeom(a, b, seg.bulge);
      if (g) n += tessellateArc(g).length;
    }
  }
  return n;
}
