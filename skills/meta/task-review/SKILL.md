---
name: task-review
description: Review a canonical task or supplied result once and return feedback only. Use for an explicit review request covering a PR/MR, diff, file, design, configuration, or no-file work. Exclude implementation, remediation, whole-subject audits, proofreading, and approval-gated review.
---

# Task Review

Run one evidence-based review pass without changing the reviewed work.

## Contract

- Never infer review from risk, task state, or another workflow.
- Return feedback only: no edits, task-state changes, reports, remediation, re-review, or approval.
- Review any task state as its snapshot; explicit unfinished work is not a defect.
- Route Reviewer–Editor remediation or approval to `adversarial-review`, and whole-subject audits elsewhere.

## Workflow

1. Target priority: named task; focused or owning task; supplied artifact or result; PR/MR, diff, or fixed point. Ask only if absent. See [Review Workflow](references/review_workflow.md) for Git details.
2. Give the Reviewer the request/criteria, applicable Target/Result/Verification, result and diff, rules or spec, checks, and limitations. Exclude the author's defense, preferred conclusion, and proposed answer.
3. Use exactly one fresh, read-only subagent when possible. It may inspect evidence and run non-destructive checks, but must not edit, change task state, or delegate. Never launch a nested host CLI.
4. If unavailable or failed, run the same pass inline and label `Review mode: non-independent self-review`; otherwise label `Review mode: independent subagent`.
5. Return feedback in the user's language and stop.

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

Every confirmed finding needs `Severity`, `Location` (file:line, section, Target ID, or result claim), `Issue`, `Evidence`, `Impact`, and `Suggested next step`. Every Unverified Risk names the missing evidence and uncertain consequence. Omit preferences, nits, speculative future needs, and opportunistic refactors.

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
