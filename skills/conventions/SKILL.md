---
name: conventions
description: Manage always-on user conventions stored in ~/.csl-agent-kit/conventions.md. Use only when the user explicitly asks to save, record, or add a cross-session persistent convention or preference. Exclude ordinary preference statements, corrections, long-term answer style, SOPs, handoffs, task records, or lessons requests.
---

# Conventions

Manage the user's always-on conventions at `~/.csl-agent-kit/conventions.md`. Each entry is a user-confirmed, cross-session persistent directive. The file is referenced from `references/agents.md` and injected once by the `SessionStart` hook, so it is **always present** without any context-triggered injection mechanism.

This skill only adds, removes, and edits entries. Runtime injection is handled by the agents.md reference and the SessionStart hook, not by this skill.

## Trigger boundary

Only write when the user explicitly asks to "save to conventions / remember this convention / add to conventions / save this preference". Do not write, and do not proactively suggest writing, when the user merely states a preference, corrects you, describes how to answer going forward, or gives a current-task requirement.

The trigger boundary is covered by `evals/trigger_cases.json` and `evals/semantic_config.json`.

## What belongs here

An entry must satisfy all of:

- Remains valid across future sessions.
- Not scoped to the current task or repository.
- A directive the user wants always present and obeyed every time.
- Single, clear, and actionable.
- The agent can tell when it applies; the user can tell whether it was obeyed.
- Contains no passwords, tokens, keys, or other secrets.

Do not write the following to conventions; use the right carrier instead:

- Multi-step or reusable processes: use `sop-manager`.
- Repository engineering norms or cross-task stable engineering principles: write to `AGENTS.md` (`references/agents.md`).
- Current task progress: write to `tasks/todo.md`.
- Lessons from a specific mistake: write to `tasks/lessons.md`.
- Session-resume information: update `tasks/todo.md` or `tasks/context.md` as appropriate.
- One-off requests: execute as the current user instruction only.
- Rationale, background, long-form explanation, or sensitive data: do not write.

## Storage location

```text
~/.csl-agent-kit/conventions.md
```

The file is plain Markdown, grouped by topic, with each entry on its own line so the agent can locate it with `edit`:

```markdown
# User Conventions

Always-on conventions the agent must conform to across all sessions.

## <Topic>

- <single, actionable directive>.
- <another directive>.
```

Never write conventions into the skill directory or the distributable `references/agents.md`. Personal content (absolute paths, local tools, etc.) belongs only in `~/.csl-agent-kit/conventions.md`.

## Add an entry

1. Check the content against the boundary above (persistent, cross-session, always-on).
2. Read the existing `~/.csl-agent-kit/conventions.md` to avoid duplicates or conflicting entries.
3. Preserve the user's wording when it is already clear; tighten into a single actionable sentence when vague or multi-clause.
4. Place it under the right topic group; create a short topic heading if none fits.
5. Show the user the final text and its group, and wait for explicit confirmation.
6. Once confirmed, append the entry to the chosen group with the `edit` tool. Do not rewrite the whole file or silently alter other entries.

## Remove or modify an entry

- Remove: after confirming the exact entry with the user, delete that line precisely with `edit`; do not remove other entries in the same group.
- Modify: show the existing and proposed text, get confirmation, then replace that one line with `edit`.
- Never bulk-rewrite, auto-truncate, or overwrite unrelated entries.

## Non-goals

- No keyword matching, candidate injection, or hook scripts; always-on is the job of the agents.md reference and the SessionStart hook.
- No entry-count or character limits (no per-prompt injection cost to optimize), but entries should stay short and actionable; long-form explanation belongs in the matching carrier, not conventions.
- No JSON / YAML / database; plain Markdown is easier for the agent to read and edit directly.
- No injection logic on session start, resume, compact, or each prompt turn.

## View

```bash
cat ~/.csl-agent-kit/conventions.md
```
