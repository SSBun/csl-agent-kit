# 扩写 PRINCIPLE.md 为完整设计原则文档

Status: Completed (2026-08-28 14:09)
Kind: Task

## Target
- [x] T1: PRINCIPLE.md 重写为完整版:覆盖宿主无关 Skill、Orient→Align→Prepare→Execute→Verify 工作流、Task Target 对齐门、任务文件结果契约、理解先于编辑、简单优先与手术式修改、验证先于完成、独立评审仅在明确要求时、Task/Context/Lessons 三分离
- [x] T2: 每条原则有主张与理由,内容忠于仓库实际契约与既有讨论,无占位符

## Scope

- 包含:重写根目录 PRINCIPLE.md 为完整版(吸收原三条原则,扩展至全部核心设计原则)。
- 排除:不改其它文件;不虚构未见于契约或讨论的原则。

## Plan

1. 以 workspace-workflow-gates 契约与任务协议为纲组织章节。
2. 重写 PRINCIPLE.md 完整版。
3. 校验章节覆盖与无占位,记录证据并完成。

## Result

- T1: PRINCIPLE.md 完整版 10 章原则+收束句,覆盖 T1 列出的全部九项主题(章节 grep 逐一存在)
- T2: 每章均为主张/边界/理由结构,内容取自 workspace-workflow-gates 契约与任务协议及本会话论述;占位符 grep 命中 0
- Review gate: Skipped — 用户未要求对抗式评审或独立 Reviewer 批准

## Verification

- Passed: grep 校验:11 个标题存在;10 个覆盖关键词全部命中;【占位】0 个
