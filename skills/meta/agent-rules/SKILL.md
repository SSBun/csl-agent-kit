---
name: agent-rules
description: Manage persistent Agent Rules. Use when the user wants to add, edit, list, or remove an unconditional rule, change a bundled default rule, or inspect how built-in, user, and project rules are injected. Use Agent Hooks for conditional or scripted automation instead.
---

# Agent Rules

Manage unconditional Agent behavior rules loaded at session start.

## Storage and loading

| Scope | Path | Purpose |
|---|---|---|
| Built-in | `skills/meta/agent-rules/agent-rules.md` | Read-only defaults distributed with CSL Agent Kit. |
| User | `$CSL_AGENT_KIT_HOME/agent-rules.md` (default `~/.csl-agent-kit/agent-rules.md`) | Writable rules that apply across projects. |
| Project | `<workspace>/.agents/agent-rules.md` | Writable rules for one workspace. |

The built-in Agent Hooks rule `inner:agent-rules` loads these files in built-in, user, then project order. It injects all non-empty content under one `## Agent Rules` heading without modifying any source.

## File format

Every scope uses one `agent-rules.md` Markdown list. Each top-level `-` item is one short imperative rule. Do not add YAML frontmatter.

```markdown
- Confirm before destructive Git commands such as force-push or reset --hard.
```

## Workflow

1. Determine the scope. Use user scope by default for cross-project preferences and project scope for repository-specific behavior. Modify built-in rules only when the user explicitly requests a package change.
2. Resolve the scope's single `agent-rules.md`. Honor `$CSL_AGENT_KIT_HOME` for user scope and the active workspace for project scope.
3. Add, edit, remove, or list rules. Merge or skip duplicates and preserve unrelated rules.
4. Write user and project files atomically. Keep the built-in file version-controlled with the package.
5. Report the changed scope and path. Changes take effect on the next session start; the current session is not retroactively updated.
6. Verify `inner:agent-rules` with `node skills/meta/agent-hooks/scripts/agent-hooks.js show inner:agent-rules --host pi`, then verify built-in, user, and project combinations and their merge order.

## Boundaries

- Rules are unconditional. Prefer observable, checkable directives over vague preferences.
- `AGENTS.md` and `CLAUDE.md` remain host-owned instruction files outside this system.
- Conditional matching, scripts, notifications, and runtime guards belong in Agent Hooks.
- Keep rules short. Graduate longer procedures into Agent SOPs.
