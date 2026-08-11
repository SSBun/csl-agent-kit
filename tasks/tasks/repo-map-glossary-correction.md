# Repo Map Glossary Correction

## Plan

- [x] Update `repo-map` so it produces a project glossary, not only a structural map.
- [x] Make glossary evidence-backed and focused on preventing user-agent terminology gaps.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill.

## Review

- Updated `skills/repo-map/SKILL.md` so its required output has both `Project Glossary` and `Working Map`.
- Glossary entries now cover domain terms, code terms, project-specific meaning, confusing nearby terms, and evidence source.
- Workflow now collects repeated domain words and builds an evidence-backed glossary before tracing relationships.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'glossary|Glossary|shared vocabulary|understanding gaps|Not the same as|Source|Unknown|domain terms|code terms|基础 glossary|理解偏差' skills/repo-map/SKILL.md tasks/lessons.md tasks/todo.md`
- `git diff --check`
