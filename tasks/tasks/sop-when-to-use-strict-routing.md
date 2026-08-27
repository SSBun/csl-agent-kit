# SOP When-To-Use Strict Routing

## Plan

- [x] Remove legacy `description` fallback from the SOP summary formatter.
- [x] Update SOP manager docs so `when_to_use` is the only routing field.
- [x] Validate summary output and skill metadata.
- [x] Audit the SOP manager change with `skill-quality`.

## Review

- Removed legacy `description` fallback from `skills/sop-manager/scripts/sop-summaries.sh`.
- Updated `skills/sop-manager/SKILL.md` so SOP routing only uses `when_to_use` or `name`.
- Missing `when_to_use` now appears as `Missing when_to_use frontmatter.` in summaries, which makes unmigrated SOPs visible.

Verification performed:

- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- `rg -n 'legacy|旧版|description fallback|field description|name or description|No when_to_use or description' skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh tasks/todo.md`
- `node skills/meta/skill-quality/scripts/check.js skills/sop-manager`

Unresolved risk:

- local quality gate validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
