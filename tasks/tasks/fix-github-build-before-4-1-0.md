# 修复 4.1.0 发布前 GitHub Build

Status: Completed (2026-08-29 21:26)
Kind: Task
Parent: release-csl-agent-kit-4-1-0

## Scope

- 包含：当前 `origin/main..HEAD` release candidate、GitHub `validate` workflow 的本地等价路径、旧失败根因与现有修复继承关系；仅在复现新失败时新增独立修复 commit。
- 排除：4.1.0 版本元数据、远端 push／tag、npm publish，以及与失败无关的重构。

## Target
- [x] T1: 旧 GitHub validate failure 的根因与现有修复提交已确认，当前 release candidate 在 workflow 等价检查中通过；仅在复现出新失败时新增独立修复 commit。

## Plan

1. 对照 workflow、远端 run 状态和当前八个本地 commits，先运行最窄的相关检查捕获实际失败。
2. 若复现新失败，定位首个根因并做最小修复；若旧根因已在当前历史中修复，则确认对应 commit 与当前候选的继承关系。
3. 重跑原失败路径及 workflow 相邻检查，在支持的 Node 版本上验证；不为已修复的问题制造空提交。

## Result

- T1: GitHub run 33175921739 的根因是 archive test 仍引用已移动的 skills/archive/scripts/archive-session.mjs；现有 c923dbf 已修正路径且为当前 HEAD 祖先。当前候选在 Node 18.20.8、20.20.2 的 npm ci + npm test、Node 22.19.0 的 npm ci + npm run check 及 workflow 静态步骤均通过，无新失败可修复。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 原失败路径 archive tests 在三套 Node 检查中通过；Node 18/20 测试矩阵、Node 22.19 全 check、manifest/frontmatter/bash workflow 步骤全部退出 0。
