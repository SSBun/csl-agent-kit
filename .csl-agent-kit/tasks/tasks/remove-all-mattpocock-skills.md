# 移除全部 Matt Pocock Skills

Status: Completed (2026-08-25 13:39)
Kind: Task

## Scope

- 删除 `skills/mattpocock/` 下全部第三方 Skill 包、来源元数据与来源许可证，并同步当前目录、命令发现、README 与测试消费者。
- 保留项目专用的通用第三方 Skill 集成流程、历史任务和分析产物，不修改用户全局 Skill 目录或外部参考仓库。
- 不保留被删除 Skill 的兼容别名，并避开当前工作区中与本任务无关的未提交改动。

## Target
- [x] T1: skills/ 中不再包含 Matt Pocock 来源的 Skill 包，当前目录、清单与文档引用同步清除。
- [x] T2: 其余 Skills 的发现、安装与现有行为保持有效。

## Plan

1. 固定当前 Matt Pocock Skill 清单，解析所有当前目录、文档、发现与测试消费者。
2. 删除来源分组，同步 README、项目内第三方集成示例和命令发现测试。
3. 验证旧路径与命令消失、剩余 Skill 发现和安装有效，并运行相关测试、Skill 审计及差异检查。

## Result

- T1: 任务开始时存在的 8 个 Matt Pocock Skill 包连同来源元数据和许可证已删除，skills/mattpocock 不存在；README、项目内集成示例及命令测试已同步，skills/ 下 .repository.json 数量为 0。
- T2: 剩余 24 个共享 Skills 与 README 完全一致；Pi 不再注册 11 个删除名称/别名，10 项聚焦测试、install dry-run、npm pack、npx skills 清单、OpenAI quick validation、local quality gate 与 resource-boundary 均通过。
- Review gate: Skipped — 用户未请求 adversarial review、双 Agent Reviewer–Editor 或独立 Reviewer approval。

## Verification

- Passed: 删除路径、metadata、README、Pi runtime、第三方 CLI、pack/install/discovery、Skill 审计与 diff 检查均通过；npm run check 的 31 项 CLI 阶段有 29 项通过，另 2 项为本任务未触及的既有 git-conflict manifest 与 repo-map legacy-link 失败。
