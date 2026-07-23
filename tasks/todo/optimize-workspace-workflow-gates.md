# Optimize the workspace workflow lifecycle gates

**Status:** Completed (2026-07-23 11:40)

## Target

- [x] T1: The injected gate text defines a deterministic proactive order for Context, Lessons, Task, correction, and end-of-work lifecycle events.
- [x] T2: The gate text selects the matching skill while leaving mutable execution contracts to each skill.
- [x] T3: Focused contract tests, route evaluation, and rule audit pass without including unrelated workspace changes.

## Plan

1. Replace the current gate list with the approved lifecycle dispatcher text.
2. Add a focused contract check for order, proactive loading, and skill ownership.
3. Verify the focused diff and routing behavior, then complete independent review and commit only this task's changes.

## Result

- T1: `references/workspace-workflow-gates.md` now declares the approved five-step lifecycle order; the focused order test passed.
- T2: The dispatcher explicitly loads the matching skill before the next action and states that each skill owns its current execution contract; the stale embedded permission detail was removed.
- T3: Yao trigger evaluation passed all 37 positive, negative, and near-neighbor cases across the three workspace skills, and focused `git diff --check` passed. Unrelated worktree changes remain outside this task's scope.
- Review: `APPROVED` in one pass; report: [optimize-workspace-workflow-gates](../../reports/adversarial-review/optimize-workspace-workflow-gates.md)
