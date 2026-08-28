# 提交当前 Context 工作区改动

Status: In Progress (2026-08-28 20:52)
Kind: Task
Parent: commit-release-and-install-guide

## Scope

- 包含：当前 Context 引导改动、其消费者与验证夹具，以及本次 Queue/Task 生命周期记录。
- 排除：`4.0.0` 版本号、CHANGELOG 发布条目和发布 tag。

## Target

- [ ] T1: 版本准备前的全部当前本地改动已完整纳入可追溯 Git commit，未丢失文件且未混入 4.0.0 版本元数据调整。

## Plan

1. 复核全部 staged、unstaged 与 untracked 内容及版本文件未变边界。
2. 对允许的源码、JSON、Context、规则结构和 diff 执行确定性检查。
3. 暂存全部当前改动并创建一个聚焦 commit，核对 commit 内容与剩余工作区状态。
