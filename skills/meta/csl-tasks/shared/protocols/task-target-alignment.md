# Task Target Alignment Protocol

This host-neutral runtime contract is the sole detailed authority for Task Target readiness, Authorization Ledger construction, semantic equivalence, L0-L4 guard levels, presentation, confirmation, revision, realignment, and the independent Safety Overlay across `task`, `task-plan`, and `task-queue`. It is not a Skill and must not participate in Skill discovery or routing.

## Loading

Each consuming Skill must resolve the collection root, read this file in full before forming, presenting, or accepting a Task Target, and read it again after resume or compaction when it is no longer present in context. The consumer owns when to invoke the protocol and what its workflow-specific Target means.

If this file is missing or unreadable, stop before substantive work and report the missing runtime dependency. Do not reconstruct the contract from memory or a consumer summary.

## Confirmation Modes

Resolve the runtime mode **before** selecting any L0-L4 level. `confirm` is the default and retains the complete graded confirmation procedure below. `solo` (display name **SOLO**) takes a separate execution path: bypass the entire L0-L4 second-confirmation grading procedure, not just its L2 wait. This applies to `task`, `task-plan` and `task-queue`; workflow scope and quality gates do not change.

### Configuration

- Precedence is session > project > global > default `confirm`. New values are `solo`, `confirm`, or `inherit`; `inherit` removes only that override. Explicit `confirm` overrides lower SOLO. Existing stored `autonomous` values are read as `solo` without rewriting files; new writes use `solo`. Never bulk-migrate user settings merely to rename the mode.
- The shared resolver is `../lib/task-mode.js`; the CLI is `../scripts/task-mode.js` (`--help`). Files live under `CSL_AGENT_KIT_HOME` or `~/.csl-agent-kit`: global `settings.json`, project `projects/<canonical-workspace-hash>/settings.json`, session `sessions/<host-workspace-session-hash>/settings.json`. Project preferences are user-local, not repository-provided authorization. Never invent host/session identity or reuse another session's override.
- The shared `task-mode` Skill queries and changes the same settings. Pi also exposes `/task-mode [show | <session|project|global> <confirm|solo|inherit>]` and `/csl-settings`. Pi's Contract Hook rereads with the actual identity before each agent turn, including resume. Native Codex/Claude Hooks resolve at SessionStart (including resume/compact); after a mid-session change, explicitly query with the actual identity or restart/resume before relying on it. Without session identity, label a read project/global-only, not current-session effective state. Missing files inherit; invalid/unreadable participating configuration forces `confirm` with a diagnostic, never stale SOLO.
- Only an explicit user configuration request may change a scope/value. Never enable SOLO to escape a hold. Querying or switching mode is not an execution request, does not resume an old X batch, and does not fabricate user acceptance or authorize unrelated work.

### SOLO execution path

1. Establish the user's requested final result, scope, explicit constraints and available authorization. Activate/focus a task when the selected workflow requires one. Display the complete Task Target, then proceed in the same turn using `continue_solo`; do not select an L-level, render a confirmation footer, or end the turn just to obtain another command. A factual request that needs no task remains a direct answer.
2. Drive toward the final result without asking for operational choices the Agent can make. Inspect evidence, choose reasonable bounded defaults within the request, state material assumptions, implement, verify and remediate. Initial Targets, revisions, graph changes and missing prior Target-acceptance evidence do not create a second-confirmation checkpoint. Keep progress recoverable; do not claim `accepted_target` merely because SOLO was enabled.
3. Skip **framework/SOP confirmation-only pauses**, including Task checks, external publication/deployment confirmation, X post/reply or batch confirmation, and a step labeled Safety Confirmation. Show the action, affected object and consequence as a notice and continue. A SOP's generic requirement to ask is not itself an explicit user pause. Preserve actual scope: user-authorized composition and publication can proceed without approval of each draft; drafting-only does not authorize publishing, and a finite batch does not authorize another batch.
4. Resolve missing operational details from authoritative evidence or bounded defaults instead of invoking L3/L4. Do not invent user facts, credentials, identity, permission or an expanded outcome. When a required fact/authorization genuinely cannot be established, complete unaffected work and report the concrete blocker and minimum missing input; do not issue a generic approval question or silently substitute a different goal. An unnecessary out-of-scope improvement is omitted, not escalated as an excuse to pause the whole task.
5. Retain **substantive safeguards and independent limits**: actual user instructions to pause/check first, host/tool approvals, higher-priority safety constraints, account/target identity checks, privacy, duplicate-send prevention, platform limits, authentication and verifiable success. A safety label alone is not a blocker, but a demonstrated wrong account, uncertain send result, missing credential or platform restriction is; do not bypass these to reach a count. Perform bounded safe recovery when possible and report unresolved blockers honestly.
6. Delegated work keeps its scope packet and returns missing coverage or independent boundaries to the main owner. Internal handback is not a user checkpoint; the owner continues under SOLO when it can resolve the issue within authorization. Neither child nor owner may expand permission. Keep R0/R1/R2 result review, required independent review, stall protection, task records, self-check and final verification; these are not Task second-confirmation levels.

Switching to `confirm` restores its graded confirmation procedure at the next resolution boundary. Past SOLO work is not reusable user acceptance. Existing confirm-mode evaluation cases remain unchanged; SOLO cases use `continue_solo` with no L-level, an actual resolved `solo` mode/source, the requested result and scope, and any independently evidenced blocker. The old `continue_autonomous` label is superseded, not a second runtime action. Do not persist mode decisions or acceptance flags in canonical task core.

## Purpose

Task Target gives the user a second look at the Agent's understanding of their goal before substantive work that requires a checkpoint. Exploration-only work uses the exemption below. Outside that exemption, authorization self-checking establishes that a candidate is faithful enough to present; it does not establish that the user has checked that understanding. A detailed request, complete authorization coverage, or high model confidence never substitutes for the first non-trivial goal checkpoint.

## Exploration Without a Target Checkpoint

In `confirm`, continue authorized exploration without displaying a confirmation block or waiting for a generic Target acceptance. Exploration means the current deliverable is information: source inspection, search, research, analysis, comparison, recommendations, or a plan for later implementation. Canonical task/plan records and an explicitly requested findings report are permitted outputs; product code, operational configuration, and other implementation deliverables remain read-only. Classify the authorized work and candidate commitments, not a task title or the word “explore”. A request to investigate **and fix** is an implementation request and retains its normal checkpoint.

- Activate/focus the owning task as usual and retain its observable Target, scope, evidence and applicable quality gates. Apply the Authorization Ledger and equivalence checks; the exemption removes the generic goal-recheck pause, not scope checks. A brief explanation of the investigation is optional and does not create a checkpoint.
- Once the candidate is ready and equivalent, the main session uses `continue_exploration` with no L-level. Do not require prior accepted-target evidence. Resume/compaction, in-scope changes to the investigation plan, and optional display of the exploration objective do not create a new confirmation pause. Load relevant Context/Lessons and investigate immediately after selecting this path; selecting it satisfies the workflow's alignment step.
- Clarify only a user-owned decision that actually blocks useful, correct exploration (L3). Do not ask the user for facts sources can establish. A proposal that adds, omits, weakens or changes a commitment still uses L4; prefer omitting an unnecessary out-of-scope action and completing the requested investigation. An explicit user instruction to pause/check first still uses the applicable hold, including L2 `user_requested`; the exemption never clears an independent safety, host or higher-priority boundary.
- Before implementation or an external action outside the authorized exploration, stop at that boundary. Obtain an execution request when absent, then apply the normal implementation L1–L4 procedure before implementation research, planning, delegation or edits. Exploration and its task-record writes do not create `accepted_target` evidence. A later request to execute the plan normally requires the first implementation L2 checkpoint; only a recoverable user acceptance of the complete, materially equivalent implementation Target can be reused.
- A delegated exploration keeps its complete scope packet and uses `continue_delegated` or `return_to_main`, not a child-facing checkpoint. The main Plan may authorize exploration without having been accepted through a generic Target check; the packet does not authorize implementation.

The evaluation input's `workType` (`exploration` or `implementation`) describes the current authorized work, including a plan's read-only phase. It is not an assertion that a candidate is in scope: compare all commitments and messages before allowing `continue_exploration`. Do not persist this classification or confirmation state in task core.

## Current User Authorization

Current user authorization consists only of:

- the originating request;
- focused clarification answers;
- explicit user additions or revisions; and
- a previously accepted Task Target.

When those expressions conflict, the later explicit user expression wins. Agent assumptions, implementation convenience, repository discovery, unaccepted proposals, and inferred preferences are not authorization.

### Authorization Ledger

Before choosing a guard level, create a compact session-local Authorization Ledger. Give each explicit commitment a temporary stable ID and one type:

- `outcome`;
- `done_conditions`;
- `scope`;
- `preserved_behavior`;
- `compatibility`;
- `side_effects`; or
- `tradeoffs`.

Record the normalized meaning and source message for each atom. Project the candidate Target from this Ledger rather than freely elaborating it:

- Outcome comes only from outcome atoms.
- Every explicit acceptance atom maps to at least one Done when item.
- Explicit exclusions, preservation, compatibility, and side-effect limits remain visible in Boundaries or acceptance conditions.
- Quantifiers and strong terms such as `all`, `only`, exact thresholds, and `must not` cannot be invented or weakened.
- Agent-selected files, algorithms, counts, commands, and verification methods remain in Plan or execution, not Target commitments.

For every candidate atom, classify its relationship to authorization as `preserve`, `add`, `omit`, `weaken`, `change`, or `unknown`.

Material equivalence is bidirectional. Both counterfactuals must be false for `preserve`:

- If the candidate can be satisfied while current authorization remains unsatisfied, it omits or weakens a commitment.
- If the user can accept current authorization yet reasonably reject the candidate, it adds or changes a commitment.

`unknown` cannot mean generic model uncertainty. Name the exact atom and a plausible counterfactual difference. If such a difference exists, treat the candidate as materially different. If no concrete semantic difference can be stated, do not escalate merely because confidence is low.

### Authorization Sources and Goal Acceptance

After material equivalence passes, classify each candidate commitment's authorization basis:

- `direct_user`: the user explicitly supplied this result, condition, or boundary in the current request or a focused answer/revision. This authorizes the content, not the Agent's later interpretation of it.
- `accepted_target`: recoverable user acceptance of a previously displayed Target covers this commitment in the same task scope or an explicitly delegated scope.
- A user-owned ambiguity or a concrete commitment difference still uses L3 or L4. Wording, formatting, mechanical restatement, or generic low confidence alone cannot create a new commitment difference.

For every authorized commitment retain its source message(s) and applicable object, environment, scope, and conditions in the session-local Ledger. An assistant proposal, an assistant-authored task record, a completion checkbox, an untraceable summary, or a `confirmed=true` flag is not acceptance evidence. An accepted-target basis must identify both the proposal and the user's acceptance, in that order, not just the assistant's claim that it was accepted. Acceptance must cover the whole currently applicable Target; separate accepted clauses cannot manufacture acceptance of a new combined goal.

Recheck applicability before reuse. A later explicit user revision supersedes the affected commitment; missing evidence, conflicting facts, changed objects/environments, or expired conditions invalidate only affected commitments and their dependencies. Compare the whole Target again: independently accepted clauses must not be combined into an unapproved effect. Permission to export locally and permission to upload test data do not authorize uploading production exports.

Repository facts may establish what exists, but do not authorize what to change. Keep implementation facts in Context or Plan unless the user made their preservation an explicit commitment. Do not ask the user to certify facts the Agent can verify after alignment; do not read task-direct sources early to manufacture authorization.

## Readiness and Pre-Alignment Boundary

A Target is ready only when the request supports one concrete, independently acceptable outcome and an honest observable completion condition.

- Open-ended discussion without a concrete outcome remains outside task workflows.
- If a user-owned ambiguity prevents an honest Target, ask one focused question.
- Once a concrete outcome exists, activate and focus its owning record before further clarification or presentation.
- Task lifecycle writes required for create, resume, reopen, focus, sync, and check are bootstrap exceptions; they are not execution authorization.
- Before alignment, do not inspect task-direct sources, research implementation facts, plan the solution, decompose a Queue, delegate, edit the requested deliverable, or run unrelated mutating commands. Selecting `continue_exploration` satisfies alignment for its bounded exploration scope, not for later implementation. The sole additional source-lookup exception is the minimum read-only specification/scope and relevant task references of a Topic explicitly selected by the user or already bound to the owning task, when needed to form an honest Target. Resolve only that exact reference; no repository scan, implementation research, implicit Topic selection or write is authorized by this exception.
- Do not ask the user for implementation facts that can be inspected after alignment.

## Persistent Topic Boundary

A Topic carries shared current requirements, not user approval. Reading the same Topic or revision across tasks or sessions does not create accepted-target evidence or a delegation packet. Apply the current request and recoverable user acceptance to the local task scope; a missing source remains an alignment hold. A changed Topic revision requires impact analysis: material requirement changes use the existing realignment procedure, while a checked non-material change may adopt the current revision without inventing a new goal. Topic lifecycle state, content digests and adoption notes never authorize execution. Topic maintenance is itself an owning task when it has a concrete outcome; internal association commands do not recursively create tasks.

## Interaction Owner and Delegated Execution

The session directly handling the user's request is the `interaction owner`. Only that main session may render user-facing L0-L4 interactions or an S1 Safety Confirmation. In `confirm` mode, first apply the exploration exemption; otherwise its first ready non-trivial L2 Target must be displayed for user goal rechecking, and the owner must end the turn and wait before substantive work. In SOLO, use its separate execution path instead of the L0-L4 procedure. An accepted unchanged Target does not receive another checkpoint.

Target acceptance follows the accepted result semantics, not the task-family consumer. Changing from `task-plan` to `task` does not itself create a new Target. When the same canonical plan record is handed off in the same recoverable conversation state, the interaction owner continues without another checkpoint only when the user has explicitly authorized execution and the accepted outcome, Done when conditions, and boundaries remain materially equivalent. Planning-phase acceptance aligns the Target but never authorizes execution; without a later execution request, do not implement. If acceptance evidence cannot be recovered or the execution Target differs, apply the normal L2-L4 procedure.

A child session or child task is delegated only when the main session supplies a session-local delegation packet containing:

- the main task ID;
- the existing owning child task ID or an explicit current Plan node;
- the exact delegated outcome and observable completion conditions; and
- the delegated scope and boundaries.

Do not persist this packet or confirmation state in the canonical task core. A delegated child validates the packet before work:

- when the assignment is fully covered by the current main Plan, use `continue_delegated` without rendering a Task Target or asking the user;
- when the packet is missing or stale, the assignment exceeds the Plan, a user-owned decision is required, or an S1 action boundary is reached, use `return_to_main`, stop, and report the relevant commitment dimensions and evidence to the interaction owner;
- a child never renders L2, L3, L4, or Safety Confirmation directly.

A material Plan distribution change means adding, removing, or reordering a child, or changing a child's outcome, done conditions, or scope. It returns control to the main session: in-scope exploration may continue under its exemption; otherwise use L2 when the accepted Target remains equivalent, L3 when a user-owned ambiguity blocks a ready Target, and L4 when authorization changes. Files, functions, algorithms, commands, and verification methods within one unchanged child node are implementation-only and do not trigger realignment.

## Guard Levels

These levels apply only in `confirm` mode. SOLO bypasses this table and its second-confirmation procedure entirely; use the SOLO execution path above.

The table below applies only to the interaction owner; delegated children use the gate above and do not choose an L0-L4 level. Equivalent exploration without an explicit hold uses `continue_exploration` with no L-level before reaching L1/L2.

| Level | Name | Trigger | User interaction | Exit |
| --- | --- | --- | --- | --- |
| L0 | `NO_TASK` | No file mutation and no concrete non-trivial outcome | No Target | Answer or continue conversation |
| L1 | `TRIVIAL_PASS` | Task exists solely for a trivial deterministic file mutation and Target is materially equivalent | Target display may be omitted | Continue after lifecycle activation |
| L2 | `VISIBLE_CHECKPOINT` | Ready non-trivial Target outside the exploration exemption, or an explicit user-requested hold; every authorized atom is preserved and no candidate atom is untraceable | Display the complete Target and wait for the user to check the Agent's understanding | Explicit acceptance of the displayed Target or valid unchanged-Target reuse |
| L3 | `CLARIFICATION_HOLD` | User-owned ambiguity prevents an honest Target | Ask exactly one focused question; do not present a guessed Target | User answer makes a Target ready |
| L4 | `TARGET_CHANGE_APPROVAL` | Target is ready but adds, omits, weakens, changes, or cannot rule out a concrete commitment difference | Display Target, name changed dimensions, and wait for approval | Explicit acceptance adds the Target to authorization |

L2 asks the user to recheck their goal as understood by the Agent; L4 requests approval for a changed commitment. Both displayed checkpoints wait for the user. Neither clears an independent Safety Overlay.

## Deterministic Decision Procedure

Resolve mode first: if `solo`, use the SOLO execution path and do not enter the grading procedure below. Otherwise apply this order:

1. Determine whether the current session is the interaction owner or has a complete delegation packet. A delegated child applies the delegated gate and returns without entering L0-L4.
2. If no task workflow applies, choose L0.
3. If no honest Target can be formed because of user-owned ambiguity, choose L3.
4. Form the minimum candidate Target from the Authorization Ledger.
5. Run both material-equivalence counterfactuals across every commitment atom.
6. If any relation is `add`, `omit`, `weaken`, `change`, or concrete `unknown`, choose L4.
7. If every relation is `preserve` and the current work is exploration-only, use `continue_exploration` with no L-level unless an explicit user-requested hold applies. Such a hold uses L2 `user_requested`; graph changes and missing prior acceptance alone do not require an exploration checkpoint.
8. Otherwise, if every relation is `preserve` and the task exists solely for a trivial deterministic file mutation, choose L1.
9. Otherwise choose L2 and apply the goal-recheck and acceptance-reuse check below.
10. Independently compute the Safety Overlay described below, including for exploration continuation.

L2 is valid only when all of these hold:

```text
targetReady = true
taskIsTrivial = false
missingAuthorizedAtoms = []
untraceableCandidateAtoms = []
differences = []
unresolvedUserDecisions = []
```

### L2 Goal Recheck and Acceptance Reuse

Run this only after the whole Target passes material equivalence and the exploration exemption has been checked. Authorization coverage does not establish user goal acceptance.

1. Preserve mandatory holds: outside exploration, a material Plan distribution change uses `plan_graph_change` and unrecoverable acceptance evidence on resume/compaction uses `acceptance_unavailable`; an unfulfilled explicit user instruction to check before proceeding uses `user_requested` for either work type. These use `show_checkpoint` even for a previously accepted Target. Exploration's explicit user hold does not activate graph or missing-acceptance holds. Returning to the main session and checking the graph are still required. If several applicable holds exist, keep them all active: use `user_requested` when it names items to check, otherwise `plan_graph_change` before `acceptance_unavailable`, and identify the other holds in `reasonCodes`. Satisfying one never clears the others.
2. Otherwise use `continue_unchanged` only for a previously displayed Target with recoverable user acceptance, unchanged outcome, Done when conditions and boundaries, and still-applicable object, environment and scope. A pure acceptance reply or implementation-only adjustment does not create a new checkpoint. Check the whole Target and combined effects, not just independent clauses. Do not use this action for an initial or materially revised Target.
3. Every new or materially revised non-trivial equivalent Target owned by the main session outside the exploration exemption must pass one L2 checkpoint: use `show_checkpoint` with `goal_recheck`, display the complete current Target, and ask whether it accurately expresses the user's intended result. End the turn and wait. This includes detailed initial requests, complete explicit user revisions, and Targets made ready by focused clarification. An answer to a local clarification is not acceptance of an undisplayed whole Target; after clarification, equivalent exploration continues through its exemption.
4. Preserve all inherited constraints in the displayed Target. For a material revision, highlight the revision without reducing the check to authorization for the changed words. A partial acceptance, question, hesitation or unrelated reply does not settle the whole goal check.
5. Keep L3 for user-owned ambiguity, L4 for commitment deltas, delegated handback for missing coverage, and S1 at its action boundary. These are not replaced by the goal checkpoint.

`show_continue` is not a valid alignment action. An old display-and-continue event, the original request, or an Agent claim of alignment without the user's acceptance cannot authorize `continue_unchanged`. Recover real acceptance or present the checkpoint again; do not rewrite historical task records or invent a reply.

The optional L2 display for an otherwise L1 trivial edit retains its existing wait behavior (`trivial_display`). Do not turn it into an exemption from any other gate.

## Compact Decision Packet

Create a compact packet for self-checking and evaluation:

```text
level
preservedAtomIds
missingAtomIds
addedAtomIds
changedDimensions
unresolvedQuestion
safetyOverlay
reasonCodes
action
authorizedClauses
confirmationItems
checkpointReason
```

For `show_checkpoint` and `continue_unchanged`, `authorizedClauses` contains `{ clause, basis, sources }` entries covering the complete Target, with basis `direct_user` or `accepted_target` and source message references. This is authorization evidence, not an automatic confirmation. For evaluation, address clauses as `outcome`, `doneWhen.0`, `doneWhen.1`, etc., and optional `boundaries`; source references are zero-based indexes into the supplied authorization messages. Each clause is one checkable unit. A mechanical summary may cite the same explicit sources as its Done when items.

`show_checkpoint` uses `goal_recheck`, `user_requested`, `plan_graph_change`, `acceptance_unavailable`, or `trivial_display`. For `goal_recheck`, `confirmationItems` covers the complete Target, even when the same clauses have direct-user authorization. These lists may overlap: authorized content still needs a user goal check. A user-requested check names only the item(s) the user asked to inspect; graph/acceptance/trivial holds explain the governing event and use empty confirmation items rather than inventing unknown clauses. For a combined hold, retain every active hold in `reasonCodes` and the user-facing explanation; a new goal still requires whole-Target acceptance even when another hold supplies the primary reason.

`continue_unchanged` requires complete authorized-clause coverage with `accepted_target` evidence for every clause, empty `confirmationItems`, and null `checkpointReason`. The owner must verify that the cited proposal and later acceptance cover the whole unchanged Target in the current scope; source-role or index checks alone cannot prove this. Other actions use empty lists and null reason.

Do not persist this packet in the canonical task record, expose its L-code by default, or store chain-of-thought. An L2 packet has only preserved atom IDs; all commitment-difference and unresolved-user-decision fields are empty. Goal rechecking is not an invented user-owned ambiguity. L3 names the one unresolved user question. L4 names at least one changed commitment dimension. S1 names the governing safety rule or action boundary.

`continue_exploration` has null `level`, empty goal-check lists and null `checkpointReason`. It describes an authorized investigation, never accepted-target reuse or execution permission; an optional progress statement is not a displayed confirmation action.

A delegated child instead uses a compact session-local packet with `sessionRole`, `mainTaskId`, `owningTaskId` or `planNode`, `action`, `changedDimensions`, and `reasonCodes`. Its action is exactly `continue_delegated` or `return_to_main`; it has no user-facing L-code.

## User-Facing Target Body

L2 and L4 use the same localized Target body:

```markdown
**Task Target**

- **Outcome:** <intended user-visible or system result>
- **Done when:**
  - <observable completion condition>
- **Boundaries:** <material scope boundary>
```

Keep the title exactly `**Task Target**`. Localize the labels to the conversation language. Outcome and Done when are required. Include the entire Boundaries item only when omission could cause misunderstanding. Render without a code fence, implementation method, file list, command sequence, internal plan, or checkbox.

### L2 Checkpoint

For `show_checkpoint`, keep the complete current Target visible, including inherited constraints. For `goal_recheck`, ask the user to check the Agent's understanding of their intended result, not merely grant permission. A material user revision may be highlighted without omitting the rest of the Target. For a mandatory graph, acceptance-recovery, trivial-display, or user-requested hold, explain that specific reason instead of pretending known facts are uncertain; name only explicitly requested local items when that is the sole pending check.

Append a neutral localized footer with this meaning:

`Does this Target accurately express the result you want? Please confirm it or state what should change. I will begin substantive work only after confirmation.`

For a local or event hold on an already accepted unchanged Target, adapt the question to that hold. Do not show a commitment difference list or imply that an equivalent Target expands authorization. End the turn and wait. Creating or focusing the internal task record does not bypass this checkpoint. Do not continue source inspection, research, planning, delegation or editing while waiting, even if the next tool is read-only.

### L4 Change Approval

After the Target body, add a localized section:

```markdown
**Changes requiring approval:**

- **<commitment dimension>:** <current authorization> → <candidate change>
```

List only material commitment deltas. Do not include implementation details, broad risk commentary, or private reasoning. Then append a localized footer with this meaning:

`This Target changes your current authorization. Explicitly approve these changes or state how to revise them. I will not execute before approval.`

### L3 Clarification

Ask one focused question about the exact user-owned ambiguity. Do not render a candidate Target, difference list, or generic confirmation prompt. Incorporate the answer into authorization and recompute the level.

### L1 Trivial Pass

After task activation, continue without waiting when the request is solely a trivial deterministic file mutation and the Target is materially equivalent. A consumer may display it, but display then becomes an L2 checkpoint and must wait for acceptance.

## Confirmation and Revision

- A response whose trimmed content is exactly `1` or case-insensitively equals `y` accepts only the currently displayed L2 or L4 check that is waiting for a reply. These shortcuts are implicit; never advertise them. A shortcut without a currently waiting checkpoint cannot approve another action.
- Any other unambiguous affirmative response that accepts the displayed Target also confirms it.
- L2 acceptance confirms the Agent's displayed goal interpretation while retaining the complete Target and inherited constraints; it does not expand authorization or grant execution of a planning-only task.
- L4 acceptance adds the displayed Target to current authorization.
- A question, hesitation, partial acceptance, unrelated reply, or ambiguous acknowledgment is not whole-Target acceptance. Answer or clarify only within the pre-alignment boundary, then present the current checkpoint again when ready.
- A user response that adds, removes, or changes a commitment revises authorization instead of accepting the old Target, even when it starts with an affirmative such as “confirm, but…”. Update the canonical Target as needed, run required consistency commands, regenerate the candidate, and recompute the level. A pure rewording or implementation-only instruction under an accepted unchanged Target does not create a new goal.
- An explicit material user revision updates authorization first, then recompute the exploration exemption or the revised Target's L2–L4 procedure. Outside exploration, the revised equivalent Target requires its own L2 goal checkpoint and a material Plan distribution change still requires its checkpoint. Do not treat an answer to a focused question as acceptance of an undisplayed revised Target.
- Once accepted, an unchanged main Target must not be presented for redundant confirmation in the same recoverable conversation state. This includes an explicitly authorized `task-plan` to `task` handoff of the same canonical record; delegated children covered by its current Plan also inherit that acceptance.
- After main-session resume or compaction, recover the current authorized scope first. Equivalent exploration may continue without claiming acceptance; outside its exemption, if the displayed Target and its applicable user acceptance cannot be recovered, present the checkpoint again rather than assuming acceptance. A delegated child without a complete current packet returns to the main session instead.

## Realignment

After alignment:

- Implementation-only changes such as files, functions, algorithms, commands, or verification methods within an unchanged Plan node do not trigger a new checkpoint while the accepted result and boundaries remain unchanged.
- Refining the canonical record from authoritative sources does not trigger a new checkpoint when the accepted user-facing commitment remains unchanged.
- A material Plan distribution change returns control to the main session. The owner may continue an in-scope exploration graph under the exemption; otherwise one new checkpoint is required before the changed child graph executes. A delegated child never performs that checkpoint.
- A material commitment change introduced by the Agent or discovery invalidates affected evidence, updates the canonical Target, and enters L4 in the main session.
- A user revision enters L3 when it still contains a user-owned ambiguity; otherwise it produces a revised L2 or L4 Target as determined above.

The conversational checkpoint does not replace the canonical Target and does not create a persisted alignment or confirmation field.

## Independent Safety Overlay

Compute safety independently from L0-L4:

- `S0 NONE`: no separate governing safety or permission gate applies.
- `S1 REQUIRED`: publication, payment, destructive action, credentials, permissions, privacy data, deployment, or another external side effect is governed by a separate workflow.

L2 or L4 acceptance never clears S1. The SOLO execution path skips in-scope framework/SOP confirmation-only pauses, including those labeled Safety Confirmation; it never clears substantive safeguards, host or higher-priority gates. In `confirm` mode, at the actual action boundary, the main session renders a separate localized `**Safety Confirmation**` block naming the action, affected object, consequence, and governing rule. A delegated child reaching that boundary returns to the main session and does not render the block itself. Do not attach safety approval to the L2 or L4 footer. Conversely, safety confirmation does not align a materially different Target.

## Consumer Responsibilities

- `task` supplies the intended outcome and observable completion condition for one independently acceptable result, or activates the exact existing record named by a valid delegation packet.
- `task-plan` supplies the planned task's eventual outcome and observable acceptance conditions for an implementation-ready handoff while keeping execution unauthorized until a later explicit user request.
- `task-queue` supplies the parent integration outcome, creates and names the child graph, and provides each child or subagent with the current delegation packet.
- Each consumer names its permitted lifecycle writes before alignment and its next step after alignment. Consumers must not copy the level table or detailed delegation semantics.
- Default Agent rules and lifecycle dispatchers retain stable routing, activation order, checkpoint, stop, and skip boundaries while deferring detail to this protocol.
- The shared task core owns persistent record state, Targets, evidence, relationships, and completion gates; it does not persist guard levels or acceptance.

## Maintainer Validation

Keep the shared protocol, stable Agent rules, task-family consumers, project-local level fixtures and scorer, Context, and focused contract assertions aligned. Cover explicit requests, complete revisions, clarification convergence, partial checks, user-requested holds, stale/cross-scope evidence, combined effects, and unchanged graph/Safety gates. Report visibility, actual waiting, redundant checks of accepted unchanged goals, false acceptance reuse, and inherited-boundary omissions separately. Fixed-candidate classification and deterministic reference checks cannot prove semantic entailment, faithful free-form Target generation, or that a real Agent stops before substantive tool calls. Verify those separately with authorized fresh-context interaction replay; never report unrun behavior checks as passed. Run authorized focused tests, the built-in Skill Quality gate for changed Skill packages, project eval validation and self-test, Context validation, and `git diff --check`. Quality failures block completion; context-budget warnings never justify removing required workflow guidance.
