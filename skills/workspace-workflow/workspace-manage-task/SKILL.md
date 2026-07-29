---
name: workspace-manage-task
description: Manage workspace task records for non-trivial deliverable changes, including scope, evidence, status, and user-requested adversarial review. Excludes read-only answers, trivial mechanical work, context maintenance, and correction lessons.
---

# Manage Workspace Tasks

## Activation Boundary

- Create or update a task before non-trivial work that changes a deliverable.
- Reuse the existing task that owns the requested outcome.
- Skip task records for read-only answers and simple operations with direct deterministic verification.
- Do not create a task solely to host an adversarial-review report.

## Record Ownership

- Keep `tasks/todo.md` as a newest-first index containing only title, status, and task link.
- Keep `tasks/todo/<task-slug>.md` as the canonical task record.
- Modify only the owning task file and its exact index entry.
- Preserve completed task files and unrelated task state.

## Task Contract

- Give the task a result-oriented title and a local-time status formatted as `Status (YYYY-MM-DD HH:MM)`.
- Create `Target` and `Plan` when the task starts.
- Add `Scope`, `Block`, `Result`, and review details only when their lifecycle conditions apply.
- Do not create an independent `Checklist`; task-specific completion conditions belong in `Target`, while shared verification and review gates belong in this workflow.
- Do not add placeholders or fields without substantive content.

### Scope

- Add `Scope` only when an adjacent boundary is easy to include accidentally, the user excludes work explicitly, or expansion materially changes cost or risk.
- Record included and excluded boundaries without prescribing implementation.
- Update Scope before expanding the affected outcome.

### Target

- Use the task's only checkbox list here, with stable IDs such as `T1`, `T2`, and `T3`.
- Require at least one observable, pass-or-fail delivery condition.
- Keep one result, compatibility requirement, preserved behavior, risk boundary, or side-effect boundary per item.
- Do not include implementation steps, commands, shared workflow gates, or review status.
- Check a Target only when its current evidence is recorded under the same ID in `Result`; update both in the same change.

### Plan

- Use an ordered list without checkboxes.
- Keep only the current necessary result nodes, dependencies, and next actions.
- Revise the Plan as the work changes; do not preserve completed steps as a progress log.
- Do not prescribe algorithms, files, functions, types, or call paths unless the user requires them.
- Do not duplicate shared verification or adversarial-review gates.

### Result

- Add `Result` only after evidence exists.
- Map every Target ID to current evidence that states the checked object, method, and observed result.
- A shared check may support multiple Targets, but name each covered ID explicitly.
- Record the delivered artifact and only material scope, approach, or verification deviations.
- Before completion, record `Review gate: Required — <explicit user request>` or `Review gate: Skipped — no explicit user request`.
- After an actual review, append the decision and report link; never prewrite approval.

### Block

- Add `Block` only while the task status is `Blocked`.
- Record `Reason` and an observable `Unblock when` condition.
- Remove the section when work resumes; preserve only effects that materially changed the Result.

## Subtasks

- Create a separate canonical task only for work with an independent deliverable, blocking condition, or review boundary.
- Link the subtask from the parent Plan without copying its Target, Plan, status, or Result.
- A completed subtask does not prove the parent Target; verify the parent independently.

## Review Gate

Set `Required` only when the user explicitly requests `$adversarial-review`, a two-agent Reviewer–Editor loop, or independent Reviewer approval for the current task. Otherwise set `Skipped`.

- Do not infer a review requirement from risk, criticality, complexity, verification gaps, another rule or workflow, or Agent judgment.
- Ordinary one-pass review, verification, testing, proofreading, or self-review requests do not request `$adversarial-review`.
- Re-evaluate only when the user's review request changes. Do not ask whether review is wanted merely because a task appears risky or difficult.

Keep `evals/review_gate_cases.json` aligned with this gate.

## Lifecycle

- Use `Pending`, `In Progress`, `In Review`, `Completed`, or `Blocked`, followed by the current local date and 24-hour time in `YYYY-MM-DD HH:MM` format.
- For a small follow-up that extends a completed task's existing outcome, reopen its canonical task instead of creating a new file: append the next Target ID, revise the Plan, set `In Progress`, update its exact index entry, and re-evaluate the Review Gate from the current user request. Use a separate task only when the Subtasks boundary applies.
- Before `In Progress`, require at least one valid Target.
- Before completion, require every Target to be checked and mapped to current Result evidence, proportionate verification to pass, and the Review gate to be recorded.
- For `Required`, set `In Review`, invoke `$adversarial-review`, and complete only after recorded `APPROVED`.
- For `Skipped`, do not enter `In Review`; set `Completed` after the shared completion requirements pass.
- If review changes the artifact, return to `In Progress`, uncheck affected Targets, replace invalid evidence, and review again.
- Keep the complete status text identical in the canonical task and index, updating both in the same change.
- When they disagree, treat the canonical task as authoritative and repair the index before considering the transition complete.

## Adoption

- Apply this contract to new tasks and reopened scope.
- Do not retrofit untouched completed history.

## Maintainer Validation

- Run focused contract tests, routing evaluation when the description changes, OpenAI validation, and Yao audit after edits.
- The only acceptable non-blocking failure is Yao `Estimated initial-load tokens exceed budget` against its 1000-token initial-load budget.
- Syntax/frontmatter, lint, governance, every other resource-boundary check, applicable routing evaluation, OpenAI validation, and tests remain blocking.
- Never delete, distort, or split core operational guidance merely to satisfy the initial-load budget.
