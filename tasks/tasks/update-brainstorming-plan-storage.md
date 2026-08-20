# 调整 brainstorming 计划文件存储与任务关联

Status: Completed (2026-08-20 11:22)
Kind: Task

## Target
- [x] T1: brainstorming skill 仅在需要持久计划文档时将文件写入 tasks/plans/，且不再指向 docs/plans/。
- [x] T2: 当计划文件与现有 canonical task 直接相关时，skill 要求在对应 tasks/tasks/<task-slug>.md 中记录该文件引用。

## Plan

1. 收紧独立计划文件的创建条件，并将目标目录改为 `tasks/plans/`。
2. 为直接相关的 canonical task record 增加相对链接要求。
3. 验证 skill package 结构、资源边界与最终 diff。

## Result

- T1: 检查 SKILL.md：独立计划仅在明确请求或需要持久 handoff 时创建，目标路径为 tasks/plans/，且已无 docs/plans/ 引用。
- T2: 检查 SKILL.md：相关 canonical task 的 Plan 段必须记录 ../plans/... 相对链接并执行 task sync/check，且不会仅为引用新建任务。
- Review gate: Skipped — 用户未要求独立 Reviewer 审查。

## Verification

- Passed: 语义断言、git diff --check、Yao validate 与 resource boundary check 均通过；仅有非阻塞治理/资源组织警告。
