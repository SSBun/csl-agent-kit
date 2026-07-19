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
- Persist the review in one workspace report and link its summary from the task list per [Task Review Status](references/task-review-status.md).
- Reviewed artifact changes invalidate `APPROVED`; return to `BLOCKED` and resume the same numbered review history.
- No independent Reviewer: fail closed.

## Roles

- **Coordinator:** Pins scope, gate, routing, and verdict; may be Editor, never Reviewer.
- **Reviewer:** Read-only; inspects the request, rules, artifact, evidence, and checks; questions, approves, or blocks.
- **Editor:** Answers all items, makes scoped fixes, runs checks, and requests re-review; never self-approves.

Reuse the Reviewer. A replacement receives the complete state, artifact, available diff, round number, and finding IDs.

For multiple viable decisions, fixes, or plans, remain `BLOCKED` and use [Decision Consensus Gate](references/decision-consensus.md) before choosing one.

## Workflow

### 1. Pin the review

Before the first pass, resolve ownership under [Task Review Status](references/task-review-status.md), then initialize or reuse the full report under [Final Review Report Contract](references/final-review-report.md) and link its summary. They are administrative review records, not reviewed deliverables.

Give the Reviewer only task-local evidence:

- request, criteria, and non-goals
- applicable rules and standards
- review base, final artifact, and diff when available
- checks and limitations
- unrelated changes to preserve

Exclude the Editor's reasoning and proposed answers from the first Reviewer prompt.

### 2. Run the loop

Apply [Review Lenses](references/review-lenses.md) and execute [Review Loop Contract](references/review-loop.md). Sync each verdict and Editor response to the stable report before routing the next action.

### 3. Finalize the record

Follow [Final Review Report Contract](references/final-review-report.md). Confirm the artifact and available diff before recording `APPROVED`. Never paste the report into chat: return the normal outcome and link, or only the blocking questions, risks, resume condition, and link.

## Maintenance

Keep `evals/trigger_cases.json` passing after routing changes. Run `evals/report_contract_cases.json` after report-workflow changes.
