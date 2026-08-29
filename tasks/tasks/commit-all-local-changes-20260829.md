# 按关注点提交 2026-08-29 全部本地改动

Status: In Progress (2026-08-29 21:05)
Kind: Task
Parent: release-csl-agent-kit-4-1-0

## Scope

- 包含：当前工作区已有的 Task Target guard／eval、Chrome Extension icon guidance，以及其 canonical task 和 Context 记录。
- 排除：提交完成后发现的 CI 修复、4.1.0 版本文件和正式发布动作。

## Target

- [ ] T1: 当前工作区全部已有本地改动已按功能或 concern 分组提交，每个 commit 不混入无关变更。

## Plan

1. 以当前 diff、未跟踪文件和既有提交历史识别独立 concern。
2. 对每组仅暂存所属文件或 hunks，检查 staged diff 后使用 conventional-style message 提交。
3. 确认剩余工作区只包含本任务执行期间新产生、属于后续 release queue 的状态记录。
