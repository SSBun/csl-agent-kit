---
name: task-maintenance
description: Remove authority-proven stale history from workspace Context and Lessons, and merge semantically equivalent entries after an exact user-approved change set. Use only when the user explicitly asks to clean, consolidate, deduplicate, or maintain accumulated `tasks/context.md` and `tasks/lessons.md` history. Exclude ordinary Context updates, correction-driven Lesson maintenance, task-record archival, format migration, and automatic scheduling.
---

# Task Maintenance

Perform explicit cleanup of accumulated workspace knowledge. This Skill is a backstop: work that changes a fact or preventive rule still owns its immediate maintenance.

Routine runs do not create a canonical task, persistent report, audit ledger, timestamp, schedule, or long-lived owner. If cleanup requires changing another carrier, stop and route that work to its own task.

## Runtime Dependencies

Resolve this Skill's directory, then read these sibling contracts in full before auditing:

- `../task-context/SKILL.md`
- `../task-lessons/SKILL.md`

Use their existing read-only CLIs; do not implement another parser:

```text
node ../task-context/scripts/context.js --workspace <workspace> core|index|show <id>...|validate
node ../task-lessons/scripts/lessons.js --workspace <workspace> index|show <id>...|validate
```

`tasks/context.md` and `tasks/lessons.md` are the canonical maintenance inputs, not proof of their own correctness. Verify claims against the Authority named by Context, source, schema, tests, configuration, formal decisions, or the current higher-priority rule.

An explicit maintenance run may read each selected canonical file completely after preflight. This task-direct inspection is a narrow exception to normal Context orientation, which still loads only Project Core and task-relevant Packs.

## Scope

Produce only these cleanup operations:

- `Delete`: remove the smallest independently stale unit.
- `Merge`: replace compatible same-carrier units with one canonical unit.

`Keep` and `Defer` are internal decisions, not a general health report. Do not use this workflow for prose improvement, broad rewriting, rerouting, legacy migration, task archival, or cleanup outside Context and Lessons.

Context and Lessons have different responsibilities and must never be merged into each other.

## Preflight

1. Require an explicit user cleanup request. A calendar, daemon, hook, or inferred cadence is not authorization.
2. Default to both Context and Lessons; honor an explicit request that selects only one.
3. Load the sibling contracts above and run `validate` for every selected carrier.
4. Treat legacy Lesson warnings as compatible input. A missing Lessons file is an empty set and must not be created merely for maintenance.
5. If a selected carrier has a malformed current record, duplicate ID, missing required Context, or another validation error, make no cleanup writes to that carrier. Report the diagnostic; do not turn this workflow into format repair.
6. Use `index`, batched `show`, and direct file inspection to compare every selected unit. Include nonstandard Context content in the semantic scan even when the Context CLI does not index it.

## Delete Gate

Create a Delete candidate only when current evidence proves at least one condition:

- Authority contradicts or supersedes the content.
- The referenced object, path, component, or mechanism no longer exists.
- A more accurate canonical unit fully preserves the same decision effect, scope, Authority, and verification boundary, leaving no unique value.
- A stronger source, schema, type, test, lint rule, CI gate, or mandatory workflow fully prevents a Lesson's failure mechanism and leaves no residual Agent judgment.

Age, legacy format, wording similarity, low recent use, or lack of a recent match never proves staleness. Missing, ambiguous, or conflicting evidence means Defer.

Delete the smallest self-contained stale bullet or field. Delete an entire Context Pack or Lesson only when none of it remains valid.

Before removing a stable Context or Lesson ID, search current non-historical consumers. Preserve the referenced ID or Defer when removal would leave a live reference; do not expand this workflow to edit another carrier.

## Merge Gate

Create a Merge candidate only when every condition holds:

1. All source units belong to the same carrier.
2. They express the same decision boundary or prevent the same failure mechanism.
3. Their scopes are compatible and their valid requirements do not conflict.
4. One merged unit can retain every unique, current constraint and verification boundary without weakening meaning.
5. Live references can continue to resolve through the retained stable ID.

For Context:

- Keep the existing ID whose Scope and Authority best describe the merged result.
- Preserve every still-valid Authority and Recheck condition.
- Defer when no existing ID can remain canonical without changing live consumers.

For Lessons:

- Prefer an existing v1 ID with the most specific applicable Trigger; never use record age as priority.
- Deduplicate while preserving the complete valid Trigger, Rule, and Check sets.
- When a merge contains v1 and legacy records, retain the qualifying v1 ID.
- When every source is legacy, replace them with one new `L-YYYYMMDD-ascii-slug` v1 record.
- Leave every untouched legacy record unchanged.

A Merge candidate is atomic. The user may approve or reject the whole candidate, not an incomplete subset of its source units.

## Change Set and Confirmation

Do not write while discovering candidates. Present one exact change set grouped by Context and Lessons. Give every candidate a run-local ID such as `M1` and include:

- carrier and target/source IDs or smallest identifiable units;
- `Delete` or `Merge`;
- current Authority evidence and the conclusion it supports;
- exact before content; and
- exact final content, or an explicit removal marker.

Use one confirmation prompt for the displayed change set. The user may approve all candidates or name an exact subset. A question, hesitation, generic acknowledgment, or approval of only part of a Merge candidate does not authorize that write.

This confirmation gate applies to every cleanup write, including ordinary Context Packs that `task-context` may otherwise maintain automatically. It also satisfies the existing Project Core and Lessons confirmation requirements because the complete exact changes are visible.

If there are no evidence-backed Delete or Merge candidates, report that result and stop without writing.

## Apply and Verify

Treat each selected carrier as an independent transaction:

1. Preserve its exact pre-write content.
2. Apply all approved operations for that carrier in one coherent edit.
3. Run its existing `validate` command.
4. For Context, also rerun `core` and `index`; for Lessons, rerun `index`.
5. Re-read every surviving merged target and confirm all approved stale units are absent, all live references resolve, and all required fields and valid constraints remain.
6. If any structural or semantic check fails, restore the exact pre-write content and validate the restoration before reporting failure.

A successfully validated carrier remains changed if another independent carrier later fails. Report partial success explicitly.

## Failure and Routing

- Authority conflict or unavailable proof: Defer without writing.
- Live reference cannot be preserved: Defer and name the consumer.
- Missing Context: route to `task-context` bootstrap; do not create it here.
- Malformed data or duplicate IDs: report the blocker; do not repair it here.
- Required change belongs to source, rules, SOPs, tasks, or another carrier: report the boundary and use a separate owning task if the user authorizes it.
- Automatic or scheduled cleanup request: disclose that this Skill is explicit-only and do not create a scheduler, Hook, reminder, or state file.

## Completion

Report only approved operations applied, skipped approvals, deferred blockers that prevented cleanup, and current validation outcomes. Do not create a durable report or save maintenance history.

Completion requires every changed carrier to validate, every surviving merge target to preserve its approved semantics, and every failed carrier to be restored exactly.

## Maintainer Validation

Keep `evals/trigger_cases.json` and `evals/semantic_config.json` aligned with this Skill's explicit cleanup boundary. After modifying this package or its sibling contracts, run the built-in `$skill-quality` gate against every changed package, validate current Context and Lessons, verify shared Skill discovery and the Claude manifest, parse changed JSON/YAML, and run `git diff --check`.

Run project tests only when the user and governing project rules explicitly authorize them. Quality failures block completion; review context-budget warnings without deleting required workflow guidance.
