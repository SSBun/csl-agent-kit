# 将 adversarial review 报告改为文件化记录

状态：已完成（2026-07-20）

## 目标

- 每个审查任务维护一个 `reports/adversarial-review/<task-slug>.md`，从首次审查开始持续更新。
- `tasks/todo.md` 只保留紧凑审查摘要并链接完整报告。
- 终止审查时不在用户对话中展示完整报告，只提供正常任务结果或必要的阻塞问题。
- 批准后的对话不得使用审查报告标题或复述 Gate、Reviewer、轮次等报告元数据。
- 报告文件提供每个审查问题、Editor 回答和最终结论的紧凑摘要。
- 报告正文以审查主题和逐议题辩论结果为中心，流程元数据只放在末尾技术附录。

## 计划

- [x] 收紧报告生命周期、内容、路径、身份显示和批准边界契约。
- [x] 更新任务摘要契约及覆盖文件化输出行为的验证。
- [x] 运行 Skill Creator、local quality gate、仓库检查与独立 adversarial review。
- [x] 收紧批准后的用户对话交接契约并增加报告式摘要回归场景。
- [x] 运行 Skill Creator、local quality gate、仓库检查与独立 adversarial re-review。
- [x] 新增问题—回答—结论摘要契约并更新现有报告。
- [x] 补充评测，运行 Skill Creator、local quality gate、仓库检查和独立 adversarial re-review。
- [x] 将报告契约重构为用户优先正文和技术附录。
- [x] 把当前任务报告迁移为样例，补充评测、验证和独立复审。

## Review status

- Gate: APPROVED
- State: APPROVED
- Reviewer: `file_review_report_reviewer`
- Round: 9
- Scope: adversarial-review 用户优先报告结构、逐议题辩论结果及技术附录
- Summary: 用户优先报告结构、边界状态契约及已确认的审查概念和共同原则保持一致。
- Unresolved: none
- Report: [Adversarial review report](../artifacts/file-based-review-report/reports/adversarial-review.md)

## 复核

- 每个 review task 现在从 `INITIAL (1)` 前创建并持续复用一份稳定报告；批准失效会立即回滚状态并刷新 fingerprint。
- `tasks/todo.md` 只保留短 Reviewer 名、Gate、状态、轮次、scope、摘要、未解决项与相对链接；完整报告不再粘贴到用户对话。
- 5 个固定生命周期场景与独立前向试用覆盖首次批准、批准失效、任务归属不明、需要用户及纯管理同步。
- Skill Creator、local quality gate、21/21 trigger eval、JSON、53 项仓库测试、安装 dry-run、`git diff --check` 均通过；独立 Reviewer 在 `RE-REVIEW (2)` 关闭 R1–R5 并批准 fingerprint `da745a612fb1aa9ee526de8ed8ee5d156671387ae3cba05a864aff24d2ea943d`。
- 新增批准对话回归场景，覆盖批准结论、Gate、State、Stop reason、Reviewer、轮次、findings、审查历史及外部操作授权；无上下文前向试用仅输出任务结果、验证和报告链接。
- Skill Creator、local quality gate、21/21 trigger eval、JSON、56 项仓库测试、安装 dry-run、`git diff --check` 与 Codex 插件缓存一致性检查均通过。
- 问答摘要评测和完整报告前向试用覆盖已解决项、未解决用户问题、Reviewer–Editor 分歧、hidden reasoning/raw prompt/transcript 排除及无 finding 结论；本地 Codex 插件缓存已刷新。
- 用户优先样例、pre-INITIAL 空 ledger 和 NOTE 无修改关闭均通过全新线程前向试用；报告正文不再以流程元数据为主。
- 完整仓库检查 56 项测试、安装 dry-run 与 `git diff --check` 均通过。
