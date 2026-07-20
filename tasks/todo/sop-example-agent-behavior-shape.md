# SOP Example Agent Behavior Shape

## Plan

- [x] Remove revision history from the SOP example.
- [x] Replace product-style sections with agent behavior guidance.
- [x] Keep confirmation gates, error handling, success criteria, and lessons.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the example and audit with `yao-meta-skill`.

## Review

- Rewrote `skills/sop-manager/references/good-sop-example.md` as a lightweight agent behavior SOP.
- Removed revision history, definitions, responsibilities, appendix, and command examples.
- Replaced product-style step detail with agent behavior rules, confirmation gates, execution flow, error handling, completion criteria, and lessons.
- Reduced frontmatter to `name`, `description`, `version`, and `update_date`.
- Updated `skills/sop-manager/SKILL.md` so the built-in creation template uses `version` and `update_date`.
- Converted `## 6. 完成标准` to a checkbox checklist.
- Updated `tasks/lessons.md` so future SOP examples keep `version` and `update_date`, without heavier governance fields.

Verification performed:

- Parsed example YAML and asserted frontmatter only contains `name`, `description`, `version`, and `update_date`.
- Asserted removed sections and metadata are absent from the example.
- Asserted `## 6. 完成标准` contains checkbox items.
- Asserted `skills/sop-manager/SKILL.md` no longer suggests `owner` in the creation template.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "^## 6\\. 完成标准|^- \\[ \\]" skills/sop-manager/references/good-sop-example.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
