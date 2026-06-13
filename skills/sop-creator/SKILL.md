---
name: sop-creator
description: Use when the user wants to create an SOP document, write a standard operating procedure, document a workflow or process, or mentions "SOP", "procedure", "playbook", "runbook", "process doc". Also use when the user asks to follow a procedure, check the process for something, or mentions "per our SOP".
---

Generate structured SOP (Standard Operating Procedure) documents from process/workflow descriptions. Created SOPs behave as persistent rules — the agent reads and follows them when relevant work arises.

## SOP Storage Convention

SOP files are stored in three levels:

| Level | Path | Scope |
|-------|------|-------|
| Built-in | `skills/sop-creator/sops/` (relative to plugin/skill root) | General SOPs shipped with the skill |
| Global | See platform table below | Cross-project user procedures |
| Project | `docs/sops/` | Project-specific procedures (build, test, release) |

**Global SOP directory by platform:**

| Platform | Global path |
|----------|-------------|
| Claude Code | `~/.claude/sops/` |
| Cursor | `~/.cursor/sops/` |
| Codex / portable | `~/.agents/sops/` |

**Resolve `{plugin_root}` (built-in SOP path = `{plugin_root}/skills/sop-creator/sops/`):**

| Platform | How to resolve |
|----------|----------------|
| Claude Code | `$CLAUDE_PLUGIN_ROOT` |
| Cursor | Parent of `skills/` in the installed plugin (e.g. `~/.cursor/plugins/local/CSL`) |
| Codex / portable | Parent of `skills/` when this skill is loaded from the CSL repo or `~/.agents/skills/sop-creator` symlink |

If uncertain, locate this skill's directory and walk up until you find `skills/sop-creator/sops/`. Use that ancestor as `{plugin_root}`.

Priority: project > global > built-in. Later sources override earlier ones when same-named SOP exists.

File naming: `docs/sops/{descriptive-name}.md` or `{global_sops_dir}/{descriptive-name}.md`. Use kebab-case. Examples: `deploy-production.md`, `onboard-engineer.md`, `hotfix-process.md`.

When writing an SOP, ask the user: "Global or project scope?" Default to project unless explicitly stated global.

## SOP Lookup (Active Rules)

Before starting any procedural work (deploy, release, incident response, onboarding, etc.), **always**:

1. Scan `docs/sops/`, `{global_sops_dir}`, and `skills/sop-creator/sops/` (under plugin root) for matching SOP files
2. Read the relevant SOP before taking action
3. Follow it step-by-step — SOPs are authoritative instructions, not suggestions
4. If a step is unclear or impossible, stop and ask the user before deviating

Matching heuristic: if the user's task aligns with an SOP's title, purpose, or scope section, that SOP applies.

## Information Gathering

Before writing, collect these from conversation context. Ask the user for any gaps:

- **Title** — clear, action-oriented name
- **Purpose** — why this procedure exists
- **Scope** — what/who it covers and excludes
- **Owner** — role or team responsible
- **Prerequisites** — tools, access, knowledge needed before starting
- **Steps** — the procedure itself, broken into phases
- **Roles** — who does what at each step
- **Error handling** — what to do when things go wrong
- **References** — related docs, links, other SOPs

If the user provides a raw description, extract the above. If details are sparse, ask focused questions — don't invent content.

## SOP Template

Fill in this structure:

```markdown
---
name: {descriptive-name}
version: 1.0
owner: {role/team}
scope: {global|project}
---

# [Title]

**Version:** 1.0
**Owner:** [role/team]
**Last Updated:** [date]

## Purpose
[Why this procedure exists]

## Scope
[What/who it covers. What it excludes, if applicable.]

## Prerequisites
- [Tool/access/knowledge 1]
- [Tool/access/knowledge 2]

## Procedure

### [Phase/Section Name]

1. [Step]
   - **Who:** [role]
   - **Action:** [what to do]
   - **Expected Result:** [what success looks like]

2. [Step]
   - **Who:** [role]
   - **Action:** [what to do]
   - **Expected Result:** [what success looks like]

### [Next Phase]

...

## Error Handling
| Scenario | Resolution | Escalate To |
|----------|-----------|-------------|
| [what went wrong] | [what to do] | [who if unresolvable] |

## References
- [Link/doc/SOP 1]
- [Link/doc/SOP 2]
```

## Writing Rules

- **Voice:** imperative mood ("Do X", not "You should do X")
- **Steps:** numbered, one action per step. Avoid compound steps
- **Detail level:** enough that someone unfamiliar can execute. No filler
- **Phases:** group related steps under descriptive headings
- **Error handling:** only cover realistic failure scenarios, not every edge case
- **Version:** start at 1.0 unless updating an existing SOP

## Output

1. Ask the user: "Global (`{global_sops_dir}`) or project (`docs/sops/`) scope?"
2. Write the completed SOP file to the chosen location
3. Confirm the path and summarize what was created

## Activate SOP as Rule (cross-platform)

When the user wants to activate a built-in SOP as a persistent rule:

1. List built-in SOPs: `skills/sop-creator/sops/*.md` under the plugin root.
2. Ask which SOP, scope (global vs project), and mode (conditional globs vs always-on).
3. Write the rule to the platform rules directory:

| Platform | Global rules | Project rules |
|----------|--------------|---------------|
| Claude Code | `~/.claude/rules/sop-{name}.md` | `.claude/rules/sop-{name}.md` |
| Cursor | `~/.cursor/rules/sop-{name}.md` | `.cursor/rules/sop-{name}.md` |

Codex has no native rules directory — keep SOPs as skills or project docs instead.

4. Prepend frontmatter with `description`, `globs` (if conditional), `alwaysApply`, and `source: sop-creator:{name}`. Preserve the SOP body below.
