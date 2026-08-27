# 将 Lessons 收敛为当前有效防错规则

Status: Completed (2026-07-21)

## Scope

- 对象：`workspace-capture-lessons` 的 Lesson 格式和维护流程。
- 包含：新增、更新、替换和删除 Lesson 的决策边界。
- 包含：更新或删除既有条目前的用户确认门禁。
- 包含：新格式和确认门禁的契约验证。
- 排除：批量迁移现有 `tasks/lessons.md` 条目。
- 排除：修改 Context、Task 或 Adversarial Review 工作流。

## Target

- 新增或改写的 Lesson 只使用 `Trigger`、`Rule`、`Check`。
- 每个字段使用列表并保持单项单义。
- Lesson 文件表示当前有效规则集，不保留冲突或失效规则作为历史。
- 新纠正与既有 Lesson 重叠或冲突时，优先更新、替换或删除既有条目。
- 更新或删除既有 Lesson 前必须获得用户明确写入确认。
- 未确认的拟议更新或删除不得写入文件。
- 既有 Lesson 保持不变，直到以后经确认被触及。

## Plan

1. 收敛 Lesson 格式和质量条件。
2. 定义新增、更新、替换、删除和无操作决策。
3. 加入更新与删除的确认门禁。
4. 添加格式和权限契约验证。
5. 运行 Skill 校验、触发验证和规则审计。
6. 将最终差异提交 adversarial review。

## Checklist

- [x] Skill 声明 `Trigger`、`Rule`、`Check` 三字段格式。
- [x] Skill 不再把 `Why` 声明为 Lesson 字段。
- [x] Skill 将 Lessons 定义为当前有效规则集。
- [x] Skill 覆盖新增、更新、替换、删除和无操作决策。
- [x] 更新或删除既有条目前必须获得用户确认。
- [x] 未确认时不得写入现有 Lesson。
- [x] 现有 Lesson 未被批量迁移。
- [x] 定向测试、Skill 校验、触发验证和规则审计通过。

## Result

- 交付：Lesson 新契约使用 `Trigger`、`Rule`、`Check` 列表。
- 交付：Skill 先比较相关旧规则，再选择新增、更新、替换、删除或无操作。
- 交付：更新、合并、替换或删除既有条目前必须展示精确变更并获得明确写入许可。
- 交付：冲突、失效或被取代的 Lesson 不再作为历史保留。
- 兼容：既有旧格式 Lesson 保持可应用，不做批量迁移；以后经确认更新时再转换。
- 验证：Skill 结构校验和定向契约测试通过。
- 验证：13 项触发、排除和相邻路由用例全部通过。
- 验证：`skill-quality` 规则审计和 `git diff --check` 通过。
- 审查：APPROVED — [Adversarial review report](../../reports/adversarial-review/optimize-workspace-capture-lessons.md)
