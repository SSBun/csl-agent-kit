---
name: handoff-save
description: Saves session context to a handoff file for the next conversation. Use when the user says handoff save, save context, save handoff, pass context, store session, or wants to continue this work in a new chat later.
---

Save compact task context so the next agent can resume without re-exploring the project.

## Usage

`handoff-save [optional note for next session]`

Use any user-provided note to sharpen `Next Action` and `Task Scope`. Do not paste it verbatim as the whole handoff.

## Storage

Always write to:

```text
~/.agents/handoffs/{project-name}.md
```

Create `~/.agents/handoffs/` if missing. Resolve `{project-name}` from `git rev-parse --show-toplevel` when inside a repo, otherwise from `pwd`; convert to kebab-case.

## Workflow

1. Resolve `{project-name}` and `{handoff_path}`.
2. Read `references/handoff-format.md` for required sections and the file template.
3. Gather only task-resume context: next action, where left off, scope, pinboard, decisions, constraints, completed steps, dead ends, artifacts, workspace state, and useful skills.
4. Prefer exact paths and line numbers over broad prose.
5. If `{handoff_path}` already exists, ask before overwriting or create a timestamped backup first.
6. Write the handoff file.
7. Tell the user: `Handoff saved to ~/.agents/handoffs/{project-name}.md`.

## Rules

- `Next Action` and `Where Left Off` are mandatory and specific.
- Pinboard should be at most about 15 entries.
- Reference artifacts by path; do not copy their bodies.
- Redact secrets as `***REDACTED***`.
- Never silently overwrite an existing handoff.
