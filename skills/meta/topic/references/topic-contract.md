# Topic Storage and Commands

Run `node <collection-root>/csl-tasks/shared/scripts/csl-tasks.js --workspace <root> topic ...`. Resolve the collection root as the parent of the `topic` Skill directory. `--help` lists exact options. Commands return JSON; `show` returns the current specification, file version and live member observations; `task` returns the task-file version and freshness. No command interprets user consent or judges semantic impact.

## Storage

- Canonical Topic: `<workspace>/tasks/topics/<topic-id>.md`.
- Rebuildable navigation: `<workspace>/tasks/topics.md`, containing title/link and lifecycle state, not task progress.
- Immutable normative snapshot: `<workspace>/tasks/topics/<topic-id>/revisions/<sha256>.md`.
- Incomplete association marker: `<task-workspace>/tasks/topic-transactions/<task-id>.json`. It pins the exact old/new Topic identities before the first relationship write and is removed only after reciprocal relationships are verified. It is recovery state, not a second ownership record.
- Tasks retain their existing canonical location. An optional unique `## Topic` section holds a `task-topic/v1` binding; task Kind and Queue Parent are unchanged.
- Topic metadata uses `topic/v1`, stable ID, Draft/Active/Archived state, and the SHA-256 of canonical normative sections. `show.version` hashes the whole Topic file for optimistic writes; it is different from `revision`, which excludes member references and lifecycle display.
- Topic sections are Scope, Spec Context, Decisions, Dependencies and Tasks. Tasks are JSON-line references with `reference`, `repository`, `purpose`; they never store status. The task binding is authoritative, the Topic list is its checked reverse index.
- Spec input is a JSON object with non-empty `scope` and `spec`, optional `decisions`, and optional `dependencies`. Text may have paragraphs and H3+ headings, but no H1/H2 headings; the CLI owns those structural boundaries.
- A normative dependency is `{ "path": "repository-relative-file", "sha256": "<digest>" }` in the Topic owner repository. Vendor a permitted immutable copy or otherwise obtain an explicit local source before relying on an external contract. Arbitrary remote URL fetching and floating external references are not supported by the first version. Informational links do not become checked dependencies.
- Cross-project references use `<project-id>:<topic-or-task-id>`; local references use `self:<id>`. Existing project-index data resolves roots. Cross-project mappings must point to Git roots with an origin; the stored hash of that origin pins repository identity without exposing the URL. A changed identity requires explicit diagnosis/rebinding, not silent acceptance. Equivalent but differently spelled origin URLs also require confirmation.
- Symlinks inside owned data paths and dependency paths are rejected. There is no auto-migration, global Topic list, Topic tree, scheduler or remote write service.

## Commands

Create a Draft:

```text
topic create <id> --title <title> --spec-json <file>
```

Read `topic show <id>` and pass its `version` to writes:

```text
topic update-spec <id> --expected <version> --spec-json <file>
topic activate <id> --expected <version>
topic archive <id> --expected <version>
topic restore <id> --expected <version>
```

`activate` requires Draft; `restore` requires Archived. Archiving rejects active or inaccessible listed members, except its exact owning In Progress maintenance task when explicitly named with `--owner-task <project:task-id|self:task-id>`. That task must be currently bound to this Topic and fresh; it may finish with Archived as its intended result. This exception does not cover product implementation or other maintenance tasks. The user must decide how to handle other active members; the CLI never cancels them. A successful command does not prove that the Agent obtained consent.

Associate an active or pending task after reading `topic task <task-id>` and `topic show <topic-id>`:

```text
topic attach <task-id> <project:topic-id|self:topic-id> --expected <task-version> --expected-topic <topic-version> --mode implementation|maintenance --applies <scope-or-clauses> --purpose <task-responsibility> [--allow-cross-workspace]
topic detach <task-id> --expected <task-version> [--allow-cross-workspace]
```

The target `show` is run in the owning workspace. `implementation` requires Active. `maintenance` is for Topic creation, clarification, specification maintenance, archive/restore and bounded historical inspection, not a general bypass. A completed task must be explicitly reopened before association changes. Reassociation refreshes the old and new backlinks without creating a new Task Kind.

After analyzing a revision difference and completing any required realignment:

```text
topic adopt <task-id> --expected <task-version> --expected-topic <topic-version> --evidence <impact-disposition>
```

Adoption writes the current revision and an evidence note, invalidates assessment/verification and preserves existing Required review. It does not decide whether the change is semantically harmless. Update actual Targets and implementation where needed, then repeat self-check, assessment, review and final verification. Old completed tasks retain historical snapshots; do not automatically adopt on their behalf.

Read-only operations:

```text
topic list
topic show <id>
topic task <task-id>
topic check <id>
```

`task.freshness` distinguishes current/blocked context; historical status is displayed separately. `check` verifies structure, the index and listed backlinks, while reporting member freshness separately. It does not certify that every member satisfies the latest specification or discover missing members in every repository. The task's own terminal gate rejects its missing backlink.

Explicit repair:

```text
topic repair <topic-id> <project:task-id|self:task-id> --expected <topic-version> --purpose <responsibility> [--allow-cross-workspace]
topic rebuild-index
```

Repair adds/removes only the specified backlink according to the task's current binding; it does not change task ownership. When a pending association exists, repair each exact old/new Topic reference. Repair also synchronizes that task's exact index entry from its canonical state. Only after all those backlinks and the task index match does repair clear the marker; otherwise `pendingAssociation` remains in its output and in `topic task`. A detached task with a pending marker cannot pass terminal gates as an independent task. Missing task files or unknown repository mappings fail closed rather than deleting presumed stale references.

## Failure and Concurrency

Topic mutations acquire per-workspace write locks in sorted order and compare expected content versions. Multi-file writes have synchronous best-effort rollback, not distributed crash atomicity. A crash can leave a stale lock or partial association. An association journal survives any failed write or rollback until explicit repair; never delete it merely because the task currently has no Topic. Full candidate Markdown is parsed and round-tripped before specification writes, so malformed fences or comments cannot hide required sections after commit. Report the exact files and state, inspect the recorded owner, and obtain authorization before removing an abandoned lock or repairing another workspace. Never automatically break a lock. Index rebuild only regenerates navigation from readable canonical Topics.

Freshness is checked at workflow checkpoints and task terminal writes. This is not real-time broadcast or a transaction spanning all repositories' future changes: a later Topic change does not rewrite historical evidence. Unavailable or changed normative input prevents the next dependent success gate. Recording Failed verification and cancelling a task remain available and invalidate old successful evidence; they do not require adopting an unwanted new specification. Registered project paths and origin changes are never silently repaired.
