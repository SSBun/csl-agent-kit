---
name: receiving
description: Restore context from tasks/handoff.md after /clear to resume previous session.
---

## Receiving — Restore session context

Resume work from a previous session's handoff. Do NOT re-explore the project.

### Steps

1. Check if `.claude/handoff.md` exists. If not, tell user no handoff file found.
2. Read the file.
3. Internalize the handoff:
   - **Project Map** — these are the key paths. You now understand the layout. Do NOT re-explore or re-analyze project structure.
   - **Core Concepts** — these are the domain primitives. You now understand the mental model.
   - **State** — this is where work stands. Do NOT re-verify completed items.
   - **Focusing Question** — this is your target.
   - **Decisions & Constraints** — these are locked in. Respect them.
   - **Errors Encountered** — avoid repeating these mistakes.
4. Show the user a one-paragraph summary: focusing question + current state (in-progress items).
5. Ask user to confirm: "Resume from here?"
6. If confirmed, start working on the focusing question. Use the Project Map and Core Concepts to navigate directly — no re-analysis needed.

### Rules

1. **No re-exploration.** Trust the handoff. Do NOT run `find`, `grep`, or file reads to "understand the project" unless the handoff is clearly stale or incomplete.
2. **No re-introduction.** Do NOT summarize or explain the project back to the user. They know it — they just worked on it.
3. **Jump to work.** After confirmation, immediately act on the focusing question. The handoff already gave you context.
4. **Stale handoff check.** If the handoff is older than the last commit or the user says things have changed, THEN re-explore — but only the changed areas.
