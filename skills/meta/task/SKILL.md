---
name: task
description: Create, resume, update, cancel, review, verify, and complete a canonical workspace task for one outcome. Use before every user-requested file creation, modification, move, rename, or deletion, even when trivial, and for any concrete non-trivial outcome. Activate and align its Task Target before substantive work. Skip only no-file simple factual answers and open-ended conversation without a concrete outcome.
---

# Task

Manage one outcome through the host Agent. Use the host's existing file, shell, research, and subagent capabilities; never launch nested `codex exec`, `pi --print`, a worker daemon, or an unattended supervisor.

## Required Runtime Protocol

Resolve the collection root as the parent of this skill directory. Before forming, presenting, or accepting a Task Target, read `<collection-root>/csl-tasks/shared/protocols/task-target-alignment.md` in full and treat it as the authoritative detailed alignment contract. Read it again after resume or compaction when it is no longer present in context. If it is unavailable, stop before substantive work and report the missing runtime dependency.

This skill owns task activation, the single-outcome Target meaning, permitted lifecycle writes, and the post-alignment task workflow. The shared protocol owns all Task Target alignment semantics.

## Storage and Core

- `tasks/tasks.md` is the newest-first index. It contains only title, current status, and a `tasks/<slug>.md` link.
- `tasks/tasks/<slug>.md` is the canonical record and is authoritative when the index disagrees.
- Use `node <collection-root>/csl-tasks/shared/scripts/csl-tasks.js --workspace <workspace> ...` for creation, state, parent-child, evidence, verification, completion, and index checks.
- Do not hand-edit status or index lines. After direct edits to Scope, Target, Plan, Decisions, Block, or the active Review ledger, run `sync <id>` and `check <id>`. For a non-Completed task, `sync` conservatively clears Verification and invalidates `Passed` or `Approved`; reopen a Completed task before changing its specification.
- Modify only the owning task and its exact index entry. Preserve unrelated task state and untouched history.

## Task Artifacts

Persist a workspace-local task artifact only when the user requests a durable file or the task needs durable evidence that does not have a more authoritative project location. Use `tasks/artifacts/<task-id>/<category>/<name>` with the owning canonical task ID and create only the category that is needed:

- `discussions`: user-visible discussion or synthesis; never private reasoning, role exchanges, or hidden state.
- `specs`: RFCs, PRDs, ADRs, designs, and separately requested implementation or migration plans.
- `reports`: research, analysis, review, and audit reports.
- `evidence`: logs, screenshots, benchmarks, and other raw verification material that cannot be represented safely by a concise observation or external link.

The category describes the artifact's stable purpose, not its lifecycle state. Draft, accepted, completed, or superseded status never moves the file. Keep source code, configuration, and long-lived authoritative project documentation at their normal project paths. Link an artifact from its task record with `../artifacts/<task-id>/<category>/<name>`; do not duplicate its body in the record. Never persist secrets, private data, or unnecessary full logs.

## Activation and Ownership

- Create, resume, or reopen the owning record as soon as the request either asks to create, modify, move, rename, or delete any file, or establishes a concrete, non-trivial, independently acceptable outcome.
- Activate it before substantive discussion, repository exploration, research, planning, delegation, implementation, or any focused target-forming clarification performed after the outcome exists. For a requested file mutation, activation and—when the host provides one—an actually emitted `task_focus(<id>)` call must also precede the first requested deliverable edit. Before activation, allow only Project Core loading, the minimal index and candidate-record lookup needed to resolve ownership, and the one focused question permitted by the shared protocol when no honest Target yet exists.
- The lifecycle writes needed to create, resume, reopen, focus, sync, check, and align the owning task are the bootstrap exception to the first-edit rule; they do not authorize editing the requested deliverable.
- Start a new task for every independently acceptable user outcome in the main session.
- A delegated child must use the existing owning task named by the main session's current delegation packet. It must not create another task, present a user-facing checkpoint, or invent broader ownership; missing or out-of-Plan delegation returns to the main session under the shared protocol.
- Reopen an existing task only when the request directly corrects, completes, or re-verifies the same outcome and leaving its Target or Result unchanged would be misleading.
- When the user explicitly asks to execute an implementation-ready plan, resume that plan's exact record; the `task-plan` to `task` phase transition alone does not create new ownership.
- Component, file, topic, or implementation overlap alone does not establish ownership. Create a new task when ownership is ambiguous.
- Skip records only for simple factual answers and open-ended conversation that request no file mutation and establish no concrete outcome, read-only trivial deterministic operations, and routine Context or Lessons maintenance that is not itself the requested deliverable.

## Start or Resume

1. Load Project Core, then read only the newest index entries and plausible candidate owning records needed to resolve ownership. Do not query task-relevant Context Packs, inspect task-direct sources, or begin substantive discussion yet.
2. For a new task, choose a lowercase kebab-case ID and run:
   `create <id> --title <title> --kind task --target "T1: <observable condition>"`.
   Repeat `--target` for additional conditions. If the request cannot support any honest observable Target, ask one focused question; create the record as soon as the answer establishes the outcome.
3. Run `resume <id>` for new, Pending, Blocked, or Cancelled work. Use `reopen <id>` only for the same completed outcome; add the next Target ID before continuing.
4. Immediately after creation, resume, or reopen succeeds, emit the real host tool call itself—for example, `task_focus(<id>)`—in the same reply as the lifecycle command; treat both calls as one atomic batch. Planning or listing `task_focus` without emitting it does not satisfy this step. If binding fails (for example, the record lives outside the session workspace), disclose that failure explicitly instead of silently skipping.
5. Apply the shared Task Target Alignment Protocol to the active record. For this workflow, the conversational Target means the intended outcome and observable completion condition; before alignment, the permitted lifecycle writes are create, resume, reopen, focus, sync, and check. The gate follows activation and precedes task-direct source inspection or substantive preparation; only the protocol's focused target-forming clarification may occur within it. A main session runs the user-facing gate; a delegated child validates the main session's packet and either continues the named task or returns to the main session without prompting the user. When resuming the same implementation-ready plan record, an explicit request to execute is execution authorization, not a new Target by itself; inherit a recoverable, materially equivalent accepted Target without another checkpoint.
6. After the protocol aligns the current Target, query task-relevant Context Packs, read relevant lessons, and inspect task-direct sources.
7. Add or refine only the substantive Scope, Target, and Plan content now supported, then `sync` and `check` before execution continues.

## Record Contract

Keep `# Title`, the core-owned `Status:` line, and `Kind:`. Canonical `#` and `##` record headings start at column zero; indented or container-nested headings are content, not record sections. New records use these sections as needed:

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

- `skipped` only when the task changed no requested deliverable files. Canonical task, Context, and Lessons lifecycle writes alone do not count as deliverable changes.
- `required` before every review pass for a task that changed requested deliverable files. Record current Result evidence and preliminary checks, then set `required` and move to In Review before invoking `task-review`.
- `passed` only after that `task-review` pass reports no Critical Finding, no Concern, and no Unverified Risk that prevents Target verification. The interaction owner records this value; the read-only Reviewer never writes task state or grants approval.
- `approved` only after an explicitly requested `adversarial-review` approves. A task with deliverable changes first completes the mandatory `task-review`; `approved` evidence must identify both outcomes.

When `task-review` finds a problem, return to In Progress, remediate it, refresh stale Result and verification evidence, set the gate to `required`, re-enter In Review, and invoke a new one-pass `task-review`. Apply the Review tracking and stall guard below on every pass. Repeat without a fixed total round limit until the gate can be recorded as `passed`, the task becomes Blocked, or the user stops. Any reviewed deliverable change, Result change, or Queue graph change invalidates `passed` or `approved` evidence.

Independent adversarial review, a two-Agent Reviewer-Editor loop, and independent approval remain opt-in and run only when the user explicitly requests them. They do not replace the mandatory `task-review` pass.

### Review

Use exactly one temporary `## Review` section with the exact `task-review-ledger/v1` marker while a mandatory review loop has unresolved items or is stalled. Duplicate Review sections, unknown ledger schemas, and ledger-like malformed content using alternate Markdown list markers or whitespace fail closed; one unmarked historical free-form Review section remains compatible. Keep only the current ledger, not a pass transcript:

```markdown
## Review
- Schema: task-review-ledger/v1
- Pass: <positive integer>
- Next finding: <positive integer>
- `TR-<n>` | no-progress=<0|1|2> | <location> | <required outcome>
```

- Give each Critical Finding, Concern, and Target-blocking Unverified Risk a stable `TR-<n>` ID. Advance `Next finding` monotonically so an ID is never reused within the active loop. A first appearance starts at `no-progress=0`; a new finding never resets another finding's streak.
- Give every prior ID to the next fresh Reviewer. The Reviewer must classify it as `resolved`, `substantive progress`, or `no progress` with current evidence. Keep the same ID when wording, location, or severity changes but the root problem and required outcome remain materially the same.
- Increment only a `no progress` item. Reset it to `0` for evidence-backed artifact progress, a valid evidence-backed reclassification, or newly actionable evidence; remove it when resolved. Text churn, restatement, unchanged checks, or unsupported relabeling is not progress.
- When any item reaches `no-progress=2`, stop dispatching review passes. Add `## Block` with the stalled IDs and evidence as `Reason`, name the user decision or material artifact/evidence change as `Unblock when`, then set the task Blocked. Never convert a stall to `passed`.
- Resume only after the unblock condition occurs. Reset affected streaks to `0` only when new evidence demonstrates substantive progress; the core rejects resume while any ledger item remains at `no-progress=2`. Remove `## Review` before recording `passed` once no blocking item remains.

### Verification

Run proportionate host-native checks yourself; the core never executes arbitrary commands. Record the current outcome with `verify <id> passed|failed --evidence <one-line observation>`. A failed check blocks completion. Re-run and replace verification after relevant changes.

### Block

Add only while Blocked, with `Reason` and observable `Unblock when`. Add the section before `status <id> blocked`. Resuming removes it. Use `cancel <id>` for a reversible soft stop; cancelled work is not completed and can resume.

## Completion

1. Confirm every current Target has Result evidence and run proportionate preliminary checks.
2. For requested deliverable file changes, execute the mandatory `required` → In Review → `task-review` loop, apply its per-finding stall guard, and record `passed`; if adversarial review was explicitly requested, run it separately and replace the gate with `approved` evidence that also names the completed task-review pass.
3. For a task with no requested deliverable file changes, record `skipped` with that exact boundary as evidence and remain In Progress. If the user explicitly requested adversarial review of that no-file result, instead set `required`, enter In Review, run `adversarial-review` without a mandatory `task-review`, and record `approved`.
4. After the final review decision, rerun proportionate verification and record it as passed because every review-gate write invalidates prior Verification evidence.
5. Confirm this session actually bound to the owning record through the host focus mechanism when it provides one; if binding failed or was unavailable, disclose that before completing.
6. Run `complete <id>`. This is the only route to Completed and fails closed on missing Targets, Results, review, verification, Block, stale review evidence, or unfinished Queue children.
7. Run `check <id>` and `validate` before delivery.

Do not retrofit untouched historical record bodies. All records share the new paths, while the stricter `Kind:` contract applies to new or reopened work.

## Maintainer Validation

Keep the routing fixtures and `evals/review_stall_cases.json` aligned, run authorized focused core/task tests, then run the built-in `$skill-quality` gate against this package. Quality failures block completion. Review warnings, but never delete or distort required workflow guidance merely to satisfy the initial-load budget.
