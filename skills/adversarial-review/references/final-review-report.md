# Final Review Report Contract

Maintain one durable Markdown report per review task at `reports/adversarial-review/<task-slug>.md`. Choose a short, stable kebab-case slug from the task outcome and reuse the same file for every round, pause, approval invalidation, and resumed review of that task.

## Lifecycle

1. Before `INITIAL (1)`, create the report with Gate `BLOCKED`, the pinned scope, available artifact identity, and an empty finding ledger.
2. After every Reviewer verdict, update the summary, round history, findings, unresolved items, and verification. After each Editor batch, add the response and evidence under the matching finding.
3. On `APPROVED`, `NEEDS_USER`, `BLOCKED`, `STALLED`, or `USER_STOP`, finalize the current state in the same file. Never create per-round reports.
4. If a reviewed artifact changes after `APPROVED`, immediately set the report and task summary to Gate `BLOCKED`, state `PENDING`, and stop reason `in-progress`; select `RE-REVIEW (n+1)`, refresh the revision and fingerprint, and append its `PENDING` round-history row before the next pass.
5. Treat changes that exactly project the review ledger into this report and the linked task summary as administrative records. They do not change the reviewed artifact or invalidate approval.

## Required Format

```markdown
# Adversarial Review: <task title>

## Summary

- Gate: APPROVED | BLOCKED
- Review state: PENDING | CONTINUE | APPROVED | NEEDS_USER | BLOCKED | STALLED | USER_STOP
- Stop reason: in-progress | approved | user-decision-required | objective-blocker | review-stalled | user-stopped
- Reviewer: `<short stable name without hierarchy prefix>`
- Current round: INITIAL (1) | RE-REVIEW (n)
- Task: [tasks/todo/<task-slug>.md](../../tasks/todo/<task-slug>.md) — <task title>
- Updated: <timestamp with timezone>

## Reviewed scope

- Base or revision: <commit, version, or source state>
- Artifacts: <reviewed paths or resources>
- Fingerprint: <commit SHA, diff or file SHA-256, or unavailable with reason>
- Non-goals: <explicit exclusions or none>

## Outcome

<Concise evidence-backed result and the exact approved or blocked boundary.>

## Findings

### R1 — BLOCKER | QUESTION | NOTE: <title>

- Location: <artifact and location>
- Evidence: <verifiable fact>
- Risk: <material consequence>
- Editor response: <fix, evidence-backed rejection, acknowledgement, or pending>
- Resolution: <result or pending condition>
- Verification: <check or evidence>
- Status: RESOLVED | UNRESOLVED

<Use `None.` when no finding exists.>

## Round history

| Round | State | New findings | Resolved | Unresolved |
|---|---|---|---|---|
| INITIAL (1) | PENDING | none | none | none |

## Verification

- <command or evidence> — <result>
- Limitations: <known gaps or none>

## Unresolved items

<Every unresolved finding with evidence, risk, exact user question or objective resume condition; or `None.`>

## Approval boundary

- Approval covers only the identified revision and scope.
- Reviewed-artifact changes invalidate approval and resume the same numbered history.
- Report and task-summary synchronization are administrative review records.
- External action authorization: <separate user instruction or not authorized>
```

Use one finding entry per stable ID and keep the complete compact round history. Do not include hidden reasoning, raw prompts, conversation transcripts, secrets, unrelated workspace changes, or full command logs.

## User-Facing Handoff

Never paste the report or template into the conversation. On approval, give the normal task result and link the report. For a blocked or paused review, show only every user-addressable question with its evidence and risk, the resume condition, and the report link. Keep the Gate `BLOCKED` until the condition clears. If task ownership is ambiguous before a report can be assigned, ask only the ownership question without a report link; create or reuse the report after the user resolves ownership.
