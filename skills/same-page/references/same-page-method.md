# Same Page Method

## Format Selection

Pick a layout after reading the prior message.

| Prior message shape | Useful response shape |
| --- | --- |
| Single decision or thesis | Narrative arc, evidence blocks, one central diagram |
| Several independent claims | Mini-sections or compact evidence table |
| Comparison or trade-off | Side-by-side table, then supporting evidence |
| Process, pipeline, causality | Flow or sequence diagram first, then evidence by stage |
| Heavy uncertainty | Confidence overview, then Low/Medium items first |
| Debugging narrative | Timeline or causal chain |

Briefly state the format choice before the body.

## Evidence and Confidence

Every material claim needs:

- The claim.
- Concrete evidence: file and line, command output, URL, or documentation.
- Confidence: `High`, `Medium`, or `Low`.
- One-line basis for that confidence.

Confidence definitions:

- `High`: directly verified against source code, documentation, or runtime output.
- `Medium`: inferred from strong patterns, conventions, or partial evidence.
- `Low`: based on general knowledge, analogy, or assumptions.

If evidence is missing, say so and retract or downgrade the earlier claim.

## ASCII Diagrams

Include at least one diagram unless the clarification is narrowly trivial.

Choose style by content:

- Control or data flow: boxes and arrows.
- Nesting, ownership, taxonomy: tree.
- Layers, stacks, phases: stacked blocks.
- Options or criteria: comparison matrix.
- State transitions: before/after or state sketch.
- Relationships: labeled graph.

Keep diagrams compact, ideally under 20 lines and 72 columns.

## Trivial Clarification Exception

You may skip the diagram only when all are true:

- The prior message has one small wording, sequencing, or terminology issue.
- No architecture, security, financial, legal, medical, data-loss, or production-risk claim is being justified.
- The answer can be resolved in a few sentences with direct evidence and confidence.
- A diagram would repeat the prose rather than clarify structure.

When skipping the diagram, say so briefly.
