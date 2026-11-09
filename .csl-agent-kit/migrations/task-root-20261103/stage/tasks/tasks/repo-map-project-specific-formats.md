# Repo Map Project-Specific Formats

## Plan

- [x] Update `repo-map` so it chooses report format by project kind.
- [x] Add an iOS/native repo-map example.
- [x] Keep the generic example for non-native or unclear project types.
- [x] Record the project-specific format lesson.
- [x] Validate the updated skill and examples.

## Review

- Updated `skills/repo-map/SKILL.md` to identify project kind before choosing the output format.
- Added `skills/repo-map/references/repo-map-apple-example.md`.
- Kept `repo-map-web-example.md` as the web-specific format.
- The iOS/native example now focuses on app targets, Swift modules, app entry, navigation, SwiftUI state, key types, persistence/networking boundaries, and XCTest hooks.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `test -f skills/repo-map/references/repo-map-apple-example.md`
- `rg -n 'repo-map-apple-example.md|iOS|macOS|SwiftUI|UIKit|AppKit|XCTest|Project kind|App Targets And Modules|App Entry And Navigation|State And Data Flow|Persistence, Networking, And Side Effects|project kind|web/backend|项目类型|apple' skills/repo-map/SKILL.md skills/repo-map/references/repo-map-apple-example.md tasks/lessons.md tasks/todo.md`
- `git diff --check`
