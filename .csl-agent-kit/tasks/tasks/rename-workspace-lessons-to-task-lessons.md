# 将 workspace-lessons 重命名为 task-lessons

Status: Completed (2026-08-21 10:52)
Kind: Task

## Scope

- 将 canonical Skill identity 与当前有效消费者统一为 `task-lessons`。
- 不保留旧名称兼容别名，不改写历史任务或分析记录，不改变 Lessons 数据模型、准入、查询、写入确认与验证行为。
- 保留工作区中该 Skill 包及共享规则已有的未提交内容变更。

## Target
- [x] T1: Canonical Skill 的目录、frontmatter name、Agent metadata 与 slash/discovery identity 统一为 `task-lessons`，且不存在 `workspace-lessons` 兼容别名。
- [x] T2: 当前 README、manifest、默认 Agent rules、workflow gates、Context Authority 与测试期望统一引用 `task-lessons`，旧名称只保留在历史记录和负向断言中。
- [x] T3: 重命名后的 Lessons CLI、eval fixtures 与既有 workflow 契约保持有效，任务开始前已有的未提交内容变更保持不丢失。

## Plan

1. 保存并核对当前 Skill 包基线，盘点名称的生产者与消费者。
2. 重命名 Skill identity，同步当前集成与 Context Authority。
3. 运行静态发现、manifest、Lessons、Skill package 与 diff 校验并记录结果。

## Result

- T1: Canonical 目录、frontmatter、Agent metadata、Claude manifest、递归发现与 Pi 手动发现均只暴露 task-lessons；旧目录和旧命令别名不存在。
- T2: README、默认规则、workflow gates、Context Authority 与测试期望已同步；残留搜索仅命中历史评分报告和三个负向断言，npm pack dry-run 包含 5 个新路径文件且无旧路径。
- T3: Skill 包相对任务开始快照仅发生名称替换，既有未提交内容、Lessons runtime script 与 eval fixture 均保留；新路径 CLI validate/index、Context validate、语法、规则结构及 diff 检查通过。
- Review gate: Skipped — 用户未要求 adversarial、双 Agent 或独立 Reviewer 审查。

## Verification

- Passed: 静态发现、Pi 命令发现、npm pack dry-run、Lessons 与 Context validation、local quality gate 与 resource-boundary 审核、语法和 git diff 检查完成；local quality gate 仅报告契约明确允许的 initial-load token overage，按用户规则未运行单元测试或项目测试套件。
