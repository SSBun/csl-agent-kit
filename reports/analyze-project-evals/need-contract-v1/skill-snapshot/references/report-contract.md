# Need-Driven Report Contract

Use this contract for every focus. `standard` and `learning` share one answer core, active path, evidence gate, and publication protocol.

## Report Shape

Write the report in the user's language. Keep code, commands, symbols, and established domain terms unchanged.

### Metadata

Start with exactly these fields:

```markdown
- Scope: <repo-relative path; use . for the Git root>
- Need: <the resolved current implementation question>
- HEAD: <commit SHA or unborn>
- Working tree: <clean or includes uncommitted changes read by this analysis>
- Generated at: <timezone-aware timestamp>
```

For `HEAD: unborn`, immediately add:

> This report is based on uncommitted working-tree content and does not represent a revision.

### Direct Answer

Answer the need immediately. State the observable result, the responsible current behavior, and the first material condition that can change the result. Do not begin with orientation, a directory tour, or methodology.

### Need-bounded Working Model

Explain only the responsibilities, state, data, and boundaries needed to understand the Direct Answer. Organize by causal role, not by directory. Define a project-specific term only when misunderstanding it would change the answer.

### Critical Evidence Path

Trace the smallest representative path from a real entry or boundary to the observable result. Include the earliest need-relevant branch and the main failure exit when it changes the answer. Put source anchors beside each claim rather than creating a separate inventory.

A compact table is allowed:

```markdown
| Step | Current behavior | Consequence | Evidence |
| --- | --- | --- | --- |
```

### Verification Anchors

List only existing tests, fixtures, assertions, or static verification points that check the answer core. If source proves a fact but no direct test does, say so without inventing a command or calling the behavior tested.

### Material Uncertainty

Include this section only when an unknown changes where or when the answer applies. Distinguish:

- a source-proven conditional answer with an unknown runtime selection; from
- a missing causal fact that prevents publication.

The second case is a zero-write refusal, not a report section.

### Learning Check

Include this section only for learning focus or an explicit prediction-check need.

1. Reuse the Critical Evidence Path; do not repeat the walkthrough.
2. Add exactly one Prediction about a current input, state, or branch inside the need.
3. Add at most one Transfer using a contrasting branch that already exists in source and remains inside the need.
4. Put all prompts first, then a compact Key.
5. Each Key entry contains the judgment, causal reason, and source anchor.

Do not add Recall sequencing, material-opening ceremony, mastery/completion claims, hypothetical changes, diffs, implementation steps, or new-test plans. Omit Transfer when no existing need-relevant contrast exists.

## Density Gate

Keep a paragraph, table row, or diagram only when it does at least one of these jobs:

- directly answers the need;
- explains a necessary causal relation;
- provides source evidence for a conclusion;
- states a material uncertainty that changes applicability;
- tests understanding of current need-bounded behavior.

Delete complete directory trees, exhaustive module/API/type/test lists, duplicated facts, risk lists, recommendations, and change plans.

## Optional Mermaid

Use Mermaid only when prose or a compact table cannot clearly express the necessary causal relation.

- If an existing local read-only parser or renderer is available, validate the final diagram without installing anything.
- If no validator exists or validation fails, replace the diagram with prose or a table and continue.
- Do not require a fixed number of diagrams or block a source-proven report because Mermaid is unavailable.

## Existing Active Report

Before replacing an existing regular active report, write nothing and show:

- active path;
- old `Need`;
- old `HEAD`;
- old `Generated at`;
- new `Need`;
- `Replace` and `Cancel` choices.

Metadata fallback:

- a missing, repeated, or unparseable old `Need` becomes `unknown (pre-need report)`;
- a missing, repeated, or unparseable old `HEAD` or `Generated at` becomes `unknown`.

`Cancel` must preserve the old bytes exactly. `Replace` authorizes replacement only; re-read and re-analyze source. Never use the old report body as factual evidence.

Historical reports under `docs/analysis/learning/**` remain untouched and are not active reports. When one exists for the scope, the final response may add:

```text
Legacy report retained at <path>; archival only.
```

## Freshness Boundary

Complete these steps in memory before sampling freshness:

1. candidate report;
2. evidence and answer-core checks;
3. optional Mermaid validation or fallback;
4. secret redaction.

Then sample:

- `HEAD` or `unborn`;
- working-tree state read by the analysis;
- timezone-aware generation time.

Sampling must occur before any output-directory creation, temporary-file creation, or active-report mutation. If source changes after the analysis in a way that invalidates the answer, refuse publication and re-analyze; do not relabel a stale candidate.

## Scope and Output Path Safety

1. Resolve the Git root, target, and active path lexically and canonically.
2. The target must equal or remain inside the Git root.
3. The active path must remain inside the matching canonical output namespace.
4. Walk every existing output-path ancestor with `lstat`; reject symlinks and non-directory parents.
5. If the active target exists, require a regular file. Reject symlinks, directories, devices, and other file types without following them.
6. Do not use a hash fallback for an unsafe path.

## Secret Redaction

Do not place a suspected secret's value, fragment, hash, or security-analysis section in:

- the candidate;
- a temporary file;
- a persisted transcript or evaluation artifact;
- the active report;
- the final response.

The only warning form is:

```text
Suspected <category> at <repo-relative path>; secret value was not recorded.
```

The repository-relative path identifies the source file, not a more precise secret location. Do not turn this warning into a security audit.

## Standard-Library Publication

Do not add a helper file or dependency. Use one ephemeral Node process, with the final candidate provided through stdin or another in-memory channel, and only these standard-library capabilities:

- `node:path`;
- `node:fs/promises`: `lstat`, `realpath`, `mkdir`, `open`, `readFile`, `link`, `rename`, `unlink`;
- `node:crypto`: `randomUUID`, `createHash`;
- `process.pid`.

Never use Pi `write` or `edit` on the active report or publication temp. Never fall back to direct `writeFile` publication.

### Capture Pre-confirmation State

For an existing target, before confirmation:

1. require a regular file;
2. read its exact bytes;
3. retain in memory its byte length and SHA-256;
4. retain the target and parent `dev` and `ino` from `lstat`;
5. parse only the old metadata needed by the confirmation prompt.

Do not store these comparison values in the report or an artifact.

### Create and Recheck Parents

After confirmation, candidate completion, redaction, and freshness sampling:

1. Starting at the deepest verified existing ancestor, process each missing segment separately.
2. For an existing segment, require a non-symlink directory.
3. For `ENOENT`, call non-recursive `mkdir(segment)`.
4. On `EEXIST`, re-run `lstat`; never assume the path is safe.
5. After creation, `lstat` again and retain the directory identity.
6. Before temp creation and again before publication, re-walk the full parent chain; reject a symlink, type change, or identity change.

This check reduces accidental path substitution but does not eliminate hostile TOCTOU.

### Create One Owned Sibling Temp

1. Place the temp in the target's parent directory.
2. Include the target basename, `process.pid`, and `randomUUID()` in the temp name.
3. Create it with `open(temp, "wx")`.
4. The temp is owned by this run only after that call returns a handle successfully.
5. Write the complete UTF-8 candidate through the handle and close it successfully before publication.
6. Never delete a temp path that this run did not successfully create with `open("wx")`.

### Publish an Absent Target

1. Recheck the parent chain.
2. Call `link(temp, target)`.
3. On success, the complete closed candidate becomes the target; then unlink the temp name.
4. On `EEXIST`, fail closed and preserve the competing target bytes.
5. On unsupported hard links or any other error, fail closed. Do not fall back to a direct write or rename that can clobber an unconfirmed target.

### Replace a Confirmed Existing Target

Immediately before replacement:

1. re-run `lstat` and `readFile` on the target;
2. require the same parent and target identities;
3. require the same byte length and SHA-256 as the pre-confirmation file;
4. refuse replacement when any comparison changes;
5. when the platform and filesystem support same-directory replacement rename, call `rename(temp, target)`;
6. on rename failure or unsupported semantics, fail closed and preserve the old bytes.

There is an unavoidable ordinary-concurrency window between the final comparison and `rename`.

### Cleanup

In `finally`, call `unlink` only for the owned temp:

- `ENOENT` is acceptable after successful publication;
- report any other cleanup failure;
- never scan for or delete unknown temp files.

A failure may leave empty parent directories created by this run. Do not add directory deletion and its races merely to remove them. A failure must never leave a partial active report.

## Explicit Limitations

Do not claim any of the following:

- `fsync` or power-loss durability;
- concurrent-writer isolation;
- prevention of hostile TOCTOU;
- path-level confinement of Bash or other tools;
- identical hard-link or replacement-rename behavior on every platform or filesystem.

When the required primitive or semantics are unavailable, zero-write refusal is the correct result.

## Final Check

Before publication, confirm:

- one scope, one need, and one active path;
- Direct Answer immediately follows metadata;
- every answer-core claim has a source anchor;
- no excluded inventory, audit, recommendation, or change-plan content;
- learning focus contains one Prediction and at most one current-state Transfer;
- optional Mermaid is valid or removed;
- candidate and response contain no suspected secret material;
- freshness precedes every output mutation;
- publication follows owned-temp `open("wx")` and `link` or confirmed `rename` semantics.
