// 太阳位置：NOAA 太阳位置算法（SPA 简化版，规划校核精度误差 <0.5°）
// 纬度/经度为十进制度，北纬东经为正；hour 为本地时钟小时（9~21，支持小数）
// 参考: https://gml.noaa.gov/grad/solcalc/solareqns.PDF

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function julianDay(year, month, day) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) +
    Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/**
 * @returns {{elev:number, azim:number, daylight:boolean}}
 *   elev  太阳高度角（弧度，地平线下为负）
 *   azim  太阳方位角（弧度，正北=0 顺时针，东=90°，南=180°，西=270°）
 */
export function sunPosition(date, hour, lat, lng) {
  const jd = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate());
  // 儒略世纪（含当日小数时刻）。getTimezoneOffset() 在 UTC+8 为 -480，
  // 故 UT 小时 = 本地钟点 + tzOffsetMin/60
  const tzOffsetMin = date.getTimezoneOffset();
  const utHour = hour + tzOffsetMin / 60;
  const jc = (jd + utHour / 24 - 2451545.0) / 36525.0;

  // 几何平黄经、平近点角
  const L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
  const M = (357.52911 + jc * (35999.05029 - 0.0001537 * jc)) % 360;
  const Mrad = M * RAD;
  const e = 0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
  // 中心差
  const C = Math.sin(Mrad) * (1.914602 - jc * (0.004817 + 0.000014 * jc)) +
    Math.sin(2 * Mrad) * (0.019993 - 0.000101 * jc) +
    Math.sin(3 * Mrad) * 0.000289;
  const trueLon = L0 + C;
  const omega = 125.04 - 1934.136 * jc;
  const appLon = trueLon - 0.00569 - 0.00478 * Math.sin(omega * RAD);
  const meanObliq = 23 + (26 + ((21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813)))) / 60) / 60;
  const obliq = meanObliq + 0.00256 * Math.cos(omega * RAD);

  const decl = Math.asin(Math.sin(obliq * RAD) * Math.sin(appLon * RAD));

  // 均时差（分钟）
  const y = Math.tan((obliq / 2) * RAD) ** 2;
  const eqTime = 4 * DEG * (
    y * Math.sin(2 * L0 * RAD) -
    2 * e * Math.sin(Mrad) +
    4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0 * RAD) -
    0.5 * y * y * Math.sin(4 * L0 * RAD) -
    1.25 * e * e * Math.sin(2 * Mrad)
  );

  // 真太阳时（分钟）：TST = 本地钟时 + 均时差 + 4min/°×经度 - 60×时区(h)
  // 时区东八区对应 -60×8 = -480，恰好等于 getTimezoneOffset() 的 -480
  const tst = hour * 60 + eqTime + 4 * lng + tzOffsetMin;
  // 时角：真太阳正午 TST=720 时 ha=0，上午为负、下午为正
  const ha = (tst / 4 - 180) * RAD;

  const latR = lat * RAD;
  const sinElev = Math.sin(latR) * Math.sin(decl) +
    Math.cos(latR) * Math.cos(decl) * Math.cos(ha);
  const elev = Math.asin(Math.max(-1, Math.min(1, sinElev)));

  let azim = Math.acos(
    Math.max(-1, Math.min(1,
      (Math.sin(decl) - Math.sin(elev) * Math.sin(latR)) /
      (Math.cos(elev) * Math.cos(latR) || 1e-12)))
  );
  if (ha > 0) azim = Math.PI * 2 - azim; // 下午（时角为正）方位折到顺时针北基准

  return { elev, azim, daylight: elev > 0 };
}

// 节气预设（默认北京 39.9°N / 116.4°E）
export const SOLAR_PRESETS = {
  summer: { label: '夏至', month: 6, day: 21 },
  winter: { label: '冬至', month: 12, day: 21 },
};

// 太阳水平传播方向（太阳→地面投影），用于建筑阴影挤出
export function sunGroundDirection(azim) {
  return { x: -Math.sin(azim), y: -Math.cos(azim) };
}

// 晴空直射地面照度（lux），按高度角平滑衰减，夜间为 0
export function solarIlluminance(elev) {
  if (elev <= 0) return 0;
  return 100000 * Math.pow(Math.sin(elev), 1.2);
}
