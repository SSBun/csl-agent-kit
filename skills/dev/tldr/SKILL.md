---
name: tldr
description: Provides brief or detailed, source-backed in-chat understanding of any target. Use for TL;DRs, quick overviews, exploration, in-depth explanations, or detailed reports. Do not use for background or durable-file research, reviews, audits, recommendations, tutorials, plans, implementation, or repository mapping.
---

# TLDR

Select a brief overview or detailed chat report only from the criteria below.

## Route

Route background, delegated, or repository-file research to `research`; glossary, change-map, or caller-based orientation to `repo-map`; and review, audit, advice, tutorials, plans, implementation, or remediation to the matching capability.

Use the explicit target, otherwise the current topic segment. Ask one question only when target ambiguity blocks a faithful response.

## Select the Mode

Count cues only when they describe the requested response, not quoted text, source content, or a target name.

- **Brief:** `TL;DR`, `brief`, `quick`, `concise`, `one-screen`, `high-level`; Chinese: `简短`, `简要`, `快速`, `简洁`, `一屏`, `高层概览`.
- **Detailed:** `explore`, `deep`, `in-depth`, `detailed`, `comprehensive`, `thorough`, `full report`, `analyze`; Chinese: `探索`, `深入`, `详细`, `全面`, `彻底`, `完整报告`, `分析`.
- Also select detailed when the user explicitly requests at least three of: key facts; mechanism or structure; domain context; limitations or open questions; complete sources.
- If both match, ask only: “Do you want a brief or detailed response?” Do not choose. If neither matches, use brief.

A bare `/tldr` is not a brief cue. Target type, size, length, complexity, and Agent judgment never affect the mode.

## Gather

- Brief: retrieve only enough for identity, purpose, important structure, and material context.
- Detailed: read a URL target first; prefer primary sources for topics and authoritative, directly relevant files for projects.
- Never turn project understanding into a durable report, exhaustive inventory, audit, or implementation plan.
- Separate facts from inference. Disclose conflicts, uncertainty, inaccessible material, and partial coverage.

## Output

### Brief

- Start with `**TL;DR:**` and one to three sentences establishing the whole.
- Add the fewest useful bullets, normally no more than five.
- Keep it to roughly one screen; prioritize structure and relationships.

### Detailed

- Start with `**TL;DR:**`; the first substantive sentence defines the target and states what it does.
- Then use, when applicable and in order: `Key facts`, `How it works / Structure`, `Context`, `Open questions / Limitations`, `Sources`.
- Before limitations, cover definition, purpose, mechanism, and implementation as supported by sources.
- Omit a body section only when irrelevant. Always include `Sources`, listing every consulted URL, file, or reference and what it provided.
- Keep it dense and bounded; detailed does not mean exhaustive.

Match the user's language while preserving identifiers, commands, paths, and names. Respond in chat unless a requested file remains within this boundary. Do not append generic offers.

Keep `evals/trigger_cases.json` and `evals/semantic_config.json` aligned with routing and mode selection.
