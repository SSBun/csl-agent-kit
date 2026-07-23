WORKSPACE WORKFLOW — proactive lifecycle dispatcher.

When a gate matches, load and follow the matching skill SKILL.md before the next action. Do not wait for the user to name the skill. This file selects the workflow; each skill owns its current execution contract.

ORDER:
1. Session start, resume, or compaction → $workspace-maintain-context.
2. Before non-trivial work → $workspace-capture-lessons.
3. Before non-trivial work changes a deliverable → $workspace-manage-task.
4. After a user correction → $workspace-capture-lessons before continuing.
5. Before ending → $workspace-maintain-context if durable facts changed.

$workspace-maintain-context:
  ACTION: Read tasks/context.md and verify relevant entries against the workspace.
  SKIP: Never skip initial orientation; skip the final write when no durable fact changed.

$workspace-capture-lessons:
  ACTION: Read relevant rules and apply every matching Rule and Check.
  AFTER CORRECTION: Follow the skill's update and permission rules.
  SKIP: Leave the file unchanged when no reusable prevention rule applies.

$workspace-manage-task:
  ACTION: Read the owning task first; create or update its task file and exact index entry before implementation.
  KEEP CURRENT: Update it as scope, status, or results change.
  SKIP: read-only answers, trivial mechanical operations, context/lesson maintenance.
