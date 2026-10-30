# SVG Editor CLI — Lab1

高级软件开发技术个人 Lab，使用 TypeScript 实现 SVG 命令行编辑器。

仓库：https://github.com/nianyucatfish/svg-editor-lab1

当前阶段：第一步，已实现画布、六种图形创建、嵌套容器和查询。编辑变换、撤销重做与 SVG 读写尚未实现。

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

## 运行（第一步）

需要 Node.js 24（本机已验证 v24.20.0）。

```sh
npm install
npm run check
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

第一步只提供 canvas 尺寸查询。完整命令和 undo/redo 将在后续阶段实现。
