# 为 Pi 任务与 Topic 分区标题添加索引链接

| Field | Value |
| --- | --- |
| Status | Completed (2026-10-15 16:48) |
| Kind | Task |

## Plan

1. 复用现有 OSC 8 超链接与 file URL 编码，只链接分区标题。
2. 同步标题链接断言，检查语法、差异和纯文本回退。

## Task Summary

**Pi 扩展**：["/Users/caishilin/Desktop/personal/skills/pi/extensions"](file:///Users/caishilin/Desktop/personal/skills/pi/extensions) 为 Tasks、Workspace、Topics 标题增加工作区索引文件链接；This Session 标题保持不变。

**回归用例**：["/Users/caishilin/Desktop/personal/skills/tests"](file:///Users/caishilin/Desktop/personal/skills/tests) 增加三个标题的 OSC 8 目标断言。

## Decisions

- 沿用终端文件链接行为，不创建浮窗或修改索引内容；非 TUI/不支持超链接时保持纯文本。
- 两份变更文件 node --check 及限定 git diff --check 通过；静态核对三个标题、cwd 传递和 capability 分支。未执行单元测试，未实测 GUI 点击。
- 内容标识：扩展 SHA-256 48f1fdfa21f48aa5f6fb621a5f4beecb1ec2ebc53506250e7d1a6f7800a0e54a；测试 SHA-256 e7d9a8fc5b256c49d6d1edbc75f505039180676f02f0d59f4e508783d42df65c。

## Target
- [x] T1: Tasks/Workspace 分区标题链接到当前工作区任务索引，Topics 标题链接到当前工作区 Topic 索引，使用现有终端文件链接打开方式。
- [x] T2: 保持现有列表、布局、当前项高亮和条目链接；不支持超链接的环境保持纯文本，不新增浮窗或管理操作。

## Result

- T1: 静态核对 Tasks/Workspace 使用 cwd/tasks/tasks.md，Topics 使用 cwd/tasks/topics.md；均经 pathToFileURL 与原 hyperlink 编码，新增对应断言。
- T2: 差异仅涉及标题链接与 cwd 传递，布局及条目链接未变；linkTitles=false 返回原标签；两份文件语法与差异检查通过。
- Review gate: Skipped — R1：局部标题链接，静态核对与语法检查充分覆盖本次路径映射和回退，不声称实测外部应用。
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R1
- State: Current
- Reason: 复用既有文件链接，只改变三个标题展示，无状态或数据写入。
- Snapshot: extension:48f1fdfa21f48aa5f6fb621a5f4beecb1ec2ebc53506250e7d1a6f7800a0e54a;tests:e7d9a8fc5b256c49d6d1edbc75f505039180676f02f0d59f4e508783d42df65c
- Evidence: node --check 与限定 git diff --check 通过，三个调用点、路径及无超链接分支静态核对。
- Result clarity: 三个标题与两个固定索引目标一一对应。
- Bounded impact: 仅标题字符串包装与组件 cwd 传递。
- Low risk: 导航展示无文件写入或状态变更，可直接回退。
- Sufficient verification: 检查所有标题调用点及 capability 分支，复用已存在的 URL/OSC8 API；语法通过，未执行测试或 GUI 点击。
- Task fingerprint: 9769aab03a479cb6bf226886094224e3fb1ffec5d93f8705753602ba6574bacc

## Verification

- Passed: 当前文件 SHA-256 与 assessment 相符；语法和差异检查通过，标题目标与回退经静态核对；未运行单元测试。
