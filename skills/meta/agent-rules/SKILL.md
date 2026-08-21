---
name: agent-rules
description: Record persistent agent rules or conventions into ~/.csl-agent-kit/agent-rules.md so they are injected into every session at start. Use when the user wants to add, edit, list, or remove a persistent rule or convention (for example "always display file paths as markdown links", "confirm before deleting", or "prefer X over Y"). These are lightweight global directives surfaced as session context; use Agent Hooks for conditional or scripted automation instead.
---

# agent-rules

Maintain a single Markdown file at `~/.csl-agent-kit/agent-rules.md` (or `$CSL_AGENT_KIT_HOME/agent-rules.md`). A built-in Agent Hooks rule (`inner:agent-rules`) reads this file at every `session-start` and, when non-empty, injects its contents into the session context.

## When to use

- The user asks to "remember a rule", "add a convention", "always do X", or similar persistent, unconditional guidance.
- The user wants to review, list, or remove existing agent rules.

Conditional or scripted automation (changed-file/command matching, notifications) belongs in **Agent Hooks**, not here. Project-scoped rules belong in the repository's `AGENTS.md` / `CLAUDE.md`.

## File format

A Markdown list. Each top-level `-` item is one rule — one line, short imperative sentence. No YAML frontmatter; the body is injected as-is under an `## Agent Rules` heading.

```markdown
- Always display file paths as Markdown links so they are clickable.
- Confirm before destructive git commands (force-push, reset --hard).
```

## Workflow

1. Resolve the current file (default `~/.csl-agent-kit/agent-rules.md`; honor `$CSL_AGENT_KIT_HOME` when set). If it is missing and the legacy `simple-rules.md` exists beside it, rename the legacy file first to preserve its contents.
2. Read, add, edit, remove, or list rules. For add, append a `-` item; merge or skip duplicates. For edit/remove, match by content and preserve unrelated rules.
3. Write the full file atomically.
4. Report the change. The rule takes effect on the **next** session start — the current session is not retroactively updated. Verify the hook with `node skills/meta/agent-hooks/scripts/agent-hooks.js show inner:agent-rules --host pi` (reports `Effective: active`).

## Conventions

- Rules are unconditional and global. Prefer observable, checkable rules ("run lint before done") over vague preferences.
- Keep the file short. If it grows large, suggest graduating specific rules into Agent Hooks or SOPs.
