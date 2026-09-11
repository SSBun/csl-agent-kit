---
name: task-review
description: Review a canonical task or supplied result once and return feedback only. Use for an explicit review request covering a PR/MR, diff, file, design, configuration, or no-file work, and for a mandatory deliverable-change review pass dispatched by an owning task. Exclude implementation, remediation, whole-subject audits, proofreading, and approval-gated review.
---

# Task Review

Run one evidence-based review pass without changing the reviewed work. The owning task's main Agent self-checks first; the Reviewer independently looks for omissions and unsupported assumptions, not a predetermined verdict.

## Contract

- Enter only from an explicit user review request or an explicit mandatory review dispatch from the owning `task` workflow. Never infer a pass solely from risk or task state.
- Return feedback only: no edits, task-state changes, reports, remediation, re-review, or approval. The owning task handles every transition, fix, and later pass.
- Review any task state as its snapshot; explicit unfinished work is not a defect.
- Route explicitly requested Reviewer–Editor approval to `adversarial-review`, and whole-subject audits elsewhere.

## Workflow

1. Target priority: named task; focused or owning task; supplied artifact or result; PR/MR, diff, or fixed point. Ask only if absent. See [Review Workflow](references/review_workflow.md) for Git details.
2. Read [Review Workflow](references/review_workflow.md) and use its fixed Reviewer prompt plus a factual task packet. Include original requests and effective revisions, applicable Target/Result/Verification, accepted constraints, actual artifacts/diff and snapshot, rules, allowed checks, and known limitations. Supply detailed author checks as accessible evidence references, not an implementation-conversation summary. For an owning-task re-review, also give the current `task-review-ledger/v1` `## Review` ledger and its next unused finding ID. Exclude the author's defense, preferred conclusion, and proposed answer; never hide material limitations.
3. A mandatory pass requires exactly one fresh, read-only subagent. Prefer the same single fresh Reviewer for standalone requests when available; a standalone request requiring independence cannot use inline review. Explicitly select fresh context or the host equivalent, never fork the author's conversation. Use host tool restrictions, not a prompt alone, for read-only isolation. It may inspect surrounding evidence and run authorized non-destructive checks, but must not edit, change task state, or delegate. Never launch a nested host CLI. Never run tests without the required authorization.
4. If the mandatory Reviewer is unavailable or fails, stop and return the exact failure and run/workspace state; the owner Blocks, never substitutes self-review or records Passed. For a standalone explicit review whose fresh Reviewer is unavailable or fails, inline review is allowed only when the host permits it and the request has no independence requirement, labeled `Review mode: non-independent self-review`; otherwise return the failure to the interaction owner. An actual fresh child uses `Review mode: independent subagent`. Stricter host failure rules win; never silently switch modes after a failed launch. A standalone review does not require author self-check evidence; disclose its absence rather than refusing the review.
5. In the same pass, first compare original requirements, accepted constraints, and actual artifacts, including relevant unchanged callers and failure paths; then inspect author evidence and the prior ledger. Already checked behavior is not exempt, but do not mechanically rerun every check. This ordering reduces anchoring; it is not guaranteed blind review. Check snapshot identity before and after inspection; drift or inaccessible material evidence is an Unverified Risk, never a completed current-snapshot review.
6. For an owning-task pass, state whether confirmed findings require remediation and whether any Unverified Risk prevents Target verification. Account for every prior `TR-<n>` ID and classify its progress as `resolved`, `substantive progress`, or `no progress`, with current evidence; check repair changes for new regressions too. Starting with the supplied next ID, assign successive IDs to new blocking items. Return that handoff to the interaction owner without changing the task.
7. Return feedback in the user's language and stop. Separate checks performed by this Reviewer from author evidence merely read, and disclose actual coverage. Do not output private reasoning or invent findings to fill a quota.

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

Use this compact handoff for every pass; with no demonstrated problem, write `Findings: none`. Keep required finding fields above when findings exist:

```text
Review mode: <independent subagent | non-independent self-review>
Reviewed scope / snapshot: <actual artifacts and content identity>
Findings: <none or evidenced findings>
Unverified risks: <none or missing evidence, affected Target, and blocking status>
Previous findings: <per-ID progress and evidence; omit for an initial pass>
Checks performed: <checks this Reviewer actually ran and observations>
Author evidence examined: <inherited evidence read, not claimed as rerun>
Coverage limits: <unexamined scope and tool limitations>
```

Never use `APPROVED`, `READY`, or merge/completion authorization language.

## References

Use `references/review_workflow.md` for packet construction, snapshot and trust boundaries, and the fixed Reviewer prompt. This existing reference is a prompt carrier, not an agent registration or an isolation mechanism. Maintainers align `evals/` and run authorized checks plus `$skill-quality`.
