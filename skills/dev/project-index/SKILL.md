---
name: project-index
description: Route an ambiguous coding task to indexed Git repositories using human-maintained business responsibilities, page snapshots, and focused CodeGraph lookup. Use when a task does not name one unambiguous repository, may span repositories, or the user asks to list, query, add, update, or validate locally indexed projects.
---

# Project Index

Choose likely repositories from an incomplete local business index before reading code. No match does not prove absence.

## CLI and Data

Resolve this skill directory and run its `scripts/project-index.js` with:

```text
list
get <project-id>
query <term>...
upsert <project-id>  # complete record JSON on stdin
validate
```

Commands emit JSON. Data lives at `$CSL_AGENT_KIT_HOME/project-indexes/index.json` (default `~/.csl-agent-kit/project-indexes/index.json`); snapshots use adjacent `snapshots/`.

One `projects` entry is one independent Git repository; a repository container is not a project. Records contain `name`, absolute `root`, `owns`, `doesNotOwn`, `terms`, `useWhen`, and optional `pages`; `glossary` owns terms, aliases, distinctions, and evidence. Human-confirmed responsibilities are authority; CodeGraph stays generated per repository.

Never scan unindexed repositories, bulk-create placeholders, generate screenshots, or add vector search.

## Route a Task

1. Derive two to six concise business terms; pass each meaningful phrase as one argument to `query`.
2. The script returns at most eight candidates with coverage, matches, conflicts, pages, and snapshot status. Rerank at most three from their records and request intent.
3. Report coverage, reasons, `doesNotOwn` conflicts, and pages. With no result, state that only listed projects were searched and offer to add one; do not search other code.
4. When page identity matters, load `snapshotPath` with the host image reader, or provide the absolute path when inline display is unavailable. Ask the user to confirm ambiguity.
5. Only after repository confirmation, narrow lookup inside it.

## Verify Code Ownership

1. Check `command -v codegraph`, then `codegraph status <project-root> --json`.
2. If unavailable or stale, mark ownership unverified. Ask before `codegraph init <project-root>` or `codegraph sync <project-root>` because they write generated data.
3. Use `codegraph query <search> -p <project-root> -l 10 -j`; use `callers` or `callees` only for a returned symbol needing relationship evidence.
4. Confirm important conclusions against a source entry point, route, registration, or call relationship. Without such evidence, report only the business candidate.

## Maintain the Index

1. Run `get`; for a new entry, verify `root` is its independent Git root.
2. Accept user text or draft from manifests, public APIs, entry points, and focused code evidence.
3. Show the complete record and exact before/after diff. Obtain explicit confirmation for that exact change; never persist inferred responsibility silently.
4. Put a user-confirmed image below the snapshots directory before referencing it; never generate a replacement.
5. Pipe the record to `upsert`, run `validate`, then report the updated ID and indexed coverage.
