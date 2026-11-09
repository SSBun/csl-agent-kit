# 统一标准 Context 引导流程

Status: Completed (2026-08-28 17:51)
Kind: Task

## Scope

- 包含：统一 `task-context` 的缺失与非标准 Context 引导契约，并同步直接消费者和质量夹具。
- 不包含：批量改写仓库中当前已符合标准的 Context 文件。

## Target
- [x] T1: task-context 不再保留旧版或无效 Context 的迁移路径，现有非标准 Context 会被重写为标准格式。
- [x] T2: 缺少 tasks/context.md 的项目会先分析仓库并生成最小 Project Core 提案，取得用户明确确认后再写入标准 Context 文件。
- [x] T3: task-context 包的运行时说明、脚本与质量校验结果保持一致。

## Plan

1. 查清迁移、缺失 Context 和 Core 写入权限的全部生产者、消费者及夹具。
2. 删除旧迁移契约，改为“非标准文件直接重写；缺失文件先生成最小 Core 提案并确认后写入”。
3. 同步相关 Context Pack、规则和质量夹具，并运行允许的确定性校验。

## Result

- T1: task-context 已删除 Default/Legacy Migration 契约与 legacy Pack 解析，现有无效 Core 改为从权威来源重写最小标准文件。
- T2: Missing Context Bootstrap 明确先分析项目、展示完整最小 Core 提案并取得确认，确认前不得创建文件或目录。
- T3: 运行时规则、README、metadata、query/trigger fixtures、CLI、消费者断言与 CTX-task-context 已同步；语法、JSON、Context validation、结构检查及 diff check 通过。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: node --check、JSON 解析、实际 Context core/index/validate、规则结构检查和 git diff --check 均通过；skill-quality 无 failure，仅保留 3509-token context-budget warning。
