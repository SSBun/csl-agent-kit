# SOP Manager Lessons

## Plan

- [x] Add `sop-manager learn` behavior for reusable mistake/lesson capture.
- [x] Extend SOP templates with a lessons section.
- [x] Record the user correction in `tasks/lessons.md`.
- [x] Verify the updated skill text.

## Review

- Added `sop-manager learn` for reusable mistake/lesson capture.
- Added `## Lessons` to the SOP creation template.
- Defined companion user SOPs like `~/.ssbun-skills/sops/{built-in-name}-lessons.md` for lessons related to built-in SOPs, so built-in SOP files are not modified or shadowed.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `rg` check for `sop-manager learn`, `## Lessons`, and companion lesson references.
- Read the updated `sop-manager` command section.
- `git diff --check`
