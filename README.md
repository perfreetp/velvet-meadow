# 注塑机零件图册 · 分层浏览(WebGPU)

面向注塑机售后场景的零件图册 Web 应用。一台机器的装配图拆成 **机身 / 锁模 / 射出 / 液压 / 电气** 五个图层,合计 **2250 个零件、55,000+ 图元与标注**,使用 **Svelte 5 + WebGPU** 实现。

## 运行

```bash
npm install
npm run dev      # 开发(默认 5173,被占用时自动顺延)
npm run build    # 构建到 dist/
npm run preview  # 预览构建产物
```

需要支持 WebGPU 的浏览器(Chrome / Edge 113+,开启硬件加速)。

## 功能对照

| 需求 | 实现 |
| --- | --- |
| 五图层、两万+图元 | `src/lib/data/catalog.js` 确定性生成 5×450 零件,每零件含轮廓/细线/剖面线/尺寸标注四类图元 |
| 视口裁剪 | 均匀网格空间索引(`spatial.js`),每帧只把可见零件的顶点区间作为 draw 调用提交,顶栏实时显示提交图元数 |
| 缩放 LOD | 远处(scale<0.35)只提交轮廓;中景加细线;放大(scale≥1.2)才画剖面线和尺寸标注 |
| 悬停高亮 | 网格拾取 + 多边形包含测试;着色器内悬停零件变橙、其余淡出至 0.12 透明度 |
| 点选弹出 | 右侧信息卡:件号、名称、材质、互换机型、被查看统计 |
| 相邻零件定位 | 信息卡列出同图层最近 4 个零件,点击相机飞行定位 |
| 图层开关/透明度 | 左侧面板,滑杆拖动逐帧生效(uniform 每帧更新) |
| 框选对比 | 顶栏「框选对比」进入框选模式,拖框选最多 12 个零件生成对比清单,行悬停联动图纸高亮 |
| 鹰眼图 | 右下角 Canvas2D 鹰眼,白框同步当前视野,点击/拖动跳转 |
| 后台维护与审核 | 运营在「后台管理 → 图层归属」编辑(草稿)→ 提交审核;切到技术主管角色在「版本审核」发布/驳回;发布后顶点缓冲就地更新 |
| 查看统计 | 点选计查看次数,悬停/选中累计停留时长,localStorage 持久化,后台「查看统计」Top100 |

## 架构

```
src/
  App.svelte                  主循环:相机、裁剪、LOD、拾取、框选、标注叠加层
  lib/
    data/catalog.js           图册数据生成 + 顶点装配([x, y, partId, kind|layer<<2] 交错布局)
    data/spatial.js           均匀网格索引(裁剪与拾取共用)
    render/Renderer.js        WebGPU 线段渲染器(WGSL,line-list,uniform + storage 标志位)
    stores/state.js           Svelte stores + localStorage 持久化(草稿/版本/统计)
    components/               Toolbar / LayerPanel / InfoCard / ComparePanel / Minimap / AdminPanel
```

渲染要点:全部 5.5 万线段图元一次性上传单个顶点缓冲;每帧 CPU 侧用网格索引做视口裁剪并按缩放级别选择图元类别,只提交可见区间;悬停/选中/框选状态通过每零件标志位 storage buffer 在顶点着色器内着色,无需重建几何。文字(件号、尺寸数值)由上层 Canvas2D 叠加层按同一相机变换绘制。

## 测试

```bash
node smoke.mjs   # 需本机 Chrome;自动验证渲染、LOD、点选、框选、图层开关、审核流、统计
```
