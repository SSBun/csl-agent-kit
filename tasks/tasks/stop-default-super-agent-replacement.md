# 停止默认替换 Agent 指令文件

Status: In Progress (2026-08-21 14:08)
Kind: Task

## Scope

- 包含：所有宿主的默认安装与已保存 checklist 均不预选 Default agent instructions；该能力保留为每次运行显式 opt-in；受支持宿主通过 session injection 获得自包含的 CSL Agent Kit 运行契约。
- 已接受边界：注入契约与用户现有 AGENTS.md 和当前请求共存，不依赖替换用户规则；Cursor 在宿主支持 injected context 前不获得该契约，也不使用默认文件替换作为回退。
- Contract 只表达 Agent 应遵守的稳定行为与质量边界，不介绍 CSL Agent Kit 的内部运行机制；记录路径、跳过枚举、协议加载、依赖故障、命令和 schema 等细节仍由对应 Skill 或共享协议持有。

## Target
- [x] T1: 默认安装不再选择 Default agent instructions，也不会替换用户现有的全局 Agent 指令文件。
- [x] T2: 用户显式选择 Default agent instructions 时，原有安装与备份行为仍然可用。
- [x] T3: Codex、Claude Code 与 Pi 的内置 session injection 提供使用 CSL Agent Kit 所需的自包含运行契约，而不只提供生命周期路由。
- [x] T4: Cursor 不支持 injected context 时仍不默认替换用户指令文件，且该兼容边界被明确保留。
- [x] T5: 既有或新保存的 checklist 选择不会自动预选 Default agent instructions，用户每次运行都需主动选择。
- [x] T6: 注入契约以行为契约而非运行机制说明的形式覆盖原默认 AGENTS.md 中影响完整使用效果的必要职责，明确服从用户规则与当前请求，并把内部操作细节留给对应 Skill 或共享协议。
- [x] T7: 实施前先在对话中展示完整的最新 Contract 候选文本，并取得用户明确批准。

## Plan

1. 对照现有注入门禁、默认 Agent 职责、Task 系列权威协议与 Ponytail 的持久注入结构，划分稳定 Contract 和易变 Skill 细节。
2. 在对话中展示完整 Contract 候选并等待用户明确批准，不提前修改交付文件。
3. 批准后实施自包含注入 Contract，并同步受影响的宿主契约、文档与持久 Context。
4. 验证受支持宿主获得完整 Contract、用户规则优先边界成立，且默认安装仍不替换 Agent 指令文件。

## Result

- T1: 隔离 HOME 的 --yes 安装只返回 codex-plugin，四个全局 Agent 指令路径均不存在且未被写入；fresh checklist 也只预选 codex-plugin。
- T3: triggerify show 确认 workspace workflow gates 在 codex、claude-code、pi 上均为 supported/active，其他默认目标仍为 codex-plugin。
- T4: triggerify show 确认 cursor 为 unsupported/inactive；README 与 CTX-install 明确记录默认安装不使用文件替换回退。
- T2: 显式 --target super-agent 在隔离 HOME 中为四个普通文件创建备份并替换为正确 symlink；--all 与当前运行的主动选择仍可执行该目标。
- T5: 保存包含 super-agent 的选择后，load 仍保留原记录，但 buildInstallChoices 对既有和新保存值均不预选 super-agent；README 与 CTX-install 已同步每次 opt-in 契约。
- T7: 用户在完整行为 Contract 候选展示后明确回复 confirm，批准实施该文本。
- T6: 批准的行为 Contract 已原样注入，覆盖目标对齐、Context、Lessons、工程判断、最小/手术式修改与验证；rg 确认不含协议加载、task_focus、记录路径或 Skill 文件机制，且 Agent Hooks 在 Codex、Claude Code、Pi 为 active、Cursor 为 unsupported。
- Review gate: Skipped — 用户未请求独立 adversarial review。
