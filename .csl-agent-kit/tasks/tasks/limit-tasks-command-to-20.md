# 限制 /tasks 只显示最近 20 个任务

Status: Completed (2026-08-20 14:50)
Kind: Task

## Scope

- 仅限制 Pi `/tasks` 命令的对话输出；不改变任务索引解析、TUI widget、focused task 分组或 RPC 数据。

## Target
- [x] T1: Pi 的 /tasks 命令最多显示任务索引中的前 20 条，并保持现有排序与行格式。
- [x] T2: TUI widget、session focus 与 RPC 行为保持不变。
- [x] T3: 聚焦的非测试验证证明第 20 条保留、第 21 条不输出，且未改动无关工作区内容。

## Plan

1. 定位 `/tasks` 命令从 canonical index 到对话输出的调用路径。
2. 在命令边界添加最小 20 条截断，不触碰共享解析与其他消费者。
3. 用非测试命令验证边界、格式和未受影响路径，并检查差异。

## Result

- T1: `/tasks` 在命令边界对 newest-first 索引执行 `slice(0, TASKS_COMMAND_LIMIT)`，常量为 20，随后沿用原有分组和行格式。
- T2: 差异仅改变 `/tasks` handler、说明和自检；`renderRows`、focus、refresh 与 RPC 路径未改。
- T3: 直接扩展自检通过；临时 21 条索引调用真实 `/tasks` handler 时 Task 20 可见、Task 21 隐藏；Context validate 与 git diff checks 通过。按用户规则未运行单元测试。
- Review gate: Skipped — 用户未要求 adversarial review、双 Agent 闭环或独立批准。

## Verification

- Passed: `node pi/extensions/csl-task-overlay.ts --check` 与真实 handler 边界脚本通过；Context 有效、无 whitespace diff、无 staged files；未运行单元测试。
