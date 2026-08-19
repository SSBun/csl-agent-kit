# Task: Remove third-party grill wrappers, add personal task-grill skill

**Status:** Completed (2026-08-10)
**Created:** 2026-08-10
**Scope:** Replace vendored `grill-me` and `grill-with-docs` with a personal `task-grill` skill that grills with task-recording rules.

## Decisions (user-confirmed)

- Remove `skills/mattpocock/grill-me` and `skills/mattpocock/grill-with-docs` entirely.
- Keep `skills/mattpocock/grilling` (still referenced by `improve-codebase-architecture`).
- New personal skill `skills/task-grill`: runs a grilling session plus task-recording rules:
  - Grilling about an existing canonical task → do NOT record grill dialogue/results into that task file; only update the task when a confirmed decision changes scope/status/deliverable.
  - Grilling a standalone topic (no owning task) → create a new canonical task for the discussion and record outcomes there.

## Steps

- [x] Delete grill-me and grill-with-docs dirs (git rm)
- [x] Create skills/task-grill/SKILL.md + agents/interface.yaml (English, per lessons rule)
- [x] Update README table/CLI examples + 3 plugin.json lists (grill-me → task-grill, grill-with-docs row removed)
- [x] yao-meta-skill validation: all 4 checks pass

## Result

- Removed `skills/mattpocock/grill-me` and `skills/mattpocock/grill-with-docs`; `grilling` retained (dependency of `improve-codebase-architecture`).
- New personal skill `skills/task-grill/`: grilling interview rules + task-recording rules (no grill dialogue into an existing task's file; standalone topics get a new canonical task).
- References updated: README (table row, conflict note, `npx skills add/remove` examples), `.cursor-plugin` / `.claude-plugin` / `.codex-plugin` plugin.json.
- Validation: yao validate all ok; resource boundary ok (375 tokens initial load).
- Not committed (not requested).
