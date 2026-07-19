---
name: adversarial-review
description: Fail-closed adversarial review for code, PRDs, RFCs, design documents, and other deliverables, with a three-round default and explicit open-ended mode. Use before finalizing or completing an artifact when an independent Reviewer and separate Editor must return APPROVED or escalate unresolved findings. Exclude one-pass feedback without remediation.
---

# Adversarial Review

## Gate Contract

- Start `BLOCKED` with distinct Reviewer and Editor agents.
- While `BLOCKED`, do not finalize, approve, commit, publish, or externally share the artifact.
- `APPROVED` is review evidence, not external-action authorization.
- Use `Round limit: 3` by default. Enable `OPEN` only on explicit user request for deep or open-ended review. Follow [Review Budget Contract](references/review-budget.md).
- Track the gate in the workspace task list per [Task Review Status](references/task-review-status.md).
- Reviewed artifact changes invalidate `APPROVED`; return to `BLOCKED` under the active budget.
- No independent Reviewer: fail closed.

## Roles

- **Coordinator:** Pins scope, gate, routing, and verdict; may be Editor, never Reviewer.
- **Reviewer:** Read-only; inspects the request, rules, artifact, evidence, and checks; questions, approves, or blocks.
- **Editor:** Answers all items, makes scoped fixes, runs checks, and requests re-review; never self-approves.

Reuse the Reviewer. If replaced, provide the full artifact and available diff; keep the count.

For multiple viable decisions, fixes, or plans, remain `BLOCKED` and use [Decision Consensus Gate](references/decision-consensus.md) before choosing one.

## Workflow

### 1. Pin the review packet

Give the Reviewer only task-local evidence:

- request, criteria, and non-goals
- applicable rules and standards
- review base, final artifact, and diff when available
- checks and limitations
- unrelated changes to preserve

Exclude the Editor's reasoning and proposed answers from the first Reviewer prompt.

### 2. Run the adversarial pass

Read [Review Lenses](references/review-lenses.md), inspect the full scope, and report all findings in one pass:

```text
ROUND: INITIAL (1/<limit>)
VERDICT: BLOCKED
R1 [BLOCKER|QUESTION|NOTE] <artifact>:<location>
Evidence: ...
Risk: ...
Question: ...
```

`BLOCKER` and unanswered `QUESTION` items keep the gate blocked. A `NOTE` is optional to fix but remains pending until Editor acknowledgement. `APPROVED` requires no `BLOCKER`, unanswered `QUESTION`, or unacknowledged `NOTE`.

### 3. Answer or fix

Send the numbered report to the Editor. Require per item:

- accepted: root cause, fix, correctness, and verification evidence
- rejected: direct answer and artifact or source evidence showing no change is needed
- user-owned scope or risk decision: stay blocked; use Decision Consensus for alternatives, else ask the user

After handling every item in one batch, send the full ledger, fixes, checks, and updated artifact/diff to the same Reviewer.

### 4. Use the remaining rounds

With limit `3`, run `RE-REVIEW (2/3)` after the first Editor response and `FINAL (3/3)` after the second. With `OPEN`, run `RE-REVIEW (n/OPEN)` after each response until a stop condition. Return one state:

- `VERDICT: BLOCKED` with remaining or newly introduced numbered items
- `VERDICT: APPROVED` with reviewed scope, resolved items, and verification evidence

Route `BLOCKED` according to the active budget. Never reset the count or downgrade findings.

### 5. Publish the final review report

After approval, a bounded final review, or an `OPEN` stall, follow [Final Review Report Contract](references/final-review-report.md). Confirm the reviewed artifact and working diff when available before reporting `APPROVED`.

## Maintenance

Keep `evals/trigger_cases.json` passing against `evals/semantic_config.json` after routing changes.
