# 发布并验证 CSL Agent Kit 4.0.0

Status: In Progress (2026-08-28 21:02)
Kind: Task
Parent: commit-release-and-install-guide

## Scope

- 包含：以 release commit `5785c32` 创建 `v4.0.0` 注释 tag，推送 `main` 与 tag，公开发布 npm 包，并验证 registry、安装入口和最终远端 CI。
- 排除：创建 GitHub Release；本版本沿用既有 npm + Git tag 发布边界。

## Target

- [ ] T1: 4.0.0 发布提交与 v4.0.0 tag 已推送，@ssbun/csl-agent-kit@4.0.0 已公开发布且 latest、安装入口和最终远端 CI 均验证成功。

## Plan

1. 展示 package、版本、npm 用户、包内容和全部远端命令，取得正式发布确认。
2. 创建 `v4.0.0` 注释 tag，推送 `main` 与 tag，并等待 release commit 对应 CI 成功。
3. 执行 `npm publish --access public`，验证 registry version、latest 和公开安装入口。
4. 提交并推送剩余任务生命周期记录，等待最终 `origin/main` HEAD 对应 CI 成功。
