---
name: task-queue
description: Decompose and run a multi-task outcome as one Queue parent with ordered canonical child tasks, sequential resume, stop conditions, and a final integration gate. Use when the user asks to deploy, manage, or autonomously execute multiple dependent or independently verifiable tasks. Do not use for one task or planning-only work.
---

# Task Queue

Coordinate multiple canonical tasks through the current host Agent. This is host-native interactive execution: use the host's existing tools and subagents, never nested `codex exec`, `pi --print`, `pi-worker-*`, a daemon, watchdog, or unattended supervisor.

## Required Runtime Protocol

Resolve the collection root as the parent of this skill directory. Before forming, presenting, or accepting a Task Target, read `<collection-root>/csl-tasks/shared/protocols/task-target-alignment.md` in full and treat it as the authoritative detailed alignment contract. Read it again after resume or compaction when it is no longer present in context. If it is unavailable, stop before substantive work and report the missing runtime dependency.

This skill owns Queue-parent activation, the integration Target meaning, permitted lifecycle writes, and the post-alignment Queue workflow. The shared protocol owns all Task Target alignment semantics. Use `node <collection-root>/csl-tasks/shared/scripts/csl-tasks.js --workspace <workspace> ...` as the only task-state core.

## Build the Task Graph

1. Load Project Core, then read only the newest task index entries and plausible candidate owning records needed to avoid duplicate ownership.
2. As soon as the request establishes a concrete multi-task outcome, create or resume one Queue parent with an initial integration Target:
   `create <parent-id> --title <title> --kind queue --target "T1: <integrated outcome>"`.
   Resume the parent and call the host's task-focus mechanism when available: emit the real `task_focus(<parent-id>)` tool call itself—not merely plan it—in the same reply as the `resume`, and disclose any binding failure. If no honest integration Target can yet be stated, ask one focused question and create the parent immediately after the answer.
3. Apply the shared Task Target Alignment Protocol to the active parent. For this workflow, the conversational Target means the parent integration outcome and observable completion condition; before alignment, the permitted lifecycle writes are create, resume, focus, sync, and check. The gate follows activation and precedes task-direct source inspection, graph decomposition, or substantive preparation; only the protocol's focused target-forming clarification may occur within it.
4. After the protocol aligns the current Target, query task-relevant Context Packs, read relevant lessons and directly relevant sources, then clarify only user-owned decisions that block a correct decomposition.
5. Refine the parent's integration Targets and create a child only for an independently acceptable or independently blocked outcome. Each child has its own observable Targets and complete `task` lifecycle. Give the Queue parent an integration title and every child a distinct stage-specific title; parent, child, and sibling titles in one Queue must not normalize to the same text.
6. Link children in execution order with `link <parent-id> <child-id>`. The core maintains reciprocal Parent/Children records, rejects multiple parents, cycles, and same-Queue title collisions, and preserves order. Reopen a Completed child before changing its relationship; an identical reciprocal link is a no-op and must not invalidate either record's evidence.
7. Add the parent's current Scope and Plan. The Plan must name every child ID in execution order so it is the delegation source, then `sync` and `check` every touched record.

Apply `task`'s Task Artifacts contract to each owning parent or child: the shared core maintains its directory link when that directory exists, refreshing it on lifecycle writes without creating empty directories or backfilling untouched records.

Do not duplicate a child's Target, Plan, Result, or status in the parent. The parent Plan links or names children and states dependencies only.

## Optional Topic Membership

Apply `task`'s optional Topic contract independently to an associated parent and each associated child. Topic membership does not create Queue links, order all members, or permit cross-workspace Parent/Children. Propose binding new children to the parent's Topic when their scope fits; do not silently reassign existing tasks or assume membership was inherited. Each task pins its applicable specification revision and checks it before review/verification/completion. The parent integration gate also checks its own binding and relevant child evidence against the currently accepted integration requirements. Finishing the Queue never archives the Topic; later bugs and reviews may create new tasks under it.

## Sequential Execution

1. Confirm the parent is In Progress.
2. Run `next <parent-id>` to select the first child not Completed. The ordered child list is the resume cursor; do not create another cursor file or field.
3. Resume and execute that child under the full `task` lifecycle, including R0/R1/R2 classification, the mandatory `task-review` loop for R2 or explicit ordinary review, Result, final verification, completion, and index check. The accepted parent Target and current Plan delegate the child alignment: do not display another child checkpoint. When a subagent executes it, provide the main task ID, child task ID, exact delegated outcome, done conditions, and scope in the dispatch.
4. Run `next` again only after the current child completes.
5. Stop and return to the main session when the current child is Blocked or Cancelled, verification fails, the user must decide, an S1 action boundary is reached, or a material child-distribution graph change is required. Re-align the parent before executing a changed graph; do not let a child prompt the user or skip ahead.

On resume, inspect the parent and the task returned by `next`; verify workspace reality before trusting old evidence. Reopening a completed child requires an active parent: reopen a Completed parent first. Reopening the child invalidates the active parent's assessment, terminal review and Verification evidence and returns an In Review parent to In Progress, so repeat the final integration gate after the child completes again. A cancelled parent is a reversible soft stop and does not implicitly cancel or delete children. Resume explicitly when the user continues.

## Parent Final Gate

Completed children do not prove the integrated outcome. After `next` returns no child:

1. Verify the parent's own integration Targets against the assembled deliverable. Apply `task`'s Task Summary contract to parent-owned integration changes before assessment, then `sync` and `check`; do not copy child summaries into the parent or claim child-owned changes as parent-owned. If the parent only coordinated children, state that it made no code or component changes. Each child's summary is maintained by its own `task` completion flow.
2. Record parent Result evidence and preliminary integration checks, then read [Task Review Grading](../csl-tasks/shared/protocols/task-review-grading.md) in full and record the parent's own assessment using `assess-review`. No parent-owned deliverable changes is R0; simple, low-risk, sufficiently verified parent-owned changes may be R1; complex, high-risk or materially uncertain changes are R2. R0/R1 use `skipped` only without explicit or existing review obligations. R2 or explicit ordinary review uses `required` → In Review → `task-review` → `passed`. An explicitly requested adversarial review of a no-file parent or R1 parent uses `required` → In Review → `approved` without mandatory `task-review`; R2 first records `passed`, then upgrades to `approved` with both outcomes. Never downgrade due to Reviewer failure.
3. After the final review-gate write, compare the assessment snapshot and confirm any reviewed scope still matches the assembled deliverable, rerun proportionate final integration checks, and record `verify <parent-id> passed --evidence <observation>` only when they pass. Every review-gate write clears prior Verification; assessment writes do too. Preliminary checks cannot replace this final record. Scope drift returns to self-check, assessment and any required fresh review; failed verification Blocks completion.
4. Run `complete <parent-id>`. The core rejects completion when a child is unfinished or the parent lacks its own evidence.
5. Run `check <parent-id>` and `validate`.

Apply `task`'s Review Reports persistence contract to every parent or child `task-review` pass: save and index the report under that owning task's ID before the terminal gate, never under a sibling or a shared parent directory. Keep the persistent report index separate from the temporary finding ledger.

Apply the mandatory task-review stall guard independently to each child and to any parent-owned deliverable review. A stalled child or parent becomes Blocked and stops Queue progression until its recorded unblock condition occurs.

Keep the workflow interactive. If the session must pause, leave canonical status and evidence sufficient for a later Codex or Pi Agent to resume deterministically. Routing fixtures are in `evals/`.
