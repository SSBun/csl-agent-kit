# Final Review Report Contract

Maintain at most one Markdown report per review at `tasks/artifacts/<task-id>/reports/adversarial-review.md`, where `<task-id>` is the owning canonical task ID.

## Lifecycle

1. Do not create or update a report during active Reviewer–Editor rounds. Carry the full ledger in agent handoffs.
2. Write the report when the review reaches `APPROVED`, `NEEDS_USER`, `BLOCKED`, `STALLED`, or `USER_STOP`.
3. Require the owning canonical task before writing. On first write, set `created` to the current `YYYY-MM-DD`, set `task` to its ID, and set `review_cycles` to the total Reviewer passes including the terminal or pause pass.
4. Reuse the same file after a resumed review, preserve `created`, and update `review_cycles` cumulatively. Draft, pause, approval, supersession, or resume never moves the report. If an approved artifact changes, mark the existing decision `SUPERSEDED` before resuming and do not present it as current.
5. Add one final decision and the relative `../artifacts/<task-id>/reports/adversarial-review.md` link to the owning task. If no owning task is available, return to task activation without writing a report.

## Required Format

```markdown
---
created: <YYYY-MM-DD>
task: <task-slug>
review_cycles: <positive integer>
---

# <title>

Topic: <question or decision>

> **E1:** <Editor's initial reasoning or implementation>
>
> **R1:** <Reviewer's response>
>
> **E2:** <Editor's next response or change>
>
> **R2:** <Reviewer's next response>

**Conclusion:** <final resolution for this topic>

<Repeat Topic blocks only for other material topics.>

---

**Final decision:** `APPROVED | NEEDS_USER | BLOCKED | STALLED | USER_STOP | SUPERSEDED`

**Outcome:** <plain-language result>

**Remaining:** <none, exact user question, or objective resume condition>
```

- Require `task`; it must equal the owning task directory name.
- Treat `review_cycles` as metadata only; do not add round-history sections to the body.
- Group the body by human-readable topics. Within each topic, use `En` for the Editor state presented to review pass `n` and `Rn` for that Reviewer's response.
- Summarize every material exchange that changed, challenged, or confirmed the topic. Preserve disagreement without copying raw prompts or transcripts.
- Keep a single viewpoint on the same line as its `En` or `Rn` label. When one turn has multiple independent viewpoints, place list items below the label inside the same quote block.
- Use one quote block and one `Conclusion` per topic. Use backticks only for exact statuses, identifiers, commands, or code terms.
- Use one horizontal rule before the body-level final decision. Do not add tables, emoji, finding IDs, extra discussion headings, intermediate states, Reviewer identities, fingerprints, routine paths, duplicated summaries, or technical appendices.
- If no material discussion occurred, replace all Topic blocks with one sentence stating that fact.

## User-Facing Handoff

On approval, give only the normal task result, user-relevant verification, and report link. On a pause, give only the exact question or resume condition and the report link. Do not narrate review mechanics unless the user asks.
