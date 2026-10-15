# 简化 Topic 生命周期为 Active 与 Archived

| Field | Value |
| --- | --- |
| Status | In Progress (2026-10-15 14:28) |
| Kind | Task |

## Plan

1. 默认创建 Active，保留旧 Draft 的读取和显式单项转换。
2. 同步 CLI、Topic/Task/Plan 契约、说明及展示回归定义。
3. 语法、质量和差异检查后，执行获授权的相关回归并按实际风险完成审查与验证。

## Decisions

- 不自动迁移旧 Draft，不将读取视为状态转换；activate 仅保留为旧记录兼容命令。
- Pi 面板原有 Active 过滤无需改动；测试改为直接创建 Topic，并用 Archived 验证过滤。
- 已执行 core/CLI 与两份测试定义的 node --check，以及 git diff --check，均通过。Topic、Task、Task Plan 三包质量检查零失败，均有 context-budget 警告。
- 本任务尚未运行单元测试，等待当前请求的明确测试授权；尚未宣告完成。

## Target

- [ ] T1: 新建 Topic 默认 Active，不再需要 Draft 到 Active 的额外激活步骤。
- [ ] T2: 正常生命周期仅保留 Active 与 Archived，支持显式归档与恢复，现有 Draft 记录提供明确的兼容处理而不自动批量改写。
- [ ] T3: Active 只表示持续维护，不代表规格完整或执行授权；保留任务对齐、规格版本与采用、关联及验收门禁。
- [ ] T4: 同步受影响的 CLI、规范、文档、Pi 展示和回归用例，保留其他未完成任务的已有改动。
