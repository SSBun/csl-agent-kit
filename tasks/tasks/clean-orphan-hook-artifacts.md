# 清理无引用 Hook 残留

Status: Completed (2026-08-26 17:29)
Kind: Task
Parent: fix-local-hook-config-issues

## Scope

- 仅移除已确认无引用的两个旧脚本与两个标题测试残留。
- 保留现有全局 Hook 规则、被引用脚本、标题结果与状态数据，以及其他用户配置。

## Target
- [x] T1: 审计确认无引用的旧标题脚本、替代 Swift 脚本和标题测试残留已移除。
- [x] T2: 现有全局 Hook 规则、脚本及 inner 标题 Hook 仍保持有效和启用。

## Plan

1. 再次确认四个候选残留未被当前规则或配置引用。
2. 仅删除这四个无引用文件。
3. 通过 Agent Hooks CLI 验证全局与 inner Hook 状态。

## Result

- T1: 复查当前规则与配置未发现引用；精确删除两个旧脚本和两个 .test 标题残留，并确认四个路径均不存在。
- T2: Agent Hooks CLI 显示两个全局规则均 valid/supported/active，inner:refresh-tab-title 同样 valid/supported/active；两个被引用脚本仍存在。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 精确路径缺失检查、被引用脚本存在检查及 Agent Hooks list/show 状态检查均通过。
