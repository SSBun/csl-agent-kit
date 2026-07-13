# Workspace Context

## Components

- `skills/super-agent/references/AGENTS.md` 是可分发的默认 agent 规则；`~/.agents/AGENTS.md` 软链接到该文件。

## Decisions and Conventions

- 任何文件修改或非简单任务都必须先在当前 workspace 的 `tasks/todo.md` 写可检查计划；`tasks/context.md` 的常规维护是唯一例外。
- 默认 agent 规则不规定 plan mode 或 subagent 策略；agent 可以按任务需要自行使用这些能力。
