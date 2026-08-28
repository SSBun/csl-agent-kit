# 统一标准 Context 引导流程

Status: In Progress (2026-08-28 17:34)
Kind: Task

## Scope

- 包含：统一 `task-context` 的缺失与非标准 Context 引导契约，并同步直接消费者和质量夹具。
- 不包含：批量改写仓库中当前已符合标准的 Context 文件。

## Target

- [ ] T1: task-context 不再保留旧版或无效 Context 的迁移路径，现有非标准 Context 会被重写为标准格式。
- [ ] T2: 缺少 tasks/context.md 的项目会先分析仓库并生成最小 Project Core 提案，取得用户明确确认后再写入标准 Context 文件。
- [ ] T3: task-context 包的运行时说明、脚本与质量校验结果保持一致。

## Plan

1. 查清迁移、缺失 Context 和 Core 写入权限的全部生产者、消费者及夹具。
2. 删除旧迁移契约，改为“非标准文件直接重写；缺失文件先生成最小 Core 提案并确认后写入”。
3. 同步相关 Context Pack、规则和质量夹具，并运行允许的确定性校验。
