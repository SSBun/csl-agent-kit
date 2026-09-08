# Task Target Alignment Protocol

This host-neutral runtime contract is the sole detailed authority for Task Target readiness, Authorization Ledger construction, semantic equivalence, L0-L4 guard levels, presentation, confirmation, revision, realignment, and the independent Safety Overlay across `task`, `task-plan`, and `task-queue`. It is not a Skill and must not participate in Skill discovery or routing.

## Loading

Each consuming Skill must resolve the collection root, read this file in full before forming, presenting, or accepting a Task Target, and read it again after resume or compaction when it is no longer present in context. The consumer owns when to invoke the protocol and what its workflow-specific Target means.

If this file is missing or unreadable, stop before substantive work and report the missing runtime dependency. Do not reconstruct the contract from memory or a consumer summary.

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

### Settled Commitments

After material equivalence passes, classify each candidate commitment's confirmation basis:

- `direct_user`: the user explicitly supplied this result, condition, or boundary in the current request or a focused answer/revision.
- `accepted_target`: recoverable user acceptance covers this commitment in the same task scope or an explicitly delegated scope.
- Otherwise it remains an unsettled interpretation. Name the exact interpretation still requiring a check; wording, formatting, mechanical restatement, or generic low confidence alone cannot create one. If it actually introduces a user-owned ambiguity or a commitment difference, use L3 or L4 instead.

For every settled commitment retain its source message(s) and applicable object, environment, scope, and conditions in the session-local Ledger. An assistant proposal, an assistant-authored task record, a completion checkbox, an untraceable summary, or a `confirmed=true` flag is not acceptance evidence. An accepted-target basis must identify both the proposal and the user's acceptance, not just the assistant's claim that it was accepted.

Recheck applicability before reuse. A later explicit user revision supersedes the affected commitment; missing evidence, conflicting facts, changed objects/environments, or expired conditions invalidate only affected commitments and their dependencies. Compare the whole Target again: independently accepted clauses must not be combined into an unapproved effect. Permission to export locally and permission to upload test data do not authorize uploading production exports.

Repository facts may establish what exists, but do not authorize what to change. Keep implementation facts in Context or Plan unless the user made their preservation an explicit commitment. Do not ask the user to certify facts the Agent can verify after alignment; do not read task-direct sources early to manufacture authorization.

## Readiness and Pre-Alignment Boundary

A Target is ready only when the request supports one concrete, independently acceptable outcome and an honest observable completion condition.

- Open-ended discussion without a concrete outcome remains outside task workflows.
- If a user-owned ambiguity prevents an honest Target, ask one focused question.
- Once a concrete outcome exists, activate and focus its owning record before further clarification or presentation.
- Task lifecycle writes required for create, resume, reopen, focus, sync, and check are bootstrap exceptions; they are not execution authorization.
- Before alignment, do not inspect task-direct sources, research implementation facts, plan the solution, decompose a Queue, delegate, edit the requested deliverable, or run unrelated mutating commands.
- Do not ask the user for implementation facts that can be inspected after alignment.

## Interaction Owner and Delegated Execution

The session directly handling the user's request is the `interaction owner`. Only that main session may render user-facing L0-L4 interactions or an S1 Safety Confirmation. Its first ready non-trivial L2 Target is visible before substantive execution; the L2 confirmation-coverage check below determines whether to wait. An accepted unchanged Target does not receive another checkpoint.

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

A material Plan distribution change means adding, removing, or reordering a child, or changing a child's outcome, done conditions, or scope. It returns control to the main session: use L2 when the accepted Target remains equivalent, L3 when a user-owned ambiguity blocks a ready Target, and L4 when authorization changes. Files, functions, algorithms, commands, and verification methods within one unchanged child node are implementation-only and do not trigger realignment.

## Guard Levels

The table below applies only to the interaction owner; delegated children use the gate above and do not choose an L0-L4 level.

| Level | Name | Trigger | User interaction | Exit |
| --- | --- | --- | --- | --- |
| L0 | `NO_TASK` | No file mutation and no concrete non-trivial outcome | No Target | Answer or continue conversation |
| L1 | `TRIVIAL_PASS` | Task exists solely for a trivial deterministic file mutation and Target is materially equivalent | Target display may be omitted | Continue after lifecycle activation |
| L2 | `VISIBLE_CHECKPOINT` | Ready non-trivial Target; every authorized atom is preserved and no candidate atom is untraceable | Display Target; continue when confirmation coverage is complete, otherwise wait only for the remaining check | Complete valid confirmation coverage or explicit acceptance of the pending check |
| L3 | `CLARIFICATION_HOLD` | User-owned ambiguity prevents an honest Target | Ask exactly one focused question; do not present a guessed Target | User answer makes a Target ready |
| L4 | `TARGET_CHANGE_APPROVAL` | Target is ready but adds, omits, weakens, changes, or cannot rule out a concrete commitment difference | Display Target, name changed dimensions, and wait for approval | Explicit acceptance adds the Target to authorization |

L2 checks the interpretation of existing authorization; it may continue without a reply. L4 always requests approval for a changed commitment. Neither clears an independent Safety Overlay.

## Deterministic Decision Procedure

Apply this order:

1. Determine whether the current session is the interaction owner or has a complete delegation packet. A delegated child applies the delegated gate and returns without entering L0-L4.
2. If no task workflow applies, choose L0.
3. If no honest Target can be formed because of user-owned ambiguity, choose L3.
4. Form the minimum candidate Target from the Authorization Ledger.
5. Run both material-equivalence counterfactuals across every commitment atom.
6. If any relation is `add`, `omit`, `weaken`, `change`, or concrete `unknown`, choose L4.
7. If every relation is `preserve` and the task exists solely for a trivial deterministic file mutation, choose L1.
8. Otherwise choose L2 and apply the confirmation-coverage check below.
9. Independently compute the Safety Overlay described below.

L2 is valid only when all of these hold:

```text
targetReady = true
taskIsTrivial = false
missingAuthorizedAtoms = []
untraceableCandidateAtoms = []
differences = []
unresolvedUserDecisions = []
```

### L2 Confirmation-Coverage Check

Run this only after the whole Target passes material equivalence. Coverage is not a substitute for preserving all authorized atoms.

1. Preserve mandatory holds: a material Plan distribution change uses `plan_graph_change`; unrecoverable alignment evidence on resume/compaction uses `acceptance_unavailable`; an unfulfilled explicit user instruction to check before proceeding uses `user_requested`. These use `show_checkpoint` even when Target commitments are settled. Returning to the main session and checking the graph are still required. If several holds apply, keep them all active: use `user_requested` when it names items to check, otherwise `plan_graph_change` before `acceptance_unavailable`, and identify the other holds in `reasonCodes`. Satisfying one never clears the others.
2. Otherwise keep `continue_unchanged` for an already aligned, unchanged Target under the existing same-session/handoff rules. Do not use it for a new or revised Target.
3. For a main-session initial request, complete explicit user revision, or the Target made ready by focused clarification, collect valid settled commitments and the remaining interpretations. If all commitments are settled, use `show_continue`: render the complete Target once and continue in the same turn without asking for acknowledgment. This is alignment based on existing user authorization, not acceptance inferred from silence.
4. Otherwise use `show_checkpoint` with `unsettled_interpretation`, name only the remaining interpretation(s), and wait. Preserve settled constraints in the complete Target without asking the user to reconfirm them. A reply that settles the last item does not create another checkpoint merely because the Target is reworded.
5. Do not extend this exception to unsupported scopes, lost acceptance, or delegated sessions. At any new user-owned ambiguity, commitment delta, or safety action boundary, use the existing L3, L4, delegated handback, or S1 path.

`show_continue` establishes alignment from the cited user commitments. Later unchanged continuation may inherit it only while the displayed Target and its direct-user or accepted-target sources remain recoverable; do not invent a separate acceptance reply. This changes no execution-phase or delegated-scope permission.

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
settledClauses
confirmationItems
checkpointReason
```

For an L2 shown Target, `settledClauses` contains `{ clause, basis, sources }` entries with basis `direct_user` or `accepted_target` and source message references. `confirmationItems` identifies only clauses still being checked. For evaluation, address clauses as `outcome`, `doneWhen.0`, `doneWhen.1`, etc., and optional `boundaries`; source references are zero-based indexes into the supplied authorization messages. Each clause must contain a single confirmation unit; split mixed settled/unsettled conditions before evaluation. A mechanical summary may cite the same explicit sources as its Done when items.

`show_continue` requires complete settled coverage, empty `confirmationItems`, and null `checkpointReason`. `show_checkpoint` uses `unsettled_interpretation`, `user_requested`, `plan_graph_change`, `acceptance_unavailable`, or `trivial_display`. For `unsettled_interpretation`, the non-empty confirmation items and settled clauses partition the Target without overlap; a user-requested check names only the item(s) the user asked to inspect. Graph/acceptance/trivial holds explain the governing event rather than inventing unsettled clauses. Other actions use empty lists and null reason. For a combined hold, the primary reason follows the priority above; the complete packet and user-facing explanation must retain every active hold. These fields contain bounded evidence and requested checks, never private reasoning.

Do not persist this packet in the canonical task record, expose its L-code by default, or store chain-of-thought. An L2 packet has only preserved atom IDs; all commitment-difference and unresolved-user-decision fields are empty. Unsettled equivalent interpretations are not new user-owned decisions. L3 names the one unresolved user question. L4 names at least one changed commitment dimension. S1 names the governing safety rule or action boundary.

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

For `show_continue`, render the complete Target without a confirmation footer and continue immediately in the same turn. Do not end the turn merely because the Target was displayed.

For `show_checkpoint`, keep the complete Target visible, including settled constraints. When only some interpretations are unsettled, append a localized `Items to check` section containing exactly those items; state that the other constraints remain in force and are not being asked again. For a mandatory graph, acceptance-recovery, trivial-display, or user-requested hold, explain that specific reason instead of pretending known facts are uncertain. Then append a neutral localized footer with this meaning:

`Please confirm the items identified above, or state what should change. I will begin substantive work only after confirmation.`

Do not show a commitment difference list or imply that the user expanded authorization. Stop and wait. Creating or focusing the internal task record does not bypass a required checkpoint.

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

- A response whose trimmed content is exactly `1` or case-insensitively equals `y` accepts only the currently displayed L2 or L4 check that is waiting for a reply. These shortcuts are implicit; never advertise them. A `show_continue` Target is not waiting, so a later shortcut cannot approve another action.
- Any other unambiguous affirmative response that accepts the displayed Target also confirms it.
- L2 acceptance settles the identified interpretation/check while retaining the complete Target and inherited constraints; it does not expand authorization or grant execution of a planning-only task.
- L4 acceptance adds the displayed Target to current authorization.
- A question, hesitation, unrelated reply, or ambiguous acknowledgment is not acceptance. Answer or clarify only within the pre-alignment boundary, then present the current checkpoint again when ready.
- A user response that adds, removes, or changes a commitment revises authorization instead of accepting the old Target. Update the canonical Target as needed, run required consistency commands, regenerate the candidate, and recompute the level.
- Every new or materially revised non-trivial equivalent Target owned by the main session passes the L2 confirmation-coverage check. An explicit user revision updates authorization first: directly specified changed clauses and still-valid settled clauses need no second acknowledgment. Recompute L3/L4 when appropriate; a material Plan distribution change still requires its checkpoint.
- Once accepted, an unchanged main Target must not be presented for redundant confirmation in the same recoverable conversation state. This includes an explicitly authorized `task-plan` to `task` handoff of the same canonical record; delegated children covered by its current Plan also inherit that acceptance.
- After main-session resume or compaction, if the prior alignment evidence cannot be recovered (explicit acceptance, or a displayed `show_continue` Target with valid cited user commitments), present the checkpoint again rather than assuming acceptance. A delegated child without a complete current packet returns to the main session instead.

## Realignment

After alignment:

- Implementation-only changes such as files, functions, algorithms, commands, or verification methods within an unchanged Plan node do not trigger a new checkpoint while the accepted result and boundaries remain unchanged.
- Refining the canonical record from authoritative sources does not trigger a new checkpoint when the accepted user-facing commitment remains unchanged.
- A material Plan distribution change returns control to the main session and requires one new checkpoint before the changed child graph executes; a delegated child never performs that checkpoint.
- A material commitment change introduced by the Agent or discovery invalidates affected evidence, updates the canonical Target, and enters L4 in the main session.
- A user revision enters L3 when it still contains a user-owned ambiguity; otherwise it produces a revised L2 or L4 Target as determined above.

The conversational checkpoint does not replace the canonical Target and does not create a persisted alignment or confirmation field.

## Independent Safety Overlay

Compute safety independently from L0-L4:

- `S0 NONE`: no separate governing safety or permission gate applies.
- `S1 REQUIRED`: publication, payment, destructive action, credentials, permissions, privacy data, deployment, or another external side effect is governed by a separate workflow.

L2 or L4 acceptance never clears S1. At the actual action boundary, the main session renders a separate localized `**Safety Confirmation**` block naming the action, affected object, consequence, and governing rule. A delegated child reaching that boundary returns to the main session and does not render the block itself. Do not attach safety approval to the L2 or L4 footer. Conversely, safety confirmation does not align a materially different Target.

## Consumer Responsibilities

- `task` supplies the intended outcome and observable completion condition for one independently acceptable result, or activates the exact existing record named by a valid delegation packet.
- `task-plan` supplies the planned task's eventual outcome and observable acceptance conditions for an implementation-ready handoff while keeping execution unauthorized until a later explicit user request.
- `task-queue` supplies the parent integration outcome, creates and names the child graph, and provides each child or subagent with the current delegation packet.
- Each consumer names its permitted lifecycle writes before alignment and its next step after alignment. Consumers must not copy the level table or detailed delegation semantics.
- Default Agent rules and lifecycle dispatchers retain stable routing, activation order, checkpoint, stop, and skip boundaries while deferring detail to this protocol.
- The shared task core owns persistent record state, Targets, evidence, relationships, and completion gates; it does not persist guard levels or acceptance.

## Maintainer Validation

Keep the shared protocol, stable Agent rules, task-family consumers, project-local level fixtures and scorer, Context, and focused contract assertions aligned. Cover explicit requests, complete revisions, clarification convergence, partial checks, user-requested holds, stale/cross-scope evidence, combined effects, and unchanged graph/Safety gates. Report visibility, redundant checks, false reuse, and inherited-boundary omissions separately; deterministic reference checks cannot prove semantic entailment or model reliability. Run authorized focused tests, the built-in Skill Quality gate for changed Skill packages, project eval validation and self-test, Context validation, and `git diff --check`. Quality failures block completion; context-budget warnings never justify removing required workflow guidance.
