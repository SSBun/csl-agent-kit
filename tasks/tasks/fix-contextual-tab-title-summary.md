# 让标签标题根据上下文生成有意义摘要

Status: Completed (2026-08-29 23:14)
Kind: Task

## Scope

- 修复 Pi 终端标签标题刷新中，简短确认回复覆盖上下文主题的问题。
- 不改变 Pi session metadata 或其他 Agent Hooks 行为。

## Target
- [x] T1: 当最新用户消息只是「确认」等无独立语义的简短回答时，标签标题不会直接使用该回答，而会结合相关会话上下文生成有意义的摘要标题

## Plan

1. 复现并定位简短确认被接受为标题的路径。
2. 让生成提示结合上下文解释确认回复，并确定性拒绝无语义确认标题。
3. 运行允许的最小语法、行为与 Skill 质量检查。

## Result

- T1: 截图中的「confirm」/「确认」坏输出现被确定性拒绝，生成提示明确要求从较早会话上下文提炼主题；行为 smoke 保留「悬浮学习卡片」与合法主题「确认流程」
- Review gate: Skipped — 用户未要求独立 Reviewer、对抗性审查或双 Agent 审批

## Verification

- Passed: refresh-tab-title.js 与 agent-hooks.test.js 均通过 node --check；行为 smoke 拒绝确认及既有操作型输出、标题上限仍为 24；skill-quality 0 failed（仅既有 1281-token warning）；git diff --check 通过；按用户规则未运行单元测试
