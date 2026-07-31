# Changelog

本项目的重要变更记录在此文件中，版本遵循 Semantic Versioning。

## [Unreleased]

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

[Unreleased]: https://github.com/SSBun/csl-agent-kit/compare/v3.2.0...HEAD
[3.2.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v3.2.0
[3.1.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v3.1.0
[3.0.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v3.0.0
[2.0.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v2.0.0
