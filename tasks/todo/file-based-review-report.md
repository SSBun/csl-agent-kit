# 将 adversarial review 报告改为文件化记录

状态：已完成（2026-07-19）

## 目标

- 每个审查任务维护一个 `reports/adversarial-review/<task-slug>.md`，从首次审查开始持续更新。
- `tasks/todo.md` 只保留紧凑审查摘要并链接完整报告。
- 终止审查时不在用户对话中展示完整报告，只提供正常任务结果或必要的阻塞问题。

## 计划

- [x] 收紧报告生命周期、内容、路径、身份显示和批准边界契约。
- [x] 更新任务摘要契约及覆盖文件化输出行为的验证。
- [x] 运行 Skill Creator、Yao、仓库检查与独立 adversarial review。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: `file_review_report_reviewer`
- Round: 2
- Scope: adversarial-review 文件化报告、任务摘要链接及非对话输出契约
- Summary: 文件化报告契约、任务摘要链接与非对话交接已通过独立复审。
- Unresolved: none
- Report: [Adversarial review report](../../reports/adversarial-review/file-based-review-report.md)

## 复核

- 每个 review task 现在从 `INITIAL (1)` 前创建并持续复用一份稳定报告；批准失效会立即回滚状态并刷新 fingerprint。
- `tasks/todo.md` 只保留短 Reviewer 名、Gate、状态、轮次、scope、摘要、未解决项与相对链接；完整报告不再粘贴到用户对话。
- 5 个固定生命周期场景与独立前向试用覆盖首次批准、批准失效、任务归属不明、需要用户及纯管理同步。
- Skill Creator、Yao、21/21 trigger eval、JSON、53 项仓库测试、安装 dry-run、`git diff --check` 均通过；独立 Reviewer 在 `RE-REVIEW (2)` 关闭 R1–R5 并批准 fingerprint `da745a612fb1aa9ee526de8ed8ee5d156671387ae3cba05a864aff24d2ea943d`。
