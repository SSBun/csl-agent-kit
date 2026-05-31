---
name: passing
description: Save current conversation context to tasks/handoff.md for the next session to pick up.
---

## Passing — Save session context

Write a handoff document to `.claude/handoff.md`. Goal: next agent resumes without re-exploring the project.

### Format

```markdown
# Handoff

## Project Map

Compact reference of key paths discussed in this session. One line per entry.

- `path/to/file` — one-line purpose
- `path/to/dir/` — one-line purpose

## Core Concepts

Classes, types, or domain concepts central to the current task, with file locations.

- **ConceptName** (`path/to/file:line`) — one-line description

## State

### Done
- <completed work this session>

### In Progress
- <unfinished work, with file:line where left off>

### Blocked
- <blockers, if any>

## Focusing Question

<one sentence: what the agent should work on next>

## Decisions & Constraints

- <decisions made this session that affect future work>
- <constraints discovered (API limits, platform quirks, etc.)>

## Errors Encountered

- <error messages or symptoms encountered, with resolution if found>
```

### Rules

1. **Paths, not paragraphs.** Every key file/dir gets a path entry. No prose descriptions of structure.
2. **Pin locations.** Concepts get `file:line` references so next agent jumps straight there.
3. **State is required.** "Done", "In Progress", "Focusing Question" must all be filled. If nothing is blocked, omit that section.
4. **No duplication.** Don't copy content from PRDs, plans, ADRs, issues, commits, or diffs. Reference them by path.
5. **Be specific.** "Left off debugging auth middleware token expiry check" not "working on auth stuff".
6. Confirm to user that handoff was saved.
