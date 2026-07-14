# Changelog

本项目的重要变更记录在此文件中，版本遵循 Semantic Versioning。

## [Unreleased]

### Added

- 新增 Pi tips/SOP lifecycle context hooks。

### Changed

- tips 改为每轮注入已确认的持续用户指令，并增加长度、数量、重复和并发写入校验。

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

[Unreleased]: https://github.com/SSBun/csl-agent-kit/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/SSBun/csl-agent-kit/releases/tag/v2.0.0
