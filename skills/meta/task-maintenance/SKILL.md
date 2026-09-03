---
name: task-maintenance
description: Clean stale Context, consolidate overlapping Lessons, and migrate Task-owned historical files or directories to the current authoritative architecture after an exact user-approved change set. Use only when the user explicitly asks to remove stale Context/Lessons history, consolidate duplicate entries, clean obsolete Task paths, or migrate legacy Task artifacts and records. Exclude ordinary Context updates, correction-driven Lesson maintenance, whole-repository architecture cleanup, and automatic scheduling.
---

# Task Maintenance

Maintain accumulated Task workspace state without turning cleanup into a new source of truth. Work that changes a fact, preventive rule, task record, or artifact still owns its immediate maintenance; this Skill is an explicit backstop.

It supports two scopes:

- `Data maintenance`: Delete or Merge stale and overlapping Context/Lessons content.
- `Structure maintenance`: Migrate or delete historical Task-owned files and directories that no longer match the current authoritative Task architecture.

A data-only Context/Lessons run uses their routine-maintenance task-record exception. Any structure-maintenance run is a concrete file-changing outcome: activate and align one canonical `$task` before the full audit, and exclude that active maintenance record and its artifacts from the current run's candidates.

Do not create a persistent report, audit ledger, timestamp, schedule, compatibility link, cache, or long-lived owner.

## Runtime Authorities

Resolve this Skill's directory and read these sibling contracts in full before auditing:

- `../task/SKILL.md`
- `../task-context/SKILL.md`
- `../task-lessons/SKILL.md`
- `../archive/SKILL.md`

Use their existing read-only validators and lifecycle tools; do not implement another parser or task-state core:

```text
node ../csl-tasks/shared/scripts/csl-tasks.js --workspace <workspace> validate
node ../task-context/scripts/context.js --workspace <workspace> core|index|show <id>...|validate
node ../task-lessons/scripts/lessons.js --workspace <workspace> index|show <id>...|validate
```

Also inspect current, non-historical Skill and rule sources that actively produce or consume Task workspace paths. Those live contracts define the latest destination architecture. Use canonical task links, embedded ownership metadata, formal migration decisions, or version-control history only to prove that an obsolete source belonged to the Task system; historical evidence never overrides the current destination Authority.

## Current Architecture Map

Build a fresh map for every structure run. For each Task-owned carrier, record:

- owning runtime Authority;
- canonical path pattern;
- ownership key, such as canonical task ID;
- allowed content or category;
- active readers, writers, and validators; and
- reference locations that must continue to resolve.

The current contracts normally cover singleton Context/Lessons/index files, canonical task records, task-owned artifacts, and verbatim conversation archives. Treat that list only as a discovery starting point: include a path only when a current Authority claims it, and let newer Authority override this summary.

A path beneath `tasks/` is not automatically Task-owned, and a historical Task-owned source may exist outside the current `tasks/` root. Include an obsolete source only when explicit evidence proves past Task-system ownership. Exclude project source, long-lived project documentation, build output, user data, and any path without current destination Authority plus source-ownership evidence. Never scan the rest of the repository for generic architecture cleanup.

An explicit maintenance run may read selected canonical data files and Task-owned historical trees completely after lifecycle activation and preflight. This is task-direct maintenance, not ordinary Context orientation.

## Operations

Produce only these operations:

- `Data Delete`: remove the smallest independently stale Context or Lessons unit.
- `Data Merge`: replace compatible same-carrier Context or Lessons units with one canonical unit.
- `Migrate`: copy a uniquely owned historical Task file or tree to its exact current canonical destination, preserve approved live references, verify it, then remove the source.
- `Duplicate Delete`: remove a historical Task path only when a retained canonical path is byte-for-byte and structurally identical.
- `Empty Directory Delete`: remove only an explicitly approved historical Task directory that is still empty immediately before deletion.

`Keep` and `Defer` are internal decisions, not a general health report. Do not perform prose improvement, broad rewriting, schema modernization, content rerouting, task archival, or migration outside Task-owned carriers.

## Preflight

1. Require an explicit user maintenance request. A calendar, daemon, Hook, or inferred cadence is not authorization.
2. Determine whether the requested scope is data-only or includes structure maintenance. Activate `$task` before structure inspection or mutation.
3. Load the runtime Authorities above and build the current architecture map from live producers and consumers.
4. Run the applicable Context, Lessons, and task validators before candidate discovery. Legacy Lesson warnings are compatible input; malformed current records and duplicate IDs are blockers for their carrier.
5. Inventory tracked and untracked entries inside current Authority-declared Task roots and explicitly evidenced historical Task source roots. Candidate historical roots must come from the user's scope, canonical task links, embedded metadata, formal migration records, or version-control evidence—not a broad repository scan. Include hidden entries, empty directories, file type, byte size, and SHA-256 for regular files. Defer symlinks and special files unless a current Authority explicitly defines their migration semantics.
6. Do not write while discovering or classifying candidates.

A missing Lessons file is an empty set and must not be created merely for maintenance. A missing Context routes to `task-context` bootstrap. An invalid task graph blocks task-record or artifact structure migration; do not repair it implicitly.

## Data Delete Gate

Create a Data Delete candidate only when current evidence proves at least one condition:

- Authority contradicts or supersedes the content.
- The referenced object, path, component, or mechanism no longer exists.
- A more accurate canonical unit fully preserves the same decision effect, scope, Authority, and verification boundary, leaving no unique value.
- A stronger source, schema, type, test, lint rule, CI gate, or mandatory workflow fully prevents a Lesson's failure mechanism and leaves no residual Agent judgment.

Age, legacy format, wording similarity, low recent use, or lack of a recent match never proves staleness. Missing, ambiguous, or conflicting evidence means Defer.

Delete the smallest self-contained stale bullet or field. Delete an entire Context Pack or Lesson only when none of it remains valid.

Before deleting a stable Context or Lesson ID, inventory every current non-historical consumer in Task-owned and non-Task sources. Every consumer must remain valid without that ID; otherwise Defer. Include the consumer search and result in the change set, and do not edit another carrier merely to make the deletion possible.

## Data Merge Gate

Create a Data Merge candidate only when every condition holds:

1. All source units belong to the same carrier.
2. They express the same decision boundary or prevent the same failure mechanism.
3. Their scopes are compatible and their valid requirements do not conflict.
4. One merged unit can retain every unique current constraint and verification boundary without weakening meaning.
5. Live references can continue to resolve through the retained stable ID.

For Context, keep the existing ID whose Scope and Authority best describe the result, and preserve every still-valid Authority and Recheck condition.

For Lessons, prefer an existing v1 ID with the most specific applicable Trigger, never record age; preserve and deduplicate the complete Trigger, Rule, and Check sets. Retain a qualifying v1 ID when legacy records join it. When every source is legacy, create one new `L-YYYYMMDD-ascii-slug` v1 record. Leave untouched legacy records unchanged.

Context and Lessons never merge into each other. A Data Merge candidate is atomic.

## Structure Candidate Gates

Every structure candidate first requires:

1. Current Authority proves the canonical destination or empty-directory deletion outcome, while independent current or historical evidence proves that the source belonged to the Task system.
2. One unique owner is established without guessing from a filename alone.
3. The source's real path remains inside the current workspace and outside the current canonical layout.
4. Every descendant, active reference, file type, mode, byte size, and regular-file SHA-256 is inventoried.
5. Current validators can verify the resulting canonical layout.
6. A same-filesystem atomic no-replace rename primitive is available and verified for quarantine rollback; otherwise Defer before writing.

### Migrate Gate

A Migrate candidate additionally requires one unique canonical destination inside both the workspace and an Authority-declared Task root. The destination must be absent, and the source and destination real or prospective paths must be distinct and neither may contain the other. Every descendant must map to one destination entry and every live reference must have one approved preservation or rewrite outcome.

### Byte-Identical Duplicate Delete Gate

A Duplicate Delete candidate requires a non-empty source and an existing retained canonical destination outside the source. Source and destination manifests must match in relative entry path, type, mode, byte size, and regular-file SHA-256; the source may contain no unique entry. Every active source reference must already resolve to the retained destination or have one approved Task-owned rewrite. A different entry or unavailable destination means Defer.

### Empty Directory Delete Gate

An Empty Directory Delete candidate has no destination and exclusively owns every empty-source case. The source must be a directory with no hidden or visible entry, and no active reference may require it to exist. Record its mode for rollback and recheck emptiness immediately before deletion.

Any non-empty historical path that is not a verified byte-identical duplicate must use Migrate; deleting its unique content is forbidden. Never overwrite a destination. Ambiguous ownership, an unmapped descendant, overlapping source/destination paths, path escape, unsupported file type, or unavailable Authority means Defer.

For task records and artifacts, derive ownership from canonical records, explicit links, producer metadata, or another unique current source—not topic similarity alone. A historical record must remain readable by the current task core; do not modernize its body merely because its path moves.

Keep verbatim conversation content unchanged. Do not rewrite historical prose merely to remove old path text. Update only exact Task-owned links that still perform navigation after an approved migration. A live reference outside Task-owned carriers blocks the candidate and must be handled by a separately authorized task.

## Change Set and Safety Confirmation

Present one exact change set grouped by carrier and give every candidate a run-local ID such as `M1`. Include:

- exact operation (`Data Delete`, `Data Merge`, `Migrate`, `Duplicate Delete`, or `Empty Directory Delete`) and source IDs or paths;
- current Authority and evidence;
- owner and canonical destination only when the selected operation requires one;
- exact before/final data content for Data Delete or Data Merge, plus the complete live-consumer search for any removed stable ID;
- for every structure operation, the complete relative entry manifest with type, mode, size, and regular-file SHA-256, plus every active reference and approved rewrite;
- destination conflict and source/destination overlap results when a destination applies;
- source removals, the verified atomic no-replace primitive, each same-filesystem sibling quarantine path and cleanup boundary, and any separately approved empty parent directories; and
- deterministic postconditions and validators.

After the change set, render one localized `**Safety Confirmation**` naming the operations, affected carriers, deletion/move consequences, and rollback boundary. The user may approve all candidates or an exact subset. This is the only cleanup confirmation; do not add a second generic prompt. Task Target acceptance never substitutes for it.

An incomplete subset of a Data Merge, Migrate, or Duplicate Delete candidate is not approval. Questions, hesitation, or ambiguous acknowledgments do not authorize writes. If no candidate passes its evidence gate, report that result and stop.

## Apply Data Changes

Treat each selected canonical data file as an independent transaction:

1. Preserve its exact pre-write content.
2. Apply all approved operations for that file in one coherent edit.
3. Run its existing validator and index command.
4. Re-run the approved live-consumer search for every deleted stable ID, then re-read surviving merge targets and confirm every valid constraint remains.
5. On failure, restore the exact source and validate the restoration.

The stricter Safety Confirmation applies even when ordinary Context Pack maintenance would otherwise be automatic.

## Apply Structure Changes

Treat each approved candidate as an independent transaction under its exact operation. Quarantine is transaction-local rollback state, not a persistent ledger; restore or remove it before returning, or report an unresolved recovery failure.

### Apply Migrate

1. Recheck the source manifest, destination absence and non-overlap, owner, and references against the approved change set.
2. Create only the required destination parents.
3. Copy every source entry while preserving type, mode, and bytes; do not delete or overwrite the source.
4. Compare source and destination relative paths, file and directory counts, modes, byte counts, and regular-file SHA-256.
5. Apply only the approved Task-owned reference rewrites; do not normalize adjacent historical text or record schema.
6. Run the task graph and every carrier/producer validator named by the architecture map.
7. Immediately recheck both manifests, destination non-overlap, and references, then atomically rename the source to a unique absent sibling quarantine path on the same filesystem.
8. Recompute the quarantine manifest and require it to match both the approved source manifest and destination before running postconditions.
9. With quarantine retained, verify source absence, destination identity, rewritten links, and the absence of unintended active old-path references.
10. Immediately recheck source absence, quarantine and destination identity, and rewritten references; if source reappeared, retain every path and report an unresolved recovery conflict. Delete quarantine only after every postcondition passes.

If failure occurs before quarantine, restore changed references, remove only destinations created by this transaction, and leave the source untouched. After quarantine, immediately require source absence and use an atomic no-replace rename from quarantine to source; if the primitive is unavailable or the source exists at the call boundary, retain source, quarantine, destination, and current references and report an unresolved recovery conflict. Only after source restoration succeeds may references be restored and the created destination removed. If quarantine cleanup partially fails, reconstruct missing entries from the still-verified destination into quarantine, then apply the same no-replace restoration and conflict gate.

### Apply Duplicate Delete

1. Recheck that the source is non-empty, source and retained canonical destination do not overlap, and both manifests are identical in path, type, mode, bytes, and hashes.
2. Apply only approved Task-owned source-reference rewrites and validate the destination, references, task graph, and carrier consumers.
3. Immediately recheck both manifests and references, then atomically rename the source to a unique absent sibling quarantine path on the same filesystem.
4. Recompute the quarantine manifest and require it to match both the approved source manifest and retained canonical destination.
5. With quarantine retained, verify source absence, retained destination identity, and every rewritten link.
6. Immediately recheck source absence, quarantine and retained destination identity, and rewritten references; if source reappeared, retain every path and report an unresolved recovery conflict. Delete quarantine only after every postcondition passes.

On failure before quarantine, restore changed references and retain the source. After quarantine, immediately require source absence and use an atomic no-replace rename from quarantine to source; if the primitive is unavailable or the source exists at the call boundary, retain source, quarantine, canonical destination, and current references and report an unresolved recovery conflict. Restore references only after source restoration succeeds. If quarantine cleanup partially fails, reconstruct missing entries from the still-verified canonical destination into quarantine, then apply the same no-replace restoration and conflict gate.

### Apply Empty Directory Delete

1. Recheck that the source has no hidden or visible entry, retains the approved mode, and has no active reference requiring its existence.
2. Atomically rename it to a unique absent sibling quarantine path on the same filesystem.
3. Recheck that quarantine is still empty and retains the approved mode.
4. With quarantine retained, run the approved task and carrier validators and confirm the source path remains absent.
5. Immediately recheck source absence, quarantine emptiness and mode, and active references; if source reappeared, retain both paths and report an unresolved recovery conflict. Delete quarantine only after every postcondition passes. On failure, immediately require source absence and use an atomic no-replace rename from quarantine to source before restoring its approved mode. If that primitive is unavailable or the source exists at the call boundary, retain both paths without overwrite or deletion and report an unresolved recovery conflict.

Each empty parent directory requires its own approved Empty Directory Delete candidate. A successfully validated candidate remains applied if another independent candidate fails; report partial success without marking the failed candidate complete.

## Failure and Routing

- Authority conflict or unavailable proof: Defer without writing.
- Destination conflict, ambiguous owner, unsupported entry, or external live reference: Defer and name the blocker.
- Malformed data, duplicate IDs, or invalid task graph: report diagnostics; do not repair them here.
- Required change belongs to project source, rules, SOPs, or another non-Task carrier: use a separate owning task if the user authorizes it.
- Automatic cleanup request: disclose that this Skill is explicit-only and do not create a scheduler, reminder, Hook, or state file.

## Completion

Report approved operations applied, rejected or skipped approvals, deferred blockers, rollback outcomes, and current validators. Do not save maintenance history.

Completion requires:

- every changed data carrier validates;
- every migrated destination matches its approved source manifest;
- every removed source was either migrated and verified, byte-identical to a retained canonical copy, or an approved empty obsolete directory;
- every approved Task-owned path reference resolves, and every current non-historical consumer of a deleted stable ID remains valid;
- the canonical task graph validates after structure maintenance; and
- every failed candidate is restored or explicitly reported as an unresolved recovery failure.

## Maintainer Validation

Keep `evals/trigger_cases.json`, `evals/semantic_config.json`, and `evals/structure_operation_cases.json` aligned with both data and structure maintenance boundaries. After modifying this package or sibling contracts, run the built-in `$skill-quality` gate against every changed package, validate current Context, Lessons, and tasks, verify shared Skill discovery and the Claude manifest, parse changed JSON/YAML, and run `git diff --check`.

Run project tests only when the user and governing project rules explicitly authorize them. Quality failures block completion; review context-budget warnings without deleting required workflow guidance.
