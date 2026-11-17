# 岩土三维地层体素建模系统（Geo Voxel Studio）

面向岩土勘察院的三维地层体素建模工具。**原生 TypeScript + Web Components（Shadow DOM）**，视图层 **SVG + D3** 等轴测投影，零框架、仅 d3 一个运行时依赖。

## 快速开始

```bash
npm install
npm run dev        # 开发服务器 http://localhost:5173
npm run build      # 类型检查 + 生产构建（输出 dist/）
npm run preview    # 预览生产构建
```

### 测试

```bash
npx vite-node test/smoke.ts   # 44 项核心算法单元测试（合面/镜像/钻孔/剖面/导出/DDA）
npx vite-node test/perf.ts    # 64×64×32 目标规模性能基准

# 25 项浏览器端到端测试（无头 Chrome CDP 9222 + 生产 preview）：
#   1) npx vite build && npx vite preview --port 5247 --strictPort
#   2) chrome --headless=new --remote-debugging-port=9222 --user-data-dir=<临时目录>
node test/e2e.mjs             # 走 window.__gvs 自动化钩子，dev/preview 均可
node test/shot.mjs            # 生成三视图/剖面/工作流截图到 test/shots/
```

## 功能与代码对照

| 需求 | 实现位置 |
| --- | --- |
| 场地网格（默认 64×64×32，单格 1m，可配置） | `src/core/VoxelGrid.ts`（Uint8Array 稠密存储，0=空，材质 id 1..255） |
| 钻孔分层标高批量填充 | `src/core/BoreholeFiller.ts`（地面/层底标高 IDW 反距离加权插值，材质加权投票） |
| 单格/矩形/球形笔刷增删 | `src/core/VoxelGrid.ts` brushCoords + `src/ui/IsoView.ts`、`TopView.ts` |
| 等轴测投影 + 色阶图例 | `src/core/Isometric.ts`、`IsoView.ts`、`LegendPanel.ts` |
| 俯视/剖面切片联动高亮当前标高 | `TopView.ts`、`SliceView.ts`、`IsoView.ts`（橙色标高描边/扫描线，共用 EditorState 单一数据源） |
| X/Y 轴镜像，一侧改动另一侧同步 | `src/core/Mirror.ts`（双镜像展开四象限，去重） |
| 框选复制粘贴 + 整块平移 | `src/core/Clipboard.ts` + `Toolbar.ts` |
| 合并剔除内部面 + 同材质贪心合面 | `src/core/Mesher.ts`（三轴掩码扫描，横向+纵向贪心矩形合并） |
| 实时体素数/三角面数 | `StatBar.ts`（rAF 合帧，计数 + 实时重建 mesh） |
| 导出 OBJ / glTF / 配色表 | `src/core/Exporters.ts`（OBJ+MTL、glTF 2.0 二进制 GLB、CSV，零依赖 store ZIP 交付包） |
| 剖面线自动出剖面图 + 层厚表 | `src/core/Section.ts` + `SectionPanel.ts`（d3 剖面图，最小/最大/平均层厚统计） |
| 客户下单→制作员制作→主管审核退回（返工次数）→打包交付 | `src/state/ProjectStore.ts` 工作流状态机 + `ProjectList.ts`、`WorkflowBar.ts` |
| 撤销/重做、持久化 | `EditorState.ts`（60 步网格快照）、localStorage 项目库 |

## 架构

```
src/
├── core/                  # 纯逻辑层，无 DOM 依赖，可独立单测
│   ├── VoxelGrid.ts       # 体素网格、笔刷坐标、编辑原语
│   ├── Mesher.ts          # 内部面剔除 + 贪心合面（输出带法线四边形面）
│   ├── Isometric.ts       # 等轴测投影 + Amanatides–Woo DDA 体素射线拾取
│   ├── BoreholeFiller.ts  # 钻孔 IDW 插值填充
│   ├── Mirror.ts          # X/Y 镜像展开
│   ├── Clipboard.ts       # 框选/复制/粘贴/平移
│   ├── Section.ts         # 剖面采样与层厚统计
│   └── Exporters.ts       # OBJ / GLB / CSV / ZIP
├── state/
│   ├── EditorState.ts     # 编辑状态总线（单例）、撤销重做、镜像编辑
│   └── ProjectStore.ts    # localStorage 项目库 + 工作流状态机
└── ui/                    # Web Components（每个组件独立 Shadow DOM）
    ├── GvsElement.ts      # 组件基类（样式注入、h  hyperscript、生命周期）
    ├── GvsApp.ts          # 外壳：项目区/编辑器两屏、三视图联动布局
    ├── IsoView.ts         # SVG+d3 等轴测三维视图（画家算法深度排序、法线明暗）
    ├── TopView.ts         # 俯视平面图（框选、剖面线绘制、钻孔、镜像参考）
    ├── SliceView.ts       # 竖直 X/Y 切片
    ├── Toolbar.ts         # 笔刷/镜像/标高/切片/剪贴板
    ├── BoreholePanel.ts   # 钻孔条目与分层编辑
    ├── LegendPanel.ts     # 色阶图例与材质管理
    ├── SectionPanel.ts    # 剖面图 + 层厚表
    ├── WorkflowBar.ts     # 角色工作流与审核日志
    ├── StatBar.ts         # 实时计数与导出
    └── Toast.ts
```

### 关键设计

- **贪心合面**：对每个轴向的每层扫描生成 `(材质, 朝向)` 掩码，先在每行横向合并连续同材质段，再纵向合并同宽同材质段。实心 64×64×32 块（13 万体素）最终只有 **6 个大面 / 12 个三角形**；异材质相邻时接触面两侧都保留。
- **等轴测拾取**：屏幕点反投影为固定方向 `(-1,-1,-1)` 射线，用 DDA 步进找到第一个非空格与入射法线；增材落点在命中面外侧，擦除落点为命中格本身。
- **镜像**：任何笔刷坐标在写入前按开关展开为 2 或 4 个对称坐标（集合去重），因此俯视图与三维视图行为一致。
- **工作流**：`ordered → in_progress → submitted → delivered`，主管退回走 `rework` 并累加 `reworkCount`，全过程写审核日志。

## 性能（64×64×32，Node 实测）

| 场景 | 指标 |
| --- | --- |
| 12 钻孔 IDW 填充 114,688 体素 | ~113 ms |
| 地层场景合面（66 面 / 132 三角形） | ~45 ms |
| 满网格 131,072 体素合面 | ~53 ms → 6 面 / 12 三角形 |
| 棋盘格最坏碎片 16,384 体素（4,096 面） | ~19 ms |
| base64 序列化往返（171 KB） | ~9 ms |

## 快捷键

- `Ctrl/⌘ + Z` 撤销，`Ctrl/⌘ + Shift + Z` / `Ctrl+Y` 重做
- `Ctrl/⌘ + S` 保存项目
- 三维视图：左键绘制/擦除，滚轮缩放，平移工具拖拽画布
- 剖面线工具：俯视图逐点单击，**双击**结束生成
