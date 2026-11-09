# 精简全局 Agent Skills

## 计划

- [x] 对照 `mattpocock/skills` 当前 README 与本机目录，确定稳定、日常使用的最小技能集合。
- [x] 清空 `~/.agents/skills` 及其过期锁记录，再从上游安装选定技能。
- [x] 验证仅保留选定目录、每项均含 `SKILL.md`，并复核锁文件。

## 复核

- 选定集合：`grill-with-docs`、`grilling`、`to-spec`、`implement`、`tdd`、`diagnosing-bugs`、`code-review`、`research`、`codebase-design`、`domain-modeling`、`resolving-merge-conflicts`、`handoff`。它覆盖需求澄清、规格、实现、测试、诊断、审查、研究、设计和交接；`grilling` 是 `grill-with-docs` 的直接依赖。不安装上游标记为 `in-progress` 的技能，也不安装功能重叠的 `grill-me`、一次性项目配置的 `setup-matt-pocock-skills` 或依赖特定 issue tracker 的工作流。
- 用户明确要求清空 `~/.agents/skills`，因此不保留其中的个人、第三方或旧版技能。
- 已清除 57 个原有条目（包括 14 个 CSL Agent Kit 符号链接），并从 `mattpocock/skills` 的 `main` 重装选定 12 项；锁记录从 42 项收敛为相同的 12 项，来源均为 `mattpocock/skills`。
- 目录枚举、12 个 `SKILL.md`、零符号链接及 `skills list --global --json` 均与预期一致。`skill-quality` 审计发现上游 12 项均缺少 `agents/interface.yaml`；`code-review`、`codebase-design` 和 `diagnosing-bugs` 也超出其 1,000-token 入口预算。为保持上游技能原样，未在本地补丁修复这些上游质量问题。
