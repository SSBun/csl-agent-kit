# SOP Example Minimal Frontmatter

## Plan

- [x] Remove unneeded SOP example frontmatter fields: `id`, `created_by`, `reviewer`, and `approver`.
- [x] Keep the useful existing metadata and body revision history.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate frontmatter, skill metadata, and diff formatting.
- [x] Audit the SOP documentation change with `yao-meta-skill`.

## Review

- Removed `id`, `created_by`, `reviewer`, and `approver` from `skills/sop-manager/references/good-sop-example.md`.
- Kept `name`, `description`, `version`, `owner`, and `effective_date` in frontmatter.
- Preserved the body revision history.
- Added `2026-07-08 SOP Example Metadata Minimalism` to `tasks/lessons.md`.

Verification performed:

- Parsed YAML frontmatter and asserted removed fields are absent.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `rg -n "^id:|^created_by:|^reviewer:|^approver:|^version:|^owner:|^effective_date:" skills/sop-manager/references/good-sop-example.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
