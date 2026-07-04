---
name: inject-may-agents
description: Explicitly invoked skill for reviewing a project's AGENTS.md or CLAUDE.md against the bundled May agent-principles template and proposing an AGENTS.md update. Use only when the user explicitly invokes inject-may-agents, says to inject May agents, asks to apply this template to AGENTS.md, or asks to check whether AGENTS.md/CLAUDE.md includes these principles.
---

# Inject May Agents

Review a project instruction file against the bundled template and propose the smallest AGENTS.md update that integrates missing principles.

## Template

Read `references/AGENTS.template.md` before comparing or writing anything. Treat it as the source of truth for required principles.

## Workflow

1. Resolve the target project root.
   - Use the user's provided path when present.
   - Otherwise use `git rev-parse --show-toplevel`.
   - If there is no git root, use the current working directory.

2. Inspect instruction files at the project root.
   - Check `AGENTS.md`.
   - Check `CLAUDE.md`.
   - If either file already contains the template principles, report that no injection is needed.
   - If both files exist and only `CLAUDE.md` contains the principles, report that the principles are already present and ask before duplicating them into `AGENTS.md`.

3. Choose the write target.
   - Prefer `<project-root>/AGENTS.md`.
   - If `AGENTS.md` does not exist, propose creating it.
   - Do not write to `CLAUDE.md` unless the user explicitly asks.

4. Build the proposed final `AGENTS.md` content.
   - Preserve existing AGENTS.md content.
   - Add only missing principles from the template.
   - If the existing file has a natural top-level rules section, insert the missing principles there.
   - Otherwise prepend the template principles before the existing content.
   - Do not duplicate headings or repeated bullet points.
   - Keep `AGENTS.md` content in English.

5. Show the proposed final content before writing.
   - Output the complete final `AGENTS.md` content in the conversation.
   - Ask the user to confirm before writing.
   - Stop after showing the proposed content unless the user has already explicitly confirmed the exact content in the same turn.

6. Write only after confirmation.
   - After confirmation, write the exact approved content to `AGENTS.md`.
   - Re-read the file and verify the expected template headings are present.

## Rules

- Never modify a user's `AGENTS.md` or `CLAUDE.md` before showing the complete proposed final content.
- Never silently overwrite project-specific instructions.
- Do not add new policy beyond the bundled template unless the user requests it.
- Use the smallest edit that integrates the missing template principles.
- If the project has conflicting instructions, show the conflict and ask before writing.
