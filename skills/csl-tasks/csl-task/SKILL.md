---
name: csl-task
description: Create, resume, update, cancel, verify, and complete canonical workspace task records for non-trivial deliverable changes. Use before implementation that changes a deliverable, when continuing an existing task, or when the user asks to manage one task. Skip read-only answers and trivial mechanical operations with direct deterministic verification.
---

# CSL Task

Manage one outcome through the host Agent. Use the host's existing file, shell, research, and subagent capabilities; never launch nested `codex exec`, `pi --print`, a worker daemon, or an unattended supervisor.

## Storage and Core

- `tasks/tasks.md` is the newest-first index. It contains only title, current status, and a `tasks/<slug>.md` link.
- `tasks/tasks/<slug>.md` is the canonical record and is authoritative when the index disagrees.
- Resolve the collection root as the parent of this skill directory, then use `node <collection-root>/shared/scripts/csl-tasks.js --workspace <workspace> ...` for creation, state, parent-child, evidence, verification, completion, and index checks.
- Do not hand-edit status or index lines. After direct edits to Scope, Target, Plan, Decisions, or Block, run `sync <id>` and `check <id>`.
- Modify only the owning task and its exact index entry. Preserve unrelated task state and untouched history.

## Activation and Ownership

- Create a new record before non-trivial work that changes a deliverable.
- Start a new task for every independently acceptable user outcome.
- Reopen an existing task only when the request directly corrects, completes, or re-verifies the same outcome and leaving its Target or Result unchanged would be misleading.
- Component, file, topic, or implementation overlap alone does not establish ownership. Create a new task when ownership is ambiguous.
- Skip records for read-only answers, trivial deterministic file operations, context maintenance, and lesson maintenance.

## Start or Resume

1. Use `$workspace-context` to load Project Core and task-relevant Context Packs without reading all of `tasks/context.md`; then read relevant lessons, the newest index entries, and any candidate owning record.
2. For a new task, choose a lowercase kebab-case ID and run:
   `create <id> --title <title> --kind task --target "T1: <observable condition>"`.
   Repeat `--target` for additional conditions.
3. Add only substantive sections needed now, then `sync` and `check`.
4. Run `resume <id>` to move Pending, Blocked, or Cancelled work to In Progress. `resume` removes a stale Block section.
5. Use `reopen <id>` only for the same completed outcome; add the next Target ID and revise the Plan before continuing.

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
4. Run `complete <id>`. This is the only route to Completed and fails closed on missing Targets, Results, review, verification, Block, or unfinished Auto children.
5. Run `check <id>` and `validate` before delivery.

Do not retrofit untouched historical record bodies. All records share the new paths, while the stricter `Kind:` contract applies to new or reopened work.

## Maintainer Validation

Routing fixtures are in `evals/`. Run focused core/task tests, routing evaluation when descriptions change, OpenAI validation, and Yao plus resource-boundary audits. The only acceptable non-blocking Yao failure is the 1000-token initial-load budget for this workflow skill; syntax, governance, tests, and all other checks remain blocking.
