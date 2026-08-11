# 精简默认 Agent 原则

## 计划

- [x] 从默认 `AGENTS.md` 模板删除 Plan Mode 和 Subagent Strategy 两节，并连续重编号。
- [x] 保留所有文件修改必须写 `tasks/todo.md` 的规则及 context 日常维护例外，记录已确认的长期决策。
- [x] 验证模板内容、`~/.agents/AGENTS.md` 软链接生效情况和 diff，并运行 Yao 规则审计。

## 复核

- 删除了 `Plan Mode Default` 和 `Subagent Strategy`；默认规则不再规定何时进入 plan mode 或调用 subagent。
- 保留所有文件修改或非简单任务必须先写 `tasks/todo.md` 的要求，并保留 context 日常维护的唯一例外。
- 将剩余章节连续调整为 1–7，未改动其他原则内容。
- 已把确认后的组件来源与长期决策沉淀到 `tasks/context.md`，并记录 todo、plan mode、subagent 的职责边界 lesson。
- 验证目标章节已删除、todo/context 规则仍存在、`~/.agents/AGENTS.md` 解析到更新后的模板，`git diff --check` 通过。
- 已运行 Yao 审计：lint、governance 和 resource boundary 通过；聚合验证仅因当前工作区已删除的 `skills/super-agent/agents/openai.yaml` 报告已知的 `Missing agents/interface.yaml`。
