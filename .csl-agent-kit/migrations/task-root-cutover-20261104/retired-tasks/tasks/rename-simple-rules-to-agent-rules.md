# 将 simple-rules 迁移为 agent-rules

Status: Completed (2026-08-20 11:18)
Kind: Task

## Target
- [x] T1: 共享 Skill、Triggerify Hook 与运行时脚本以 agent-rules 作为 canonical 名称并保持持久规则注入行为
- [x] T2: 现有用户规则内容迁移至 ~/.csl-agent-kit/agent-rules.md，且 agent-rules Hook 验证为有效并启用
- [x] T3: 当前文档、发现契约与验证覆盖使用 agent-rules，旧名称仅保留在必要的迁移兼容与历史记录中

## Plan

1. 重命名 Skill、内置 Hook、读取脚本与用户规则文件，并保留规则内容。
2. 同步当前清单、Triggerify 文档和验证代码中的 canonical 名称。
3. 运行语法、Hook 注入、Skill 质量与旧名称残留检查，完成任务门禁。

## Result

- T1: Skill、Hook、脚本与 Claude 清单已改为 agent-rules；node --check、Triggerify show（valid/active）及 canonical/legacy session-start 注入 smoke check 均通过。
- T2: 已确认 ~/.csl-agent-kit/agent-rules.md 存在并保留原六条规则，旧 simple-rules.md 已移除；inner:agent-rules 在 Pi 上有效且启用。
- T3: 当前 Skill、Hook、清单与 Triggerify 验证代码均使用 agent-rules；活动源码中的 simple-rules 仅剩数据迁移 fallback 及其验证，历史任务和报告保持不变。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 非测试验证通过：语法、Hook status、注入 smoke、清单路径、重命名路径/权限、git diff --check；agent-rules local quality gate/resource 通过，triggerify 仅有规则允许的 1381>1000 initial-load token budget 失败。按全局规则未运行单元测试。
