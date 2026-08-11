WORKSPACE WORKFLOW — proactive lifecycle dispatcher.

When a gate matches, load and follow the matching skill SKILL.md before the next action. Do not wait for the user to name the skill. This file selects the workflow; each skill owns its current execution contract.

ORDER:
1. Session start, resume, or compaction → $workspace-context.
2. Before non-trivial work → $workspace-lessons.
3. Before non-trivial work changes a deliverable → $csl-task, $csl-task-plan, or $csl-task-auto according to the requested execution mode.
4. After a user correction → $workspace-lessons before continuing.
5. Before ending → $workspace-context if durable facts changed.

$workspace-context:
  SESSION: Load Project Core before acting at session start, resume, or compaction.
  TASK: After forming a Task Fingerprint, query only relevant Context Packs and verify task-direct Authority; do not read the whole file indiscriminately.
  END: Maintain changed Packs and validate; follow the skill's confirmation gate for Project Core.
  SKIP: Never skip initial Core loading; skip Pack retrieval when there is no concrete task and skip the final write when no durable fact changed.

$workspace-lessons:
  ACTION: Read relevant rules and apply every matching Rule and Check.
  AFTER CORRECTION: Follow the skill's update and permission rules.
  SKIP: Leave the file unchanged when no reusable prevention rule applies.

$csl-task / $csl-task-plan / $csl-task-auto:
  ACTION: Read the owning task first; select single-task execution, planning-only handoff, or ordered multi-task execution, then follow that skill before changing the deliverable.
  KEEP CURRENT: Use the shared core to keep canonical state, evidence, parent-child links, completion gates, and the exact index entry current.
  SKIP: read-only answers, trivial mechanical operations, context/lesson maintenance.
