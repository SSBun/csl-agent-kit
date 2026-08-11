---
name: analyze-project
description: Analyze one Git project or component and write one systematic, source-backed current-state report under docs/analysis/. Use for durable project maps, component maps, responsibility and functional-module models, core working flows, or architecture understanding needed for continued development. Exclude quick orientation, one-off implementation questions, audits, change plans, PR review, exhaustive inventories, and general courses.
---

# Analyze Project

Build one reusable current-state model for one Git project or component; never modify source.

## Invocation

```text
/analyze-project [target] [develop]
```

- Target defaults to cwd. An existing path or uniquely resolved component wins even when named `develop`; otherwise final `develop` is a compatibility alias with no behavioral effect.
- Resolve a natural-language component to exactly one repository path. Multiple scopes, candidates, or Git roots require one selection question and zero report writes.
- `learn`, `--need`, and other extra positionals are not modes; explain the supported invocation and write nothing.
- Route quick orientation to `repo-map`; route a single behavior question, research, review, audit, teaching, or change planning to the matching capability.

## Contract

1. Resolve one canonical target and Git root read-only. Reject external symlinks, escapes, unsafe output parents, and non-regular active targets.
2. Active paths: project `docs/analysis/project-map.md`; directory `docs/analysis/components/dir/<relative-dir>/map.md`; file `docs/analysis/components/file/<relative-file>.md`. Historical `docs/analysis/learning/**` is immutable archival material, not evidence.
3. Read `references/report-contract.md` completely before analysis; it governs coverage, replacement, freshness, redaction, and publication.
4. Read applicable project rules, manifests, entry points, source, configuration, and tests. Follow calls, data, events, state ownership, and external boundaries; README proves intent only, and CodeGraph navigates only.
5. Model the scope systematically: its purpose and boundaries, major functional responsibilities, and the core working flows that realize its primary value. For a component, include only its internals, direct neighbors, and flows it owns or materially participates in.
6. Put nearby source evidence under an `Evidence:` label as a Markdown bullet list. Each bullet contains exactly one repository-relative `path#symbol`, `path#key`, or line anchor wrapped in inline code. Never append anchors to prose or place them inside tables. Publish only source-backed claims; if the scope's central responsibility or a core causal boundary cannot be established, ask one focused question and write nothing.
7. Do not build, test, run the project, install, access the network, or mutate external state without explicit authorization.

Allow only Metadata, `Scope Summary`, optional `Domain Glossary`, `Functional Module Map`, `Core Working Flows`, and optional `Cross-flow Invariants`. Exclude detail-question framing, `Need`, `Direct Answer`, exhaustive file/API/type/dependency inventories, risks, recommendations, plans, courses, and mastery claims.

Always include one functional architecture diagram. Diagram each core flow whose multi-module branching, async/external boundary, or state transition matters; choose Mermaid flowchart, sequence, or state syntax. Use a `mermaid` code fence for every required visual and never substitute ASCII. Validate with an existing local validator when available; without one, retain concise Mermaid, and if validation is available but still fails after bounded repair, write nothing. Diagrams show relationships, tables and steps hold semantics, and adjacent Markdown lists hold evidence anchors.

Finish candidate checks and redaction in memory, then sample freshness before output mutation. Confirm replacement unless the current request explicitly authorizes regenerating or replacing that active report. Publish through Node stdlib with an owned sibling `open("wx")` temp, `link` when absent, or confirmed unchanged same-directory `rename` when replacing. Never overwrite through Pi `write`/`edit` or direct `writeFile`; fail closed. Claim no durability, isolation, hostile-TOCTOU protection, confinement, or cross-filesystem equivalence.

Reply only with the absolute Markdown-linked report path, one blocker/selection question, an archival notice, or `Suspected <category> at <repo-relative path>; secret value was not recorded.` Do not repeat the report.

## Maintenance

Keep `evals/contract_cases.json`, `evals/trigger_cases.json`, and `evals/semantic_config.json` aligned. Run trigger, Yao, resource, and repository checks after changes.
