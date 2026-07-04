---
name: same-page
description: Re-explains and re-verifies prior assistant messages with evidence-backed explanations, confidence levels, and ASCII diagrams. Use when the user asks to clarify, justify, get on the same page, or understand the reasoning behind a previous answer.
---

# Same Page

Re-explain the prior substantive assistant message so the user can verify the reasoning. Re-read sources and re-run checks as needed; do not rely on memory.

## Required Output

- Start with a short alignment opener in the user's required response language.
- State the explanation format you chose and why it fits the prior message.
- For each material claim, provide evidence and a `High`, `Medium`, or `Low` confidence level.
- Include one compact ASCII diagram when it clarifies structure, flow, comparison, or causality.
- Retract or downgrade any earlier claim that cannot be supported.
- End with caveats, low-confidence areas, or next verification steps.

## Workflow

1. Find the most recent substantive assistant message; skip tool-call-only turns.
2. Extract key claims and group them into 2-5 themes when useful.
3. Choose a format that fits the content: narrative, table, comparison, flow, timeline, confidence map, or compact clarification.
4. Verify each substantive claim against files, command output, docs, or URLs.
5. Write with evidence close to the claim.
6. Use the diagram only when it improves understanding; skip it for narrowly trivial clarifications.

## Reference

Read `references/same-page-method.md` for confidence definitions, format-selection rules, diagram patterns, and trivial-clarification criteria.

## Principles

- Format follows content.
- Evidence over assertion.
- Honesty over completeness.
- Visuals should clarify, not decorate.
- Keep depth proportional to stakes.
