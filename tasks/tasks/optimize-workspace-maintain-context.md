# Optimize workspace context for durable decision value

**Status:** Completed (2026-07-23 20:38)

## Scope

- Rewrite the workflow skill's main contract around durable, decision-changing, verifiable workspace context.
- Add semantic cases and regression checks for admission, routing, mutable values, temporary facts, and maintenance.
- Preserve the current `tasks/context.md` content; cleanup or migration of existing entries is outside this task.
- Keep the complete operational contract in the main `SKILL.md`; the local quality gate's 1000-token initial-load budget remains advisory only.

## Target

- [x] T1: Context admission requires confirmed, project-specific information whose absence changes future decisions and whose concise summary is more valuable than repeated reconstruction.
- [x] T2: The skill distinguishes durable context from tasks, lessons, rules, SOPs, ADRs, executable sources, sensitive data, and real-time values while covering canonical sources, verification boundaries, and sourced negative knowledge.
- [x] T3: Mutable and temporary entries record stable decision boundaries, authority, review triggers, and event-based exit; changed or invalid facts are updated, migrated, or removed in the same work.
- [x] T4: Representative positive, negative, and boundary cases plus contract tests enforce the new behavior, and all applicable validation passes except the accepted local quality gate initial-load budget result.

## Plan

1. Replace the broad Store/Exclude contract with explicit admission, routing, entry, mutation, and lifecycle rules.
2. Add semantic fixtures and focused regression assertions without adding scripts or reference files.
3. Run routing, skill, rule, and focused test validation, then complete the required independent review.

## Result

- T1: `SKILL.md` now applies seven admission conditions plus a final decision-impact check; discoverability is only a cost signal, not an automatic exclusion.
- T2: The inline Store and Route Elsewhere contracts cover canonical authority, lifecycle and verification boundaries, sourced negative knowledge, stable approval/environment boundaries, tasks, lessons, rules, SOPs, ADRs, executable truth, sensitive data, and real-time state.
- T3: `context_value_cases.json` and its focused assertions accept a temporary entry only with current evidence, a responsible role or module, and every required exit event; normal entries still require an authoritative source. Contract assertions also pin promotion, authoritative-carrier migration, deletion, and same-work update/migration/removal.
- T4: Both focused workspace-context tests passed; `quick_validate.py` passed; local quality gate validation passed syntax/frontmatter, lint, governance, and all other resource checks, with only the accepted `Estimated initial-load tokens exceed budget: 2353 > 1000` result.
- Review gate: Required — this changes the global Agent context lifecycle and the facts injected into future sessions.
- Review: `APPROVED` after two Reviewer passes; report: [optimize-workspace-maintain-context](../../reports/adversarial-review/optimize-workspace-maintain-context.md)
