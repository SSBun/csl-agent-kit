# 在任务准备阶段开始前建立任务记录

Status: Completed (2026-08-20 15:01)
Kind: Task

## Scope

- 包含 canonical task 的触发时机、准备阶段覆盖范围、跳过边界及对应路由契约。
- 不改变 task record schema、状态机或完成门禁。

## Target
- [x] T1: Agent 在识别出具体、非平凡且可独立验收的目标后，于实质讨论、澄清、探索、调研、规划或实施前创建或恢复 canonical task。
- [x] T2: 路由仍明确跳过一般问答、未形成目标的开放讨论、琐碎机械操作及 Context/Lessons 维护。
- [x] T3: 相关规则、workflow skill 与路由用例保持一致，并通过适用的非测试验证。

## Plan

1. 检索 task workflow 的所有触发规则、skill 契约、路由 fixture 与相关消费者。
2. 将 task 创建时机前移到具体目标确认后的准备阶段，并同步跳过边界与示例。
3. 运行格式、静态检查、skill 审计和 task consistency 检查，记录结果后完成任务。

## Result

- T1: task/SKILL.md、super-agent/AGENTS.md 与 dispatcher 均要求具体非平凡 outcome 在实质讨论、澄清、探索、调研、规划、委派或实施前完成任务激活与 Session focus。
- T2: task contract 与 routing fixtures 仅跳过一般事实问答、无具体目标的开放讨论、琐碎确定性操作及 Context/Lessons 维护；四组 routing eval precision/recall 均为 1.000。
- T3: 三个 workflow skill 的 local quality gate syntax/lint/governance 通过，仅保留允许的 initial-load token warning；JSON、Context、Lessons、规则结构、persistent agent rule、git diff 与 stale-contract 检查通过。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 四组 routing eval 1.000/1.000；Context/Lessons/JSON/规则结构/git diff 检查通过；未运行单元测试或项目测试套件，遵循用户当前测试限制。
