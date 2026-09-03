---
name: task-review
description: Review a canonical task or supplied result once and return feedback only. Use for an explicit review request covering a PR/MR, diff, file, design, configuration, or no-file work, and for a mandatory deliverable-change review pass dispatched by an owning task. Exclude implementation, remediation, whole-subject audits, proofreading, and approval-gated review.
---

# Task Review

Run one evidence-based review pass without changing the reviewed work.

## Contract

- Enter only from an explicit user review request or an explicit mandatory review dispatch from the owning `task` workflow. Never infer a pass solely from risk or task state.
- Return feedback only: no edits, task-state changes, reports, remediation, re-review, or approval. The owning task handles every transition, fix, and later pass.
- Review any task state as its snapshot; explicit unfinished work is not a defect.
- Route explicitly requested Reviewer–Editor approval to `adversarial-review`, and whole-subject audits elsewhere.

## Workflow

1. Target priority: named task; focused or owning task; supplied artifact or result; PR/MR, diff, or fixed point. Ask only if absent. See [Review Workflow](references/review_workflow.md) for Git details.
2. Give the Reviewer the request/criteria, applicable Target/Result/Verification, result and diff, rules or spec, checks, and limitations. For an owning-task re-review, also give the current `task-review-ledger/v1` `## Review` ledger and its next unused finding ID. Exclude the author's defense, preferred conclusion, and proposed answer.
3. Use exactly one fresh, read-only subagent when possible. It may inspect evidence and run non-destructive checks, but must not edit, change task state, or delegate. Never launch a nested host CLI.
4. If unavailable or failed, run the same pass inline and label `Review mode: non-independent self-review`; otherwise label `Review mode: independent subagent`.
5. For an owning-task pass, state whether confirmed findings require remediation and whether any Unverified Risk prevents Target verification. Account for every prior `TR-<n>` ID and classify its progress as `resolved`, `substantive progress`, or `no progress`, with current evidence. Starting with the supplied next ID, assign successive IDs to new blocking items. Return that handoff to the interaction owner without changing the task.
6. Return feedback in the user's language and stop.

An owning task invokes one fresh pass at a time. Any Critical Finding or Concern requires remediation. An Unverified Risk blocks only when its missing evidence prevents the owner from verifying a Target. The owner returns to In Progress, fixes the result, updates the per-finding no-progress streak, and dispatches another fresh pass. This Skill never loops, decides that the task is stalled, or records `Passed` itself. Text churn, restatement, unchanged checks, and unsupported relabeling are `no progress`; evidence-backed artifact progress, valid reclassification, and newly actionable evidence are substantive.

## Lenses

- **Code:** behavior, callers, edges, regressions, safety, compatibility, tests, and maintainability.
- **Documents and designs:** claims, requirements, consistency, feasibility, failure modes, and validation.
- **Configuration and assets:** behavior, compatibility, defaults, consumers, and validation.
- **No-file results:** compare the claimed Result and evidence with the request or task Target.

Read only enough surrounding context to prove an issue; do not expand into an unrelated audit.

## Findings

- **Critical Findings:** demonstrated target failure or material correctness, security, privacy, data-integrity, regression, or compatibility harm.
- **Concerns:** demonstrated non-critical problems with concrete impact.
- **Unverified Risks:** material uncertainty from missing evidence or checks; not confirmed findings.

Every confirmed finding needs `Severity`, `Location` (file:line, section, Target ID, or result claim), `Issue`, `Evidence`, `Impact`, and `Suggested next step`. In an owning-task pass it also needs its stable `TR-<n>` ID and progress classification when carried from an earlier pass. Every Unverified Risk names the missing evidence and uncertain consequence; for an owning-task pass, also mark whether it blocks Target verification. Omit preferences, nits, speculative future needs, and opportunistic refactors.

With no demonstrated problem, output:

```text
Review mode: <independent subagent | non-independent self-review>
Findings: none
Unverified risks: <none or exact limitations>
Checks: <checks actually run>
```

Never use `APPROVED`, `READY`, or merge/completion authorization language.

## References

Use `references/review_workflow.md` for evidence boundaries and bundled code references. Maintainers align `evals/` and run authorized checks plus `$skill-quality`.
