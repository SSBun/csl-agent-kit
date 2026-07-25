---
name: adversarial-deliberate
description: Runs an uncapped Coordinator-mediated Synthesizer–Challenger loop that develops a comprehensive answer through full-batch internal discussion, asking users only for key choices. Use only when the user explicitly requests iterative adversarial or multi-perspective synthesis of a question, topic, idea, decision, or plan. Exclude approval-gated artifact review, one-pass feedback, factual answers, brainstorming without that loop, and user grilling.
---

# Adversarial Deliberate

## Contract

- Use a Coordinator, a Synthesizer, and an independent Challenger. The Coordinator may synthesize, never challenge.
- Route exchanges through the Coordinator; reuse both roles and send complete state.
- Prefer real isolated subagents for the Synthesizer and Challenger when the host can dispatch them; fall back to inline role-play with `ISOLATION: simulated` disclosed. Follow [Subagent Dispatch](../adversarial-review/references/subagent-dispatch.md).
- Discuss internally first. Ask only about material user-owned choices that research, reasoning, or a reversible default cannot settle.
- Process every related topic and visible issue per pass; never drip-feed known issues.
- Set no round limit. Use `CONTINUE` only for a material open issue with a concrete next-pass change; otherwise stop or pause.
- Without an independent Challenger, disclose that the discussion cannot run; never simulate sufficiency.
- Create resources only when authorized.

## State

Have the Coordinator maintain and transmit:

```text
QUESTION AND GOAL:
CONSTRAINTS / NON-GOALS:
FACTS / SOURCES:
TOPIC BUNDLE:
ASSUMPTIONS / DEFAULTS:
CURRENT ANSWER:
ISSUES / RESOURCES:
LIMITATIONS / USER DECISIONS:
```

Give each topic a fixed T-ID. Allocate D-IDs monotonically; never reuse or renumber them, and reopen an issue under its original ID. Send the complete answer, not a diff.

Follow [Resource Handoff](references/resource-handoff.md). Verify access; changed resources invalidate dependent conclusions.

## Workflow

### 0. Resolve dispatch mode

Detect the host's dispatch capability, **verify the dispatch path is actually ready (on Pi: the `pi-agent` carrier is registered and spawnable; on Codex: the host can spawn an agent process)**, record the mode and per-role readiness once per run, and print the dispatch metadata table to the user as the first output of the run — before any role pass — as specified in [Subagent Dispatch](../adversarial-review/references/subagent-dispatch.md). If all roles are `ready`, enter `SUBAGENT` mode without asking; if any role is `missing`, present the table and ask the user whether to proceed in `INLINE-FALLBACK`, and enter it only on explicit confirmation. Never enter the loop on an unverified dispatch path. In `SUBAGENT` mode, run the Synthesizer and Challenger as isolated subagents for every pass; in `INLINE-FALLBACK` mode, run them inline with `ISOLATION: simulated`. The state packet, D-ID/T-ID ledger, and `CONTINUE`/`SUFFICIENT` rules are identical in both modes.

### 1. Build a provisional brief

Infer the goal, constraints, topics, and assumptions. Research discoverable facts. Ask one intent question first only when provisional analysis cannot begin.

### 2. Run a complete internal batch

Have the Synthesizer cover the full topic bundle, including conclusions, alternatives, uncertainty, and cross-topic effects. Have the Challenger report every visible error, gap, counterpoint, risk, trade-off, and inconsistency:

```text
STATUS: CONTINUE | SUFFICIENT | NEEDS_USER | BLOCKED
D1 [ERROR|GAP|COUNTERPOINT|SUGGESTION|USER_DECISION] [T1,T2]
Evidence: ...
Impact: ...
Requested response: ...
CONTEXT HANDOFF: <entries or none>
```

Use `CONTINUE` only when at least one material D-ID remains open, and name the new evidence, state change, or actionable answer change expected next pass. Non-material suggestions never block `SUFFICIENT`. If an issue repeats without any of those changes, have the Coordinator require the Challenger to choose `SUFFICIENT` or state an actual `BLOCKED` condition.

Use `SUFFICIENT` only when no material error, gap, or intent ambiguity remains. A late issue must name what made it newly actionable.

### 3. Resolve internally or ask one key choice

Resolve facts and reasoning gaps internally. Record recommended defaults for minor reversible choices. Open `NEEDS_USER` only for unresolved user-owned choices that materially change the outcome and are risky to guess.

Merge issues sharing one choice. Ask one question with `2–3` options, a recommendation, and effects; never relay low-level questions. Send the answer to both roles and resume.

### 4. Revise and recheck

Have the Synthesizer answer every issue together and return the complete revision:

```text
D1: ACCEPTED | REJECTED | REFRAMED | NEEDS_USER
Evidence: ...
Change: ...
REVISED ANSWER: <complete answer>
CONTEXT HANDOFF: <entries or none>
```

Rejections require evidence. Return the answer, ledger, and resources to the same Challenger. Recheck every prior ID and topic in one pass.

```text
STATUS: CONTINUE | SUFFICIENT | NEEDS_USER | BLOCKED
D1: RESOLVED | OPEN | NEEDS_USER | BLOCKED
Evidence: ...
Next change: <required when OPEN>
```

The Challenger must report every existing D-ID. Use `SUFFICIENT` only after every material D-ID is `RESOLVED` and every T-ID has been rechecked.

### 5. Deliver

At `SUFFICIENT`, return the complete Synthesizer answer plus limitations or resources. Coordinator edits require recheck. At a blocker or user stop, return the current answer with unresolved items and limitations.

After routing changes, rerun `evals/trigger_cases.json` with `evals/semantic_config.json`.
