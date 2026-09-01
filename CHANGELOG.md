# Changelog

本项目的重要变更记录在此文件中，版本遵循 Semantic Versioning。

## [Unreleased]

## [5.0.0] - 2026-09-01

### Added

- 新增 `task-maintenance`，用于在统一确认后删除 Context／Lessons 中已证实失效的内容，并合并可安全合并的记录。

### Changed

- Task 工作流现在由 main session 统一处理 Target 与 Safety Confirmation；`task-plan` 执行交接和 Queue 委派可继承已接受的等价 Target，避免子任务重复确认。
- Canonical task 的持久产物统一存放到 `tasks/artifacts/<task-id>/` 下的 `discussions`、`specs`、`reports` 或 `evidence` 分类目录。
- 默认工作流规则改由 Agent Hooks 注入的 `inner:csl-agent-kit-contract` 提供，安装器不再替换用户的全局 Agent 指令文件。

### Fixed

- Queue 现在拒绝与 parent 或 sibling 规范化后同名的 child task，避免任务图歧义。
- 终端标签标题在数字或简短确认回复后继续使用前序上下文，不再退化成确认词摘要。

### Removed

- 移除 `super-agent` 安装目标、`--no-super-agent` 选项及其全局 `AGENTS.md`／`CLAUDE.md` 软链接机制。
- 移除旧的 `inner:workspace-workflow-gates` Hook 身份。

### Breaking Changes

- `csl-agent-kit install --target super-agent` 与 `--no-super-agent` 不再受支持；Codex、Claude Code 与 Pi 改由内置 Agent Hooks 获取 CSL Agent Kit Contract，Cursor 不提供指令文件替换回退。
- 如配置引用 `inner:workspace-workflow-gates`，需改用 `inner:csl-agent-kit-contract`；旧身份不保留迁移兼容层。

## [4.1.0] - 2026-08-29

### Added

- `create-app-icon` 新增 Chrome Extension 图标材料、Manifest 配置建议和针对小尺寸图标的验证要求。
- 新增仓库专用 Task Target Alignment 评测工作区，包含 64 个 provisional cases、离线 validator／scorer 和 fresh-context 模型评测流程；该工作区不进入共享安装或 npm 包。

### Changed

- Task Target Alignment 引入 Authorization Ledger、L0–L4 guard levels 与独立 S0／S1 Safety Overlay，统一区分琐碎直通、等价意图核对、用户歧义和授权变更。
- 新的或实质修订后的非平凡等价 Target 现在必须展示一次并等待用户确认；已确认且未变化的 Target 不重复确认。

## [4.0.0] - 2026-08-28

### Added

- 新增 `task`、`task-plan`、`task-queue`、共享 Task Target 对齐协议和会话任务聚焦机制，统一跨宿主任务生命周期。
- 新增标准化的 `task-context`、预防型 `task-lessons` 与内置 `skill-quality` 质量门禁。
- 新增 Agent Rules、三级 SOP 路由、macOS 开发 SOP、归档、项目索引和扩展后的 `tldr` 等工作流。
- Pi 新增模型与 thinking level 预设、`/quick`、可点击任务浮层和改进后的动态 Skill 命令。
- `create-app-icon` 新增 10 种内置风格、透明主图处理与平台图标材料生成。
- 新增云效审批、批量处理和本地 daemon/dashboard 能力。

### Changed

- 将 workspace workflow skills 收敛为 `task-*` 家族，并将易变流程下沉到共享 task core 与对齐协议。
- 将 Triggerify 与 Simple Rules 分别收敛为 Agent Hooks 与 Agent Rules；默认行为契约改由内置 Hook 跨宿主注入。
- 共享 Skills 按 `dev`、`domain`、`meta` 重组，CLI、Pi 和 plugin manifests 统一递归发现叶子 Skill。
- `task-context` 不再迁移旧 Context：现有非标准文件从权威来源重写，缺失文件先生成最小 Core 提案并取得确认。
- 将 `adversarial-deliberate` 重命名为 `deliberate`，并强化 effective carrier model、INLINE-FALLBACK 与量化证据要求。
- 将 code review、test triage 和 same-page 流程分别整合为 `task-review`、`bug-fix` 和 `align`。
- 安装器默认输出完整彩色进度，并改进 shell 会话保持、Codex plugin 清理和宿主工作流交付。

### Removed

- 从共享分发中移除 `release` 与 `analyze-project`；发布工作改由具体 SOP 路由，主题理解统一使用 `tldr`。
- 移除已被本项目原生工作流替代的部分第三方 Skills 和旧公开别名。

### Breaking Changes

- 旧 workspace workflow、Triggerify、Simple Rules、code review、test triage、same-page 与 adversarial-deliberate 的公开名称不再保留；调用方需改用对应的新 Skill 名称。
- 旧 Context 顶层记录不再作为 legacy Packs 读取；缺少有效 Project Core 的现有文件会被标准 Core 重写。
- `release` 和 `analyze-project` 不再作为可安装共享 Skill 提供。

## [3.2.0] - 2026-07-31

### Added

- 新增 Triggerify V1 生命周期自动化、持久指令管理和可配置 inner hooks，并支持 Codex、Claude Code 与 Pi 共享运行语义。
- 新增 `adversarial-deliberate`、通用化的 `adversarial-review`，以及跨宿主的隔离 subagent 调度。
- 新增三个 workspace workflow skills 与 Pi task overlay，用于维护上下文、任务生命周期、经验规则和实时任务进度。
- `analyze-project` 新增 develop/learn 双模式及源码驱动的学习验证流程。

### Changed

- Codex 分发收敛为单一 plugin，CLI 与 Pi 统一递归发现共享目录中的叶子 skills。
- Triggerify 重构为共享 facade、存储、规则、运行时和宿主适配层，并增强 Pi 文件变更、终端标题与 session 状态处理。
- 任务记录采用 canonical task 与轻量索引分离的格式，独立审查仅在用户明确要求时启用。

### Removed

- 移除旧 `tips`、`super-agent` skill 和 `ubiquitous-language` skill；持久指令改由 Triggerify 管理，默认 Agent 规则继续由 `super-agent/` 资产分发。

## [3.1.0] - 2026-07-16

### Added

- 导入 13 个选定的 Matt Pocock skills，并为每个技能保留可比较上游更新的 `.repository.json` 元数据。
- 新增仅当前仓库可发现的 `integrate-third-skills` 流程及上游状态/差异检查脚本。

### Changed

- `csl-agent-kit install` 的默认选择改为 Codex skills symlinks 与 Codex plugin hooks。
- CLI 与 Pi 递归发现共享 `skills/` 下的叶子技能，以支持按来源分组的第三方技能。

### Removed

- 移除 `Repo-local .agents/skills links` 安装目标；`.agents/skills/` 仅用于项目本地技能。

## [3.0.0] - 2026-07-15

### Added

- 新增 Pi tips/SOP lifecycle context hooks。

### Changed

- Codex plugin identity 改为 `csl-agent-kit@csl-agent-market`，installer 会清理旧的 `csl@CSL` 和 `csl@csl` 注册。
- tips 改为带必填关键词的 JSON；Codex 与 Pi 每轮静默检查全部 tips，仅在当前 prompt 命中关键词时注入对应 tip；不再支持 `"*"` 全局关键词，旧 Markdown 可经确认后迁移并保留 `.bak` 备份。
- tips 候选上下文压缩为一行适用/优先级说明和命中的条目，避免每轮重复注入冗余前言。
- 交互式 `csl-agent-kit install` 会记住已确认的 integrations，并在下次打开 checklist 时自动预选；显式安装参数不会覆盖该记录。

### Removed

- 移除与 `tasks/todo.md`、`tasks/context.md` 职责重复的 `handoff-save` 和 `handoff-restore` skills。

## [2.0.0] - 2026-07-10

### Added

- 新增 `csl-agent-kit` npm CLI，提供基于 `prompts` 的交互式安装面板。
- 新增 Cursor、Codex skills、Codex plugin hooks、Pi package 与 repo-local link 安装目标。
- 新增 `--dry-run`、`--json`、`--verbose`、`--color` 与 `--no-color` CLI 参数。
- 新增默认彩色、按 integration 聚合的安装结果输出及 Node CLI 回归测试。
- 新增 Pi 动态 skill slash-command aliases 与 OpenAI Codex Fast Mode extension。
- 新增 `super-agent`，用于备份目标 agent 配置并把默认 `AGENTS.md` 软链接到目标位置。

### Changed

- 项目从 CSL Skills 更名为 CSL Agent Kit，npm package 改为 `@ssbun/csl-agent-kit`。
- Plugin namespace 统一为 `csl`，Claude 命令改为 `/csl:<skill>`。
- 本地用户数据目录改为 `~/.csl-agent-kit/`。
- `scripts/install.sh` 改为 npm CLI 的薄包装入口，安装逻辑由 Node 完整实现。
- SOP Manager 改进 SOP 路由字段、候选匹配、summary 输出与流程型/规则型示例。
- Release skill 改为只路由真实存在的具体 release SOP。

### Removed

- 移除旧 `~/.ssbun-skills/` fallback、迁移逻辑和 `SSBUN_TIPS_*` 环境变量兼容。
- 移除旧 `inject-may-agents` skill，替换为 `super-agent`。
- 移除空壳 `release-orchestrator` SOP。

### Breaking Changes

- 旧 `/CSL:<skill>` namespace 不再保留；改用 `/csl:<skill>`。
- 旧 `~/.ssbun-skills/` 路径不再读取；用户数据只使用 `~/.csl-agent-kit/`。
- 旧 `inject-may-agents` invocation 不再存在；改用 `super-agent`。

[Unreleased]: https://github.com/SSBun/csl-agent-kit/compare/v5.0.0...HEAD
[5.0.0]: https://github.com/SSBun/csl-agent-kit/compare/v4.1.0...v5.0.0
[4.1.0]: https://github.com/SSBun/csl-agent-kit/compare/v4.0.0...v4.1.0
[4.0.0]: https://github.com/SSBun/csl-agent-kit/compare/v3.2.0...v4.0.0
[3.2.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v3.2.0
[3.1.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v3.1.0
[3.0.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v3.0.0
[2.0.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v2.0.0
