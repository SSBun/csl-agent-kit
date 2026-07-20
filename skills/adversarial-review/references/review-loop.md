# Review Loop Contract

Set no total round or cycle limit. Use `INITIAL (1)`, then `RE-REVIEW (n)` for every later Reviewer response. Increment monotonically and never reset the number after a Reviewer replacement, artifact change, restart, or Decision Consensus challenge.

Send the complete state on every handoff: request and criteria, pinned scope, current artifact and available diff, verification evidence, full finding ledger, round number, unresolved items, limitations, and user decisions. Both roles must read and apply [Review Lenses and Shared Principles](review-lenses.md).

## Reviewer Pass

Read [Review Lenses](review-lenses.md), inspect the full scope, and use stable finding IDs:

```text
ROUND: INITIAL (1)
STATUS: CONTINUE | APPROVED | NEEDS_USER | BLOCKED
R1 [BLOCKER|QUESTION|NOTE] <artifact>:<location> <omit when APPROVED>
Violated criterion: ...
Evidence: ...
Risk: ...
Required outcome: ...
Suggested remedy: ... | none
Question: ...
RESOLVED: none
UNRESOLVED: R1 | none
```

With no pending item, omit findings and return `APPROVED`; otherwise return `CONTINUE`. Treat every incoming or prior severity label as untrusted and reclassify the finding on each pass before routing it to the Editor. A `BLOCKER` must name the violated requirement or principle, observable evidence, material risk, and required outcome; otherwise downgrade it to `QUESTION` or `NOTE`, or omit it. Never preserve an invalid `BLOCKER` merely so the Editor can reject its remedy. A `QUESTION` requests only the missing information needed to judge adequacy and must not hide an implementation demand. A `NOTE` is a non-blocking observation or optional improvement and closes on Editor acknowledgement without requiring an artifact change. Omit pure preferences, opportunistic refactors, and speculative future needs. `BLOCKER` and unanswered `QUESTION` items block; `NOTE` remains pending only until acknowledgement. On re-review, account for every prior ID. `INITIAL (1)` can only return `CONTINUE` or `APPROVED`; later passes may return `NEEDS_USER` or `BLOCKED` only under the state rules below.

The suggested remedy is always advisory. A finding may close through a smaller fix or evidence that the finding does not apply. On re-review, judge only whether the required outcome is satisfied or the finding is disproven. Do not keep a finding open merely because the Editor did not adopt the suggested remedy; continued blocking requires new evidence or an unmet required outcome.

## Finding Validity Gate

Before recording a Reviewer verdict or sending anything to the Editor, the Coordinator validates every finding against the type contract above. Treat inherited ledger entries exactly like new findings. If a `BLOCKER` lacks any required field, a `QUESTION` hides a change demand, or a `NOTE` requires an artifact change, reject the response and have the same Reviewer correct the same numbered pass. An invalid response does not advance the round, update the ledger, or consume an Editor batch.

## Editor Audit

For every finding, answer in this order:

```text
Disposition: ACCEPT | NARROW | REJECT | ACKNOWLEDGE | NEEDS_USER
Current adequacy: ...
Minimal resolution: ...
Blast radius: ...
Proportionality: ...
Response and evidence: ...
Changes and verification: ... | none
```

- `ACCEPT`: the finding is justified; when a remedy was suggested, it is also justified. Implement that remedy's smallest sufficient form, or choose the smallest sufficient resolution when no remedy was suggested.
- `NARROW`: the finding is valid but the suggested remedy is broader than necessary; use a smaller resolution.
- `REJECT`: evidence shows the current solution is adequate or the finding does not apply; do not change the artifact.
- `ACKNOWLEDGE`: record a `NOTE` without changing the artifact.
- `NEEDS_USER`: identify the exact user-owned choice; do not choose silently.

If the current solution already satisfies the required outcome, preserve it unless correctness, security, data integrity, or an explicit requirement provides evidence for change.

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
- The Editor must answer every reported item in one batch using the Editor Audit: give root cause, minimal fix, correctness, and verification for accepted or narrowed items; provide artifact or source evidence for rejections; acknowledge notes without modifying the artifact; and mark user-owned items `NEEDS_USER` with exact questions. Request ordinary re-review only after all actionable items are handled. Never use ordinary re-review to bypass a user decision. Send the complete ledger, combined changes, verification, and full updated artifact together.
- After every Reviewer verdict and Editor batch, update the stable report and task summary before routing. Never create per-round report files.
