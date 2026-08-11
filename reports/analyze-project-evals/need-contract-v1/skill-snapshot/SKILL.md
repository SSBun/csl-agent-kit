---
name: analyze-project
description: Analyze one Git project, directory, or file against one current implementation question and write one durable, source-backed report under docs/analysis/. Use for /analyze-project, need-bounded deep source analysis, a current behavior chain, or repository-specific prediction checks. Develop and learn are focus aliases, not separate products. Exclude quick orientation, audits, change plans, PR review, and general courses.
---

# Analyze Project

Answer one current implementation question for one Git scope in one durable report. Analyze source; never modify source.

Use `repo-map` for quick orientation, `research` for external docs, teaching for general courses, `code-review` for code changes, planning for implementation steps, and audit skills for risks or recommendations.

## Invocation

```text
/analyze-project [target] [develop|learn] [--need <free-text tail>]
```

Interpret this directly; do not add a parser.

- `--need` is final; trim its whole tail as free text. If empty, write nothing and ask `What current implementation question should this report answer?`
- Before `--need`, accept at most one target and one exact alias. An existing path or one unambiguous component wins over an alias, including paths named `learn` or `develop`.
- Default target is cwd. Default/`develop` focus is `standard`; `learn` focus is `learning`. Focus never changes the need, path, evidence gate, or safety contract.
- Multiple targets, Git roots, extra positionals, or component candidates are ambiguous: write nothing and ask one selection question.

Without an explicit need, explain one normal call from the primary real entry to its main observable result, the earliest current branch that changes it, and the existing verification entry; exclude unrelated responsibilities. If no unique entry or behavior exists, write nothing and ask `Which observable behavior should this report explain?`

## Workflow

1. Resolve one canonical target, unique Git root, and repository-relative scope read-only. The target must equal or stay inside the root. Reject external symlinks, escapes, and unsafe paths; never hash-fallback. A component covers only its need-relevant internals and direct boundaries.
2. Derive one active path:
   - project: `docs/analysis/project-map.md`
   - directory: `docs/analysis/components/dir/<relative-dir>/map.md`
   - file: `docs/analysis/components/file/<relative-file>.md`
3. Read `references/report-contract.md` completely before analysis. Historical `docs/analysis/learning/**` reports are archival: do not use them as evidence or mutate them.
4. Read the smallest sufficient entries, implementation, config, boundaries, and tests. Trace backward from the required observable result. Prefer `path#symbol`, then `path#key`, then line numbers. README proves intent only; CodeGraph is navigation only.
5. Publish only when the answer core is directly source-proven, or source proves every relevant condition, result, and the condition set's exhaustiveness. Missing required causal proof means zero write.

Default operations are read-only. Obtain explicit authorization before build/test, project code or CLI execution, processes, dependency installation, network/external services, or project/external mutation. If unauthorized runtime proof is essential, write nothing.

## Report

Write in the user's language with this minimal shape:

1. Metadata: `Scope`, `Need`, `HEAD`/`unborn`, `Working tree`, timezone-aware `Generated at`;
2. `Direct Answer`;
3. `Need-bounded Working Model`;
4. `Critical Evidence Path`;
5. `Verification Anchors`;
6. optional `Material Uncertainty`;
7. optional `Learning Check`.

Keep content only when it answers the need, explains necessary causality, supplies evidence, bounds a material unknown, or checks current understanding. Exclude complete trees and inventories, risks, recommendations, change plans, courses, progress, and mastery claims.

Learning focus reuses the same evidence path and adds exactly one Prediction plus at most one existing need-relevant contrast as Transfer, followed by a compact Key. No Recall ceremony, hypothetical changes, or scope expansion.

## Safe Publication and Reply

Follow `references/report-contract.md`: finish candidate/evidence/Mermaid fallback/redaction in memory; sample freshness before output mutation; confirm Replace/Cancel; then use an ephemeral Node standard-library operation with an owned sibling `open("wx")` temp, `link` for absent targets, or confirmed unchanged same-directory `rename` for replacements. Never directly overwrite the active report with Pi `write`/`edit` or `writeFile`; fail closed on changed or unsupported states.

Do not claim `fsync` durability, writer isolation, hostile-TOCTOU protection, path confinement, or cross-filesystem equivalence.

Reply only with the absolute Markdown-linked report path, one blocker/selection question, an archival notice, or `Suspected <category> at <repo-relative path>; secret value was not recorded.` Do not repeat the report.

## Maintenance

`evals/contract_cases.json` is declarative, not executed. `evals/value_cases.json` contains exactly two frozen value cases. After changes, run trigger evaluation, Yao validation, and the resource-boundary check.
