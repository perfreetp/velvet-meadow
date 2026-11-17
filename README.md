# 花型矢量工作台 · Floral Vector Studio

面向花艺工作室出方案的矢量花型编辑器。SolidJS + Canvas2D 主编辑区,Paper.js 无头几何引擎做布尔运算,Babylon.js 三维花束预览,localStorage 持久化。

## 运行

```bash
npm install
npm run dev        # 开发,默认 http://127.0.0.1:5173
npm run build      # 生产构建
npm run preview    # 预览生产产物
node tests/smoke.mjs   # 端到端冒烟测试(需先起 dev server)
```

## 四个界面

| 界面 | 职责 |
| --- | --- |
| 方案管理 | 方案卡片、新建/删除、进入编辑与审核入口、定稿与批注状态总览 |
| 方案编辑 | Canvas2D 主画布 + 右下角 Babylon 3D 预览,全部绘图/布尔/图层/版本操作 |
| 版本审核 | 版本列表、打点/圈选批注、逐条回复与清零、定稿拦截、两版叠加对比 |
| 客户档案 | 门店、联系人、节庆主题、交付与刀版备注登记 |

## 功能与实现对照

- **钢笔自由曲线**:单击加锚点,Shift 吸附水平/垂直/45°,回车或双击闭合,右键留开放路径
- **节点编辑**:节点工具下点线段插节点、拖节点/贝塞尔手柄、直线段↔曲线段互转、删节点(最少保留 3 个)
- **布尔运算**:并集/差集/交集/异或,多操作数包成 CompoundPath 交给 Paper,结果转回自有节点模型,**保留可编辑节点**
- **去重叠边**:对重叠叶片做并集,内部重合边被消除
- **吸附**:钢笔 H/V/45° 角度吸附;移动时对象边缘与中心对齐吸附,横纵独立,显示红色参考线
- **图层树**:分组、显隐、锁定(图层锁定级联到图元),图元可单独锁定、调整层级与归属
- **撤销重做**:命令快照式,上限 100 步(需求 ≥50),拖动类交互合并为单步
- **标注**:画布上每个图元标注花材编号与实测尺寸(mm)
- **SVG 导出**:嵌套 `<g>` 保留图层分组与图元命名,带 `data-material-code`、`data-width-mm/height-mm`,供包装厂做刀版
- **版本**:每次提交生成不可变新版本,未清零批注自动继承到新版
- **审核闭环**:审核人打点/圈选写批注 → 制作方逐条回复(待处理/已回复/已清零)→ **批注未清零禁止定稿**
- **差异对比**:编辑器与审核页均可把任一旧版轮廓(橙色虚线)叠加到当前视图
- **3D 预览**:Babylon ArcRotateCamera 可拖拽旋转/滚轮缩放,每个闭合路径 ExtrudePolygon 拉伸成带厚度的实体
- **客户档案**:门店、节庆主题、交付日期、刀版要求备注

## 架构

```
src/
├── lib/
│   ├── geometry.js   自有路径模型 ↔ Paper 桥接、布尔、节点、命中、采样、图元工厂
│   ├── snapping.js   角度吸附 + 包围盒对齐吸附 + 参考线
│   ├── svgExport.js  分组/命名/标注保留的 SVG 刀版导出
│   ├── store.js      Solid store + 历史栈 + 版本/批注/客户 + localStorage
│   └── constants.js  常量、工具、深拷贝(注:Solid Proxy 不能用 structuredClone)
├── components/
│   ├── EditorCanvas.jsx   Canvas2D 指针/键盘交互、全部工具状态机
│   ├── drawScene.js       纯绘制层(网格/路径/节点手柄/参考线/批注/叠加)
│   └── BabylonPreview.jsx 右下角 3D 预览(earcut 注入 + WebGL 降级)
└── views/              四个界面
```

### 关键技术点

- **Paper.js 用 paper-core 而非 paper-full**:full 版带 acorn,UMD 在浏览器 ESM 下加载失败
- **布尔操作数**:Paper 的 `unite/subtract/intersect/exclude` 只接受单个 path,多个先合成 `CompoundPath`
- **Babylon 按需导入**:`Vector3` 在 `Maths/math.vector.js`,`MeshBuilder` 在 `Meshes/meshBuilder.js`;ExtrudePolygon 依赖全局 `earcut`,需手动注入 `globalThis.earcut`
- **深拷贝**:Solid store 是 Proxy,`structuredClone` 抛 DataCloneError,统一用 JSON 深拷贝(数据全为纯 JSON 类型)
- **历史栈**:`beginInteraction/endInteraction` 让一次拖拽只产生一个撤销点
