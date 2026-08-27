# 审计本地旧版 Hook 配置

Status: Completed (2026-08-26 17:06)
Kind: Task

## Scope

- 包含当前用户级 CSL Agent Kit 数据、当前工作区项目配置，以及已安装宿主中会影响 Agent Hooks 加载的配置。
- 仅检查目录结构和相关配置字段；不修改配置，不披露敏感值，也不把源码中的兼容迁移逻辑误报为本地残留。

## Target
- [x] T1: 盘点所有会影响当前 Agent Hooks 发现或迁移的本地 CSL Agent Kit 与宿主配置位置，并识别旧版目录、残留引用及新旧目录冲突。
- [x] T2: 对每项发现给出可复核证据、影响判断和安全处置建议，且审计期间不修改任何被审计配置。

## Plan

1. 从当前运行时和宿主接入代码确认新版与旧版配置路径及迁移边界。
2. 只读盘点当前用户、工作区和已安装宿主的相关目录与配置引用。
3. 用 CLI 状态与文件证据交叉验证，分类问题并给出安全处置建议。

## Result

- T1: 权威运行时与本地盘点确认：有效数据根为 ~/.csl-agent-kit；全局及常用项目根均无 triggerify 目录或旧协议引用；发现 Claude 仍启用旧身份 CSL@CSL 1.7.0，且旧缓存 hooks 为空。
- T2: 已按阻断问题、无影响残留和正常配置分类形成证据与安全处置建议；审计仅运行读取、列表、验证和散列命令，未修改被审计配置。
- Review gate: Skipped — 用户要求普通只读配置审计，未要求独立 adversarial review。

## Verification

- Passed: Agent Hooks CLI 显示当前全局规则与 inner 标题 Hook 在 Pi/Codex/Claude Code 能力视图均 valid；config.json 为 agent-hooks.config/v1；Claude CLI 独立复现旧插件身份错误；源码与 Codex 缓存关键 Hook 文件散列一致。
