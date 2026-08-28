# 发布并验证 CSL Agent Kit 4.0.0

Status: Completed (2026-08-28 21:47)
Kind: Task
Parent: commit-release-and-install-guide

## Scope

- 包含：以通过 CI 的 release commit `c923dbf` 更新 `v4.0.0` 注释 tag，推送 `main` 与 tag，公开发布 npm 包，并验证 registry、安装入口和最终远端 CI。
- 排除：创建 GitHub Release；本版本沿用既有 npm + Git tag 发布边界。

## Target
- [x] T1: 4.0.0 发布提交与 v4.0.0 tag 已推送，@ssbun/csl-agent-kit@4.0.0 已公开发布且 latest、安装入口和最终远端 CI 均验证成功。

## Plan

1. 展示 package、版本、npm 用户、包内容和全部远端命令，取得正式发布确认。
2. 将首次推送但 CI 失败的 `v4.0.0` tag 强制更新到已通过 CI 的 release commit，并验证远端 tag。
3. 执行 `npm publish --access public`，验证 registry version、latest 和公开安装入口。
4. 提交并推送剩余任务生命周期记录，等待最终 `origin/main` HEAD 对应 CI 成功。

## Result

- T1: 远端 main 与 v4.0.0 peeled tag 均指向 c923dbf；GitHub Actions run 33176082224 成功；npm version/latest 为 4.0.0，registry 安装、CLI help 与 install dry-run 均通过。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 已验证远端 main/tag SHA、成功 CI、npm registry 4.0.0/latest、161 文件发布包及公开安装路径；无 GitHub Release。
