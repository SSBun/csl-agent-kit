# 准备 CSL Agent Kit 4.1.0

Status: Completed (2026-08-29 21:34)
Kind: Task
Parent: release-csl-agent-kit-4-1-0

## Scope

- 包含：npm package source of truth、lockfile、CHANGELOG、目标版本占用检查、包内容演练和发布前验证。
- 排除：独立版本的宿主 plugin manifests、Git push／tag、GitHub Release 和正式 npm publish。

## Target
- [x] T1: 版本 source of truth、lockfile 与 CHANGELOG 一致更新为 4.1.0，发布包内容和发布前检查通过。

## Plan

1. 从 `v4.0.0..HEAD` 确认本次 minor release 的用户可见变更和版本同步边界。
2. 用 npm 同步 package 与 lockfile，并将 `[Unreleased]` 整理为 4.1.0 发布说明。
3. 检查目标版本未占用、登录态、README／installer／manifest 旧版本引用和发布包 allowlist。
4. 运行 package／publish dry-run、临时安装 smoke check、质量门禁与 diff 检查后提交 release metadata。

## Result

- T1: Commit c1afabf 将 package 与 lockfile 同步为 4.1.0，并新增 4.1.0 CHANGELOG；npm registry 仅有 4.0.0，4.1.0 未占用。pack/publish dry-run 为 162 files，排除 evals/tasks 且包含共享协议与 Chrome icon reference。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: Node 22.19.0 npm run check、project eval validate/self-test、Context validate、git diff --check、npm pack/publish dry-run、临时 tarball 安装、CLI help 与 install dry-run 均通过；npm whoami 为 ssubun。
