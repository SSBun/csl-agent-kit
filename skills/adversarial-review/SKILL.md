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
- Persist one workspace report and link it through the owning task and index per [Task Review Status](references/task-review-status.md).
- Reviewed artifact changes invalidate `APPROVED`; return to `BLOCKED` and resume the same numbered review history.
- No independent Reviewer: fail closed.

## Roles

- **Coordinator:** Pins scope, gate, routing, and verdict; may be Editor, never Reviewer.
- **Reviewer:** Read-only; separates findings, required outcomes, and optional remedies under the shared principles.
- **Editor:** Audits adequacy, minimal resolution, blast radius, and proportionality before accepting, narrowing, rejecting, acknowledging, or escalating; never self-approves.

Reuse the Reviewer. A replacement receives the complete state, artifact, available diff, round number, and finding IDs.

For multiple viable decisions, fixes, or plans, remain `BLOCKED` and use [Decision Consensus Gate](references/decision-consensus.md) before choosing one.

## Workflow

### 1. Pin the review

Before the first pass, resolve ownership under [Task Review Status](references/task-review-status.md), then initialize or reuse the report under [Final Review Report Contract](references/final-review-report.md). These records are not reviewed deliverables.

Give the Reviewer only task-local evidence:

- request, criteria, and non-goals
- applicable rules and standards
- review base, final artifact, and diff when available
- checks and limitations
- unrelated changes to preserve

Exclude the Editor's reasoning and proposed answers from the first Reviewer prompt.

### 2. Run the loop

Both roles apply [Shared Principles and Review Lenses](references/review-lenses.md), then execute [Review Loop Contract](references/review-loop.md). Enforce its Finding Validity Gate before accepting a Reviewer verdict or routing work to the Editor. Sync each accepted verdict and Editor response to the stable report before routing the next action.

### 3. Finalize the record

Follow [Final Review Report Contract](references/final-review-report.md). Confirm the artifact and available diff before recording `APPROVED`. On approval, return only the normal task outcome, user-relevant changes, verification, and report link. Do not present, condense, or paraphrase review-record content in the handoff, use a review-report heading, announce the approval verdict, or proactively echo Gate, state, stop reason, Reviewer, round, findings, review history, or external-action authorization unless the user explicitly asks for review details. On a blocked or paused review, return only the required questions, risks, resume condition, and link.

## Maintenance

Keep `evals/trigger_cases.json` passing after routing changes. Run `evals/report_contract_cases.json` after report-workflow changes.
