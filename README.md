# 内河夜游航线二维布光预览工作室

面向城市内河夜游航线的二维布光设计与照度预览工具。设计师在河道平面图上铺设
水面、驳岸挡墙、桥洞、桥墩与码头平台，从灯具库拖入四类灯具，实时查看照度热力图、
软阴影与暗区清单，并完成版本提交、审核批注与双版本比对。

## 启动

```bash
npm install
npm run dev        # 开发服务器
npm run build      # 类型检查 + 生产构建
npm run test:sim   # 光度学仿真冒烟测试（10 项物理断言）
```

## 功能与实现对应

| 需求 | 实现位置 |
| --- | --- |
| 水面/驳岸/桥洞/桥墩/码头/航线绘制 | `src/components/Toolbar.tsx` + `ThreeStage` 多边形/折线工具，顶点可拖拽 |
| 四类灯具拖入与参数调节（角度/色温/功率/方向） | `LampLibrary.tsx`（HTML5 拖放）、`Inspector.tsx`、灯具库规格 `engine/photometry.ts` |
| 距离衰减叠加 | `engine/simulation.ts`：E = I_peak·f(θ)·cosθ/R²，逐灯逐单元累加 |
| 光通量守恒的光束模型 | `beamSolidAngle()` 数值积分立体角，峰值光强 I=lm/Ω，窄光束轴向更亮 |
| 挡墙/桥墩遮挡与软阴影 | `visibility()`：2.5D 射线高度 vs 挡墙高度，smoothstep 软过渡 |
| 半影宽度随灯—遮挡物距离变化 | w = s·d₂/d₁（灯越远半影越窄，受光面越远半影越宽），再换算高度裕量 |
| 18:00–23:00 时间曲线 | `timeCurve()`：余晖 smoothstep 衰减、灯光 35%→100%→90% 调光、天空色过渡 |
| 水面菲涅尔权重反射 | `fresnel(cosθ)`，仅水面以上灯具，掠射角反射增强，可单独查看反射层 |
| 照度热力图实时刷新 | CPU 网格仿真 → CanvasTexture；120ms 节流，默认 0.8m 格距（约 50ms/帧） |
| <15 lux 自动标红 + 暗区清单 | 4 邻域连通域分析（最小 4m² 过滤），`DarkZoneList.tsx` 点击定位 |
| 航线段灯具清单与总功率导出 | `engine/exporter.ts`：按垂直距离归属航线段，导出 CSV（带 BOM 兼容 Excel）/JSON |
| 版本提交/回滚 | `store.ts` 快照存 localStorage（最多 20 个） |
| 审核打点批注 + 制作方逐条回复 | 批注工具 + `CommentsPanel.tsx`，含解决/重开闭环 |
| 双版本并排比对 | `CompareView.tsx`：双画布相机联动 + 灯具/几何/批注差异清单 + 功率变化 |

## 仿真物理说明

- **坐标系**：俯视二维平面，单位米；灯具备安装高度 h，构成 2.5D 模型。
- **直射照度**：`E = (lm/Ω)·f(α)·cosθ/R³²·V`，其中 V 为遮挡可见度 0–1。
- **软阴影**：光线在遮挡位置的射线高度 `hL·(1-d₁/r)` 与挡墙高度比较，
  半影宽度由遮挡物厚度和 d₁/d₂ 比例决定，近灯窄、远灯宽，符合几何光学。
- **水下灯**：按 0.55 耦合系数穿出水面，不产生菲涅尔反射项。
- **环境光**：黄昏余晖贡献最高 18 lux 环境照度，20:30 后归零。
- 仿真为设计预览精度（网格 0.8m），用于方案比选与暗区排查，不替代专业照明计算书。

## 目录结构

```
src/
  engine/        纯算法层：几何、光度学、仿真、导出（无 React/three 依赖）
  three/         ThreeStage：正交相机二维渲染、拾取拖拽、热力图纹理
  components/    React UI 面板
  hooks/         仿真调度
  store.ts       zustand 状态 + localStorage 持久化
  defaultScene.ts 内置示例（含刻意保留的东侧暗段）
scripts/sim-smoke.ts  物理模型冒烟测试
```
