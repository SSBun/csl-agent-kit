---
name: tldr
description: Provides a concise, faithful overview of any supplied target—or the current conversation topic when no target is supplied. Use when the user asks for a TL;DR, quick overview, or concise big-picture summary. Do not use for deep research, review, tutorials, recommendations, or exhaustive analysis.
---

# TLDR

Give the user a reliable big-picture understanding of a target in roughly one screen. Treat topics, conversations, projects, links, files, code, and other content as examples, not as a closed input taxonomy.

## Workflow

1. Resolve the target.
   - Use the user's explicit target when provided.
   - Otherwise use the current topic segment, beginning at the latest material task or topic change visible in the conversation.
   - Ask one focused question only when a material ambiguity prevents a faithful overview.
2. Gather only enough information to understand the target.
   - Use the host's existing conversation, file, Git, and web capabilities as needed.
   - For a named topic, start with existing knowledge and retrieve only what is needed for current or uncertain facts.
   - For a large target, prefer authoritative summaries, manifests, entry points, and directly relevant material over exhaustive scanning.
   - Stop once the target's identity, purpose, important structure, and material context are clear.
3. Build the overview around the target's own shape. Select only the useful dimensions, such as purpose, main aspects, relationships, workflow, current state, decisions, or constraints. These are reasoning prompts, not required headings.
4. Write a concise, faithful overview. Separate supported facts from uncertainty and omit unsupported inference.

## Output

- Start with `**TL;DR:**` followed by one to three sentences that establish the whole.
- Add the fewest bullets needed to make the structure clear, normally no more than five.
- Keep the default response to roughly one screen; simple targets may be much shorter.
- Prioritize structure and relationships over isolated details.
- Match the user's language while preserving code identifiers, commands, paths, and proper names.
- Include concise source links when retrieval supports the overview, and state the coverage when only part of the target was accessible.
- Respond in chat by default. Write a file only when the user explicitly requests persistence.
- Do not append generic offers for more help.

## Boundaries and Failure

- Do not turn the overview into deep research, a review, recommendations, a tutorial, or exhaustive project analysis.
- Do not add actions, risks, conclusions, or advice that the source does not support.
- If the target is empty, missing, or inaccessible, say so instead of inventing an overview.
- If a remote source requires authentication or blocks access, state that its body was not read; do not present search snippets as the source itself.
- If sources conflict or a current fact cannot be verified, disclose the conflict or uncertainty rather than silently choosing.
- For an oversized target, use the smallest representative authoritative scope and state that scope.

## Validation

Keep `evals/trigger_cases.json` and `evals/semantic_config.json` aligned with the routing boundary after description changes.
