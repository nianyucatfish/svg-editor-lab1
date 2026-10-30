# SVG Editor CLI — Lab1

高级软件开发技术个人 Lab，使用 TypeScript 实现 SVG 命令行编辑器。

仓库：https://github.com/nianyucatfish/svg-editor-lab1

当前阶段：第三步，Phase 1 全部命令已实现；自动化检查完成，浏览器渲染等待人工目视确认。

## 材料与文档

- [原始作业要求](phase_cli_1.md)
- [课程页面提交说明](作业页面说明.md)
- [架构与开发记录](doc/README.md)

## 阶段计划

1. 确定架构、依赖方向和待澄清语义。
2. 建立 TypeScript 工程，实现图形模型与 Composite 容器。
3. 实现 Command、编辑操作及 undo/redo。
4. 实现 CLI、SVG 读写与显示。
5. 验证要求、完成文档与一致性自查，再打 final 标签。

每阶段按实际开发过程提交并推送，保留与 AI 协作中的关键判断和修订。

## 运行

需要 Node.js 24（本机已验证 v24.20.0）。

```sh
npm install
npm run check
npm test
npm run cli
```

终端逐行输入命令，Ctrl+D 退出。支持双引号字符串、引号内的转义双引号和反斜杠，以及整行 `#` 注释。

### 命令示例（已纳入自动化测试）

```text
help
init 800 600
create g flowchart
create g node1 in flowchart
create rect start 120 100 160 60 #4a90d9 in node1
create text start-label 155 135 "开始" in node1
create circle dot 30 30 10 red
create ellipse oval 60 60 20 10
create line edge 0 0 100 100 black
tree
show start
canvas
create circle start 1 2 3
create rect invalid 0 0 -1 20
create text missing-parent 0 0 "test" in missing
tree
```

预期：前面的图形正确出现，node1 包含矩形和文字；最后三个创建操作报错，再次 tree 时没有新增图形。启动时无文档与未闭合双引号的错误处理也由自动化测试验证。

## 第二步：编辑与历史

已支持 `move`、`scale`、`set`、`delete`、`group`、`ungroup`、`addto`、`front`、`back`、`undo`、`redo` 及 `canvas w h`。

- 每次编辑是一个 Command 撤销单元；失败不改变画布或历史。
- 容器移动与缩放递归处理子孙；几何缩放同时影响位置与尺寸。
- 容器的 fill/stroke 是 SVG 继承属性，不改写子孙显式设置的颜色。
- group 按原文档深度优先顺序收集成员，放在原顺序第一个成员所在父容器及位置；这是对跨父容器分组规则的明确选择。
- front 移至同级最后一个 SVG 节点（绘制在前）；back 移至第一个节点。
- 根级容器不能 ungroup，这是附件的明确要求。
- init 和 canvas 修改尺寸清空历史并建立撤销屏障；查询不会影响历史。
- 当前撤销使用文档快照，时间与空间成本随文档大小增长，适用于本阶段的小型文档。

## 第三步：SVG 文件读写

- `read <file.svg>`：读取六种内置类型，先扫描已有 ID，再为缺失 ID 分配“标签+序号”，逐项打印警告。
- `save [file.svg]`：无参数保存到最近一次 read/save 的路径；init 后需重新指定路径。
- 成功 read/save 会清空历史并设置撤销屏障；失败保留画布、路径和历史。保存使用同目录临时文件加 rename，避免中途失败覆盖旧文件。
- 保留嵌套层级、公共样式、常见字体与透明度属性；XML 特殊字符由 DOM 序列化器处理。
- 支持背景示例中的 translate 和正数等比 scale，读入时归一化到几何坐标，并调整文字字号及描边宽度。支持同宽高比 viewBox 的原点和等比变换。
- 当前是六类图形的 SVG 子集：不支持 path、CSS style、旋转、非等比缩放、tspan、百分比尺寸或不同宽高比 viewBox；遇到这些内容明确拒绝读取，保留原文档。支持数值和 px 几何长度。
- `data-kind="box"` 作为普通 g 容器读入，本阶段不实现 box 插件。

回放附件流程图并输出 SVG：

```sh
npm run cli < examples/flowchart.commands
```

其中 save 后的 undo 报错是预期验证。脚本随后读取附件示例，打印补 ID 警告和结构树。

### 浏览器目视检查

在浏览器中打开 `examples/flowchart.svg`：应看到左蓝右橙两个节点、节点文字和中间连线；右节点文字为“处理数据 v2”。原始命令未指定箭头标记，连线是一条普通直线。

`examples/transforms.svg` 来自附件背景示例，可用 read/save 导出后对比整体平移和缩小效果。
