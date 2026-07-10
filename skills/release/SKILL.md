---
name: release
description: Use when the user wants to release a project. This skill only routes to the matching release SOP, checks readiness, and gathers confirmation items; it does not perform ecosystem-specific publishing itself.
---

# Release Skill Router

这是发布入口 skill。它只路由到真实存在的具体发布 SOP；没有匹配 SOP 时停止，不临时编造发布流程。

## Responsibilities

1. 检查工作区状态。
2. 列出当前可用 SOP，并筛选真实存在的发布 SOP。
3. 读取匹配 SOP 的完整内容。
4. 只执行匹配 SOP 明确允许且用户确认过的步骤。

## Non-Goals

- 不内置 npm、PyPI、Cargo、Xcode、Homebrew、CocoaPods 的发布命令。
- 不猜测版本号。
- 不自动创建 tag、push 或 publish。
- 不在没有匹配 SOP 时编造生态发布流程。
- 不使用空壳 orchestrator 代替具体发布 SOP。

## Arguments

- `version`：可选目标版本。提供后仍需按 SOP 验证。
- `--skip-push`：跳过远端 push。不能跳过发布前验证。

## Flow

### 1. Check Workspace

运行：

```bash
git status --short --branch --untracked-files=all
```

如果存在无关未提交改动，停止并让用户确认提交、stash 或继续策略。

### 2. Discover Concrete Release SOPs

运行 `skills/sop-manager/scripts/sop-summaries.sh`，或等价读取：

- `~/.csl-agent-kit/sops/*.md`
- `skills/sop-manager/sops/*.md`

只考虑真实存在、且 `name` 或 `description` 明确指向 release、publish、upload、notarize、package publishing 或 installer publishing 的具体 SOP。

`project-version-update` 是版本准备 SOP，不是发布 SOP；只有用户要求更新版本或匹配发布 SOP 明确要求时才使用。

### 3. Select One Matching SOP

- 如果只有一个匹配发布 SOP，读取它的完整内容。
- 如果多个 SOP 匹配，列出候选项并让用户选择。
- 如果没有匹配 SOP，停止，并建议先用 `sop-manager create` 创建具体发布 SOP。

### 4. Confirm Before Remote Actions

在任何 tag、push、publish、upload、notarize 或远端 release 前，必须列出：

- 匹配 SOP
- 当前版本和目标版本
- 将修改的文件
- 将创建的 tag
- 将 push 的 remote/branch
- 将执行的 publish/upload/notarize 命令

用户明确确认后才继续。
