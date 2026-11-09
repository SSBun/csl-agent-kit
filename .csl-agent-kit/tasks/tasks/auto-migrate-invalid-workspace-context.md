# 默认迁移旧版 Workspace Context

Status: Completed (2026-08-20 17:08)
Kind: Task

## Target
- [x] T1: workspace-context 在当前工作区发现缺失或无效 Project Core 的旧版 tasks/context.md 时，无需另行确认便默认执行迁移，使后续 core 与 validate 成功
- [x] T2: 自动迁移只写入有权威来源支持的 Core 与 Packs，保留无法安全迁移的原内容，并在验证失败时恢复写前文件
- [x] T3: 默认 Agent 规则、workflow gates、skill metadata、行为 fixtures、消费者检查与 Context Pack 对迁移语义保持一致
- [x] T4: 当前任务的全部且仅相关改动以一个 focused conventional-style Git commit 提交，其他本地改动保持未暂存

## Scope

- 包含：当前工作区已有旧版 Context 的自动恢复迁移。
- 排除：扫描或批量迁移其他工作区，以及在缺少可靠来源时编造 Core 内容。

## Plan

1. 明确自动迁移触发、来源、保留、回滚与降级边界。
2. 同步默认消费者、发现元数据、行为 fixtures 和持久 Context Pack。
3. 运行非测试结构检查、Context 校验及 skill package 审计。
4. 检查工作树，隔离并提交当前任务相关改动。

## Result

- T1: SKILL Session Gate 与 Default Migration 规定现有 pre-v1/无效 Core 在披露前自动迁移，并由 query fixture 映射为 MigrateThenLoadCore。
- T2: 迁移契约要求最小权威来源、禁止占位事实和跨工作区扫描、保留未解决旧文本，并在 core/validate 失败时恢复精确写前内容。
- T3: super-agent rules、workflow gates、skill metadata、README、routing/query fixtures、消费者断言与 CTX-workspace-context 已同步默认迁移语义。
- T4: 已创建 focused commit，提交仅含当前任务相关路径；git status 确认其他本地改动继续未暂存。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 已检查 staged snapshot、提交路径、git show 与提交后的 git status；结构检查和 diff check 通过，未运行单元测试。
