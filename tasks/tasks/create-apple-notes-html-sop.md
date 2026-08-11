# 创建 Apple Notes HTML 写作 SOP

Status: In Progress (2026-08-11 15:29)
Kind: Task

## Target
- [x] T1: 用户级 SOP 文件存在，且必填英文 frontmatter 能准确路由 Apple Notes MCP 创建与编辑笔记任务。
- [x] T2: SOP 明确规定实测可用 HTML 子集、不可靠或不支持格式，以及 Apple Notes 规范化与视觉优先边界。
- [x] T3: SOP 覆盖创建、追加和整篇替换的安全检查，包括标题、附件、Checklist、共享或锁定笔记及有损回读风险。
- [x] T4: SOP 通过结构、YAML frontmatter、来源一致性和完成标准检查。
- [ ] T5: SOP 以可用、受限和禁用 HTML 标记为主体，工具操作与数据安全只保留为紧凑的次要边界。

## Plan

1. 将 SOP 重组为按兼容等级分类的 HTML 标记速查表与使用规则。
2. 压缩工具流程和异常处理，仅保留防止破坏既有笔记的必要边界。
3. 验证路由摘要、结构比例、标记覆盖和完成标准。

## Result

- T1: sop-summaries.sh 成功索引用户级 apple-notes-html-writing SOP，且 frontmatter 必填字段与英文路由文案检查通过。
- T2: SOP 的 Core Model 与 HTML Authoring Rules 覆盖报告中的可靠子集、规范化行为、视觉优先边界和不支持格式。
- T3: SOP 的 Safe Tool Workflow 与 Error Handling 覆盖标题、ID、附件、Checklist、共享、锁定、truncated/strippedImages 和整篇替换风险。
- T4: 结构与来源/工具边界 Python 检查、sop-summaries.sh 索引、目标化 git diff --check 和 task check 均通过。
- Review gate: Skipped — 用户未要求独立 adversarial review；按规则跳过。
