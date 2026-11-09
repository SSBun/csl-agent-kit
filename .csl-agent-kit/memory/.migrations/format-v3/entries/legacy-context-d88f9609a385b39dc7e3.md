---
schema: csl-memory/v1
id: legacy-context-d88f9609a385b39dc7e3
revision: 1
type: fact
title: 宿主 Hook 注入与信任关系
summary: 诊断跨宿主规则注入、信任或本机通知时使用；持久配置存在不等于运行成功。
sources:
  - legacy:tasks/context.md;
    sha256:976794f4739c373530b0cbc9a350956e9ef3ba6f87e02125487bb11e6c752ca0;
    unit:tasks/context.md#Relationships:1
updated: 2026-11-02T03:43:09.164Z
deleted: false
---

## Relationships

- 全局 Agent Hooks 规则 `global:notify-todo-changed` 在 Pi 上通过 `edit` / `write` 的标准 `changed_files` 识别 `tasks/tasks/*.md` 变更，在 Codex 上保留 `apply_patch` header fallback；脚本规范化真实路径并限制在 workspace 的真实 `tasks/tasks` 目录后，使用 `terminal-notifier` 发送可点击的 macOS 通知。权威来源为 `~/.csl-agent-kit/hooks/notify-todo-changed.md` 与 `~/.csl-agent-kit/hooks/scripts/notify-todo-changed.js`。
- Codex 对每条非 managed command hook 按定义 hash 单独保存 trust；CSL Agent Kit 的 Agent Hooks `PostToolUse` dispatcher 必须先在 `/hooks` 中信任才会运行。
- 用户跨会话持久指令以单条全局 Agent Hooks `session-start` / `inject-prompt` 规则存放在 `<data-root>/hooks/`；Codex 与 Claude Code 通过 `SessionStart` dispatcher 注入，Pi 在每次 `before_agent_start` 重新加载。规则不按用户 prompt 关键词匹配。
- hook-only 客户端的 `UserPromptSubmit` 只运行 SOP candidates；持久指令通过 Agent Hooks `SessionStart` 规则注入。Pi 在 `before_agent_start` 重建 Agent Hooks session prompts 与 SOP context。
- 持久指令只在用户明确要求跨会话保存时创建，每条使用独立的 `global:directive-<subject>` 规则并保留高优先级指令和当前请求优先的边界；个人化内容不进入可分发的 CSL Agent Kit Contract。
