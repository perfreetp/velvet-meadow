import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import type { BoundaryLine, TerrainMeshData, Vec2 } from '../types';
import { LINE_ALERT, LINE_NORMAL, buildVertexColors } from '../core/geometry/color';
import { v2 } from '../core/geometry/spline';
import { sampleTerrainZ } from '../core/geometry/terrain';
import { workbench, type LineId, type ToolMode } from '../core/state/workbench';

const LINE_IDS: LineId[] = ['center', 'crest-left', 'crest-right'];
const LINE_TINT: Record<LineId, number> = {
  center: 0x38bdf8,
  'crest-left': 0xfbbf24,
  'crest-right': 0x34d399
};

interface PickablePoint {
  lineId: LineId;
  index: number;
  mesh: THREE.Mesh;
}

export interface ScenePickInfo {
  lineId: LineId;
  index: number;
  world: Vec2;
}

/**
 * three.js 场景主控：地形曲面、样条线（Line2 + 顶点色预警）、
 * 控制点拖拽、横断面、堤坡选段。
 */
export class RiverScene {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private container: HTMLElement;

  private terrainMesh: THREE.Mesh | null = null;
  private terrainData: TerrainMeshData | null = null;
  private lineObjs = new Map<LineId, Line2>();
  private lineMats = new Map<LineId, LineMaterial>();
  private boundaryGroup = new THREE.Group();
  private offsetGroup = new THREE.Group();
  private pointGroup = new THREE.Group();
  private sectionGroup = new THREE.Group();
  private slopeGroup = new THREE.Group();
  private pickables: PickablePoint[] = [];
  private elevMarkers: THREE.Points | null = null;

  private dragging: PickablePoint | null = null;
  private dragPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  private sectionFirst: Vec2 | null = null;
  private slopeFirstIdx: number | null = null;
  private slopeLineId: LineId | null = null;
  private hoverMarker: THREE.Mesh | null = null;
  private zScale = 3;

  onSectionDrawn: ((a: Vec2, b: Vec2) => void) | null = null;
  onSlopePicked: ((lineId: LineId, a: number, b: number) => void) | null = null;
  onHoverStation: ((info: { lineId: LineId; s: number; kappa: number; radius: number } | null) => void) | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x0f1622, 1);
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.5, 20000);
    this.camera.position.set(600, -900, 750);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.495;

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.4));
    const dir = new THREE.DirectionalLight(0xffffff, 1.2);
    dir.position.set(400, -500, 900);
    this.scene.add(dir);
    const grid = new THREE.GridHelper(4000, 40, 0x2a3a52, 0x1c2738);
    grid.position.z = -2;
    this.scene.add(grid);

    this.scene.add(this.boundaryGroup, this.offsetGroup, this.pointGroup, this.sectionGroup, this.slopeGroup);

    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);
    el.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('resize', this.onResize);

    this.animate();
  }

  get zExaggeration(): number {
    return this.zScale;
  }

  setZExaggeration(z: number): void {
    this.zScale = z;
    this.rebuildTerrain();
    this.rebuildAllLines();
    this.rebuildBoundaries();
  }

  dispose(): void {
    const el = this.renderer.domElement;
    el.removeEventListener('pointerdown', this.onPointerDown);
    el.removeEventListener('pointermove', this.onPointerMove);
    el.removeEventListener('pointerup', this.onPointerUp);
    el.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('resize', this.onResize);
    this.controls.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private onResize = (): void => {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    for (const m of this.lineMats.values()) m.resolution.set(w, h);
  };

  private animate = (): void => {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // —— 坐标换算 ——
  private toWorld(p: Vec2, z = 0): THREE.Vector3 {
    return new THREE.Vector3(p.x, p.y, z * this.zScale);
  }

  private terrainZAt(p: Vec2): number {
    if (!this.terrainData) return 0;
    const z = sampleTerrainZ(this.terrainData, p.x, p.y);
    return Number.isFinite(z) ? z : this.terrainData.minZ;
  }

  // —— 地形 ——
  setTerrain(data: TerrainMeshData | null): void {
    this.terrainData = data;
    this.rebuildTerrain();
  }

  private rebuildTerrain(): void {
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
      this.terrainMesh = null;
    }
    if (this.elevMarkers) {
      this.scene.remove(this.elevMarkers);
      this.elevMarkers.geometry.dispose();
      (this.elevMarkers.material as THREE.Material).dispose();
      this.elevMarkers = null;
    }
    const data = this.terrainData;
    const file = workbench.file;
    if (!data || !file) return;

    const { cols, rows, origin, spacing, valid, heights } = data;
    const positions: number[] = [];
    const colors = buildVertexColors(data, file.settings.colorMode);
    const index: number[] = [];
    const idxMap = new Int32Array(cols * rows).fill(-1);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!valid[i]) continue;
        idxMap[i] = positions.length / 3;
        positions.push(origin.x + c * spacing, origin.y + r * spacing, heights[i] * this.zScale);
      }
    }
    const vertColors: number[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (!valid[i]) continue;
        vertColors.push(colors[i * 3] / 255, colors[i * 3 + 1] / 255, colors[i * 3 + 2] / 255);
      }
    }
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = idxMap[r * cols + c];
        const b = idxMap[r * cols + c + 1];
        const d = idxMap[(r + 1) * cols + c];
        const e = idxMap[(r + 1) * cols + c + 1];
        if (a < 0 || b < 0 || d < 0 || e < 0) continue;
        index.push(a, d, b, b, d, e);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(vertColors, 3));
    geo.setIndex(index);
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.name = 'terrain';
    this.scene.add(this.terrainMesh);

    // 高程点注记（小点云）
    const mk: number[] = [];
    for (const p of file.elevPoints) mk.push(p.x, p.y, p.z * this.zScale + 0.6);
    if (mk.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(mk, 3));
      const m = new THREE.PointsMaterial({ color: 0xe2e8f0, size: 2.5, sizeAttenuation: true });
      this.elevMarkers = new THREE.Points(g, m);
      this.scene.add(this.elevMarkers);
    }

    // 相机取景
    const box = new THREE.Box3().setFromObject(this.terrainMesh);
    const center = box.getCenter(new THREE.Vector3());
    this.controls.target.copy(center);
    const size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x, size.y) * 0.9;
    this.camera.position.set(center.x + r * 0.7, center.y - r, center.z + r * 0.8);
    this.controls.update();
  }

  refreshTerrainColors(): void {
    this.rebuildTerrain();
  }

  // —— 样条线 ——
  rebuildAllLines(): void {
    for (const id of LINE_IDS) this.rebuildLine(id);
    this.rebuildControlPoints();
    this.rebuildSlopeHighlight();
  }

  private rebuildLine(id: LineId): void {
    const old = this.lineObjs.get(id);
    if (old) {
      this.scene.remove(old);
      old.geometry.dispose();
      this.lineObjs.delete(id);
    }
    const d = workbench.derivations.get(id);
    if (!d) return;
    const positions: number[] = [];
    const colors: number[] = [];
    for (let i = 0; i < d.points.length; i++) {
      const p = d.points[i];
      const z = this.terrainZAt(p) * this.zScale + 1.2;
      positions.push(p.x, p.y, z);
      const alert = d.alerts[i];
      const base = alert ? LINE_ALERT : LINE_NORMAL;
      // 非活动线降低饱和度
      const dim = id === workbench.activeLine ? 1 : 0.55;
      colors.push((base.r / 255) * dim, (base.g / 255) * dim, (base.b / 255) * dim);
    }
    const geo = new LineGeometry();
    geo.setPositions(positions);
    geo.setColors(colors);
    let mat = this.lineMats.get(id);
    if (!mat) {
      mat = new LineMaterial({
        linewidth: id === 'center' ? 4 : 3,
        vertexColors: true,
        dashed: false,
        worldUnits: false
      });
      mat.resolution.set(this.container.clientWidth, this.container.clientHeight);
      this.lineMats.set(id, mat);
    }
    const line = new Line2(geo, mat);
    line.computeLineDistances();
    line.name = `line-${id}`;
    this.lineObjs.set(id, line);
    this.scene.add(line);
  }

  // —— 控制点 ——
  private rebuildControlPoints(): void {
    for (const p of this.pickables) this.pointGroup.remove(p.mesh);
    this.pickables = [];
    const file = workbench.file;
    if (!file) return;
    for (const id of LINE_IDS) {
      const arr = workbench.controlsOf(id);
      arr.forEach((p, index) => {
        const active = id === workbench.activeLine;
        const geo = new THREE.SphereGeometry(active ? 5 : 3.6, 14, 10);
        const mat = new THREE.MeshBasicMaterial({ color: active ? LINE_TINT[id] : 0x64748b });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(p.x, p.y, this.terrainZAt(p) * this.zScale + 2.5);
        mesh.userData = { lineId: id, index };
        this.pointGroup.add(mesh);
        this.pickables.push({ lineId: id, index, mesh });
      });
    }
  }

  // —— 边界与偏移线 ——
  rebuildBoundaries(): void {
    this.clearGroup(this.boundaryGroup);
    this.clearGroup(this.offsetGroup);
    const file = workbench.file;
    if (!file) return;
    for (const b of file.boundaries) this.addPlainLine(this.boundaryGroup, b, 0x94a3b8, 1.5, true);
    for (const b of file.offsetLines) this.addPlainLine(this.offsetGroup, b, 0xc084fc, 2, false);
  }

  private addPlainLine(group: THREE.Group, b: BoundaryLine, color: number, width: number, onGround: boolean): void {
    const pts = b.closed ? [...b.points, b.points[0]] : b.points;
    const positions: number[] = [];
    for (const p of pts) {
      const z = (onGround ? this.terrainZAt(p) : this.terrainZAt(p)) * this.zScale + 1.6;
      positions.push(p.x, p.y, z);
    }
    const geo = new LineGeometry();
    geo.setPositions(positions);
    const mat = new LineMaterial({ linewidth: width, color, worldUnits: false });
    mat.resolution.set(this.container.clientWidth, this.container.clientHeight);
    const line = new Line2(geo, mat);
    line.computeLineDistances();
    group.add(line);
  }

  // —— 横断面 ——
  showSection(a: Vec2, b: Vec2): void {
    this.clearGroup(this.sectionGroup);
    const mat = new LineMaterial({ linewidth: 3, color: 0xf472b6, worldUnits: false });
    mat.resolution.set(this.container.clientWidth, this.container.clientHeight);
    const geo = new LineGeometry();
    const za = this.terrainZAt(a) * this.zScale + 3;
    const zb = this.terrainZAt(b) * this.zScale + 3;
    geo.setPositions([a.x, a.y, za, b.x, b.y, zb]);
    const line = new Line2(geo, mat);
    this.sectionGroup.add(line);
    for (const p of [a, b]) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(4, 12, 8),
        new THREE.MeshBasicMaterial({ color: 0xf472b6 })
      );
      s.position.set(p.x, p.y, this.terrainZAt(p) * this.zScale + 3);
      this.sectionGroup.add(s);
    }
  }

  clearSection(): void {
    this.clearGroup(this.sectionGroup);
    this.sectionFirst = null;
  }

  // —— 堤坡选段高亮 ——
  rebuildSlopeHighlight(): void {
    this.clearGroup(this.slopeGroup);
    const pick = workbench.slopePick;
    if (!pick) return;
    const d = workbench.derivations.get(pick.lineId);
    if (!d) return;
    const lo = Math.min(pick.startIdx, pick.endIdx);
    const hi = Math.max(pick.startIdx, pick.endIdx);
    const positions: number[] = [];
    for (let i = lo; i <= hi; i++) {
      const p = d.points[i];
      positions.push(p.x, p.y, this.terrainZAt(p) * this.zScale + 2.2);
    }
    const geo = new LineGeometry();
    geo.setPositions(positions);
    const mat = new LineMaterial({ linewidth: 9, color: 0xfb923c, worldUnits: false, transparent: true, opacity: 0.85 });
    mat.resolution.set(this.container.clientWidth, this.container.clientHeight);
    const line = new Line2(geo, mat);
    this.slopeGroup.add(line);
  }

  private clearGroup(g: THREE.Group): void {
    for (const child of [...g.children]) {
      g.remove(child);
      if (child instanceof Line2) {
        child.geometry.dispose();
        (child.material as LineMaterial).dispose();
      } else if (child instanceof THREE.Mesh || child instanceof THREE.Points) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
    }
  }

  // —— 交互 ——
  private updatePointer(e: { clientX: number; clientY: number }): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  private groundPoint(): Vec2 | null {
    const hit = new THREE.Vector3();
    const ok = this.raycaster.ray.intersectPlane(this.dragPlane, hit);
    return ok ? { x: hit.x, y: hit.y } : null;
  }

  private pickPoint(): PickablePoint | null {
    const meshes = this.pickables.map((p) => p.mesh);
    const hits = this.raycaster.intersectObjects(meshes, false);
    if (!hits.length) return null;
    return this.pickables.find((p) => p.mesh === hits[0].object) ?? null;
  }

  private pickDerivationIndex(lineId: LineId): number | null {
    const d = workbench.derivations.get(lineId);
    if (!d) return null;
    const gp = this.groundPoint();
    if (!gp) return null;
    let best = 0;
    let bestD = Infinity;
    d.points.forEach((p, i) => {
      const dd = v2.distSq(p, gp);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    });
    return Math.sqrt(bestD) < 25 ? best : null;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0) return;
    this.updatePointer(e);
    const tool: ToolMode = workbench.tool;

    const picked = this.pickPoint();
    if (picked && (tool === 'select' || tool === 'add-point')) {
      this.dragging = picked;
      this.controls.enabled = false;
      this.renderer.domElement.setPointerCapture(e.pointerId);
      return;
    }

    if (tool === 'add-point') {
      const gp = this.groundPoint();
      if (gp) void workbench.addControlPoint(workbench.activeLine, gp);
      return;
    }

    if (tool === 'section') {
      const gp = this.groundPoint();
      if (!gp) return;
      if (!this.sectionFirst) {
        this.sectionFirst = gp;
      } else {
        this.onSectionDrawn?.(this.sectionFirst, gp);
        this.sectionFirst = null;
      }
      return;
    }

    if (tool === 'pick-slope') {
      const lineId = workbench.activeLine;
      const idx = this.pickDerivationIndex(lineId);
      if (idx === null) return;
      if (this.slopeFirstIdx === null || this.slopeLineId !== lineId) {
        this.slopeFirstIdx = idx;
        this.slopeLineId = lineId;
      } else {
        this.onSlopePicked?.(lineId, this.slopeFirstIdx, idx);
        this.slopeFirstIdx = null;
        this.slopeLineId = null;
      }
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    this.updatePointer(e);
    if (this.dragging) {
      const gp = this.groundPoint();
      if (gp) void workbench.moveControlPoint(this.dragging.lineId, this.dragging.index, gp);
      return;
    }
    // 悬停查询：曲率/半径随鼠标沿线显示
    const gp = this.groundPoint();
    if (gp && workbench.tool === 'select') {
      let best: { lineId: LineId; idx: number; d: number } | null = null;
      for (const id of LINE_IDS) {
        const d = workbench.derivations.get(id);
        if (!d) continue;
        d.points.forEach((p: Vec2, idx: number) => {
          const dd = v2.distSq(p, gp);
          if (best === null || dd < best.d) best = { lineId: id, idx, d: dd };
        });
      }
      const picked2 = best as { lineId: LineId; idx: number; d: number } | null;
      if (picked2 && picked2.d < 30 * 30) {
        const d = workbench.derivations.get(picked2.lineId)!;
        this.onHoverStation?.({
          lineId: picked2.lineId,
          s: d.arcLengths[picked2.idx],
          kappa: d.curvatures[picked2.idx],
          radius: d.radii[picked2.idx]
        });
      } else {
        this.onHoverStation?.(null);
      }
    }
    this.renderer.domElement.style.cursor = this.pickPoint() ? 'grab' : workbench.tool === 'select' ? '' : 'crosshair';
  };

  private onPointerUp = (e: PointerEvent): void => {
    if (this.dragging) {
      this.dragging = null;
      this.controls.enabled = true;
      try {
        this.renderer.domElement.releasePointerCapture(e.pointerId);
      } catch {
        /* 忽略 */
      }
    }
  };

  private onContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    if (workbench.tool !== 'select' && workbench.tool !== 'add-point') return;
    this.updatePointer(e);
    const picked = this.pickPoint();
    if (picked && workbench.controlsOf(picked.lineId).length > 2) {
      void workbench.deleteControlPoint(picked.lineId, picked.index);
    }
  };

  /** 全量刷新（项目切换或数据批量变化后） */
  fullRefresh(): void {
    this.rebuildTerrain();
    this.rebuildAllLines();
    this.rebuildBoundaries();
    this.clearSection();
    this.clearGroup(this.slopeGroup);
  }

  fitView(): void {
    if (!this.terrainMesh) {
      this.camera.position.set(600, -900, 750);
      this.controls.target.set(0, 0, 0);
      this.controls.update();
      return;
    }
    const box = new THREE.Box3().setFromObject(this.terrainMesh);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const r = Math.max(size.x, size.y) * 0.9;
    this.controls.target.copy(center);
    this.camera.position.set(center.x + r * 0.7, center.y - r, center.z + r * 0.8);
    this.controls.update();
  }

  exportPng(): void {
    this.renderer.render(this.scene, this.camera);
    const url = this.renderer.domElement.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workbench.file?.meta.code ?? 'river'}_地形曲面.png`;
    a.click();
  }
}
