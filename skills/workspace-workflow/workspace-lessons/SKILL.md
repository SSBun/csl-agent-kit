---
name: workspace-lessons
description: Query and apply relevant `tasks/lessons.md` rules when entering substantive work, restoring an interrupted thread, materially changing an active request, or receiving a user correction, and maintain reusable correction lessons with explicit write approval. Use to retrieve, add, merge, refine, replace, or remove workspace lessons. Do not use for ordinary preferences, one-off request details, execution status, durable repository facts, or secrets.
---

# Capture Workspace Lessons

Use `tasks/lessons.md` as the canonical current rule set. Optimize for finding and applying relevant lessons before mistakes recur; capture is secondary.

## Boundaries

Route information to its proper owner:

- Reusable workspace correction rules belong in `tasks/lessons.md`.
- Task-specific decisions, progress, results, and evidence belong in the owning task record.
- Stable workspace structure and relationships belong in `tasks/context.md`.
- Cross-workspace preferences or persistent directives belong in the applicable global rule mechanism.
- Procedures belong in an SOP or runbook.
- Speculation, secrets, duplicates, and one-off details are not stored.

Routine lesson maintenance does not create a task record.

## Lesson Schema

New or materially updated records use this exact shape:

```markdown
## L-YYYYMMDD-ascii-slug — Title

### Trigger
- Observable applicability condition.

### Rule
- One mandatory action or boundary.

### Check
- Observable, executable, or reviewable evidence.
```

- `Trigger`: state when the lesson applies. Keep one condition per flat list item.
- `Rule`: state one mandatory action or boundary per flat list item.
- `Check`: state one observable, executable, or reviewable proof per flat list item.
- Keep the section order exactly `Trigger`, `Rule`, `Check`, with at least one item in each section.
- Use an ASCII ID in the form `L-<creation-date>-<slug>` and never change it when updating or moving the record.
- Keep only current effective rules. Do not add status, history, or narrative fields such as `Why`.
- Insert new or materially revised records at the top, directly below `# Lessons`.

## Query Gates

### Entry Gate

After understanding a concrete request, form a compact Task Fingerprint from its outcome, artifacts, domain, constraints, and planned approach. Before non-trivial work, query relevant lessons.

Skip the Entry Gate for no-task session startup, idle conversation, simple factual answers, directly verifiable mechanical work, and routine reading or maintenance of Lessons itself.

### Change Gate

Rebuild the Task Fingerprint and re-query after session resume or compaction, a material change to scope, artifacts, domain, constraints, or plan, and after every user correction. Do not re-query for an ordinary follow-up or individual tool call.

### Completion Gate

Before completion, execute or review every applicable selected `Check`. If scope changed without a Change Gate query, return to the Change Gate first. A failed or unobservable applicable Check blocks completion until evidence is improved, a task-local observable Check is derived, or the user resolves the gap.

Keep selected lesson IDs only in current session state. Do not persist them in task records or a separate cache. Resume and compaction always query the canonical file again.

## Trigger-First Query

Resolve the skill directory from this `SKILL.md`, then use:

```text
node <skill-dir>/scripts/lessons.js --workspace <workspace> index
node <skill-dir>/scripts/lessons.js --workspace <workspace> show <id>...
node <skill-dir>/scripts/lessons.js --workspace <workspace> validate
node <skill-dir>/scripts/lessons.js --self-test
```

1. Run `index` to load only IDs, titles, formats, and retrieval triggers.
2. Compare the Task Fingerprint with titles and triggers semantically. Prefer recall: include any plausible match rather than silently missing an applicable lesson.
3. Run one batched `show` for all candidates, then decide applicability from the complete `Trigger`, `Rule`, and `Check` fields.
4. Apply every applicable Rule. Merge compatible Rules and use the union of their Checks.
5. When at least one lesson is applied, show one compact line: `Applied Lessons: <ID...>`. Keep match evidence, Rules, and Checks internal. Say nothing when none applies.

The script is a read-only deterministic parser. It does not semantically match, edit Lessons, run Checks, or create persistent state.

## Priority and Conflicts

Lessons are lower priority than system and developer instructions, project and security rules, the user's current explicit request, and confirmed Decisions in the current task.

For lessons at the same priority:

1. Merge compatible Rules and union their Checks.
2. Prefer the lesson with the more specific Trigger when Rules conflict.
3. Never use record date as priority.
4. If a material conflict remains, stop before the affected action. Show the IDs, matched evidence, and impact, then ask the user to decide. Repair the persistent conflict only through the write workflow below.

## Corrections and Writes

Apply a user's correction to the current task immediately. Then inspect related lessons and choose exactly one operation: Add, Update, Merge, Replace, Delete, or No-op.

- Choose No-op without interrupting the user when the correction is task-specific, not reusable, or already covered.
- Before every persistent Add, Update, Merge, Replace, or Delete, show the target ID, operation, and exact proposed record or diff. Obtain explicit confirmation.
- Without confirmation, leave `tasks/lessons.md` unchanged.
- After confirmation, preserve the pre-write content, apply only the approved change, and run `validate`.
- If validation fails, restore the pre-write content and report the diagnostics.
- Prefer updating one current rule over creating overlap. Remove superseded or invalidated rules rather than retaining history.

## Legacy Records

Do not bulk-migrate existing records. The query script assigns each legacy record a scan-local `legacy-<content-hash>` ID and indexes its title plus legacy Trigger and Rule bullets as retrieval cues. It never writes this ID back.

A selected legacy record without `Check` requires a temporary observable Check for the current task. Convert a legacy record to the current schema only when a confirmed write materially changes it; assign a new stable v1 ID then.

## Degradation and Failure

- A missing `tasks/lessons.md` means an empty rule set; continue silently.
- If the query script is unavailable or fails, disclose the degradation and manually perform the same Trigger-first scan.
- For a malformed record, inspect the raw record. Treat it as legacy only when its meaning is safe to infer; pause and ask when it may apply but remains unclear; ignore it when clearly irrelevant.
- Never auto-apply a duplicated ID.
- Show conflicts, degraded operation, validation failures, and write confirmation details in full; only successful query visibility is compact.

## Maintainer Validation

Keep the query contract, focused tests, `evals/query_cases.json`, and `../evals/lessons_trigger_cases.json` aligned after changes. Run the script self-test, focused task contract tests, applicable routing evaluation, OpenAI validation, Yao validation, resource-boundary check, and `git diff --check`.

The only acceptable non-blocking Yao failure is the workflow skill's 1000-token initial-load budget. Syntax, frontmatter, governance, tests, routing, script trust, and every other resource-boundary check remain blocking. Do not remove or distort core workflow guidance merely to satisfy that token budget.
