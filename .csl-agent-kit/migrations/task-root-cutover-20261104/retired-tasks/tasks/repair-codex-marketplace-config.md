# 修复 Codex Marketplace 配置

Status: Completed (2026-08-26 17:26)
Kind: Task
Parent: fix-local-hook-config-issues

## Scope

- 仅移除指向缺失来源的 `caveman-local` 插件与 marketplace 配置；不清理其他 Codex 缓存或更改其他插件状态。

## Target
- [x] T1: codex plugin list --json 成功返回，失效的 caveman-local marketplace 不再阻断插件管理。
- [x] T2: csl-agent-kit@csl-agent-market 保持启用并指向当前 Agent Hooks 实现，无关插件保持不变。

## Plan

1. 记录当前插件配置并确认唯一阻断项为 `caveman-local`。
2. 通过 Codex CLI 移除失效插件声明与 marketplace。
3. 验证插件列表、CSL 状态和无关插件配置。

## Result

- T1: Codex CLI 移除 caveman@caveman-local 与 caveman-local marketplace 后，codex plugin list --json 成功且输出不再包含 caveman-local；空缓存目录已删除。
- T2: config.toml 中其余 marketplace/plugin 配置逐项不变，CSL 插件仍 enabled 并指向当前仓库；缓存 Hook manifest 与 Agent Hooks store 源码散列一致。
- Review gate: Skipped — 用户未要求独立 adversarial review；使用 Codex CLI、TOML 对比和文件散列验证。

## Verification

- Passed: codex plugin list --json 退出成功；失效声明为空，非目标配置一致，CSL Hook 文件散列匹配。
