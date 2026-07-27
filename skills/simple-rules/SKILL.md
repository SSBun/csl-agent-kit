---
name: simple-rules
description: Record simple rules or conventions into ~/.csl-agent-kit/simple-rules.md so they are injected into every session at start. Use when the user wants to add, edit, list, or remove a persistent rule or convention (for example "always display file paths as markdown links", "confirm before deleting", or "prefer X over Y"). These are lightweight global directives surfaced as session context; use Triggerify persistent directives for conditional or scripted automation instead.
---

# simple-rules

Maintain a single Markdown file at `~/.csl-agent-kit/simple-rules.md` (or `$CSL_AGENT_KIT_HOME/simple-rules.md`). A built-in triggerify hook (`inner:simple-rules`) reads this file at every `session-start` and, when non-empty, injects its contents into the session context.

## When to use

- The user asks to "remember a rule", "add a convention", "always do X", or similar persistent, unconditional guidance.
- The user wants to review, list, or remove existing simple rules.

Conditional or scripted automation (changed-file/command matching, notifications) belongs in **Triggerify** hooks, not here. Project-scoped rules belong in the repository's `AGENTS.md` / `CLAUDE.md`.

## File format

A Markdown list. Each top-level `-` item is one rule — one line, short imperative sentence. No YAML frontmatter; the body is injected as-is under a `## Simple Rules` heading.

```markdown
- Always display file paths as Markdown links so they are clickable.
- Confirm before destructive git commands (force-push, reset --hard).
```

## Workflow

1. Read the current file (default `~/.csl-agent-kit/simple-rules.md`; honor `$CSL_AGENT_KIT_HOME` when set).
2. Add / edit / remove / list. For add, append a `-` item; merge or skip duplicates. For edit/remove, match by content and preserve unrelated rules.
3. Write the full file atomically.
4. Report the change. The rule takes effect on the **next** session start — the current session is not retroactively updated. Verify the hook with `node skills/triggerify/scripts/triggerify.js show inner:simple-rules --host pi` (reports `Effective: active`).

## Conventions

- Rules are unconditional and global. Prefer observable, checkable rules ("run lint before done") over vague preferences.
- Keep the file short. If it grows large, suggest graduating specific rules into Triggerify hooks or SOPs.
