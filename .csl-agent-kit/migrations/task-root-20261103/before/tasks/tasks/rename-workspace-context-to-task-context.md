# 将 workspace-context 重命名为 task-context

Status: Completed (2026-08-21 10:40)
Kind: Task

## Scope

- 将 canonical Skill identity 与当前有效消费者统一为 `task-context`。
- 不保留旧名称兼容别名，不改写历史任务记录或历史分析报告，不改变 Context 数据模型与运行行为。

## Target
- [x] T1: Canonical Skill 的目录、frontmatter name、Agent metadata 与 slash/discovery identity 统一为 `task-context`，且不存在 `workspace-context` 兼容别名。
- [x] T2: 当前 README、manifest、默认 Agent rules、workflow gates、Context Authority 与测试期望统一引用 `task-context`，旧名称只保留在历史记录中。
- [x] T3: 重命名后的 Context CLI、Project Core/Context Pack 解析及既有 workflow 契约保持有效。

## Plan

1. 盘点当前名称的生产者与消费者，并保护工作区已有未提交改动。
2. 重命名 Skill identity，同步当前集成与 Context Authority。
3. 运行静态发现、manifest、Context、Skill package 与 diff 校验并记录结果。

## Result

- T1: Canonical 目录、frontmatter、Agent metadata、Claude manifest 与 Pi 手动发现均只暴露 task-context；旧目录和旧命令别名不存在。
- T2: README、默认规则、workflow gates、Context Authority 与测试期望已同步；残留搜索仅命中历史评分报告和三个负向断言，npm pack dry-run 包含 6 个新路径文件且无旧路径。
- T3: Runtime script 与两个 eval fixtures 相对原包字节不变；新路径 Context core/index/validate、JS 语法、manifest、规则结构及 diff 检查均通过。
- Review gate: Skipped — 用户未要求 adversarial、双 Agent 或独立 Reviewer 审查。

## Verification

- Passed: 静态发现、Pi 命令发现、npm pack dry-run、Context validation、local quality gate 与 resource-boundary 审核、语法和 git diff 检查完成；local quality gate 仅报告契约明确允许的 initial-load token overage，按用户规则未运行单元测试或项目测试套件。
