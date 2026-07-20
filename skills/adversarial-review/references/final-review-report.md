# Final Review Report Contract

Maintain one durable Markdown report per review task at `reports/adversarial-review/<task-slug>.md`. Choose a short, stable kebab-case slug from the task outcome and reuse the same file for every round, pause, approval invalidation, and resumed review of that task.

## Lifecycle

1. Before `INITIAL (1)`, create the report with Gate `BLOCKED`, the pinned scope, available artifact identity, and an empty finding ledger.
2. After every Reviewer verdict, update the overall conclusion, reviewed topics, debate results, final conclusion, verification, and technical appendix. After each Editor batch, update the matching debate result with the Editor response, evidence, conclusion, and final impact.
3. On `APPROVED`, `NEEDS_USER`, `BLOCKED`, `STALLED`, or `USER_STOP`, finalize the current state in the same file. Never create per-round reports.
4. If a reviewed artifact changes after `APPROVED`, immediately set the report and task summary to Gate `BLOCKED`, state `PENDING`, and stop reason `in-progress`; select `RE-REVIEW (n+1)`, refresh the revision and fingerprint, and append its `PENDING` round-history row before the next pass.
5. Treat changes that exactly project the review ledger into this report and the linked task summary as administrative records. They do not change the reviewed artifact or invalidate approval.

## Required Format

```markdown
# Adversarial Review: <task title>

## Overall conclusion

- Result: READY | IN_PROGRESS | NEEDS_USER | PAUSED
- Core conclusion: <plain-language result>
- Remaining risk: <material residual risk or none>

## Topics reviewed

- <topic or decision area>

## Debate results

### R1 — <topic title>

- Reviewer position: <question, objection, or risk and why it matters>
- Editor response: <accepted fix, evidence-backed rejection, compromise, or pending answer>
- Evidence: <concise observable evidence; paths only when essential>
- Debate conclusion: ACCEPTED_AND_FIXED | ACKNOWLEDGED_NO_CHANGE | REJECTED_WITH_EVIDENCE | COMPROMISE | NEEDS_USER | UNRESOLVED
- Final impact: <what changed, retained risk, exact user decision, or no change>
- Status: RESOLVED | UNRESOLVED

<When no finding exists, state a conclusion consistent with `Result`; never imply acceptance unless `Result` is `READY`.>

## Final conclusion

- Confirmed: <final judgments that stand>
- Changed: <changes caused by the review or none>
- Unresolved: <remaining issue and condition or none>
- User decision required: <exact question or none>

## Verification

- <command or evidence> — <result>
- Limitations: <known gaps or none>

## Technical appendix

### Review metadata

- Gate: APPROVED | BLOCKED
- Review state: PENDING | CONTINUE | APPROVED | NEEDS_USER | BLOCKED | STALLED | USER_STOP
- Stop reason: in-progress | approved | user-decision-required | objective-blocker | review-stalled | user-stopped
- Reviewer: `<short stable name without hierarchy prefix>`
- Current round: INITIAL (1) | RE-REVIEW (n)
- Updated: <timestamp with timezone>

### Reviewed scope

- Task: [tasks/todo/<task-slug>.md](../../tasks/todo/<task-slug>.md) — <task title>
- Base or revision: <commit, version, or source state>
- Artifacts: <reviewed paths or resources>
- Fingerprint: <commit SHA, diff or file SHA-256, or unavailable with reason>
- Non-goals: <explicit exclusions or none>

### Round history

| Round | State | New findings | Resolved | Unresolved |
|---|---|---|---|---|
| INITIAL (1) | PENDING | none | none | none |

### Unresolved items

<Every unresolved finding with evidence, risk, exact user question or objective resume condition; or `None.`>

### Approval boundary

- Approval covers only the identified revision and scope.
- Reviewed-artifact changes invalidate approval and resume the same numbered history.
- Report and task-summary synchronization are administrative review records.
- External action authorization: <separate user instruction or not authorized>
```

Map the user-facing result deterministically: `APPROVED` to `READY`; `PENDING` or `CONTINUE` to `IN_PROGRESS`; `NEEDS_USER` to `NEEDS_USER`; and `BLOCKED`, `STALLED`, or `USER_STOP` to `PAUSED`.

For an empty finding ledger, write a result-consistent statement: `READY` may say the outcome was accepted without substantive debate; `IN_PROGRESS` must say no issue has been raised yet and review is still underway; `NEEDS_USER` or `PAUSED` must state the exact pending condition. Use `ACKNOWLEDGED_NO_CHANGE` when a Reviewer `NOTE` is closed by Editor acknowledgement without an artifact change.

Make the user-facing body outcome-first: overall conclusion, topics, canonical debate results, final conclusion, and verification. Put cycle count, reviewer identity, state-machine fields, scope, routine file paths, fingerprint, and round history only in the final technical appendix. Mention a path in a debate result only when it is essential evidence.

Use one canonical debate-result section per stable finding ID; do not duplicate it as a separate summary and findings ledger. Preserve both positions when the Reviewer and Editor disagree, never fabricate agreement, and keep exact pending conditions. Keep the complete compact round history in the appendix. Do not include hidden reasoning, raw prompts, conversation transcripts, secrets, unrelated workspace changes, or full command logs.

## User-Facing Handoff

Never paste, condense, paraphrase, or present the report or template as a conversation summary. Do not title an approval handoff `Final Review Report`, `Review Report`, or an equivalent review-report heading, and do not announce the approval verdict. On approval, give only the normal task result, user-relevant changes, verification, and report link. Unless the user explicitly asks for review details, omit Gate, review state, stop reason, Reviewer, round, findings, resolved or unresolved counts, review history, review-process narration, and external-action authorization. For a blocked or paused review, show only every user-addressable question with its evidence and risk, the resume condition, and the report link. Keep the Gate `BLOCKED` until the condition clears. If task ownership is ambiguous before a report can be assigned, ask only the ownership question without a report link; create or reuse the report after the user resolves ownership.
