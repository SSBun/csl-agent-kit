# Repo Map Remove Question List

## Plan

- [x] Remove the default question-list section from all repo-map examples.
- [x] Update task records that described that section as part of the format.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the references.

## Review

- Removed the default question-list section from all four repo-map reference examples.
- Updated historical task wording so it no longer describes that section as part of the repo-map format.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- no-residual search for the removed question-list heading across `skills/repo-map`, `tasks/todo.md`, and `tasks/lessons.md`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `git diff --check`
