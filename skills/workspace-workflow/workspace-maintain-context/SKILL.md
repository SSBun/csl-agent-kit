---
name: workspace-maintain-context
description: Maintain `tasks/context.md` as the compact, durable map of the current workspace. Use at session start, after resume or compaction, and before ending work when confirmed workspace structure, component relationships, domain terms, or conventions changed. Do not use for task progress, correction lessons, speculation, secrets, or one-off details.
---

# Maintain Workspace Context

## Workflow

1. Treat the session-start directory as the workspace root.
2. Read `tasks/context.md` at session start, after resume, or after compaction.
3. Verify task-relevant entries against the workspace before relying on them.
4. Before ending work, update the file only when durable workspace facts changed.

## Store

- Workspace structure and component responsibilities.
- Stable relationships between components or systems.
- Domain terms needed to interpret the workspace.
- Workspace-level decisions and conventions.

## Exclude

- Task progress, plans, results, and review history; keep them in the owning task file.
- Reusable correction rules; keep them in `tasks/lessons.md`.
- Speculation, temporary observations, secrets, and global preferences.
- Facts already obvious from a quick task-local read.

## Update Rules

- Add newly confirmed facts at the top of their list.
- Update or remove superseded facts instead of preserving conflicting versions.
- Keep entries compact and evidence-based.
- Investigate material conflicts; ask one focused question only when evidence cannot resolve them.
- Routine context maintenance does not create a task record.
