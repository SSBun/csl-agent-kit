# 提交当前全部本地改动

Status: In Progress (2026-09-01 13:33)
Kind: Task

## Scope

- 包含：当前工作树内全部 tracked/untracked 改动，包括 workflow source、Context/Lessons、任务记录和 Yunxiao ZIP 归档。
- 不包含：修改已有交付物内容、推送远端、发布包或运行未获授权的项目测试。

## Target

- [ ] T1: 当前工作区中所有已跟踪和未跟踪的本地改动按一致关注点形成 Git commit，且不遗漏文件
- [ ] T2: 提交完成后工作树与暂存区均为空，提交内容可由 diff 和状态证据复核

## Plan

1. 复核全部改动和既有任务证据，运行获准的非测试质量检查，并确认 ZIP 可读取。
2. 将 Task Maintenance 与 injected Task Contract 等 workflow source、文档、Context/Lessons 和静态断言提交为一个 workflow 关注点。
3. 将 Yunxiao ZIP 作为独立归档关注点提交。
4. 完成本任务证据与状态，提交全部 task records，最后确认工作树、暂存区和未跟踪文件均为空。
