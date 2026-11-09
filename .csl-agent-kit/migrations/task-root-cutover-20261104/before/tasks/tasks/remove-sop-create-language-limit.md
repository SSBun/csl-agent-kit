# Remove SOP Create Language Limit

## Plan

- [x] 删除 `sop-manager create` 中“整份 SOP 必须使用英文”的限制。
- [x] 保留现有模板和用户 SOP 存储路径不变。
- [x] 记录这次纠正，避免以后把语言要求扩大到整份 SOP。
- [x] 校验 skill 和 diff。

## Review

- 删除了 `skills/sop-manager/SKILL.md` 中强制 SOP 文件全篇英文的步骤。
- 保留模板本身不变；SOP 主流程描述现在不再被固定为英文或其他单一语言。
- 在 `tasks/lessons.md` 记录这次纠正：不要把语言偏好扩大成整份 SOP 文件限制。

Verification performed:

- Confirmed no active SOP language-limit rule remains in `skills/sop-manager/SKILL.md`.
- `rg -n 'Remove SOP Create Language Limit|SOP Create Language Scope' tasks/todo.md tasks/lessons.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md tasks/todo.md tasks/lessons.md`
