---
name: save-markdown-docs
description: Save Markdown documents to a specified directory.
when_to_use: Use when the user asks to save a generated Markdown plan, report, or implementation guide to a document directory.
version: 1.0
update_date: 2026-07-08
do_not_use_when:
  - The user only asks for an in-chat summary and does not ask to save a file.
  - The output file is not Markdown.
---

# SOP: 保存 Markdown 文档到指定目录

## 1. 目的

指导 agent 在保存 Markdown 文档时选择明确路径、避免误覆盖、完成写入验证，并向用户报告可追踪结果。

## 2. 适用范围

适用：

- 用户要求保存计划、报告、实施指南、审计结果或其他 Markdown 文档。
- 用户指定目标目录，或当前项目/用户偏好中已有明确默认目录。

不适用：

- 用户只要求在对话中总结，不要求保存文件。
- 输出文件不是 Markdown。
- 任务涉及发布、部署、删除或批量覆盖文件。

## 3. Agent 行为规则

- 必须先确定完整目标路径，再写入文件。
- 目标路径必须包含目录、文件名和 `.md` 后缀。
- 目标文件已存在时，必须先获得用户明确覆盖许可。
- 不要把文件写到临时目录或猜测目录来绕过路径不明确的问题。
- 写入后必须验证文件存在且内容可读。
- 最终回复必须包含完整绝对路径和验证结果。

## 4. 执行流程

1. 确定目标路径。
   - 如果用户没有给文件名，用任务标题生成简短 kebab-case 文件名。
   - 如果目标目录不明确，先询问用户。

2. 检查写入风险。
   - 如果目标目录不存在，询问用户是否创建。
   - 如果目标文件已存在，询问用户是否覆盖。

3. 写入并验证。
   - 将最终 Markdown 内容写入目标路径。
   - 读取文件开头、检查文件大小，或使用等价方式确认文件可读。

4. 报告结果。
   - 告诉用户完整绝对路径。
   - 简短说明已执行的验证。

## 5. 异常处理

| 场景 | Agent 行为 |
|---|---|
| 目标目录不存在 | 询问用户是否创建；未确认时停止。 |
| 目标文件已存在 | 展示完整路径并请求覆盖确认；未确认时停止。 |
| 文件名不明确 | 建议一个 kebab-case 文件名并请求确认。 |
| 写入失败 | 报告失败路径和系统错误；不要改写到其他目录。 |
| 验证失败 | 报告失败证据；不要声称保存成功。 |

## 6. 完成标准

- [ ] 目标 `.md` 文件存在。
- [ ] 文件内容可读。
- [ ] 最终回复包含完整绝对路径。
- [ ] 最终回复说明验证方式或验证结果。
