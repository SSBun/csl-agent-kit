# Task Target Alignment Protocol

This host-neutral runtime contract is the sole detailed authority for Task Target readiness, presentation, confirmation, and realignment across `task`, `task-plan`, and `task-queue`. It is not a skill and must not participate in skill discovery or routing.

## Loading

Each consuming skill must resolve the collection root, read this file in full before forming, presenting, or accepting a Task Target, and read it again after resume or compaction when it is no longer present in context. The consumer owns when to invoke the protocol and what its workflow-specific Target means.

If this file is missing or unreadable, stop before substantive work and report the missing runtime dependency. Do not reconstruct the detailed contract from memory or a consumer summary.

## Readiness and Clarification

A Task Target is ready only when the request supports one concrete, independently acceptable outcome and an honest observable completion condition.

- Open-ended discussion without a concrete outcome remains outside the task workflows.
- If no honest Target can be stated, ask one focused question about the user-owned ambiguity. Create or activate the record as soon as the answer establishes the outcome.
- Once a concrete outcome exists, activate and focus its owning record before any further target-forming clarification.
- After activation but before confirmation, clarification is limited to user-owned ambiguity that must be resolved to state or accept the Target accurately. This focused clarification forms the commitment; it is not substantive preparation.
- Do not inspect task-direct sources, research implementation facts, plan the solution, decompose a Queue, edit the requested deliverable, run unrelated mutating commands, or delegate work before confirmation. Do not ask the user for implementation facts that can be inspected after confirmation.

## Alignment Gate

After the owning record is active and the candidate Target is ready:

1. Check the originating top-level user request. If its final non-empty line is exactly the case-sensitive marker `TASK_GO`, exclude the marker from the outcome, treat the current Task Target as confirmed for this request, and continue without textual confirmation.
2. Otherwise render the following plain Markdown structure, then stop and wait for explicit textual confirmation:

   ```markdown
   **Task Target**

   - **Outcome:** <intended user-visible or system result>
   - **Done when:**
     - <observable completion condition>
   - **Boundaries:** <material scope boundary>

   Confirm this target, or state what should change.
   ```

   Keep the title exactly `**Task Target**`. Localize the `Outcome`, `Done when`, and `Boundaries` labels and the final instruction to the user's conversation language. `Outcome` and `Done when` are required; list one or more observable conditions under `Done when`. Include the entire `Boundaries` item only when omitting a material scope boundary could cause misunderstanding.
3. Before confirmation, permit only the focused clarification defined above and the task lifecycle writes named by the consuming skill.
4. After confirmation, continue with task-relevant Context Packs, relevant Lessons, and task-direct sources.

The one-request `TASK_GO` authorization does not resolve ambiguity, approve a materially different Target, or bypass any other required confirmation.

The user-facing block describes the result and observable completion boundary. Render it without a code fence, implementation method, file list, command sequence, internal plan, or checkbox.

## Confirmation and Revision

- An unambiguous affirmative response that accepts the currently presented Target confirms it.
- A response that adds, removes, or changes the outcome, completion condition, scope boundary, preserved behavior, compatibility boundary, side effect, or user-owned trade-off revises the Target instead of confirming it. Update the canonical record as needed, run its required consistency commands, present the revised block, and wait again.
- A question, hesitation, unrelated reply, or ambiguous acknowledgment is not confirmation. Answer or clarify only within the pre-confirmation boundary, then present the current Target again when it is ready.
- Never request both textual confirmation and `TASK_GO` confirmation for the same originating request.

## Canonical Target and Realignment

The conversational Task Target is a concise commitment gate; it does not replace the canonical record's `Target` section and does not create a persisted confirmation field.

After confirmation, pause and realign before continuing when discovery or a new request materially changes the user-visible outcome, observable completion condition, scope boundary, preserved behavior, compatibility boundary, side effect, or user-owned trade-off. Update the canonical Target, invalidate stale evidence as required by the task workflow, and present the revised Task Target again.

Do not realign for implementation-only changes such as file paths, functions, algorithms, internal plans, or verification commands when the confirmed result and boundaries remain unchanged. Canonical Targets may be refined from authoritative sources without another confirmation only when the user-facing commitment remains materially identical.

## Consumer Responsibilities

- `task` supplies the intended outcome and observable completion condition for one independently acceptable result.
- `task-plan` supplies the intended planning outcome and observable condition for an implementation-ready handoff.
- `task-queue` supplies the parent integration outcome and observable completion condition.
- Each consumer names its permitted lifecycle writes before confirmation and its next step after confirmation.
- Default Agent rules and lifecycle dispatchers retain stable routing, activation order, mandatory gate, and skip boundaries. They defer the detailed alignment semantics to this protocol rather than copying them.
- The shared task core owns persistent record state, Targets, evidence, relationships, and completion gates; it does not persist conversational confirmation.
