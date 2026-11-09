# 创建 Apple Notes HTML 写作 SOP

Status: Completed (2026-08-11 15:32)
Kind: Task

## Target
- [x] T1: 用户级 SOP 文件存在，且必填英文 frontmatter 能准确路由 Apple Notes MCP 创建与编辑笔记任务。
- [x] T2: SOP 明确规定实测可用 HTML 子集、不可靠或不支持格式，以及 Apple Notes 规范化与视觉优先边界。
- [x] T3: SOP 覆盖创建、追加和整篇替换的安全检查，包括标题、附件、Checklist、共享或锁定笔记及有损回读风险。
- [x] T4: SOP 通过结构、YAML frontmatter、来源一致性和完成标准检查。
- [x] T5: SOP 以可用、受限和禁用 HTML 标记为主体，工具操作与数据安全只保留为紧凑的次要边界。

## Plan

1. 将 SOP 重组为按兼容等级分类的 HTML 标记速查表与使用规则。
2. 压缩工具流程和异常处理，仅保留防止破坏既有笔记的必要边界。
3. 验证路由摘要、结构比例、标记覆盖和完成标准。

## Result

- T1: sop-summaries.sh 成功索引用户级 apple-notes-html-writing SOP，且 frontmatter 必填字段与英文路由文案检查通过。
- T2: SOP 已重组为 Preferred、Use With Limitations、Do Not Use 三类 HTML 标记规则，并覆盖报告的兼容与规范化边界。
- T3: 工具操作内容已压缩为标题规则与 Minimal Existing-Note Safety，仍覆盖附件、Checklist、共享、锁定和有损回读保护。
- T4: sop-summaries.sh 路由、frontmatter、同类 SOP 章节、HTML 标记覆盖和目标化 git diff --check 均通过。
- T5: HTML 参考区为 3868 字符，必要安全区为 693 字符；description 与 Purpose 均明确 HTML 兼容性是主职责。
- Review gate: Skipped — 用户未要求独立 adversarial review；按规则跳过。

## Verification

- Passed: SOP 已收窄为 HTML 标记兼容性参考；路由、结构比例、完整标记清单与必要安全边界检查通过。
