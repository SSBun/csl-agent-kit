---
name: analyze-project
description: Performs deep multi-report analysis of a software project. Use when the user wants project analysis, codebase audit, architecture review, or reports under docs/analysis/.
argument-hint: [project-path] [depth]
---

Analyze a software project and generate detailed analysis reports.

## Usage

```
/analyze-project [project_path] [depth]
```

- `project_path`: defaults to current directory
- `depth`: `quick` | `standard` | `deep` (default: `standard`)

## Execution Modes

Choose based on platform capabilities:

| Mode | When | How |
|------|------|-----|
| **Parallel** (preferred) | Subagents/Task tool available | Spawn one agent per report; run Phase 1 then Phase 2 concurrently |
| **Sequential** (fallback) | No subagent support (some Codex/compact sessions) | Run each prompt in the main thread, one report at a time, same order as below |

Sequential mode produces identical outputs — only wall-clock time differs. Never skip reports required by the chosen depth.

## Depth Levels

| Level | Phase 1 (Discovery) | Phase 2 (Deep Analysis) | Phase 3 (Synthesis) |
|-------|--------------------|-----------------------|--------------------|
| **quick** | structure + deps + build + git | - | SUMMARY.md |
| **standard** | all Phase 1 | architecture + data-flow + process-analysis + api-surface + data-model | SUMMARY.md |
| **deep** | all Phase 1 | all Phase 2 + security-review + quality-report | SUMMARY.md with cross-references |

## Output Structure

All reports go to `docs/analysis/` in the project root (avoids colliding with existing user docs):

```
docs/analysis/
├── SUMMARY.md              # Executive summary + analysis index (synthesized in Phase 3, no dedicated prompt)
├── project-structure.md    # Directory layout, entry points, module boundaries
├── dependencies.md         # Package graph, versions, licenses
├── development-history.md  # Contribution patterns, churn, release cadence
├── build-and-deploy.md     # CI/CD, build system, deployment
├── architecture.md         # Patterns, layer boundaries, module responsibilities
├── data-flow.md            # Tech stack inventory, data movement, storage backends
├── process-analysis.md     # Business logic step-by-step
├── api-surface.md          # Public endpoints, protocols, auth model
├── data-model.md           # Schemas, ORM models, migrations
├── security-review.md      # Auth flow, secret handling, attack surface (deep only)
└── quality-report.md       # Test strategy, coverage, linting, type safety (deep only)
```

> Note: `templates/SUMMARY.md` exists but has no matching prompt file. Phase 3 fills it inline by aggregating findings from the other reports — this is intentional, not a missing prompt.

## Execution Workflow

### Step 1: Setup

1. Determine `project_path` (default: current directory)
2. Determine `depth` (default: `standard`)
3. Create `docs/analysis/` directory if not exists
4. Auto-detect tech stack by scanning manifest/lockfiles:
   - `package.json` / `yarn.lock` / `pnpm-lock.yaml` → Node.js/JS
   - `Cargo.toml` / `Cargo.lock` → Rust
   - `go.mod` / `go.sum` → Go
   - `requirements.txt` / `pyproject.toml` / `Pipfile.lock` → Python
   - `Gemfile` / `Gemfile.lock` → Ruby
   - `pom.xml` / `build.gradle` → Java/Kotlin
   - `*.sln` / `*.csproj` → .NET
   - `Package.swift` → Swift
   - `composer.json` / `composer.lock` → PHP
   - `mix.exs` / `mix.lock` → Elixir

### Step 1b: Prepare Prompts (Placeholder Substitution)

Every prompt under `prompts/` uses placeholders. **Replace them before handing the prompt to a subagent or running it in the main thread** — never spawn with literal `{{…}}` tokens.

| Placeholder | Value |
|-------------|-------|
| `{{PROJECT_PATH}}` | Absolute path to the target project (from Step 1) |
| `{{SKILL_PATH}}` | Absolute path to this skill directory (`…/skills/analyze-project`) |
| `{{TECH_STACK}}` | Comma-separated stack detected in Step 1 (e.g. `Node.js, TypeScript`) |

**How to substitute:**

1. Read the prompt file for the report (e.g. `prompts/scan-structure.md`).
2. Replace each placeholder with the resolved value above.
3. Pass the **filled prompt** to the subagent (Task tool) or execute it yourself in sequential mode.

Subagents must write outputs only under `{{PROJECT_PATH}}/docs/analysis/` — paths in prompts already target that directory after substitution.

### Step 2: Phase 1 — Discovery (Parallel Subagents)

Spawn parallel subagents for each Phase 1 scan. Each subagent:
- Receives the **substituted** prompt from Step 1b (not the raw template file)
- Reads the corresponding template from `templates/`
- Writes output using the corresponding template from `templates/`
- Saves to `docs/analysis/<report>.md`

All Phase 1 subagents run concurrently:

```
Agent 1: scan-structure     → docs/analysis/project-structure.md
Agent 2: scan-dependencies  → docs/analysis/dependencies.md
Agent 3: scan-build         → docs/analysis/build-and-deploy.md
Agent 4: scan-git-history   → docs/analysis/development-history.md
```

### Step 3: Phase 2 — Deep Analysis (Parallel Subagents)

Spawn parallel subagents for each Phase 2 analysis. Each subagent:
- Receives the **substituted** prompt from Step 1b
- Reads Phase 1 outputs from `docs/analysis/` for context
- Reads the corresponding template
- Writes output using the corresponding template
- Saves to `docs/analysis/<report>.md`

Standard depth subagents:

```
Agent 5: analyze-architecture     → docs/analysis/architecture.md
Agent 6: analyze-data-flow        → docs/analysis/data-flow.md
Agent 7: analyze-process          → docs/analysis/process-analysis.md
Agent 8: analyze-api-surface      → docs/analysis/api-surface.md
Agent 9: analyze-data-model       → docs/analysis/data-model.md
```

Deep-only additional subagents:

```
Agent 10: analyze-security        → docs/analysis/security-review.md
Agent 11: analyze-quality         → docs/analysis/quality-report.md
```

### Step 4: Phase 3 — Synthesis

After all Phase 2 subagents complete:
1. Read all generated reports
2. Extract key findings from each
3. Generate `docs/analysis/SUMMARY.md` (using `templates/SUMMARY.md` as the structure) with:
   - Executive summary section
   - Analysis index table linking to each report

### Step 5: Report

Tell user:
- How many reports generated
- Where they are (`docs/analysis/` path)
- Top 3 findings across all reports

## Template Format

Each template defines the report structure. Prompts guide the subagent on what to scan and how to fill the template. Templates contain markdown sections with `<!-- FILL: description -->` placeholders.

## NEVER

- Modify any source code in the target project
- Run destructive commands (delete, drop, reset)
- Execute the project's code (only read it)
- Commit anything to the target project's git
- Include secrets or credentials in reports (redact with `***`)

## ALWAYS

- Prefer parallel subagents when available; fall back to sequential execution otherwise
- Keep main context clean — offload scanning when subagents exist
- Respect the depth level — skip reports not in scope
- Use absolute paths when referencing target project files
- Redact any found secrets with `***REDACTED***`
