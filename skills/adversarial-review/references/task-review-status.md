# Task Review Status

Use the task index and canonical task files named by applicable agent rules. Under the super-agent rules, `tasks/todo.md` is the newest-first index and `tasks/todo/<task-slug>.md` is the authoritative record.

Before the first Reviewer pass:

1. Search the index and task files, then match by the same requested outcome and artifact scope; prefer the active owning task. Do not match by title keyword or file path alone.
2. With multiple plausible matches, keep `BLOCKED` and ask which task owns the review before creating a report or task summary. This pre-record ownership question is the only blocked handoff that has no report link.
3. With one match, add or update `## Review status` inside its task file. With no match, choose a stable kebab-case slug, create `tasks/todo/<task-slug>.md` with a `# Review: <artifact or decision>` title, status, goal, and the section below, then prepend its title, status, and link to `tasks/todo.md`.
4. Create or reuse `reports/adversarial-review/<task-slug>.md` and link it from the task file with `../../reports/adversarial-review/<task-slug>.md`; link the report back to `../../tasks/todo/<task-slug>.md`.
5. Reuse the existing task and report for the same scope instead of creating either one per round.
6. Update only the owning task file and its exact index entry. Never rewrite another task's status while synchronizing review state.

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
- Report: [Adversarial review report](../../reports/adversarial-review/<task-slug>.md)
```

Update it after every Reviewer verdict. While a completion-gate review is `BLOCKED`, keep the owning task non-complete. After `APPROVED`, close it only when its other acceptance criteria are satisfied.

Changes limited to `Review status` values, the linked report's exact projection of the review ledger, the owning task's status line, its exact index status, or existing plan checkbox marks are administrative tracking when they only reflect already-reviewed work; they do not invalidate approval. Any change to task scope, requirements, acceptance criteria, evidence claims outside that ledger, or reviewed artifacts invalidates approval. If the task index, task file, or report is itself under review, exclude only those exact tracking fields from artifact scope and verify that their diff is administrative-only.
