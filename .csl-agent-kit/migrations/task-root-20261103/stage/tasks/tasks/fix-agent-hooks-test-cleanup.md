# 修复 Agent Hooks 单元测试清理失败

Status: Completed (2026-08-26 11:21)
Kind: Task

## Target
- [x] T1: Agent Hooks 单元测试清理不再尝试 unlink scripts 目录，且完整 test:agent-hooks 测试通过

## Plan

1. 聚焦复现两处清理失败并确认共同根因。
2. 让测试清理只删除预期的规则文件。
3. 重跑聚焦用例与完整 Agent Hooks 单元测试。

## Result

- T1: 四处测试清理循环仅删除 hooks 根目录中的 .md 规则文件，scripts 目录被保留；原失败聚焦用例 2/2 通过，完整 test:agent-hooks 31/31 通过。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 聚焦 node --test 用例 2/2 通过；npm run test:agent-hooks 31/31 通过；node --check 与 git diff --check 通过。
