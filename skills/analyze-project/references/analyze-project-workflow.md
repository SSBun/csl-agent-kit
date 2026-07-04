# Analyze Project Workflow

Use this reference when running `analyze-project` beyond a quick orientation pass.

## Execution Modes

| Mode | When | How |
|------|------|-----|
| Parallel | Subagents or Task tool available | Spawn one agent per report; run Phase 1 then Phase 2 concurrently. |
| Sequential | No subagent support | Run each prompt in the main thread, one report at a time, in the same order. |

Sequential mode produces identical outputs. Only wall-clock time differs.

## Report Set

All reports go to `docs/analysis/` in the project root.

| Report | Purpose | Scope |
| --- | --- | --- |
| `project-structure.md` | Directory layout, entry points, module boundaries | Phase 1 |
| `dependencies.md` | Package graph, versions, licenses | Phase 1 |
| `development-history.md` | Contribution patterns, churn, release cadence | Phase 1 |
| `build-and-deploy.md` | CI/CD, build system, deployment | Phase 1 |
| `architecture.md` | Patterns, layer boundaries, responsibilities | Phase 2 standard |
| `data-flow.md` | Stack inventory, data movement, storage backends | Phase 2 standard |
| `process-analysis.md` | Business logic step-by-step | Phase 2 standard |
| `api-surface.md` | Public endpoints, protocols, auth model | Phase 2 standard |
| `data-model.md` | Schemas, ORM models, migrations | Phase 2 standard |
| `security-review.md` | Auth flow, secret handling, attack surface | Phase 2 deep |
| `quality-report.md` | Test strategy, coverage, linting, type safety | Phase 2 deep |
| `SUMMARY.md` | Executive summary and analysis index | Phase 3 |

`templates/SUMMARY.md` has no matching prompt. Build it inline by aggregating findings from generated reports.

## Stack Detection

Scan manifest and lock files:

- Node.js/JS: `package.json`, `yarn.lock`, `pnpm-lock.yaml`
- Rust: `Cargo.toml`, `Cargo.lock`
- Go: `go.mod`, `go.sum`
- Python: `requirements.txt`, `pyproject.toml`, `Pipfile.lock`
- Ruby: `Gemfile`, `Gemfile.lock`
- Java/Kotlin: `pom.xml`, `build.gradle`
- .NET: `*.sln`, `*.csproj`
- Swift: `Package.swift`
- PHP: `composer.json`, `composer.lock`
- Elixir: `mix.exs`, `mix.lock`

## Placeholder Substitution

Every prompt under `prompts/` uses placeholders. Replace them before handing the prompt to a subagent or running it in the main thread.

| Placeholder | Value |
|-------------|-------|
| `{{PROJECT_PATH}}` | Absolute path to the target project |
| `{{SKILL_PATH}}` | Absolute path to this skill directory |
| `{{TECH_STACK}}` | Comma-separated stack detected from manifests |

Never spawn a subagent with literal `{{...}}` tokens.

## Phase 1

Run these discovery reports for every depth:

- `scan-structure` -> `docs/analysis/project-structure.md`
- `scan-dependencies` -> `docs/analysis/dependencies.md`
- `scan-build` -> `docs/analysis/build-and-deploy.md`
- `scan-git-history` -> `docs/analysis/development-history.md`

## Phase 2

For `standard` and `deep`, read Phase 1 outputs before deeper analysis.

Standard reports:

- `analyze-architecture` -> `docs/analysis/architecture.md`
- `analyze-data-flow` -> `docs/analysis/data-flow.md`
- `analyze-process` -> `docs/analysis/process-analysis.md`
- `analyze-api-surface` -> `docs/analysis/api-surface.md`
- `analyze-data-model` -> `docs/analysis/data-model.md`

Deep-only reports:

- `analyze-security` -> `docs/analysis/security-review.md`
- `analyze-quality` -> `docs/analysis/quality-report.md`

## Phase 3

After selected reports complete:

1. Read all generated reports.
2. Extract key findings from each.
3. Generate `docs/analysis/SUMMARY.md` using `templates/SUMMARY.md`.
4. Include an executive summary and an index linking to each report.

## Output Discipline

Templates define report structure. Prompts guide what to scan and how to fill each template. Preserve template headings and fill `<!-- FILL: ... -->` placeholders with concrete findings.
