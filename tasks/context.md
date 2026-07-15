# Workspace Context

## Components

- `skills/sop-manager/sops/code-style.md` 是跨语言的内置代码风格 SOP；它按语言读取 `skills/sop-manager/references/code-style/` 中的规则参考，Swift 参考为 `swift-style.md`，并已合并后删除用户级 `~/.csl-agent-kit/sops/swift-code-style.md`。
- `skills/super-agent/references/AGENTS.md` 是可分发的默认 agent 规则；`~/.agents/AGENTS.md` 软链接到该文件。
- `~/.agents/skills` 是多个 agent 共用的技能安装目录；`~/.agents/.skill-lock.json` 记录通过安装器安装的技能来源与上游路径。
- `~/Desktop/test/skills` 是 `mattpocock/skills` 的本地参考仓库；技能按 `engineering`、`productivity`、`misc`、`personal`、`in-progress`、`deprecated` 分桶。

## Relationships

- tips 数据位于 `/Users/caishilin/.csl-agent-kit/tips/tips.json`；每条含 `text` 与 `keywords`，运行时只注入当前 prompt 命中的条目。
- 交互式 `csl-agent-kit install` 的已确认目标保存在 `/Users/caishilin/.csl-agent-kit/install-selection.json`；下次 checklist 会以其为预选项。
- hook-only 客户端的 `UserPromptSubmit` 同时运行 tips 与 SOP candidates；命中的 tips 只注入一行简洁的适用/优先级说明与条目。`SessionStart` 和 `PostCompact` 不再注入完整 tips。Pi 在 `before_agent_start` 临时重建当前 prompt 的候选 tips context。
- tips 单条上限为 150 个 Unicode code point、最多 20 条、正文合计最多 2,000 个字符；每条 prompt 都静默检查全部显式关键词，`"*"` 不受支持。

## Decisions and Conventions

- `skills/sop-manager/references/code-style/swift-style.md` 只保留按主题分组的 Swift 具体规则：类型与状态、可选值与失败路径、控制流、enum 与 MARK、extension 组织、方法布局、文档注释和改动边界；覆盖 `T!` 边界、强制操作、`guard`、`for ... where`、`@unknown default`、类型简写和公开声明 summary。只有需要展示精确语法或布局的规则才附最小代码块，适用边界和使用顺序放在 `code-style.md`。
- 任何文件修改或非简单任务都必须先在当前 workspace 的 `tasks/todo.md` 写可检查计划；`tasks/context.md` 的常规维护是唯一例外。
- 默认 agent 规则不规定 plan mode 或 subagent 策略；agent 可以按任务需要自行使用这些能力。d
- npm 发布白名单显式排除 `skills/super-agent/references/AGENTS.md.backup-*`，因此该本地备份即使被 Git 跟踪也不会进入 npm tarball。
