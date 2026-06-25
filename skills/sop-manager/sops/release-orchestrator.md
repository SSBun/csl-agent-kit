---
name: release-orchestrator
version: 1.0
owner: CSL
scope: global
description: 用于发布任何项目之前的通用路由：检查工作区、识别发布类型、选择具体发布 SOP、汇总确认项；不执行生态专用发布细节。
alwaysApply: false
---

# Release Orchestrator SOP

## Purpose

在发布项目前先选择正确的专用发布 SOP，避免用一个通用流程覆盖 npm、PyPI、Cargo、Xcode、Homebrew、CocoaPods 等不同生态。

## Scope

适用：
- 用户要求 release、publish、tag、push release、发布新版本。
- 项目类型或发布目标还没有明确。
- 需要判断是否已有专用 SOP。

不适用：
- 直接执行生态发布细节。
- 在没有匹配 SOP 时临时编造发布流程。

## Procedure

1. 检查工作区状态。
   - Action: 运行 `git status --short --branch --untracked-files=all`。
   - Expected Result: 明确当前分支、远端同步状态和未提交改动。

2. 处理未提交改动。
   - Action: 如果存在无关改动，停止并让用户确认提交、stash 或继续策略。
   - Expected Result: 不覆盖、不丢弃用户改动。

3. 识别发布信号。
   - Action: 只读取项目文件，不执行发布命令。
   - Expected Result: 得到候选发布类型。

4. 选择专用 SOP。
   - Action: 按下表选择候选 SOP。
   - Expected Result: 只选择一个匹配 SOP；多个匹配时让用户选择。

| Signal | SOP |
|---|---|
| npm package, CLI tool, native app artifact wrapper in npm | `npm-publish-tool-or-native-app` |
| macOS app, DMG, signing, notarization, Sparkle/Appcast | `xcode-macos-dmg-release` |
| Python package, `pyproject.toml`, `setup.py`, `setup.cfg` | `python-pypi-release` |
| Rust crate, `Cargo.toml` | `cargo-crates-release` |

5. 读取完整 SOP。
   - Action: 先查 `~/.sops/{name}.md`，再查 built-in SOP。
   - Expected Result: 发布细节来自完整 SOP，不来自当前 orchestrator。

6. 如果没有匹配 SOP，停止。
   - Action: 告诉用户缺少哪个发布 SOP，并建议先用 `sop-manager create` 创建。
   - Expected Result: 不继续执行发布。

7. 汇总确认项。
   - Action: 在任何 tag、push、publish、upload 前列出：
     - 匹配 SOP
     - 当前版本
     - 目标版本
     - 将修改的文件
     - 将创建的 tag
     - 将 push 的 remote/branch
     - 将执行的 publish/upload 命令（由专用 SOP 提供）
   - Expected Result: 用户明确确认后才继续。

## Error Handling

| Scenario | Resolution | Escalate To |
|---|---|---|
| 没有匹配 SOP | 停止；建议创建专用 SOP | User |
| 多个 SOP 匹配 | 列出候选项，让用户选择 | User |
| 工作区有无关改动 | 停止；让用户确认处理方式 | User |
| 专用 SOP 缺少关键步骤 | 先更新 SOP，再发布 | User |
| 用户要求跳过确认 | 拒绝跳过 destructive 或 remote 操作确认 | User |

## References

- `~/.sops/npm-publish-tool-or-native-app.md`
