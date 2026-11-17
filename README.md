# 板式件矢量轮廓编辑器

面向塑料板式床、储物柜板件的激光切割轮廓编辑与质量复核工具。
技术栈：**Svelte 5 + TypeScript + Canvas2D + OffscreenCanvas + Web Worker**，零第三方几何/渲染库，几何引擎完全自研。

## 启动

```bash
npm install
npm run dev        # 开发
npm run build      # 生产构建
npm run preview    # 预览生产构建
```

## 测试

```bash
npm run typecheck            # Svelte + TS 类型检查
npm run test:unit            # 几何引擎单元测试(25 项)
npm run fixtures             # 生成批量检查用图纸
npm run build && npm run preview
E2E_BASE=http://localhost:4173 npm run test:e2e     # 主流程 E2E(20 项)
E2E_BASE=http://localhost:4173 npm run test:batch   # Worker 批量复核 E2E(8 项)
```

## 功能与实现位置

| 需求 | 实现 |
| --- | --- |
| 按板材实际尺寸显示幅面并铺网格 | `render/canvas.ts` 的 `GridCache`，用 **OffscreenCanvas** 预渲染 10/100mm 网格，仅在缩放或板幅变化时重建 |
| 直线 / 圆弧 / 自由曲线 | 三种图元 `geometry/segments.ts`；自由曲线经 Douglas–Peucker 抽稀后用 Catmull-Rom 转三次贝塞尔 |
| 节点拖拽、增删锚点 | `geometry/contour.ts` 的 `moveAnchor/insertAnchor/deleteAnchor`，段在参数 t 处切分，删点时线-线、弧-弧合并保型 |
| 闭合路径并/减/交，保留圆角 | `geometry/boolean.ts`：交点处**切分原图元而非展平**，弧/贝塞尔保持原类型，按中点包含关系选边拼环 |
| 端点靠近板边/孔中心自动吸附 + 对齐参考线 | `geometry/snap.ts`，屏幕像素容差换算成 mm，输出水平/垂直参考线 |
| 挪动板件相邻件让位 | `editor/arrange.ts` 的 `pushNeighbors`，沿拖动轴推动并级联，保持 2mm 间隙，自动夹回板幅 |
| 撤销重做 ≥30 步 + 刷新续改 | `editor/history.ts`，栈深 50，文档与历史均持久化到 localStorage |
| 多孔阵列复制并保持孔距 | `editor/arrange.ts` 的 `duplicateHolesArray`，网格阵列等半径等间距 |
| 超出板幅实时变红 | 渲染层逐件/逐孔判定，越界描红；状态栏同步计数 |
| 导出激光切割 SVG | `geometry/svg.ts`，mm 单位、弧保留 `A` 命令、贝塞尔保留 `C` 命令、evenodd |
| 批量图纸自动检查（自交/孔重叠/越界） | `geometry/checks.ts` + `workers/batch.worker.ts`（Worker 内用 OffscreenCanvas 光栅化辅助校验） |
| 问题三档分级、逐条确认/驳回、整批门禁 | 严重/主要/提示三档；`batchPassable` 控制放行，未清零锁定；可导出退供问题清单 |

### 三档判定口径

- **严重(critical)**：轮廓自交、孔位侵入重叠、零件/孔超出板幅
- **主要(major)**：轮廓未闭合、孔间距 <1mm、零件排料区域重叠、轮廓顶点越界
- **提示(minor)**：圆心重合的重复孔、小于 0.2mm 的微小图元（低于激光加工极限）

门禁规则：存在「待复核/已确认」问题时整批不可放行；严重问题不允许豁免；全部驳回或豁免（非严重）后放行解锁，否则导出问题清单退回供应方。

## 目录结构

```
src/
  geometry/   图元、轮廓、相交、布尔、SVG、检查、吸附(纯逻辑,可独立单测)
  editor/     文档工厂、Svelte rune store、撤销历史、排料/阵列
  render/     Canvas2D 渲染 + OffscreenCanvas 网格/光栅缓存
  workers/    批量图纸检查 Web Worker
  components/ 画布、顶栏、侧栏、复核面板、状态栏
tests/        单元测试 + Playwright E2E + 批量夹具
```

## 关键设计决策

1. **几何参数化、不展平做布尔**。圆弧和贝塞尔只在交点处按参数切分，切割后仍是同圆心弧/三次曲线，因此布尔结果天然保留原路径圆角；展平仅用于命中检测、面积和绘制采样。
2. **`commit()` 只快照不替换文档**。历史栈在入栈时深拷贝当前态，编辑器继续就地修改同一文档对象，避免「先入栈后改到旧引用」导致修改丢失的经典陷阱。
3. **渲染与逻辑解耦**。几何层不依赖 DOM/Svelte，全部可在 Node 下单测；渲染层每帧由 `requestAnimationFrame` 重绘，网格走 OffscreenCanvas 缓存。
4. **重活进 Worker**。批量图纸检查在 Web Worker 内运行，配合 OffscreenCanvas 光栅像素统计，不阻塞主线程画布交互。
