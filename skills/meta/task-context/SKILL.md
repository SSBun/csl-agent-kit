---
name: task-context
description: Load, establish, and maintain dispatch-ready workspace context in `tasks/context.md`. Use at session start, after resume or compaction, when Context is missing or lacks a valid Project Core, before a concrete task needs project orientation, and before ending when confirmed durable project facts changed. Ensure a standard Project Core first, then query only task-relevant Context Packs. Exclude task progress, correction lessons, rules, procedures, speculation, secrets, cached live values, and explicit cross-record historical cleanup handled by task-maintenance.
---

# Maintain Workspace Context

## Purpose

Use `tasks/context.md` to give a newly dispatched Agent the project model needed to start a concrete task without repeating broad repository exploration, repo mapping, or architecture analysis.

Context accelerates orientation; it does not replace reading task-direct source and tests. Treat linked source, schema, configuration, ADR, SOP, rule, or formal document as authoritative. Verify task-relevant Authority before an important decision, and let Authority override stale Context.

Every workspace must have a standard Context before task dispatch. When an existing file lacks a valid Project Core, rewrite it from authoritative project sources without preserving its old content. When the file is missing, inspect the project, present a minimal Project Core proposal, and obtain explicit user confirmation before creating it. Routine context loading, bootstrap, and maintenance do not create a task record.

## Data Model

Keep one canonical `tasks/context.md` with two layers:

1. `Project Core` is the small project-wide model loaded at session start, resume, and compaction.
2. `Context Packs` are complete task-relevant models selected after a concrete task is understood.

Do not split records into another directory or persist a generated index, query cache, or selected IDs.

### Project Core

Use exactly these non-empty flat-list sections in this order:

```markdown
## Project Core

### Purpose
- ...

### Global Vocabulary
- ...

### System Map
- ...

### Global Invariants
- ...
```

Core explains what the project is, the vocabulary needed to form a Task Fingerprint, the major system boundaries, and invariants that apply across Packs. It is not a component catalog.

### Context Pack

Use a stable ASCII ID and this shape:

```markdown
## CTX-ascii-slug — Title
- Scope: ...
- Paths: `path/one`, `path/two`
- Keywords: term one, term two
- Authority: `authoritative/source`
- Recheck: Concrete event that invalidates or requires verifying this Pack.

### Purpose and Boundaries
- ...
```

Required metadata is exactly `Scope`, `Paths`, `Keywords`, `Authority`, and `Recheck`, once each before the body. Use one or more relevant, non-empty body sections from:

- `Purpose and Boundaries`
- `Vocabulary`
- `Structure`
- `Relationships`
- `Workflows`
- `Decision and Verification Boundaries`

A Pack is the retrieval unit. It may contain several related facts needed to understand one component or cross-component workflow. Keep each conclusion concise and source-backed; omit empty sections.

## Query Lifecycle

Resolve the skill directory from this `SKILL.md`, then use the read-only CLI:

```text
node <skill-dir>/scripts/context.js --workspace <workspace> core
node <skill-dir>/scripts/context.js --workspace <workspace> index
node <skill-dir>/scripts/context.js --workspace <workspace> show <id>...
node <skill-dir>/scripts/context.js --workspace <workspace> validate
node <skill-dir>/scripts/context.js --self-test
```

### Session Gate

At session start, after resume, or after compaction:

1. Treat the session-start directory as the workspace root.
2. Run `core` before acting.
3. If an existing Context has no valid Core, perform Existing Context Rewrite, rerun `core`, and use the replacement Core.
4. If `tasks/context.md` is missing, perform Missing Context Bootstrap and stop for confirmation before writing it.
5. Use the valid Core to form the initial project vocabulary and system model.

Outside Standard Context Bootstrap, do not read the whole Context file for orientation. An explicitly invoked `$task-maintenance` run may read the complete canonical file after loading this contract because the file itself is then the task-direct maintenance target; that exception does not apply to ordinary orientation.

### Task Gate

After understanding a concrete task:

1. Form a compact Task Fingerprint from its outcome, artifacts, domain, constraints, and likely component boundaries.
2. Run `index`; compare the fingerprint with each Pack's title, Scope, Paths, and Keywords.
3. Prefer recall: any plausible direct-path, component-boundary, or cross-component dependency match is a candidate.
4. Usually select one to three Packs, ordered by direct path, component boundary, then cross-component dependency.
5. Run one batched `show` for the selected IDs and apply each complete Pack.
6. Verify the selected Pack's Authority before important reliance or when Recheck applies.

Do not silently load every Pack. Keep selected IDs only in session state.

The script performs deterministic parsing, indexing, retrieval, and validation. The Agent owns semantic matching, Authority verification, admission decisions, and writes. The script must not edit Context, perform semantic matching, run validation commands from Context, or persist state.

### Completion Gate

Before ending:

1. Identify whether the work changed a selected Pack's conclusion, boundary, relationship, Authority, or Recheck event.
2. Update or remove affected Pack content in the same work.
3. Run `validate`; skip the write when no durable fact changed.

## Admission Gate

Store a candidate only when every condition holds:

1. `Confirmed`: source, test, schema, configuration, formal document, or explicit user confirmation supports it.
2. `Project-specific`: it is not generic engineering knowledge.
3. `Stable boundary`: the fact is stable; or its current value is mutable but the decision boundary and authoritative lookup are stable, omission is high-consequence, and a concrete review trigger exists.
4. `Decision-changing`: omission can change where to modify, how to interpret the domain, what proves success, which risk applies, or who approves.
5. `Summary-efficient`: a short entry is safer or cheaper than repeatedly reconstructing the relationship across relevant tasks.
6. `Correctly routed`: Context is the right carrier for the fact and its decision effect.
7. `Verifiable`: the entry names an authoritative source or, only while temporarily unrouted, current evidence plus an exit event.

Treat discoverability only as a cost signal. If removing the candidate would not make a future Agent more likely to form a wrong model or make a worse engineering decision, do not store it.

## Store

- Component responsibilities and explicit non-responsibilities that determine the correct change location.
- Non-obvious dependencies, control flow, data flow, generation relationships, and canonical entry points.
- Project-specific vocabulary and invariants, including the engineering consequence of misunderstanding them.
- Canonical sources and Authority relationships, especially when another file is derived or descriptive.
- Stable lifecycle transitions and implicit side effects across components.
- Verification and observability boundaries: which stable signal proves the real outcome and why a local signal is insufficient.
- Stable constraints, compatibility boundaries, sourced non-goals, and negative knowledge whose omission invites a repeatedly wrong path.
- Stable approval roles, module responsibility, and environment decision boundaries. Record where to query a mutable capability, never its cached current value.

## Route Elsewhere

- Current state, progress, results, evidence, next steps, branches, and workarounds → owning task record.
- Reusable Agent behavior after a correction → `tasks/lessons.md`.
- Mandatory or prohibited behavior → rules or `AGENTS.md`.
- Ordered operations, recovery, release, or incident procedures → SOP or runbook.
- Rationale, trade-offs, alternatives, and historical decisions → ADR or RFC.
- Executable local truth and detailed contracts → source, test, schema, or configuration.
- Meetings, investigations, and incident timelines → their dedicated records.
- Unconfirmed theories, one-off failures, ordinary preferences, and facts with no future decision effect → do not store.
- Secrets, credentials, access details, customer data, personal information, and live hosts, pods, flags, versions, or environment state → never store.

Context states the durable fact and decision effect; the other carrier owns enforcement, steps, detail, history, or rationale.

## Authority and Writes

- For an ordinary Pack, source-backed Add, Update, or Delete may happen automatically within the owning task. Preserve the pre-write file, make the smallest change, then run `validate`.
- Replacing the current workspace's existing Context when it lacks a valid Project Core is pre-authorized and runs without a separate confirmation.
- Creating a missing `tasks/context.md` requires showing the exact complete proposed file and obtaining explicit user confirmation first.
- Every other persistent Project Core change requires showing the exact proposed diff and obtaining explicit user confirmation first.
- Stop and ask before a source conflict, user-owned business judgment, unverified fact, or any write to another workspace.
- If validation fails, restore the pre-write content and report the diagnostics.
- Rewrite current truth in place. Do not append history or retain superseded tombstones unless an old state still constrains compatibility.
- The work that changes a fact owns its same-work maintenance. Do not create a scheduler, automatic periodic audit, or persistent Context owner. Explicit user-requested cross-record cleanup belongs to `$task-maintenance`, whose exact change-set confirmation gate is stricter than ordinary source-backed Pack writes.

## Mutable Information

Never cache a mutable current value. Store only its stable decision boundary when omission is high-consequence:

- what decision depends on the value;
- where the current value is authoritatively queried;
- what event requires rechecking it.

A stable lookup does not qualify by itself. Exclude an obvious version or configuration pointer when consulting it is already the normal direct query and omission does not create a high-consequence mistake.

## Temporary Unrouted Facts

Use a temporary fact only when it is confirmed and decision-changing but lacks the proper durable carrier. Include its effect, evidence, stable responsible role or module, and every applicable exit event:

1. the current task ends;
2. the related module next changes materially;
3. its evidence, source, assumption, or Authority becomes invalid.

At that event, choose exactly one outcome:

- promote it into the appropriate Pack when stable and Context remains the correct carrier;
- move rationale, procedure, rule, or contract detail to its authoritative carrier and keep only a useful Pack pointer;
- delete it when false, unverifiable, redundant, or no longer decision-changing.

Do not substitute calendar review dates for these events.

## Standard Context Bootstrap

When `core` fails, distinguish an existing nonstandard file from a missing file. Never convert old Context content into Packs or carry it into the replacement.

### Existing Context Rewrite

1. Preserve the exact pre-write file for rollback, but do not use its contents as Context.
2. Inspect only the minimum authoritative project sources needed to establish confirmed Core facts. Never add generic filler merely to satisfy the parser.
3. Replace the entire file with a minimal standard Context containing only the four required non-empty Core sections.
4. Run both `core` and `validate` against the replacement.
5. On success, continue without another confirmation. On insufficient evidence, source conflict, or failed validation, restore the exact pre-write file and disclose the concrete diagnostics.

### Missing Context Bootstrap

1. Inspect the minimum authoritative project sources needed to establish confirmed Core facts. Never scan sibling workspaces or add generic filler.
2. Draft a complete minimal `tasks/context.md` containing only the four required non-empty Core sections.
3. Show the exact complete proposed file and request explicit user confirmation. Do not create the file or its parent directory before confirmation.
4. After confirmation, create `tasks/` if needed, write the proposed file, then run both `core` and `validate` against it.
5. On validation failure, remove the new file, remove a newly created empty `tasks/` directory, and disclose the diagnostics. If the user declines, leave the file absent and disclose that Context remains unavailable.

## Degradation and Failure

- A missing `tasks/context.md` remains unavailable until the user confirms its exact proposal and creation succeeds. If confirmation is declined, disclose that state and fall back to ordinary exploration.
- If Existing Context Rewrite cannot establish a valid Core, or no trusted relevant Packs exist, disclose the degradation and fall back to ordinary exploration; do not pretend the project model is complete.
- Do not disclose an existing invalid Core before attempting Existing Context Rewrite.
- If the CLI is unavailable or fails, disclose the degradation and manually perform the same Core, metadata, and selected-Pack scan.
- Never auto-apply a duplicated ID or a relevant malformed Pack.
- If Authority conflicts with Context, Authority wins; update the affected ordinary Pack in the same task or request confirmation for Core.

## Maintainer Validation

Keep the CLI contract, focused tests, `evals/query_cases.json`, `evals/context_value_cases.json`, and `evals/trigger_cases.json` aligned. Run the script self-test, actual Context validation, authorized focused task tests, the built-in `$skill-quality` gate against this package, and `git diff --check`.

Quality failures block completion. Review warnings, but never delete, distort, or split core workflow guidance merely to satisfy the initial-load budget.
