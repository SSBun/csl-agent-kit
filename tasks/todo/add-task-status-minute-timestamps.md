# 为任务状态增加分钟级时间戳

**Status:** In Progress (2026-07-22 12:52)

### Scope

- 更新 workspace task workflow 的状态格式契约。
- 将研究确认的 task record 职责边界应用到下一次新任务。
- 同步当前 standing-orders 任务的索引与 canonical 状态。

### Target

- 新增或更新的任务状态统一显示为 `Status (YYYY-MM-DD HH:MM)`。
- 新任务只使用 Target checkbox，不再创建独立 Checklist 或 checkbox Plan。
- `tasks/todo.md` 与 owning task 文件保持完全相同的状态文本。

### Plan

1. 明确 skill 中的分钟级时间戳与本地时间要求。
2. 更新状态格式测试和已有目标条目。
3. 运行 skill 审计与相关测试。
4. 将最终 artifact 交给 adversarial review。
5. 应用研究报告确认的 task record 格式。

### Checklist

- [x] Skill 明确规定小时和分钟格式。
- [x] 测试覆盖分钟格式与 index/canonical 同步契约。
- [x] Standing-orders 任务索引与 canonical 状态同步。
- [x] 下一次新任务采用 Target checkbox、普通 Plan 和逐 Target Evidence。
- [x] Workflow 不再要求独立 Checklist。
- [ ] 相关验证和最终审查通过。

### Result

- Workflow skill 已规定本地 `YYYY-MM-DD HH:MM` 状态格式。
- Skill 结构校验与 7 个任务图测试通过。
- 未批量改写未触及的历史任务。
- Workflow skill 已应用研究报告确认的 task record 职责边界，并声明从下一项新任务开始采用。
