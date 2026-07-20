# SOP Create Good Example

## Plan

- [x] Add a concise good SOP example under `skills/sop-manager/references/`.
- [x] Update `sop-manager create` to read and follow the example before writing a SOP.
- [x] Verify the skill, reference path, and diff.

## Review

- Added `/Users/caishilin/Desktop/personal/skills/skills/sop-manager/references/good-sop-example.md`.
- Updated `sop-manager create` so new SOP creation reads that example first and checks trigger description, scope, executable steps, confirmation gates, concrete error handling, and reusable lessons.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `test -f skills/sop-manager/references/good-sop-example.md`
- `rg -n 'good-sop-example|清楚的触发型|Save Markdown Docs SOP|SOP Create Good Example' skills/sop-manager tasks/todo.md`
- `git diff --check`
