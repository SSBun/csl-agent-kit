---
name: adversarial-review
description: Run a fail-closed, uncapped Reviewer–Editor loop for code, PRDs, RFCs, design documents, and other deliverables. Use only when the user explicitly requests adversarial review, a two-agent Reviewer–Editor loop, or independent Reviewer approval. Exclude ordinary one-pass review, self-review, routine file operations, and feedback-only requests without remediation.
---

# Adversarial Review

## Gate Contract

- Enter only from an explicit user request; never infer the need from risk, complexity, verification gaps, or another workflow.
- Start `BLOCKED` with distinct Reviewer and Editor agents.
- Prefer real isolated subagents for the Reviewer and Editor when the host can dispatch them; fall back to inline role-play with `ISOLATION: simulated` disclosed. Follow [Subagent Dispatch](references/subagent-dispatch.md).
- While `BLOCKED`, do not finalize, approve, commit, publish, or externally share the artifact.
- `APPROVED` is review evidence, not external-action authorization.
- Set no total round or cycle limit. Continue by review state under [Review Loop Contract](references/review-loop.md).
- Keep the active finding ledger in Reviewer–Editor handoffs; do not write report files during intermediate rounds.
- Reviewed artifact changes invalidate `APPROVED`; return to `BLOCKED` and resume the same numbered review history.
- No independent Reviewer: fail closed.

## Roles

- **Coordinator:** Pins scope, gate, routing, and verdict; may be Editor, never Reviewer.
- **Reviewer:** Read-only; separates findings, required outcomes, and optional remedies under the shared principles.
- **Editor:** Audits adequacy, minimal resolution, blast radius, and proportionality before accepting, narrowing, rejecting, acknowledging, or escalating; never self-approves.

Reuse the Reviewer. A replacement receives the complete state, artifact, available diff, round number, and finding IDs.

For multiple viable decisions, fixes, or plans, remain `BLOCKED` and use [Decision Consensus Gate](references/decision-consensus.md) before choosing one.

## Workflow

### 0. Resolve dispatch mode

Detect the host's dispatch capability, **verify the dispatch path is actually ready (on Pi: the `pi-agent` carrier is registered and spawnable; on Codex: the host can spawn an agent process)**, record the mode and per-role readiness once per run, and print the dispatch metadata table to the user as the first output of the run — before any role pass — as specified in [Subagent Dispatch](references/subagent-dispatch.md). If all roles are `ready`, enter `SUBAGENT` mode without asking; if any role is `missing`, present the table and ask the user whether to proceed in `INLINE-FALLBACK`, and enter it only on explicit confirmation. Never enter the loop on an unverified dispatch path. The Review Loop Contract, finding ledger, and report format are identical in both modes; `APPROVED` reached under `simulated` isolation carries that caveat.

### 1. Pin the review

Resolve the request, criteria, scope, review base, and non-goals before the first pass. Do not create a report or task record merely to start the review.

Give the Reviewer only task-local evidence:

- request, criteria, and non-goals
- applicable rules and standards
- review base, final artifact, and diff when available
- checks and limitations
- unrelated changes to preserve

Exclude the Editor's reasoning and proposed answers from the first Reviewer prompt.

### 2. Run the loop

Both roles apply [Shared Principles and Review Lenses](references/review-lenses.md), then execute [Review Loop Contract](references/review-loop.md). Enforce its Finding Validity Gate before accepting a Reviewer verdict or routing work to the Editor.

### 3. Finalize the record

When the loop ends or pauses, write or update one report under [Final Review Report Contract](references/final-review-report.md). Require the owning canonical task ID before writing; if it is unavailable, return to task activation instead of creating an unowned report. Confirm the artifact and available diff before recording `APPROVED`, then add only the final decision and report link to the owning task. In chat, return the normal task outcome, user-relevant verification, and report link; for a pause, return only the exact pending question or resume condition and the link.

## Maintenance

Keep `evals/trigger_cases.json` passing after routing changes. Run `evals/report_contract_cases.json` after report-workflow changes.
