# Repo Map Objective Structure

## Plan

- [x] Remove subjective/audit-style sections from the repo-map skill.
- [x] Update repo-map examples to show objective structure, modules, and key types.
- [x] Rewrite the generated `ZHShortStory` repo-map file in the objective format.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the skill, examples, and generated file.

## Review

- Updated `skills/repo-map/SKILL.md` so repo-map outputs objective structure only: component summary, glossary, file structure, modules, key types, and core flows.
- Rewrote all four repo-map reference examples to remove `Risk`, `Confidence`, `Relevance Filter`, `Change Targets`, and `Verification Hooks`.
- Rewrote `ZHShortStory/docs/analysis/repo-map.md` in the objective format.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n 'Risk|risk|Confidence|confidence|Relevance Filter|Change Targets|Verification Hooks|Why It Matters|Open Questions|open questions|audit|审计|风险|置信|建议|问题清单' skills/repo-map /Users/caishilin/Documents/SharkSpace/native-short-reader/ZHShortStory/docs/analysis/repo-map.md tasks/lessons.md`
- `rg -n '^## Component Summary|^## Project Glossary|^## Working Map|^### File Structure|^### Modules|^### Key Types|^### Core Flows' /Users/caishilin/Documents/SharkSpace/native-short-reader/ZHShortStory/docs/analysis/repo-map.md skills/repo-map/references/*.md`
- `git diff --check`
- `git diff --check -- docs/analysis/repo-map.md`
