---
name: task-plan
description: Research and prepare an implementation-ready canonical task plan without changing the requested deliverable. Use when the user asks to plan, investigate before implementation, resolve requirements, or create a decisions-only handoff for later execution. Do not use for implementation or autonomous multi-task execution.
---

# Task Plan

Produce an implementation-ready task record while keeping the requested deliverable read-only. Writing `tasks/tasks.md` and its canonical task record is allowed; product code, documents, configuration, and other requested deliverables are not.

Use the host Agent's existing read, search, research, shell, and subagent capabilities. Never invoke nested Codex/Pi CLIs or build a host adapter.

## Required Runtime Protocol

Resolve the collection root as the parent of this skill directory. Before forming, presenting, or accepting a Task Target, read `<collection-root>/csl-tasks/shared/protocols/task-target-alignment.md` in full and treat it as the authoritative detailed alignment contract. Read it again after resume or compaction when it is no longer present in context. If it is unavailable, stop before substantive work and report the missing runtime dependency.

This skill owns planning-task activation, the planned-task Target meaning, permitted lifecycle writes, and the post-alignment planning workflow. The shared protocol owns all Task Target alignment semantics. Use `node <collection-root>/csl-tasks/shared/scripts/csl-tasks.js --workspace <workspace> ...` for task persistence.

## Workflow

1. Load Project Core, then read only the newest task index entries and plausible candidate owning records needed to avoid duplicate ownership.
2. As soon as the request establishes a concrete task to plan, create a Pending plan record with `create <id> --title <title> --kind plan` and initial observable `--target "Tn: ..."` conditions for the planned task's eventual result when the request supports them. The Target describes the result to be implemented, not merely the existence of a plan. If the only concrete outcome is the planning artifact itself, target it honestly; a later implementation outcome will require its own Target. Call the host's task-focus mechanism when available: emit the real `task_focus(<id>)` tool call itself—not merely plan it—in the same reply as the `create`, and disclose any binding failure. If no honest Target can yet be stated, ask one focused question and create the record immediately after the answer.
3. Apply the shared Task Target Alignment Protocol to the active plan record. For this workflow, the Target means the planned task's eventual outcome and observable acceptance conditions, while the current authorized work is exploration-only. Use `continue_exploration` for an equivalent ready Target and begin research without displaying a confirmation block or waiting for generic Target acceptance. Retain focused questions for blocking user decisions, commitment-difference checks and explicit user-requested holds. Before this classification, the permitted lifecycle writes are create, focus, sync, and check. Planning and task-record writes never authorize implementation or create accepted-target evidence.
4. After the protocol aligns the current Target, query task-relevant Context Packs, read relevant lessons and directly relevant sources, then identify the final acceptance conditions, exclusions, constraints, and verification boundary. Apply [Task Capability Preflight](../task/SKILL.md#capability-preflight) to planning needs and record future execution prerequisites in the handoff; unavailable execution capabilities alone do not Block an otherwise complete plan or authorize implementation.
5. Research facts that the workspace or authoritative sources can answer. Ask one focused question only when a user-owned decision truly blocks a correct plan; do not ask for implementation facts you can inspect.
6. Refine the record's Target, Decisions, Scope, and Plan. When the record is intended for later execution, ensure the Target describes the final deliverable rather than merely the existence of a plan. Re-enter the shared protocol for material refinements; in-scope exploration remains exempt from generic confirmation. Then run `sync <id>` and `check <id>`.
7. Return a decisions-only handoff: final decisions, material constraints, unresolved user decisions, and the canonical record path. Do not include the interview transcript or private reasoning.

## Optional Topic

For planning under an explicitly selected persistent Topic, load `topic` and use its shared specification rather than copying it into this task. The alignment protocol permits only the minimal selected-Topic lookup needed to form an honest Target before alignment. Bind the planning task through the shared CLI with maintenance mode and an explicit planning scope; new Topics start Active, which means maintained rather than implementation-ready. A legacy Draft may still be the subject of planning, not execution authorization. Preserve the adopted revision and check freshness before handing off. When later executing product implementation, explicitly switch the binding to implementation mode, require an Active current Topic, and retain the existing execution-authorization gate. Unrelated standalone plans need no Topic. Topic creation/updates remain a concrete owning outcome, not permission to implement all its member tasks.

## Plan Record

Use `task`'s Task Artifacts contract: the shared core adds the top-level directory link when artifacts exist and refreshes it on lifecycle writes. After producing a separate planning artifact, update the owning record before handoff; do not create an empty directory for navigation.

- `Scope`: included and excluded outcomes only when a boundary matters.
- `Target`: the final deliverable's stable, observable acceptance conditions; this remains the only checkbox list.
- `Decisions`: only settled choices and constraints that execution must preserve. Do not retain question/answer chronology.
- `Plan`: ordered result nodes, dependencies, and verification points; no checkboxes and no speculative architecture.
- `Block`: when a missing decision, evidence or capability necessary for current planning prevents an implementation-ready plan, with `Reason` and `Unblock when`; set the task Blocked after adding it. Missing future execution prerequisites alone belong in the Plan handoff.

Leave an implementation-ready record Pending. Do not record Result evidence, review, verification, or completion for work that has not been implemented; planning-only task-record writes do not trigger the deliverable-change review loop. The canonical plan record is the default handoff: do not create a `tasks/artifacts/` file merely to mirror its Scope, Decisions, or Plan. When the user explicitly authorizes execution, hand the same record to `task`, which resumes it under the single-task completion gate and applies implementation alignment. Exploration does not supply prior Target acceptance: normally the implementation Target receives its first checkpoint then. If the user separately accepted the complete implementation Target and that acceptance remains recoverable and applicable, `task` may inherit it without a duplicate checkpoint. Target acceptance alone never permits execution.

If the requested work contains several independently acceptable outcomes and the user wants them managed automatically, stop planning the execution graph and route to `task-queue`.

## Completion Check

Before handoff, confirm that every Target describes the eventual deliverable and is observable, every material decision is settled or explicitly blocked, the Plan has no implementation transcript, and `check <id>` passes. Routing fixtures are in `evals/`.
