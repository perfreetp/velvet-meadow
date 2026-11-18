// 确定性随机数与噪声:全部基于整数哈希,跨平台/跨引擎结果一致。
// 不使用 Math.random / Date,保证「同参数 + 同种子 => 完全一致」。
/** 32-bit 整数混合哈希 */
export function hashInts(...nums) {
    let h = 2166136261 >>> 0;
    for (const n of nums) {
        h ^= n >>> 0;
        h = Math.imul(h, 16777619);
        h ^= h >>> 13;
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
}
/** 由种子 + 任意字符串/数字键派生一个确定性的 32 位子种子 */
export function hashStrings(seed, parts) {
    let h = (seed >>> 0) ^ 0x9e3779b9;
    for (const p of parts) {
        const s = String(p);
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        h ^= 0x85ebca6b;
        h = Math.imul(h, 16777619);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^ (h >>> 16)) >>> 0;
}
/** mulberry32 PRNG,确定性随机流 */
export class Rng {
    s;
    constructor(seed) {
        this.s = (seed >>> 0) || 1;
    }
    next() {
        let t = (this.s = (this.s + 0x6d2b79f5) >>> 0);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    range(a, b) {
        return a + (b - a) * this.next();
    }
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length) % arr.length];
    }
}
function lattice(seed, i, j) {
    return (hashInts(seed, i, j) & 0xffff) / 0xffff;
}
function smooth(t) {
    return t * t * (3 - 2 * t);
}
/** 一维值噪声,输出 [-1, 1] */
export function noise1(x, seed) {
    const i = Math.floor(x);
    const f = x - i;
    const a = lattice(seed, i, 0);
    const b = lattice(seed, i + 1, 0);
    return (a + (b - a) * smooth(f)) * 2 - 1;
}
/** 二维值噪声,输出 [-1, 1] */
export function noise2(x, y, seed) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const a = lattice(seed, i, j);
    const b = lattice(seed, i + 1, j);
    const c = lattice(seed, i, j + 1);
    const d = lattice(seed, i + 1, j + 1);
    const u = smooth(fx);
    const v = smooth(fy);
    return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
/** 分形叠加噪声,输出约 [-1, 1] */
export function fbm2(x, y, seed, octaves = 4) {
    let amp = 0.5;
    let freq = 1;
    let sum = 0;
    let norm = 0;
    for (let o = 0; o < octaves; o++) {
        sum += amp * noise2(x * freq, y * freq, seed + o * 101);
        norm += amp;
        amp *= 0.5;
        freq *= 2.03;
    }
    return sum / norm;
}
//# sourceMappingURL=rng.js.map