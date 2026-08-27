# 避免云效 MR 推送修改 Git upstream

Status: Completed (2026-08-27 11:42)
Kind: Task
Parent: fix-selected-audit-findings

## Scope

- 只移除本地 upstream 副作用；保留显式候选 remote、分支推送顺序与失败处理。

## Target
- [x] T1: Yunxiao MR 推送显式 remote 和 branch 时不创建或修改本地分支 upstream。

## Plan

1. 移除推送命令中的 upstream 写入选项。
2. 以隔离 Git remote 验证分支已推送且本地 upstream 未变化。

## Result

- T1: 隔离 bare remote smoke 观察到源分支成功推送到 origin，同时推送前后本地 @{upstream} 均不存在。
- Review gate: Skipped — 用户未要求独立 Reviewer；一行参数改动已完成本地自审。

## Verification

- Passed: 实际隔离 Git push smoke、node --check、local quality gate validate、resource boundary、-u 静态搜索与 whitespace check 均通过。
