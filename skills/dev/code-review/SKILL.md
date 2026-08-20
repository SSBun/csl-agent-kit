---
name: code-review
description: Review PRs, MRs, branches, worktree changes, or supplied diffs for defects, security, spec compliance, standards, tests, and maintainability. Use for code review, PR/MR review, the current diff, or changes since a fixed point. Do not use for non-code documents, whole-codebase audits, implementation, or explicit independent/adversarial approval.
---

# Code Review

Review actual code changes once. Repository rules override bundled guidance.

## Workflow

1. Resolve a non-empty review target from a PR/MR, supplied diff, current worktree, or user-provided fixed point. Follow `references/review_workflow.md`; ask only when no target can be identified.
2. Establish intent from the request, PR/MR description, issues, and commits. Use an explicit or clearly matching spec when available; otherwise skip the Spec lens and state that boundary. Do the same for documented repository standards.
3. Review in this order:
   - **Correctness, security, and data safety** — behavior, edge cases, trust boundaries, destructive operations, concurrency, compatibility, and affected callers.
   - **Spec** — missing, partial, incorrect, or unrequested behavior, cited to a requirement.
   - **Standards** — documented violations first; general smells remain judgment calls.
   - **Tests** — the specific risky behavior left unprotected.
   - **Maintainability** — complexity, duplication, unclear responsibilities, and local pattern drift with concrete cost.
4. Read enough surrounding code to prove each finding, but do not expand into a whole-codebase audit. Use `references/` only as needed.
5. Run tests or linters only when useful and allowed. Never claim results that were not observed.
6. Write in the user's language and follow the finding contract in `references/review_workflow.md`.

## Output Rules

Group findings by severity, highest first:

- **Critical** — must fix before merge due to incorrect behavior, security exposure, data loss, or material spec failure.
- **Suggestion** — a demonstrated non-blocking issue worth fixing.
- **Nit** — low-risk polish; omit preference-only comments.

Every finding needs a lens, `file:line`, impact, evidence, and the smallest actionable fix. End with counts and material unverified lenses or checks. If no issue is demonstrated, say so and do not manufacture feedback.

This ordinary review does not require a fixed point, spec, parallel subagents, or independent approval. Use `adversarial-review` only when the user explicitly requests its Reviewer–Editor gate.

## References

- `references/review_workflow.md` — target resolution, criteria discovery, and finding format.
- `references/code_review_checklist.md` — correctness, safety, compatibility, and test checks.
- `references/coding_standards.md` — fallback standards when the repository has no stronger rule.
- `references/common_antipatterns.md` — risk-bearing antipatterns, not style preferences.

## Maintenance

Run `evals/trigger_cases.json` with `evals/semantic_config.json` after routing changes, `evals/contract_cases.json` after contract changes, then Yao and the resource check.
