// Canvas2D 兜底渲染器:无 WebGPU 环境下保证全部功能可用。
export class Canvas2DRenderer {
    kind = 'canvas2d';
    ctx;
    canvas;
    segments = [];
    sea = null;
    basemap = null;
    basemapWorld = { w: 4000, h: 3000 };
    cam = { cx: 2000, cy: 1500, scale: 0.25 };
    opacities = [1, 1, 1];
    dpr = 1;
    constructor(canvas) {
        this.canvas = canvas;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            throw new Error('Canvas2D 不可用');
        this.ctx = ctx;
    }
    setScene(scene) {
        this.segments = scene.segments;
        this.sea = scene.sea;
    }
    setBasemap(bmp, worldW, worldH) {
        this.basemap = bmp;
        this.basemapWorld = { w: worldW, h: worldH };
    }
    setCamera(cx, cy, scale) {
        this.cam = { cx, cy, scale };
    }
    setOpacities(o) {
        this.opacities = [...o];
    }
    resize(cssW, cssH, dpr) {
        this.dpr = dpr;
        const w = Math.max(1, Math.floor(cssW * dpr));
        const h = Math.max(1, Math.floor(cssH * dpr));
        if (this.canvas.width !== w || this.canvas.height !== h) {
            this.canvas.width = w;
            this.canvas.height = h;
        }
    }
    render() {
        const { ctx, canvas } = this;
        const w = canvas.width;
        const h = canvas.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = '#eeeae2';
        ctx.fillRect(0, 0, w, h);
        const s = this.cam.scale * this.dpr;
        const ox = w / 2 - this.cam.cx * s;
        const oy = h / 2 - this.cam.cy * s;
        if (this.basemap) {
            ctx.globalAlpha = 0.85;
            ctx.drawImage(this.basemap, ox, oy, this.basemapWorld.w * s, this.basemapWorld.h * s);
            ctx.globalAlpha = 1;
        }
        // 海面
        if (this.sea && this.sea.length >= 4) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#9ec7dc';
            ctx.beginPath();
            ctx.moveTo(this.sea[0] * s + ox, this.sea[1] * s + oy);
            for (let i = 2; i < this.sea.length; i += 2) {
                ctx.lineTo(this.sea[i] * s + ox, this.sea[i + 1] * s + oy);
            }
            ctx.lineTo(this.sea[this.sea.length - 2] * s + ox, 3000 * s + oy);
            ctx.lineTo(this.sea[0] * s + ox, 3000 * s + oy);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        // 先低级别后高级别,保证毛细沟在汇合处可见
        const ordered = [...this.segments].sort((a, b) => a.level - b.level);
        for (const seg of ordered) {
            const pts = seg.points;
            if (pts.length < 4)
                continue;
            const c = seg.color;
            ctx.strokeStyle = `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})`;
            ctx.globalAlpha = this.opacities[seg.level];
            // 分段以不同线宽描边,近似宽度衰减
            for (let i = 1; i < pts.length / 2; i++) {
                ctx.lineWidth = Math.max(0.6, seg.widths[i] * s);
                ctx.beginPath();
                ctx.moveTo(pts[(i - 1) * 2] * s + ox, pts[(i - 1) * 2 + 1] * s + oy);
                ctx.lineTo(pts[i * 2] * s + ox, pts[i * 2 + 1] * s + oy);
                ctx.stroke();
            }
        }
        ctx.globalAlpha = 1;
    }
    dispose() { }
}
//# sourceMappingURL=renderer-2d.js.map