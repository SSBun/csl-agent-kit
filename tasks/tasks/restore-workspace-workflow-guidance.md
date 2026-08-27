# Restore proactive workspace workflow guidance

**Status:** Completed (2026-07-23 11:28)

## Target

- [x] T1: The distributed agent rules explain the Context, Task, and Lessons mechanisms well enough to trigger them proactively without relying on hook injection.
- [x] T2: Each mechanism directs the agent to load and follow its corresponding workspace workflow skill for the actual work.
- [x] T3: Existing unrelated agent rules and workspace changes remain unchanged.

## Plan

1. Restore the useful mechanism guidance from the pre-refactor prompt and align it with the current skills.
2. Record the reusable correction without duplicating or conflicting with existing lessons.
3. Verify rule structure, focused diffs, and packaging references, then run the required local quality gate rule audit.

## Result

- T1: Restored separate Workspace Context, Goal-Driven Task Management, and Self-Improvement Loop sections in `references/agents.md`; the focused contract test passed and verifies the mechanism paths and proactive language.
- T2: Each restored section now requires loading and following the matching workspace skill before acting; local quality gate trigger evaluation passed all 37 positive, negative, and near-neighbor cases across the three skills.
- T3: `git diff --check` passed for the focused files, and inspection confirmed the remaining agent-rule sections were only renumbered. The full task test still has two unrelated existing failures: one malformed index entry and one stale `Checklist` expectation.
- Review: `APPROVED` in one pass; report: [restore-workspace-workflow-guidance](../../reports/adversarial-review/restore-workspace-workflow-guidance.md)
