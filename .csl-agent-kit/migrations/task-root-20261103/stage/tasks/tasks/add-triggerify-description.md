# Add descriptions to Triggerify rules

**Status:** Completed (2026-07-23 16:45)

## Scope

- Add one optional human-readable description field to Triggerify rules and CLI output.
- Do not add duplicate naming, title, tags, owner, priority, or other speculative metadata.
- Preserve unrelated worktree changes.

## Target

- [x] T1: Valid rules may store an optional single-line `description` without changing qualified-ID semantics.
- [x] T2: CLI create/update/show/list operations preserve and display descriptions, while rules without one remain valid.
- [x] T3: Focused runtime, CLI, route, and skill validation checks pass.

## Plan

1. Extend the schema, serialization, CLI options, and status projection with `description`.
2. Display descriptions in human-readable and JSON list/show output.
3. Add focused compatibility and validation tests, then run required skill audit and independent review.

## Result

- T1: Added optional `description` validation as one trimmed, non-empty, control-free line up to 160 characters; qualified IDs remain filename-derived. Adversarial finding R1 added coverage for tabs, escape/control characters, NEL, and Unicode line/paragraph separators.
- T2: Added create/update/clear support, JSON/status projection, `show` display, and a human-readable `list` header with `DESCRIPTION`; updated `global:open-todo-in-typora` to `Open changed task records in Typora.`
- T3: Triggerify tests passed 18/18, CLI tests 26/26, route eval 11/11, local quality gate validation passed, and `git diff --check` passed. local quality gate reports 998/1000 initial-load tokens.
- Review: `APPROVED` after two Reviewer passes; report: [add-triggerify-description](../artifacts/add-triggerify-description/reports/adversarial-review.md)
