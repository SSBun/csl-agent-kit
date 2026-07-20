# Tips Length Guard

## Plan

- [x] Add a length guard before `tips-add.sh` writes a tip.
- [x] Document the maximum tip length in `skills/tips/SKILL.md`.
- [x] Verify accepted and rejected tips do the right thing.

## Review

- Added a 240-character guard to `skills/tips/scripts/tips-add.sh`.
- The guard runs before directory/file creation, so rejected tips do not write anything.
- Documented the 240-character limit in `skills/tips/SKILL.md`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test: short tip is saved and injected.
- Temporary `HOME` test: 241-character tip is rejected and no tips file is created.
