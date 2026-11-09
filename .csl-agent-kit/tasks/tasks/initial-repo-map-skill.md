# Initial Repo Map Skill

## Plan

- [x] Define `repo-map` as a lightweight pre-exploration skill for unknown repositories or unfamiliar modules.
- [x] Include optional CodeGraph indexing/query workflow with `rg`/manifest fallback.
- [x] Emphasize key types/classes, responsibilities, entry points, and call/impact relationships.
- [x] Add `repo-map` to the README skill table and install count.
- [x] Validate the new skill and record verification.

## Review

- Added `skills/repo-map/SKILL.md`.
- Designed `repo-map` to run before broad exploration of an unknown repository or unfamiliar module.
- Made key types/classes the center of the output: role, collaborators, owned state, effects, tests, and relationships.
- Added optional CodeGraph flow using `codegraph init`, `sync`, `status`, `files`, `query`, `callers`, `callees`, and `impact`, with `rg`/manifest fallback.
- Updated `README.md` with `repo-map` and corrected the install count to 15 skills.

Verification performed:

- `command -v codegraph`
- `codegraph --help`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n '13 skills|14 skills|15 skills|repo-map|codegraph (init|sync|status|files|query|callers|callees|impact|uninit)' README.md skills/repo-map/SKILL.md tasks/todo.md`
- `git diff --check`
