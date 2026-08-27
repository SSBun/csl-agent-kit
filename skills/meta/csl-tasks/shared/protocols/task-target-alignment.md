# Task Target Alignment Protocol

This host-neutral runtime contract is the sole detailed authority for Task Target readiness, semantic alignment, conditional presentation and confirmation, revision, and realignment across `task`, `task-plan`, and `task-queue`. It is not a skill and must not participate in skill discovery or routing.

## Loading

Each consuming skill must resolve the collection root, read this file in full before forming, presenting, or accepting a Task Target, and read it again after resume or compaction when it is no longer present in context. The consumer owns when to invoke the protocol and what its workflow-specific Target means.

If this file is missing or unreadable, stop before substantive work and report the missing runtime dependency. Do not reconstruct the detailed contract from memory or a consumer summary.

## Readiness and Clarification

A Task Target is ready only when the request supports one concrete, independently acceptable outcome and an honest observable completion condition.

- Open-ended discussion without a concrete outcome remains outside the task workflows.
- If no honest Target can be stated, ask one focused question about the user-owned ambiguity. Create or activate the record as soon as the answer establishes the outcome.
- Once a concrete outcome exists, activate and focus its owning record before any further target-forming clarification.
- After activation but before alignment, clarification is limited to user-owned ambiguity that must be resolved to state or align the Target accurately. This focused clarification forms the commitment; it is not substantive preparation.
- Do not inspect task-direct sources, research implementation facts, plan the solution, decompose a Queue, edit the requested deliverable, run unrelated mutating commands, or delegate work before alignment. Do not ask the user for implementation facts that can be inspected after alignment.

## Current User Authorization

Compare every candidate Target with the current user authorization. It consists of the originating request, focused clarification answers, explicit user additions or revisions, and any previously presented Target the user accepted. When those expressions conflict, the later explicit user expression wins.

Do not add Agent assumptions, unaccepted discovery results, proposed changes, or implementation-convenience constraints to the authorization baseline.

Material equivalence is bidirectional. A candidate Target is equivalent only when it neither adds, removes, weakens, omits, nor changes the authorized outcome, observable completion conditions, scope boundaries, preserved behavior, compatibility boundaries, side effects, or user-owned trade-offs. Wording and structure may be normalized only when they preserve the entire commitment.

Use both counterfactual checks:

- If the user could accept the current authorization yet reasonably reject the candidate Target, the candidate adds or changes a commitment.
- If the candidate Target could be satisfied while the current authorization remains unsatisfied, the candidate removes, weakens, or omits a commitment.

If either case is reasonably possible, the candidate is not materially equivalent.

## Alignment Gate

After the owning record is active and the candidate Target is ready:

1. Compare the candidate Target with the current user authorization before any task-direct inspection or substantive preparation.
2. If they are bidirectionally materially equivalent and no user-owned ambiguity remains, treat the Target as aligned and continue without rendering a confirmation prompt. The user's existing instruction is the authorization; do not ask them to approve an equivalent restatement.
3. If no honest candidate can be formed because of user-owned ambiguity, ask the focused question allowed above, incorporate the answer into the current user authorization, and repeat this gate.
4. If the candidate is not materially equivalent, render the following plain Markdown structure, then stop and wait for explicit textual confirmation:

   ```markdown
   **Task Target**

   - **Outcome:** <intended user-visible or system result>
   - **Done when:**
     - <observable completion condition>
   - **Boundaries:** <material scope boundary>

   Confirm this target, or state what should change.
   ```

   Keep the title exactly `**Task Target**`. Localize the `Outcome`, `Done when`, and `Boundaries` labels and the final instruction to the user's conversation language; do not add confirmation shortcut hints to it. `Outcome` and `Done when` are required; list one or more observable conditions under `Done when`. Include the entire `Boundaries` item only when omitting a material scope boundary could cause misunderstanding.
5. Before alignment, permit only the focused clarification defined above and the task lifecycle writes named by the consuming skill.
6. After alignment, continue with task-relevant Context Packs, relevant Lessons, and task-direct sources.

The user-facing block describes the result and observable completion boundary. Render it without a code fence, implementation method, file list, command sequence, internal plan, or checkbox.

## Confirmation and Revision

- A response whose trimmed content is exactly `1` or case-insensitively equals `y` confirms the currently presented Target. Treat these as implicit shortcuts and do not advertise them in the user-facing block. Any other unambiguous affirmative response that accepts it also confirms it. Acceptance adds the presented Target to the current user authorization and aligns it.
- A response that explicitly adds, removes, or changes the outcome, completion condition, scope boundary, preserved behavior, compatibility boundary, side effect, or user-owned trade-off updates the current user authorization instead of confirming the old Target. Update the canonical record as needed, run its required consistency commands, regenerate the candidate, and repeat the Alignment Gate. If the new candidate is materially equivalent, continue without asking the user to confirm their own explicit revision again; if the revision is ambiguous or the candidate still differs, clarify or present it as required by the gate.
- A question, hesitation, unrelated reply, or ambiguous acknowledgment is not confirmation. Answer or clarify only within the pre-alignment boundary, then present the current Target again when it is ready and still requires confirmation.

## Canonical Target and Realignment

The conversational Task Target is a concise commitment gate; it does not replace the canonical record's `Target` section and does not create a persisted alignment or confirmation field.

After alignment:

- An explicit, complete user revision updates the current user authorization. Adopt a materially equivalent revised Target directly without asking the user to confirm the same revision again.
- A material change introduced by the Agent or by discovery is not authorized until the user accepts it. Pause, update the canonical Target, invalidate stale evidence as required by the task workflow, present the revised Task Target, and wait for confirmation.
- Do not realign for implementation-only changes such as file paths, functions, algorithms, internal plans, or verification commands when the aligned result and boundaries remain unchanged.
- Refine a canonical Target from authoritative sources without another confirmation only when the user-facing commitment remains materially equivalent to the current user authorization.

## Independent Safety Gates

Semantic alignment does not bypass any separate safety, permission, publication, destructive-action, payment, or external-side-effect confirmation required by another governing workflow. Those gates remain independent even when the Target is materially equivalent to what the user already authorized. Conversely, satisfying an independent safety gate does not align a materially different Target.

## Consumer Responsibilities

- `task` supplies the intended outcome and observable completion condition for one independently acceptable result.
- `task-plan` supplies the intended planning outcome and observable condition for an implementation-ready handoff.
- `task-queue` supplies the parent integration outcome and observable completion condition.
- Each consumer names its permitted lifecycle writes before alignment and its next step after alignment.
- Default Agent rules and lifecycle dispatchers retain stable routing, activation order, mandatory gate, and skip boundaries. They defer the detailed alignment semantics to this protocol rather than copying them.
- The shared task core owns persistent record state, Targets, evidence, relationships, and completion gates; it does not persist conversational alignment.
