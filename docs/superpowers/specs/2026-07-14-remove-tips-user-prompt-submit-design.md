# 移除 Tips 的 UserPromptSubmit 注入

## 目标

避免 Codex 等 hook-only 客户端在同一会话中逐轮追加完整 tips，从而累积重复 developer context。

## 选定方案

仅从以下两个 hook manifest 的 `UserPromptSubmit` 事件中删除执行 `tips-inject.sh` 的 command hook：

- `hooks/hooks.json`
- `.codex-plugin/hooks/hooks.json`

保留同一事件下的 `sop-candidates.js`，因此 prompt-specific SOP 路由继续逐轮运行。保留 `SessionStart` 与 `PostCompact` 的 tips 注入，因此新会话、恢复、清空和压缩后仍会加载已确认的 tips。

Pi 的 `before_agent_start` 使用临时 system prompt，不会把旧 tips 逐轮追加到历史；本次不改动该路径。

## 行为变化

- 会话开始或恢复时加载 tips。
- compact 后重新加载 tips。
- 普通用户 prompt 不再重复追加 tips。
- 会话中途新增、修改或删除 tips，不会在下一轮立即刷新；需要新会话、clear 或 compact 后生效。
- SOP candidates 仍在每个 `UserPromptSubmit` 上运行。

## 实现与验证

先修改测试，要求两个 manifest 的 `UserPromptSubmit` 不包含 `tips-inject.sh`，但仍包含 `sop-candidates.js`，并确认测试在生产配置未改时按预期失败。随后执行最小配置修改，并同步调整 tips doctor，使其只把 `SessionStart` 与 `PostCompact` 视为 hook-only 客户端所需的 tips 生命周期。

验证覆盖：聚焦 tips 测试、完整项目检查、两个 hook manifest parity、JSON/Bash 语法、npm pack 内容、残留 `UserPromptSubmit` tips 引用扫描，以及 Yao skill/hook 审计。

## 未采用方案

- 删除整个 `UserPromptSubmit`：会误删 SOP candidate 路由。
- 保留逐轮注入并尝试 hash 去重：Codex hook API 没有替换既有 developer context 的能力，无法可靠撤销旧 tips。
- 同时删除 Pi 的逐轮刷新：Pi 使用临时 system prompt，不存在同类历史累积问题。
