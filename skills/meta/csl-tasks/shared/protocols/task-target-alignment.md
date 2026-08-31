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

## Readiness and Pre-Alignment Boundary

A Target is ready only when the request supports one concrete, independently acceptable outcome and an honest observable completion condition.

- Open-ended discussion without a concrete outcome remains outside task workflows.
- If a user-owned ambiguity prevents an honest Target, ask one focused question.
- Once a concrete outcome exists, activate and focus its owning record before further clarification or presentation.
- Task lifecycle writes required for create, resume, reopen, focus, sync, and check are bootstrap exceptions; they are not execution authorization.
- Before alignment, do not inspect task-direct sources, research implementation facts, plan the solution, decompose a Queue, delegate, edit the requested deliverable, or run unrelated mutating commands.
- Do not ask the user for implementation facts that can be inspected after alignment.

## Interaction Owner and Delegated Execution

The session directly handling the user's request is the `interaction owner`. Only that main session may render user-facing L0-L4 interactions or an S1 Safety Confirmation. Its first ready non-trivial L2 Target receives one checkpoint before substantive execution; an accepted unchanged Target does not receive another one.

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
| L2 | `VISIBLE_CHECKPOINT` | Ready non-trivial Target; every authorized atom is preserved and no candidate atom is untraceable | Display Target and wait for one acknowledgment | Explicit acceptance of the displayed Target |
| L3 | `CLARIFICATION_HOLD` | User-owned ambiguity prevents an honest Target | Ask exactly one focused question; do not present a guessed Target | User answer makes a Target ready |
| L4 | `TARGET_CHANGE_APPROVAL` | Target is ready but adds, omits, weakens, changes, or cannot rule out a concrete commitment difference | Display Target, name changed dimensions, and wait for approval | Explicit acceptance adds the Target to authorization |

L2 and L4 both pause, but their authority semantics differ: L2 verifies that the Agent understood existing authorization; L4 requests approval for a changed commitment.

## Deterministic Decision Procedure

Apply this order:

1. Determine whether the current session is the interaction owner or has a complete delegation packet. A delegated child applies the delegated gate and returns without entering L0-L4.
2. If no task workflow applies, choose L0.
3. If no honest Target can be formed because of user-owned ambiguity, choose L3.
4. Form the minimum candidate Target from the Authorization Ledger.
5. Run both material-equivalence counterfactuals across every commitment atom.
6. If any relation is `add`, `omit`, `weaken`, `change`, or concrete `unknown`, choose L4.
7. If every relation is `preserve` and the task exists solely for a trivial deterministic file mutation, choose L1.
8. Otherwise choose L2.
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
```

Do not persist this packet in the canonical task record, expose its L-code by default, or store chain-of-thought. An L2 packet has only preserved atom IDs; all difference and unresolved fields are empty. L3 names the one unresolved user question. L4 names at least one changed commitment dimension. S1 names the governing safety rule or action boundary.

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

After the Target body, append a neutral localized Checkpoint footer with this meaning:

`Please confirm that the Target above accurately expresses your intent, or state what should change. I will begin substantive work only after confirmation.`

Do not show a difference list or imply that the user expanded authorization. Stop and wait. Creating or focusing the internal task record does not bypass this checkpoint.

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

- A response whose trimmed content is exactly `1` or case-insensitively equals `y` accepts the currently displayed L2 or L4 Target. These shortcuts are implicit; never advertise them.
- Any other unambiguous affirmative response that accepts the displayed Target also confirms it.
- L2 acceptance records that the displayed interpretation is correct; it does not expand authorization.
- L4 acceptance adds the displayed Target to current authorization.
- A question, hesitation, unrelated reply, or ambiguous acknowledgment is not acceptance. Answer or clarify only within the pre-alignment boundary, then present the current checkpoint again when ready.
- A user response that adds, removes, or changes a commitment revises authorization instead of accepting the old Target. Update the canonical Target as needed, run required consistency commands, regenerate the candidate, and recompute the level.
- Every new or materially revised non-trivial equivalent Target owned by the main session must pass one L2 checkpoint, including a normalized Target produced after an explicit user revision or a material Plan distribution change.
- Once accepted, an unchanged main Target must not be presented for redundant confirmation in the same recoverable conversation state. This includes an explicitly authorized `task-plan` to `task` handoff of the same canonical record; delegated children covered by its current Plan also inherit that acceptance.
- After main-session resume or compaction, if explicit acceptance evidence cannot be recovered, present the checkpoint again rather than assuming acceptance. A delegated child without a complete current packet returns to the main session instead.

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

Keep the shared protocol, stable Agent rules, task-family consumers, project-local level fixtures and scorer, Context, and focused contract assertions aligned. Run authorized focused tests, the built-in Skill Quality gate for changed Skill packages, project eval validation and self-test, Context validation, and `git diff --check`. Quality failures block completion; context-budget warnings never justify removing required workflow guidance.
