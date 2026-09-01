---
name: task-lessons
description: Query and apply relevant `tasks/lessons.md` preventive controls when entering substantive work, restoring an interrupted thread, materially changing an active request, or receiving a user correction, and maintain reusable correction lessons with explicit write approval. Use to retrieve, apply, add, merge, refine, replace, or remove workspace lessons. Do not use for ordinary preferences, one-off request details, execution status, durable repository facts, secrets, or explicit cross-record historical cleanup handled by task-maintenance.
---

# Prevent Repeated Mistakes

Use `tasks/lessons.md` as the canonical current set of reusable preventive controls. A Lesson is learned only when it changes future behavior: matching work recognizes its `Trigger`, follows its `Rule`, and satisfies its `Check`. Recording, displaying, or reading one is not completion.

## Boundaries

Route information to its proper owner. Prefer eliminating the failure or enforcing prevention in source, schema, types, tests, lint, CI, or a mandatory workflow when that can work without Agent judgment. A Lesson is the last-mile behavioral control for the judgment that remains; never use one as a substitute for an enforceable invariant.

- Reusable, judgment-dependent workspace prevention rules belong in `tasks/lessons.md`.
- Task-specific decisions, progress, results, and evidence belong in the owning task record.
- Stable workspace structure and relationships belong in `tasks/context.md`.
- Cross-workspace preferences or persistent directives belong in the applicable global rule mechanism.
- Procedures belong in an SOP or runbook.
- Speculation, secrets, duplicates, and one-off details are not stored.

Explicit requests to scan accumulated Context or Lessons history for stale deletions or cross-record consolidation belong to `$task-maintenance`; correction-driven maintenance of an individual Lesson remains here.

Routine lesson maintenance does not create a task record.

## Admission Gate

Store or retain a Lesson only when every condition holds:

1. `Reusable`: the correction prevents a class of mistakes beyond the current task.
2. `Preemptive`: an Agent can recognize the Trigger before the failure recurs.
3. `Preventive`: the Rule directly changes behavior and blocks the failure mechanism rather than patching one symptom.
4. `Verifiable`: the Check can show that the preventive control covers the relevant scope.
5. `Last-mile`: stronger mechanical enforcement does not fully remove the need for Agent judgment.
6. `Correctly routed`: Lessons is the right carrier under the boundaries above.

If a stronger control fully removes the judgment, use or propose it through the appropriate owning task and choose No-op for Lessons. If judgment remains, record only the residual behavior.

## Lesson Schema

New or materially updated records use this exact shape:

```markdown
## L-YYYYMMDD-ascii-slug — Title

### Trigger
- Concrete condition recognizable before recurrence.

### Rule
- Mandatory action or boundary that blocks the failure mechanism.

### Check
- Evidence that the preventive control covers the relevant scope.
```

- `Trigger`: state one concrete, observable condition an Agent can recognize before the same failure recurs. Do not use vague domain labels or describe only the past incident.
- `Rule`: state one mandatory action or boundary that directly blocks the failure mechanism. Do not use attitudes such as "be careful," generic reminders, or symptom-only patches.
- `Check`: state one observable, executable, or reviewable proof that the preventive control covers the relevant scope. Do not merely restate the Rule or claim that recurrence is impossible.
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

Before completion, confirm each selected `Rule` governed the work as required, then execute or review every applicable selected `Check`. If scope changed without a Change Gate query, return to the Change Gate first. A failed or unobservable applicable Check blocks completion until evidence is improved, a task-local observable Check is derived, or the user resolves the gap.

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

Apply a user's correction to the current task immediately. Then inspect related lessons and choose exactly one operation: Add, Update, Merge, Replace, Delete, or No-op. If the same failure recurs under a matching `Trigger`, treat the closed-loop control as ineffective, inspect its retrieval, `Rule`, and `Check`, and update or replace the deficient record instead of adding a duplicate.

- Choose No-op without interrupting the user when the correction is task-specific, not reusable, already covered, or fully prevented by a stronger mechanical control.
- Before every persistent Add, Update, Merge, Replace, or Delete, show the target ID, operation, and exact proposed record or diff. Obtain explicit confirmation.
- Without confirmation, leave `tasks/lessons.md` unchanged.
- After confirmation, preserve the pre-write content, apply only the approved change, and run `validate`.
- If validation fails, restore the pre-write content and report the diagnostics.
- Prefer updating one current rule over creating overlap. Remove superseded or invalidated rules rather than retaining history.

## Legacy Records

Do not bulk-migrate existing records. The query script assigns each legacy record a scan-local `legacy-<content-hash>` ID and indexes its title plus legacy Trigger and Rule bullets as retrieval cues. It never writes this ID back.

A selected legacy record without `Check` requires a temporary observable Check that proves the preventive control covers the task-relevant scope. Convert a legacy record to the current schema only when a confirmed write materially changes it; assign a new stable v1 ID then.

## Degradation and Failure

- A missing `tasks/lessons.md` means an empty rule set; continue silently.
- If the query script is unavailable or fails, disclose the degradation and manually perform the same Trigger-first scan.
- For a malformed record, inspect the raw record. Treat it as legacy only when its meaning is safe to infer; pause and ask when it may apply but remains unclear; ignore it when clearly irrelevant.
- Never auto-apply a duplicated ID.
- Show conflicts, degraded operation, validation failures, and write confirmation details in full; only successful query visibility is compact.

## Maintainer Validation

Keep the query contract, focused tests, `evals/query_cases.json`, and `evals/trigger_cases.json` aligned after changes. Run the script self-test, authorized focused task contract tests, the built-in `$skill-quality` gate against this package, and `git diff --check`.

Quality failures block completion. Review warnings, but do not remove or distort core workflow guidance merely to satisfy the initial-load budget.
