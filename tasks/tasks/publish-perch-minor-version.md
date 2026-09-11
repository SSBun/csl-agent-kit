# 提交 Perch 全部改动并发布次版本

Status: Completed (2026-09-11 11:12)
Kind: Queue

## Scope

- 包含：`/Users/caishilin/Desktop/personal/Perch` 当前全部非忽略改动的本地提交，以及 Perch 0.2.0 的版本准备、macOS 归档、GitHub Release 与 Sparkle feed 发布验证。
- 不包含：其他仓库、Mac App Store、npm 或 Homebrew 发布。

## Target
- [x] T1: Perch 当前工作区的全部改动已提交，下一次 minor 版本已通过项目既有发布渠道公开，且提交、版本、标签、发布产物与更新元数据一致并可验证。

## Children

1. [提交 Perch 当前工作区改动](commit-perch-current-changes.md)
2. [准备、发布并验证 Perch 0.2.0](publish-perch-0-2-0.md)

## Plan

1. 完成 `commit-perch-current-changes`，先将 Queue 启动时已有的全部 Perch 工作区改动按关注点提交并验证干净状态。
2. 完成 `publish-perch-0-2-0`，在前一子任务提交上准备、发布并远端验证 0.2.0。
3. 对最终工作区、版本、提交、标签、Release、Sparkle feed 与适用 CI 做集成核对。

## Result

- T1: commit-perch-current-changes 与 publish-perch-0-2-0 均 Completed；Perch 工作区干净，main/v0.2.0/Release 均指向 03868c23…，0.2.0 ZIP、checksum 与公开 EdDSA appcast 已完成远端验证。
- Review gate: Skipped — Queue parent 仅整合两个子任务结果，未直接修改请求交付文件；全部产品、版本与发布改动由已完成子任务拥有并完成各自 task-review。

## Verification

- Passed: Parent review gate 后确认两个子任务均 Completed、Queue next=null、Perch 工作区干净、local/origin main 与 v0.2.0 一致为 03868c23…，GitHub Release 和公开 appcast 均 HTTP 200，workspace Context/Task 校验通过。
