---
name: task-queue
description: Decompose and run a multi-task outcome as one Queue parent with ordered canonical child tasks, sequential resume, stop conditions, and a final integration gate. Use when the user asks to deploy, manage, or autonomously execute multiple dependent or independently verifiable tasks. Do not use for one task or planning-only work.
---

# Task Queue

Coordinate multiple canonical tasks through the current host Agent. This is host-native interactive execution: use the host's existing tools and subagents, never nested `codex exec`, `pi --print`, `pi-worker-*`, a daemon, watchdog, or unattended supervisor.

Resolve the collection root as the parent of this skill directory. Use `node <collection-root>/shared/scripts/csl-tasks.js --workspace <workspace> ...` as the only task-state core.

## Build the Task Graph

1. Read context, relevant lessons, the task index, and directly relevant sources.
2. Clarify only user-owned decisions that block a correct decomposition.
3. Create one Queue parent with integration-level Targets:
   `create <parent-id> --title <title> --kind queue --target "T1: <integrated outcome>"`.
4. Create a child only for an independently acceptable or independently blocked outcome. Each child has its own observable Targets and complete `task` lifecycle.
5. Link children in execution order with `link <parent-id> <child-id>`. The core maintains reciprocal Parent/Children records, rejects multiple parents and cycles, and preserves order.
6. Add the parent's current Scope and Plan, then `sync` and `check` every touched record.

Do not duplicate a child's Target, Plan, Result, or status in the parent. The parent Plan links or names children and states dependencies only.

## Sequential Execution

1. Resume the parent.
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
