# 添加完整路径引用的内置 Agent Rule

Status: Completed (2026-08-21 17:50)
Kind: Task

## Scope

- 为 `agent-rules` 增加随 CSL Agent Kit 分发的正式 built-in 规则层，并通过现有 `inner:agent-rules` 生命周期注入。
- 将 built-in、用户级与项目级 Agent Rules 统一为各层级单一、同名、同格式的 `agent-rules.md`；不把无条件规则扩展为条件 Hook。

## Target
- [x] T1: Agent Rules 具有可分发、可验证的 built-in 规则来源，且无需用户级文件即可生效。
- [x] T2: 内置规则要求所有文件与目录引用使用完整绝对路径；可点击的本地 Markdown 链接使用绝对 `file://` URL。
- [x] T3: `inner:agent-rules` 同时注入 built-in 与用户级规则，且不覆盖用户内容。
- [x] T4: Built-in、用户级与项目级 Agent Rules 分别以 `skills/meta/agent-rules/agent-rules.md`、`<data-root>/agent-rules.md`、`<workspace>/.agents/agent-rules.md` 作为同格式的单一规则来源。
- [x] T5: `inner:agent-rules` 按 Built-in → User → Project 合并注入且不修改来源文件；项目 `AGENTS.md` / `CLAUDE.md` 不属于 Agent Rules 系统。

## Plan

1. 将 built-in 多文件来源收敛为单一 `agent-rules.md`，并接入项目级同名来源。
2. 对齐 Agent Rules、Agent Hooks、README、Context 与回归 fixture 的三层存储及合并契约。
3. 验证各层缺失与存在组合、合并顺序、来源文件不变、支持宿主、发布包与 Skill 审计边界。

## Result

- T1: 隔离数据目录下无用户规则时，Codex、Claude Code 与 Pi 的真实 Agent Hooks 运行时均注入 built-in 规则；npm pack dry-run 包含该规则文件。
- T2: 直接脚本与运行时 smoke 均确认注入文本包含 full absolute path 及绝对 file:// URL 要求。
- T3: 隔离运行时确认 built-in 与 canonical user 规则共同注入，用户文件保持字节不变；禁用 inner hook 后所有 Agent Rules 来源均停止注入。
- T4: 文件布局、生产引用扫描与 npm pack dry-run 确认 Built-in、User、Project 只使用各层级单一 agent-rules.md；simple-rules.md 运行时回退及旧 built-in rules 目录已移除。
- T5: 独立 data/workspace 的直接脚本与真实 Hook 运行时 smoke 确认 Built-in → User → Project 顺序、缺失层级降级、来源字节不变；SKILL/README 明确 AGENTS.md 与 CLAUDE.md 在系统外。
- Review gate: Skipped — 用户未明确要求独立 adversarial review。

## Verification

- Passed: Node 语法、三层直接脚本与真实 Hook 运行时、CLI 宿主状态、Skill 发现、npm pack、旧来源扫描、Context/Lessons、diff 及两包 Yao/resource 审计完成；agent-hooks 仅有允许的 initial-load token budget 超限，未运行单元测试。
