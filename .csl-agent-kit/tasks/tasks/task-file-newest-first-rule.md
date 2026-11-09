# Task File Newest-First Rule

## Plan

- [x] Add a local `AGENTS.md` rule requiring newest-first ordering for `tasks/todo.md` and `tasks/lessons.md` entries.
- [x] Record this user correction in `tasks/lessons.md`, inserted at the top for readability.
- [x] Verify the changed rule structure and formatting.
- [x] Update this task entry with review evidence.

## Review

- Added `AGENTS.md` guidance that new `tasks/todo.md` and `tasks/lessons.md` entries must be inserted directly under the file title.
- Added the correction as the newest lesson: `2026-07-09 Task Files Newest First`.
- Inserted this task entry at the top of `tasks/todo.md`, following the new rule.

Verification performed:

- Read `AGENTS.md`, `tasks/lessons.md`, and `tasks/todo.md` to confirm newest-first placement.
- Python assertion confirmed `tasks/todo.md` starts with `# Task File Newest-First Rule` and `tasks/lessons.md` first lesson is `2026-07-09 Task Files Newest First`.
- `git diff --check -- AGENTS.md tasks/lessons.md tasks/todo.md`
- Confirmed temporary `reports/user_patterns.*` files from an earlier audit attempt were removed.
