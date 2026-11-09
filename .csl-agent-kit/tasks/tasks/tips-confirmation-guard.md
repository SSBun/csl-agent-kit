# Tips Confirmation Guard

## Plan

- [x] Require explicit confirmation before any tip write.
- [x] Update `tips-add.sh` so old direct calls fail without `--confirmed`.
- [x] Document the show-then-ask workflow in `skills/tips/SKILL.md`.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Verify confirmed writes, unconfirmed rejection, and validation.

## Review

- Updated `tips-add.sh` to require `--confirmed` before writing.
- Updated `skills/tips/SKILL.md` to require showing the exact tip and waiting for explicit user confirmation.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test: unconfirmed write is rejected and no tips file is created.
- Temporary `HOME` test: confirmed short tip is saved and injected.
- Temporary `HOME` test: confirmed 241-character tip is rejected and no tips file is created.
