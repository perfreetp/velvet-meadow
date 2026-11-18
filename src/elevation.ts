// 过程式高程场:海岸线 + 向陆抬升 + 分形微地形。
// 沟头收尾依据:河道向陆生长,当沟头处高程超过该级别阈值时自然终止。

import { fbm2, hashStrings, noise2 } from './rng.js';

export interface ElevationField {
  /** 高程(米),海面约 0,向陆抬升 */
  z(x: number, y: number): number;
  /** 海岸线 y 坐标(米),y 大于此值为海 */
  coastY(x: number): number;
}

export function makeElevation(seed: number): ElevationField {
  const sCoast = hashStrings(seed, ['coast']);
  const sRelief = hashStrings(seed, ['relief']);

  const coastY = (x: number): number =>
    2400 +
    130 * noise2(x * 0.0008, 3.7, sCoast) +
    45 * noise2(x * 0.0042, 9.1, sCoast + 7);

  const z = (x: number, y: number): number => {
    const inland = coastY(x) - y; // >0 表示在陆侧
    const base = Math.max(0, inland) * 0.0042; // 平均坡降 ~4.2m/km
    const relief =
      1.1 * fbm2(x * 0.0016, y * 0.0016, sRelief, 4) +
      0.3 * fbm2(x * 0.009, y * 0.009, sRelief + 13, 3);
    return base + relief + 0.5;
  };

  return { z, coastY };
}
