---
name: task-plan
description: Research and prepare an implementation-ready canonical task plan without changing the requested deliverable. Use when the user asks to plan, investigate before implementation, resolve requirements, or create a decisions-only handoff for later execution. Do not use for implementation or autonomous multi-task execution.
---

# Task Plan

Produce an implementation-ready task record while keeping the requested deliverable read-only. Writing `tasks/tasks.md` and its canonical task record is allowed; product code, documents, configuration, and other requested deliverables are not.

Use the host Agent's existing read, search, research, shell, and subagent capabilities. Never invoke nested Codex/Pi CLIs or build a host adapter. Resolve the collection root as the parent of this skill directory and use `node <collection-root>/shared/scripts/csl-tasks.js --workspace <workspace> ...` for task persistence.

## Workflow

1. Read workspace context, relevant lessons, the task index, and directly relevant sources.
2. Identify the intended outcome, observable acceptance conditions, exclusions, constraints, and verification boundary.
3. Research facts that the workspace or authoritative sources can answer. Ask one focused question only when a user-owned decision truly blocks a correct plan; do not ask for implementation facts you can inspect.
4. Create a Pending plan record with `create <id> --title <title> --kind plan` and one `--target "Tn: ..."` per delivery condition.
5. Add only the substantive sections below, then run `sync <id>` and `check <id>`.
6. Return a decisions-only handoff: final decisions, material constraints, unresolved user decisions, and the canonical record path. Do not include the interview transcript or private reasoning.

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
