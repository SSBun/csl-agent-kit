# Task Review Status

Use the shared task list named by applicable agent rules. Under the super-agent rules, this is `tasks/todo.md`.

Before the first Reviewer pass:

1. Match by the same requested outcome and artifact scope; prefer the active owning task. Do not match by title keyword or file path alone.
2. With multiple plausible matches, keep `BLOCKED` and ask which task owns the review before creating a report or task summary. This pre-record ownership question is the only blocked handoff that has no report link.
3. With one match, add or update `## Review status` inside that task. With no match, add a newest-first `# Review: <artifact or decision>` task with a status, goal, and the section below.
4. Choose a stable task slug, create or reuse `reports/adversarial-review/<task-slug>.md`, and link it from the task using the correct relative path. From `tasks/todo.md`, use `../reports/adversarial-review/<task-slug>.md`.
5. Reuse the existing task and report for the same scope instead of creating either one per round.

Use this section:

```markdown
## Review status

- Gate: BLOCKED | APPROVED
- State: PENDING | CONTINUE | APPROVED | NEEDS_USER | BLOCKED | STALLED | USER_STOP
- Reviewer: <short stable name without hierarchy prefix>
- Round: <used>
- Scope: <reviewed artifacts>
- Summary: <one-sentence outcome>
- Unresolved: <finding IDs with user questions, objective resume conditions, or required acknowledgements as applicable; or none>
- Report: [Adversarial review report](../reports/adversarial-review/<task-slug>.md)
```

Update it after every Reviewer verdict. While a completion-gate review is `BLOCKED`, keep the owning task non-complete. After `APPROVED`, close it only when its other acceptance criteria are satisfied.

Changes limited to `Review status` values, the linked report's exact projection of the review ledger, the task status line, or existing plan checkbox marks are administrative tracking when they only reflect already-reviewed work; they do not invalidate approval. Any change to task scope, requirements, acceptance criteria, evidence claims outside that ledger, or reviewed artifacts invalidates approval. If the task list or report is itself under review, exclude only those exact tracking fields from artifact scope and verify that their diff is administrative-only.
