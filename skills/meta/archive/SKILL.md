---
name: archive
description: Archives an exact user-selected range of visible User and Agent messages from the current Pi session into `tasks/conversations/`. Use for `/archive` or explicit requests to preserve part of the current conversation verbatim. Do not use for summaries, task state, implementation guidance, or external transcripts.
---

# Archive Conversation

Save a verbatim historical transcript from the current Pi session. The command argument is a selection instruction, never transcript content.

## Workflow

1. Require a non-empty selection instruction; ask what to preserve when missing.
2. Resolve the source boundary:
   - For `/archive`, use the host-provided session file, workspace, and source leaf.
   - For natural Pi invocation, use `PI_SESSION_FILE`, list the active branch, and exclude the current archive request.
   - Without a raw Pi session file or reliable endpoint, stop rather than reconstructing from memory or compacted context.
3. Inspect visible messages:

   ```text
   node <skill-dir>/scripts/archive-session.mjs list --session <session-file> [--leaf <source-leaf>] [--limit 200]
   ```

   Increase the limit only when the requested segment is older.
4. Map the instruction to one contiguous inclusive message-ID range. A topic is sufficient only when it identifies one clear segment. If multiple ranges or endpoints are plausible, ask one focused clarification before writing.
5. Inspect exact candidate text when needed:

   ```text
   node <skill-dir>/scripts/archive-session.mjs show --session <session-file> [--leaf <source-leaf>] --from <message-id> --to <message-id>
   ```

6. Derive a short title in the user's language and save:

   ```text
   node <skill-dir>/scripts/archive-session.mjs save --session <session-file> [--leaf <source-leaf>] --workspace <workspace> --from <message-id> --to <message-id> --selection <original-instruction> --title <title>
   ```

7. Report only the saved path and message count.

## Exactness Contract

- Preserve selected User and Agent text in branch order without summarizing, correcting, translating, escaping, or normalizing whitespace.
- Include only text blocks from standard `user` and `assistant` messages.
- Exclude system/developer prompts, thinking, tool calls/results, images, custom entries, compaction summaries, and abandoned branches.
- The script owns extraction and writing; never copy transcript text manually.
- Exclude the `/archive` dispatch turn unless explicitly requested.
- V1 supports one contiguous range. For tool data or disjoint ranges, explain the boundary and ask for one supported range.

## Output and Failure

Write `tasks/conversations/YYYY-MM-DD-HHmm-<topic>.md` without overwriting. Mark it as historical context, not authoritative task state, decisions, or implementation guidance.

Fail closed when the raw session, active branch, endpoint, or semantic range is unreliable. Never substitute a summary or best-effort reconstruction.

Keep `evals/trigger_cases.json` and `evals/semantic_config.json` aligned with the routing boundary.
