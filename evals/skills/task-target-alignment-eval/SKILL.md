---
name: task-target-alignment-eval
description: Maintain this repository's project-local Task Target alignment evaluations. Use in CSL Agent Kit for level and Safety cases, fresh-context model runs, scoring, and protocol comparisons.
---

# Task Target Alignment Eval

Operate this project-local suite without shared Skill distribution.

## Workspace Boundary

1. Resolve the workspace with `git rev-parse --show-toplevel`.
2. Read `<workspace>/evals/README.md`, `<workspace>/evals/task-target-alignment/README.md`, and the authoritative protocol at `<workspace>/skills/meta/csl-tasks/shared/protocols/task-target-alignment.md`.
3. Treat `<workspace>/evals/` as canonical. The `.agents/skills/task-target-alignment-eval` entry is discovery-only and must remain a relative symlink to this package.
4. Never copy this Skill into `<workspace>/skills/`, a global Skill directory, package manifests, or installer enumeration.

## Workflow

1. Run `node <workspace>/evals/scripts/check-project-evals.js`, then run the evaluator's `validate` command before relying on the suite.
2. For fixture work, keep stable ASCII case IDs, versioned schemas, provisional oracle labels, two-variant contrast scenarios, main/delegated session roles, Plan change classification, `allowedDecisions`, risk, commitment-difference dimensions, reason requirements, and Safety Overlay. Keep `gateMode` report-only until human adjudication.
3. Keep deterministic validation and scoring separate from model execution. Use `prepare` to create oracle-free request JSONL and `score` or `compare` only with observed prediction/report files; never fabricate eval results.
4. For Pi model runs, use one parent-owned async `workflowScript` with the exact model under test and fresh-context evaluator children. For the 72-case baseline, split oracle-free packets into 18 unrelated batches of four and run three fresh repeats (54 children), using waves when the effective spawn or concurrency cap is lower. Randomize batch order; never let one child process the entire corpus or expose gold labels.
5. Save generated predictions and reports only under the suite's ignored `results/` directory unless the user explicitly approves a durable artifact.
6. Report under-guard, over-guard, L2 checkpoint, L3/L4 mismatch, Safety Overlay, child confirmation leak, stale-plan continue, reason completeness, transition, family, and stability metrics separately; never hide opposing regressions behind one aggregate score or present a provisional report as release approval.

## Commands

```text
node <workspace>/evals/scripts/evaluate-task-target-alignment.js validate
node <workspace>/evals/scripts/evaluate-task-target-alignment.js --self-test
node <workspace>/evals/scripts/evaluate-task-target-alignment.js prepare --output <workspace>/evals/task-target-alignment/results/requests.jsonl
node <workspace>/evals/scripts/evaluate-task-target-alignment.js score --predictions <predictions.jsonl> --output <report.json> --markdown <report.md>
node <workspace>/evals/scripts/evaluate-task-target-alignment.js compare --baseline <baseline.json> --candidate <candidate.json>
```

## Safety and Cost

- Obtain explicit authorization before paid model calls or scheduled evals.
- Do not store chain-of-thought, credentials, customer data, or unredacted session transcripts.
- Treat provider failures, timeouts, and invalid JSON as infrastructure failures, not guard-policy outcomes.

## Maintainer Checks

After changing this package or its activation boundary:

```text
node <workspace>/evals/scripts/check-project-evals.js
node <workspace>/evals/scripts/evaluate-task-target-alignment.js validate
node <workspace>/evals/scripts/evaluate-task-target-alignment.js --self-test
node <workspace>/skills/meta/skill-quality/scripts/check.js <workspace>/.agents/skills/task-target-alignment-eval
node <workspace>/skills/meta/task-context/scripts/context.js --workspace <workspace> validate
git -C <workspace> diff --check
```

Run project tests or paid model evaluations only when the current request explicitly authorizes them.
