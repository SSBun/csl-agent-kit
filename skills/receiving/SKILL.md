---
name: receiving
description: Restore context from tasks/handoff.md after /clear to resume previous session.
disable-model-invocation: true
---

## Receiving — Restore session context

1. Check if `tasks/handoff.md` exists. If not, tell user no handoff file found.
2. Read the file.
3. Show the user a summary of what was captured.
4. Ask user to confirm: "Continue from where the last session left off?"
5. If confirmed, use the context to resume work on the focusing question.
