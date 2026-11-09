# 修复本地 Hook 配置问题

Status: Completed (2026-08-26 17:36)
Kind: Queue

## Scope

- 修复审计确认的 Claude、Codex、用户级 Hook 残留和 Pi `/title` 错误反馈问题。
- 保留无关插件、有效 Hook、用户数据和当前标题语义；不执行宽泛缓存清理或邻近配置整理。

## Target
- [x] T1: 所有审计确认的本地 Hook 配置问题均已修复：宿主使用当前 Agent Hooks 集成、旧插件与无效 marketplace 不再生效、无引用残留已清理，且 Pi 标题刷新不再以无信息超时结束。

## Plan

1. 完成 `migrate-claude-agent-hooks-plugin`，恢复 Claude Code 的当前插件集成。
2. 完成 `repair-codex-marketplace-config`，恢复 Codex 插件管理。
3. 完成 `clean-orphan-hook-artifacts`，仅删除已确认无引用的残留。
4. 完成 `fix-pi-title-dispatch-timeout`，再执行跨宿主集成验证。

## Children

1. [迁移 Claude Agent Hooks 插件](migrate-claude-agent-hooks-plugin.md)
2. [修复 Codex Marketplace 配置](repair-codex-marketplace-config.md)
3. [清理无引用 Hook 残留](clean-orphan-hook-artifacts.md)
4. [修复 Pi 标题派发超时](fix-pi-title-dispatch-timeout.md)

## Result

- T1: 集成检查确认 Claude csl@csl 2.0.0 启用且含 10 个 hooks；Codex 插件列表正常且 csl-agent-kit 指向当前 workspace、无 caveman-local；四个 Hook 残留已不存在；全局与 inner Hook 均 valid/supported/active；Pi /title 派发错误路径已改为立即反馈。
- Review gate: Skipped — 用户未要求独立 adversarial review。

## Verification

- Passed: 四个子任务均 Completed；Claude/Codex/Agent Hooks CLI 集成检查、遗留路径检查、Pi TypeScript 与测试文件语法检查、扩展导入、Context 校验、task core 校验及 git diff --check 均通过；按当前请求约束未运行单元测试。
