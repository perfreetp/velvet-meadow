// 色温（K）→ 线性 sRGB（Tanner Helland 近似，规划可视化精度足够）
// 返回 0~1 线性光分量，调用方按发光强度缩放

export function kelvinToRGB(kelvin) {
  const t = Math.max(1000, Math.min(40000, kelvin)) / 100;
  let r, g, b;

  if (t <= 66) {
    r = 1;
    g = 0.3900815787690196 * Math.log(t) - 0.6318414437886275;
  } else {
    r = 1.292936186062745 * Math.pow(t - 60, -0.1332047592);
    g = 1.129890860895294 * Math.pow(t - 60, -0.0755148492);
  }

  if (t >= 66) {
    b = 1;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 0.543206789110196 * Math.log(t - 10) - 1.19625408914;
  }

  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  // 先转 sRGB 再转回线性，保证与后续曝光/伽马管线在同一空间
  const s2l = (c) => {
    const c2 = clamp01(c);
    return c2 <= 0.04045 ? c2 / 12.92 : Math.pow((c2 + 0.055) / 1.055, 2.4);
  };
  return [s2l(r), s2l(g), s2l(b)];
}

// 常见灯具色温预设
export const LIGHT_TEMPERATURES = [
  { label: '暖黄光 2200K', value: 2200 },
  { label: '暖白光 3000K', value: 3000 },
  { label: '中性白 4000K', value: 4000 },
  { label: '日光白 5000K', value: 5000 },
  { label: '冷白光 6500K', value: 6500 },
];
