---
name: release
description: Use when the user wants to release a project. This skill only routes to the matching release SOP, checks readiness, and gathers confirmation items; it does not perform ecosystem-specific publishing itself.
argument-hint: "[version] [--skip-push]"
---

# Release Skill Router

这是发布入口 skill。实际流程由 `release-orchestrator` SOP 和它选择的专用发布 SOP 处理。

## Responsibilities

1. 读取完整 `release-orchestrator` SOP。
2. 按 SOP 检查工作区、识别项目类型、选择专用发布 SOP。
3. 只执行 SOP 明确允许且用户确认过的步骤。

## Non-Goals

- 不内置 npm、PyPI、Cargo、Xcode、Homebrew、CocoaPods 的发布命令。
- 不猜测版本号。
- 不自动创建 tag、push 或 publish。
- 不在没有匹配 SOP 时编造生态发布流程。

## Arguments

- `version`：可选目标版本。提供后仍需按 SOP 验证。
- `--skip-push`：跳过远端 push。不能跳过发布前验证。

## Flow

### 1. Load Release Orchestrator SOP

读取：

`skills/sop-manager/sops/release-orchestrator.md`

如果用户在 `~/.sops/release-orchestrator.md` 有自定义版本，优先读取用户版本。

### 2. Execute Through SOP

按 `release-orchestrator` 选择专用发布 SOP。没有匹配专用 SOP 时停止，不继续发布。
