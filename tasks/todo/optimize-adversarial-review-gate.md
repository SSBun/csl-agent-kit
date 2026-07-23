# Gate adversarial review by task risk and verification

**Status:** Completed (2026-07-23 19:42)

## Scope

- Replace unconditional adversarial review with the approved binary semantic gate.
- Keep the decision prompt-based; add only contract/eval checks, not hooks, scoring, file-count, or line-count heuristics.
- Apply the current task contract without rewriting historical task records.
- Keep the workflow skill's complete operational contract inline even when Yao reports more than 1000 initial-load tokens.

## Target

- [x] T1: Review is required only when explicitly mandated, critical, or both complex and insufficiently verifiable.
- [x] T2: Tasks with a skipped gate can complete after Target evidence and proportionate verification without entering `In Review`.
- [x] T3: Every non-trivial task records a concise evidence-based `Review gate: Required|Skipped` decision and reassesses it when scope, risk, or verification changes.
- [x] T4: Representative judgment cases and task-contract tests enforce the new gate without adding unrelated workflow machinery.
- [x] T5: The workflow skill keeps its complete task guidance in `SKILL.md`; Yao's 1000-token budget is advisory and cannot reduce accuracy or comprehensiveness.

## Plan

1. Merge the complete task-record contract back into `SKILL.md` and remove the split reference.
2. Update regression checks and durable workspace guidance for the workflow-skill budget exception.
3. Run focused validation, record the expected Yao budget result, and repeat the risk-gated review.

## Result

- T1: `skills/workspace-workflow/workspace-manage-task/SKILL.md` defines `Required = Explicit OR Critical OR (Complex AND Verification Gap)` and semantic criteria for every term.
- T2: The lifecycle gives `Required` and `Skipped` separate branches; only `Required` enters `In Review` and invokes `$adversarial-review`.
- T3: The task contract requires an evidence-bearing gate line before completion and reassessment when scope, risk, or verification evidence changes.
- T4: Nine representative cases in `evals/review_gate_cases.json` and three focused Node tests pass. Pre-reopen OpenAI validation and Yao rule audit passed; trigger routing scored 12/12 with no false positives or negatives.
- Review gate: Required — this changes the global Agent task lifecycle and independent-review boundary.
- T5: Merged activation, ownership, task fields, blocking, subtasks, gate, lifecycle, adoption, and maintainer validation into the main `SKILL.md`; removed the split reference. Focused tests pass 3/3 and OpenAI validation passes. Current Yao validation reports only the accepted `Estimated initial-load tokens exceed budget` failure after syntax/frontmatter, lint, governance, and all other resource checks pass.
- Review: `APPROVED` after five cumulative Reviewer passes across the initial and reopened scopes; report: [optimize-adversarial-review-gate](../../reports/adversarial-review/optimize-adversarial-review-gate.md)
