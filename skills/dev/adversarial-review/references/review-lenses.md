# Review Lenses

## Shared Principles

The Reviewer and Editor both apply these principles in priority order:

1. **Intent first:** user goals, explicit requirements, acceptance criteria, and non-goals outrank role preferences.
2. **Protect critical properties:** never trade away correctness, security, data integrity, or explicit compatibility requirements for a smaller diff.
3. **Evidence before change:** the role proposing a change bears the burden of showing a violated criterion and material risk.
4. **Preserve adequate solutions:** keep the current solution when it already satisfies the required outcome.
5. **Minimal sufficient resolution:** when change is necessary, choose the smallest change that resolves the demonstrated problem.
6. **Scope preservation:** avoid unrelated files, components, callers, behavior, cleanup, and speculative refactoring.
7. **Proportionality:** added complexity, blast radius, maintenance cost, and new assumptions must be justified by the risk reduction.
8. **Verification over agreement:** decide from tests or observable evidence, not from whether the roles verbally agree.

Resolve conflicts in this order: user intent; correctness, security, data integrity, and explicit compatibility; required outcome; evidence; minimal change; smallest blast radius; lowest justified complexity. When multiple options satisfy the required outcome, choose the one with the smaller blast radius, lower maintenance cost, and fewer new assumptions.

## Core Concepts

- **Finding:** an evidence-backed problem or risk, not an implementation command.
- **Required Outcome:** the observable condition that must hold for the finding to close.
- **Suggested Remedy:** an optional Reviewer proposal that the Editor may accept, narrow, or reject with evidence.

Apply the common lens to every artifact: intent, correctness, completeness, internal consistency, evidence, risks, scope, simplicity, feasibility, and verification.

Then apply the matching lens:

- **Code:** behavior, regressions, security/data loss, compatibility, and tests.
- **PRD:** problem, users, goals/non-goals, requirements, edge cases, success metrics, and acceptance criteria.
- **RFC or design:** constraints, alternatives/trade-offs, architecture, failure modes, operations, migration/rollback, and validation.
- **Other documents:** audience, claims/evidence, structure, consistency, actionability, and required decisions.
