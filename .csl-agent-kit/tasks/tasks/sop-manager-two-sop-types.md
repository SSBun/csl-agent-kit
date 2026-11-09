# SOP Manager Two SOP Types

## Plan

- [x] Define process SOP and rule SOP guidance in `skills/sop-manager/SKILL.md`.
- [x] Keep `good-sop-example.md` as the process SOP example.
- [x] Add a concise rule SOP example under `skills/sop-manager/references/`.
- [x] Validate examples, skill metadata, and references.
- [x] Audit the SOP documentation change with `skill-quality`.

## Review

- Updated `skills/sop-manager/SKILL.md` with two SOP types:
  - process SOP: ordered execution, confirmation points, error handling, completion criteria.
  - rule SOP: use instructions, grouped rules, conflict handling, completion criteria.
- Added `skills/sop-manager/references/rule-sop-example.md`.
- Kept `skills/sop-manager/references/good-sop-example.md` as the process SOP example.

Verification performed:

- Parsed both SOP example frontmatters and checked required fields.
- Asserted the rule SOP example includes `使用方式`, `规则分组`, `冲突处理`, and checkbox completion criteria.
- Asserted `skills/sop-manager/SKILL.md` references both examples and the two SOP types.
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `node skills/meta/skill-quality/scripts/check.js skills/sop-manager`
- `rg -n "rule-sop-example|规则型 SOP|流程型 SOP|使用方式|规则分组|冲突处理" skills/sop-manager`

Unresolved risk:

- local quality gate validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/sop-manager`; lint, governance check, and resource boundary check passed.
