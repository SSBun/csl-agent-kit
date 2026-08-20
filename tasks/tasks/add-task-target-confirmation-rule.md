# 添加任务目标确认规则

Status: Completed (2026-08-20 16:02)
Kind: Task

## Target
- [x] T1: 全局 simple-rules 包含任务目标声明与显式确认门规则
- [x] T2: Task Target 声明与显式确认门迁移为 task workflow 的内置要求，并在 task 激活后、实质准备或执行前生效。
- [x] T3: 全局 agent-rules 中的重复规则移除，内置规则、dispatcher、路由用例与适用的非测试验证保持一致。
- [x] T4: `task` skill 明确要求用户可见的任务目标行使用准确格式 `**Task Target:** ...`。

## Plan

1. 确认内置要求的权威归属、宿主分发路径及现有确认规则消费者。
2. 将 Task Target 确认门纳入 task workflow，并同步 task-plan、task-queue、默认规则与路由契约。
3. 移除全局重复规则，完成 skill、Context、Lessons、格式和任务一致性验证。
4. 将 `task` skill 的用户可见任务目标格式明确为 `**Task Target:** ...`，并执行 skill 审计与格式检查。

## Result

- T1: 已读取 ~/.csl-agent-kit/simple-rules.md，确认新增规则包含 Task Target、可观察完成条件、显式确认等待及执行前禁止项。
- T2: task、task-plan 与 task-queue 的 SKILL.md 均在任务激活后、Context/Lessons/任务来源读取前声明 user-facing Task Target，并要求等待显式确认；super-agent 与内置 dispatcher 同步该稳定门禁。
- T3: ~/.csl-agent-kit/agent-rules.md 已移除 Task Target 重复条目；四组 routing eval precision/recall 均为 1.000，Yao、resource boundary、Context/Lessons、内置注入、规则结构与 git diff 检查满足门禁。
- T4: task/SKILL.md 第 34 行明确要求使用精确格式 **Task Target:** <intended outcome and observable completion condition>。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: Exact-format grep and git diff --check passed; Yao syntax, lint, and governance passed, with only the allowed workflow initial-load budget warning.
