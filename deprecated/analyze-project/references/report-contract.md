# Systematic Report Contract

Use this contract for every project, directory-component, and file-component report.

## Report Shape

Write in the user's language. Keep code, commands, symbols, and established domain terms unchanged.

### Metadata

Start with exactly:

```markdown
- Scope: <canonical absolute target path>
- HEAD: <commit SHA or unborn>
- Working tree: <clean or includes uncommitted changes read by this analysis>
- Generated at: <timezone-aware timestamp>
```

For `HEAD: unborn`, immediately state:

> This report is based on uncommitted working-tree content and does not represent a revision.

`Scope` identifies the analyzed project, directory, or file after canonical path resolution. Never abbreviate it as `.` or a repository-relative path. Do not add a `Need` field.

### Scope Summary

Open with the smallest complete description of the scope:

- who or what calls, uses, or hosts it;
- the problem or responsibility it owns;
- its principal inputs and outputs;
- adjacent responsibilities it explicitly does not own.

For a project, describe the product or library as a whole. For a component, describe its contribution to the containing project. Do not begin with a directory tour or a detailed behavior question.

### Domain Glossary

Include only project-specific terms whose misunderstanding would change the module or flow model. Omit this section when none qualify.

```markdown
| Term | Meaning here | Not the same as |
| --- | --- | --- |
```

Do not put source anchors inside the table. Follow it with one `Evidence — <Term>` group per retained term, using the evidence-list format below. Do not create a type or API dictionary.

### Functional Module Map

Identify the highest-level functional responsibilities required to explain the scope's primary value. Derive modules from behavior, state ownership, inputs/outputs, and call boundaries—not directory names.

- Split one directory when it owns distinct responsibilities.
- Merge multiple directories when they implement one responsibility.
- Fold utilities, adapters, and implementation details into their owning module.
- Include direct external systems only when a core flow crosses them; label them external.
- For a component report, include only internals and direct neighbors.

Start this section with one required Mermaid functional architecture diagram. It shows all modeled modules, direct external boundaries, and labeled call/data/event directions. Do not draw files, utilities, or evidence anchors. The diagram owns relationships; the table owns semantic responsibilities.

Use one responsibility table:

```markdown
| Module | Responsibility | Inputs | Outputs | Owns | Verification |
| --- | --- | --- | --- | --- | --- |
```

Do not put source anchors inside the table. After it, add one `Evidence — <Module>` group per module. `Verification` names only tests or static checks that directly validate the responsibility. Write `No direct test found` when source proves the responsibility but no direct test exists.

### Core Working Flows

Cover the flows that realize the scope's primary value. A flow qualifies when it is user/caller-visible, crosses functional responsibilities, changes important state, or crosses an external/asynchronous boundary. Do not enumerate helper calls or maintenance commands.

For each flow, state:

```text
Trigger → Input → Functional path → State changes → Observable output
                              └→ Main failure exit
```

A flow is visually complex when it has a meaningful branch, async or external collaboration, an important state transition, or several functional modules whose order matters. Give every visually complex flow exactly one Mermaid diagram before its numbered steps:

- sequence diagram for ordered collaboration or external interaction;
- flowchart for branching or data movement;
- state diagram for lifecycle transitions.

Simple linear flows need no diagram. Then trace short numbered steps from a real entry or boundary to the result. Put module roles, state transitions, invariants, and failure exits in the step they explain; place that step's anchors in an immediately following evidence list. The diagram owns structure or order; the steps own meaning and edge conditions, while the lists own evidence. Do not duplicate the diagram in prose.

Coverage is systematic, not exhaustive:

- A project report covers every highest-level responsibility needed to explain the project's primary product value and the evidenced core flows connecting them.
- A component report covers every responsibility owned by that component plus the core flows it owns or materially participates in.
- Stop when another module or flow would not change a reader's model of the scope's main responsibilities, boundaries, state, or outcomes.

### Cross-flow Invariants

Include only rules that constrain multiple modules or flows and cannot be stated naturally in one flow. For each invariant, state the rule, enforcement location, and consequence of violation, then add an immediately following evidence list. Do not put source anchors inside an invariant table. Omit the section when none qualify.

## Evidence and Coverage Gate

- Every project-specific claim needs a nearby repository-relative `path#symbol`, `path#key`, or line anchor.
- Put anchors in an immediately adjacent Markdown evidence group, never at the end of prose or inside a table:

```markdown
Evidence:
- `path/to/file#symbol`
- `path/to/config#key`
```

- Each bullet contains exactly one complete inline-code anchor and no other text. Use `Evidence — <item>` instead of `Evidence:` when one shared table needs separate evidence groups for its rows.
- Never combine anchors in one bullet or code span, and never leave an anchor as plain text.
- README and design documents may establish intent but cannot alone prove runtime behavior.
- CodeGraph is navigation, not evidence.
- Unknown details may be omitted or explicitly bounded when they do not invalidate the systematic model.
- If the central scope responsibility, major module boundaries, or a core causal path cannot be source-proven, publish nothing and ask one focused question.
- Do not claim behavior is tested merely because a general test target exists.

Before publication, verify that the Summary, Module Map, and Core Working Flows agree on ownership, inputs, outputs, and boundaries. A report that explains only one detailed behavior is incomplete unless the target itself is a single file with only that responsibility.

## Density Gate

Keep a paragraph, row, or diagram only when it:

- defines scope responsibility or boundary;
- distinguishes a functional module;
- explains a core causal or state transition;
- states a cross-flow invariant;
- supplies evidence or direct verification.

Delete exhaustive directory trees, dependency/API/type/test lists, duplicated facts, risks, recommendations, change plans, learning exercises, and detail-question framing.

## Diagram Format and Validation

Every report must retain the required architecture diagram and every required complex-flow diagram as a `mermaid` code fence.

- Choose `flowchart`, `sequenceDiagram`, or `stateDiagram-v2` by relationship type.
- If an existing local read-only parser or renderer is available, validate every final Mermaid diagram and repair invalid syntax before publication.
- Never install a validator or use a network renderer.
- If no validator exists, keep concise Mermaid and perform a careful syntax review. Never substitute ASCII, prose, or a table.
- If an available validator still rejects a diagram after bounded repair, publish nothing and report the validation blocker.
- Use stable functional names, readable direction, and only needful nodes/edges. Do not force a fixed total diagram count.

## Existing Active Report

Before replacing an existing regular active report, capture its exact bytes and show:

- active path;
- old `Scope`, `HEAD`, and `Generated at`;
- new `Scope`;
- `Replace` and `Cancel` choices.

Missing, repeated, or unparseable old fields become `unknown`. A legacy `Need` field has no current meaning and is not displayed.

If the current user request explicitly says regenerate, re-analyze, replace, or analyze again, that request authorizes one full replacement; do not ask the same confirmation again. In either case:

- `Cancel` preserves the old bytes exactly.
- `Replace` requires a complete re-analysis from current source.
- Never use the old report body as factual evidence or patch it incrementally.

Historical reports under `docs/analysis/learning/**` remain untouched and are not evidence. When one exists for the scope, the final response may add:

```text
Legacy report retained at <path>; archival only.
```

## Freshness Boundary

Complete the candidate, coverage/evidence checks, Mermaid validation or syntax review, and secret redaction in memory. Then sample:

- `HEAD` or `unborn`;
- target working-tree state read by the analysis;
- timezone-aware generation time.

Sample before creating output directories, temporary files, or the active report. The `Working tree` value covers uncommitted source, configuration, tests, or other files actually used as evidence; exclude the active report, owned temp, archival `docs/analysis/learning/**`, and host metadata outside the target Git root. If analyzed source changes and invalidates the candidate, re-analyze instead of relabeling stale content.

## Scope and Path Safety

1. Resolve Git root, target, and active path lexically and canonically.
2. Target must equal or remain inside the Git root; active path must remain inside its canonical output namespace.
3. Walk existing output ancestors with `lstat`; reject symlinks and non-directory parents.
4. If the active target exists, require a regular file. Reject symlinks, directories, devices, and other file types without following them.
5. Do not use a hash fallback for an unsafe path.

## Secret Redaction

Never place a suspected secret's value, fragment, hash, or security-analysis section in a candidate, temp, transcript, active report, or final response. The only warning is:

```text
Suspected <category> at <repo-relative path>; secret value was not recorded.
```

## Standard-Library Publication

Do not add a helper or dependency. Use one ephemeral Node process and only `node:path`, `node:crypto` (`randomUUID`, `createHash`), `process.pid`, and `node:fs/promises` (`lstat`, `realpath`, `mkdir`, `open`, `readFile`, `link`, `rename`, `unlink`). Never publish through Pi `write`/`edit` or direct `writeFile`.

### Capture Existing State

Before replacement authorization, require a regular target and retain in memory its exact bytes, length, SHA-256, and target/parent `dev` and `ino`. Parse only the metadata needed for confirmation. Do not persist comparison values.

### Prepare Parents

After authorization, candidate completion, redaction, and freshness sampling:

1. Process each missing path segment separately from the deepest verified ancestor.
2. Existing segments must be non-symlink directories.
3. On `ENOENT`, call non-recursive `mkdir`; on `EEXIST`, re-run `lstat`.
4. Retain each created directory identity.
5. Before temp creation and publication, re-walk the full parent chain and reject symlink, type, or identity changes.

### Create One Owned Temp

Create one sibling temp named with the target basename, `process.pid`, and `randomUUID()`. Acquire ownership only after `open(temp, "wx")` succeeds. Write the complete UTF-8 candidate through that handle and close it before publication. Never delete an unowned temp.

### Publish

For an absent target, recheck parents and call `link(temp, target)`. On success, unlink the temp name. On `EEXIST`, unsupported hard links, or any error, fail closed without a direct-write or rename fallback.

For an authorized replacement, immediately re-run `lstat` and `readFile`; require unchanged parent/target identity, byte length, and SHA-256. Then use same-directory `rename(temp, target)`. On mismatch or rename failure, preserve the old bytes and fail closed.

In `finally`, unlink only the owned temp; accept `ENOENT` after publication and report other cleanup failures. Empty directories created by a failed run may remain. Never leave a partial active report.

## Explicit Limitations

Do not claim `fsync` or power-loss durability, concurrent-writer isolation, hostile-TOCTOU prevention, path-level tool confinement, or identical filesystem semantics. Missing required primitives means safe refusal.

## Final Check

Confirm:

- one scope, one systematic report, and one active path;
- Metadata has no `Need`;
- Scope Summary precedes the functional model;
- Functional Module Map covers major responsibilities by function, not directory, and starts with one architecture diagram;
- Core Working Flows cover the scope's primary value and main failure exits, with one diagram for every visually complex flow;
- optional Glossary/Invariants are non-empty and decision-relevant;
- every project claim has an adjacent Markdown evidence list, every bullet contains one inline-code anchor only, no anchor is appended to prose or placed in a table, and test claims are accurate;
- no detail-answer framing, inventory, audit, recommendation, plan, or learning ceremony;
- every required visual uses a `mermaid` code fence, no ASCII diagram remains, and every available local validation passes;
- freshness and redaction precede output mutation;
- publication uses owned-temp `open("wx")` and `link` or authorized unchanged `rename`.
