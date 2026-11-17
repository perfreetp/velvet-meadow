import { onMount, onCleanup, createEffect, createSignal, Show } from 'solid-js';
import { samplePolygon, shapeBounds } from '../lib/geometry';
// ExtrudePolygon 三角化依赖全局 earcut(Babylon 按需引入不自动打包)
import earcut from 'earcut';
if (typeof globalThis !== 'undefined' && !globalThis.earcut) globalThis.earcut = earcut;

export default function BabylonPreview(props) {
  let hostRef;
  let engine = null;
  let scene = null;
  let meshes = [];
  let arc = null;
  let disposed = false;
  const [webglOk, setWebglOk] = createSignal(true);

  async function init() {
    try {
      const { Engine } = await import('@babylonjs/core/Engines/engine.js');
      const { Scene } = await import('@babylonjs/core/scene.js');
      const { Vector3 } = await import('@babylonjs/core/Maths/math.vector.js');
      const { MeshBuilder } = await import('@babylonjs/core/Meshes/meshBuilder.js');
      const { ArcRotateCamera } = await import('@babylonjs/core/Cameras/arcRotateCamera.js');
      const { HemisphericLight } = await import('@babylonjs/core/Lights/hemisphericLight.js');
      const { DirectionalLight } = await import('@babylonjs/core/Lights/directionalLight.js');
      const { StandardMaterial } = await import('@babylonjs/core/Materials/standardMaterial.js');
      const { Color3, Color4 } = await import('@babylonjs/core/Maths/math.color.js');
      const BAB = { Vector3, MeshBuilder, StandardMaterial, Color3, Color4 };

      engine = new Engine(hostRef, true, { preserveDrawingBuffer: true, stencil: true, antialias: true });
      scene = new Scene(engine);
      scene.clearColor = new Color4(0.98, 0.985, 0.99, 1);

      arc = new ArcRotateCamera('cam', -Math.PI / 2.4, Math.PI / 3.2, 420, new Vector3(210, 0, 150), scene);
      arc.attachControl(hostRef, true);
      arc.wheelPrecision = 30;
      arc.lowerRadiusLimit = 120;
      arc.upperRadiusLimit = 1200;
      arc.minZ = 1;

      new HemisphericLight('hemi', new Vector3(0, 1, 0), scene);
      const dir = new DirectionalLight('dir', new Vector3(-0.4, -0.7, 0.6), scene);
      dir.intensity = 0.7;

      const ground = MeshBuilder.CreateGround('ground', { width: 640, height: 480 }, scene);
      const gmat = new StandardMaterial('gm', scene);
      gmat.diffuseColor = new Color3(0.93, 0.95, 0.92);
      gmat.specularColor = new Color3(0.05, 0.05, 0.05);
      ground.material = gmat;
      ground.position = new Vector3(210, -6, 150);

      window.__fvsBab = { BAB, scene };
      rebuild();

      engine.runRenderLoop(() => {
        if (!disposed) scene.render();
      });
      const onResize = () => engine.resize();
      window.addEventListener('resize', onResize);
      hostRef._onResize = onResize;
      setWebglOk(true);
    } catch (err) {
      console.warn('Babylon 3D 预览初始化失败(当前环境可能不支持 WebGL):', err);
      setWebglOk(false);
    }
  }

  function rebuild() {
    if (!window.__fvsBab) return;
    const { BAB, scene: sc } = window.__fvsBab;
    for (const m of meshes) {
      m.dispose();
      if (m.material) m.material.dispose();
    }
    meshes = [];
    const shapes = (props.shapes || []).filter((s) => s.visible !== false);
    for (const s of shapes) {
      const poly = samplePolygon(s, 3);
      if (poly.length < 3) continue;
      // Canvas y 向下;Babylon 地面平面 XZ,厚度沿 Y
      const contour = poly.map((p) => new BAB.Vector3(p.x, 0, p.y));
      const depth = s.type === 'leaf' ? 2.2 : 1.4;
      let mesh;
      try {
        mesh = BAB.MeshBuilder.ExtrudePolygon(s.id, { shape: contour, depth, wrap: true }, sc);
      } catch (err) {
        console.warn('拉伸图元失败:', s.name, err?.message || err);
        continue; // 自交等退化数据跳过
      }
      mesh.position.y = -depth / 2;
      const mat = new BAB.StandardMaterial(`m_${s.id}`, sc);
      const c = hexToColor(s.fill || '#88a', BAB.Color3);
      mat.diffuseColor = c;
      mat.specularColor = new BAB.Color3(0.12, 0.12, 0.12);
      mat.alpha = 0.92;
      mesh.material = mat;
      const b = shapeBounds(s);
      mesh.metadata = { name: s.name, code: s.materialCode, w: b.width, h: b.height };
      meshes.push(mesh);
    }
  }

  createEffect(() => {
    // shapes 为响应式引用,任意编辑都会触发重建
    const n = props.shapes?.length;
    void n;
    const sig = JSON.stringify((props.shapes || []).map((s) => [s.id, s.points.length, s.fill, s.visible]));
    void sig;
    rebuild();
  });

  function hexToColor(hex, Color3) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16) / 255;
    const g = parseInt(h.slice(2, 4), 16) / 255;
    const b = parseInt(h.slice(4, 6), 16) / 255;
    return new Color3(r, g, b);
  }

  function resetCamera() {
    if (!arc) return;
    arc.alpha = -Math.PI / 2.4;
    arc.beta = Math.PI / 3.2;
    arc.radius = 420;
  }
  function autoSpin() {
    if (!arc) return;
    arc.alpha += 0.25;
  }

  onMount(init);
  onCleanup(() => {
    disposed = true;
    if (hostRef?._onResize) window.removeEventListener('resize', hostRef._onResize);
    if (engine) engine.stopRenderLoop();
    if (scene) scene.dispose();
    if (engine) engine.dispose();
    delete window.__fvsBab;
  });

  return (
    <div class="babylon-host">
      <div class="babylon-title">三维花束预览 · 拖拽旋转 / 滚轮缩放</div>
      <Show when={webglOk()} fallback={
        <div style={{ padding: '40px 18px', 'text-align': 'center', color: 'var(--muted)', 'font-size': '12px' }}>
          当前环境不支持 WebGL,三维预览不可用<br />主编辑区功能不受影响
        </div>
      }>
        <canvas ref={hostRef} class="babylon-canvas" />
      </Show>
      <div class="babylon-actions">
        <button onClick={resetCamera}>复位视角</button>
        <button onClick={autoSpin}>旋转 90°</button>
      </div>
    </div>
  );
}
