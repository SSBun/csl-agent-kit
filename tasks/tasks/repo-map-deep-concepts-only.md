# Repo Map Deep Concepts Only

## Plan

- [x] Remove obvious inventory from repo-map output guidance.
- [x] Rewrite all four examples around business concepts, core logic modules, key type effects, business flows, relevance filters, and verification hooks.
- [x] Keep implementation details summarized rather than expanded.
- [x] Record the correction in `tasks/lessons.md`.
- [x] Validate the updated skill and references.

## Review

- Updated `skills/repo-map/SKILL.md` to reject obvious inventory in final output unless it explains business boundaries.
- Removed `Scope` and `Project Shape` style metadata from all four repo-map examples.
- Reworked all examples to focus on deep concepts: glossary, core concepts, core logic modules, key type effects, business flows, relevance filters, change targets, and verification hooks.
- Recorded the correction in `tasks/lessons.md`.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/repo-map`
- `rg -n '^## Scope|^### Project Shape|Language:|Framework:|Project:|Root:|Generated:|Project kind:' skills/repo-map/references/*.md`
- `rg -n 'Core Concepts|Core Logic Modules|Key Type Effects|Business Flows|Relevance Filter|Verification Hooks|obvious inventory|implementation detail|Deep Concepts Only|项目名|语言|框架|核心类型影响|无关区域' skills/repo-map tasks/lessons.md tasks/todo.md`
- `git diff --check`
