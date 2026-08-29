# 发布并验证 CSL Agent Kit 4.1.0

Status: In Progress (2026-08-29 20:59)
Kind: Queue

## Scope

- 包含：当前全部工作区改动的 concern 分组提交、GitHub validate failure 的最小修复、4.1.0 版本准备、Git tag 与 npm 公开发布，以及最终远端 main HEAD 对应 CI 验证。
- 排除：GitHub Release 和本次本地改动之外的新功能扩展；沿用既有 npm + Git tag 发布边界。

## Target

- [ ] T1: 当前全部本地改动按 concern 提交，已定位并修复阻塞旧提交的 GitHub build failure，CSL Agent Kit 4.1.0 通过现有发布渠道发布，最终远端目标 HEAD 的 GitHub CI 成功。

## Children

1. [按关注点提交 2026-08-29 全部本地改动](commit-all-local-changes-20260829.md)
2. [修复 4.1.0 发布前 GitHub Build](fix-github-build-before-4-1-0.md)
3. [准备 CSL Agent Kit 4.1.0](prepare-csl-agent-kit-4-1-0.md)
4. [发布并验证 CSL Agent Kit 4.1.0](publish-csl-agent-kit-4-1-0.md)

## Plan

1. 完成 `commit-all-local-changes-20260829`，固定当前 feature、eval、icon 与任务记录改动的 concern 边界。
2. 完成 `fix-github-build-before-4-1-0`，以提交后的候选状态复现并消除 GitHub validate failure。
3. 完成 `prepare-csl-agent-kit-4-1-0`，同步版本元数据、CHANGELOG 与发布包验证。
4. 完成 `publish-csl-agent-kit-4-1-0`，执行已授权的 push、tag 与 npm 发布，并等待最终 main HEAD CI 成功。
