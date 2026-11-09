# 优化 CLI 帮助与版本更新检查

Status: Completed (2026-09-02 10:52)
Kind: Task

## Scope

- 包含：顶层帮助的版本展示、npm 最新版本检查与帮助入口整理。
- 不包含：删除或改变 agent-hooks 子命令，以及修改 install 行为。

## Target
- [x] T1: 运行 CSL Agent Kit CLI 的顶层帮助时，会显示当前版本，并明确告知是否存在更新版本。
- [x] T2: 顶层帮助不再展示 agent-hooks 入口，但该子命令及其现有行为保持不变；install 入口与进一步帮助指引仍然准确。

## Plan

1. 调整顶层帮助，使当前版本与更新状态清晰可见，并仅隐藏 agent-hooks 入口。
2. 增加针对帮助输出和现有 agent-hooks 路由的最小回归覆盖。
3. 执行语法检查与聚焦的 CLI 行为验证，并审查最终差异。

## Result

- T1: 实际顶层帮助显示 v5.0.0；真实 npm latest 返回 up to date，模拟 v9.0.0 返回 available，超时返回 check unavailable。
- T2: 顶层帮助仅列出 install 且无 agent-hooks；直接运行 agent-hooks help 仍以状态 0 输出原有帮助。
- Review gate: Skipped — 用户未请求独立 adversarial review；已完成主会话自审。

## Verification

- Passed: node --check 覆盖 CLI 与新增测试文件，git diff --check 通过；实际、更新可用、版本领先、超时、颜色开关及保留 agent-hooks 路由均完成手工行为验证。
