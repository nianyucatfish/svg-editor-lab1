# SVG Editor CLI — Lab1

高级软件开发技术个人 Lab，使用 TypeScript 实现 SVG 命令行编辑器。

仓库：https://github.com/nianyucatfish/svg-editor-lab1

当前阶段：第二步，已实现图形编辑、组合操作和撤销重做。SVG 读写尚未实现。

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

### 手动验收

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

预期：前面的图形正确出现，node1 包含矩形和文字；最后三个创建操作报错，再次 tree 时没有新增图形。另请在刚启动时输入 tree，确认提示需要先 init/read；输入未闭合双引号后，应报错且能继续输入下一条命令。

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

自动化测试由开发端执行；需要浏览器目视确认的 SVG 渲染留待文件读写阶段。

