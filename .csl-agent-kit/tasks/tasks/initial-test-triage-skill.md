# Initial Test Triage Skill

## Plan

- [x] Define what `test-triage` does and when it should trigger.
- [x] Create `skills/test-triage/SKILL.md` with a minimal diagnostic workflow.
- [x] Add `test-triage` to the README skill table.
- [x] Validate skill frontmatter and workspace diff.

## Review

- Added `skills/test-triage/SKILL.md`.
- Defined the skill as a reproduce -> diagnose -> fix -> verify loop for failing tests, CI failures, runtime errors, flaky behavior, regressions, and bug reports.
- Updated `README.md` with the new skill and corrected the global install count to 14 skills.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/test-triage`
- `rg -n '13 skills|14 skills|test-triage' README.md skills/test-triage/SKILL.md tasks/todo.md`
- `git diff --check`
- Full `quick_validate.py` across all existing skills was attempted but stops on pre-existing `skills/analyze-project` frontmatter key `argument-hint`; this is outside the new `test-triage` change.
