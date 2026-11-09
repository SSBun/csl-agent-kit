# 删除孤立的 Workspace Workflow Evals

Status: Completed (2026-08-27 15:15)
Kind: Task

## Target
- [x] T1: 孤立的 skills/meta/workspace-workflow 目录及 README 中对应的现行布局说明已删除，仓库中不再有该路径的当前消费者或引用。
- [x] T2: 使用内置 skill-quality 对全部可发现的现有 Skill packages 执行全仓检查，并记录 pass、warning、failure 汇总及所有 warning 或 failure。

## Scope

- 仅删除无消费者的共享 routing fixtures 目录及 README 中对应的现行布局说明；历史任务与报告中的路径叙述保留为历史证据。
- 全仓检查发现的既有 warning 只记录，不为消除 warning 扩大修改范围；failure 会阻塞完成并按归属单独处理。

## Plan

1. 删除孤立目录和 README 现行布局条目。
2. 搜索并确认旧路径只剩历史记录或明确负向断言。
3. 使用内置 skill-quality 执行全仓检查，记录完整汇总并完成任务门禁。

## Result

- T1: 已删除孤立目录及 README 布局条目；当前 README、skills、tests、manifests、CLI、Pi、hooks 与 super-agent 范围内旧路径搜索为 0，剩余命中仅为历史记录和本任务。
- T2: skill-quality 全仓检查覆盖 28 packages：14 pass、14 warning、0 failure。context-budget warnings：adversarial-review 1337、bug-fix 1104、deliberate 1824、agent-hooks 1463、agent-sops 2092、task 2434、task-context 3555、task-lessons 2612、task-plan 1416、task-queue 1466；missing-interface warnings：beautiful-mermaid、create-app-icon、figma-describe、venom-cli。
- Review gate: Skipped — 用户未请求独立审查；已检查路径消费者、历史边界、删除范围和全仓质量报告。

## Verification

- Passed: 目录不存在、当前消费者搜索为 0、skill-quality 全仓结果为 14 pass/14 warning/0 failure，task check 与 git diff --check 通过；未运行单元测试或项目测试套件。
