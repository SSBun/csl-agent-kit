# SOP Lessons Section Removal

## Plan

- [x] Remove the `Lessons` section from the SOP example.
- [x] Remove `Lessons` from the SOP creation template and quality checklist.
- [x] Change `sop-manager learn` guidance so reusable corrections update the SOP directly.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the skill and audit with `yao-meta-skill`.

## Review

- Removed `## 7. Lessons` from `skills/sop-manager/references/good-sop-example.md`.
- Removed `Lessons` from the `sop-manager create` template and checklist.
- Rewrote `sop-manager learn` so reusable corrections update the matching SOP body directly instead of creating a separate lessons section or companion SOP.
- Added `2026-07-08 SOP No Lessons Section` to `tasks/lessons.md`.

Verification performed:

- Parsed example YAML and asserted frontmatter only contains `name`, `description`, `version`, and `update_date`.
- Asserted the example no longer contains `Lessons`.
- Asserted `skills/sop-manager/SKILL.md` no longer contains `## Lessons` or companion lesson guidance.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "Lessons|companion lesson|直接更新到对应 SOP 正文|完成标准使用 checkbox" skills/sop-manager/SKILL.md skills/sop-manager/references/good-sop-example.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
