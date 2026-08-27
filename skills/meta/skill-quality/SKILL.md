---
name: skill-quality
description: Validate one or all Agent Skill packages with CSL Agent Kit's deterministic local quality gate. Use after creating or modifying a skill package, or when asked to check Skill frontmatter, resources, context budget, or routing fixtures. Do not use for non-skill rules, subjective portfolio analysis, or runtime project tests.
---

# Skill Quality

Run the repository-owned deterministic gate for Skill package maintenance. It reports package-level `pass`, `warning`, or `failure` results and never executes package scripts or project tests.

## Commands

Resolve this Skill's directory from `SKILL.md`, then run:

```text
node <skill-quality-dir>/scripts/check.js <skill-dir>
node <skill-quality-dir>/scripts/check.js --all --workspace <workspace>
```

Add `--json` for machine-readable output or `--no-color` for plain human output. Exit code `0` means no failures, including warning-only results; `2` means a quality failure; `1` means invalid invocation or no discovered packages.

## Workflow

1. Check every changed Skill package individually. Use `--all` only for a repository-wide Skill change or an explicit whole-workspace request.
2. Fix every failure before completion. Review warnings in context and disclose any accepted warning that affects confidence; a context-budget warning never justifies deleting required workflow guidance.
3. Keep package-specific behavioral checks aligned. Run focused project tests only when the user and governing project rules authorize them; this gate does not run tests on the Agent's behalf.

## Deterministic Checks

The gate checks:

- `SKILL.md` frontmatter keys, name, description, and directory identity;
- parseability of package JSON and YAML files;
- `agents/openai.yaml` display fields when present;
- empty or unreferenced `references/`, `scripts/`, `evals/`, `assets/`, and `templates/` resources;
- estimated initial-load context from `SKILL.md` and `agents/` against a 1000-token warning budget;
- `evals/trigger_cases.json` schema, plus deterministic routing evaluation when `evals/semantic_config.json` is also present.

## Boundaries

Do not use this Skill to validate `AGENTS.md`, `CLAUDE.md`, SOPs, hooks, or ordinary source files. It does not execute package scripts, project tests, builds, packaging, or telemetry, and it does not assign subjective portfolio scores. Apply the owning rule, SOP, or focused project verification to those concerns instead.

## Maintainer Validation

Run this gate against its own package and in `--all --json` mode, keep `evals/trigger_cases.json`, `evals/semantic_config.json`, and focused CLI coverage aligned, validate changed JSON/YAML, run syntax checks, and finish with `git diff --check`. Treat test execution as a separate, explicitly authorized project check.
