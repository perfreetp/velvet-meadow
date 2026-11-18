// 网格构建与拾取:把河道折线三角化为带状网格,
// 每个折点处加圆盘 => 圆角连接/圆角端头,交汇处自然圆角过渡。
export const FLOATS_PER_VERTEX = 6; // x, y, r, g, b, level
const DISC_SEGMENTS = 8;
export function buildMesh(segments, highlightId = null, sea = null) {
    // 预估容量:每段 quad 6*(n-1) + 圆盘 24*n 顶点;海面每采样 6 顶点
    let totalVerts = sea ? 6 * (sea.length / 2 - 1) : 0;
    for (const s of segments) {
        const n = s.points.length / 2;
        totalVerts += 6 * (n - 1) + DISC_SEGMENTS * 3 * n;
    }
    const data = new Float32Array(totalVerts * FLOATS_PER_VERTEX);
    let o = 0;
    const push = (x, y, c, level) => {
        data[o++] = x;
        data[o++] = y;
        data[o++] = c[0];
        data[o++] = c[1];
        data[o++] = c[2];
        data[o++] = level;
    };
    // 海面(透明度取 uniform 第 4 分量,level 索引 3)
    if (sea) {
        const c = [0.62, 0.78, 0.86];
        const SEA_BOTTOM = 3000;
        for (let i = 0; i < sea.length / 2 - 1; i++) {
            const x0 = sea[i * 2];
            const y0 = sea[i * 2 + 1];
            const x1 = sea[(i + 1) * 2];
            const y1 = sea[(i + 1) * 2 + 1];
            push(x0, y0, c, 3);
            push(x1, y1, c, 3);
            push(x1, SEA_BOTTOM, c, 3);
            push(x0, y0, c, 3);
            push(x1, SEA_BOTTOM, c, 3);
            push(x0, SEA_BOTTOM, c, 3);
        }
    }
    for (const s of segments) {
        const pts = s.points;
        const n = pts.length / 2;
        if (n < 2)
            continue;
        const c = s.id === highlightId
            ? [1.0, 0.35, 0.9]
            : s.locked
                ? [Math.min(1, s.color[0] + 0.25), Math.min(1, s.color[1] + 0.25), Math.min(1, s.color[2] + 0.3)]
                : s.color;
        // 每点法线(相邻方向平均)
        const nx = new Float64Array(n);
        const ny = new Float64Array(n);
        for (let i = 0; i < n; i++) {
            const i0 = Math.max(0, i - 1);
            const i1 = Math.min(n - 1, i + 1);
            let dx = pts[i1 * 2] - pts[i0 * 2];
            let dy = pts[i1 * 2 + 1] - pts[i0 * 2 + 1];
            const len = Math.hypot(dx, dy) || 1;
            dx /= len;
            dy /= len;
            nx[i] = -dy;
            ny[i] = dx;
        }
        // 带状四边形条
        for (let i = 0; i < n - 1; i++) {
            const x0 = pts[i * 2];
            const y0 = pts[i * 2 + 1];
            const x1 = pts[(i + 1) * 2];
            const y1 = pts[(i + 1) * 2 + 1];
            const w0 = s.widths[i] / 2;
            const w1 = s.widths[i + 1] / 2;
            const ax = x0 + nx[i] * w0;
            const ay = y0 + ny[i] * w0;
            const bx = x0 - nx[i] * w0;
            const by = y0 - ny[i] * w0;
            const cx = x1 + nx[i + 1] * w1;
            const cy = y1 + ny[i + 1] * w1;
            const dx = x1 - nx[i + 1] * w1;
            const dy = y1 - ny[i + 1] * w1;
            push(ax, ay, c, s.level);
            push(bx, by, c, s.level);
            push(cx, cy, c, s.level);
            push(bx, by, c, s.level);
            push(dx, dy, c, s.level);
            push(cx, cy, c, s.level);
        }
        // 每点圆盘:圆角连接 + 圆角端头 + 交汇处圆角过渡
        for (let i = 0; i < n; i++) {
            const cx = pts[i * 2];
            const cy = pts[i * 2 + 1];
            const r = s.widths[i] / 2;
            for (let k = 0; k < DISC_SEGMENTS; k++) {
                const a0 = (k / DISC_SEGMENTS) * Math.PI * 2;
                const a1 = ((k + 1) / DISC_SEGMENTS) * Math.PI * 2;
                push(cx, cy, c, s.level);
                push(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, c, s.level);
                push(cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, c, s.level);
            }
        }
    }
    return { data: data.subarray(0, o), vertexCount: o / FLOATS_PER_VERTEX };
}
/** 拾取:世界坐标下离 (px,py) 最近的段(按宽度加权容差) */
export function pickSegment(segments, px, py, tol) {
    let best = null;
    for (const s of segments) {
        const pts = s.points;
        for (let i = 1; i < pts.length / 2; i++) {
            const ax = pts[(i - 1) * 2];
            const ay = pts[(i - 1) * 2 + 1];
            const bx = pts[i * 2];
            const by = pts[i * 2 + 1];
            const dx = bx - ax;
            const dy = by - ay;
            const len2 = dx * dx + dy * dy;
            let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0;
            t = Math.max(0, Math.min(1, t));
            const qx = ax + dx * t;
            const qy = ay + dy * t;
            const d = Math.hypot(px - qx, py - qy);
            const limit = Math.max(tol, s.widths[i] / 2 + tol * 0.4);
            if (d < limit && (!best || d < best.dist)) {
                best = {
                    segment: s,
                    dist: d,
                    pointIndex: t < 0.5 ? i - 1 : i,
                    x: qx,
                    y: qy,
                };
            }
        }
    }
    return best;
}
//# sourceMappingURL=geometry.js.map