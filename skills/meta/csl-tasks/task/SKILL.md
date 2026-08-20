---
name: task
description: Create, resume, update, cancel, verify, and complete a canonical workspace task for one concrete non-trivial outcome. Use as soon as that outcome is identified, then present a concise Task Target and wait for explicit confirmation before substantive preparation or execution. Skip simple factual answers, open-ended conversation without a concrete outcome, and trivial deterministic operations.
---

# Task

Manage one outcome through the host Agent. Use the host's existing file, shell, research, and subagent capabilities; never launch nested `codex exec`, `pi --print`, a worker daemon, or an unattended supervisor.

## Storage and Core

- `tasks/tasks.md` is the newest-first index. It contains only title, current status, and a `tasks/<slug>.md` link.
- `tasks/tasks/<slug>.md` is the canonical record and is authoritative when the index disagrees.
- Resolve the collection root as the parent of this skill directory, then use `node <collection-root>/shared/scripts/csl-tasks.js --workspace <workspace> ...` for creation, state, parent-child, evidence, verification, completion, and index checks.
- Do not hand-edit status or index lines. After direct edits to Scope, Target, Plan, Decisions, or Block, run `sync <id>` and `check <id>`.
- Modify only the owning task and its exact index entry. Preserve unrelated task state and untouched history.

## Activation and Ownership

- Create, resume, or reopen the owning record as soon as the request establishes a concrete, non-trivial, independently acceptable outcome.
- Activate it before substantive discussion, requirements clarification, repository exploration, research, planning, delegation, or implementation. Before activation, allow only Project Core loading and the minimal index and candidate-record lookup needed to resolve ownership.
- Start a new task for every independently acceptable user outcome.
- Reopen an existing task only when the request directly corrects, completes, or re-verifies the same outcome and leaving its Target or Result unchanged would be misleading.
- Component, file, topic, or implementation overlap alone does not establish ownership. Create a new task when ownership is ambiguous.
- Skip records only for simple factual answers, open-ended conversation without a concrete outcome, trivial deterministic file operations, context maintenance, and lesson maintenance.

## Start or Resume

1. Load Project Core, then read only the newest index entries and plausible candidate owning records needed to resolve ownership. Do not query task-relevant Context Packs, inspect task-direct sources, or begin substantive discussion yet.
2. For a new task, choose a lowercase kebab-case ID and run:
   `create <id> --title <title> --kind task --target "T1: <observable condition>"`.
   Repeat `--target` for additional conditions. If the request cannot support any honest observable Target, ask one focused question; create the record as soon as the answer establishes the outcome.
3. Run `resume <id>` for new, Pending, Blocked, or Cancelled work. Use `reopen <id>` only for the same completed outcome; add the next Target ID before continuing. After creation, resume, or reopen, call the host's task-focus mechanism when available.
4. With the owning task active, state one concise user-facing `Task Target` that names the intended outcome and observable completion condition, then stop and wait for explicit confirmation. Before confirmation, allow only task lifecycle writes needed to create, resume, reopen, focus, sync, and check the record; do not inspect task-direct sources, edit the requested deliverable, run other mutating commands, or delegate work. This conversational gate does not replace the canonical `Target` section.
5. After confirmation, query task-relevant Context Packs, read relevant lessons, and inspect task-direct sources.
6. Add or refine only the substantive Scope, Target, and Plan content now supported, then `sync` and `check` before execution continues.

## Record Contract

Keep `# Title`, the core-owned `Status:` line, and `Kind:`. New records use these sections as needed:

### Scope

Add only when an adjacent boundary is easy to include accidentally, the user excludes work, or expansion materially changes cost or risk. Record included and excluded outcomes without prescribing implementation.

### Target

- This is the only checkbox list. Use unique stable IDs (`T1`, `T2`, ...).
- Each item is one observable pass-or-fail result, preserved behavior, compatibility boundary, or side-effect boundary.
- Do not put implementation steps, commands, workflow gates, or review state here.
- Never check a Target manually. Record evidence with `result <id> <Tn> --evidence <one-line evidence>`; the core checks the matching item.

### Plan

Use an ordered list without checkboxes. Keep only current result nodes, dependencies, and next actions. Do not prescribe algorithms, files, functions, types, or call paths unless the user requires them.

### Result

The core records one evidence line per Target. Evidence must name what was checked, how, and the observed result. Update evidence when it becomes stale; changing a Target or relevant deliverable invalidates verification.

Record the review gate through `review <id> ... --evidence ...`:
- `skipped` unless the user explicitly asks for adversarial review, a two-Agent Reviewer-Editor loop, or independent Reviewer approval;
- `required` when explicitly requested; then move to In Review before invoking that workflow;
- `approved` only after that review approves, with its report link or decision evidence. If review changes the deliverable, return to In Progress and replace stale Result and verification evidence before reviewing again.

Do not infer review from risk, complexity, verification gaps, another rule, or Agent judgment. Ordinary review, testing, proofreading, and self-review do not request the independent review workflow.

### Verification

Run proportionate host-native checks yourself; the core never executes arbitrary commands. Record the current outcome with `verify <id> passed|failed --evidence <one-line observation>`. A failed check blocks completion. Re-run and replace verification after relevant changes.

### Block

Add only while Blocked, with `Reason` and observable `Unblock when`. Add the section before `status <id> blocked`. Resuming removes it. Use `cancel <id>` for a reversible soft stop; cancelled work is not completed and can resume.

## Completion

1. Confirm every current Target has Result evidence.
2. Run proportionate verification and record it as passed.
3. Record `skipped` or an actual `approved` review gate.
4. Run `complete <id>`. This is the only route to Completed and fails closed on missing Targets, Results, review, verification, Block, or unfinished Queue children.
5. Run `check <id>` and `validate` before delivery.

Do not retrofit untouched historical record bodies. All records share the new paths, while the stricter `Kind:` contract applies to new or reopened work.

## Maintainer Validation

Routing fixtures are in `evals/`. Run focused core/task tests, routing evaluation when descriptions change, OpenAI validation, and Yao plus resource-boundary audits. The only acceptable non-blocking Yao failure is the 1000-token initial-load budget for this workflow skill; syntax, governance, tests, and all other checks remain blocking.
