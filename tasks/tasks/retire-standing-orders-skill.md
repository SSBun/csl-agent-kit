# Retire the standing-orders skill in favor of Triggerify

**Status:** Completed (2026-07-23 16:01)

## Scope

- Include migration of persistent user directives to Triggerify and removal of standing-orders-specific runtime, skill, manifests, tests, documentation, and Super Agent routing.
- Preserve unrelated in-progress changes already present in the worktree.

## Target

- [x] T1: Existing standing orders can be represented and loaded as validated global Triggerify rules at session-start timing without a dedicated standing-orders skill or hook.
- [x] T2: Active package manifests, runtime integrations, tests, documentation, and `super-agent/AGENTS.md` contain no standing-orders skill routing or obsolete file-loading contract.
- [x] T3: Existing user data is migrated without silently losing directives, and relevant automated checks pass.
- [x] T4: Workspace context and reusable lessons describe Triggerify as the current persistent-directive mechanism.

## Plan

1. Define the smallest Triggerify representation and migration path for existing directives.
2. Remove the dedicated skill and replace runtime references across supported hosts.
3. Update Super Agent guidance, tests, manifests, documentation, context, and the superseded lesson.
4. Run focused and full validation, then complete the required rule audit and independent review.

## Result

- T1: Added host-specific Triggerify `session-start` Prompt support for Claude Code and Pi, retained Codex support, and verified 16 Triggerify plus 3 Pi tests (19/19 total). Cursor remains unsupported because its current host drops injected context.
- T2: Deleted the dedicated skill and test, removed active hook/manifest/README references, removed Section 8 from `super-agent/AGENTS.md`, and confirmed the active package/runtime tree has no obsolete reference.
- T3: Migrated all five existing directives into separate `global:directive-*` rules, verified every rule as `supported/active` for Codex, Claude Code, and Pi and `unsupported/inactive` for Cursor, then removed the old data file. CLI tests passed 26/26; Triggerify route eval passed 11/11; local quality gate validation passed. Full `npm run check` remains red only in two pre-existing task-suite contracts from unrelated worktree changes.
- T4: Updated durable context and the approved reusable lesson to make Triggerify the only current persistent-directive carrier and to preserve Cursor's `unsupported/inactive` boundary. Route eval passed 11/11, local quality gate validation passed at 994/1000 initial-load tokens, and focused runtime tests passed 19/19.
- Review: `APPROVED` after three Reviewer passes; report: [retire-standing-orders-skill](../artifacts/retire-standing-orders-skill/reports/adversarial-review.md)
