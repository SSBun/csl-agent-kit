# 将云效 MR 运行时契约改为英文

Status: Completed (2026-08-27 11:45)
Kind: Task
Parent: fix-selected-audit-findings

## Scope

- 只翻译 Agent-facing runtime contract 与 reference prose；CLI 用户可见中文消息、示例业务值和 eval 语言夹具保持不变。

## Target
- [x] T1: yunxiao-mr 的 SKILL.md 与 runtime reference 使用英文且完整保留现有首次创建工作流与安全边界。

## Plan

1. 将主 Skill 契约翻译为英文并保持触发、确认、写入和失败边界。
2. 将 manifest runtime reference 翻译为英文并保持 schema 与远端行为语义。
3. 验证包语言边界、结构和资源约束。

## Result

- T1: SKILL.md 与 manifest reference 的 Agent-facing prose 已全为英文；静态契约检查确认触发、鉴权、确认、首次创建、已有 MR、partial/failed、join/restore 与全部 manifest 字段仍存在。
- Review gate: Skipped — 用户未要求独立 Reviewer；已逐节对照原契约完成本地自审。

## Verification

- Passed: 英文 prose/字段覆盖检查、Yao validate、resource boundary（988/1000 initial-load tokens）与 whitespace check 均通过。
