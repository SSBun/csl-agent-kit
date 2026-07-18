---
name: adversarial-code-review
description: Fail-closed, two-agent adversarial code review for file changes. Use before committing or completion when an independent Reviewer questions the diff, a separate Editor answers every item, and the same Reviewer returns APPROVED. Exclude one-pass review without remediation and approval.
---

# Adversarial Code Review

## Gate Contract

- Start `BLOCKED`; the Reviewer and Editor must be distinct agents.
- While `BLOCKED`, no participant may create or amend commits, push, merge, rebase, or tag.
- `APPROVED` is review evidence only; commit only when separately requested.
- Reviewed file changes invalidate `APPROVED`; return to `BLOCKED` and re-review.
- No independent agent: fail closed; never self-review.

## Roles

- **Coordinator:** Pins scope, preserves the gate, routes reports, and reports the verdict; may be Editor, never Reviewer.
- **Reviewer:** Read-only; inspects the request, rules, diff, and checks; questions, approves, or blocks; never edits or commits.
- **Editor:** Answers every item, makes scoped fixes, runs checks, and requests re-review; never self-approves or commits while blocked.

Reuse the Reviewer. If lost, assign a new independent Reviewer and restart against the complete current diff.

When either role finds multiple materially different fixes or implementation plans, remain `BLOCKED` and follow [Decision Consensus Gate](references/decision-consensus.md) before choosing one.

## Workflow

### 1. Pin the review packet

Give the Reviewer only task-local evidence:

- request, acceptance criteria, and non-goals
- repository rules and standards
- review base, changed files, final diff, and relevant untracked files
- checks, logs, and known limitations
- unrelated existing changes to preserve

Exclude the Editor's reasoning and proposed answers from the first Reviewer prompt.

### 2. Run the adversarial pass

Ask the Reviewer to examine intent, correctness, regressions, security/data loss, scope, simplicity, compatibility, and verification. Require:

```text
VERDICT: BLOCKED
R1 [BLOCKER|QUESTION|NOTE] path:line
Evidence: ...
Risk: ...
Question: ...
```

`BLOCKER` and unanswered `QUESTION` items keep the gate blocked. A `NOTE` is non-blocking and optional to fix, but every numbered `NOTE` requires Editor acknowledgement. With no blocking items, the Reviewer may return `VERDICT: APPROVED` with scope and evidence.

### 3. Answer or fix

Send the numbered report to the Editor. Require per item:

- accepted: root cause, fix, correctness, and verification evidence
- rejected: direct answer and repository evidence showing no change is needed
- user-owned scope or risk decision: leave blocked and ask the user instead of assuming

After fixes, send the ledger, checks, and complete new diff to the same Reviewer and request approval.

### 4. Re-review until resolved

The Reviewer verifies every answer and new change, then returns exactly one state:

- `VERDICT: BLOCKED` with remaining or newly introduced numbered items
- `VERDICT: APPROVED` with reviewed scope, resolved items, and verification evidence

Route `BLOCKED` to the Editor. Never cap rounds or downgrade unresolved findings.

### 5. Close the gate

Before completion or a separately authorized commit, confirm the working diff matches the approved diff. Report:

```text
Gate: APPROVED
Reviewer: <agent identity>
Scope: <review base and changed files>
Rounds: <count>
Resolved: <finding IDs>
Verification: <commands or evidence>
Commit authorization: <separate user instruction or not authorized>
```

## Maintenance

Keep `evals/trigger_cases.json` passing against `evals/semantic_config.json` after routing changes.
