# 移除 Pi Task Target 确认界面

Status: Completed (2026-08-20 17:22)
Kind: Task

## Scope

- 移除 `task_target_confirm` 工具及其 UI、文档和测试契约；保留现有任务浮层、Session focus 与 `TASK_GO` 快捷确认。

## Target
- [x] T1: Pi 不再提供 Task Target 确认弹窗，task、task-plan 与 task-queue 恢复通过传统文本消息请求确认，并通过相关静态与结构校验。

## Plan

1. 删除 Pi 扩展中的 Task Target 确认工具及其专属测试和 README 描述。
2. 将三个任务 workflow 与默认 dispatcher 统一为 `TASK_GO` 或传统文本消息确认。
3. 同步相关契约断言和 Context Packs，运行非测试类静态、格式与 skill package 校验。

## Result

- T1: `task_target_confirm` 已从 Pi 扩展生产代码移除；三个 task workflow 与默认 dispatcher 仅保留 `TASK_GO` 或 `**Task Target:**` 文本回复路径，静态扫描无确认 UI 生产引用。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: Context 校验、TypeScript/JavaScript 语法、静态契约与 git diff 检查通过；local quality gate syntax/lint/governance 通过，仅有规则允许的初始加载 token 预算超限。按用户规则未运行测试套件。
