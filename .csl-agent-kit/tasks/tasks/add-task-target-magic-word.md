# 添加 Task Target 自动确认魔法词

Status: Completed (2026-08-20 16:34)
Kind: Task

## Target
- [x] T1: 用户请求以独立末行 TASK_GO 结尾时，任务完成创建、恢复与聚焦后跳过 Task Target 的文本或界面确认并直接继续。
- [x] T2: TASK_GO 只作用于当前请求且只豁免 Task Target 确认；缺少该标记、仅提及该文本或需要其他必要确认时保留原有门禁。
- [x] T3: `/commit` 与 `/commit-all` 的 prompt 自动携带 `TASK_GO` 授权，使直接调用这两个命令时不再触发 Task Target 确认步骤。

## Plan

1. 将 `TASK_GO` 的精确匹配、单次作用域和豁免边界纳入三个 task workflow 及默认 lifecycle dispatcher。
2. 同步 Pi 确认工具提示、公开说明与静态契约检查，避免界面确认路径覆盖魔法词授权。
3. 执行 skill、规则、TypeScript 语法、格式与任务一致性验证；按用户规则不运行单元测试。
4. 将 `TASK_GO` 作为 `/commit` 与 `/commit-all` prompt 的最后一个非空行，并验证 Pi prompt template 格式与精确授权位置。

## Result

- T1: task、task-plan、task-queue、默认 AGENTS/dispatcher 与 Pi 工具 guidance 均声明独立末行 TASK_GO 会跳过界面和文本 Task Target 确认。
- T2: 契约将 TASK_GO 限定为原始顶层用户请求的区分大小写独立末行、仅作用一次、从任务意图排除，且不消除歧义或其他必要确认。
- T3: ~/.pi/agent/prompts/commit.md 与 commit-all.md 均以唯一独立末行 TASK_GO 结尾，直接展开命令时会携带本次 Task Target 授权。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 按 Pi prompt-templates 文档核对两份全局 Markdown prompt；确定性检查确认 frontmatter 存在、TASK_GO 各出现一次且均为最后非空行；按用户规则未运行单元测试。
