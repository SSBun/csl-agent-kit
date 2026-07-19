---
name: adversarial-review
description: Fail-closed, uncapped adversarial review for code, PRDs, RFCs, design documents, and other deliverables. Use before finalizing or completing an artifact when an independent Reviewer and separate Editor must iterate until APPROVED or pause with every unresolved finding and user question. Exclude one-pass feedback without remediation.
---

# Adversarial Review

## Gate Contract

- Start `BLOCKED` with distinct Reviewer and Editor agents.
- While `BLOCKED`, do not finalize, approve, commit, publish, or externally share the artifact.
- `APPROVED` is review evidence, not external-action authorization.
- Set no total round or cycle limit. Continue by review state under [Review Loop Contract](references/review-loop.md).
- Track the gate in the workspace task list per [Task Review Status](references/task-review-status.md).
- Reviewed artifact changes invalidate `APPROVED`; return to `BLOCKED` and resume the same numbered review history.
- No independent Reviewer: fail closed.

## Roles

- **Coordinator:** Pins scope, gate, routing, and verdict; may be Editor, never Reviewer.
- **Reviewer:** Read-only; inspects the request, rules, artifact, evidence, and checks; questions, approves, or blocks.
- **Editor:** Answers all items, makes scoped fixes, runs checks, and requests re-review; never self-approves.

Reuse the Reviewer. A replacement receives the complete state, artifact, available diff, round number, and finding IDs.

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
ROUND: INITIAL (1)
STATUS: CONTINUE | APPROVED
R1 [BLOCKER|QUESTION|NOTE] <artifact>:<location> <omit when APPROVED>
Evidence: ...
Risk: ...
Question: ...
RESOLVED: none
UNRESOLVED: R1 | none
```

With no pending item, omit findings and return `APPROVED`; otherwise return `CONTINUE` with all findings. Use stable IDs. On re-review, account for every prior ID. `BLOCKER` and unanswered `QUESTION` items block; `NOTE` remains pending until Editor acknowledgement.

### 3. Answer or fix

Send the numbered report to the Editor. Require for every item:

- accepted: root cause, fix, correctness, and verification evidence
- rejected: direct answer and artifact or source evidence showing no change is needed
- user-owned scope or risk decision: stay blocked; use Decision Consensus for alternatives, else ask the user

Send the complete state, ledger, combined fixes, checks, and updated artifact/diff to the same Reviewer only after handling the full batch.

### 4. Recheck without a cap

Run `RE-REVIEW (n)` after each Editor response. Verify every prior response and the full pinned scope, then return one status defined by the Review Loop Contract: `CONTINUE`, `APPROVED`, `NEEDS_USER`, or `BLOCKED`.

Any finding not yet answered by the Editor requires `CONTINUE` and one complete Editor batch. Use `NEEDS_USER` or `BLOCKED` only after the Editor has answered every current item.

Never reset the round number, hide findings, or downgrade them without evidence.

### 5. Publish the final review report

After approval or any pause or stop condition, follow [Final Review Report Contract](references/final-review-report.md). Confirm the reviewed artifact and working diff when available before reporting `APPROVED`.

## Maintenance

Keep `evals/trigger_cases.json` passing against `evals/semantic_config.json` after routing changes.
