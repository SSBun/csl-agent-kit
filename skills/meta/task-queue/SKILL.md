---
name: task-queue
description: Decompose and run a multi-task outcome as one Queue parent with ordered canonical child tasks, sequential resume, stop conditions, and a final integration gate. Use when the user asks to deploy, manage, or autonomously execute multiple dependent or independently verifiable tasks. Do not use for one task or planning-only work.
---

# Task Queue

Coordinate multiple canonical tasks through the current host Agent. This is host-native interactive execution: use the host's existing tools and subagents, never nested `codex exec`, `pi --print`, `pi-worker-*`, a daemon, watchdog, or unattended supervisor.

Resolve the collection root as the parent of this skill directory. Use `node <collection-root>/csl-tasks/shared/scripts/csl-tasks.js --workspace <workspace> ...` as the only task-state core.

## Build the Task Graph

1. Load Project Core, then read only the newest task index entries and plausible candidate owning records needed to avoid duplicate ownership.
2. As soon as the request establishes a concrete multi-task outcome, create or resume one Queue parent with an initial integration Target:
   `create <parent-id> --title <title> --kind queue --target "T1: <integrated outcome>"`.
   Resume the parent and call the host's task-focus mechanism when available. If no honest integration Target can yet be stated, ask one focused question and create the parent immediately after the answer.
3. With the parent active, first check whether the originating top-level user request's final non-empty line is exactly the case-sensitive marker `TASK_GO`. If so, treat it as explicit Task Target confirmation for this request, exclude the marker from the requested outcome, skip the textual confirmation, and continue to step 4. This authorization is one-request only and does not resolve ambiguity or bypass any other required confirmation. Otherwise, state one line in the exact format `**Task Target:** <integrated outcome and observable completion condition>`, then stop and wait for explicit textual confirmation. Before confirmation, allow only parent task lifecycle writes needed to create, resume, focus, sync, and check the record; do not inspect task-direct sources, decompose the graph, run other mutating commands, or delegate work.
4. After confirmation, query task-relevant Context Packs, read relevant lessons and directly relevant sources, then clarify only user-owned decisions that block a correct decomposition.
5. Refine the parent's integration Targets and create a child only for an independently acceptable or independently blocked outcome. Each child has its own observable Targets and complete `task` lifecycle.
6. Link children in execution order with `link <parent-id> <child-id>`. The core maintains reciprocal Parent/Children records, rejects multiple parents and cycles, and preserves order.
7. Add the parent's current Scope and Plan, then `sync` and `check` every touched record.

Do not duplicate a child's Target, Plan, Result, or status in the parent. The parent Plan links or names children and states dependencies only.

## Sequential Execution

1. Confirm the parent is In Progress.
2. Run `next <parent-id>` to select the first child not Completed. The ordered child list is the resume cursor; do not create another cursor file or field.
3. Resume and execute that child under the full `task` workflow, including Result, review, verification, completion, and index check.
4. Run `next` again only after the current child completes.
5. Stop when the current child is Blocked or Cancelled, verification fails, the user must decide, or a material graph change is required. Do not skip ahead.

On resume, inspect the parent and the task returned by `next`; verify workspace reality before trusting old evidence. A cancelled parent is a reversible soft stop and does not implicitly cancel or delete children. Resume explicitly when the user continues.

## Parent Final Gate

Completed children do not prove the integrated outcome. After `next` returns no child:

1. Verify the parent's own integration Targets against the assembled deliverable.
2. Record parent Result evidence, review gate, and host-native integration verification.
3. Run `complete <parent-id>`. The core rejects completion when a child is unfinished or the parent lacks its own evidence.
4. Run `check <parent-id>` and `validate`.

Keep the workflow interactive. If the session must pause, leave canonical status and evidence sufficient for a later Codex or Pi Agent to resume deterministically. Routing fixtures are in `evals/`.
