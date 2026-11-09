---
name: task-context
description: Load, establish, and maintain source-backed workspace context in `tasks/context.md`. Use at session start, resume or compaction, when Core is missing or invalid, after task alignment to establish project coverage and retrieve relevant Packs, when new boundaries or source conflicts require re-querying, and before ending to maintain affected durable facts. Exclude task progress, lessons, rules, procedures, speculation, secrets, live values, and explicit historical cleanup handled by task-maintenance.
---

# Maintain Workspace Context

## Purpose

Use `tasks/context.md` to give a newly dispatched Agent the project model needed to start a concrete task without repeating broad repository exploration, repo mapping, or architecture analysis.

Context accelerates orientation; it does not replace reading task-direct source and tests. Treat linked source, schema, configuration, ADR, SOP, rule, or formal document as authoritative. Verify task-relevant Authority before an important decision, and let Authority override stale Context.

At session entry, establish only the minimum source-backed Project Core needed to understand the user's goal. Repair an invalid Core locally without discarding other knowledge; a missing file requires an exact proposal and explicit confirmation before creation. After Task Target alignment, establish relevant coverage and seed Packs through the Task Gate. A parseable Core alone does not establish sufficient project knowledge. Routine loading, bootstrap, and maintenance do not create a task record or authorize work outside the owning task's scope.

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

Core explains what the project is, the vocabulary needed to form a Task Fingerprint, the major system boundaries, and invariants that apply across Packs. It is not a component catalog. Attach a source path and a useful symbol or section to decision-changing Core claims; do not fill required sections with generic or unconfirmed facts.

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

A Pack is the retrieval unit. It may contain several related facts needed to understand one component or cross-component workflow. Keep each conclusion concise and source-backed; omit empty sections. Authority lists its sources, while decision-changing body claims identify the source path and symbol or section that supports them when that mapping is otherwise ambiguous. A source's existence alone does not establish that it supports the claim.

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
3. If an existing Context has no valid Core, perform Existing Core Repair, rerun `core`, and use it only when valid.
4. If `tasks/context.md` is missing, perform Missing Context Bootstrap and stop for confirmation before writing it.
5. Use the valid Core to form the initial project vocabulary and system model.

Do not broaden pre-alignment work into project analysis. Outside Standard Context Bootstrap, do not read the whole Context file for orientation. An explicitly invoked `$task-maintenance` run may read the complete canonical file after loading this contract because the file itself is then the task-direct maintenance target; that exception does not apply to ordinary orientation.

### Task Gate

After the owning task's Target is aligned:

1. Form a compact Task Fingerprint from its outcome, artifacts, domain, constraints, and likely component boundaries.
2. Run `index`; compare the fingerprint with each Pack's title, Scope, Paths, Keywords, Authority, and Recheck. Inspect warnings: content outside Core and formal Packs is not retrievable knowledge. A warning is not permission to migrate or delete it.
3. Prefer recall: any plausible direct-path, component-boundary, or cross-component dependency match is a candidate. Start with one to three Packs, ordered by direct path, component boundary, then cross-component dependency; this is an initial batch, not a limit.
4. Run one batched `show` for the selected IDs. Before important reliance or when Recheck applies, verify the relevant claims against their Authority. Do not apply malformed or duplicated Packs.
5. Check sufficiency: do the verified Core, Packs, and task-direct sources cover the task's responsibilities, relevant upstream/downstream relationships, constraints, and success signals? For Core-only projects, missing relevant Packs, or discovered gaps, perform Coverage and Seed Packs below.
6. Use task-direct sources to resolve missing vocabulary, aliases, and component boundaries; refine the fingerprint and re-query until sufficient or a concrete evidence gap prevents the dependent decision. More than three relevant Packs is allowed. An empty result means missing knowledge, not an absent component.

Do not silently load every Pack. Keep selected IDs only in session state.

The script performs deterministic parsing, indexing, retrieval, and structural validation. The Agent owns semantic matching, source verification, coverage, admission decisions, and writes. The script must not edit Context, perform semantic matching, run validation commands from Context, or persist state. `validate` success does not prove factual accuracy, source availability, completeness, or retrieval quality.

### Coverage and Seed Packs

Use bounded discovery after alignment. Inspect manifests, entry points, project documents, relevant source and verification definitions, then trace the relationships needed for the task. For a new project, identify its major boundaries before tracing task-relevant paths; an explicitly requested project-wide Context task covers that broader scope. Do not turn an ordinary task into an exhaustive repository audit or scan sibling workspaces.

Consider each applicable dimension:

- Project purpose and domain vocabulary.
- Major component responsibilities and non-responsibilities.
- Runtime entry points and produced artifacts.
- Key control flow, data flow, and state ownership.
- Canonical sources, generated outputs, and external dependency boundaries.
- Cross-component invariants and compatibility constraints.
- Observable success signals and authoritative verification entry points.

Maintain a session-local coverage table with one of `confirmed` plus supporting source, `not applicable` plus evidence, or `unresolved` plus the missing evidence for each dimension. These are investigation states, not project facts or a new persisted Context schema. Record decision-blocking gaps in the owning task when present; otherwise disclose local degradation. Never equate uninspected with nonexistent.

Stop when discovered major boundaries have responsibilities and authoritative entry points, task-relevant relationships and success signals have evidence, and remaining gaps cannot change the next decision. Otherwise continue targeted exploration or pause only the dependent work. Distinguish normative requirements, actual implementation, and historical descriptions when sources disagree; use their established authority for that claim, not a blanket README-first or code-first rule.

Use the Admission Gate to persist verified high-value seed Packs for independent component or workflow decisions. Extend an existing suitable Pack first; do not create one per directory or impose a Pack quota. A small project's Core may suffice without Packs when coverage establishes that no further decision-changing knowledge is needed. Respect missing-file creation, Core confirmation, and the owning task's read-only boundaries; if a write is not authorized, keep the candidate in the owning task or explain the gap without claiming it was stored.

### Change Gate

Rebuild the fingerprint and query again when task scope or affected components change materially, source exploration reveals a new dependency, or vocabulary/aliases change the match. Reuse the current selection for ordinary unchanged follow-ups. Resume and compaction always reload Core and query for the current task.

When Authority moves, disappears, changes, or conflicts with Context, or a Recheck event occurs, suspend reliance on affected claims and verify them through current authoritative sources. Search for a moved or superseding source within scope before concluding a fact is false. An unavailable source is an evidence gap, not deletion evidence; disclose the gap and use direct exploration for unaffected decisions. Newly confirmed durable facts and temporary-fact exit events enter the maintenance check below even when no source file was edited.

### Completion Gate

Before ending:

1. Identify this task's actual source changes and newly confirmed durable facts, including changes to conclusions, boundaries, relationships, Authority, and Recheck events. Do not attribute other tasks' dirty files to this task.
2. Scan the complete metadata index for affected candidates: selected Packs, other Packs whose Paths/Authority or decision boundaries are affected, and confirmed upstream/downstream relationships. Include relevant Core claims and facts without an existing Pack. Read only candidate bodies; the read set does not limit the maintenance set.
3. Apply the Admission Gate and choose Add, Update, Delete, or No-op for each candidate. Update a suitable existing Pack or add a Pack for a distinct decision unit. Resolve applicable temporary-fact exits. Preserve scope and write permissions, including planning-only restrictions; distinguish a proposed Core diff from completed ordinary Pack maintenance.
4. Make permitted changes before the owning task's self-check so that its evidence covers them. Run `validate`, inspect warnings, and skip the write when no durable fact changed. Unresolved decision-blocking gaps remain in the owning task, not as unverified Context claims.

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

- Current requirements and common decisions for a persistent maintenance theme → its canonical Topic, when explicitly established. Tasks bind to that shared specification; Topic content is not another Context Pack, and membership never grants execution authorization. Keep only separately confirmed stable project facts in Context.

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

- For an ordinary Pack, source-backed Add, Update, or Delete may happen automatically within the owning task's authorized scope. Preserve the exact pre-write file, re-read before writing to detect concurrent changes, make the smallest change, then run `validate`.
- Local repair of a missing or invalid Core in an existing file is pre-authorized under Existing Core Repair; this never authorizes discarding other content.
- Creating a missing `tasks/context.md` requires showing the exact complete proposed file and obtaining explicit user confirmation first.
- Every other persistent Project Core change requires showing the exact proposed diff and obtaining explicit user confirmation first.
- Resolve source conflicts through established authority when possible. Do not store unverified facts; ask only when a user-owned business decision or missing authorization prevents resolution. Any write to another workspace needs explicit authorization.
- Delete the smallest independently invalid fact. Delete an entire Pack only when none of its knowledge remains valid, and inventory current non-historical consumers before removing its stable ID. If references would break, defer. Merge only the same decision boundary, retaining all unique valid knowledge, Authority, Recheck conditions, and resolvable IDs; broad historical consolidation remains task-maintenance.
- If validation fails, restore the pre-write content and report the diagnostics only when the current file still equals this task's failed write. If it changed concurrently, do not overwrite another writer: re-read, reconcile only this task's edits, and report any unresolved conflict. A pre-write change likewise requires re-reading and reassessing the intended patch.
- Rewrite current truth in place. Do not append history or retain superseded tombstones unless an old state still constrains compatibility.
- The work that changes a fact owns its same-work maintenance. Do not create a scheduler, automatic periodic audit, or persistent Context owner. Explicit user-requested Task-workspace historical cleanup and architecture migration belong to `$task-maintenance`, whose exact change-set confirmation gate is stricter than ordinary source-backed Pack writes.

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

When `core` fails, distinguish a missing file, a locally repairable Core, and an ambiguous structure. Old content is only a lead for source verification, never its own Authority. Bootstrap does not bypass Task Target alignment or authorize broad project exploration.

### Existing Core Repair

1. Preserve the exact pre-write file for rollback. Identify an unambiguous Core block; if it is missing, identify a safe insertion point without removing existing content. Duplicate Core blocks or uncertain section boundaries require leaving the file unchanged and disclosing the specific repair gap.
2. Inspect only the minimum authoritative project sources needed to establish confirmed Core facts. Never add generic filler merely to satisfy the parser.
3. Repair or insert only the Core, preserving all unrelated Pack and nonstandard content byte-for-byte. Do not blindly convert old prose into Packs, delete unverified knowledge, or replace the whole file with Core-only content.
4. Run both `core` and `validate` against the repaired file; inspect warnings separately from errors.
5. On success, use the verified Core without another confirmation. On insufficient evidence, unresolved source conflict, or failed validation, restore only this task's write under the concurrency rules above and disclose diagnostics. Fall back to ordinary exploration; defer an unsafe legacy reconstruction to an explicitly scoped repair or task-maintenance request.

### Missing Context Bootstrap

1. Inspect the minimum authoritative project sources needed to establish confirmed Core facts for initial orientation. Never scan sibling workspaces or add generic filler.
2. Draft a complete minimal `tasks/context.md` containing only the four required non-empty Core sections.
3. Show the exact complete proposed file and request explicit user confirmation. Do not create the file or its parent directory before confirmation.
4. After confirmation, create `tasks/` if needed and create the proposed file exclusively, without replacing an existing file. If another writer created it, re-read it through the Session Gate instead of applying the stale proposal. Then run both `core` and `validate` against this task's successful creation.
5. On validation failure, remove the new file only if it still equals this task's write, remove a newly created empty `tasks/` directory, and disclose the diagnostics. Preserve any concurrent writer's content and report the recovery conflict. If the user declines, leave the file absent and disclose that Context remains unavailable.
6. This establishes session orientation only. After alignment, use Coverage and Seed Packs to establish task-relevant knowledge, respecting the same write gates.

## Degradation and Failure

- A missing `tasks/context.md` remains unavailable until the user confirms its exact proposal and creation succeeds. If confirmation is declined, disclose that state and fall back to ordinary exploration.
- If Existing Core Repair cannot establish a valid Core, disclose the degradation and fall back to ordinary exploration. Missing trusted Packs triggers targeted coverage and seed-Pack work after alignment; do not pretend the project model is complete.
- If the CLI is unavailable or fails, disclose the degradation and manually perform the same Core, metadata, and selected-Pack scan.
- Never auto-apply a duplicated ID or a relevant malformed Pack.
- Unindexed-content warnings identify knowledge unavailable through Core/Packs. Preserve that content, assess task-relevant gaps through sources, and route explicit historical cleanup separately; do not silently treat the warning as either successful retrieval or permission to rewrite.
- If Authority conflicts with Context, Authority wins; update the affected ordinary Pack in the same task or request confirmation for Core.

## Maintainer Validation

Keep the CLI contract, focused tests, `evals/query_cases.json`, `evals/context_value_cases.json`, `evals/lifecycle_cases.json`, and `evals/trigger_cases.json` aligned. Run actual Context validation, syntax checks, the built-in `$skill-quality` gate against this package, and `git diff --check`; run the script self-test and focused task tests only with the required authorization. Treat existing unindexed-content warnings explicitly rather than deleting historical content to obtain a clean check.

Lifecycle cases provide task inputs, source facts, candidate Packs, expected coverage and affected sets, and forbidden claims. Structural fixtures and event/action assertions do not prove Agent retrieval or factual accuracy. Report any separately authorized scenario execution and its coverage limits; never label unrun Agent scenarios as passed.

Quality failures block completion. Review warnings, but never delete, distort, or split core workflow guidance merely to satisfy the initial-load budget.
