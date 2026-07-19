# Review Loop Contract

Set no total round or cycle limit. Use `INITIAL (1)`, then `RE-REVIEW (n)` for every later Reviewer response. Increment monotonically and never reset the number after a Reviewer replacement, artifact change, restart, or Decision Consensus challenge.

Send the complete state on every handoff: request and criteria, pinned scope, current artifact and available diff, verification evidence, full finding ledger, round number, unresolved items, limitations, and user decisions.

## Reviewer Pass

Read [Review Lenses](review-lenses.md), inspect the full scope, and use stable finding IDs:

```text
ROUND: INITIAL (1)
STATUS: CONTINUE | APPROVED | NEEDS_USER | BLOCKED
R1 [BLOCKER|QUESTION|NOTE] <artifact>:<location> <omit when APPROVED>
Evidence: ...
Risk: ...
Question: ...
RESOLVED: none
UNRESOLVED: R1 | none
```

With no pending item, omit findings and return `APPROVED`; otherwise return `CONTINUE`. `BLOCKER` and unanswered `QUESTION` items block; `NOTE` remains pending until Editor acknowledgement. On re-review, account for every prior ID. `INITIAL (1)` can only return `CONTINUE` or `APPROVED`; later passes may return `NEEDS_USER` or `BLOCKED` only under the state rules below.

## Review States

- `CONTINUE`: actionable review work remains. Keep the Gate `BLOCKED` and route one complete batch to the Editor.
- `APPROVED`: no `BLOCKER`, unanswered `QUESTION`, or unacknowledged `NOTE` remains. Open the Gate only for the reviewed scope.
- `NEEDS_USER`: progress depends on a user-owned preference, requirement, risk choice, or missing answer. Keep the Gate `BLOCKED`, ask every exact question together, then resume with the next round after the answer.
- `BLOCKED`: an objective external condition prevents progress. Keep the Gate `BLOCKED` and state the condition required to resume.

Any Reviewer response containing a finding not yet answered by the Editor must use `CONTINUE`. Use `NEEDS_USER` or `BLOCKED` only on a later full-scope pass after the Editor has answered every current item and the remaining condition genuinely depends on the user or an external condition.

The Coordinator stops on `APPROVED` or an explicit user stop. It pauses on `NEEDS_USER`, `BLOCKED`, or a stalled review. A review is stalled when two consecutive Reviewer passes resolve no finding and introduce no newly actionable evidence, material artifact change, or newly actionable finding. Artifact churn alone is not progress. A stall is not approval and is never inferred from the round number.

Reviewed-artifact changes after `APPROVED` invalidate approval. Resume as `RE-REVIEW (n+1)` with the same history and stable finding IDs.

## Round Completeness

- The Reviewer must inspect the full pinned scope and report every currently visible `BLOCKER`, `QUESTION`, and `NOTE` in one response. On re-review, account for every prior finding ID as resolved or unresolved before adding new findings. Never sample, postpone, or drip-feed known findings. A finding first raised in a later round must identify the new artifact, diff, evidence, or other reason it was not previously actionable.
- The Editor must answer every reported item in one batch: give root cause, fix, correctness, and verification for accepted items; provide artifact or source evidence for rejections; acknowledge notes; and mark user-owned items `NEEDS_USER` with exact questions. Request ordinary re-review only after all actionable items are handled. Never use ordinary re-review to bypass a user decision. Send the complete ledger, combined changes, verification, and full updated artifact together.
- After every Reviewer verdict and Editor batch, update the stable report and task summary before routing. Never create per-round report files.
