# Gate adversarial review by task risk and verification

**Status:** Completed (2026-07-24 13:44)

## Scope

- Replace unconditional adversarial review with the approved binary semantic gate.
- Keep the decision prompt-based; add only contract/eval checks, not hooks, scoring, file-count, or line-count heuristics.
- Apply the current task contract without rewriting historical task records.
- Keep the workflow skill's complete operational contract inline even when local quality gate reports more than 1000 initial-load tokens.
- Cover small follow-ups that extend the same completed task outcome by reopening the owning task; keep independent Subtasks boundaries in separate task records.

## Target

- [x] T1: Review is required only when explicitly mandated, critical, or both complex and insufficiently verifiable.
- [x] T2: Tasks with a skipped gate can complete after Target evidence and proportionate verification without entering `In Review`.
- [x] T3: Every non-trivial task records a concise evidence-based `Review gate: Required|Skipped` decision and reassesses it when scope, risk, or verification changes.
- [x] T4: Representative judgment cases and task-contract tests enforce the new gate without adding unrelated workflow machinery.
- [x] T5: The workflow skill keeps its complete task guidance in `SKILL.md`; the local quality gate's 1000-token budget is advisory and cannot reduce accuracy or comprehensiveness.
- [x] T6: A small follow-up to a completed task reopens and extends the owning task record instead of creating a new task file.

## Plan

1. Define the minimal completed-task follow-up lifecycle in the owning workflow skill.
2. Add a focused contract assertion and run the required validation.
3. Re-evaluate and complete the required review gate for the reopened scope.

## Result

- T1: `skills/workspace-workflow/workspace-manage-task/SKILL.md` defines `Required = Explicit OR Critical OR (Complex AND Verification Gap)` and semantic criteria for every term.
- T2: The lifecycle gives `Required` and `Skipped` separate branches; only `Required` enters `In Review` and invokes `$adversarial-review`.
- T3: The task contract requires an evidence-bearing gate line before completion and reassessment when scope, risk, or verification evidence changes.
- T4: Nine representative cases in `evals/review_gate_cases.json` and three focused Node tests pass. Pre-reopen OpenAI validation and local quality gate rule audit passed; trigger routing scored 12/12 with no false positives or negatives.
- Review gate: Required — this changes the global Agent task lifecycle and independent-review boundary.
- T5: Merged activation, ownership, task fields, blocking, subtasks, gate, lifecycle, adoption, and maintainer validation into the main `SKILL.md`; removed the split reference. Focused tests pass 3/3 and OpenAI validation passes. Current local quality gate validation reports only the accepted `Estimated initial-load tokens exceed budget` failure after syntax/frontmatter, lint, governance, and all other resource checks pass.
- T6: The lifecycle now reopens the owning completed task for a small same-outcome follow-up, appends the next Target ID, revises the Plan, synchronizes the index, and re-evaluates the Review Gate; the focused contract test passes 11/11, OpenAI and local quality gate skill validation pass, and `git diff --check` passes.
- Review: `APPROVED` after seven cumulative Reviewer passes across the initial and reopened scopes; report: [optimize-adversarial-review-gate](../../reports/adversarial-review/optimize-adversarial-review-gate.md)
