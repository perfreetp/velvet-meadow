// 纯软件 3D 光栅器：吃普通 2D context，OffscreenCanvas 与 Canvas 通用，不依赖 WebGL。
// 平面着色 + Lambert + 深度缓冲 + 近平面裁剪，支持多网格分色（差异叠加/死角标色）。
import { mul4, transformPt, perspective } from './math3d.js';

const LIGHT = norm3([0.45, 0.8, 0.6]);
const AMBIENT = 0.32;

function norm3(a) {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/**
 * @param ctx OffscreenCanvasRenderingContext2D 或 CanvasRenderingContext2D
 * @param meshes [{positions:Float32Array, indices:Uint32Array, color:[r,g,b], wire?}]
 * @param view 列主序视图矩阵；相机参数由外部 math3d.orbitView 生成
 * @param boundsMm 毛坯外形 [x,y,z]，画包围线框
 */
export function renderScene(ctx, w, h, { meshes, view, boundsMm, fovY = 45, near = 1, far = 5000 }) {
  const proj = perspective(fovY, w / h, near, far);
  const vp = mul4(proj, view);

  const img = ctx.createImageData(w, h);
  const px = img.data;
  const depth = new Float32Array(w * h).fill(Infinity);

  // 背景：深色渐变
  const bgTop = [30, 34, 42], bgBot = [18, 20, 26];
  for (let y = 0; y < h; y++) {
    const t = y / h;
    const r = bgTop[0] + (bgBot[0] - bgTop[0]) * t;
    const g = bgTop[1] + (bgBot[1] - bgTop[1]) * t;
    const b = bgTop[2] + (bgBot[2] - bgTop[2]) * t;
    for (let x = 0; x < w; x++) {
      const o = (y * w + x) * 4;
      px[o] = r; px[o + 1] = g; px[o + 2] = b; px[o + 3] = 255;
    }
  }

  // 相机世界坐标：view 为 R|t（列主序），眼点 = -R^T t
  const eyeH = invertTransform(view);

  for (const mesh of meshes) {
    drawMesh(mesh, vp, view, near, w, h, px, depth, eyeH);
  }

  ctx.putImageData(img, 0, 0);

  // 毛坯包围盒线框 + 可选网格线框（矢量覆盖，不进深度缓冲）
  if (boundsMm) drawBox(ctx, vp, boundsMm, w, h, [110, 130, 150]);
  for (const mesh of meshes) {
    if (mesh.wire) drawWire(ctx, mesh, vp, w, h, mesh.wireColor || [255, 255, 255]);
  }
}

function invertTransform(view) {
  // view = R|t 列主序，逆 = R^T | -R^T t
  const r = [view[0], view[1], view[2], view[4], view[5], view[6], view[8], view[9], view[10]];
  const t = [view[12], view[13], view[14]];
  return [
    -(r[0] * t[0] + r[3] * t[1] + r[6] * t[2]),
    -(r[1] * t[0] + r[4] * t[1] + r[7] * t[2]),
    -(r[2] * t[0] + r[5] * t[1] + r[8] * t[2])
  ];
}

function drawMesh(mesh, vp, view, near, w, h, px, depth, eye) {
  const { positions, indices, color } = mesh;
  const nV = positions.length / 3;
  // 视图空间坐标（裁剪用）与裁剪后屏幕坐标缓存
  const viewPts = new Array(nV);
  const clipPts = new Array(nV);
  for (let i = 0; i < nV; i++) {
    const p = [positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]];
    viewPts[i] = transformPt(view, p);
    clipPts[i] = transformPt(vp, p);
  }
  for (let t = 0; t < indices.length; t += 3) {
    const ia = indices[t], ib = indices[t + 1], ic = indices[t + 2];
    // 世界空间法线与背面剔除
    const ax = positions[ia * 3], ay = positions[ia * 3 + 1], az = positions[ia * 3 + 2];
    const ux = positions[ib * 3] - ax, uy = positions[ib * 3 + 1] - ay, uz = positions[ib * 3 + 2] - az;
    const vx = positions[ic * 3] - ax, vy = positions[ic * 3 + 1] - ay, vz = positions[ic * 3 + 2] - az;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const nl = Math.hypot(nx, ny, nz);
    if (nl < 1e-9) continue;
    nx /= nl; ny /= nl; nz /= nl;
    const ex = eye[0] - ax, ey = eye[1] - ay, ez = eye[2] - az;
    if (nx * ex + ny * ey + nz * ez <= 0) continue;

    // Lambert
    const diff = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
    const shade = AMBIENT + 0.68 * diff;
    const cr = Math.min(255, color[0] * shade);
    const cg = Math.min(255, color[1] * shade);
    const cb = Math.min(255, color[2] * shade);

  // 近平面裁剪（本约定相机朝 -Z，可见点 view-z ∈ [-far, -near]），Sutherland-Hodgman 单面裁剪
  const inV = [viewPts[ia], viewPts[ib], viewPts[ic]];
  const cV = [clipPts[ia], clipPts[ib], clipPts[ic]];
  const poly = clipNear(inV, cV, near);
    for (const tri of poly) {
      rasterTri(tri, w, h, px, depth, cr, cg, cb);
    }
  }
}

function clipNear(viewPts, clipPts, near) {
  const outV = [], outC = [];
  const n = viewPts.length;
  for (let i = 0; i < n; i++) {
    const a = viewPts[i], b = viewPts[(i + 1) % n];
    const ca = clipPts[i], cb = clipPts[(i + 1) % n];
    const ain = a[2] <= -near, bin = b[2] <= -near;
    if (ain) { outV.push(a); outC.push(ca); }
    if (ain !== bin) {
      const f = (-near - a[2]) / (b[2] - a[2]);
      outV.push([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, -near]);
      outC.push([
        ca[0] + (cb[0] - ca[0]) * f,
        ca[1] + (cb[1] - ca[1]) * f,
        ca[2] + (cb[2] - ca[2]) * f,
        ca[3] + (cb[3] - ca[3]) * f
      ]);
    }
  }
  if (outC.length < 3) return [];
  const tris = [];
  for (let i = 1; i < outC.length - 1; i++) tris.push([outC[0], outC[i], outC[i + 1]]);
  return tris;
}

function rasterTri(clip, w, h, px, depth, cr, cg, cb) {
  const s = [];
  for (const c of clip) {
    const inv = 1 / c[3];
    const ndcx = c[0] * inv, ndcy = c[1] * inv;
    s.push({
      x: (ndcx * 0.5 + 0.5) * w,
      y: (1 - (ndcy * 0.5 + 0.5)) * h,
      z: c[2] * inv
    });
  }
  const [p0, p1, p2] = s;
  const area = edge(p0, p1, p2);
  if (Math.abs(area) < 1e-6) return;
  const minX = Math.max(0, Math.floor(Math.min(p0.x, p1.x, p2.x)));
  const maxX = Math.min(w - 1, Math.ceil(Math.max(p0.x, p1.x, p2.x)));
  const minY = Math.max(0, Math.floor(Math.min(p0.y, p1.y, p2.y)));
  const maxY = Math.min(h - 1, Math.ceil(Math.max(p0.y, p1.y, p2.y)));
  const invArea = 1 / area;

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const pxp = x + 0.5, pyp = y + 0.5;
      const w0 = edge(p1, p2, { x: pxp, y: pyp }) * invArea;
      const w1 = edge(p2, p0, { x: pxp, y: pyp }) * invArea;
      const w2 = edge(p0, p1, { x: pxp, y: pyp }) * invArea;
      if (w0 < 0 || w1 < 0 || w2 < 0) continue;
      const z = w0 * p0.z + w1 * p1.z + w2 * p2.z;
      const di = y * w + x;
      if (z >= depth[di]) continue;
      depth[di] = z;
      const o = di * 4;
      px[o] = cr; px[o + 1] = cg; px[o + 2] = cb; px[o + 3] = 255;
    }
  }
}

function edge(a, b, p) {
  return (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
}

function project(vp, p, w, h) {
  const c = transformPt(vp, p);
  if (c[3] <= 0) return null;
  const inv = 1 / c[3];
  return {
    x: (c[0] * inv * 0.5 + 0.5) * w,
    y: (1 - (c[1] * inv * 0.5 + 0.5)) * h,
    behind: c[2] * inv > 1
  };
}

function drawBox(ctx, vp, b, w, h, color) {
  const [bx, by, bz] = b;
  const corners = [
    [0, 0, 0], [bx, 0, 0], [bx, by, 0], [0, by, 0],
    [0, 0, bz], [bx, 0, bz], [bx, by, bz], [0, by, bz]
  ].map((p) => project(vp, p, w, h));
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  ctx.save();
  ctx.strokeStyle = `rgb(${color.join(',')})`;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  for (const [i, j] of edges) {
    const a = corners[i], c = corners[j];
    if (!a || !c) continue;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(c.x, c.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawWire(ctx, mesh, vp, w, h, color) {
  const { positions, indices } = mesh;
  const seen = new Set();
  ctx.save();
  ctx.strokeStyle = `rgba(${color.join(',')},0.55)`;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let t = 0; t < indices.length; t += 3) {
    const tri = [indices[t], indices[t + 1], indices[t + 2]];
    const pairs = [[tri[0], tri[1]], [tri[1], tri[2]], [tri[2], tri[0]]];
    for (const [a, b2] of pairs) {
      const k = a < b2 ? a * 1000003 + b2 : b2 * 1000003 + a;
      if (seen.has(k)) continue;
      seen.add(k);
      const pa = project(vp, [positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]], w, h);
      const pb = project(vp, [positions[b2 * 3], positions[b2 * 3 + 1], positions[b2 * 3 + 2]], w, h);
      if (!pa || !pb) continue;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
    }
  }
  ctx.stroke();
  ctx.restore();
}
