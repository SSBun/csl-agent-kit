---
name: workspace-manage-task
description: Manage `tasks/todo.md` and canonical `tasks/todo/*.md` records for non-trivial work that changes a deliverable. Use before implementation, while scope or status changes, when recording evidence, and when handing the completed artifact to adversarial review. Do not use for read-only answers, trivial mechanical operations, routine context maintenance, or correction lessons.
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
- After review, append the actual decision and report link; never prewrite approval.

### Block

- Add `Block` only while the task status is `Blocked`.
- Record `Reason` and an observable `Unblock when` condition.
- Remove the section when work resumes; preserve only effects that materially changed the Result.

## Subtasks

- Create a separate canonical task only for work with an independent deliverable, blocking condition, or review boundary.
- Link the subtask from the parent Plan without copying its Target, Plan, status, or Result.
- A completed subtask does not prove the parent Target; verify the parent independently.

## Lifecycle

- Use `Pending`, `In Progress`, `In Review`, `Completed`, or `Blocked`, followed by the current local date and 24-hour time in `YYYY-MM-DD HH:MM` format.
- Before `In Progress`, require at least one valid Target.
- Before `In Review`, require every Target to be checked and mapped to current Result evidence.
- Invoke `$adversarial-review` on the final artifact and available diff.
- If review changes the artifact, return to `In Progress`, uncheck affected Targets, replace invalid evidence, and review again.
- After `APPROVED`, append the decision and report link to Result, then set `Completed`.
- Keep the complete status text identical in the canonical task and index, updating both in the same change.
- When they disagree, treat the canonical task as authoritative and repair the index before considering the transition complete.

## Adoption

- Apply this contract to the next new task and later tasks.
- Do not retrofit the current task or untouched completed history.
- Apply the current contract when a completed task is reopened for changed scope.
