# Task Review Grading Protocol

This protocol owns R0/R1/R2 classification for the owning Task and Queue integration outcome. It is independent of Task Target alignment levels and the Safety Overlay. Classification never waives user-requested review, safety authorization, required checks, or final verification. `task-review` still owns one read-only pass; the main Agent owns classification and remediation.

## Classify the Actual Result

After owner self-check and current per-Target Result evidence, inspect the actual task-owned changes, relevant unchanged consumers, and allowed verification. Do not grade from the original estimate, file count, line count, filename, a passing syntax check alone, or confidence alone.

| Level | Criteria | Default completion route |
| --- | --- | --- |
| R0 | No requested deliverable files changed. Task, Context, and Lessons lifecycle writes alone do not count. | Record assessment, `skipped`, then final verification. |
| R1 | A simple file-changing result satisfies every exemption condition below. | Record all four grounds, `skipped`, then final verification. |
| R2 | Complex changes, high-consequence changes, or material uncertainty prevent an R1 condition from being established. | Record assessment, `required` → In Review → fresh independent `task-review`; remediate and re-review until `passed` or Blocked. |

R1 may include small logic changes; it is not limited to prose, formatting, or mechanical substitutions. All four conditions must have concrete, task-specific grounds:

1. **Result clarity:** the intended result and preserved behavior are settled, with no unresolved requirement interpretation.
2. **Bounded impact:** the affected behavior, direct consumers and failure paths are understood; checking them does not require coordinating multiple interacting behavioral changes or speculative assumptions.
3. **Low risk:** failure has limited, recoverable consequences. Security, authorization, privacy, irreversible data operations, financial effects, or important compatibility boundaries cannot be waived because the diff is small.
4. **Sufficient verification:** direct comparison or currently authorized deterministic checks establish the relevant Target and preserved behavior. Name actual checks, observations and limitations; do not claim unrun tests. A missing required check or unproven Target blocks completion, not merely changes the level.

Examples: a verified prompt-text correction can be R1; a bounded presentation-only conditional with checked callers and observable behavior can be R1; a one-line permission bypass is R2; a cross-host policy migration is R2; many fully mechanical low-risk replacements can still be R1 if their complete scope is verified. Missing evidence is not evidence of low risk.

## Explicit Review and Existing Obligations

- A user-requested ordinary review is honored at any level. An owning task uses `required` → In Review → `passed`; a feedback-only standalone review keeps its existing routing and does not recursively review its own feedback.
- `adversarial-review` remains explicit opt-in. R2 first completes mandatory `task-review`, then upgrades `passed` to `approved` with evidence of both. R0/R1 may enter `required` → In Review → `approved` directly when adversarial review was explicitly requested; they have no automatic ordinary pass.
- Once a Required review obligation exists, never replace it with Skipped. Reviewer unavailability, launch failure, delay, or a finding is not a downgrade reason. Preserve the existing failure and per-finding stall rules. A recorded R2 with an existing review obligation cannot be downgraded to R0/R1 to discharge that obligation.
- Reassess changed content, but preserve any already-required independent review. Fixes to an R2 result do not retrospectively exempt the pass that must examine them.

## Record the Assessment

Use the shared CLI while In Progress, after self-check and Result updates and before selecting the review gate:

```text
assess-review <id> <R0|R1|R2> --reason <specific-ground> --snapshot <content-identity> --evidence <self-check-reference>
```

For R1 also supply `--clarity`, `--impact`, `--risk`, and `--verification`, each with its concrete supporting observation. No flag authorizes running a check. The command writes exactly one current `## Review Assessment` section using `task-review-assessment/v1`, with Level, State, Reason, Snapshot, Evidence, the R1 grounds, and a core-generated Task fingerprint. Do not hand-edit it or store an assessment in the finding ledger.

R0/R1 without an explicit or existing review obligation may use `task`'s `finalize` path to record the same required evidence and completion in one operation. It retains every grading ground and final verification requirement; concise references to Result replace repeated prose, not the observations or current-content comparison. An explicit review still requires the normal Required path, and the core never infers conversational permission to skip it.

`Snapshot` names an actual recoverable content identity: exact revision for clean Git content; scoped staged/unstaged changes plus hashes for dirty/untracked/deleted/renamed artifacts; or equivalent non-Git identity. For R0, identify the no-file result and its evidence. An accessible manifest reference is sufficient if it pins these identities. HEAD alone is not a dirty-workspace snapshot. Exclude unrelated changes and secrets.

The core validates field structure, level/gate consistency, task-record freshness, and state transitions. A `snapshot:...#<sha256>` identity generated by `snapshot <id> --file ...` additionally checks the immutable manifest and current named file bytes/Git HEAD/index identities at assessment and terminal gates. `check-evidence <id>` also verifies registered report paths, digests and metadata correspondence. It does not select a semantic level, discover omitted scope, run checks, capture unstaged permission changes, or prove reviewer isolation. Plain-text historical and external identities remain owner-attested. The owner must compare complete scope and evidence before choosing a terminal gate and again before completion; checkpoint checks are not filesystem monitoring.

## Invalidation and Recovery

For Topic-bound tasks, the shared CLI additionally checks adopted/current normative revisions, pinned local dependencies, repository identity and the reciprocal task reference at assessment and terminal gates. This checkpoint check is not real-time monitoring or semantic approval. Topic adoption/binding changes invalidate normal task evidence; Required obligations remain. Historical Completed records retain their adopted version, while later work must recheck current applicability. A Topic-maintenance task adopts its own final changes before self-check. Archived and legacy Draft maintenance outcomes are distinct from implementation, which requires Active. New Topics start Active; this lifecycle state neither certifies specification completeness nor grants execution authorization.

- `sync`, Result changes, reopening, and relevant Queue graph/relationship changes mark an existing assessment Stale and clear Verification. A previous Skipped gate is removed; Passed/Approved become Required, preserving the independent-review obligation.
- Direct task specification or evidence drift is also detected by the Task fingerprint at a terminal gate or completion. The fingerprint excludes lifecycle status, the assessment, the review gate, finding ledger, persistent `Review Reports` index, Block and final Verification, not the substantive result/specification. The owner may append report-index bookkeeping without `sync`; this does not exempt substantive evidence drift. Managed report headers pin the assessment snapshot and Task fingerprint, and terminal gates verify their registered bytes and correspondence. The owner checks full report coverage and snapshot correspondence under `task`'s Review Reports contract before terminal gates.
- External artifact or evidence drift requires the owner to return to In Progress, refresh self-check and Result, and run `assess-review` again with the new identity. Do not reuse a stale snapshot string. A changed assessment invalidates terminal review and Verification even if its level stays the same.
- Freeze scope during an independent pass. A relevant change invalidates the pass and requires fresh self-check, assessment and independent review, not reuse of a no-findings response.
- When a fresh pass resolves every ledger finding without substantive drift, use `review <id> passed --resolve-ledger --snapshot <exact-assessment-snapshot> --evidence <pass-and-resolution-reference>`. The core atomically removes the marked ledger and records Passed while retaining the unchanged assessment, and clears Verification. It requires In Review, Required, current task fingerprint, matching snapshot and no stalled finding. The owner still verifies external content and the fresh Reviewer's per-ID resolutions; the CLI does not prove those facts. Do not hand-delete this final ledger and call `sync`, which intentionally invalidates assessment. Intermediate manual ledger changes still use normal sync and a new pass.
- All terminal gates and completion require a current assessment. Historical records without an assessment remain readable and are not mass-migrated; active/resumed/reopened work must add one before a new terminal gate or completion. Planning-only Pending records do not need one.

Queue children classify their own outcome. The parent separately classifies parent-owned deliverable changes after checking its integration Targets; no parent-owned changes is R0, not a waiver of integration verification. Child reopening and graph changes invalidate the parent's assessment and completion evidence. Changing a Completed child's relationship requires explicitly reopening that child first; a fully identical reciprocal `link` is a no-op that preserves both records and their evidence, even when already Completed. Completed children never substitute for the parent's own final gate.

## Validation Boundary

Keep the CLI, task core, Task/Queue instructions, injected contract, explicit adversarial-review integration, and grade/gate fixtures aligned. Cover R1 logic changes, small high-risk changes, missing exemption grounds, stale evidence, existing obligations, historical records, explicit review and Queue invalidation. Run only authorized checks; classify this policy/core change as R2 and retain the independent review requirement.
