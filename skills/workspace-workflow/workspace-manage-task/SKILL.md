---
name: workspace-manage-task
description: Manage `tasks/todo.md` and canonical `tasks/todo/*.md` records for non-trivial work that changes a deliverable. Use before implementation, while scope or status changes, when recording results, and when handing the completed artifact to adversarial review. Do not use for read-only answers, trivial mechanical operations, routine context maintenance, or correction lessons.
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

- Give the task a result-oriented title and dated status.
- Use `Scope`, `Target`, `Plan`, and `Checklist` as the four execution sections.
- Write every section as a list with at least two non-redundant, substantive items.
- Keep one fact, result, node, or check per item.
- Do not add placeholders or create a task when the work is too small to support substantive entries.

### Scope

- Record the object, confirmed current state, included outcomes, excluded outcomes, and expansion conditions as needed.
- Constrain the delivery boundary without prescribing internal implementation.
- Update Scope before expanding the affected outcome.

### Target

- Define observable delivery states, compatibility requirements, preserved behavior, and side-effect boundaries.
- Prefer user-visible behavior; describe structure, files, generated artifacts, migrations, internal APIs, or rules when they are explicit deliverables.
- Do not include implementation steps or verification commands.

### Plan

- Use an ordered list of task-specific result nodes, dependencies, and gates.
- Do not prescribe algorithms, files, functions, types, or call paths unless the user requires them.
- End with the adversarial-review handoff.

### Checklist

- Use checkboxes with independent pass-or-fail conditions.
- Verify Target at stable behavior or artifact boundaries.
- State concrete operations and expected results when known.
- Do not include review status or prescribe a test framework, layer, or file shape.

## Lifecycle

- Use `Pending`, `In Progress`, `In Review`, `Completed`, or `Blocked`, with the current date.
- After implementation changes stop, rerun affected checks and mark Checklist items from current evidence.
- When Checklist passes, append one `Result` list with delivery, verification, and any actual deviation; set `In Review`.
- Invoke `$adversarial-review` on the final artifact and available diff.
- If review changes the artifact, return to `In Progress`, update the same Result, rerun affected checks, and review again.
- After `APPROVED`, append the decision and report link to Result, then set `Completed`.
- Keep the index status synchronized with the canonical task file.
