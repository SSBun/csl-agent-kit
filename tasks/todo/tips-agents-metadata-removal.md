# Tips Agents Metadata Removal

## Plan

- [x] Remove optional `skills/tips/agents/` metadata.
- [x] Verify the `tips` skill still validates and scripts remain present.

## Review

- Removed `skills/tips/agents/openai.yaml`.
- `tips` now contains only `SKILL.md` and the two scripts it needs.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- `find skills/tips -maxdepth 3 -type f`
