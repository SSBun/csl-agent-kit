# 以简洁对话呈现审查思考过程

Status: Completed (2026-07-21)

## Scope

- 对象：`adversarial-review` 的最终报告格式。
- 包含：报告 frontmatter、Editor–Reviewer 对话正文和最终决定。
- 包含：报告 contract cases 和用户指定的现有报告样例。
- 包含：新格式的确定性契约检查。
- 排除：修改 Reviewer–Editor 审查循环本身。
- 排除：重命名 task 或 report 文件。
- 排除：批量迁移其他历史报告。

## Target

- Frontmatter 使用 `created`、可选 `task` 和 `review_cycles`。
- `created` 保留首次生成日期，恢复审查时不改变。
- `review_cycles` 累计 Reviewer 完整审查次数。
- 正文按 Topic 汇总影响结论的 Editor–Reviewer 往返。
- 每轮使用 `E1`、`R1`、`E2`、`R2` 顺序表达。
- 对话使用引用块；单一观点同行表达，多个观点使用列表。
- 每个 Topic 使用一个 `Conclusion` 收束。
- Final decision 保留在正文并包含 Decision、Outcome、Remaining。
- 正文不暴露 finding ID、raw transcript 或中间控制状态。
- 用户指定报告保留原有实质内容和最终决定。

## Plan

1. 重写最终报告格式契约。
2. 更新报告 contract cases。
3. 转换用户指定的现有报告。
4. 添加新格式契约检查。
5. 运行 Skill 校验、报告验证和规则审计。
6. 将最终差异提交 adversarial review。

## Checklist

- [x] Frontmatter 字段、日期和累计轮次语义明确。
- [x] Topic 使用连续 E/R 对话和 Conclusion。
- [x] 单一观点和多观点格式边界明确。
- [x] Final decision 位于正文。
- [x] 报告正文排除内部审查元数据。
- [x] 指定报告已转换且语义未丢失。
- [x] 其他历史报告和文件名未修改。
- [x] 定向测试、Skill 校验和规则审计通过。

## Result

- 交付：报告 frontmatter 使用 `created`、可选 `task` 和累计 `review_cycles`。
- 交付：正文按 Topic 使用 E/R 引用对话，并以 `Conclusion` 收束。
- 交付：单一观点同行表达，多个独立观点改用引用块内列表。
- 交付：Final decision、Outcome、Remaining 保留在正文。
- 交付：用户指定报告已转换为新格式，原有三轮实质讨论和批准结论保持不变。
- 边界：其他历史报告和现有 task/report 文件名未修改。
- 验证：Skill 结构校验、JSON contract 校验、定向样例测试和 `git diff --check` 通过。
- 验证：`yao-meta-skill` 规则审计通过。
- 限制：Yao 通用 `output-eval` 只接受 JSONL，项目 report contract 为结构化 JSON；本次由定向 Node 测试执行该契约验证。
- 审查：APPROVED — [Adversarial review report](../../reports/adversarial-review/present-review-dialogue-clearly.md)
