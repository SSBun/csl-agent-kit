---
name: handoff-restore
description: Restores task context from a saved handoff file and continues work immediately. Use when the user says handoff restore, restore context, resume handoff, load handoff, pick up where we left off, or starts a new session to continue a previous task.
---

Resume work from `~/.agents/handoffs/{project-name}.md`. Trust the handoff — do not re-introduce the project or re-explore unless stale.

## Usage

`handoff-restore [optional project-name]`

## Storage

**Always** read from:

```
~/.agents/handoffs/{project-name}.md
```

**Project name:** user arg if provided; else basename of `git rev-parse --show-toplevel`; else basename of `pwd` (kebab-case).

## Steps

1. Set `handoff_path = ~/.agents/handoffs/{project-name}.md`.
2. If file exists → read the entire handoff file, then continue to step 5.
3. If file is missing → `ls ~/.agents/handoffs/*.md`, list available handoffs, ask user to pick one or save a new handoff first.
4. If no handoffs exist, stop. If the user picks an available handoff, set `handoff_path` to that file and read it, then continue to step 5.
5. Show the user **only**:
   - **Next Action** (verbatim from file)
   - **Where Left Off** (file:line + remaining step)
   - **In Progress** items from **Done** unchecked implied by Where Left Off
6. Ask: "Resume from here?"
7. On confirm → execute **Next Action** immediately:
   - Open files from **Where Left Off** and **Pinboard** as needed
   - Respect **Locked Decisions** and **Constraints**
   - Skip **Dead Ends**
   - Do **not** re-verify **Done** items
8. On decline → stop.

## Rules

1. **No re-introduction.** Do not summarize what the project is. Do not explain the codebase to the user.
2. **No broad re-exploration.** Do not run project-wide `find`/`grep` or read unrelated files. Open only paths in the handoff (Pinboard, Where Left Off, Artifacts).
3. **Jump to work.** After confirm, the first tool call should advance **Next Action** — not discovery.
4. **Stale check.** Re-explore only if:
   - User says context changed, or
   - Handoff **Saved** date is clearly before large refactors (user mentions, or git log shows major churn in pinned files)
   - Then re-read **only** changed areas — not the whole repo.
5. **Missing handoff fields.** If **Next Action** or **Where Left Off** is empty, ask the user one focused question, then proceed.

## What the Handoff Already Replaced

You do **not** need to reconstruct:

- Project overview (use **Task Scope** + **Pinboard** only as navigation)
- Prior conversation narrative
- Content inside referenced artifacts (open by path if needed for the next edit)

## Invoke Skills

If **Skills for Next Session** lists skills, load and follow them when the next action requires it.
