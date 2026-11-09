# SOP Create English Output (Superseded)

## Plan

- [x] 曾尝试在 `sop-manager create` 指令中加入 SOP 文件正文语言规则。
- [x] 保持模板结构不变，只补充语言约束，避免扩大改动。
- [x] 用搜索和 diff 校验规则位置与格式。

## Review

- 已被后续 “Remove SOP Create Language Limit” 撤销。
- 原因：用户明确纠正主流程描述可以使用任意语言，不应限制整份 SOP 文件语言。

Verification performed:

- `rg -n 'frontmatter 的 \`description\`|SOP Create English Output' skills/sop-manager/SKILL.md tasks/todo.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md tasks/todo.md`
