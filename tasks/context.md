# Workspace Context

## Components

- `skills/super-agent/references/AGENTS.md` 是可分发的默认 agent 规则；`~/.agents/AGENTS.md` 软链接到该文件。
- `~/.agents/skills` 是多个 agent 共用的技能安装目录；`~/.agents/.skill-lock.json` 记录通过安装器安装的技能来源与上游路径。
- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。

## Relationships

- tips 数据位于 `/Users/caishilin/.csl-agent-kit/tips/tips.json`；每条含 `text` 与 `keywords`，运行时只注入当前 prompt 命中的条目。
- 交互式 `csl-agent-kit install` 的已确认目标保存在 `/Users/caishilin/.csl-agent-kit/install-selection.json`；下次 checklist 会以其为预选项。
- hook-only 客户端的 `UserPromptSubmit` 同时运行 tips 与 SOP candidates；命中的 tips 只注入一行简洁的适用/优先级说明与条目。`SessionStart` 和 `PostCompact` 不再注入完整 tips。Pi 在 `before_agent_start` 临时重建当前 prompt 的候选 tips context。
- tips 单条上限为 150 个 Unicode code point、最多 20 条、正文合计最多 2,000 个字符；每条 prompt 都静默检查全部显式关键词，`"*"` 不受支持。

## Decisions and Conventions

- 任何文件修改或非简单任务都必须先在当前 workspace 的 `tasks/todo.md` 写可检查计划；`tasks/context.md` 的常规维护是唯一例外。
- 默认 agent 规则不规定 plan mode 或 subagent 策略；agent 可以按任务需要自行使用这些能力。d
- npm 发布白名单显式排除 `skills/super-agent/references/AGENTS.md.backup-*`，因此该本地备份即使被 Git 跟踪也不会进入 npm tarball。
