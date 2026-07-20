# Repo Map Example Format

## Plan

- [x] Add a repo-map example markdown file as a reference resource.
- [x] Link the example from `skills/repo-map/SKILL.md`.
- [x] Make clear that example facts must not be copied into target reports.
- [x] Validate the skill and reference.

## Review

- Added `skills/repo-map/references/repo-map-web-example.md`.
- Linked the example from `skills/repo-map/SKILL.md` for saved report output or unclear format cases.
- The example includes `Project Glossary`, `Working Map`, and `Confidence`.
- The skill explicitly says not to copy example facts into target reports.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `test -f skills/repo-map/references/repo-map-web-example.md`
- `rg -n 'repo-map-web-example.md|docs/analysis/repo-map.md|Project Glossary|Working Map|Confidence|do not copy example facts' skills/repo-map/SKILL.md skills/repo-map/references/repo-map-web-example.md`
- `git diff --check`
