import * as THREE from 'three';
import type {
  Comment,
  Lamp,
  ProjectData,
  SceneElement,
  SimResult,
  Vec2,
} from '../types';
import { deg2rad, dist, pointInPolygon } from '../engine/geometry';
import { colorTempToLinearRGB, timeCurve } from '../engine/photometry';

const COLORS = {
  water: 0x123049,
  waterLine: 0x2f6f9f,
  wall: 0x8a8f98,
  wallLine: 0xd7dbe2,
  bridge: 0x5b4636,
  pier: 0x6e6259,
  dock: 0x9c7b4f,
  route: 0xffd166,
  select: 0x38e1ff,
  vertex: 0x38e1ff,
  comment: 0xff5d73,
  commentResolved: 0x4ade80,
};

export interface CameraState {
  centerX: number;
  centerY: number;
  zoom: number; // 世界米 -> 像素 的换算系数（半高/半视域）
}

interface StageCallbacks {
  onPick: (id: string | null, worldPos: Vec2) => void;
  onDrag: (id: string, pos: Vec2) => void;
  onVertexDrag: (id: string, index: number, pos: Vec2) => void;
  onCanvasClick: (worldPos: Vec2, shift: boolean) => void;
  onCameraChange: (cam: CameraState) => void;
}

function worldToShape(points: Vec2[]): THREE.Shape {
  const shape = new THREE.Shape();
  shape.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) shape.lineTo(points[i].x, points[i].y);
  shape.closePath();
  return shape;
}

function lampColor(lamp: Lamp): THREE.Color {
  const c = colorTempToLinearRGB(lamp.colorTemp);
  return new THREE.Color(c.r, c.g, c.b);
}

export class ThreeStage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.OrthographicCamera;
  private container: HTMLElement;
  private cb: StageCallbacks;
  private worldLayer = new THREE.Group();
  private heatLayer = new THREE.Group();
  private overlayLayer = new THREE.Group();
  private pickables: { obj: THREE.Object3D; id: string }[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private cam: CameraState = { centerX: 0, centerY: 0, zoom: 6 };
  private drag:
    | { mode: 'pan'; sx: number; sy: number; cx: number; cy: number }
    | { mode: 'lamp'; id: string }
    | { mode: 'vertex'; id: string; index: number }
    | { mode: 'body'; id: string; offset: Vec2 }
    | null = null;
  private disposed = false;
  private commentMap = new Map<string, Comment>();
  private lampMap = new Map<string, Lamp>();
  private data: ProjectData | null = null;
  private sim: SimResult | null = null;

  constructor(container: HTMLElement, cb: StageCallbacks) {
    this.container = container;
    this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x0b1220, 1);
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = 'none';

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.OrthographicCamera(
      (-aspect * 50) / this.cam.zoom,
      (aspect * 50) / this.cam.zoom,
      50 / this.cam.zoom,
      -50 / this.cam.zoom,
      -100,
      100,
    );
    this.camera.position.set(this.cam.centerX, this.cam.centerY, 10);
    this.camera.lookAt(this.cam.centerX, this.cam.centerY, 0);

    this.scene.add(this.heatLayer, this.worldLayer, this.overlayLayer);
    this.bindEvents();
    this.applySky(19.5);
    this.animate();
  }

  // ---------- 相机 ----------
  private updateCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const halfH = 50 / this.cam.zoom;
    const halfW = halfH * aspect;
    this.camera.left = this.cam.centerX - halfW;
    this.camera.right = this.cam.centerX + halfW;
    this.camera.top = this.cam.centerY + halfH;
    this.camera.bottom = this.cam.centerY - halfH;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(this.cam.centerX, this.cam.centerY, 10);
  }

  getCamera(): CameraState {
    return { ...this.cam };
  }

  setCamera(c: CameraState, silent = false) {
    this.cam = { ...c };
    this.updateCamera();
    if (!silent) this.cb.onCameraChange(this.getCamera());
  }

  fitTo(points: Vec2[], pad = 1.3) {
    if (!points.length) return;
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const w = Math.max(maxX - minX, 20);
    const h = Math.max(maxY - minY, 20);
    const aspect = this.container.clientWidth / this.container.clientHeight;
    const zoom = Math.min((100 / w) * aspect * pad, 100 / h * pad);
    this.setCamera({
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
      zoom: Math.max(0.8, zoom),
    });
  }

  toWorld(clientX: number, clientY: number): Vec2 {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((clientY - rect.top) / rect.height) * 2 - 1);
    const v = new THREE.Vector3(nx, ny, 0).unproject(this.camera);
    return { x: v.x, y: v.y };
  }

  // ---------- 事件 ----------
  private bindEvents() {
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('wheel', this.onWheel, { passive: false });
    el.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const before = this.toWorld(e.clientX, e.clientY);
    const factor = Math.exp(-e.deltaY * 0.0012);
    this.cam.zoom = Math.min(40, Math.max(0.5, this.cam.zoom * factor));
    this.updateCamera();
    const after = this.toWorld(e.clientX, e.clientY);
    this.cam.centerX += before.x - after.x;
    this.cam.centerY += before.y - after.y;
    this.updateCamera();
    this.cb.onCameraChange(this.getCamera());
  };

  private pickAt(clientX: number, clientY: number): { id: string; point: Vec2 } | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const objs = this.pickables.map((p) => p.obj);
    const hits = this.raycaster.intersectObjects(objs, false);
    if (!hits.length) return null;
    const entry = this.pickables.find((p) => p.obj === hits[0].object);
    if (!entry) return null;
    const p = this.toWorld(clientX, clientY);
    return { id: entry.id, point: p };
  }

  private onPointerDown = (e: PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const p = this.toWorld(e.clientX, e.clientY);
    if (e.button === 1 || e.button === 2) {
      this.drag = { mode: 'pan', sx: e.clientX, sy: e.clientY, cx: this.cam.centerX, cy: this.cam.centerY };
      return;
    }
    const hit = this.pickAt(e.clientX, e.clientY);
    if (hit) {
      const lamp = this.lampMap.get(hit.id);
      if (lamp) {
        this.drag = { mode: 'lamp', id: hit.id };
        this.cb.onPick(hit.id, hit.point);
        return;
      }
      // 顶点拖拽
      const vx = hit.id.indexOf('|vertex:');
      if (vx >= 0) {
        const ownerId = hit.id.slice(0, vx);
        const index = Number(hit.id.split(':')[1]);
        this.drag = { mode: 'vertex', id: ownerId, index };
        this.cb.onPick(ownerId, hit.point);
        return;
      }
      const cmt = this.commentMap.get(hit.id);
      if (cmt) {
        this.cb.onPick(hit.id, hit.point);
        return;
      }
      this.drag = { mode: 'body', id: hit.id, offset: { x: 0, y: 0 } };
      this.cb.onPick(hit.id, hit.point);
      return;
    }
    this.cb.onPick(null, p);
    this.cb.onCanvasClick(p, e.shiftKey);
  };

  private onPointerMove = (e: PointerEvent) => {
    if (!this.drag) {
      const hit = this.pickAt(e.clientX, e.clientY);
      this.renderer.domElement.style.cursor = hit ? 'pointer' : 'crosshair';
      return;
    }
    const p = this.toWorld(e.clientX, e.clientY);
    if (this.drag.mode === 'pan') {
      const rect = this.renderer.domElement.getBoundingClientRect();
      const scale = 100 / this.cam.zoom / rect.height;
      this.cam.centerX = this.drag.cx - (e.clientX - this.drag.sx) * scale;
      this.cam.centerY = this.drag.cy + (e.clientY - this.drag.sy) * scale;
      this.updateCamera();
      this.cb.onCameraChange(this.getCamera());
    } else if (this.drag.mode === 'lamp') {
      this.cb.onDrag(this.drag.id, p);
    } else if (this.drag.mode === 'vertex') {
      this.cb.onVertexDrag(this.drag.id, this.drag.index, p);
    } else if (this.drag.mode === 'body') {
      this.cb.onDrag(this.drag.id, p);
    }
  };

  private onPointerUp = () => {
    this.drag = null;
  };

  // ---------- 场景构建 ----------
  applySky(hour: number) {
    const c = timeCurve(hour).skyColor;
    this.renderer.setClearColor(new THREE.Color(c.r, c.g, c.b), 1);
  }

  rebuild(data: ProjectData, sim: SimResult | null, selectedId: string | null, drawing: Vec2[]) {
    this.data = data;
    this.sim = sim;
    this.applySky(data.timeHour);
    this.clearGroup(this.worldLayer);
    this.clearGroup(this.overlayLayer);
    this.pickables = [];
    this.commentMap.clear();
    this.lampMap.clear();

    this.buildHeatmap(data, sim);

    const order: SceneElement['type'][] = ['water', 'dock', 'wall', 'pier', 'bridgeOpening', 'route', 'lamp'];
    const sorted = [...data.elements].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    for (const el of sorted) this.buildElement(el, selectedId);
    for (const c of data.comments) this.buildComment(c);
    this.buildDrawing(drawing);
  }

  private register(obj: THREE.Object3D, id: string) {
    this.pickables.push({ obj, id });
  }

  private buildElement(el: SceneElement, selectedId: string | null) {
    const selected = el.id === selectedId;
    switch (el.type) {
      case 'water': {
        const mesh = new THREE.Mesh(
          new THREE.ShapeGeometry(worldToShape(el.points)),
          new THREE.MeshBasicMaterial({ color: COLORS.water, transparent: true, opacity: 0.92, side: THREE.DoubleSide }),
        );
        this.worldLayer.add(mesh);
        this.register(mesh, el.id);
        this.addOutline(el.points, COLORS.waterLine, true, 0.5);
        break;
      }
      case 'wall': {
        // 有厚度带
        const pts = el.points;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1];
          const dx = b.x - a.x, dy = b.y - a.y;
          const l = Math.hypot(dx, dy) || 1;
          const nx = (-dy / l) * el.thickness * 0.5;
          const ny = (dx / l) * el.thickness * 0.5;
          const shape = new THREE.Shape();
          shape.moveTo(a.x + nx, a.y + ny);
          shape.lineTo(b.x + nx, b.y + ny);
          shape.lineTo(b.x - nx, b.y - ny);
          shape.lineTo(a.x - nx, a.y - ny);
          shape.closePath();
          const mesh = new THREE.Mesh(
            new THREE.ShapeGeometry(shape),
            new THREE.MeshBasicMaterial({ color: COLORS.wall, side: THREE.DoubleSide }),
          );
          this.worldLayer.add(mesh);
          this.register(mesh, el.id);
        }
        this.addOutline(el.points, COLORS.wallLine, false, 0.9);
        if (selected) this.addVertices(el.id, el.points);
        break;
      }
      case 'pier': {
        const mesh = new THREE.Mesh(
          new THREE.ShapeGeometry(worldToShape(el.points)),
          new THREE.MeshBasicMaterial({ color: COLORS.pier, side: THREE.DoubleSide }),
        );
        this.worldLayer.add(mesh);
        this.register(mesh, el.id);
        this.addOutline(el.points, 0xb8a99a, true, 0.9);
        if (selected) this.addVertices(el.id, el.points);
        break;
      }
      case 'bridgeOpening': {
        const mesh = new THREE.Mesh(
          new THREE.ShapeGeometry(worldToShape(el.points)),
          new THREE.MeshBasicMaterial({ color: COLORS.bridge, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
        );
        this.worldLayer.add(mesh);
        this.register(mesh, el.id);
        this.addOutline(el.points, 0xc9a37a, true, 0.8);
        if (selected) this.addVertices(el.id, el.points);
        break;
      }
      case 'dock': {
        const mesh = new THREE.Mesh(
          new THREE.ShapeGeometry(worldToShape(el.points)),
          new THREE.MeshBasicMaterial({ color: COLORS.dock, transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
        );
        this.worldLayer.add(mesh);
        this.register(mesh, el.id);
        this.addOutline(el.points, 0xd8b77d, true, 0.9);
        if (selected) this.addVertices(el.id, el.points);
        break;
      }
      case 'route': {
        const geo = new THREE.BufferGeometry().setFromPoints(
          el.points.map((p) => new THREE.Vector3(p.x, p.y, 0.4)),
        );
        const line = new THREE.Line(
          geo,
          new THREE.LineDashedMaterial({
            color: COLORS.route,
            dashSize: 1.6,
            gapSize: 1,
            linewidth: 2,
          }),
        );
        line.computeLineDistances();
        this.worldLayer.add(line);
        if (selected) this.addVertices(el.id, el.points);
        break;
      }
      case 'lamp': {
        this.lampMap.set(el.id, el);
        this.buildLamp(el, selected);
        break;
      }
    }
  }

  private buildLamp(lamp: Lamp, selected: boolean) {
    const g = new THREE.Group();
    const color = lampColor(lamp);
    const curve = timeCurve(this.data?.timeHour ?? 19.5);
    const dimAlpha = 0.12 + 0.3 * curve.lampDimming;

    // 光束扇形（全向灯画整圆光晕）
    if (lamp.beamAngleDeg > 0) {
      const half = deg2rad(lamp.beamAngleDeg / 2);
      const reach = Math.max(6, Math.sqrt(lamp.powerW) * 1.6);
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      const steps = 24;
      for (let i = 0; i <= steps; i++) {
        const a = lamp.aim - half + (2 * half * i) / steps;
        shape.lineTo(Math.cos(a) * reach, Math.sin(a) * reach);
      }
      shape.closePath();
      const cone = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: dimAlpha, side: THREE.DoubleSide, depthWrite: false }),
      );
      cone.position.set(lamp.pos.x, lamp.pos.y, 0.1);
      g.add(cone);
    } else {
      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(Math.max(2, Math.sqrt(lamp.powerW) * 0.9), 32),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: dimAlpha, depthWrite: false }),
      );
      glow.position.set(lamp.pos.x, lamp.pos.y, 0.1);
      g.add(glow);
    }

    // 灯位标记
    const markerR = 0.7;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(markerR * 0.7, markerR, 24),
      new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }),
    );
    ring.position.set(lamp.pos.x, lamp.pos.y, 0.6);
    g.add(ring);
    const core = new THREE.Mesh(
      new THREE.CircleGeometry(markerR * 0.45, 16),
      new THREE.MeshBasicMaterial({ color: selected ? COLORS.select : color }),
    );
    core.position.set(lamp.pos.x, lamp.pos.y, 0.61);
    g.add(core);

    // 指向箭头
    if (lamp.beamAngleDeg > 0) {
      const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(Math.cos(lamp.aim), Math.sin(lamp.aim), 0),
        new THREE.Vector3(lamp.pos.x, lamp.pos.y, 0.62),
        2.2,
        selected ? COLORS.select : color.getHex(),
        0.7,
        0.45,
      );
      g.add(arrow);
    }
    if (selected) {
      const sel = new THREE.Mesh(
        new THREE.RingGeometry(1.1, 1.35, 28),
        new THREE.MeshBasicMaterial({ color: COLORS.select, side: THREE.DoubleSide }),
      );
      sel.position.set(lamp.pos.x, lamp.pos.y, 0.7);
      g.add(sel);
    }
    this.worldLayer.add(g);
    this.register(ring, lamp.id);
    this.register(core, lamp.id);
  }

  private buildComment(c: Comment) {
    this.commentMap.set(c.id, c);
    const g = new THREE.Group();
    const color = c.resolved ? COLORS.commentResolved : COLORS.comment;
    const pin = new THREE.Mesh(
      new THREE.CircleGeometry(1.0, 20),
      new THREE.MeshBasicMaterial({ color }),
    );
    pin.position.set(c.pos.x, c.pos.y, 0.8);
    g.add(pin);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.3, 20),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
    );
    ring.position.set(c.pos.x, c.pos.y, 0.8);
    g.add(ring);
    this.overlayLayer.add(g);
    this.register(pin, c.id);
  }

  private buildDrawing(drawing: Vec2[]) {
    if (!drawing.length) return;
    const geo = new THREE.BufferGeometry().setFromPoints(
      drawing.map((p) => new THREE.Vector3(p.x, p.y, 0.9)),
    );
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: COLORS.select }),
    );
    this.overlayLayer.add(line);
    for (const p of drawing) {
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.4, 10),
        new THREE.MeshBasicMaterial({ color: COLORS.select }),
      );
      dot.position.set(p.x, p.y, 0.9);
      this.overlayLayer.add(dot);
    }
  }

  private addOutline(points: Vec2[], color: number, closed: boolean, opacity: number) {
    const pts = points.map((p) => new THREE.Vector3(p.x, p.y, 0.3));
    if (closed) pts.push(new THREE.Vector3(points[0].x, points[0].y, 0.3));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    this.worldLayer.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity })));
  }

  private addVertices(ownerId: string, points: Vec2[]) {
    points.forEach((p, i) => {
      const m = new THREE.Mesh(
        new THREE.CircleGeometry(0.55, 12),
        new THREE.MeshBasicMaterial({ color: COLORS.vertex, side: THREE.DoubleSide }),
      );
      m.position.set(p.x, p.y, 0.95);
      this.overlayLayer.add(m);
      this.register(m, `${ownerId}|vertex:${i}`);
    });
  }

  // ---------- 热力图 ----------
  private buildHeatmap(data: ProjectData, sim: SimResult | null) {
    this.clearGroup(this.heatLayer);
    if (!sim || !data.heatmapVisible) return;
    const { cols, rows, cellSize, gridOrigin, total, direct, reflected, inWater, darkZones } = sim;
    const canvas = document.createElement('canvas');
    canvas.width = cols;
    canvas.height = rows;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(cols, rows);
    const src =
      data.heatmapMode === 'direct' ? direct : data.heatmapMode === 'reflected' ? reflected : total;

    for (let i = 0; i < cols * rows; i++) {
      const o = i * 4;
      if (!inWater[i]) {
        img.data[o + 3] = 0;
        continue;
      }
      const lux = src[i];
      const [r, g, b, a] = luxColor(lux, data.luxThreshold);
      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = a;
    }
    ctx.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    const w = cols * cellSize;
    const h = rows * cellSize;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.72, depthWrite: false }),
    );
    mesh.position.set(gridOrigin.x + w / 2, gridOrigin.y + h / 2, 0.05);
    this.heatLayer.add(mesh);

    // 暗区红色描边
    if (data.darkZoneVisible) {
      for (const dz of darkZones) {
        let minCx = Infinity, maxCx = -Infinity, minCy = Infinity, maxCy = -Infinity;
        for (const c of dz.cells) {
          const ccx = c % cols;
          const ccy = (c - ccx) / cols;
          if (ccx < minCx) minCx = ccx;
          if (ccx > maxCx) maxCx = ccx;
          if (ccy < minCy) minCy = ccy;
          if (ccy > maxCy) maxCy = ccy;
        }
        const minX = gridOrigin.x + minCx * cellSize;
        const maxX = gridOrigin.x + (maxCx + 1) * cellSize;
        const minY = gridOrigin.y + minCy * cellSize;
        const maxY = gridOrigin.y + (maxCy + 1) * cellSize;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(minX, minY, 0.15),
          new THREE.Vector3(maxX, minY, 0.15),
          new THREE.Vector3(maxX, maxY, 0.15),
          new THREE.Vector3(minX, maxY, 0.15),
          new THREE.Vector3(minX, minY, 0.15),
        ]);
        this.heatLayer.add(
          new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xff2d2d })),
        );
      }
    }
  }

  private clearGroup(group: THREE.Group) {
    group.traverse((o) => {
      const anyO = o as THREE.Mesh;
      if (anyO.geometry) anyO.geometry.dispose();
      const mat = anyO.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
    group.clear();
  }

  private animate = () => {
    if (this.disposed) return;
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };

  resize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.renderer.setSize(w, h);
    this.updateCamera();
  }

  dispose() {
    this.disposed = true;
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('wheel', this.onWheel);
    this.clearGroup(this.worldLayer);
    this.clearGroup(this.heatLayer);
    this.clearGroup(this.overlayLayer);
    this.renderer.dispose();
    el.remove();
  }
}

/** 照度 -> 热力色（蓝-青-绿-黄-红），低于阈值强制红调 */
function luxColor(lux: number, threshold: number): [number, number, number, number] {
  if (lux < threshold) {
    // 暗红，越暗越深
    const t = Math.max(0, lux / threshold);
    return [180 + 40 * t, 30 + 20 * t, 40, 200];
  }
  const t = Math.min(1, Math.log10(1 + lux) / Math.log10(1 + 120));
  // 多段渐变
  const stops: [number, [number, number, number]][] = [
    [0, [40, 70, 200]],
    [0.35, [30, 170, 200]],
    [0.6, [60, 190, 90]],
    [0.8, [230, 200, 60]],
    [1, [235, 90, 40]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0);
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * k),
        Math.round(c0[1] + (c1[1] - c0[1]) * k),
        Math.round(c0[2] + (c1[2] - c0[2]) * k),
        185,
      ];
    }
  }
  return [235, 90, 40, 185];
}

// 供外部使用的工具
export { pointInPolygon, dist };
