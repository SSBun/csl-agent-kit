---
name: adversarial-discuss
description: Runs an uncapped Coordinator-mediated Editor–Reviewer loop that corrects an answer until coverage is sufficient or new input is required. Use only when the user explicitly requests an iterative Editor–Reviewer or adversarial loop for multi-perspective analysis or devil's-advocate synthesis of a question, topic, idea, decision, or plan. Exclude approval-gated artifact review, one-pass feedback, simple factual answers, ordinary brainstorming without that loop, and user grilling.
---

# Adversarial Discuss

## Contract

- Use a Coordinator, an Editor, and an independent Reviewer. The Coordinator may be the Editor, never the Reviewer.
- Route every exchange through the Coordinator, reuse both agents, and send the complete state on every handoff.
- Set no round or cycle limit. Continue while the Reviewer returns `CONTINUE`.
- Stop or pause only at `SUFFICIENT`, `NEEDS_USER`, an objective blocker, or an explicit user stop.
- Without an independent Reviewer, disclose that the discussion cannot run; never simulate sufficiency.
- Create files or use external resources only when already authorized.

## Authoritative State

Have the Coordinator maintain and transmit:

```text
QUESTION AND GOAL:
CONSTRAINTS / NON-GOALS:
FACTS / SOURCES:
CURRENT ANSWER:
ISSUES / RESOURCES:
LIMITATIONS / USER DECISIONS:
```

Use stable issue IDs. Never hide or downgrade unresolved items. Send the complete answer, not a diff.

## Resource Handoff

When either role generates a resource needed by the other, follow [Resource Handoff](references/resource-handoff.md). Verify access before forwarding it. Changed resources invalidate dependent conclusions.

## Workflow

### 1. Produce the initial answer

Give the Editor the question, outcome, constraints, evidence, and resources. Require a complete answer with conclusions, support, assumptions, alternatives, uncertainties, and a resource handoff.

### 2. Challenge the answer

Give the Reviewer the complete state and registered resources. Check accuracy, completeness, evidence, omitted perspectives, counterexamples, risks, trade-offs, affected parties, and certainty.

```text
STATUS: CONTINUE | SUFFICIENT | NEEDS_USER | BLOCKED
D1 [ERROR|GAP|COUNTERPOINT|SUGGESTION]
Evidence: ...
Impact: ...
Requested response: ...
CONTEXT HANDOFF: <resource entries or none>
```

Use `SUFFICIENT` only when no material error or gap remains. Suggestions may remain optional, but the Editor must acknowledge them.

### 3. Answer and revise

Send the report and complete state to the Editor. Require one entry per finding plus a complete revised answer:

```text
D1: ACCEPTED | REJECTED | REFRAMED | NEEDS_USER
Evidence: ...
Change: ...
REVISED ANSWER: <complete answer>
CONTEXT HANDOFF: <resource entries or none>
```

Rejected findings require evidence. User-owned preferences, requirements, and risk choices remain unresolved.

### 4. Recheck without a cap

Merge the answer, ledger, and verified resources, then send the complete state to the same Reviewer. Verify prior responses and allow new findings. Continue while status is `CONTINUE`.

At `NEEDS_USER`, ask the exact question, send the answer to both roles, and resume. At an objective blocker or user stop, return the current answer with unresolved items and limitations.

### 5. Deliver the checked answer

At `SUFFICIENT`, return the checked Editor answer plus material limitations or resources. Coordinator edits require re-review.

After routing changes, rerun `evals/trigger_cases.json` with `evals/semantic_config.json`.
