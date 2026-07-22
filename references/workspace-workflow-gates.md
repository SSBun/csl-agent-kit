WORKSPACE WORKFLOW — mandatory lifecycle gates. Load and follow the matching skill SKILL.md before acting.

$workspace-maintain-context:
  WHEN: session start, resume, compaction, before ending work.
  READ: tasks/context.md now if it exists; verify entries before relying on them.
  WRITE: before ending, only when durable workspace facts changed.
  SKIP: never skip the initial read; skip the write if nothing durable changed.

$workspace-capture-lessons:
  WHEN: before non-trivial work, and after a user correction.
  READ: relevant rules from tasks/lessons.md before starting work; apply each Rule and Check.
  WRITE: after a user correction reveals a reusable mistake; ask permission before modifying existing entries.
  SKIP: if no reusable prevention rule applies.

$workspace-manage-task:
  WHEN: before non-trivial work that changes a deliverable, and while scope or status changes.
  READ: the owning task file first if one exists.
  WRITE: create or update tasks/todo/<slug>.md and the tasks/todo.md index.
  SKIP: read-only answers, trivial mechanical operations, context/lesson maintenance.
