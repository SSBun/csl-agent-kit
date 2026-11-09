# 发布并验证 CSL Agent Kit 4.1.0

Status: Completed (2026-08-29 21:44)
Kind: Task
Parent: release-csl-agent-kit-4-1-0

## Scope

- 包含：推送本地 `main` commits、等待 release commit CI、创建并推送 `v4.1.0` annotated tag、公开 npm publish、registry／安装验证，以及最终 task-record push 对应的远端 main HEAD CI。
- 排除：GitHub Release、修改 npm package scope／access、重写历史或强推。

## Target
- [x] T1: 4.1.0 tag 与 main 已推送，@ssbun/csl-agent-kit@4.1.0 已公开发布，registry 与最终远端 main HEAD 对应的 GitHub CI 均验证成功。

## Plan

1. 固定并检查 release commit、远端 main、目标 tag、npm owner／version 和 dry-run 证据，展示独立 Safety Confirmation。
2. 获得确认后先 push `main`，等待该 release commit 的 GitHub CI 成功。
3. 在通过 CI 的 release commit 创建并推送 `v4.1.0` annotated tag，执行 `npm publish --access public`。
4. 验证 registry／latest 和公开 tarball 安装，完成任务记录后推送最终状态 commit，并等待最终远端 main HEAD CI 成功。

## Result

- T1: 远端 main 与 annotated v4.1.0 peeled tag 均指向 75265296e9fccdc0b922fc2969480b80e136aa0f；GitHub run 33255663964 三个 jobs 成功。npm @ssbun/csl-agent-kit@4.1.0 已公开且 latest=4.1.0，registry 安装、CLI help 与 install dry-run 通过。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 已核对 remote main/tag SHA、run 33255663964 success、npm version/latest、dist shasum/integrity 和公开 registry 安装路径；最终 task-state push 后仍将以 exact HEAD 重新等待 CI。
