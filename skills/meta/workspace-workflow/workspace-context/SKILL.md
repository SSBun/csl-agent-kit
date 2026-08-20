---
name: workspace-context
description: Load, automatically migrate, and maintain dispatch-ready workspace context in `tasks/context.md`. Use at session start, after resume or compaction, when an existing Context has a missing or invalid Project Core, before a concrete task needs project orientation, and before ending when confirmed durable project facts changed. Load or recover Project Core first, then query only task-relevant Context Packs. Exclude task progress, correction lessons, rules, procedures, speculation, secrets, and cached live values.
---

# Maintain Workspace Context

## Purpose

Use `tasks/context.md` to give a newly dispatched Agent the project model needed to start a concrete task without repeating broad repository exploration, repo mapping, or architecture analysis.

Context accelerates orientation; it does not replace reading task-direct source and tests. Treat linked source, schema, configuration, ADR, SOP, rule, or formal document as authoritative. Verify task-relevant Authority before an important decision, and let Authority override stale Context.

When an existing Context predates this schema or has no valid Project Core, recover it in place by default before task dispatch. Routine context loading, migration, and maintenance do not create a task record.

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
3. If an existing Context has no valid Core or uses a pre-v1 structure, perform Default Migration, rerun `core`, and use the recovered Core.
4. Use Core to form the initial project vocabulary and system model.

Outside Default Migration, do not read the whole Context file for orientation.

### Task Gate

After understanding a concrete task:

1. Form a compact Task Fingerprint from its outcome, artifacts, domain, constraints, and likely component boundaries.
2. Run `index`; compare the fingerprint with each Pack's title, Scope, Paths, and Keywords.
3. Prefer recall: any plausible direct-path, component-boundary, or cross-component dependency match is a candidate.
4. Usually select one to three Packs, ordered by direct path, component boundary, then cross-component dependency.
5. Run one batched `show` for the selected IDs and apply each complete Pack.
6. Verify the selected Pack's Authority before important reliance or when Recheck applies.

Do not silently load every Pack. Keep selected IDs only in session state.

The script performs deterministic parsing, indexing, retrieval, legacy compatibility, and validation. The Agent owns semantic matching, Authority verification, admission decisions, and writes. The script must not edit Context, perform semantic matching, run validation commands from Context, or persist state.

### Completion Gate

Before ending:

1. Identify whether the work changed a selected Pack's conclusion, boundary, relationship, Authority, or Recheck event.
2. Update, migrate, or remove affected Pack content in the same work.
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
- Default Migration of the current workspace's existing pre-v1 or invalid Context is pre-authorized and runs without a separate confirmation.
- Every other persistent Project Core change requires showing the exact proposed diff and obtaining explicit user confirmation first.
- Stop and ask before a source conflict, user-owned business judgment, unverified fact, or migration of another workspace.
- If validation fails, restore the pre-write content and report the diagnostics.
- Rewrite current truth in place. Do not append history or retain superseded tombstones unless an old state still constrains compatibility.
- Do not create a global periodic audit or individual Context owner; the work that changes a fact owns its maintenance.

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

## Default Migration

When `core` fails because an existing `tasks/context.md` has no valid Project Core or uses a pre-v1 structure, migrate the current workspace before disclosing degradation:

1. Preserve the exact pre-write file.
2. Read the complete legacy file and only the minimum authoritative project sources needed to establish a confirmed Core. Never add generic filler merely to satisfy the parser.
3. Add or repair the four required Core sections. Convert source-backed, Context-eligible legacy conclusions into formal `CTX-*` Packs when their semantic boundary and Authority are clear.
4. Never delete or rewrite unresolved legacy content during automatic migration; keep its original text in place for later routing. Never scan or migrate sibling workspaces.
5. Write the migration, then run both `core` and `validate` against the same file.
6. On success, continue without asking for confirmation or reporting a degradation. On insufficient evidence, source conflict, or failed validation, restore the exact pre-write content and disclose the concrete diagnostics.

## Legacy Migration

Existing top-level bullets under `Components`, `Relationships`, and `Decisions and Conventions` remain readable as scan-local `legacy-<content-hash>` Packs. The CLI never writes those IDs back.

Outside Default Migration, do not bulk-migrate legacy content. When work materially touches a component, merge only its relevant legacy bullets into one formal `CTX-*` Pack, remove the migrated originals, and validate. Verify legacy content against its Authority before relying on it.

## Degradation and Failure

- Missing `tasks/context.md`, an existing Core that Default Migration cannot safely recover, or no trusted relevant Packs means Context is unavailable for dispatch. Disclose that state and fall back to ordinary exploration; do not pretend the project model is complete.
- Do not disclose an existing legacy or invalid Core before attempting Default Migration.
- If the CLI is unavailable or fails, disclose the degradation and manually perform the same Core, metadata, and selected-Pack scan.
- Never auto-apply a duplicated ID or a relevant malformed Pack.
- If Authority conflicts with Context, Authority wins; update the affected ordinary Pack in the same task or request confirmation for Core.

## Maintainer Validation

Keep the CLI contract, focused tests, `evals/query_cases.json`, `evals/context_value_cases.json`, and `../evals/context_trigger_cases.json` aligned. Run the script self-test, actual Context validation, focused task tests, applicable routing evaluation, OpenAI validation, Yao validation, resource-boundary check, and `git diff --check`.

The only acceptable non-blocking failure is Yao `Estimated initial-load tokens exceed budget` against its 1000-token initial-load budget. Syntax, frontmatter, governance, tests, routing, script trust, and every other check remain blocking. Never delete, distort, or split core workflow guidance merely to satisfy the initial-load budget.
