---
schema: csl-memory/v2
id: legacy-context-2e3175e9d15b6364c50a
revision: 3
type: fact
title: Agent Hooks 接入、注入与宿主信任
summary: Hook运行时、Rules来源、生命周期与宿主信任；配置、eligible及安装成功均不等于实际注入，实际规则来源须核对。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#CTX-agent-hooks — Agent Hooks runtime and built-in
    hooks:1
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#Relationships:1
  - legacy:tasks/lessons.md;
    sha256:9cef14eb55068009da5418c84d48992d3802853f4e07ca6a8c5a47e32bbc68c6;
    unit:tasks/lessons.md#2026-07-13 Distinguish Agent-Specific And Parent
    AGENTS Files:1
updated: 2026-11-05T11:35:19.028Z
deleted: false
retrieval:
  aliases:
    - Agent Hooks 运行时与内置集成
    - 宿主 Hook 注入与信任关系
    - 核对宿主实际加载的 Agent 指令来源
  situations: []
  topics: []
  links: []
---

## Agent Hooks 运行时与内置集成

## CTX-agent-hooks — Agent Hooks runtime and built-in hooks
- Scope: Agent Hooks V1 rule storage, host-neutral execution, inner hook policy, three-level Agent Rules injection, CSL Agent Kit Contract injection, data migration, and host lifecycle adapters.
- Paths: `skills/meta/agent-hooks/`, `skills/meta/agent-rules/`, `hooks/hooks.json`, `pi/extensions/csl-context-hooks.ts`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `tests/agent-hooks.test.js`, `tests/pi-context-hooks.test.mjs`
- Keywords: agent hooks, agent rules, inner hook, session-start, inject-output, CSL Agent Kit contract, compaction, host adapter
- Authority: `skills/meta/agent-hooks/scripts/agent-hooks.js`, `skills/meta/agent-hooks/scripts/lib/store.js`, `skills/meta/agent-hooks/scripts/lib/runtime.js`, `skills/meta/agent-hooks/scripts/read-agent-rules.js`, `skills/meta/agent-hooks/scripts/read-csl-agent-kit-contract.js`, `skills/meta/agent-hooks/references/csl-agent-kit-contract.md`, `skills/meta/agent-rules/SKILL.md`, `hooks/hooks.json`
- Recheck: 当 Agent Hooks rule schema、存储路径、inner hook override、built-in Agent Rules 来源、宿主 capability 或 session/compaction lifecycle mapping 变化时复核。

### Purpose and Boundaries
- `skills/meta/agent-hooks/scripts/agent-hooks.js` 是稳定 facade；rule、store、runtime、CLI 与 native hook 模块分别负责 V1 语义、存储、执行和宿主适配，外部 adapter 通过 `createEvent()` 与 `runEvent()` 接入。

### Structure
- 用户规则、配置和脚本位于 `<data-root>/hooks/`，项目规则和脚本位于 `<workspace>/.agents/hooks/`；旧 Triggerify 用户级与项目级根目录只作为一次性迁移输入，成功迁移后不再读取。
- `skills/meta/agent-hooks/hooks/` 中的 inner hooks 随包分发、默认启用且源文件只读；用户通过 `<data-root>/hooks/config.json` 的 `disabledHooks` 和 `hookSettings` 控制自身状态。
- `inner:agent-rules` 依次合并 `skills/meta/agent-rules/agent-rules.md`、`<data-root>/agent-rules.md` 与 `<workspace>/.agents/agent-rules.md` 三个同格式单文件来源；`AGENTS.md` / `CLAUDE.md` 不属于该系统，禁用 inner hook 会同时停止三个来源的注入。
- Hook 规则、配置、事件与脚本环境协议分别使用 `agent-hooks/v1`、`agent-hooks.config/v1`、`agent-hooks.event/v1` 与 `AGENT_HOOKS_*`。
- `inner:csl-agent-kit-contract` 在 `session-start` 运行 bundled script 并注入 `skills/meta/agent-hooks/references/csl-agent-kit-contract.md` 的自包含行为契约，使 task-family 路由、目标对齐、记忆读取职责、最小与手术式执行及验证边界不依赖替换用户的 Agent 指令文件。脚本追加按当前 workspace、宿主和 payload session ID 解析的 Task 模式；Pi adapter 在每轮提供真实 session ID，避免会话覆盖丢失。配置错误保留契约并注入 confirm 诊断。

### Relationships
- `hooks/hooks.json` 的 SessionStart dispatcher 处理 startup、resume 与 compact 来源，Pi adapter 在每次 `before_agent_start` 重建 session prompts；同一 Contract prompt 不再由 manifest 直接 `cat`，避免重复注入。
- Codex manifest 显式组合共享 hooks 与 `hooks/codex-lifecycle.json`；后者只补 Interrupt/SessionEnd，均为非阻塞脚本事件，不能把这些入口加入 Claude/Pi 共享声明。`inner:itermate-codex-*` 按宿主筛选并调用 bundled adapter，只有 iTermate 的显式启用标记存在时才转发原生 payload 给用户已安装的 reporter；该规则不自行安装、改写原生 hooks 或注入模型上下文。规则 eligible、App opt-in、Codex plugin 版本/信任和实际 Socket 投递是不同验证边界。权威为 `.codex-plugin/plugin.json`、`hooks/codex-lifecycle.json`、`scripts/lib/runtime.js`、`scripts/itermate-codex-status.js`（后两者位于 Agent Hooks skill 内）。

### Decision and Verification Boundaries
- Codex、Claude Code 与 Pi 支持该 session prompt；Cursor 在宿主传递 injected context 前保持 unsupported。`tests/agent-hooks.test.js` 与 `tests/pi-context-hooks.test.mjs` 验证迁移、默认启用、Built-in → User → Project Agent Rules 合并、来源不变、用户禁用、最终 task 名称和压缩后重建边界。

## 宿主 Hook 注入与信任关系

## Relationships

- 全局 Agent Hooks 规则 `global:notify-todo-changed` 在 Pi 上通过 `edit` / `write` 的标准 `changed_files` 识别 `tasks/tasks/*.md` 变更，在 Codex 上保留 `apply_patch` header fallback；脚本规范化真实路径并限制在 workspace 的真实 `tasks/tasks` 目录后，使用 `terminal-notifier` 发送可点击的 macOS 通知。权威来源为 `~/.csl-agent-kit/hooks/notify-todo-changed.md` 与 `~/.csl-agent-kit/hooks/scripts/notify-todo-changed.js`。
- Codex 对每条非 managed command hook 按定义 hash 单独保存 trust；CSL Agent Kit 的 Agent Hooks `PostToolUse` dispatcher 必须先在 `/hooks` 中信任才会运行。
- 用户跨会话持久指令以单条全局 Agent Hooks `session-start` / `inject-prompt` 规则存放在 `<data-root>/hooks/`；Codex 与 Claude Code 通过 `SessionStart` dispatcher 注入，Pi 在每次 `before_agent_start` 重新加载。规则不按用户 prompt 关键词匹配。
- hook-only 客户端的 `UserPromptSubmit` 只运行 SOP candidates；持久指令通过 Agent Hooks `SessionStart` 规则注入。Pi 在 `before_agent_start` 重建 Agent Hooks session prompts 与 SOP context。
- 持久指令只在用户明确要求跨会话保存时创建，每条使用独立的 `global:directive-<subject>` 规则并保留高优先级指令和当前请求优先的边界；个人化内容不进入可分发的 CSL Agent Kit Contract。

## 核对宿主实际加载的 Agent 指令来源

## 2026-07-13 Distinguish Agent-Specific And Parent AGENTS Files

- **Trigger:** 判断当前 agent 使用哪份全局 `AGENTS.md`，或决定默认规则模板的更新范围时。
  - **Rule:** 同时检查 harness 实际注入的规则来源和 `~/.agents/AGENTS.md`；不要把 `~/AGENTS.md` 自动等同于 agent-specific 全局配置。历史软链接或默认路径不能证明当前宿主实际加载了相应规则；使用前核对链接目标与实际注入来源。
  - **Why:** 不同 agent 客户端可能从不同位置加载规则，仅检查 home 根目录会错误判断模板更新是否能对目标客户端生效。
