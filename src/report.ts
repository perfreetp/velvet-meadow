// 调查说明(报告)生成

import { LEVEL_NAMES, Network } from './types.js';

export function buildReport(opts: {
  id: string;
  region: string;
  name: string;
  network: Network;
  basemapName: string | null;
}): string {
  const { network } = opts;
  const p = network.params;
  const s = network.stats;
  const km = (m: number) => (m / 1000).toFixed(2);
  const lockedCount = network.segments.filter((x) => x.locked).length;
  const customCount = network.segments.filter((x) => x.custom).length;
  const date = new Date().toLocaleString('zh-CN');

  const rows = LEVEL_NAMES.map(
    (n, i) =>
      `| ${n} | ${s.counts[i]} | ${km(s.lengths[i])} | ${(s.lengths[i] / Math.max(1, s.counts[i])).toFixed(1)} |`,
  ).join('\n');

  return `# 潮沟网络调查说明

- 档案编号:${opts.id}
- 调查区域:${opts.region}
- 档案名称:${opts.name}
- 编制时间:${date}
- 航拍底图:${opts.basemapName ?? '未导入'}

## 一、生成参数

| 参数 | 值 |
| --- | --- |
| 随机种子 | ${p.seed} |
| 主沟走向 | ${p.mainDirection}° |
| 分叉角度 | ${p.bifurcationAngle}° |
| 支沟密度 | ${p.branchDensity} 条/km |
| 毛细沟密度 | ${p.capillaryDensity} 条/km |
| 曲流幅度 | ${p.meanderAmp} m |

> 本网络为过程式生成结果:同一组参数与同一种子可完全复现;更换种子后网络形态改变。

## 二、网络统计

| 级别 | 条数 | 总长度 (km) | 平均沟长 (m) |
| --- | --- | --- | --- |
${rows}

- 网络总长度:${km(s.totalLength)} km
- 交汇节点数:${s.junctions}
- 沟网密度:${s.density.toFixed(2)} km/km²
- 人工干预:锁定段 ${lockedCount} 条,手动编辑段 ${customCount} 条

## 三、形态说明

网络分主干、支沟、毛细沟三级。主干自海岸线向陆地方向延伸,走向 ${p.mainDirection}°,
曲流幅度 ${p.meanderAmp} m;支沟以约 ${p.bifurcationAngle}° 夹角自主干分出,
毛细沟自支沟进一步细分。各级沟宽自沟口向沟头指数衰减,交汇处圆角过渡,
沟头依高程自然收尾。${lockedCount > 0 ? `其中 ${lockedCount} 条经人工修编并锁定,在参数调整后的整体重生成中保持形态不变并与新网络衔接。` : ''}

## 四、结论与建议

本次调查区潮沟网络发育${s.density > 2 ? '良好,沟网密度较高' : s.density > 1 ? '中等' : '较弱,沟网密度偏低'},
主干—支沟—毛细沟三级结构完整。建议结合航拍底图对沟头位置与交汇形态进行现场复核,
重点关注主干潮沟的冲淤变化与毛细沟的连通性。
`;
}
