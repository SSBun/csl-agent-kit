# 准备 CSL Agent Kit 4.0.0

Status: In Progress (2026-08-28 20:54)
Kind: Task
Parent: commit-release-and-install-guide

## Scope

- 包含：npm package source of truth、lockfile、CHANGELOG、包内容演练和发布前验证。
- 排除：独立版本仍为 `2.0.0` 的宿主 plugin manifests，以及正式 tag、push 与 npm publish。

## Target

- [ ] T1: 版本 source of truth、lockfile 与 changelog 一致更新为 4.0.0，发布说明覆盖自 3.2.0 起的用户可见及破坏性变更，npm 包演练与允许的发布前校验通过。

## Plan

1. 用 npm 同步 `package.json` 与 lockfile 到 `4.0.0`，保持 plugin manifest 的独立版本不变。
2. 将 `[Unreleased]` 的现有条目与自 `v3.2.0` 起的用户可见变化整理为 `4.0.0` 发布说明和 breaking changes。
3. 执行允许的语法、结构、包内容与 publish dry-run 校验，确认目标版本未占用和 npm 登录态。
4. 创建发布准备 commit，并整理正式 tag、push 与 npm publish 的最终确认摘要。
