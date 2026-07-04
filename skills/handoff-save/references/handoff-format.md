# Handoff Format

Save only what the next agent needs to resume work, not to learn the whole project.

## What to Save

| Section | Save? | Why |
| --- | --- | --- |
| Next Action | Required | First imperative sentence for the next agent |
| Where Left Off | Required | Exact file/line, changed state, unfinished step |
| Task Scope | Required | Goal, acceptance criteria, out of scope |
| Pinboard | Required | Paths only, each with one-line purpose |
| Locked Decisions | Required | Choices already made |
| Constraints | If any | API limits, platform quirks, required tools, versions |
| Done | Required | Completed steps from this session |
| Dead Ends | If any | Tried and rejected approaches |
| Artifacts | If any | Paths, URLs, PRs, issues, branches |
| Workspace | Required | `cwd`, branch, clean/dirty status, relevant uncommitted files |
| Skills | Optional | Skills the next session should invoke |

Do not save project introductions, file contents, duplicated plan text, long concept explanations, or generic repo tours.

## Template

```markdown
# Handoff: {project-name}

**Saved:** {YYYY-MM-DD HH:MM}
**Working Directory:** {absolute path}
**Git Branch:** {branch or "n/a"}
**Git Status:** {clean | dirty - list key uncommitted paths}

## Next Action

{One imperative, specific sentence.}

## Where Left Off

- **File:** `path/to/file:line`
- **State:** {what was done}
- **Remaining:** {exact next edit, test, or command}

## Task Scope

- **Goal:** {task goal}
- **Done when:** {acceptance criteria}
- **Out of scope:** {explicit exclusions}

## Pinboard

- `path/to/file` - {one line}

## Locked Decisions

- {decision} - {brief rationale}

## Constraints

- {constraint, or omit section}

## Done

- [x] {completed step}

## Dead Ends

- {approach} - {why it failed, or omit section}

## Artifacts

- `docs/plans/foo.md` - design doc
- PR #42 / branch `feat/bar` - {one line}

## Skills for Next Session

- `{skill-name}` - {when to use, or omit section}
```
