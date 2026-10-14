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
- Do not hand-edit status or index lines. After direct edits to Scope, Target, Plan, Decisions, Block, or the active Review ledger, run `sync <id>` and `check <id>`. For a non-Completed task, `sync` conservatively marks its assessment Stale, clears Verification, removes `Skipped`, and invalidates `Passed` or `Approved`; reopen a Completed task before changing its specification.
- Modify only the owning task and its exact index entry. Preserve unrelated task state and untouched history.

## Optional Topic Context

A task may bind to one persistent Topic through `topic`'s [storage contract](../topic/references/topic-contract.md). No binding is the normal independent-task path. Topic membership is separate from Queue Parent/Children and does not change Task Kind or grant execution permission. Load the `topic` Skill when the user names a Topic or the task has an explicit binding; do not infer membership from filenames.

Use `topic task <id>` to inspect the adopted revision and freshness on start/resume. A stale or unavailable Topic permits diagnosis and explicit adoption/repair, not dependent implementation or terminal completion. The shared CLI checks current normative content, pinned dependencies and the backlink at assessment, review, passed verification and completion. Read the adopted snapshot and current specification before impact analysis; `topic adopt` records the disposition and invalidates task evidence. Material requirement changes still require realignment. A Topic-maintenance task adopts its own final specification change before self-check; maintenance mode never authorizes product implementation against Draft/Archived.

Create a new task for a new bug, enhancement or bounded review under the same Topic; reopen only under the existing same-outcome rules. Completing this task does not close the Topic. Keep Task Summary focused on actual component changes, not shared specification prose. Do not mutate a Completed task's binding without reopening, and do not detach to bypass a stale specification or required review.

## Task Artifacts

Persist a workspace-local task artifact only when the user requests a durable file or the task needs durable evidence that does not have a more authoritative project location. Use `tasks/artifacts/<task-id>/<category>/<name>` with the owning canonical task ID and create only the category that is needed:

- `discussions`: user-visible discussion or synthesis; never private reasoning, role exchanges, or hidden state.
- `specs`: RFCs, PRDs, ADRs, designs, and separately requested implementation or migration plans.
- `reports`: research, analysis, audit, and separately governed reports (including the existing adversarial-review final report).
- `reviews`: immutable per-pass `task-review` feedback, including passes with findings or no findings; see Review Reports below.
- `evidence`: logs, screenshots, benchmarks, and other raw verification material that cannot be represented safely by a concise observation or external link.

The shared core maintains an `Artifacts` row with `[Artifacts](../artifacts/<task-id>/)` in the top-level metadata table whenever the corresponding directory exists. This applies to Task, Plan, and Queue records at creation and on subsequent lifecycle writes, including same-state resume. After creating artifacts, run the next normal task lifecycle update before handoff so the directory link appears. Read-only commands do not refresh it. Missing or non-directory paths omit the field; removing the directory removes the generated field on the next write. Never create an empty directory just for the link or backfill untouched records. This generated navigation field is excluded from the review fingerprint, not a substitute for per-artifact evidence links; normal `sync` invalidation remains unchanged.

Material intentionally shared across future tasks of an established Topic belongs in that Topic's `resources/` directory and Resources index instead; register existing authoritative documents by reference rather than copying them. Use `topic`'s normative/reference classification and version checks. A task's own reports, logs, screenshots and review evidence remain task artifacts. Do not automatically move historical task artifacts or create a Topic merely to store a file.

The category describes the artifact's stable purpose, not its lifecycle state. Draft, accepted, completed, or superseded status never moves the file. Keep source code, configuration, and long-lived authoritative project documentation at their normal project paths. Link an artifact from its task record with `../artifacts/<task-id>/<category>/<name>`; do not duplicate its body in the record. Never persist secrets, private data, or unnecessary full logs.

## Activation and Ownership

- Create, resume, or reopen the owning record as soon as the request either asks to create, modify, move, rename, or delete any file, or establishes a concrete, non-trivial, independently acceptable outcome.
- Activate it before substantive discussion, repository exploration, research, planning, delegation, implementation, or any focused target-forming clarification performed after the outcome exists. The shared alignment protocol's narrow, read-only lookup of an explicitly selected Topic to form an honest Target is also permitted; it is not general source exploration. For a requested file mutation, activation and—when the host provides one—an actually emitted `task_focus(<id>)` call must also precede the first requested deliverable edit. Before activation, allow only Project Core loading, the minimal index and candidate-record lookup needed to resolve ownership, and the one focused question permitted by the shared protocol when no honest Target yet exists.
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

## Review Classification

Before choosing a completion review gate, read [Task Review Grading](../csl-tasks/shared/protocols/task-review-grading.md) in full. Apply it after owner self-check and current Result evidence, independently of Task Target levels:

- **R0:** no requested deliverable files changed; lifecycle records alone do not count. Independent review may be skipped.
- **R1:** simple, low-risk changes, including small logic changes, with concrete grounds for result clarity, bounded impact, low consequences and sufficient authorized verification. All four are required to skip independent review.
- **R2:** complex, high-risk or materially uncertain changes require the existing fresh independent `task-review` loop. Diff size and confidence alone never justify R1.

Use `assess-review <id> <R0|R1|R2> --reason <ground> --snapshot <content-identity> --evidence <self-check-reference>` while In Progress; R1 also requires `--clarity`, `--impact`, `--risk` and `--verification`. Explicit review overrides an exemption. A Required obligation cannot become Skipped; Reviewer failure cannot downgrade R2. Keep final verification at every level. Missing required evidence can Block completion, never be concealed by an exemption.

## Owner Self-Check and Review Handoff

Before classification and each mandatory review pass, the main Agent owns self-check and verification; the fresh Reviewer looks for omissions, not the author's known unfinished fixes.

1. Compare the original request, effective revisions, accepted constraints, current Target, actual behavior, and task-owned diff. A mismatch in authorized commitments returns to the alignment protocol, not a silently revised review criterion.
2. For each Target, collect requirement, observed result, evidence, and limitations. Identify the checked version, check performed, and what the observation actually proves. Run only checks permitted by current authorization and host rules; never report an unrun test as passed. Fix known Target failures or required-check failures before dispatch; if unable, Block with an observable unblock condition. Disclose remaining uncertainty without marking an unproven Target complete.
3. Record supported Result evidence, classify the actual result and record its assessment. When a pass is required, prepare the factual packet and Reviewer prompt in [Review Workflow](../task-review/references/review_workflow.md). Include recoverable original requirements and accepted constraints, actual artifacts/diff, content identity, allowed checks, known limitations, and per-Target evidence references. Exclude author defense and desired verdicts. Reuse Result and existing evidence carriers; do not create a self-check report, second ledger, or new task state.
4. Stop editing the review scope while the Reviewer runs. Bind the pass to actual content: an exact revision for clean Git artifacts; for dirty workspaces also identify relevant staged, unstaged, untracked, deleted, and renamed content, not merely HEAD or filenames. Use content identities for non-Git artifacts. Check the same scope again before accepting feedback and before completion.
5. Any relevant content, requirement, or evidence drift invalidates the pass: return to In Progress, refresh self-check, assessment and the packet, and dispatch a fresh pass under Required. Do not reuse an old no-findings response. If the reviewed snapshot cannot be established, report the blocking evidence gap instead of recording Passed.

After each dispatched pass returns, the owner persists its feedback and appends the Review Reports index before acting on the findings or recording a terminal gate. The Reviewer stays read-only. Report persistence is owner bookkeeping, not a new review pass or approval. If saving or linking fails, preserve the returned output, stop the terminal transition and record the concrete recovery condition; never fabricate a saved report.

A mandatory pass requires an actual fresh, read-only subagent; a prompt saying “be independent” or a Markdown template is not isolation. If it is unavailable or fails, preserve self-check evidence, report the exact failure and run/workspace state, and Block with an observable recovery condition. Do not substitute inline self-review or silently switch execution modes. Infrastructure failures do not increment finding no-progress streaks. Follow stricter host failure/retry rules.

The core validates assessment structure, level/gate consistency, task-record fingerprint and evidence text, not semantic risk, actual subagent isolation, check execution, or external filesystem freshness; the host and main Agent must establish those facts.

## Record Contract

Keep `# Title` followed by the core-owned two-column metadata table (`Field` and `Value`). `Status` and `Kind` each occupy a row; include `Artifacts` only when its directory exists and `Parent` when present. The core reads legacy `Name: value` metadata and renders the table on subsequent writes; do not migrate untouched historical records. Display-only conversion preserves the review fingerprint. Canonical `#` and `##` record headings start at column zero; indented or container-nested headings are content, not record sections. New records use these sections as needed:

### Scope

Add only when an adjacent boundary is easy to include accidentally, the user excludes work, or expansion materially changes cost or risk. Record included and excluded outcomes without prescribing implementation.

### Target

- This is the only checkbox list. Use unique stable IDs (`T1`, `T2`, ...).
- Each item is one observable pass-or-fail result, preserved behavior, compatibility boundary, or side-effect boundary.
- Do not put implementation steps, commands, workflow gates, or review state here.
- Never check a Target manually. Record evidence with `result <id> <Tn> --evidence <one-line evidence>`; the core checks the matching item.

### Plan

Use an ordered list without checkboxes. Keep only current result nodes, dependencies, and next actions. Do not prescribe algorithms, files, functions, types, or call paths unless the user requires them.

### Topic

Only for an associated task, keep one CLI-owned `task-topic/v1` section with Reference, Repository identity, adopted Revision, Applies scope and implementation/maintenance Mode. Use `topic attach`, `detach` or `adopt`, never hand-edit a binding or digest. The section participates in the task fingerprint. Topic Adoption is the current impact-disposition note, not approval evidence or another task status. The Topic contract defines cross-workspace permission, optimistic versions and partial-link repair.

### Task Summary

Before completion, write exactly one `## Task Summary` section describing only the code or components actually changed by this task. Use a separate short paragraph per changed component, led by its **component name**, followed by its component-root directory link and a concrete description of what changed. Use the highest directory that still identifies the component; do not collapse unrelated components into a repository-wide label or enumerate internal files and subfolders. Qualify components by project when more than one project was modified. For a standalone root-level file with no meaningful component directory, link that file instead.

Keep all paragraphs under this single heading, without subheadings, checkboxes, or fixed decision/verification/next-step fields. Do not repeat Target, Plan, Decisions, Result evidence, or Verification. Include only actual task-owned changes, not inspected or merely related components, proposals, or pre-existing unrelated edits. When there are no code or component changes, use one short factual sentence saying so; lifecycle record updates alone are not component changes.

Write or refresh the summary before self-check and review assessment, compare it with the actual task-owned changes, then run `sync` and `check`. A later summary change follows normal evidence invalidation; never append it after final verification without refreshing the affected gates. On resume or reopen, update the same section rather than adding another. Leave untouched historical records unchanged. This is an Agent-authored record requirement, not a new CLI-generated field or automatic diff inventory.

### Result

The core records one evidence line per Target. Evidence must name what was checked, how, and the observed result. Update evidence when it becomes stale; changing a Target or relevant deliverable invalidates verification.

Record the review gate through `review <id> ... --evidence ...`:

- `skipped` only with a current R0 or R1 assessment and no explicit or existing review obligation. Record the concrete exemption evidence, not an independent-review claim.
- `required` before every R2 or explicitly requested review pass. Complete Owner Self-Check and Review Handoff, record current Result evidence and assessment, then set `required` and move to In Review before invoking `task-review`.
- `passed` only after that `task-review` pass reports no Critical Finding, no Concern, and no Unverified Risk that prevents Target verification, and the main Agent confirms an independent pass covered the current snapshot. The interaction owner records this value; the read-only Reviewer never writes task state or grants approval.
- `approved` only after an explicitly requested `adversarial-review` approves. R2 first completes mandatory `task-review` and identifies both outcomes; R0/R1 may enter Required → In Review → Approved directly, without an automatic ordinary pass.

When `task-review` finds a problem, return to In Progress, remediate it, refresh affected self-check, Result, assessment and verification evidence, set the gate to `required`, re-enter In Review, and invoke a new one-pass `task-review`. Check findings against actual artifacts rather than accepting suggestions mechanically. For a suspected false positive, supply observable counterevidence or authoritative constraints for the next fresh pass to verify; never remove an unresolved finding unilaterally or relabel it without evidence to obtain `passed`. Apply the Review tracking and stall guard below on every pass. Repeat without a fixed total round limit until the gate can be recorded as `passed`, the task becomes Blocked, or the user stops. Any relevant deliverable, Result or Queue graph change invalidates the assessment and terminal gate; refresh self-check and grading while preserving an existing independent-review obligation.

Independent adversarial review, a two-Agent Reviewer-Editor loop, and independent approval remain opt-in and run only when the user explicitly requests them. They do not replace the mandatory `task-review` pass.

### Review Assessment

The CLI owns exactly one `## Review Assessment` section with schema `task-review-assessment/v1`: Level, Current/Stale state, Reason, Snapshot, Evidence, R1's four grounds when applicable, and Task fingerprint. It retains the current classification, not a review transcript. Never hand-edit it or merge it into the finding ledger. All new terminal gates and completion require a current assessment; unchanged historical records remain readable without migration. The owner rechecks actual external content/evidence identity before recording a terminal gate and before completion.

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
- Resume only after the unblock condition occurs. Reset affected streaks to `0` only when new evidence demonstrates substantive progress; the core rejects resume while any ledger item remains at `no-progress=2`. Once a fresh pass resolves every blocking item, use `review <id> passed --resolve-ledger --snapshot <exact-reviewed-assessment-identity> --evidence <pass-and-resolution-reference>` to remove the ledger and record Passed atomically. This core-owned lifecycle write requires In Review, Required, a current task fingerprint and matching snapshot, and no stalled item; it clears Verification but preserves the unchanged assessment. The owner must verify the actual external content and every prior ID's resolution. Do not manually delete the resolved ledger then `sync`, which conservatively invalidates the assessment and would require another pass.

### Review Reports

Keep one persistent `## Review Reports` section, separate from the temporary `## Review` ledger. It is an append-only report index, not another finding ledger or source of task requirements. The owner saves each `task-review` pass to `tasks/artifacts/<task-id>/reviews/round-<NN>.md` and links it from this section. Use task-relative Markdown links in stored records; apply host path-display rules in chat.

- Choose the next unused number above both existing report filenames and index entries, including after resume or reopen; pad to at least two digits. Never overwrite or renumber a report. This artifact number is not the active ledger's `Pass` counter.
- Preserve the returned user-visible feedback, including findings, stable IDs, prior-item dispositions, checks actually performed, inherited evidence and coverage limits. Add a clearly separated owner header with task ID, round, review mode, actual run identity when available, and the reviewed snapshot. Keep owner conclusions distinct from Reviewer feedback. Never save private reasoning, full tool transcripts or secrets; explicitly mark any necessary redaction.
- Append one row per saved report: round, report link, reviewed snapshot and brief outcome (`findings`, `no blocking findings`, `incomplete`, or `invalidated by drift`). An infrastructure failure may have a diagnostic report, but must be labeled incomplete, never a completed review. Interrupted saves are recovered by checking the existing file against the returned output and appending the missing row, not overwriting it.
- The owner verifies the link resolves inside the owning task's reviews directory and the report's round/snapshot match its row. Before a terminal gate and completion, recheck the referenced current report and actual scope. A row or a file alone never proves independence or grants Passed.
- The index survives ledger resolution and completion. Only the active ledger tracks current finding state; historical reports retain what was observed in their own pass. Subsequent corrections or drift are appended as explicitly labeled owner notes, never silently rewritten into past feedback.
- Index-only bookkeeping does not require `sync`: the Task fingerprint excludes `Review Reports`, just as it excludes the temporary ledger. This exception never covers changes to Target, Scope, Plan, Result, active ledger, reviewed artifacts or substantive evidence; apply their normal invalidation and fresh-review rules. The core does not validate report files or their links; the owner does.

Example stored index:

```markdown
## Review Reports

| Round | Report | Snapshot | Outcome |
| --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/example-task/reviews/round-01.md) | sha256:<reviewed-content> | findings: TR-1 |
| 02 | [Round 02](../artifacts/example-task/reviews/round-02.md) | sha256:<revised-content> | no blocking findings |
```

Do not backfill untouched historical tasks or create an empty section for a skipped review. Standalone feedback without an owning task keeps its existing no-file behavior. Explicit adversarial-review retains its own report contract; this per-pass protocol does not add an approval loop.

### Verification

Run proportionate host-native checks yourself; the core never executes arbitrary commands. Record the current outcome with `verify <id> passed|failed --evidence <one-line observation>`. A failed check blocks completion. Re-run and replace verification after relevant changes.

### Block

Add only while Blocked, with `Reason` and observable `Unblock when`. Add the section before `status <id> blocked`. Resuming removes it. Use `cancel <id>` for a reversible soft stop; cancelled work is not completed and can resume.

## Completion

1. Write or refresh Task Summary against the actual task-owned changes, then `sync` and `check`. Self-check current requirements and supported per-Target Result evidence, run proportionate authorized preliminary checks, then record the actual result's R0/R1/R2 assessment. Prepare the mandatory review handoff for R2 or explicit ordinary review.
2. For R2, execute `required` → In Review → `task-review`, apply the existing per-finding stall guard and record `passed`. Explicit ordinary review also follows this route at any level; exemptions never cancel an existing Required obligation.
3. For R0/R1 without explicit or existing review obligations, record `skipped` with the current assessment's exemption grounds and remain In Progress. If the user explicitly requested adversarial review of that no-file result or an R1 result, enter Required → In Review and run it without a mandatory `task-review`, then record `approved`. For R2, explicit adversarial review runs only after `passed`; `approved` evidence names both outcomes.
4. After the final review decision, compare current content/evidence with the assessment snapshot and, if reviewed, the reviewed snapshot. Drift returns to self-check, assessment and any required fresh review. Rerun proportionate final verification and record it as passed because every assessment or review-gate write clears Verification. For `skipped`, do not invent an independent-review snapshot.
5. Confirm this session actually bound to the owning record through the host focus mechanism when it provides one; if binding failed or was unavailable, disclose that before completing.
6. Run `complete <id>`. This is the only route to Completed and fails closed on missing Targets, Results, review, verification, Block, stale review evidence, or unfinished Queue children.
7. Run `check <id>` and `validate` before delivery.

Do not retrofit untouched historical record bodies. All records share the new paths, while the stricter `Kind` metadata contract applies to new or reopened work.

## Maintainer Validation

Keep `evals/review_gate_cases.json`, the routing fixtures and `evals/review_stall_cases.json` aligned with the shared grading protocol, run authorized focused core/task tests, then run the built-in `$skill-quality` gate against this package. Quality failures block completion. Review warnings, but never delete or distort required workflow guidance merely to satisfy the initial-load budget.
