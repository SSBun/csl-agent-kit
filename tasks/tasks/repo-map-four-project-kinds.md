# Repo Map Four Project Kinds

## Plan

- [x] Restrict repo-map format kinds to web, backend, apple, and android.
- [x] Rename the generic example into a web example.
- [x] Rename the iOS/native example into an apple example.
- [x] Add backend and Android examples.
- [x] Update lessons to reflect the four supported kinds.
- [x] Validate all repo-map references.

## Review

- Restricted repo-map format kinds to exactly four: web, backend, apple, and android.
- Renamed the original generic/web example to `repo-map-web-example.md`.
- Renamed the iOS/native example to `repo-map-apple-example.md`.
- Added `repo-map-backend-example.md` and `repo-map-android-example.md`.
- Updated `skills/repo-map/SKILL.md` to select only among those four references.
- Updated `tasks/lessons.md` with the four-kind rule.

Verification performed:

- `find skills/repo-map/references -maxdepth 1 -type f -print | sort`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'repo-map-example|repo-map-ios-native|repo-map-web-example|repo-map-backend-example|repo-map-apple-example|repo-map-android-example|web, backend, apple, or android|四类|Android|Gradle|Activity|XCTest' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`
