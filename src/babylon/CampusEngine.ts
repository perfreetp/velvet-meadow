import {
  ArcRotateCamera,
  Color3,
  Color4,
  DynamicTexture,
  Engine,
  Matrix,
  Mesh,
  MeshBuilder,
  Quaternion,
  Scalar,
  Scene,
  StandardMaterial,
  Vector3,
} from '@babylonjs/core';
import { CATEGORY_BY_ID, LAYERS, LOD, MAX_H, MIN_H } from '../config';
import type {
  AnyFeature, BuildingFeature, LayerId, Mark, MeasureSeg, PointCategory, PointFeature,
  ToolMode, ViewState,
} from '../types';
import type { CampusData } from '../types';

export interface BoxRect { x0: number; y0: number; x1: number; y1: number }

export interface EngineCallbacks {
  onPick?: (f: AnyFeature | null) => void;
  onHover?: (f: AnyFeature | null, sx: number, sy: number) => void;
  onBoxRect?: (r: BoxRect | null) => void;
  onMeasureSeg?: (seg: MeasureSeg) => void;
  /** 双击结束；dropLast=true 时双击产生的零长度末段需要外部同步剔除 */
  onMeasureDouble?: (dropLast: boolean) => void;
  onMarkPick?: (x: number, z: number, sx: number, sy: number) => void;
}

interface PointBucket {
  mesh: Mesh;
  data: PointFeature[];
}

const LAYER_COLOR: Record<LayerId, Color3> = Object.fromEntries(
  LAYERS.map((l) => [l.id, Color3.FromHexString(l.color)]),
) as Record<LayerId, Color3>;

/** 薄实例矩阵用单位四元数（Matrix.Compose 的 rotation 不接受 undefined） */
const IDENTITY_QUAT = Quaternion.Identity();

export class CampusEngine {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private data: CampusData;
  private cb: EngineCallbacks;

  private H = MAX_H;
  private tx = 0;
  private tz = 0;

  private layerOn: Record<LayerId, boolean>;
  private filter: PointCategory | 'all' = 'all';
  private highlights = new Set<string>();
  private tool: ToolMode = 'select';

  // 场景对象
  private tallMeshes = new Map<LayerId, Mesh>();
  private flatMeshes = new Map<LayerId, Mesh>();
  private footprintLines!: Mesh;
  private roadMain!: Mesh;
  private roadMinor!: Mesh;
  private pipeMeshes: { mesh: Mesh; tier: 'trunk' | 'branch' }[] = [];
  private buckets = new Map<PointCategory, PointBucket>();
  private haloMesh!: Mesh;
  private measureLine!: Mesh;
  private markMesh!: Mesh;
  private pendingLine!: Mesh;
  private shellPool = new Map<string, Mesh>();
  private shellsUsed = new Set<string>();

  private measure: MeasureSeg[] = [];
  private marks: Mark[] = [];
  private pendingVertex: { x: number; z: number } | null = null;
  private mouseWorld = { x: 0, z: 0 };
  private mouseScreen = { x: 0, y: 0 };

  private downAt: { x: number; y: number; tx: number; tz: number } | null = null;
  private boxStart: { x: number; y: number } | null = null;
  private rafHover = 0;
  private disposed = false;
  private cullSig = '';
  private measureSig = '';
  private markSig = '';

  constructor(canvas: HTMLCanvasElement, data: CampusData, cb: EngineCallbacks, layerOn: Record<LayerId, boolean>) {
    this.data = data;
    this.cb = cb;
    this.layerOn = { ...layerOn };

    this.engine = new Engine(canvas, true, { stencil: true, antialias: true, powerPreference: 'high-performance' });
    this.engine.setHardwareScalingLevel(1);
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0.067, 0.09, 0.13, 1);
    this.scene.skipPointerMovePicking = true;
    this.scene.skipPointerDownPicking = true;
    this.scene.skipPointerUpPicking = true;

    // 正交俯视相机（手动控制平移/缩放，保证缩放锚点与书签视角确定）
    this.camera = new ArcRotateCamera('cam', -Math.PI / 2, 0.0001, 1000, new Vector3(0, 0, 0), this.scene);
    this.camera.mode = 1; // Camera.ORTHOGRAPHIC_CAMERA
    this.camera.inputs.clear();
    this.camera.panningSensibility = 0;
    this.camera.minZ = 1;
    this.camera.maxZ = 2200;
    this.applyCamera();

    this.buildGround();
    this.buildRoads();
    this.buildPipelines();
    this.buildBuildings();
    this.buildPoints();
    this.buildOverlays();
    this.bindEvents(canvas);

    this.engine.runRenderLoop(() => {
      if (this.disposed) return;
      this.frame();
      this.scene.render();
    });
    const ro = new ResizeObserver(() => {
      this.engine.resize();
      this.applyCamera();
    });
    ro.observe(canvas);
    this.scene.onDisposeObservable.add(() => ro.disconnect());
  }

  // ------------------------------------------------------------- 场景搭建
  private unlit(color: Color3 | string, name = 'm') {
    const m = new StandardMaterial(name, this.scene);
    m.disableLighting = true;
    m.emissiveColor = typeof color === 'string' ? Color3.FromHexString(color) : color;
    m.specularColor = Color3.Black();
    return m;
  }

  private buildGround() {
    const g = MeshBuilder.CreateGround('ground', { width: 1400, height: 1000, subdivisions: 1 }, this.scene);
    g.isPickable = false;
    const tex = new DynamicTexture('gridTex', { width: 512, height: 512 }, this.scene, false);
    const ctx = tex.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = '#111826';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#1d2940';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 510, 510);
    ctx.strokeStyle = '#16203333';
    ctx.beginPath();
    ctx.moveTo(256, 0); ctx.lineTo(256, 512);
    ctx.moveTo(0, 256); ctx.lineTo(512, 256);
    ctx.stroke();
    tex.update();
    const m = new StandardMaterial('groundMat', this.scene);
    m.disableLighting = true;
    m.emissiveTexture = tex;
    m.specularColor = Color3.Black();
    g.material = m;

    // 校园用地边界
    const b = this.data.bounds;
    const border = MeshBuilder.CreateLineSystem('border', {
      lines: [[
        new Vector3(b.minX, 0.4, b.minZ), new Vector3(b.maxX, 0.4, b.minZ),
        new Vector3(b.maxX, 0.4, b.maxZ), new Vector3(b.minX, 0.4, b.maxZ),
        new Vector3(b.minX, 0.4, b.minZ),
      ]],
    }, this.scene);
    (border as any).color = Color3.FromHexString('#3d5172');
    border.isPickable = false;
  }

  private flatSegment(x1: number, z1: number, x2: number, z2: number, width: number, color: Color3, y: number): Mesh {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const box = MeshBuilder.CreateBox('seg', { width: len, height: 0.12, depth: width }, this.scene);
    box.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    box.rotation.y = Math.atan2(-(z2 - z1), x2 - x1);
    box.material = this.unlit(color);
    box.isPickable = false;
    return box;
  }

  private buildRoads() {
    const main: Mesh[] = [];
    const minor: Mesh[] = [];
    for (const r of this.data.roads) {
      const color = Color3.FromHexString(r.width >= 18 ? '#46536a' : '#33405a');
      const mesh = this.flatSegment(r.x1, r.z1, r.x2, r.z2, r.width, color, 0.08);
      (r.width >= 18 ? main : minor).push(mesh);
    }
    this.roadMain = Mesh.MergeMeshes(main, true, true, undefined, false, true)!;
    this.roadMinor = Mesh.MergeMeshes(minor, true, true, undefined, false, true)!;
    this.roadMain.name = 'roadMain';
    this.roadMinor.name = 'roadMinor';
  }

  private buildPipelines() {
    const kinds = [...new Set(this.data.pipelines.map((p) => p.name))];
    const palette = ['#34c8b0', '#4dd0e1', '#7e9bff', '#ffca28', '#ce93d8'];
    for (let ki = 0; ki < kinds.length; ki++) {
      const kind = kinds[ki];
      const color = Color3.FromHexString(palette[ki % palette.length]);
      const mat = this.unlit(color);
      const trunk: Mesh[] = [];
      const branch: Mesh[] = [];
      for (const p of this.data.pipelines) {
        if (p.name !== kind) continue;
        const mesh = this.flatSegment(
          p.x1, p.z1, p.x2, p.z2,
          Math.max(0.5, p.diameter / 90), color, 0.25,
        );
        mesh.material = mat;
        (p.trunk ? trunk : branch).push(mesh);
      }
      const t = Mesh.MergeMeshes(trunk, true, true, undefined, false, true)!;
      const bm = Mesh.MergeMeshes(branch, true, true, undefined, false, true)!;
      t.name = 'pipe-trunk-' + ki;
      bm.name = 'pipe-branch-' + ki;
      this.pipeMeshes.push({ mesh: t, tier: 'trunk' }, { mesh: bm, tier: 'branch' });
    }
  }

  private buildBuildings() {
    // 每图层一组薄实例：高模（近景）+ 扁平 footprint（总图）
    for (const layer of ['building', 'dorm', 'canteen'] as LayerId[]) {
      const list = this.data.buildings.filter((b) => b.layer === layer);
      const color = LAYER_COLOR[layer];

      const tall = MeshBuilder.CreateBox('tall-' + layer, { size: 1 }, this.scene);
      tall.material = this.unlit(color);
      tall.isPickable = false;
      const tallMat: Matrix[] = list.map((b) =>
        Matrix.Compose(new Vector3(b.w, b.height, b.d), IDENTITY_QUAT, new Vector3(b.x, b.height / 2, b.z)));
      tall.thinInstanceSetBuffer('matrix', this.matBuffer(tallMat), 16, true);
      tall.thinInstanceCount = list.length;
      this.tallMeshes.set(layer, tall);

      const flat = MeshBuilder.CreateBox('flat-' + layer, { size: 1 }, this.scene);
      const fc = color.clone().scale(0.55);
      flat.material = this.unlit(fc);
      flat.isPickable = false;
      const flatMat: Matrix[] = list.map((b) =>
        Matrix.Compose(new Vector3(b.w, 0.6, b.d), IDENTITY_QUAT, new Vector3(b.x, 0.3, b.z)));
      flat.thinInstanceSetBuffer('matrix', this.matBuffer(flatMat), 16, true);
      flat.thinInstanceCount = list.length;
      this.flatMeshes.set(layer, flat);
    }

    // 楼栋轮廓线（总图级唯一保留的楼栋信息）
    const lines: Vector3[][] = [];
    for (const b of this.data.buildings) {
      const x0 = b.x - b.w / 2, x1 = b.x + b.w / 2;
      const z0 = b.z - b.d / 2, z1 = b.z + b.d / 2;
      const y = 0.65;
      lines.push([
        new Vector3(x0, y, z0), new Vector3(x1, y, z0), new Vector3(x1, y, z1),
        new Vector3(x0, y, z1), new Vector3(x0, y, z0),
      ]);
    }
    this.footprintLines = MeshBuilder.CreateLineSystem('footprints', { lines }, this.scene);
    (this.footprintLines as any).color = Color3.FromHexString('#9db4d8');
    this.footprintLines.isPickable = false;
  }

  private buildPoints() {
    const mkGeo = (cat: PointCategory): Mesh => {
      switch (cat) {
        case 'hydrant':
          return MeshBuilder.CreateCylinder(cat, { height: 2.4, diameter: 1.5 }, this.scene);
        case 'manhole':
          return MeshBuilder.CreateCylinder(cat, { height: 0.5, diameter: 2.6 }, this.scene);
        case 'valve':
          return MeshBuilder.CreateSphere(cat, { diameter: 2.2, segments: 8 }, this.scene);
        case 'light':
          return MeshBuilder.CreateSphere(cat, { diameter: 1.6, segments: 6 }, this.scene);
        case 'camera':
          return MeshBuilder.CreateBox(cat, { size: 2 }, this.scene);
        case 'powerbox':
          return MeshBuilder.CreateBox(cat, { width: 2.2, height: 1.4, depth: 1.6 }, this.scene);
        default:
          return MeshBuilder.CreateBox(cat, { size: 1.4 }, this.scene);
      }
    };
    for (const meta of Object.values(CATEGORY_BY_ID)) {
      const mesh = mkGeo(meta.id);
      mesh.material = this.unlit(meta.color);
      mesh.isPickable = false;
      mesh.alwaysSelectAsActiveMesh = true; // 跳过引擎自身视锥判定，由我们按网格裁剪
      mesh.setEnabled(false);
      this.buckets.set(meta.id, { mesh, data: [] });
    }

    // 高亮光环（薄实例，按高亮点位实时更新）
    this.haloMesh = MeshBuilder.CreateTorus('halo', { diameter: 4.2, thickness: 0.5, tessellation: 18 }, this.scene);
    this.haloMesh.rotation.x = Math.PI / 2; // 平放到地面（默认在 XY 立面，俯视会成一条线）
    this.haloMesh.material = this.unlit('#00e5ff');
    this.haloMesh.isPickable = false;
    this.haloMesh.alwaysSelectAsActiveMesh = true;
    this.haloMesh.setEnabled(false);
  }

  private lineSystem(name: string, lines: Vector3[][], color: string): Mesh {
    // Babylon 对空 lines 会断言失败，无数据时给一条退化线占位
    const safe = lines.length ? lines : [[Vector3.Zero(), Vector3.Zero()]];
    const m = MeshBuilder.CreateLineSystem(name, { lines: safe }, this.scene);
    (m as any).color = Color3.FromHexString(color);
    m.isPickable = false;
    return m;
  }

  private buildOverlays() {
    this.measureLine = this.lineSystem('measure', [], '#ffd54f');
    this.pendingLine = this.lineSystem('pending', [], '#c9a842');

    this.markMesh = MeshBuilder.CreateCylinder('marks', { height: 3, diameterTop: 0, diameterBottom: 1.6, tessellation: 8 }, this.scene);
    this.markMesh.material = this.unlit('#ff7043');
    this.markMesh.isPickable = false;
    this.markMesh.alwaysSelectAsActiveMesh = true;
    this.markMesh.setEnabled(false);
  }

  private matBuffer(mats: Matrix[]): Float32Array {
    const out = new Float32Array(mats.length * 16);
    mats.forEach((m, i) => m.copyToArray(out, i * 16));
    return out;
  }

  // ------------------------------------------------------------- 输入
  private bindEvents(canvas: HTMLCanvasElement) {
    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      this.mouseScreen = { x: e.offsetX, y: e.offsetY };
      this.mouseWorld = this.worldAt(e.offsetX, e.offsetY);
      this.downAt = { x: e.offsetX, y: e.offsetY, tx: this.tx, tz: this.tz };
      if (this.tool === 'box') {
        this.boxStart = { x: e.offsetX, y: e.offsetY };
      }
    };
    const onMove = (e: PointerEvent) => {
      this.mouseScreen = { x: e.offsetX, y: e.offsetY };
      this.mouseWorld = this.worldAt(e.offsetX, e.offsetY);

      if (this.boxStart) {
        this.cb.onBoxRect?.({
          x0: this.boxStart.x, y0: this.boxStart.y, x1: e.offsetX, y1: e.offsetY,
        });
      } else if (this.downAt && e.buttons === 1 && this.tool !== 'box') {
        const s = this.meterPerPixel();
        this.tx = this.downAt.tx - (e.offsetX - this.downAt.x) * s;
        this.tz = this.downAt.tz - (e.offsetY - this.downAt.y) * s;
        this.clampTarget();
        this.applyCamera();
      }
      if (!this.rafHover) {
        this.rafHover = requestAnimationFrame(() => {
          this.rafHover = 0;
          this.doHover();
          if (this.pendingVertex) this.rebuildPending();
        });
      }
    };
    const onUp = (e: PointerEvent) => {
      const d = this.downAt;
      const dragged = d ? Math.hypot(e.offsetX - d.x, e.offsetY - d.y) > 5 : false;
      try { canvas.releasePointerCapture(e.pointerId); } catch { /* noop */ }

      if (this.tool === 'box' && this.boxStart) {
        this.finishBoxSelect();
        this.boxStart = null;
        this.cb.onBoxRect?.(null);
      } else if (!dragged && d && e.button === 0) {
        this.handleClick(e);
      }
      this.downAt = null;
    };
    const onDbl = () => {
      if (this.tool === 'measure') {
        let dropLast = false;
        const last = this.measure[this.measure.length - 1];
        if (last && last.len < 0.5) {
          this.measure.pop();
          dropLast = true;
        }
        this.measureSig = this.measure.map((s) => s.x1 + ',' + s.z1 + '>' + s.x2 + ',' + s.z2).join('|');
        this.pendingVertex = null;
        this.rebuildPending();
        this.rebuildMeasure();
        this.cb.onMeasureDouble?.(dropLast);
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const before = this.worldAt(e.offsetX, e.offsetY);
      const factor = Math.exp(e.deltaY * 0.0012);
      this.H = Scalar.Clamp(this.H * factor, MIN_H, MAX_H);
      // 以光标为锚点缩放
      const after = this.worldAt(e.offsetX, e.offsetY);
      this.tx += before.x - after.x;
      this.tz += before.z - after.z;
      this.clampTarget();
      this.applyCamera();
    };
    const onCtx = (e: Event) => {
      if (this.tool === 'measure') {
        e.preventDefault();
        this.pendingVertex = null;
        this.rebuildPending();
      }
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('dblclick', onDbl);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', onCtx);
    this.scene.onDisposeObservable.add(() => {
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('dblclick', onDbl);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('contextmenu', onCtx);
    });
  }

  private handleClick(e: PointerEvent) {
    const w = this.worldAt(e.offsetX, e.offsetY);
    if (this.tool === 'measure') {
      if (this.pendingVertex) {
        const len = Math.hypot(w.x - this.pendingVertex.x, w.z - this.pendingVertex.z);
        const seg = { x1: this.pendingVertex.x, z1: this.pendingVertex.z, x2: w.x, z2: w.z, len };
        this.measure.push(seg);
        this.measureSig = this.measure.map((s) => s.x1 + ',' + s.z1 + '>' + s.x2 + ',' + s.z2).join('|');
        this.cb.onMeasureSeg?.(seg);
        this.rebuildMeasure();
      }
      this.pendingVertex = { x: w.x, z: w.z };
      this.rebuildPending();
      return;
    }
    if (this.tool === 'mark') {
      this.cb.onMarkPick?.(w.x, w.z, e.offsetX, e.offsetY);
      return;
    }
    // 点选：网格候选 + 楼栋/管线命中，按叠放次序穿透取最上层
    const hit = this.pickAt(w.x, w.z);
    this.cb.onPick?.(hit);
  }

  private pickAt(x: number, z: number): AnyFeature | null {
    const tol = Math.max(4, this.meterPerPixel() * 11);
    type Cand = { f: AnyFeature; rank: number };
    const cands: Cand[] = [];

    // 点位（空间网格）
    for (const p of this.data.grid.query(x - tol, z - tol, x + tol, z + tol)) {
      if (!this.isPointVisible(p)) continue;
      if (Math.hypot(p.x - x, p.z - z) > tol) continue;
      cands.push({ f: p, rank: CATEGORY_BY_ID[p.category].pickOrder });
    }
    // 楼栋
    for (const b of this.data.buildings) {
      if (!this.layerOn[b.layer]) continue;
      if (Math.abs(x - b.x) <= b.w / 2 + tol && Math.abs(z - b.z) <= b.d / 2 + tol) {
        cands.push({ f: b, rank: 10 });
      }
    }
    // 管线 / 道路
    const pipeTier = this.H <= LOD.street;
    if (this.layerOn.pipeline && this.H <= LOD.district) {
      for (const p of this.data.pipelines) {
        if (p.trunk === false && !pipeTier) continue;
        if (this.distToSeg(x, z, p.x1, p.z1, p.x2, p.z2) <= 1.6 + tol * 0.3) {
          cands.push({ f: p, rank: 20 });
          break;
        }
      }
    }
    if (this.layerOn.road) {
      for (const r of this.data.roads) {
        if (this.distToSeg(x, z, r.x1, r.z1, r.x2, r.z2) <= r.width / 2 + tol * 0.3) {
          cands.push({ f: r, rank: 5 });
          break;
        }
      }
    }
    if (!cands.length) return null;
    cands.sort((a, b) => b.rank - a.rank);
    return cands[0].f;
  }

  private doHover() {
    if (this.tool === 'box') return;
    const hit = this.pickAt(this.mouseWorld.x, this.mouseWorld.z);
    this.cb.onHover?.(hit, this.mouseScreen.x, this.mouseScreen.y);
  }

  private finishBoxSelect() {
    const rect = this.lastBoxRect;
    if (!rect) return;
    const w0 = this.worldAt(Math.min(rect.x0, rect.x1), Math.min(rect.y0, rect.y1));
    const w1 = this.worldAt(Math.max(rect.x0, rect.x1), Math.max(rect.y0, rect.y1));
    const ids = new Set<string>();
    for (const p of this.data.grid.query(w0.x, w0.z, w1.x, w1.z)) {
      if (!this.isPointVisible(p)) continue;
      if (p.x >= w0.x && p.x <= w1.x && p.z >= w0.z && p.z <= w1.z) ids.add(p.id);
    }
    for (const b of this.data.buildings) {
      if (!this.layerOn[b.layer]) continue;
      if (b.x + b.w / 2 >= w0.x && b.x - b.w / 2 <= w1.x && b.z + b.d / 2 >= w0.z && b.z - b.d / 2 <= w1.z) {
        ids.add(b.id);
      }
    }
    this.boxSelectCallback?.(ids);
  }
  private lastBoxRect: BoxRect | null = null;
  private boxSelectCallback?: (ids: Set<string>) => void;
  public onBoxSelect(cb: (ids: Set<string>) => void) {
    this.boxSelectCallback = cb;
  }

  // ------------------------------------------------------------- 每帧
  private frame() {
    this.applyLod();
    this.cullPoints();
    this.updateHalo();
    this.syncShells();
  }

  private applyLod() {
    const H = this.H;
    const outlineOnly = H > LOD.outline;
    // 楼栋：总图级只留扁平块 + 轮廓线
    for (const [layer, tall] of this.tallMeshes) {
      tall.setEnabled(!outlineOnly && this.layerOn[layer]);
      this.flatMeshes.get(layer)!.setEnabled(this.layerOn[layer]);
    }
    this.footprintLines.setEnabled(outlineOnly);
    // 道路：总图级只留主干道
    this.roadMain.setEnabled(this.layerOn.road);
    this.roadMinor.setEnabled(this.layerOn.road && H <= LOD.outline);
    // 管线：分区级显主管，街区级显支管
    for (const { mesh, tier } of this.pipeMeshes) {
      mesh.setEnabled(this.layerOn.pipeline && (tier === 'trunk' ? H <= LOD.district : H <= LOD.street));
    }
  }

  private isPointVisible(p: PointFeature): boolean {
    const meta = CATEGORY_BY_ID[p.category];
    if (!this.layerOn[p.layer]) return false;
    if (this.filter !== 'all' && p.category !== this.filter) return false;
    if (this.H > meta.maxH) return false;
    return true;
  }

  private cullPoints() {
    const canvas = this.engine.getRenderingCanvas();
    if (!canvas) return;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    // 签名缓存：视口/过滤/图层未变化时跳过重算，静态帧零分配
    const layerBits = (Object.keys(this.layerOn) as LayerId[]).map((k) => (this.layerOn[k] ? 1 : 0)).join('');
    const sig = [
      Math.round(this.H), Math.round(this.tx / 4), Math.round(this.tz / 4),
      w, h, this.filter, layerBits,
    ].join('|');
    if (sig === this.cullSig) return;
    this.cullSig = sig;

    const c0 = this.worldAt(0, 0);
    const c1 = this.worldAt(w, h);
    // 点要素保持近似恒定屏幕尺寸：世界半径与视口高度 H 成正比，并封顶防止总图级过大
    const radius = Scalar.Clamp(this.H / 38, 1.1, 4.2);
    const byCat = new Map<PointCategory, PointFeature[]>();
    // 仅遍历视口覆盖的网格格子 —— 视口外要素不进实例缓冲，直接裁掉
    const candidates = this.data.grid.query(c0.x, c0.z, c1.x, c1.z);
    for (const p of candidates) {
      if (!this.isPointVisible(p)) continue;
      if (p.x < c0.x || p.x > c1.x || p.z < c0.z || p.z > c1.z) continue;
      const arr = byCat.get(p.category);
      if (arr) arr.push(p);
      else byCat.set(p.category, [p]);
    }
    for (const [cat, bucket] of this.buckets) {
      const list = byCat.get(cat) || [];
      bucket.data = list;
      if (!list.length) {
        bucket.mesh.setEnabled(false);
        continue;
      }
      const r = radius * (cat === 'hydrant' ? 1.15 : cat === 'light' || cat === 'manhole' ? 0.9 : 1);
      const mats = new Float32Array(list.length * 16);
      const m = Matrix.Compose(new Vector3(r, r, r), IDENTITY_QUAT, Vector3.Zero());
      const arr = m.m as unknown as number[];
      list.forEach((p, i) => {
        arr[12] = p.x;
        arr[13] = cat === 'manhole' ? 0.4 : 1.4;
        arr[14] = p.z;
        m.copyToArray(mats, i * 16);
      });
      bucket.mesh.thinInstanceSetBuffer('matrix', mats, 16, false);
      bucket.mesh.thinInstanceCount = list.length;
      bucket.mesh.setEnabled(true);
    }
  }

  private updateHalo() {
    const ids: { p: PointFeature; color: Color3 }[] = [];
    for (const bucket of this.buckets.values()) {
      for (const p of bucket.data) {
        if (this.highlights.has(p.id)) {
          ids.push({ p, color: Color3.FromHexString('#00e5ff') });
        }
      }
    }
    if (!ids.length) {
      this.haloMesh.setEnabled(false);
      return;
    }
    // 光环跟随点半径缩放（基础几何直径 4.2，半径 2.1，scale=点半径/2.1）
    const base = Scalar.Clamp(this.H / 38, 1.1, 4.2) / 2.1;
    const pulse = base * (1 + 0.18 * Math.sin(performance.now() / 280));
    const mats = new Float32Array(ids.length * 16);
    const cols = new Float32Array(ids.length * 4);
    const m = Matrix.Compose(new Vector3(pulse, pulse, pulse), IDENTITY_QUAT, Vector3.Zero());
    const arr = m.m as unknown as number[];
    ids.forEach(({ p, color }, i) => {
      arr[12] = p.x;
      arr[13] = 0.6;
      arr[14] = p.z;
      m.copyToArray(mats, i * 16);
      cols.set([color.r, color.g, color.b, 1], i * 4);
    });
    this.haloMesh.thinInstanceSetBuffer('matrix', mats, 16, false);
    this.haloMesh.thinInstanceSetBuffer('color', cols, 4, false);
    this.haloMesh.thinInstanceCount = ids.length;
    this.haloMesh.setEnabled(true);
  }

  /** 楼栋/管线高亮壳（薄实例不支持 HighlightLayer，用壳 Mesh 池） */
  private syncShells() {
    this.shellsUsed.clear();
    for (const id of this.highlights) {
      const f = this.data.featureById.get(id);
      if (!f || f.type !== 'building') continue;
      this.shellsUsed.add(id);
      let shell = this.shellPool.get(id);
      if (!shell) {
        shell = MeshBuilder.CreateBox('shell-' + id, { size: 1 }, this.scene);
        shell.material = this.unlit('#00e5ff');
        (shell.material as StandardMaterial).alpha = 0.32;
        shell.isPickable = false;
        this.shellPool.set(id, shell);
      }
      const b = f as BuildingFeature;
      const k = 1.06 + 0.02 * Math.sin(performance.now() / 300);
      const outlineOnly = this.H > LOD.outline;
      if (outlineOnly) {
        // 总图层级楼栋是扁平块，壳也压成扁平板贴在地面
        shell.scaling.set(b.w * k, 1, b.d * k);
        shell.position.set(b.x, 0.35, b.z);
      } else {
        shell.scaling.set(b.w * k, b.height * k, b.d * k);
        shell.position.set(b.x, b.height / 2, b.z);
      }
      shell.setEnabled(true);
    }
    for (const [id, mesh] of this.shellPool) {
      if (!this.shellsUsed.has(id)) mesh.setEnabled(false);
    }
  }

  private rebuildMeasure() {
    this.measureLine.dispose();
    const lines = this.measure.map((s) => [
      new Vector3(s.x1, 0.8, s.z1), new Vector3(s.x2, 0.8, s.z2),
    ]);
    this.measureLine = this.lineSystem('measure', lines, '#ffd54f');
  }

  private rebuildPending() {
    this.pendingLine.dispose();
    const lines: Vector3[][] = [];
    if (this.pendingVertex) {
      lines.push([
        new Vector3(this.pendingVertex.x, 0.8, this.pendingVertex.z),
        new Vector3(this.mouseWorld.x, 0.8, this.mouseWorld.z),
      ]);
    }
    this.pendingLine = this.lineSystem('pending', lines, '#c9a842');
  }

  private rebuildMarks() {
    if (!this.marks.length) {
      this.markMesh.setEnabled(false);
      return;
    }
    const mats = new Float32Array(this.marks.length * 16);
    const m = Matrix.Identity();
    this.marks.forEach((mk, i) => {
      Matrix.ComposeToRef(new Vector3(1, 1, 1), IDENTITY_QUAT, new Vector3(mk.x, 1.5, mk.z), m);
      m.copyToArray(mats, i * 16);
    });
    this.markMesh.thinInstanceSetBuffer('matrix', mats, 16, false);
    this.markMesh.thinInstanceCount = this.marks.length;
    this.markMesh.setEnabled(true);
  }

  // ------------------------------------------------------------- 坐标换算
  private meterPerPixel() {
    const c = this.engine.getRenderingCanvas()!;
    return this.H / c.clientHeight;
  }

  /** 当前画布 CSS 像素尺寸（供比例尺/鹰眼使用） */
  canvasSize(): { w: number; h: number } {
    const c = this.engine.getRenderingCanvas();
    return { w: c ? c.clientWidth : 0, h: c ? c.clientHeight : 0 };
  }

  worldAt(px: number, py: number) {
    const canvas = this.engine.getRenderingCanvas()!;
    const s = this.H / canvas.clientHeight;
    return {
      x: this.tx + (px - canvas.clientWidth / 2) * s,
      z: this.tz + (py - canvas.clientHeight / 2) * s,
    };
  }

  screenOf(x: number, z: number) {
    const canvas = this.engine.getRenderingCanvas()!;
    const s = this.H / canvas.clientHeight;
    return {
      x: (x - this.tx) / s + canvas.clientWidth / 2,
      y: (z - this.tz) / s + canvas.clientHeight / 2,
    };
  }

  private applyCamera() {
    const canvas = this.engine.getRenderingCanvas();
    const aspect = canvas ? canvas.clientWidth / Math.max(1, canvas.clientHeight) : 1.6;
    this.camera.orthoTop = this.H / 2;
    this.camera.orthoBottom = -this.H / 2;
    this.camera.orthoLeft = (-this.H * aspect) / 2;
    this.camera.orthoRight = (this.H * aspect) / 2;
    this.camera.setTarget(new Vector3(this.tx, 0, this.tz));
    this.camera.alpha = -Math.PI / 2;
    this.camera.beta = 0.0001;
    this.camera.radius = 1000;
  }

  private clampTarget() {
    const b = this.data.bounds;
    this.tx = Scalar.Clamp(this.tx, b.minX - 100, b.maxX + 100);
    this.tz = Scalar.Clamp(this.tz, b.minZ - 100, b.maxZ + 100);
  }

  private distToSeg(px: number, pz: number, x1: number, z1: number, x2: number, z2: number) {
    const dx = x2 - x1, dz = z2 - z1;
    const l2 = dx * dx + dz * dz || 1;
    let t = ((px - x1) * dx + (pz - z1) * dz) / l2;
    t = Scalar.Clamp(t, 0, 1);
    return Math.hypot(px - (x1 + t * dx), pz - (z1 + t * dz));
  }

  // ------------------------------------------------------------- 对外 API
  setLayerOn(rec: Record<LayerId, boolean>) {
    this.layerOn = { ...rec };
  }
  setCategoryFilter(c: PointCategory | 'all') {
    this.filter = c;
  }
  setTool(t: ToolMode) {
    this.tool = t;
    if (t !== 'measure') {
      this.pendingVertex = null;
      this.rebuildPending();
    }
  }
  setHighlights(set: Set<string>) {
    this.highlights = set;
  }
  setBoxRect(r: BoxRect | null) {
    this.lastBoxRect = r;
  }
  setMeasure(segs: MeasureSeg[]) {
    const sig = segs.map((s) => s.x1 + ',' + s.z1 + '>' + s.x2 + ',' + s.z2).join('|');
    if (sig === this.measureSig) return; // 引擎内部点击已构建过，跳过回灌
    this.measureSig = sig;
    this.measure = segs.slice();
    this.rebuildMeasure();
  }
  setMarks(list: Mark[]) {
    const sig = list.map((m) => m.id).join('|');
    if (sig === this.markSig) return;
    this.markSig = sig;
    this.marks = list.slice();
    this.rebuildMarks();
  }
  getView(): ViewState {
    return { targetX: this.tx, targetZ: this.tz, height: this.H };
  }
  setView(v: ViewState) {
    this.tx = v.targetX;
    this.tz = v.targetZ;
    this.H = Scalar.Clamp(v.height, MIN_H, MAX_H);
    this.clampTarget();
    this.applyCamera();
  }
  zoomBy(factor: number) {
    this.H = Scalar.Clamp(this.H * factor, MIN_H, MAX_H);
    this.applyCamera();
  }

  dispose() {
    this.disposed = true;
    this.scene.dispose();
    this.engine.dispose();
  }
}
