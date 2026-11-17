import type { ProjectData, SceneElement, Vec2 } from './types';
import { LAMP_CATALOG } from './engine/photometry';
import { uid } from './engine/geometry';

function lamp(
  kind: keyof typeof LAMP_CATALOG,
  x: number,
  y: number,
  aim: number,
  name?: string,
): SceneElement {
  const cat = LAMP_CATALOG[kind];
  return {
    id: uid('lamp'),
    type: 'lamp',
    name: name ?? `${cat.label}-${Math.round(x)}`,
    kind,
    pos: { x, y },
    aim,
    beamAngleDeg: cat.defaultBeamDeg,
    colorTemp: cat.defaultColorTemp,
    powerW: cat.defaultPowerW,
    height: cat.defaultHeight,
    efficacy: cat.efficacyLmPerW,
  };
}

export function createDefaultProject(): ProjectData {
  // 弯曲河道中心线
  const centerLine: Vec2[] = [
    { x: -70, y: -2 },
    { x: -45, y: 0 },
    { x: -20, y: 2 },
    { x: 5, y: 0 },
    { x: 30, y: -3 },
    { x: 55, y: -1 },
    { x: 72, y: 2 },
  ];

  const offset = (i: number, d: number): Vec2 => {
    const p = centerLine[i];
    const prev = centerLine[Math.max(0, i - 1)];
    const next = centerLine[Math.min(centerLine.length - 1, i + 1)];
    const dx = next.x - prev.x, dy = next.y - prev.y;
    const l = Math.hypot(dx, dy);
    const nx = -dy / l, ny = dx / l;
    return { x: p.x + nx * d, y: p.y + ny * d };
  };

  const northBank = centerLine.map((_, i) => offset(i, 9));
  const southBank = centerLine.map((_, i) => offset(i, -9));
  const waterPoly: Vec2[] = [
    ...centerLine.map((_, i) => offset(i, 7.5)),
    ...centerLine.map((_, i) => offset(i, -7.5)).reverse(),
  ];

  const elements: SceneElement[] = [
    { id: uid('water'), type: 'water', name: '主河道水面', points: waterPoly },
    {
      id: uid('wall'),
      type: 'wall',
      name: '北岸驳岸挡墙',
      points: northBank,
      thickness: 0.8,
      height: 2.2,
    },
    {
      id: uid('wall'),
      type: 'wall',
      name: '南岸驳岸挡墙',
      points: southBank,
      thickness: 0.8,
      height: 2.2,
    },
    // 桥洞（通航孔）+ 两个桥墩
    {
      id: uid('bridge'),
      type: 'bridgeOpening',
      name: '望春桥桥洞',
      points: [
        { x: 8, y: -3.2 },
        { x: 12, y: -3.2 },
        { x: 12, y: 3.2 },
        { x: 8, y: 3.2 },
      ],
    },
    {
      id: uid('pier'),
      type: 'pier',
      name: '望春桥墩-北',
      points: [
        { x: 8.4, y: 3.4 },
        { x: 11.6, y: 3.4 },
        { x: 11.6, y: 5.2 },
        { x: 8.4, y: 5.2 },
      ],
      height: 3.5,
    },
    {
      id: uid('pier'),
      type: 'pier',
      name: '望春桥墩-南',
      points: [
        { x: 8.4, y: -5.2 },
        { x: 11.6, y: -5.2 },
        { x: 11.6, y: -3.4 },
        { x: 8.4, y: -3.4 },
      ],
      height: 3.5,
    },
    // 码头平台
    {
      id: uid('dock'),
      type: 'dock',
      name: '西码头平台',
      points: [
        { x: -38, y: 5.5 },
        { x: -26, y: 6.5 },
        { x: -25, y: 9.5 },
        { x: -37, y: 8.5 },
      ],
    },
    // 航线
    { id: uid('route'), type: 'route', name: '夜游主航线', points: centerLine.map((p) => ({ ...p })) },
  ];

  // 灯具布置：两岸投光灯、洗墙灯、水下灯、桥头灯笼串；东侧刻意留暗段
  const floodXs = [-60, -40, -20, 0, 18]; // 38 以东不布投光灯 -> 暗区
  for (const x of floodXs) {
    elements.push(lamp('flood', x, 9.5, Math.PI / 2 + Math.PI, `北岸投光-${x}`));
    elements.push(lamp('flood', x + 6, -9.5, Math.PI / 2, `南岸投光-${x + 6}`));
  }
  for (const x of [-55, -35, -15, 5, 25, 45]) {
    elements.push(lamp('wallWasher', x, 8.6, -Math.PI / 2, `北墙洗墙-${x}`));
    elements.push(lamp('wallWasher', x, -8.6, Math.PI / 2, `南墙洗墙-${x}`));
  }
  for (const x of [-50, -30, -10, 10, 30]) {
    elements.push(lamp('underwater', x, 0, Math.PI / 2, `水下灯-${x}`));
  }
  // 灯笼串：桥两侧
  for (const y of [-6, -2, 2, 6]) {
    elements.push(lamp('lanternString', 10, y, 0, `桥头灯笼-${y}`));
  }

  return {
    meta: {
      name: '望春河夜游布光方案',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    elements,
    comments: [],
    timeHour: 19.5,
    heatmapMode: 'total',
    heatmapVisible: true,
    darkZoneVisible: true,
    luxThreshold: 15,
  };
}
