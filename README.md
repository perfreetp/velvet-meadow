# 型腔粗坯体素建模工具

面向注塑模具厂模具设计组的型腔粗坯分层体素建模工具。Svelte 5 + Canvas2D + OffscreenCanvas（Worker 内软件光栅器，不依赖 WebGL）。

## 启动

```bash
npm install
npm run dev      # 开发，默认 http://localhost:5173
npm run build    # 生产构建
npm test         # 核心逻辑单元测试（node:test，12 项）
```

## 功能与需求对照

| 需求 | 实现 |
| --- | --- |
| 模仁毛坯按 0.5mm 一格切分层体素场 | `voxel/core.js` 二值场，建档时按尺寸换算 nx/ny/nz，1=型腔 0=钢料 |
| 左侧层列表逐层显示/隐藏/锁定 | `LayerList.svelte`，隐藏层只读预览、锁定层不可写 |
| 切片高度拖动预览当前层 | 层滑块 + 上下层按钮，高度按 0.5mm 递增 |
| 画笔/擦除堆体素 | `SliceCanvas.svelte` Canvas2D，圆盘画笔，支持拖拽连画、半径调节 |
| 沿 X / Y 轴镜像对称编辑 | `mirrorSet` 同时写对称格，画布显示镜像轴与落点预览 |
| 框选复制粘贴 + 偏移量 | `selection.js`，矩形框选、层范围、X/Y/Z 格偏移（含毫米换算）、union/replace 两种粘贴 |
| 铣刀死角标色 | `deadangle.js` 三轴开粗可达性：圆盘刀具腐蚀 + 刀长限制，2D/3D 红色标色、分层角标 |
| 相邻体素合并成网格 | `mesh.js` 六方向贪心矩形合并共面 Quad，再焊接顶点转三角网格 |
| 面数超 30 万按角度阈值减面 + 前后对比 | 边折叠减面（法线夹角 ≤ 阈值才折叠），统计面板显示减面前后三角形数、降幅、折叠次数 |
| 导出模型带外形尺寸 | OBJ 文件头注释写模号/料号/版本/外形尺寸/体素规格 |
| 建模过程按编号建档 | IndexedDB `versions` 表，每版 RLE+varint 快照、自增版本号 |
| 调出上一版叠加看差异 | `diffFields` + Worker 分色叠加（绿=本版新增，橙=上一版已移除） |
| 归档后按模号/料号/日期检索 | IndexedDB 索引 + `searchArchive` 多条件查询 |
| 工艺员提交、组长通过/退回 | 角色切换 + 版本状态机 draft→submitted→approved/rejected，退回意见挂版本 |

## 架构

```
src/
  lib/voxel/
    core.js       体素场、RLE+varint 快照、镜像/画笔/框选原语（零 DOM）
    mesh.js       贪心 Quad 合并、三角化、角度阈值边折叠减面、OBJ 导出
    deadangle.js  三轴铣削可达性/死角分析
    selection.js  复制粘贴、版本差异
    history.js    RLE 快照撤销/重做栈（50 步）
    render3d.js   纯软件光栅器（深度缓冲、Lambert、近平面裁剪、背面剔除）
    math3d.js     向量/矩阵/轨道相机
    db.js         IndexedDB：项目、版本、审批、归档检索
    worker3d.js   OffscreenCanvas Worker 的 Promise 化客户端
  workers/
    view3d.worker.js  持有 OffscreenCanvas，网格构建/减面/渲染/导出全在 Worker
  components/     Svelte 5 runes 组件（Home/Workspace/SliceCanvas/View3D/LayerList/ToolPanel/VersionPanel）
  lib/editor.svelte.js  全局编辑现场编排
test/           node:test 单元测试 + 渲染集成测试
scripts/        CDP 端到端冒烟脚本（无头 Edge 驱动真实交互）
```

### 关键设计

- **Worker 边界**：所有重计算（网格提取、减面、软件渲染）在 OffscreenCanvas Worker 内，主线程只做 2D 切片编辑，不卡顿。
- **代理脱壳**：Svelte 5 `$state` 深度代理带信号符号，无法结构化克隆。跨 Worker/IndexedDB 边界前用 `plainDims/plainStats/plainProject` 显式字段映射。
- **内存**：体素场用 `Uint8Array`；版本快照用 RLE+varint 压缩，稀疏型腔体积远小于原始字节。
- **减面性能**：Set 邻接表 + 法线懒缓存 + 二叉堆版本判旧 + 周期重建 + 平行边合并。32 万体素棋盘格（38 万面→30 万面）约 5 秒，在 Worker 内不阻塞 UI。

## 死角分析模型

模拟三轴立铣刀从 +Z 自上而下开粗：
- 刀具半径决定侧刃可进入的最小横向开口（圆盘腐蚀）
- 有效刀长决定最大加工深度（超深判死）
- 型腔中刀具不可达格 = 死角，建议拆电极 EDM 或改工艺

## 数据持久化

全部存浏览器 IndexedDB（库名 `mold-voxel-studio`），无后端。`projects` 表按模号/料号/归档日期建索引，`versions` 表按项目关联，存 RLE 快照与审批意见。
