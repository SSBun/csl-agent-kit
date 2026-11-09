---
name: task
description: Create, resume, update, cancel, review, verify, and complete a canonical workspace task for one outcome. Use before every user-requested file creation, modification, move, rename, or deletion, even when trivial, and for any concrete non-trivial outcome. Activate and apply its Task Target protocol before substantive work; exploration proceeds without a generic confirmation. Skip only no-file simple factual answers and open-ended conversation without a concrete outcome.
---

# Task

Manage one outcome through the host Agent. Use the host's existing file, shell, research, and subagent capabilities; never launch nested `codex exec`, `pi --print`, a worker daemon, or an unattended supervisor.

## Required Runtime Protocol

所有用户可见回复均遵循共享协议的“用户可见文案边界”，不得附带内部流程说明块。

Resolve the collection root as the parent of this skill directory. Before forming, presenting, or accepting a Task Target, read `<collection-root>/csl-tasks/shared/protocols/task-target-alignment.md` in full and treat it as the authoritative detailed alignment contract. Read it again after resume or compaction when it is no longer present in context. If it is unavailable, stop before substantive work and report the missing runtime dependency.

This skill owns task activation, the single-outcome Target meaning, permitted lifecycle writes, and the post-alignment task workflow. The shared protocol owns all Task Target alignment semantics.

## Storage and Core

遵守[统一存储规范](../agent-migration/references/storage.md)。下列路径是目标布局；当前运行时尚未切换时，继续由原有 CLI 管理旧记录，不双写或手工搬移。旧项目仅通过显式请求的 `agent-migration` 切换，不能把文档更新当作运行时已支持。

- `.csl-agent-kit/tasks/tasks.md` is the newest-first index. It contains only title, current status, and a `tasks/<slug>.md` link.
- `.csl-agent-kit/tasks/tasks/<slug>.md` is the canonical record and is authoritative when the index disagrees.
- Use `node <collection-root>/csl-tasks/shared/scripts/csl-tasks.js --workspace <workspace> ...` for creation, state, parent-child, evidence, verification, completion, and index checks.
- Do not hand-edit status or index lines. After direct edits to Scope, Target, Plan, Decisions, Execution Log, Block, or the active Review ledger, run `sync <id>` and `check <id>`. For a non-Completed task, `sync` conservatively marks its assessment Stale, clears Verification, removes `Skipped`, and invalidates `Passed` or `Approved`; reopen a Completed task before changing its specification.
- Modify only the owning task and its exact index entry. Preserve unrelated task state and untouched history.

## Optional Topic Context

A task may bind to one persistent Topic through `topic`'s [storage contract](../topic/references/topic-contract.md). No binding is the normal independent-task path. Topic membership is separate from Queue Parent/Children and does not change Task Kind or grant execution permission. Load the `topic` Skill when the user names a Topic or the task has an explicit binding; do not infer membership from filenames.

Use `topic task <id>` to inspect the adopted revision and freshness on start/resume. A stale or unavailable Topic permits diagnosis and explicit adoption/repair, not dependent implementation or terminal completion. The shared CLI checks current normative content, pinned dependencies and the backlink at assessment, review, passed verification and completion. Read the adopted snapshot and current specification before impact analysis; `topic adopt` records the disposition and invalidates task evidence. Material requirement changes still require realignment. A Topic-maintenance task adopts its own final specification change before self-check; maintenance mode never authorizes product implementation against Archived or legacy Draft Topics. New Topics start Active, which does not grant execution authorization.

Create a new task for a new bug, enhancement or bounded review under the same Topic; reopen only under the existing same-outcome rules. Completing this task does not close the Topic. Keep Task Summary focused on actual component changes, not shared specification prose. Do not mutate a Completed task's formal binding without reopening, and do not detach to bypass a stale specification or required review. Listing that task as a Topic `history` row is different: it changes only the Topic, requires no reopen, and does not affect membership or evidence. Task records belong in the linked Tasks table, not Resources; reusable report artifacts may still be resource references.

## Task Artifacts

Persist a workspace-local task artifact only when the user requests a durable file or the task needs durable evidence that does not have a more authoritative project location. Use `.csl-agent-kit/tasks/artifacts/<task-id>/<category>/<name>` with the owning canonical task ID and create only the category that is needed:

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
- Activate it before substantive discussion, repository exploration, research, planning, delegation, implementation, or any focused target-forming clarification performed after the outcome exists. The shared alignment protocol's narrow, read-only lookup of an explicitly selected Topic to form an honest Target is also permitted; it is not general source exploration. For a requested file mutation, activation and—when the host provides one—an actually emitted `task_focus(<id>)` call must also precede the first requested deliverable edit. Before activation, allow only minimal user/project Memory index orientation, the minimal task index and candidate-record lookup needed to resolve ownership, and the one focused question permitted by the shared protocol when no honest Target yet exists.
- The lifecycle writes needed to create, resume, reopen, focus, sync, check, and align the owning task are the bootstrap exception to the first-edit rule; they do not authorize editing the requested deliverable.
- Start a new task for every independently acceptable user outcome in the main session.
- A delegated child must use the existing owning task named by the main session's current delegation packet. It must not create another task, present a user-facing checkpoint, or invent broader ownership; missing or out-of-Plan delegation returns to the main session under the shared protocol.
- Reopen an existing task only when the request directly corrects, completes, or re-verifies the same outcome and leaving its Target or Result unchanged would be misleading.
- When the user explicitly asks to execute an implementation-ready plan, resume that plan's exact record; the `task-plan` to `task` phase transition alone does not create new ownership.
- Component, file, topic, or implementation overlap alone does not establish ownership. Create a new task when ownership is ambiguous.
- Skip records only for simple factual answers and open-ended conversation that request no file mutation and establish no concrete outcome, read-only trivial deterministic operations, and background Memory maintenance that is not itself the requested deliverable.

## Start or Resume

1. Load the small user/project Memory indexes under `agent-memory`, then read only the newest task index entries and plausible candidate owning records needed to resolve ownership. Do not read task-specific memory bodies, inspect task-direct sources, or begin substantive discussion yet. If memory is unavailable, disclose the limitation and use authoritative sources after alignment; never recreate the retired knowledge stores.
2. For a new task, choose a lowercase kebab-case ID and run:
   `create <id> --title <title> --kind task --target "T1: <observable condition>"`.
   Repeat `--target` for additional conditions. If the request cannot support any honest observable Target, ask one focused question; create the record as soon as the answer establishes the outcome.
3. Run `resume <id>` for new, Pending, Blocked, or Cancelled work. Use `reopen <id>` only for the same completed outcome; add the next Target ID before continuing.
4. Immediately after creation, resume, or reopen succeeds, emit the real host tool call itself—for example, `task_focus(<id>)`—in the same reply as the lifecycle command; treat both calls as one atomic batch. Planning or listing `task_focus` without emitting it does not satisfy this step. If binding fails (for example, the record lives outside the session workspace), disclose that failure explicitly instead of silently skipping.
5. Apply the shared Task Target Alignment Protocol to the active record. For this workflow, the conversational Target means the intended outcome and observable completion condition; before alignment, the permitted lifecycle writes are create, resume, reopen, focus, sync, and check. Classify the current authorized work before inspecting task-direct sources: standalone exploration uses the protocol's `continue_exploration` exemption without displaying a confirmation block or waiting; implementation follows its normal gate. A main session owns user-facing gates; a delegated child validates the main session's packet and either continues the named task or returns to the main session without prompting the user. When resuming a plan for implementation, an explicit request to execute supplies execution authorization; reuse a recoverable, materially equivalent accepted implementation Target when available, otherwise perform its first implementation checkpoint. Prior exploration alone is not Target acceptance.
6. After the protocol aligns the current Target, read relevant Markdown memory with ordinary file tools, apply applicable experience and verify decision-changing claims against authoritative sources. On resume, read the current Plan, Decisions, Execution Log and applicable Result/Block, then reconcile them with actual artifacts before choosing the next action; follow Execution Log's recovery boundaries below. Apply Capability Preflight below before work that depends on those capabilities.
7. Add or refine only the substantive Scope, Target, and Plan content now supported, then `sync` and `check` before execution continues.

## Capability Preflight

During preparation, check only capabilities the accepted outcome visibly depends on, before investing in dependent edits. Reuse current session evidence and authorization; do not ask again for an already authorized check or an accepted in-scope exception.

- Confirm required runtime resources, artifact access and host operations are actually available. Inspect the relevant tool schema or a safe read-only observation; a Skill naming a tool does not make it available. Use an authorized non-destructive probe only when needed to resolve material uncertainty.
- Identify the checks needed to establish the Targets, their prerequisites and whether current instructions permit running them. Discovery is not execution permission. If required verification is unavailable, preserve that limitation instead of promising a verified result.
- For an explicitly requested review or an outcome that clearly needs independent review, check fresh-context dispatch, actual read-only tool restrictions, and access to the reviewed artifacts. Also confirm a usable evidence/report persistence path. A prompt alone is not isolation; do not launch a placeholder review or treat capability discovery as a completed pass.

Record only material missing prerequisites and the next action/input in the existing Plan. Continue useful independent authorized work within the current task or active Queue child, without skipping a Blocked child or starting a later child. When a missing capability prevents the current outcome, use the existing Block contract with the exact failure and observable recovery condition; return delegated blockers to the owner. Never obtain a lower risk grade, weaken required checks, or invent permission to work around a missing capability. An accepted exception applies only to its authorized scope and never changes the default requirement.

This check is provisional: classify the actual result after self-check and recheck relevant capabilities when the host, scope or verification needs change. It does not replace final verification or the real mandatory review. For planning-only work, record unavailable future execution prerequisites in the handoff; they do not Block an otherwise complete plan unless they prevent a necessary planning decision or its verification.

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
3. Record supported Result evidence and perform the mandatory [Self Assessment](#self-assessment), then classify the actual result and record its Review Assessment. When a pass is required, prepare the factual packet and Reviewer prompt in [Review Workflow](../task-review/references/review_workflow.md). Include recoverable original requirements and accepted constraints, actual artifacts/diff, content identity, allowed checks, known limitations, and per-Target evidence references. Exclude author defense and desired verdicts. Reuse Result and existing evidence carriers; do not create a self-check report, second ledger, or new task state.
4. Stop editing the review scope while the Reviewer runs. Bind the pass to actual content: an exact revision for clean Git artifacts; for dirty workspaces also identify relevant staged, unstaged, untracked, deleted, and renamed content, not merely HEAD or filenames. Use content identities for non-Git artifacts. Check the same scope again before accepting feedback and before completion.
5. Any relevant content, requirement, or evidence drift invalidates the pass: return to In Progress, refresh self-check, assessment and the packet, and dispatch a fresh pass under Required. Do not reuse an old no-findings response. If the reviewed snapshot cannot be established, report the blocking evidence gap instead of recording Passed.

After each dispatched pass returns, the owner persists its feedback and appends the Review Reports index before acting on the findings or recording a terminal gate. The Reviewer stays read-only. Report persistence is owner bookkeeping, not a new review pass or approval. If saving or linking fails, preserve the returned output, stop the terminal transition and record the concrete recovery condition; never fabricate a saved report.

A mandatory pass requires an actual fresh, read-only subagent; a prompt saying “be independent” or a Markdown template is not isolation. If it is unavailable or fails, preserve self-check evidence, report the exact failure and run/workspace state, and Block with an observable recovery condition. Do not substitute inline self-review or silently switch execution modes. Infrastructure failures do not increment finding no-progress streaks. Follow stricter host failure/retry rules.

The core validates assessment structure, level/gate consistency, task-record fingerprint and evidence text. Managed evidence also receives the mechanical checks below; semantic risk, actual subagent isolation, check execution and complete scope remain the host and main Agent's responsibility.

For explicit workspace-local file scopes, use `snapshot <id> --file <relative-path> [--file ...]` before assessment. The returned `snapshot:...#<sha256>` identity pins an immutable manifest of file bytes and each named file's Git HEAD/index identity, including tracked deletions. Include both paths of a rename and every relevant source or evidence file; the command does not discover omitted scope, follow symlinks, run checks, or capture unstaged permission changes. Keep non-workspace and no-file identities owner-attested. Reusing an identical manifest is safe; a changed scope creates a new identity rather than overwriting evidence.

`check-evidence <id>` checks managed snapshots and registered reports without changing state. Managed snapshots are also rechecked at terminal review, passed verification and completion, including repeated identical writes. The result distinguishes mechanical checks from owner-attested semantic review. Plain-text historical identities remain readable and owner-attested; `--include-legacy` explicitly checks historical report links without migrating them. Passing structural `check` or `validate` alone never proves external evidence or the Target.

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

Keep the Plan current rather than appending execution history. Do not maintain the former `Current artifacts:`, `Next action:`, or `Required input:` recovery bullets; use Execution Log for significant events, and Plan/Block for current dependencies and blockers. Historical bullets remain readable without migration.

### Execution Log

Maintain one `## Execution Log` in the owning record once a meaningful event occurs. Append concise entries in chronological order with a stable increasing ordinal and a short event title, for example `### 001 — Shared-layer decision`. Use short factual paragraphs, not checkboxes or mandatory per-entry fields. Do not create an empty section or invent earlier events when resuming a historical task.

- Append promptly after a decision-changing discovery, material decision, meaningful execution result, direction change, or interruption fact becomes known; do not wait until handoff or completion. Routine reads, commands, unchanged checks and every tool call do not warrant entries.
- Record what was established or actually done, its concise rationale and relevant scope, and any unfinished or unknown outcome that changes how work can safely continue. Distinguish proposed, attempted, completed and verified actions; link authoritative artifacts or evidence when useful rather than copying them. An attempt is not proof of success.
- Record user-visible decision summaries and supporting facts, never private reasoning, role transcripts, secrets or full tool logs. Do not duplicate full Result evidence or review reports.
- Correct or supersede an earlier entry by appending an explicit reference to its ordinal; do not silently rewrite history. Keep the current Plan, Decisions, Scope and Target consistent through their normal update and alignment rules. A log entry cannot amend requirements or grant authorization on its own.
- Before a controlled pause, append only material unrecorded facts about the actual stopping point, unfinished work or unknown results. Unexpected interruption may prevent the latest event from being recorded; never promise a complete trace or infer that an unlogged action did not occur.

On resume, read the log together with current Plan/Decisions, Target, Result and Block, and recheck actual artifacts and relevant external state. Resolve superseded entries and discrepancies before dependent work. The last entry is historical evidence, not a trusted current state, resume cursor, permission or completion claim. An unknown external action outcome must be checked before retrying; do not assume success or safely repeat it from an absent entry. Missing logs remain valid for historical records; recover from existing evidence and append only newly established events.

Execution Log is ordinary task content included in the review fingerprint. After edits, run `sync` and `check`; it has no append-only bookkeeping exemption. Finish pending log updates before self-check and assessment, and freeze the log with the reviewed scope. Do not append during review or after final verification without refreshing affected evidence, assessment and any required fresh review. Review feedback and terminal lifecycle observations stay in Review Reports, Result and Verification rather than being duplicated as log entries that invalidate their own gates.

Use `show <id>` without `--json`, or read the canonical file, to retrieve the full log. The existing JSON `recovery` projection remains a legacy reader of old Plan bullets and Block facts, not an Execution Log summary. Do not infer progress from it or backfill untouched records.

### Topic

Only for an associated task, keep one CLI-owned `task-topic/v1` section with Reference, Repository identity, adopted Revision, Applies scope and implementation/maintenance Mode. Use `topic attach`, `detach` or `adopt`, never hand-edit a binding or digest. The section participates in the task fingerprint. Topic Adoption is the current impact-disposition note, not approval evidence or another task status. The Topic contract defines cross-workspace permission, optimistic versions and partial-link repair.

### Task Summary

Before completion, write exactly one `## Task Summary` section describing only the code or components actually changed by this task. Use a separate short paragraph per changed component, led by its **component name**, followed by its component-root directory link and a concrete description of what changed. Use the highest directory that still identifies the component; do not collapse unrelated components into a repository-wide label or enumerate internal files and subfolders. Qualify components by project when more than one project was modified. For a standalone root-level file with no meaningful component directory, link that file instead.

Keep all paragraphs under this single heading, without subheadings, checkboxes, or fixed decision/verification/next-step fields. Do not repeat Target, Plan, Decisions, Result evidence, or Verification. Include only actual task-owned changes, not inspected or merely related components, proposals, or pre-existing unrelated edits. When there are no code or component changes, use one short factual sentence saying so; lifecycle record updates alone are not component changes.

Write or refresh the summary before self-check and review assessment, compare it with the actual task-owned changes, then run `sync` and `check`. A later summary change follows normal evidence invalidation; never append it after final verification without refreshing the affected gates. On resume or reopen, update the same section rather than adding another. Leave untouched historical records unchanged. This is an Agent-authored record requirement, not a new CLI-generated field or automatic diff inventory.

### Self Assessment

Automatically evaluate every task's actual result without waiting for a user reminder. This is the owner's evidence-based reflection, not independent review or a new approval gate. Write exactly one `## Self Assessment` with exactly three rows: `Simplicity`, `Stability`, and `Completeness`; use columns `Dimension`, `Grade`, `Basis and evidence`, and `Limitations`. Localize dimension labels and prose to the user's language. Reference existing Result evidence or durable observations instead of copying logs; do not cite future checks as completed evidence.

Use only **S**, **A**, **B**, or **C**, ordered from strongest to weakest. Assign the highest grade whose entire dimension-specific condition is supported. Each row needs a concrete reason, evidence and specific limitations, including what is missing and its consequence; state when no material gap is known. Do not use numeric scores, N/A, percentages, averages, weighted totals or an overall grade. Grades describe the checked scope, never a probability or a guarantee of no defects.

| Grade | Shared meaning | Required response |
| --- | --- | --- |
| S | Requirements are fully satisfied and the relevant critical risks are appropriately verified. | Eligible for delivery only when the existing completion gates also pass. |
| A | Requirements are satisfied with only explicit, non-critical limitations. | Eligible for delivery under the existing gates; disclose the limitations. |
| B | The result is partly supported but has a substantive gap or lacks critical evidence. | Continue remediation or obtain evidence; do not claim full completion. |
| C | A core requirement is unmet or a serious problem is demonstrated. | Correct the result; do not claim completion. |

**Simplicity** evaluates whether the complete problem is solved with the least necessary complexity, not the fewest lines. Necessary validation, security controls and compatibility handling are not excess complexity.

| Grade | Simplicity criterion |
| --- | --- |
| S | Directly solves the problem, reuses suitable existing capabilities, and has no identified unnecessary abstraction, dependency or change. |
| A | The approach is direct and clear, with only minor local redundancy that does not materially increase comprehension or maintenance cost. |
| B | Avoidable duplication, indirection or overengineering materially increases maintenance cost. |
| C | The approach bypasses the root cause or introduces disproportionate complexity and needs redesign. |

**Stability** evaluates reliability and preservation of existing behavior, including crash, exception, data-integrity, security, compatibility and regression risks. For documents, workflows and no-file answers, evaluate contradictions, misleading conclusions and downstream execution risk; no runtime change does not automatically earn S.

| Grade | Stability criterion |
| --- | --- |
| S | Normal behavior, critical boundaries and relevant regression risks have appropriate verification, with no known material risk. |
| A | Main behavior and critical risks are verified; remaining uncertainty is bounded and non-critical. |
| B | A critical path, boundary or compatibility behavior lacks evidence, or a substantive risk remains unresolved. |
| C | A crash, data-loss or integrity problem, security failure, or important behavioral regression is demonstrated. |

A successful build alone does not establish Stability. No particular check type is mandatory solely for a grade: use proportionate, authorized evidence that covers the actual risks. Do not run unauthorized tests or claim unrun checks passed.

**Completeness** evaluates delivery of the user's effective requirements, Targets and preserved boundaries, not merely implementation steps. Include necessary entry points, configuration, integration and deliverables; do not invent extra work to earn S.

| Grade | Completeness criterion |
| --- | --- |
| S | Every agreed requirement and necessary supporting item is delivered, and all observable acceptance conditions are confirmed. |
| A | The core result and necessary supporting items are delivered; only non-critical finish work outside required acceptance conditions remains, without affecting use. |
| B | Part of the result exists, but a necessary entry point, configuration, integration, deliverable or acceptance evidence is missing. |
| C | The core result is not implemented or materially differs from the user's goal. |

Missing critical evidence caps the affected dimension at B; a demonstrated C condition takes precedence. Unknown is not passed. Never raise a grade to permit completion or let a strong dimension compensate for a weak one. Any B or C requires further work or an honest Block under the existing workflow; S/A never waives a failed Target, missing required evidence or required review. If reflection reveals a known defect, remediate or Block rather than handing known unfinished work to review. Grades alone do not select R0/R1/R2 or waive an existing review obligation; do not include owner grades as persuasive evidence in a Reviewer packet.

Write or refresh this section after owner self-check and supported Result observations, **before** Review Assessment and any independent pass, then `sync` and `check`. It is ordinary task content covered by the existing fingerprint, not an excluded bookkeeping section. Freeze it during review. After final verification, compare the current result with the scorecard: if unchanged, complete without rewriting it; if a grade, basis or limitation needs revision, return to In Progress, refresh the section and affected Result evidence, `sync`/`check`, then renew assessment, any required fresh review and final verification before completion. Do not append self-assessment to a Completed record. On reopen, replace the same section based on the new result; leave untouched historical records unchanged.

This applies to R0/no-file results, normal `complete`, low-risk `finalize`, Queue children and the parent's own integrated result. The parent evaluates its own integrated result, never combines child grades into an aggregate or claims child changes as parent-owned. For R0/no-file work, Simplicity may be S when no deliverable change was needed and none was made; omitted necessary work does not qualify. Stability and Completeness still require evidence about the actual answer and its consequences. A Pending planning-only handoff does not grade the unimplemented outcome; execution of that same record later uses this contract.

Keep all three grades, their evidence and limitations in the canonical task record. Do not display self-assessment grades or scorecards in user-facing replies, including completion handoffs, unless the user explicitly requests them. Still report material verification results, risks, limitations and unfinished work without attaching grades. For delegated or Queue child work, return the handoff to the owner, not as a separate user interruption; the owner preserves each child's record and keeps the parent's integration scorecard in its owning record under the same display policy. This is a mandatory Agent workflow requirement, not a CLI-enforced presence or score validator: `complete` and `finalize` do not mechanically reject a missing scorecard. Do not claim static checks prove real Agent adherence or scoring quality.

### Result

The core records one evidence line per Target. Evidence must name what was checked, how, and the observed result. Update evidence when it becomes stale; changing a Target or relevant deliverable invalidates verification.

Keep the full observation in Result once. Assessment and closing evidence may reference those Target IDs or the same durable evidence, adding only their distinct grounds and current-content checks. A reference reduces repetition; it never supplies missing evidence or proves that a new final check ran.

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

Keep one persistent `## Review Reports` section, separate from the temporary `## Review` ledger. It is an append-only report index, not another finding ledger or source of task requirements. Save returned feedback with `review-report <id> --input <feedback-file> --snapshot <assessment-identity> --outcome <outcome> --mode <actual-mode> [--run <run-id>]` while In Review/Required. Outcomes are `findings`, `no blocking findings`, `incomplete`, or `invalidated by drift`; modes are `independent subagent`, `non-independent self-review`, or `incomplete`. These are owner attestations, never proof of independence or approval. The CLI allocates the next report number across files and index rows, preserves feedback bytes under an owner header bound to the assessment snapshot and Task fingerprint, and registers its SHA256 with the owning task in one locked, rollback-capable write. It does not provide a cross-file crash transaction. Use task-relative Markdown links in stored records; apply host path-display rules in chat.

Reports remain at `.csl-agent-kit/tasks/artifacts/<task-id>/reviews/round-<NN>.md`; the CLI adds the index's schema and digest column when registering the first managed report.

- Choose the next unused number above both existing report filenames and index entries, including after resume or reopen; pad to at least two digits. Never overwrite or renumber a report. This artifact number is not the active ledger's `Pass` counter.
- Preserve the returned user-visible feedback, including findings, stable IDs, prior-item dispositions, checks actually performed, inherited evidence and coverage limits. Add a clearly separated owner header with task ID, round, review mode, actual run identity when available, and the reviewed snapshot. Keep owner conclusions distinct from Reviewer feedback. Never save private reasoning, full tool transcripts or secrets; explicitly mark any necessary redaction.
- Append one row per saved report: round, report link, reviewed snapshot, outcome and SHA256. The managed index uses `task-review-reports/v1`; existing rows are retained as `legacy`, not retroactively certified. Legacy prose prevents automatic migration; preserve those notes outside this index before retrying. An infrastructure failure may have a diagnostic report, but must be labeled incomplete, never a completed review. Recover an already saved managed report with `review-report <id> --existing-round <NN>`; it checks the header and current assessment before adding the missing row, never overwriting the file. Compare recovered feedback with the actual returned output before relying on it.
- The owner verifies the link resolves inside the owning task's reviews directory and the report's round/snapshot match its row. Before a terminal gate and completion, recheck the referenced current report and actual scope. A row or a file alone never proves independence or grants Passed.
- The index survives ledger resolution and completion. Only the active ledger tracks current finding state; historical reports retain what was observed in their own pass. Subsequent corrections or drift are appended as explicitly labeled owner notes, never silently rewritten into past feedback.
- Index-only bookkeeping does not require `sync`: the Task fingerprint excludes `Review Reports`, just as it excludes the temporary ledger. This exception never covers changes to Target, Scope, Plan, Result, active ledger, reviewed artifacts or substantive evidence; apply their normal invalidation and fresh-review rules. The core checks registered report bytes, paths and header/index correspondence. With a managed snapshot or report index, Passed requires the latest report matching both the current snapshot and Task fingerprint to attest an independent pass with no blocking findings; R2 Approved retains that ordinary-pass requirement. The owner still verifies reviewer independence, actual coverage and substantive conclusions.

Example stored index:

```markdown
## Review Reports

- Schema: task-review-reports/v1

| Round | Report | Snapshot | Outcome | SHA256 |
| --- | --- | --- | --- | --- |
| 01 | [Round 01](../artifacts/example-task/reviews/round-01.md) | <assessment-identity> | findings | <report-digest> |
| 02 | [Round 02](../artifacts/example-task/reviews/round-02.md) | <assessment-identity> | no blocking findings | <report-digest> |
```

Do not backfill untouched historical tasks or create an empty section for a skipped review. Standalone feedback without an owning task keeps its existing no-file behavior. Explicit adversarial-review retains its own report contract; this per-pass protocol does not add an approval loop.

### Verification

Run proportionate host-native checks yourself; the core never executes arbitrary commands. Record the current outcome with `verify <id> passed|failed --evidence <one-line observation>`. A failed check blocks completion. Re-run and replace verification after relevant changes.

### Block

Add only while Blocked, with `Reason` and observable `Unblock when`. Add the section before `status <id> blocked`. Resuming removes it. Use `cancel <id>` for a reversible soft stop; cancelled work is not completed and can resume.

Keep the required user input or external condition explicit. Neither an Execution Log entry nor navigation showing Block facts establishes that the unblock condition has occurred; recheck it before resuming.

## Completion

1. Before self-check, verify any memory used against the task's actual changes and authoritative sources. Preserve confirmed decisions and observations in the owning task for the background Memory Agent; do not make routine memory extraction or writes a foreground completion duty. Finish pending Execution Log updates and write or refresh Task Summary against the actual task-owned changes, then `sync` and `check`. Self-check current requirements and supported per-Target Result evidence, run proportionate authorized preliminary checks, write the mandatory Self Assessment and `sync`/`check`, then record the actual result's R0/R1/R2 assessment. Prepare the mandatory review handoff for R2 or explicit ordinary review.
2. For R2, execute `required` → In Review → `task-review`, apply the existing per-finding stall guard and record `passed`. Explicit ordinary review also follows this route at any level; exemptions never cancel an existing Required obligation.
3. For R0/R1 without explicit or existing review obligations, record `skipped` with the current assessment's exemption grounds and remain In Progress. If the user explicitly requested adversarial review of that no-file result or an R1 result, enter Required → In Review and run it without a mandatory `task-review`, then record `approved`. For R2, explicit adversarial review runs only after `passed`; `approved` evidence names both outcomes.
4. After the final review decision, compare current content/evidence with the assessment snapshot and, if reviewed, the reviewed snapshot. Drift returns to self-check, assessment and any required fresh review. Rerun proportionate final verification and record it as passed because every assessment or review-gate write clears Verification. For `skipped`, do not invent an independent-review snapshot. Recheck Self Assessment against these final observations; any needed revision follows its normal evidence-invalidation and fresh-review rules before completion.
5. Confirm this session actually bound to the owning record through the host focus mechanism when it provides one; if binding failed or was unavailable, disclose that before completing.
6. Run `complete <id>`. This and the low-risk `finalize` path are the only routes to Completed; both fail closed on missing Targets, Results, review, verification, Block, stale review evidence, or unfinished Queue children.
7. Run `check <id>` and `validate` before delivery.

Do not retrofit untouched historical record bodies. All records share the new paths, while the stricter `Kind` metadata contract applies to new or reopened work.

### Low-Risk Completion in One Write

For an In Progress R0/R1 task without an explicit or existing review obligation, `finalize` combines Result, assessment, Skipped, final Verification, Completed and the index in one locked, rollback-capable operation:

```text
finalize <id> <R0|R1> --result "T1: <checked observation>" [--result ...]
  --reason <grading-ground> --snapshot <current-identity> --evidence <self-check-reference>
  [R1: --clarity <ground> --impact <ground> --risk <ground> --verification <ground>]
  --final-verification <current-final-check-observation>
```

First finish Execution Log and Task Summary maintenance and perform the authorized self-check. Write Self Assessment from the actual observations supplied through `--result` (do not claim they are already persisted), then `sync`/`check`, freeze the deliverable scope, and perform the final content comparison including the scorecard. If that comparison changes its basis, refresh the scorecard and checks before `finalize`. Supply every Target exactly once, all required grading grounds, and an actual final-check observation. Reuse Result references where sufficient rather than repeating their prose. The command does not run those checks or choose the risk level; it rechecks managed evidence before committing the complete state. Missing evidence, drift, unfinished Queue children, an active Block/ledger, or an existing review obligation rejects the operation. New contents and recovery copies are prepared before replacing destinations, and the terminal task is committed last. Failed commits restore originals without rewriting their contents. If the filesystem also refuses restoration, preserve recovery copies and report exact unrecovered paths; never claim rollback succeeded. This is not a cross-file crash transaction.

If review was explicitly requested, record Required and use the normal review path; the core cannot infer a conversational obligation. R2 always uses that path. The separate lifecycle commands remain available. After successful `finalize`, run `check` and `validate`; do not repeat assessment/review writes that would invalidate the recorded final verification.

## Maintainer Validation

Keep `evals/self_assessment_cases.json` aligned with the Self Assessment contract; these are manual or authorized Agent-replay cases, not evidence of executed behavior. Keep `evals/review_gate_cases.json`, the routing fixtures and `evals/review_stall_cases.json` aligned with the shared grading protocol, run authorized focused core/task tests, then run the built-in `$skill-quality` gate against this package. Quality failures block completion. Review warnings, but never delete or distort required workflow guidance merely to satisfy the initial-load budget.
