---
name: standing-orders
description: Manage always-on user directives stored in ~/.csl-agent-kit/standing-orders.md. Use only when the user explicitly asks to save, record, or add a cross-session persistent directive or standing order. Exclude ordinary preference statements, corrections, long-term answer style, SOPs, handoffs, task records, or lessons requests.
---

# Standing Orders

Manage the user's always-on directives at `~/.csl-agent-kit/standing-orders.md`. Each entry is a user-confirmed, cross-session persistent directive the agent must obey every turn. The file is referenced from `references/agents.md` and injected once by the `SessionStart` hook, so it is **always present** without any context-triggered injection mechanism.

This skill only adds, removes, and edits entries. Runtime injection is handled by the agents.md reference and the SessionStart hook, not by this skill.

## Trigger boundary

Only write when the user explicitly asks to "save as a standing order / remember this rule / add to standing orders / make this permanent". Do not write, and do not proactively suggest writing, when the user merely states a preference, corrects you, describes how to answer going forward, or gives a current-task requirement.

The trigger boundary is covered by `evals/trigger_cases.json` and `evals/semantic_config.json`.

## File spec

```text
~/.csl-agent-kit/standing-orders.md
```

- Plain Markdown; no JSON, YAML, or database.
- Max **15 entries**, **1500 characters total** (≈ one screen; keeps session-start injection under ~400 tokens). At capacity, require the user to delete or merge before adding; never auto-truncate or silently drop.
- Each entry: single line, imperative, ≤ 120 characters.
- A single one-line intro may follow the `#` title; no other paragraphs.
- Grouped under short topic headings (plural noun). No empty groups.
- No rationale, no conditional branches. If it needs explanation, it belongs in another carrier.

Shape:

```markdown
# Standing Orders

One-line intro.

## <Topic>

- <imperative verb> <object> [<condition>].
- <imperative verb> <object> [<condition>].
```

Never write directives into the skill directory or the distributable `references/agents.md`. Personal content (absolute paths, local tools) belongs only in `~/.csl-agent-kit/standing-orders.md`.

## What belongs here

An entry must satisfy all of:

- Cross-session: valid beyond the current session.
- Cross-repo: not scoped to one task or repository.
- Always-on: the user wants it obeyed every applicable turn.
- Single action: one imperative per entry.
- Verifiable: the agent can tell when it applies; the user can tell whether it was obeyed.
- Safe: no passwords, tokens, keys, or other secrets.

## Guide flow

When the user asks to save a directive, run these four steps. Each step has explicit exit ramps — do not force non-standing-order content into the file.

### 1. CLASSIFY

Identify which bucket the request falls into:

| Bucket | Signal | Action |
|---|---|---|
| Standing order | cross-session, always-on, single action | continue to step 2 |
| Task / repo rule | scoped to current task or repository | suggest `AGENTS.md`; do not write |
| Process | multi-step or reusable workflow | suggest `sop-manager`; do not write |
| Lesson | correction derived from a specific mistake | suggest `tasks/lessons.md`; do not write |
| One-off | current-task-only request | execute inline; do not write |

If the request spans multiple buckets, split it; route each part to its bucket.

### 2. DISTILL

Rewrite the request as a single-line imperative:

- Multi-clause sentence → split into multiple entries, or route to `sop-manager` if it is really a process.
- Conditional branch (`if X then Y else Z`) → split into separate entries, or route to `sop-manager`.
- Rationale, background, or explanation → delete it; keep only the action. (Rationale belongs in `lessons.md` or an SOP.)
- Vague wording → tighten to a concrete verb + object.

### 3. CHECK

Read the current `~/.csl-agent-kit/standing-orders.md`:

- **Duplicate** (equivalent existing entry) → tell the user it already exists; do not write.
- **Conflict** (existing entry contradicts the new one) → show both, ask whether to replace or keep; do not silently overwrite.
- **Capacity** (15 entries or 1500 chars reached) → ask the user to delete or merge first; never auto-truncate.
- **Group fit** → place under an existing topic if one fits; otherwise create a short new topic heading.

### 4. CONFIRM

Show the user the final entry text, its topic group, and the resulting file size (entries / chars). Wait for explicit confirmation, then append the single line with `edit`. Do not rewrite the whole file or alter unrelated entries.

## Remove or modify

- **Remove:** confirm the exact entry with the user, delete that one line with `edit`; do not remove others in the same group.
- **Modify:** show existing and proposed text, get confirmation, replace that one line with `edit`.
- Never bulk-rewrite, auto-truncate, or overwrite unrelated entries.

## Non-goals

- No keyword matching, candidate injection, or hook scripts; always-on is the job of the agents.md reference and the SessionStart hook.
- No injection logic on session start, resume, compact, or each prompt turn — the file is injected wholesale by the platform hook, not by this skill.
- No migration or rewriting of the data filename.

## View

```bash
cat ~/.csl-agent-kit/standing-orders.md
```
