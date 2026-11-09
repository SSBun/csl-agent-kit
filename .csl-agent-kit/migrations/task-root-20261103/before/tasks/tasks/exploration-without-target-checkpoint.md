# Skip Target checkpoints for exploration tasks

| Field | Value |
| --- | --- |
| Status | Blocked (2026-10-23 14:41) |
| Artifacts | [Artifacts](../artifacts/exploration-without-target-checkpoint/) |
| Kind | Task |

## Target
- [x] T1: Exploration can inspect, analyze and report without a Target confirmation while retaining task records and required clarification.
- [x] T2: Moving from exploration into implementation restores the applicable confirmation and authorization checks, with consumers and evaluation cases consistent.

## Scope

Implement the exploration exemption proposed in the preceding response and authorized by the user's “continue”: inspection, research, analysis and planning proceed without generic Target confirmation; necessary user decisions and the implementation boundary retain their checks. Keep existing task ownership, quality gates and mode configuration. Do not implement the other optimization proposals from the earlier analysis.

## Plan

1. Define exploration eligibility, allowed outputs, explicit holds and the transition into implementation in the shared alignment protocol; update its direct workflow and injected-contract consumers.
2. Extend the existing versioned evaluation contract and contrast cases for exploration continuation, scope escape, user decisions, explicit holds and implementation handoff; keep scorer regressions aligned.
3. Run permitted structural, fixture, syntax and Skill Quality validation, update affected Context, self-check the task-owned diff, then apply the required review/completion gates.

- Required input: A fresh reviewer API with actual read-only tool restrictions. Tests and model/host replays remain unrun without explicit authorization; the recorded source and structural checks are available for the review.

- Current artifacts: Shared protocol and Task/Plan/Queue consumers, injected Contract, v6 evaluation suite and scoped diff under this task's evidence directory.
- Next action: Run a fresh independent Task Review with actual read-only tool restrictions against the recorded snapshot; remediate findings, refresh affected evidence and complete final verification.

## Decisions

The user's preceding proposal and “continue” authorize this specific policy adjustment; do not add a redundant checkpoint for the same described change. Exploration is determined by the current authorized work, not the word “explore” or the size of a diff. A request to investigate and fix remains an implementation request. No confirmation preference is changed, and exploration does not create accepted_target evidence.

The shared protocol now selects null-level `continue_exploration` after readiness/equivalence checks, allowing investigation, analysis and read-only planning without generic Target confirmation. Task/plan records and explicitly requested findings reports are permitted outputs. Explicit check-first instructions, blocking user decisions, commitment changes and independent safety/tool boundaries retain their gates. In-scope investigation graph changes and missing historical acceptance do not create an exploration checkpoint. A later implementation request applies normal implementation alignment; prior exploration is not accepted-target evidence. Queue execution remains implementation work.

The project-local suite moves from v5 to v6 because its input/action contract now includes `workType` and `continue_exploration`. Existing case IDs are retained; equivalent planning candidates use exploration continuation, while L3/L4 and accepted implementation handoff cases retain their protections. Six new contrast scenarios cover investigation versus code changes, a requested findings report versus parser edits, explicit user hold, resume/reordered investigation, implementation after unaccepted exploration, and investigate-and-fix. The scorer records illegal exploration continuation as under-guard, checkpoint bypass and/or illegal transition as applicable; self-test regression definitions cover unnecessary exploration checkpoints, misuse on implementation and ignored explicit holds. These self-tests were added but not executed.

Owner self-check compared the accepted proposal, both Targets, all task-owned edits and unchanged mode/core boundaries. No task-core persistence fields, settings, runtime tool interceptor, model runner or dependency were added. Existing dirty workspace edits were preserved; the task-scoped diff uses copies captured before this task's edits rather than attributing all HEAD differences to this task. Only CTX-task-workflows and CTX-project-evals workflow paragraphs needed maintenance; CTX-agent-hooks injection ownership remains unchanged. Project Core and the three existing unindexed sections were preserved. Skill package prose and fixtures added by this task are English.

Observed permitted checks: evaluator validate succeeds for 61 scenarios / 122 cases; request preparation produces 122 v6 oracle-free packets with both work types; evaluator and both touched test sources pass Node syntax checks; project eval layout and Context validation are valid; git diff --check succeeds. All five changed skill packages have zero Skill Quality failures. Accepted initial-load token warnings: Task 10180, Task Plan 2004, Task Queue 2538, Agent Hooks 1621, project eval Skill 1559. Context retains the existing Components, Relationships, and Decisions and Conventions indexing warnings; no historical text was deleted to suppress them.

The auxiliary Skill Creator quick_validate command could not start because the Python environment lacks PyYAML (`ModuleNotFoundError: yaml`); no dependency was installed. The required repository Skill Quality validator, which uses existing project dependencies, completed for all changed packages. No unit tests, evaluator self-tests, paid model runs or real host interaction replay were executed. Schema/fixture validation and source inspection do not establish Agent behavioral accuracy, real waiting or scorer regression execution. The host offers no task_focus tool; the record is activated without claiming a successful host focus binding.

## Task Summary

**Task alignment** — [shared protocols](../../skills/meta/csl-tasks/shared/): added the exploration continuation rule, explicit-hold exceptions and implementation transition.

**Task workflows** — [Task](../../skills/meta/task/), [Task Plan](../../skills/meta/task-plan/) and [Task Queue](../../skills/meta/task-queue/): aligned workflow dispatch and handoff instructions; Task and Task Plan routing fixtures include exploration without generic confirmation.

**Agent Hooks Contract** — [Agent Hooks](../../skills/meta/agent-hooks/): injected guidance describes exploration exemption and the implementation boundary.

**Project evaluation suite** — [evals](../../evals/): versioned the contract to v6, extended validation/request/scoring and unrun regression definitions, added six contrast scenarios and updated the project-local evaluation Skill and documentation.

**Contract assertions** — [tests](../../tests/): updated existing assertions for the changed protocol and injected Contract; no tests were executed.

**Project documentation** — [README](../../README.md): documented exploration behavior. Updated affected Context Pack facts without altering Core or unrelated content.

## Block

- Reason: This changes confirmation/authorization policy across workflows and the evaluation schema, so the actual result is R2. Task Review requires a fresh agent with host-enforced read-only tool restrictions; the available collaboration.spawn_agent supports fresh context but has no tool-restriction argument. A prompt alone does not satisfy that requirement. No placeholder review was launched and no independent pass is claimed.
- Unblock when: A host-provided fresh reviewer with actual read-only tool restrictions can access the recorded sources and task-scoped diff, run the authorized checks and return feedback. The owner must address findings, record the real review outcome and perform current final verification before completion.

## Result

- T1: Shared protocol, Task and Task Plan now dispatch equivalent exploration through null-level continue_exploration, preserving records, requested findings reports and genuine decision/explicit-hold checks. Source/consumer self-check and task-scoped diff confirm the rule; real Agent interaction remains unrun.
- T2: Implementation transition, mixed investigate-and-fix and Queue rules retain normal implementation gates. v6 validator passes 61 scenarios/122 cases; 122 oracle-free requests prepared; syntax/layout/Context and five Skill Quality gates have no failures. See Decisions and evidence/task-changes.diff for scope and known warnings; tests/self-tests/model replays unrun.
- Review gate: Required — R2 requires a fresh independent Task Review of the recorded 16-file snapshot. Capability preflight found no host-enforced read-only restriction in the available fresh-agent API; no placeholder or prompt-only review was launched.
## Review Assessment

- Schema: task-review-assessment/v1
- Level: R2
- State: Current
- Reason: Confirmation/authorization policy changes span the shared protocol, three workflows, injected instructions and a versioned evaluation schema; they require the fresh independent review gate.
- Snapshot: snapshot:tasks/artifacts/exploration-without-target-checkpoint/evidence/89e7c9498843b1543c93a251a7089565afd8f8f9d046997f657e47259178c2e6.json#89e7c9498843b1543c93a251a7089565afd8f8f9d046997f657e47259178c2e6
- Evidence: Owner self-check and T1/T2 Result observations cover the task-scoped diff, 122-case fixture/request validation, syntax/layout/Context and five zero-failure Skill Quality results; behavioral/model/scorer regressions remain unrun. Decisions records warnings and the unavailable auxiliary Python validator.
- Task fingerprint: 2f774e05fdf2b6f4de513004f3037f097387e445e1ab4a77919383ab0c4cbeb5
