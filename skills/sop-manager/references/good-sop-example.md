---
name: save-markdown-docs
description: 用于用户要求把生成的 Markdown 计划、报告或实施指南保存到指定文档目录时。
version: 1.0
owner: example
---

# Save Markdown Docs SOP

## Purpose

确保 agent 在保存 Markdown 文档时使用明确路径、可点击的完整文件名和可验证的保存结果，避免把文档散落到错误目录。

## Scope

适用：
- 用户要求保存计划、报告、实施指南、审计结果或其他 Markdown 文档。
- 用户指定了目标文档目录，或已有明确的默认 wiki/docs 目录。

不适用：
- 用户只要求在对话中总结，不要求保存文件。
- 文件不是 Markdown。
- 需要发布、部署、删除、覆盖大量文件的流程。

## Prerequisites

- 已确认目标目录存在，或用户允许创建它。
- 已确认文件名，或能从任务标题生成简短 kebab-case 文件名。
- 已确认覆盖同名文件前需要用户明确同意。

## Procedure

1. 确认目标路径。
   - Action: 确定完整输出路径，包括目录和 `.md` 文件名。
   - Expected Result: 对话中能展示一个完整、可点击的绝对路径。

2. 检查是否会覆盖文件。
   - Action: 如果目标文件已存在，先告诉用户完整路径并询问是否覆盖。
   - Expected Result: 未经用户确认，不覆盖已有文件。

3. 写入 Markdown 文件。
   - Action: 将最终内容写入目标 `.md` 文件。
   - Expected Result: 文件存在且内容与准备保存的 Markdown 一致。

4. 验证保存结果。
   - Action: 读取文件开头或运行等价检查，确认文件可读。
   - Expected Result: 能向用户报告保存成功和完整路径。

## Error Handling

| Scenario | Resolution | Escalate To |
|---|---|---|
| 目标目录不存在 | 询问用户是否创建该目录 | User |
| 目标文件已存在 | 展示完整路径并请求覆盖确认 | User |
| 写入失败 | 报告失败路径和系统错误，不尝试写入其他目录 | User |
| 文件名不明确 | 根据标题建议一个 kebab-case 文件名并请求确认 | User |

## References

- 当前项目或用户提供的默认文档目录。

## Lessons

1. **Trigger:** 保存文档类 Markdown 文件。
   - **Rule:** 最终回复必须包含完整绝对路径，方便用户点击打开。
   - **Why:** 相对路径或省略目录会让用户难以找到生成文档。
