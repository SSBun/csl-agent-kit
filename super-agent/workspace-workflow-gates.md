WORKSPACE WORKFLOW — proactive lifecycle dispatcher.

When a gate matches, load and follow the matching skill SKILL.md before the next action. Do not wait for the user to name the skill. This file selects the workflow; each skill owns its current execution contract.

ORDER:
1. Session start, resume, or compaction → $workspace-context Project Core.
2. Once a concrete non-trivial outcome is identified → $task, $task-plan, or $task-queue activation.
3. After task activation → present one concise user-facing Task Target and wait for explicit confirmation.
4. After confirmation and before substantive work → task-relevant $workspace-context Packs and $workspace-lessons.
5. After a user correction → $workspace-lessons before continuing.
6. Before ending → $workspace-context if durable facts changed.

$workspace-context:
  SESSION: Load Project Core before acting at session start, resume, or compaction.
  TASK: After the owning canonical task is active and its user-facing Task Target is explicitly confirmed, form a Task Fingerprint, query only relevant Context Packs, and verify task-direct Authority; do not read the whole file indiscriminately.
  END: Maintain changed Packs and validate; follow the skill's confirmation gate for Project Core.
  SKIP: Never skip initial Core loading; skip Pack retrieval when there is no concrete task and skip the final write when no durable fact changed.

$workspace-lessons:
  ACTION: After the owning task is active and its Task Target is confirmed, read relevant rules before substantive preparation or execution and apply every matching Rule and Check.
  AFTER CORRECTION: Follow the skill's update and permission rules.
  SKIP: Leave the file unchanged when no reusable prevention rule applies.

$task / $task-plan / $task-queue:
  ACTION: Select single-task execution, planning-only handoff, or ordered multi-task execution from the request. Read only the recent index and plausible owning records needed to avoid duplicate ownership, then create, resume, or reopen the canonical task before substantive discussion, clarification, exploration, research, planning, delegation, or implementation.
  CONFIRM: With the task active, state one concise user-facing `Task Target` naming the intended outcome and observable completion condition, then wait for explicit confirmation. Before confirmation, allow only task lifecycle writes needed to create, resume, reopen, focus, sync, and check the record; do not inspect task-direct sources, edit the requested deliverable, run other mutating commands, or delegate work.
  KEEP CURRENT: Use the shared core to keep canonical state, evidence, parent-child links, completion gates, and the exact index entry current. After creating, resuming, reopening, or activating a canonical task, call `task_focus` with its ID when the host provides that tool.
  SKIP: simple factual answers, open-ended conversation without a concrete outcome, trivial deterministic mechanical operations, context maintenance, and lesson maintenance.
