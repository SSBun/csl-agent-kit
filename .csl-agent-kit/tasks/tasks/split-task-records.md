# 提交当前改动并拆分任务记录

状态：已完成（2026-07-19）

## 目标

- 先将当前工作区全部 tracked 与 untracked 改动作为一个经审查的 Git commit 保存。
- 将共享 `tasks/todo.md` 改为轻量索引，每个任务使用 `tasks/todo/<task-slug>.md` 作为唯一权威记录。
- 让 adversarial review 报告与对应任务文件一一链接，避免并行 Agent 覆盖其他任务状态。

## 计划

- [x] 暂存、验证并独立审查当前全部本地改动，批准后创建 baseline commit。
- [x] 迁移现有任务为独立文件，并把 `tasks/todo.md` 收缩为导航索引。
- [x] 更新默认规则、adversarial-review 契约、固定场景和工作区上下文。
- [x] 运行规则/skill 审计、仓库检查和最终独立复审。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: `task_file_split_reviewer`
- Round: 4
- Scope: 独立任务文件迁移、索引、规则契约与报告互链
- Summary: 131 条任务拆分、双向同-slug 互链、默认规则与防漂移测试已通过 RE-REVIEW (4)。
- Unresolved: none
- Report: [Adversarial review report](../artifacts/split-task-records/reports/adversarial-review.md)

## 复核

- `tasks/todo.md` 已收缩为 131 条 newest-first 导航项；每条任务正文位于独立 `tasks/todo/<task-slug>.md`。
- 四份 adversarial review 报告与任务文件使用相同 slug 双向链接；测试覆盖目标缺失、交叉 slug、集合漂移和索引状态不一致。
- 127 条非活跃历史任务与 baseline 字节一致，2 条只调整迁移所需的报告相对路径，2 个活跃任务保留并发期间的最新状态。
- `npm run check` 通过 56 项测试与安装 dry-run；Skill Creator、local quality gate、21/21 trigger eval、JSON、symlink 与 diff 检查通过。
- 独立 Reviewer 在 `RE-REVIEW (4)` 批准 staged tree `e11f3f2b5bd197b9eecfa77897ac163b91b4e794`，R2-1、R3-1、R3-2 全部关闭。
