import { Application, Container, Graphics, Texture, Sprite, Text } from 'pixi.js';
import { LIGHT_DEFAULTS } from '../engine/scene.js';
import { kelvinToRGB } from '../engine/color.js';

const LIGHT_COLORS = {
  street: 0xffd27a,
  courtyard: 0xffc46b,
  wallwash: 0xff9d5c,
};

export class PixiStage {
  constructor(canvas, hooks) {
    this.canvas = canvas;
    this.hooks = hooks; // { getState, onPick, onPlace, onDrag, onVertexDrag, onCanvasClick, onAnnotate }
    this.app = null;
    this.view = new Container(); // 世界容器
    this.layer = {};
    this.scale = 4; // 1m = 4px
    this.cam = { x: 0, y: 0 };
    this.drag = null;
    this.hover = null;
    this.displayTexture = null;
    this.heatTexture = null;
  }

  async init() {
    this.app = new Application();
    await this.app.init({
      canvas: this.canvas,
      resizeTo: this.canvas.parentElement,
      antialias: true,
      background: 0x10141b,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoDensity: true,
    });
    const stage = this.app.stage;
    stage.eventMode = 'static';
    stage.hitArea = this.app.screen;

    const names = ['grid', 'spots', 'heat', 'dark', 'buildings', 'lights', 'overlay', 'annotations'];
    for (const n of names) {
      this.layer[n] = new Container();
      this.view.addChild(this.layer[n]);
    }
    stage.addChild(this.view);

    this.bindEvents(stage);
    this.fitToBounds(this.hooks.getState().scene.bounds);
  }

  // ---------- 坐标 ----------
  toWorld(screenX, screenY) {
    return {
      x: (screenX - this.cam.x) / this.scale,
      y: (screenY - this.cam.y) / this.scale,
    };
  }
  toScreen(worldX, worldY) {
    return { x: worldX * this.scale + this.cam.x, y: worldY * this.scale + this.cam.y };
  }

  fitToBounds(bounds) {
    const w = this.app.screen.width, h = this.app.screen.height;
    const bw = bounds.maxX - bounds.minX, bh = bounds.maxY - bounds.minY;
    this.scale = Math.min(w / (bw + 20), h / (bh + 20));
    this.cam.x = (w - bw * this.scale) / 2 - bounds.minX * this.scale;
    this.cam.y = (h - bh * this.scale) / 2 - bounds.minY * this.scale;
    this.applyTransform();
  }

  applyTransform() {
    this.view.position.set(this.cam.x, this.cam.y);
    this.view.scale.set(this.scale);
  }

  // ---------- 交互 ----------
  bindEvents(stage) {
    const dom = this.app.canvas;
    let panStart = null;

    dom.addEventListener('wheel', (e) => {
      e.preventDefault();
      const before = this.toWorld(e.offsetX, e.offsetY);
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      this.scale = Math.max(0.4, Math.min(12, this.scale * factor));
      this.cam.x = e.offsetX - before.x * this.scale;
      this.cam.y = e.offsetY - before.y * this.scale;
      this.applyTransform();
    }, { passive: false });

    stage.on('pointerdown', (e) => {
      const tool = this.hooks.getState().tool;
      const wp = this.toWorld(e.global.x, e.global.y);
      if (tool === 'pan' || e.button === 1 || e.shiftKey) {
        panStart = { sx: e.global.x, sy: e.global.y, cx: this.cam.x, cy: this.cam.y };
        stage.cursor = 'grabbing';
        return;
      }
      this.handlePointerDown(wp, e.global, e);
    });

    stage.on('pointermove', (e) => {
      const wp = this.toWorld(e.global.x, e.global.y);
      if (panStart) {
        this.cam.x = panStart.cx + (e.global.x - panStart.sx);
        this.cam.y = panStart.cy + (e.global.y - panStart.sy);
        this.applyTransform();
        return;
      }
      if (this.drag) {
        this.handleDrag(wp);
        return;
      }
      this.handleHover(wp);
    });

    const up = () => {
      panStart = null;
      this.drag = null;
      stage.cursor = 'default';
    };
    window.addEventListener('pointerup', up);
  }

  handlePointerDown(wp) {
    const s = this.hooks.getState();
    if (s.tool === 'probe') {
      this.probeCell(wp);
      return;
    }
    if (s.readOnly && s.tool !== 'annotate') {
      return;
    }
    if (s.tool === 'annotate') {
      this.hooks.onAnnotate(wp);
      return;
    }
    if (s.tool === 'building') {
      this.hooks.onCanvasClick(wp); // 单击放置矩形建筑
      return;
    }
    if (s.tool === 'street' || s.tool === 'courtyard' || s.tool === 'wallwash') {
      this.hooks.onPlace(s.tool, wp);
      return;
    }
    // select：先命中灯具，再命中建筑，再命中顶点
    const light = this.hitLight(wp);
    if (light) {
      this.hooks.onPick({ kind: 'light', id: light.id });
      this.drag = { type: 'entity', kind: 'light', id: light.id };
      return;
    }
    const vhit = this.hitVertex(wp);
    if (vhit) {
      this.hooks.onPick({ kind: 'building', id: vhit.id });
      this.drag = { type: 'vertex', ...vhit };
      return;
    }
    const bld = this.hitBuilding(wp);
    if (bld) {
      this.hooks.onPick({ kind: 'building', id: bld.id });
      this.drag = { type: 'entity', kind: 'building', id: bld.id };
      return;
    }
    this.hooks.onPick({ kind: null, id: null });
  }

  handleDrag(wp) {
    if (this.drag.type === 'entity') {
      this.hooks.onDrag(this.drag.kind, this.drag.id, wp.x, wp.y);
    } else if (this.drag.type === 'vertex') {
      this.hooks.onVertexDrag(this.drag.id, this.drag.index, wp.x, wp.y);
    }
  }

  handleHover(wp) {
    const s = this.hooks.getState();
    let cursor = 'default';
    if (s.tool === 'pan') cursor = 'grab';
    else if (s.tool === 'annotate') cursor = 'crosshair';
    else if (s.tool !== 'select') cursor = 'crosshair';
    else if (this.hitLight(wp) || this.hitBuilding(wp) || this.hitVertex(wp)) cursor = 'move';
    this.app.stage.cursor = cursor;
    this.hover = wp;
    if (s.tool === 'probe') this.probeCell(wp);
  }

  probeCell(wp) {
    const s = this.hooks.getState();
    if (!s.result) return;
    const r = s.result;
    const gx = Math.floor((wp.x - s.scene.bounds.minX) / r.cell);
    const gy = Math.floor((wp.y - s.scene.bounds.minY) / r.cell);
    if (gx < 0 || gy < 0 || gx >= r.cols || gy >= r.rows) return;
    window.__probeCell?.(gx, gy);
  }

  hitLight(wp) {
    const list = this.hooks.getState().scene.lights;
    for (let i = list.length - 1; i >= 0; i--) {
      const l = list[i];
      if (Math.hypot(l.x - wp.x, l.y - wp.y) < 1.6) return l;
    }
    return null;
  }

  hitBuilding(wp) {
    const list = this.hooks.getState().scene.buildings;
    for (let i = list.length - 1; i >= 0; i--) {
      if (pointInPoly(wp.x, wp.y, list[i].polygon)) return list[i];
    }
    return null;
  }

  hitVertex(wp) {
    const { scene, selection } = this.hooks.getState();
    if (selection.kind !== 'building') return null;
    const b = scene.buildings.find((x) => x.id === selection.id);
    if (!b) return null;
    for (let i = 0; i < b.polygon.length; i++) {
      const p = b.polygon[i];
      if (Math.hypot(p.x - wp.x, p.y - wp.y) < 1.4) return { id: b.id, index: i };
    }
    return null;
  }

  // ---------- 渲染 ----------
  renderAll() {
    if (!this.app) return; // init() 异步完成前的 Solid 响应式触发直接忽略
    // 防御：任何图层容器缺失时整体重建图层栈
    const names = ['grid', 'spots', 'heat', 'dark', 'buildings', 'lights', 'overlay', 'annotations'];
    if (names.some((n) => !this.layer[n])) {
      for (const n of Object.keys(this.layer)) this.layer[n]?.destroy({ children: true });
      this.layer = {};
      for (const n of names) {
        this.layer[n] = new Container();
        this.view.addChild(this.layer[n]);
      }
    }
    const s = this.hooks.getState();
    this.drawGrid(s);
    this.drawSpots(s);
    this.drawHeat(s);
    this.drawDark(s);
    this.drawBuildings(s);
    this.drawLights(s);
    this.drawAnnotations(s);
  }

  clearLayer(name) {
    const c = this.layer[name];
    if (!c) return;
    // 保留容器本身（图层索引与可见性引用不变），仅销毁其全部子节点
    for (const child of [...c.children]) child.destroy({ children: true });
  }

  drawGrid(s) {
    this.clearLayer('grid');
    this.layer.grid.visible = s.layers.grid;
    const g = new Graphics();
    const { minX, minY, maxX, maxY } = s.scene.bounds;
    g.setStrokeStyle({ width: 1 / this.scale, color: 0x2a3340, alpha: 0.7 });
    for (let x = Math.ceil(minX); x <= maxX; x++) {
      g.moveTo(x, minY).lineTo(x, maxY);
    }
    for (let y = Math.ceil(minY); y <= maxY; y++) {
      g.moveTo(minX, y).lineTo(maxX, y);
    }
    g.setStrokeStyle({ width: 1.5 / this.scale, color: 0x46566c, alpha: 0.9 });    g.rect(minX, minY, maxX - minX, maxY - minY).stroke();
    this.layer.grid.addChild(g);
  }

  drawBuildings(s) {
    this.clearLayer('buildings');
    this.layer.buildings.visible = s.layers.buildings;
    for (const b of s.scene.buildings) {
      const g = new Graphics();
      const selected = s.selection.kind === 'building' && s.selection.id === b.id;
      const shade = Math.min(0.9, 0.25 + b.floors * 0.05);
      // 不透明底色盖住地面网格与光效，再按层数叠明暗
      g.poly(b.polygon.map((p) => [p.x, p.y])).fill({ color: 0x2b3340, alpha: 1 });
      g.poly(b.polygon.map((p) => [p.x, p.y])).fill({ color: 0xffffff, alpha: shade * 0.16 });
      g.poly(b.polygon.map((p) => [p.x, p.y])).stroke({
        width: selected ? 0.45 : 0.22,
        color: selected ? 0x5ec8ff : 0x9fb3c8,
      });
      // 层数文字（反向缩放，保证屏幕像素字号恒定、不被容器缩放拉糊）
      const c = centroid(b.polygon);
      const t = this.crispText(`${b.floors}F`, 15, 0xe8eef6, '700');
      t.anchor.set(0.5);
      t.position.set(c.x, c.y - 1.6);
      const t2 = this.crispText(b.name, 10, 0xaebccd);
      t2.anchor.set(0.5);
      t2.position.set(c.x, c.y + 2.4);
      this.layer.buildings.addChild(g, t, t2);

      if (selected) {
        const vg = new Graphics();
        for (const p of b.polygon) {
          vg.circle(p.x, p.y, 0.9).fill({ color: 0x5ec8ff }).stroke({ width: 0.2, color: 0x0b1622 });
        }
        this.layer.buildings.addChild(vg);
      }
    }
  }

  drawLights(s) {
    this.clearLayer('lights');
    for (const l of s.scene.lights) {
      const g = new Graphics();
      const selected = s.selection.kind === 'light' && s.selection.id === l.id;
      const [r, gg, b] = kelvinToRGB(l.cct);
      const cctColor = rgbToInt(r * 255, gg * 255, b * 255);
      // 半径圈
      g.circle(l.x, l.y, l.radius).stroke({
        width: 0.18, color: cctColor, alpha: selected ? 0.9 : 0.35,
      });
      if (l.type === 'wallwash' && l.washTarget) {
        g.moveTo(l.x, l.y).lineTo(l.washTarget.x, l.washTarget.y)
          .stroke({ width: 0.25, color: cctColor, alpha: 0.8 });
      }
      // 灯具图标按类型区分
      const base = LIGHT_COLORS[l.type];
      if (l.type === 'street') {
        g.circle(l.x, l.y, 1.1).fill({ color: base }).stroke({ width: 0.2, color: 0x1a1206 });
        g.moveTo(l.x, l.y).lineTo(l.x, l.y - 2.2).stroke({ width: 0.22, color: base });
      } else if (l.type === 'courtyard') {
        g.circle(l.x, l.y, 0.9).fill({ color: base }).stroke({ width: 0.18, color: 0x1a1206 });
      } else {
        g.rect(l.x - 0.8, l.y - 0.5, 1.6, 1).fill({ color: base }).stroke({ width: 0.15, color: 0x1a1206 });
      }
      if (selected) {
        g.circle(l.x, l.y, 1.8).stroke({ width: 0.25, color: 0x5ec8ff });
      }
      this.layer.lights.addChild(g);

      const t = this.crispText(`${LIGHT_DEFAULTS[l.type].label} ${l.height.toFixed(1)}m`, 10, 0xdfe8f2);
      t.anchor.set(0.5, 1.6);
      t.position.set(l.x, l.y - 1.5);
      this.layer.lights.addChild(t);
    }
  }

  drawSpots(s) {
    this.clearLayer('spots');
    // 热力图开启时光斑层隐藏，避免两层不透明纹理互相覆盖
    this.layer.spots.visible = s.layers.lightSpots && !s.layers.heatmap;
    if (!s.result || !this.layer.spots.visible) return;
    const tex = this.buildDisplayTexture(s.result);
    const sprite = new Sprite(tex);
    sprite.position.set(s.scene.bounds.minX, s.scene.bounds.minY);
    sprite.width = s.scene.bounds.maxX - s.scene.bounds.minX;
    sprite.height = s.scene.bounds.maxY - s.scene.bounds.minY;
    this.layer.spots.addChild(sprite);
  }

  drawHeat(s) {
    this.clearLayer('heat');
    this.layer.heat.visible = s.layers.heatmap;
    if (!s.result || !s.layers.heatmap) return;
    const tex = this.buildHeatTexture(s.result);
    const sprite = new Sprite(tex);
    const b = s.scene.bounds;
    sprite.position.set(b.minX, b.minY);
    sprite.width = b.maxX - b.minX;
    sprite.height = b.maxY - b.minY;
    this.layer.heat.addChild(sprite);
  }

  drawDark(s) {
    this.clearLayer('dark');
    // 热力图已内置红色暗区，普通模式才用独立半透明红层
    this.layer.dark.visible = s.layers.darkOverlay && !s.layers.heatmap;
    if (!s.result || !this.layer.dark.visible) return;
    const r = s.result;
    const g = new Graphics();
    const { minX, minY } = s.scene.bounds;
    for (let i = 0; i < r.darkMask.length; i++) {
      if (!r.darkMask[i] || r.buildingMask[i]) continue;
      const gx = i % r.cols, gy = (i / r.cols) | 0;
      g.rect(minX + gx * r.cell, minY + gy * r.cell, r.cell, r.cell)
        .fill({ color: 0xd32f3a, alpha: 0.22 });
    }
    this.layer.dark.addChild(g);
  }

  drawAnnotations(s) {
    this.clearLayer('annotations');
    this.layer.annotations.visible = s.layers.annotations;
    for (const a of s.annotations) {
      const g = new Graphics();
      g.circle(a.x, a.y, 1.3).fill({ color: 0xffe066, alpha: 0.95 })
        .stroke({ width: 0.25, color: 0x5a4500 });
      this.layer.annotations.addChild(g);
      const t = this.crispText(a.text, 11, 0xfff3c4);
      t.position.set(a.x + 1.8, a.y - 1);
      this.layer.annotations.addChild(t);
    }
  }

  // ---------- 纹理构建 ----------
  buildDisplayTexture(result) {
    const { cols, rows, display, buildingMask } = result;
    const canvas = document.createElement('canvas');
    canvas.width = cols; canvas.height = rows;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(cols, rows);
    for (let i = 0; i < cols * rows; i++) {
      if (buildingMask[i]) {
        img.data[i * 4 + 3] = 0; // 建筑占地：地面光效透明，露出建筑图层
        continue;
      }
      img.data[i * 4] = display[i * 3];
      img.data[i * 4 + 1] = display[i * 3 + 1];
      img.data[i * 4 + 2] = display[i * 3 + 2];
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    if (this.displayTexture) this.displayTexture.destroy(true);
    this.displayTexture = Texture.from(canvas);
    this.displayTexture.source.scaleMode = 'linear';
    return this.displayTexture;
  }

  buildHeatTexture(result) {
    const { cols, rows, lux, darkMask, buildingMask } = result;
    const canvas = document.createElement('canvas');
    canvas.width = cols; canvas.height = rows;
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(cols, rows);
    // 规划照度分档色标：暗(<20)红 → 不足(20~50)橙 → 基本(50~100)黄
    // → 良好(100~300)浅绿 → 充足(300~1000)绿 → 充沛(>1000)青蓝
    for (let i = 0; i < cols * rows; i++) {
      if (buildingMask[i]) {
        img.data[i * 4 + 3] = 0; // 建筑格透明
        continue;
      }
      let rr, gg, bb;
      if (darkMask[i]) {
        rr = 224; gg = 38; bb = 48;
      } else {
        [rr, gg, bb] = luxBandColor(lux[i]);
      }
      img.data[i * 4] = rr;
      img.data[i * 4 + 1] = gg;
      img.data[i * 4 + 2] = bb;
      img.data[i * 4 + 3] = 235;
    }
    ctx.putImageData(img, 0, 0);
    if (this.heatTexture) this.heatTexture.destroy(true);
    this.heatTexture = Texture.from(canvas);
    this.heatTexture.source.scaleMode = 'nearest';
    return this.heatTexture;
  }

  // 屏幕空间清晰文字：以像素字号创建，再按 1/scale 反向缩放，使其在世界容器中保持恒定屏幕大小
  crispText(str, pxSize, fill, weight = '400') {
    const t = new Text({
      text: str,
      style: { fill, fontSize: pxSize, fontWeight: weight, fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif' },
      resolution: Math.min(window.devicePixelRatio || 1, 2),
    });
    t.scale.set(1 / this.scale);
    return t;
  }

  // 导出当前画布为 PNG
  async exportPNG() {
    return this.app.renderer.extract.canvas(this.app.stage).toDataURL('image/png');
  }

  destroy() {
    this.displayTexture?.destroy(true);
    this.heatTexture?.destroy(true);
    this.app.destroy({ removeView: true });
  }
}

function pointInPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
    if (((yi > y) !== (yj > y)) && x < ((xj - xi) * (y - yi)) / (yj - yi || 1e-12) + xi) inside = !inside;
  }
  return inside;
}

function centroid(poly) {
  let x = 0, y = 0;
  for (const p of poly) { x += p.x; y += p.y; }
  return { x: x / poly.length, y: y / poly.length };
}

function rgbToInt(r, g, b) {
  return ((r | 0) << 16) | ((g | 0) << 8) | (b | 0);
}

// 规划照度分档色标（lx），与热力图纹理一致
const LUX_BANDS = [
  { max: 20, rgb: [224, 38, 48] },
  { max: 50, rgb: [240, 138, 46] },
  { max: 100, rgb: [238, 210, 70] },
  { max: 300, rgb: [150, 214, 92] },
  { max: 1000, rgb: [58, 180, 130] },
  { max: Infinity, rgb: [44, 130, 214] },
];
function luxBandColor(lux) {
  for (const band of LUX_BANDS) {
    if (lux < band.max) return band.rgb;
  }
  return LUX_BANDS[LUX_BANDS.length - 1].rgb;
}

// 蓝→青→绿→黄 的连续热力色标（保留供其它用途）
function heatColor(t) {
  const stops = [
    [32, 64, 160], [40, 140, 200], [60, 190, 140],
    [230, 200, 70], [235, 120, 40],
  ];
  const x = t * (stops.length - 1);
  const i = Math.min(stops.length - 2, Math.floor(x));
  const f = x - i;
  const a = stops[i], b = stops[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}
