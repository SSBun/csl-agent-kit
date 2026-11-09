# 统一任务索引新格式提示约束

Status: Completed (2026-07-31 17:35)

## Target

- [x] T1：`workspace-manage-task` 明确要求新建或重新打开的任务使用新的任务索引条目格式和任务正文状态格式。
- [x] T2：完成最小确定性校验，确认新增规范包含状态、时间戳、任务链接位置以及新旧任务迁移边界。
- [x] T3：提供可执行检查，接受与 canonical task 标题、状态和时间戳一致的新格式索引条目，并拒绝目标任务的旧格式或不一致记录。
- [x] T4：工作流要求 Agent 在新建、重新打开或更新任务索引后运行该检查，同时不强制迁移未触及的历史条目。
- [x] T5：任务索引和 canonical task 状态格式与 Pi todo extension 当前读取格式一致，新建或重新打开的任务能显示在 overlay 中。
- [x] T6：可执行检查与回归测试接受 extension 兼容格式，并拒绝此前造成 overlay 无法读取的格式或不一致记录。

## Plan

1. 以 Pi todo extension 的解析契约为准，修正 workflow 的索引和正文状态格式。
2. 同步最小检查脚本与任务回归测试，覆盖兼容格式和旧冲突格式。
3. 运行任务测试、Pi overlay 测试、Skill 审计和资源边界检查。

## Result

- T1：[`workspace-manage-task/SKILL.md`](../../skills/workspace-workflow/workspace-manage-task/SKILL.md) 现在要求索引使用 `- [任务标题](todo/task-slug.md) — <state> (<YYYY-MM-DD HH:MM>)`，正文使用 `Status: <state> (<YYYY-MM-DD HH:MM>)`。
- T2：`npm run test:tasks` 通过 13/13，覆盖状态、时间戳、标题、链接与未触及历史记录边界。
- T3：[`check-task-index.js`](../../skills/workspace-workflow/workspace-manage-task/scripts/check-task-index.js) 接受 extension 兼容格式，并拒绝此前的普通文本标题格式、状态或标题不一致及无效时间。
- T4：workflow 继续要求每次同步后校验指定 canonical task；当前任务的 In Progress 与 Completed 状态迁移均通过检查。
- T5：`npm run test:pi` 通过 7/7，`node --experimental-strip-types pi/extensions/csl-task-overlay.ts --check` 通过；索引样例与 extension 的 `INDEX_LINE`/`parseStatus` 契约一致。
- T6：Skill Creator quick validation 通过；local quality gate syntax/frontmatter、lint 和 governance 通过，resource boundary 仅保留允许的初始加载 token 超限（1942/1000）；旧冲突格式只剩历史记录和明确拒绝用例。
- Review gate: Skipped — no explicit user request.
