# Topic Storage and Commands

Run `node <collection-root>/csl-tasks/shared/scripts/csl-tasks.js --workspace <root> topic ...`. Resolve the collection root as the parent of the `topic` Skill directory. `--help` lists exact options. Commands return JSON; `show` returns the current specification, file version and live member observations; `task` returns the task-file version and freshness. No command interprets user consent or judges semantic impact.

## Storage

- Canonical Topic: `<workspace>/tasks/topics/<topic-id>.md`.
- Rebuildable navigation: `<workspace>/tasks/topics.md`, containing title/link and lifecycle state, not task progress.
- Long-lived shared files: `<workspace>/tasks/topics/<topic-id>/resources/`. New Topics create this directory; older Topics are not scanned or migrated. Existing authoritative source files stay in place and are linked, not copied.
- Immutable normative snapshot: `<workspace>/tasks/topics/<topic-id>/revisions/<sha256>.md`. This records normative text and pinned source identities, not duplicate copies of linked file contents; retain source history in its authoritative location.
- Incomplete association marker: `<task-workspace>/tasks/topic-transactions/<task-id>.json`. It pins the exact old/new Topic identities before the first relationship write and is removed only after reciprocal relationships are verified. It is recovery state, not a second ownership record.
- Tasks retain their existing canonical location. An optional unique `## Topic` section holds a `task-topic/v1` binding; task Kind and Queue Parent are unchanged.
- Topic metadata uses `topic/v1`, stable ID, Draft/Active/Archived state, and the SHA-256 of canonical normative sections. `show.version` hashes the whole Topic file for optimistic writes; it is different from `revision`, which excludes member references and lifecycle display.
- Topic sections are Scope, Spec Context, Decisions, Dependencies, Resources and Tasks. Resources is a clickable Markdown table; it remains optional when reading older `topic/v1` records. Existing records retain their shape unless resources are explicitly updated. Empty/reference-only Resources do not change the legacy normative digest. Tasks are JSON-line references with `reference`, `repository`, `purpose`; they never store status. The task binding is authoritative, the Topic list is its checked reverse index.
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
topic update-resources <id> --expected <version> --resources-json <file>
topic activate <id> --expected <version>
topic archive <id> --expected <version>
topic restore <id> --expected <version>
```

`activate` requires Draft; `restore` requires Archived. Archiving rejects active or inaccessible listed members, except its exact owning In Progress maintenance task when explicitly named with `--owner-task <project:task-id|self:task-id>`. That task must be currently bound to this Topic and fresh; it may finish with Archived as its intended result. This exception does not cover product implementation or other maintenance tasks. The user must decide how to handle other active members; the CLI never cancels them. A successful command does not prove that the Agent obtained consent.

## Resource Index

`update-resources` replaces the complete index using an explicit JSON array; omitted entries are unregistered, never deleted from disk. It requires a current whole-file `version`, rejects Archived Topics, validates the complete candidate before committing, and creates the Topic's resources directory when explicitly initializing an old record. `show` returns normalized `resources` and the owning `resourcesDirectory` path (the path alone is not a claim that old storage already exists).

```json
[
  {"label":"API contract","target":"contracts/account.json","purpose":"Shared deletion behavior","kind":"normative","sha256":"<actual SHA-256>"},
  {"label":"Design notes","target":"tasks/topics/account/resources/design notes.md","purpose":"Background alternatives","kind":"reference"},
  {"label":"External design","target":"https://example.com/design","purpose":"Visual reference","kind":"reference"}
]
```

Targets are owner-repository-relative files, not paths relative to the Topic MD; rendering converts them to portable, percent-encoded Topic-relative Markdown links. Local files must exist when registering. Absolute paths, traversal, symlinks, duplicate targets and malformed table labels/purposes are rejected. Labels cannot contain brackets, pipes, angle brackets or backslashes; purposes cannot contain pipes, angle brackets or backslashes. HTTP(S) URLs must be canonical and credential-free, and are reference-only; no network request is made. Do not record secrets in links or documents.

Normative entries require `sha256`; their metadata and identity enter the specification projection and are rechecked anywhere existing Dependencies are checked, including activation, binding, adoption and terminal gates. A byte change fails freshness even before the index is updated; register the authorized new digest and explicitly adopt the resulting specification revision. Normative entries are recorded in revision snapshots; their source contents must remain recoverable at the original authoritative location.

Reference entries must omit `sha256`. Their labels, purposes, links, additions/removals and file contents do not enter the normative digest. A reference deleted later may become a broken informational link, but does not invalidate task evidence. A separately declared normative Dependency on the same source still applies. Do not declare the same normative file in both Dependencies and Resources; move that declaration explicitly to avoid conflicting authority and incompatible digest updates. Changing classification to/from normative is itself a specification change, not a bypass.

Empty old Topics without Resources remain readable with their original revisions and are not rewritten by listing/showing/checking. Index maintenance never moves task artifacts, copies source files, rewrites shared documents, or deletes unregistered material. Task-specific evidence stays with its owning task.

## Task Association

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
