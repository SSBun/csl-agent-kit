# Repo Map Component Summary

## Plan

- [x] Add a concise component summary requirement to `repo-map`.
- [x] Update all repo-map format examples to include the summary.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill and references.

## Review

- Added `Component Summary` before `Project Glossary` in the repo-map output guidance.
- Updated all four reference examples to include a concise product/business responsibility summary.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'Component Summary|component summary|组件摘要|Repo Map Component Summary' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`
