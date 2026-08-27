---
name: analyze-project
description: Analyze one Git project or component against one current implementation question and write one durable, source-backed report under docs/analysis/. Use for /analyze-project, need-bounded behavior chains, responsibilities, or repository-specific prediction checks. Develop and learn are focus aliases. Exclude quick orientation, audits, change plans, PR review, and general courses.
---

# Analyze Project

Answer one current implementation question for one Git scope; never modify source. Route excluded requests to `repo-map`, `research`, `code-review`, teaching, planning, or audit as appropriate.

## Invocation

```text
/analyze-project [target] [develop|learn] [--need <free-text tail>]
```

Interpret directly; add no parser.

- Final `--need` consumes its trimmed tail; empty means zero write and `What current implementation question should this report answer?`
- Before it, accept at most one target and alias. An existing path/component wins, including one named `learn`/`develop`.
- Target defaults to cwd. Default/`develop` is `standard`; `learn` is `learning`; focus changes no other contract.
- Ambiguous targets, Git roots, or positionals require one question and zero write.
- For prose requests, use their named scope and current question.

With no question, explain one normal call from the primary entry to its result, earliest result-changing branch, and verification entry. If no unique entry exists, ask `Which observable behavior should this report explain?` and write nothing.

## Contract

1. Resolve one canonical target and Git root read-only. Reject external symlinks, escapes, and unsafe paths; stay need-bounded.
2. Active paths: project `docs/analysis/project-map.md`; directory `docs/analysis/components/dir/<relative-dir>/map.md`; file `docs/analysis/components/file/<relative-file>.md`. Historical `docs/analysis/learning/**` is immutable archival material, not evidence.
3. Read `references/report-contract.md` completely before analysis; it governs content, replacement, freshness, redaction, and publication.
4. Read minimal sufficient source/config/tests and trace backward from the result. Use repository-relative `path#symbol`, `path#key`, or line anchors. README proves intent; CodeGraph navigates only.
5. Publish only when source proves the answer directly or as exhaustive conditions/results. Missing causal proof means zero write. Get authorization before build/test, project execution, installation, network/external access, or mutation.

Allow only Metadata, `Direct Answer`, `Need-bounded Working Model`, `Critical Evidence Path`, `Verification Anchors`, and optional `Material Uncertainty`/`Learning Check`; exclude inventories, risks, recommendations, plans, courses, and mastery claims.

Learning adds one Prediction, at most one existing need-relevant Transfer, then a compact Key; no Recall ceremony, hypothetical change, or scope expansion.

Finish candidate checks/redaction in memory, sample freshness before mutation, and confirm Replace/Cancel. Publish through Node stdlib with an owned sibling `open("wx")` temp, `link` when absent, or confirmed unchanged same-directory `rename` when replacing. Never overwrite via Pi `write`/`edit` or direct `writeFile`; fail closed. Claim no durability, isolation, hostile-TOCTOU protection, confinement, or cross-filesystem equivalence.

Reply only with the absolute Markdown-linked report path, one blocker/question, an archival notice, or `Suspected <category> at <repo-relative path>; secret value was not recorded.` Do not repeat the report.

## Maintenance

Contract cases are declarative; value cases are exactly two. Run trigger, local quality gate, and resource checks after changes.
