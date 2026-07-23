---
name: workspace-maintain-context
description: Maintain `tasks/context.md` as the compact, durable workspace model used across sessions. Use at session start, after resume or compaction, and before ending work when confirmed project-specific facts that affect future decisions change, including component boundaries, cross-system relationships, domain invariants, canonical sources, lifecycle or verification constraints. Exclude task progress, correction lessons, rules and procedures, speculation, sensitive data, one-off details, and cached real-time values.
---

# Maintain Workspace Context

## Purpose

Use `tasks/context.md` as the workspace's durable cognitive homepage. Preserve the smallest set of confirmed facts needed for a future Agent to form a correct initial model and avoid high-consequence mistakes.

Treat linked source, test, schema, configuration, ADR, SOP, rule, or formal document as authoritative. Keep low-frequency detail there; keep only its decision-changing summary and pointer in context. Do not impose a fixed line or token limit.

## Workflow

1. Treat the session-start directory as the workspace root.
2. At session start, after resume, or after compaction, read `tasks/context.md` and verify task-relevant entries against their authoritative sources before relying on them.
3. During work, identify confirmed changes to context entries, their authority, or their review triggers.
4. Before ending, update, migrate, or remove affected entries in the same work. Skip the write when no durable fact changed.

Routine context maintenance does not create a task record.

## Admission Gate

Store a candidate only when every condition holds:

1. `Confirmed`: source, test, schema, configuration, formal document, or explicit user confirmation supports it.
2. `Project-specific`: it is not generic engineering knowledge.
3. `Stable boundary`: the fact is stable; or its current value is mutable but the decision boundary and authoritative lookup are stable, omission is high-consequence, and a concrete review trigger exists.
4. `Decision-changing`: omission can change where to modify, how to interpret the domain, what proves success, which risk applies, or who approves.
5. `Summary-efficient`: a short entry is safer or cheaper than repeatedly reconstructing the relationship across relevant tasks.
6. `Correctly routed`: context is the right carrier for the fact and its decision effect.
7. `Verifiable`: the entry can name an authoritative source or, only while temporarily unrouted, current evidence plus an exit event.

Treat discoverability only as a cost signal. Exclude a directly recoverable fact when it does not change judgment; retain a concise cross-file relationship when rebuilding it repeatedly is costly or error-prone.

Final check: if removing the entry would not make a future Agent more likely to form a wrong model or make a worse engineering decision, do not store it.

## Store

- Component responsibilities and explicit non-responsibilities that determine the correct change location.
- Non-obvious dependencies, control flow, data flow, generation relationships, and canonical entry points.
- Project-specific domain terms and invariants, including the engineering consequence of misunderstanding them.
- Canonical sources and authority relationships, especially when other files are derived or descriptive.
- Stable lifecycle transitions and implicit side effects across components.
- Verification and observability boundaries: which stable signal proves the real outcome and why a local signal is insufficient. Keep commands in SOPs and assertion or probe details in tests or source.
- Stable constraints, compatibility boundaries, sourced non-goals, and negative knowledge whose omission invites a repeatedly wrong path. Include the consequence and an ADR, source, or formal document.
- Stable approval roles, CODEOWNERS mechanisms, module responsibility, and environment decision boundaries. Record where to query a mutable capability, never its cached current value.

## Route Elsewhere

- Current state, progress, results, evidence, next steps, branches, and workarounds → owning task record.
- Reusable Agent behavior after a correction → `tasks/lessons.md`.
- Mandatory or prohibited behavior → rules or `AGENTS.md`.
- Ordered operations, recovery, release, or incident procedures → SOP or runbook.
- Rationale, trade-offs, alternatives, and historical decisions → ADR or RFC.
- Executable local truth and detailed contracts → source, test, schema, or configuration.
- Meetings, investigations, and incident timelines → their dedicated records.
- Unconfirmed theories, one-off failures, ordinary preferences, and facts with no future decision effect → do not store.
- Secrets, credentials, access details, customer data, personal information, individual contacts, rumors, and live hosts, pods, flags, versions, or environment state → never store.

Allow one topic to be represented at different layers without copying full content. Context states the durable fact and decision effect; the other carrier owns enforcement, steps, detail, or rationale.

## Entry Contract

Keep one conclusion per entry in this shape:

`Fact — decision effect — authoritative source / concrete review trigger`

Prefer one or two sentences. Do not create empty sections or fill a fixed taxonomy. Organize headings around the workspace's real concepts, and keep the homepage short enough to scan into a correct initial model.

## Mutable Information

Never cache a mutable current value. Store only its stable decision boundary when omission is high-consequence:

- what decision depends on the value;
- where the current value is authoritatively queried;
- what event requires rechecking it.

A stable lookup does not qualify by itself. Exclude an obvious version or configuration pointer when consulting it is already the normal direct query and omission does not create a high-consequence mistake; record the boundary only when the relationship, divergence, or required lookup is non-obvious and decision-changing.

Before an important task relies on such an entry, verify the authoritative source.

## Temporary Unrouted Facts

Use a temporary entry only for a confirmed, decision-changing fact that lacks the proper durable carrier. Include the fact, effect, evidence, stable responsible role or module, and all applicable exit events.

Re-evaluate the entry when any event occurs:

1. the current task ends;
2. the related module next changes materially;
3. its evidence, source, assumption, or authority becomes invalid.

At that event, choose exactly one outcome:

- promote it to a normal context entry when it is stable and context remains the correct carrier;
- move the required rationale, procedure, rule, or contract to its authoritative carrier and keep only a context pointer when still useful;
- delete it when it is false, unverifiable, redundant, or no longer decision-changing.

Do not use calendar-based review dates as a substitute for these events.

## Maintenance

- Update or delete an entry in the same work that changes its conclusion, decision effect, authority, or review trigger.
- Rewrite the current truth in place; do not append history or preserve superseded tombstones unless an old state still constrains compatibility.
- Redirect moved authority; delete an invalid fact; migrate detail that has become rationale, procedure, enforcement, or a full contract.
- Delete entries that no longer change decisions, merely duplicate an obvious authoritative source, cache mutable state, lack verifiable authority, or cost more to maintain than they prevent in mistakes.
- Investigate material conflicts. Ask one focused question only when evidence cannot resolve a user-owned fact.
- Do not create a global periodic audit or individual context owner; the work that changes a fact owns its maintenance.

## Maintainer Validation

- Keep `evals/context_value_cases.json` aligned with the admission and lifecycle contract.
- Run focused contract tests, routing evaluation when the description changes, OpenAI validation, and Yao audit after edits.
- The only acceptable non-blocking failure is Yao `Estimated initial-load tokens exceed budget` against its 1000-token initial-load budget.
- Syntax/frontmatter, lint, governance, every other resource-boundary check, applicable routing evaluation, OpenAI validation, and tests remain blocking.
- Never delete, distort, or split core workflow guidance merely to satisfy the initial-load budget.
