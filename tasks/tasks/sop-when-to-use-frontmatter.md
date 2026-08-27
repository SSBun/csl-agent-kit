# SOP When-To-Use Frontmatter

## Plan

- [x] Add an explicit SOP frontmatter field for agent routing conditions.
- [x] Keep old SOPs compatible by falling back to `description`.
- [x] Update built-in examples and `swift-api-design` to demonstrate the field.
- [x] Validate summary output, skill metadata, and changed rule files.
- [x] Audit the SOP manager change with `skill-quality`.

## Review

- Added `when_to_use` as the explicit SOP routing field in `skills/sop-manager/SKILL.md`.
- Kept `description` as the short content summary and documented legacy fallback behavior.
- Updated `skills/sop-manager/scripts/sop-summaries.sh` to display `when_to_use` first, then fall back to `description`.
- Added `when_to_use` to `skills/sop-manager/references/process-sop-example.md`, `skills/sop-manager/references/rule-sop-example.md`, and `skills/sop-manager/sops/swift-api-design.md`.

Verification performed:

- Parsed changed SOP frontmatter and asserted `name`, `description`, and `when_to_use`.
- `bash -n skills/sop-manager/scripts/sop-summaries.sh`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `git diff --check -- skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/references/process-sop-example.md skills/sop-manager/references/rule-sop-example.md skills/sop-manager/sops/swift-api-design.md tasks/todo.md`
- `node skills/meta/skill-quality/scripts/check.js skills/sop-manager`

Unresolved risk:

- local quality gate validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
