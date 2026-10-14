---
name: topic
description: Create, find, resume, update, link tasks to, or archive a persistent maintenance topic with a shared current specification. Use when the user names a long-lived topic or asks related implementation, improvement, bug-fix, or review tasks to share requirements. Not limited to multi-platform work. Do not use for an unrelated standalone task or infer membership from similar filenames.
---

# Topic

A Topic owns a bounded, persistent specification and references to related tasks. It is not a Task Kind, Queue parent, progress cache, execution authorization, or conversation archive. Tasks may remain independent. Completing all members never closes a Topic.

## Entry and Ownership

1. Load Project Core. Resolve an explicitly named Topic or the current task's exact Topic reference. Ambiguous names or cross-repository owner choices require a focused question; never scan unregistered repositories.
2. Read only the selected Topic's scope/specification and relevant task references before forming a Task Target. This narrow read is governed by [Task Target Alignment](../csl-tasks/shared/protocols/task-target-alignment.md); it does not permit implementation exploration before alignment.
3. For a concrete change, activate and focus one owning `task-plan` or `task` record before substantive work. Internal Topic CLI operations do not each create another task. A create-topic task attaches after creating the Topic. Read-only listing/showing needs no mutation task.
4. Apply the owning task's full alignment and authorization gates. Topic state or a stored statement of approval never replaces recoverable user acceptance. Planning does not authorize implementation; effective delegation retains its existing boundary.
5. For “continue Topic”, reload its specification and read relevant member states. Resume the clearly requested task; otherwise ask which outcome to pursue. Do not automatically execute every member or select the first unfinished task.

Read [storage and commands](references/topic-contract.md) before mutations. Use the existing shared CLI only; do not hand-edit digests, revisions, associations, or lifecycle fields.

## Maintenance Workflow

- Create a Draft from the user's bounded scope and current specification; activate only after the user accepts the specification. Draft supports planning, not automatic product implementation.
- Add subsequent implementation, improvement, bug-fix and review tasks to the same Topic when they use its specification. One task has at most one Topic; no Topic is a fully supported default.
- Treat a new bug or follow-up review as a new outcome unless it directly corrects/completes/re-verifies the same task outcome under `task`'s reopen rules. Retain old completion evidence. Reviews remain feedback-only unless remediation is authorized.
- Keep Scope, Spec Context and shared Decisions current. Do not copy member progress, Results or Task Summaries into the Topic. Use stable requirement identifiers where tasks share acceptance clauses.
- For an implementation defect, fix the implementation to the specification. A change to common behavior requires impact analysis and the applicable user goal/decision confirmation before `update-spec`; do not weaken the specification to make a task pass.
- A task modifying the Topic itself uses maintenance mode. It explicitly adopts the final revision before its own self-check and review. This resolves self-created staleness, not authorization or review obligations.
- Compare adopted and current revisions at start/resume, review handoff and terminal gates. Changes require explicit impact evidence and adoption; material changes also require realignment. Preserve Required review obligations. Unavailable sources, corrupt snapshots, unresolved dependencies and incomplete links block dependent work, not historical read-only inspection.
- Draft/Archived can be the intended result of a maintenance task. Implementation mode requires Active. Maintenance mode is not an escape hatch for product implementation.
- Archive only on an explicit request to stop maintenance. Resolve active/inaccessible member impact first; never cancel members automatically. Restore explicitly before new work. A release or milestone may finish while the Topic remains Active.

## Association and Cross-Repository Boundaries

Use one association operation to update the task's authoritative binding and the Topic's backlink. Read current versions immediately before writing. `--allow-cross-workspace` is an attestation of prior explicit permission, not a permission prompt or a substitute for it. Resolve both repositories through confirmed project-index mappings, and verify their repository identities. Do not install mappings, clone, upload, or silently fall back to guessed paths.

A partial write must be reported. Stop terminal gates until the exact relationship is repaired. `repair` uses the task's authoritative binding; it must not infer new membership or inspect unrelated repositories. Completed task binding changes require reopen and refreshed evidence. Ordinary source links may refer to history without claiming membership.

## Completion

For the owning task, preserve normal R0/R1/R2 self-check, review and verification. Check the specific Topic, the binding and adopted revision, and the task/index before completion. Topic listing remains separate from the task index; no empty Topic storage is created for standalone tasks.

Validate new/changed package resources with `skill-quality`. Run project tests only with explicit current authorization. Routing examples are in `evals/trigger_cases.json`.
