# Repo Map Multi-Repo Root Detection

## Plan

- [x] Update `repo-map` to detect whether the working folder is a git repo.
- [x] Add child git repository detection when the working folder is only a container.
- [x] Require separate maps/glossaries per child repository.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill.

## Review

- Updated `skills/repo-map/SKILL.md` with a `Resolve project roots` first step.
- The skill now runs `git rev-parse --show-toplevel` to detect a root repo.
- If the working folder is not a git repo, it checks immediate child folders for `.git` and maps each child repository separately.
- CodeGraph usage is now scoped per project root instead of indexing a parent folder containing unrelated repos.
- Recorded the multi-repo correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'git rev-parse|show-toplevel|child git|child folders|separate|separately|project root|project roots|multi|多个项目|子 repo|git repo' skills/repo-map/SKILL.md tasks/lessons.md tasks/todo.md`
- `git diff --check`
