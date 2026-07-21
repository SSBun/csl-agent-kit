---
name: workspace-capture-lessons
description: Apply relevant `tasks/lessons.md` rules before work and maintain the file after a user correction yields a reusable rule that prevents the same agent mistake across future tasks. Use to read, add, merge, refine, replace, or remove durable correction lessons. Do not use for ordinary preferences, one-off task facts, task progress, workspace context, or secrets.
---

# Capture Workspace Lessons

## Workflow

1. Before work, read only the lessons relevant to the current workspace and task.
2. Apply each relevant `Rule` and perform its `Check` when present while completing the work.
3. After a user correction, inspect related entries before deciding whether the current rule set needs an addition, update, replacement, deletion, or no change.
4. Add a lesson at the top only when no existing entry already covers the reusable prevention rule; a user correction that requires a new independent entry needs no second write confirmation.
5. When a new lesson overlaps, conflicts with, supersedes, or invalidates an existing entry, propose the smallest update, replacement, or deletion that leaves one current rule.
6. Before updating, merging, replacing, or deleting an existing entry, show the exact proposed change and ask the user for explicit write permission.
7. If permission is not granted, leave `tasks/lessons.md` unchanged.
8. After confirmation, apply only the approved existing-entry change and put a materially revised lesson at the top.

## Lesson Contract

- Use a dated, behavior-oriented heading.
- Use only `Trigger`, `Rule`, and `Check`; omit narrative fields such as `Why`.
- `Trigger`: list conditions the agent can observe before making the mistake.
- `Rule`: list the required actions and applicable boundaries.
- `Check`: list observable checks that prove the rule was followed before completion.
- Give each field at least one list item.
- Keep one condition, action, boundary, or check per list item.
- Keep each lesson compact, actionable, and valid across future tasks in the workspace.

## Exclude

- One-off task facts, decisions, progress, and results; keep them in the owning task file.
- Stable workspace structure or conventions; keep them in `tasks/context.md`.
- Ordinary preferences that do not correct a reusable failure pattern.
- Speculation, secrets, and duplicated or superseded rules.

## Update Rules

- Treat `tasks/lessons.md` as the current effective rule set, not an append-only record.
- Prefer updating an existing lesson over adding a near-duplicate or conflicting entry.
- Remove superseded or invalidated lessons instead of preserving them as history.
- Do not bulk-migrate legacy entries; convert one to the current contract only when an approved update touches it.
- Do not create a task record only to maintain lessons.
- If no reusable prevention rule exists, leave `tasks/lessons.md` unchanged.
