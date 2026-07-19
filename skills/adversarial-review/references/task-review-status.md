# Task Review Status

Use the shared task list named by applicable agent rules. Under the super-agent rules, this is `tasks/todo.md`.

Before the first Reviewer pass:

1. Match by the same requested outcome and artifact scope; prefer the active owning task. Do not match by title keyword or file path alone.
2. With one match, add or update `## Review status` inside that task. With no match, add a newest-first `# Review: <artifact or decision>` task with a status, goal, and the section below. With multiple plausible matches, keep `BLOCKED` and ask the user which task owns the review.
3. Reuse an existing review task for the same scope instead of creating one per round.

Use this section:

```markdown
## Review status

- Gate: BLOCKED | APPROVED
- Reviewer: <agent identity>
- Round: <used>/<3 | OPEN>
- Scope: <reviewed artifacts>
- Resolved: <finding IDs or none>
- Unresolved: <finding IDs with exact user questions, or none>
```

Update it after every Reviewer verdict. While a completion-gate review is `BLOCKED`, keep the owning task non-complete. After `APPROVED`, close it only when its other acceptance criteria are satisfied.

Changes limited to `Review status` values, the task status line, or existing plan checkbox marks are administrative tracking when they only reflect already-reviewed work; they do not invalidate approval. Any change to task scope, requirements, acceptance criteria, evidence claims, or reviewed artifacts invalidates approval. If the task list is itself under review, exclude only those exact tracking fields from artifact scope and verify that their diff is administrative-only.
