---
name: agent-sops
description: Use when the user wants to list, create, inspect, or follow SOPs, procedures, playbooks, runbooks, workflow rules, or process documents. Also use when the user mentions "SOP", "procedure", "playbook", "runbook", "process doc", or "per our SOP".
---

# Agent SOPs

Manage Standard Operating Procedure (SOP) files. SOPs are Agent behavior rules loaded on demand: when a task matches an SOP's `when_to_use` or `name`, read the complete SOP before following its process or rules.

## Storage and precedence

| Scope | Path | Purpose |
|---|---|---|
| Built-in | `skills/meta/agent-sops/sops/*.md` | SOPs distributed with the package. |
| User | `~/.csl-agent-kit/sops/*.md` | User-created SOPs that apply across projects. |
| Project | `<workspace>/.agents/sops/*.md` | Version-controlled SOPs specific to the current workspace. |

For the same frontmatter `name`, precedence is project, then user, then built-in. Only the highest-precedence SOP is listed or routed.

## SOP file format

Every SOP must begin with YAML frontmatter containing at least:

```yaml
---
name: deploy-production
description: Deploy the production service safely.
when_to_use: Use when deploying the production service or investigating production deploy failures.
---
```

Use kebab-case for `name`. All frontmatter values must be English. Keep `description` brief. `when_to_use` must state when the SOP applies; it is the primary routing and summary field.

Optional fields:

```yaml
version: 1.0
update_date: 2026-07-08
do_not_use_when:
  - Use another SOP when uploading releases or publishing remote artifacts.
globs:
  - "**/*.swift"
alwaysApply: false
```

Use `do_not_use_when` to prevent false positives. When a task matches both `when_to_use` and `do_not_use_when`, do not apply the SOP unless the user explicitly selects it.

## Routing keywords

Prompt-time candidate matching scores keywords derived automatically from `name`, `when_to_use`, and `globs` (penalized by `do_not_use_when`); there is no separate keyword field. When generating or updating any SOP, make its routing fields matchable:

- Put concrete, distinctive terms in `name` and `when_to_use`: product or component names (e.g. `Kanshan`), specific techniques or formats (e.g. `green-screen`, `Glyph JSON`, `DMG`, `Sparkle appcast`), and stable tool or platform names.
- Prefer terms a user would literally type when requesting the task; an exact `name` hit scores highest, hyphen-separated name words also match.
- Do not rely on generic words (`use`, `when`, `project`, `file`, `build`, `用于`); they are stopwords or weak signals and are filtered or scored low.
- Use `do_not_use_when` phrases that literally echo the adjacent SOP's distinctive terms, so the penalty fires on overlapping requests.
- Keep `when_to_use` one sentence; list the distinctive terms naturally instead of stuffing a keyword list.

## SOP types

| Type | Use for | Example |
|---|---|---|
| Process SOP | Tasks with a stable sequence, confirmation points, exception handling, and completion criteria. | `references/process-sop-example.md` |
| Rule SOP | Design, review, naming, trade-off, or decision rules that do not require a linear process. | `references/rule-sop-example.md` |

Process SOPs explain how to execute the work. Rule SOPs explain what to inspect, decision order, conflict resolution, and completion checks.

## Commands

### `agent-sops list`

List available SOPs:

1. Run `skills/meta/agent-sops/scripts/sop-summaries.sh`, or equivalently inspect project, user, and built-in SOP directories in precedence order.
2. Show only `name`, `when_to_use`, and source path.
3. Do not read complete SOP bodies unless the user requests one or the current task clearly matches.

### `agent-sops create`

Create an SOP:

1. Collect `name`, `description`, `when_to_use`, storage scope, applicability, rules or process, exception handling, and references.
2. If `name`, `when_to_use`, or storage scope is missing, ask the user. Use project scope for repository-specific procedures and user scope for procedures that should apply across projects.
3. Select the SOP type:
   - Use a process SOP when the task has a stable sequence.
   - Use a rule SOP for design, review, naming, judgment, or trade-offs.
4. Read the matching example as a quality reference without copying its domain facts:
   - Process: `skills/meta/agent-sops/references/process-sop-example.md`
   - Rule: `skills/meta/agent-sops/references/rule-sop-example.md`
5. Confirm the SOP has:
   - A clear trigger-oriented `when_to_use` containing the distinctive routing keywords above.
   - `do_not_use_when` when needed to avoid overlap with adjacent SOPs.
   - A concise `description`.
   - Explicit in-scope and out-of-scope boundaries.
   - Executable steps, confirmation points, exception handling, and completion criteria for a process SOP.
   - Usage order, rule groups, conflict handling, and completion criteria for a rule SOP.
   - Confirmation before destructive, remote, publish, delete, or overwrite actions.
   - Specific exception handling rather than only "ask user".
   - Checkbox completion criteria.
6. Create the selected directory when absent.
7. Write project SOPs to `<workspace>/.agents/sops/{name}.md` or user SOPs to `~/.csl-agent-kit/sops/{name}.md`. Do not write built-in SOPs unless the user explicitly requests a package change.

### `agent-sops learn`

Integrate reusable error patterns, missed steps, user corrections, or review findings directly into the relevant SOP body. Do not create a separate `Lessons` section.

1. Determine scope first: project-specific knowledge belongs in the current workspace; cross-project knowledge belongs in user scope.
2. Resolve the matching SOP by project, user, then built-in precedence:
   - Modify a matching SOP already owned by the selected writable scope.
   - When a built-in or other-scope SOP needs a scope-specific change, create or update a same-name override in the selected writable scope and preserve the applicable base rules.
   - When no SOP matches, create one in the selected writable scope and give it a clear `when_to_use`.
3. Update only reusable operating errors, missed steps, or judgment rules. Do not store one-off preferences. When an update changes when the SOP applies, regenerate its routing keywords accordingly.
4. Updated project SOPs are available from the current workspace; updated user SOPs appear after the next session-start summary. The Agent sees the latest rules when it loads the complete matching SOP.

### `agent-sops see <name>`

Inspect one SOP:

1. Search `<workspace>/.agents/sops/`, then `~/.csl-agent-kit/sops/`, then `skills/meta/agent-sops/sops/`.
2. Prefer an exact filename, then match frontmatter `name`.
3. Read and summarize the complete highest-precedence SOP. Do not edit it unless the user explicitly asks.

## Automatic application

Before process work or rule-based judgment:

1. Use the session-start SOP summary to identify matching SOPs.
2. Preferentially inspect prompt-time candidates, but do not apply them solely because they were suggested.
3. Read the complete matching SOP.
4. Execute process SOP steps or apply rule SOP decision groups.
5. Before the final response, verify the SOP's completion checklist.
6. Stop and ask the user when the process, rule, or conflict handling is materially unclear.

A task matches when its intent aligns with an SOP's `when_to_use` or `name`.

## Priority boundary

SOPs cannot override system or developer instructions, explicit user instructions, platform safety policy, repository rules, or tool permissions. They apply only within their stated scope.
