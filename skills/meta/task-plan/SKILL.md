---
name: task-plan
description: Research and prepare an implementation-ready canonical task plan without changing the requested deliverable. Use when the user asks to plan, investigate before implementation, resolve requirements, or create a decisions-only handoff for later execution. Do not use for implementation or autonomous multi-task execution.
---

# Task Plan

Produce an implementation-ready task record while keeping the requested deliverable read-only. Writing `tasks/tasks.md` and its canonical task record is allowed; product code, documents, configuration, and other requested deliverables are not.

Use the host Agent's existing read, search, research, shell, and subagent capabilities. Never invoke nested Codex/Pi CLIs or build a host adapter.

## Required Runtime Protocol

Resolve the collection root as the parent of this skill directory. Before forming, presenting, or accepting a Task Target, read `<collection-root>/csl-tasks/shared/protocols/task-target-alignment.md` in full and treat it as the authoritative detailed alignment contract. Read it again after resume or compaction when it is no longer present in context. If it is unavailable, stop before substantive work and report the missing runtime dependency.

This skill owns planning-task activation, the planning-handoff Target meaning, permitted lifecycle writes, and the post-alignment planning workflow. The shared protocol owns readiness, semantic alignment, focused clarification, conditional confirmation, revision, and realignment semantics. Use `node <collection-root>/csl-tasks/shared/scripts/csl-tasks.js --workspace <workspace> ...` for task persistence.

## Workflow

1. Load Project Core, then read only the newest task index entries and plausible candidate owning records needed to avoid duplicate ownership.
2. As soon as the request establishes a concrete planning outcome, create a Pending plan record with `create <id> --title <title> --kind plan` and initial observable `--target "Tn: ..."` conditions supported by the request. Call the host's task-focus mechanism when available. If no honest Target can yet be stated, ask one focused question and create the record immediately after the answer.
3. Apply the shared Task Target Alignment Protocol to the active plan record. For this workflow, the conversational Target means the intended planning outcome and observable condition for an implementation-ready handoff; before alignment, the permitted lifecycle writes are create, focus, sync, and check. The gate follows activation and precedes task-direct source inspection or substantive planning; only the protocol's focused target-forming clarification may occur within it.
4. After the protocol aligns the current Target, query task-relevant Context Packs, read relevant lessons and directly relevant sources, then identify the final acceptance conditions, exclusions, constraints, and verification boundary.
5. Research facts that the workspace or authoritative sources can answer. Ask one focused question only when a user-owned decision truly blocks a correct plan; do not ask for implementation facts you can inspect.
6. Refine the record's Target, Decisions, Scope, and Plan, then run `sync <id>` and `check <id>`.
7. Return a decisions-only handoff: final decisions, material constraints, unresolved user decisions, and the canonical record path. Do not include the interview transcript or private reasoning.

## Plan Record

- `Scope`: included and excluded outcomes only when a boundary matters.
- `Target`: the final deliverable's stable, observable acceptance conditions; this remains the only checkbox list.
- `Decisions`: only settled choices and constraints that execution must preserve. Do not retain question/answer chronology.
- `Plan`: ordered result nodes, dependencies, and verification points; no checkboxes and no speculative architecture.
- `Block`: only when a user decision still prevents an implementation-ready plan, with `Reason` and `Unblock when`; set the task Blocked after adding it.

Leave an implementation-ready record Pending. Do not record Result evidence, verification, or completion for work that has not been implemented. When the user chooses to proceed, hand the same record to `task`, which resumes it and executes under the single-task completion gate.

If the requested work contains several independently acceptable outcomes and the user wants them managed automatically, stop planning the execution graph and route to `task-queue`.

## Completion Check

Before handoff, confirm that every Target is observable, every material decision is settled or explicitly blocked, the Plan has no implementation transcript, and `check <id>` passes. Routing fixtures are in `evals/`.
