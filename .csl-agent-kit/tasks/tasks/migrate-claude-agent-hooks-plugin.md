# 迁移 Claude Agent Hooks 插件

Status: Completed (2026-08-26 17:24)
Kind: Task
Parent: fix-local-hook-config-issues

## Scope

- 仅迁移 CSL marketplace 与插件身份；不更新、禁用或卸载其他 Claude Code 插件。
- 使用当前仓库的有效 marketplace，不保留已失效的 `CSL@CSL` 兼容副本。

## Target
- [x] T1: Claude Code 已启用当前 csl@csl 插件，插件清单不再包含 CSL@CSL 或对应 marketplace 错误。
- [x] T2: 当前 Claude 插件包含新版 Agent Hooks dispatcher，且无关插件和用户数据保持不变。

## Plan

1. 记录旧 CSL 插件与 marketplace 状态并确认当前清单有效。
2. 通过 Claude CLI 移除旧身份，重新注册当前 marketplace 并安装当前插件。
3. 验证插件身份、Hook dispatcher 和无关插件清单保持不变。

## Result

- T1: Claude CLI 卸载 CSL@CSL、重新注册当前 csl marketplace 并安装 csl@csl 2.0.0；plugin list 显示 enabled 且 errors 为空。
- T2: plugin details 显示 10 个 Hook，安装缓存 hooks/hooks.json 包含 Agent Hooks dispatcher；迁移前后非 CSL 插件状态逐项一致。
- Review gate: Skipped — 用户未要求独立 adversarial review；通过 Claude CLI 与安装文件交叉验证。

## Verification

- Passed: claude plugin list、marketplace list、plugin details 和 dispatcher 内容检查全部通过，旧 CSL@CSL 引用扫描为空。
