# 统一任务索引新格式提示约束

Status (2026-07-29 13:49): Completed

## Target

- [x] T1：`workspace-manage-task` 明确要求新建或重新打开的任务使用新的任务索引条目格式和任务正文状态格式。
- [x] T2：完成最小确定性校验，确认新增规范包含状态、时间戳、任务链接位置以及新旧任务迁移边界。
- [x] T3：提供可执行检查，接受与 canonical task 标题、状态和时间戳一致的新格式索引条目，并拒绝目标任务的旧格式或不一致记录。
- [x] T4：工作流要求 Agent 在新建、重新打开或更新任务索引后运行该检查，同时不强制迁移未触及的历史条目。

## Plan

1. 增加只校验指定 canonical task 对应索引项的最小脚本，避免旧历史记录阻塞当前任务。
2. 在工作流中加入强制运行点，并为有效、旧格式和状态不一致场景补充回归测试。
3. 运行任务测试、Skill 审计和资源边界检查。

## Result

- T1：[`workspace-manage-task/SKILL.md`](../../skills/workspace-workflow/workspace-manage-task/SKILL.md) 现在要求新建任务使用普通文本标题、末尾任务链接和 `Status (<YYYY-MM-DD HH:MM>): <state>` 状态行；索引与正文必须保持状态和时间戳一致。
- T2：`npm run test:tasks` 通过 13/13；OpenAI quick validation、Yao syntax/frontmatter、lint 和 governance 均通过；resource boundary 仅报告该 skill 允许的初始加载 token 超限（1945/1000）。
- T3：[`check-task-index.js`](../../skills/workspace-workflow/workspace-manage-task/scripts/check-task-index.js) 会按指定 canonical task 校验索引项结构、标题、状态、时间戳和链接；回归用例确认旧目标格式、状态/标题不一致及无效时间均失败。
- T4：[`workspace-manage-task/SKILL.md`](../../skills/workspace-workflow/workspace-manage-task/SKILL.md) 要求每次同步索引后立即运行检查；回归用例确认未触及的旧格式兄弟条目不会阻塞，且实际任务记录检查通过。
- Review gate: Skipped — no explicit user request.
