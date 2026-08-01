# 让新用户目标默认创建独立任务

Status: Completed (2026-08-01 13:43)

## Scope

- 调整 `workspace-manage-task` 对新建与重新打开 canonical task 的判定边界。
- 保留同一交付结果的真实修正、补全和重新验证可以重开旧任务；不改变任务字段、状态格式或审查门禁。

## Target

- [x] T1：新的用户请求只要形成可独立验收的 outcome，就默认创建新 canonical task；同一组件、文件或主题不足以复用旧任务，无法确定时也创建新任务。
- [x] T2：只有当前请求直接修正、补全或重新验证旧任务的同一交付结果，且不处理会让旧 Result 失真时，才重新打开旧任务。
- [x] T3：数据化决策样例和回归测试同时覆盖 New 与 Reopen，包括发布后 CI 失败、文档纠错、同组件新功能、新会话独立改进和歧义场景。
- [x] T4：任务工作流的聚焦测试、格式检查、Skill 校验与资源边界检查通过或仅保留已允许的 token 预算超限。

## Plan

1. 收窄任务 ownership 与 completed-task reopening 契约。
2. 增加 New/Reopen 决策 fixture，并让测试验证双向边界。
3. 同步稳定工作区约定并运行工作流验证。

## Result

- T1：`workspace-manage-task` 现在明确要求每个可独立验收的新用户 outcome 默认创建新 canonical task；组件、文件、主题或实现重叠不能建立 ownership，歧义场景固定选择 New。
- T2：旧任务只有在请求直接修正、补全或重新验证同一 outcome，且保持现有 Target/Result 会造成不完整或误导时才拥有该请求；completed task 仅在这一边界成立时重开。
- T3：新增 7 个 ownership cases；`npm run test:tasks` 通过 14/14，覆盖 release CI 与文档纠错的 Reopen，以及同 skill 新行为、同组件新功能、新会话独立改进和歧义场景的 New。
- T4：Skill Creator quick validation 通过；Yao syntax/frontmatter、lint 和 governance 通过，resource boundary 仅保留 workflow skill 已允许的初始加载 token 超限（2058/1000）；task index 检查与 `git diff --check` 通过。
- Review gate: Skipped — no explicit user request.
