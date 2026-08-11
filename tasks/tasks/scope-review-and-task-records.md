# 收窄 adversarial review 与任务记录边界

- **Status:** 已完成（2026-07-21）

## Goals

- 让纯机械、可直接验证的基础操作不再创建 todo，也不再运行 adversarial review。
- 保留对代码、设计、规则等需要实质判断的交付物的严格审查。
- 用明确边界避免高风险或语义性变更被误归类为“基础操作”。

## Plan

1. 收窄默认 agent 规则和当前项目规则中的任务记录触发条件。
2. 收窄 adversarial review 的适用范围，并列出可机械验证的豁免项。
3. 更新纠错经验与工作区约定，执行规则审计和独立复核。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: scope-reviewer
- Round: RE-REVIEW (2)
- Scope: `AGENTS.md`, `skills/super-agent/references/AGENTS.md`, `tasks/lessons.md`, `tasks/context.md`
- Summary: 基础机械操作现已跳过 todo 和 adversarial review，同时保留直接验证和高风险排除条件。
- Unresolved: none
- Report: [Adversarial review report](../../reports/adversarial-review/scope-review-and-task-records.md)

## Results and verification

- 默认 agent 规则只为非简单工作或实质文件变更创建任务记录。
- 精确保存、复制、移动、重命名等无语义变更且可确定性验证的操作，跳过 todo 和 adversarial review，但仍必须直接验证。
- 代码、PRD、RFC、设计文档、agent rules、skills、SOP 与 hooks 等需要非平凡判断的实质交付物仍需独立审查。
- 破坏性、歧义、安全敏感、数据完整性敏感或内容变更操作不适用豁免。
- `git diff --check` 通过；用户级 `~/.agents/AGENTS.md` 仍正确指向已更新的默认模板。
