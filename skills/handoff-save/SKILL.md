---
name: handoff-save
description: Saves session context to a handoff file for the next conversation. Use when the user says handoff save, save context, save handoff, pass context, store session, or wants to continue this work in a new chat later.
argument-hint: [optional note for next session]
---

Save a compact handoff so the next agent continues the **task** without re-exploring the project or re-explaining context.

## Storage

**Always** write to:

```
~/.agents/handoffs/{project-name}.md
```

Create `~/.agents/handoffs/` if missing.

**Project name:** basename of `git rev-parse --show-toplevel` when inside a git repo; otherwise basename of `pwd`. Use kebab-case (e.g. `SomeProject` → `some-project`).

If the user provides a note via args or chat, use it to sharpen **Next Action** and **Task Scope** — do not paste the note verbatim as the whole handoff.

## What to Save (and What to Skip)

Save only what the next agent needs to **resume work**, not to **learn the project**.

| Section | Save? | Why |
|---------|-------|-----|
| **Next Action** | Required | One imperative sentence — the very first thing to do |
| **Where Left Off** | Required | Exact `file:line`, what was changed, what step is unfinished |
| **Task Scope** | Required | 2–4 bullets: goal of *this task*, acceptance criteria, out of scope |
| **Pinboard** | Required | Paths only (`path` — one-line purpose). No architecture essays |
| **Locked Decisions** | Required | Choices already made — do not re-debate |
| **Constraints** | If any | API limits, platform quirks, "must use X", versions |
| **Done** | Required | Checkbox list of completed steps this session |
| **Dead Ends** | If any | Approaches tried and rejected — prevents retry loops |
| **Artifacts** | If any | Paths/URLs to plans, PRs, issues, branches — no copied content |
| **Workspace** | Required | `cwd`, git branch, clean/dirty status, relevant uncommitted files |
| **Skills** | Optional | Skills the next session should invoke, if any |

**Do not save:** project introductions, file contents, duplicated PRD/plan text, long concept explanations, generic repo tours.

## File Format

```markdown
# Handoff: {project-name}

**Saved:** {YYYY-MM-DD HH:MM}
**Working Directory:** {absolute path}
**Git Branch:** {branch or "n/a"}
**Git Status:** {clean | dirty — list key uncommitted paths}

## Next Action

{One sentence. Imperative. Specific. e.g. "Fix token expiry check in `src/auth/middleware.ts:84` and run `npm test auth`."}

## Where Left Off

- **File:** `path/to/file:line`
- **State:** {what was done to this file / function}
- **Remaining:** {exact next edit, test, or command}

## Task Scope

- **Goal:** {what we're trying to finish}
- **Done when:** {acceptance criteria}
- **Out of scope:** {explicit exclusions, if any}

## Pinboard

- `path/to/file` — {one line}
- `path/to/dir/` — {one line}

## Locked Decisions

- {decision} — {brief rationale}

## Constraints

- {constraint, or omit section}

## Done

- [x] {completed step}

## Dead Ends

- {approach} — {why it failed, or omit section}

## Artifacts

- `docs/plans/foo.md` — design doc
- PR #42 / branch `feat/bar` — {one line}

## Skills for Next Session

- `{skill-name}` — {when to use, or omit section}
```

## Steps

1. Resolve `{project-name}` and `{handoff_path}` = `~/.agents/handoffs/{project-name}.md`.
2. Gather only the sections above from the current session. Prefer paths and line numbers over prose.
3. Write the file (overwrite previous handoff for this project).
4. Tell the user: `Handoff saved to ~/.agents/handoffs/{project-name}.md`

## Rules

- **Next Action** and **Where Left Off** are mandatory and must be specific.
- Pinboard: max ~15 entries; only files/dirs touched or central to the task.
- Reference artifacts by path — never copy their bodies.
- Redact secrets (`***REDACTED***`).
