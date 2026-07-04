---
name: analyze-project
description: Performs deep multi-report analysis of a software project. Use when the user wants project analysis, codebase audit, architecture review, or reports under docs/analysis/.
---

Analyze a software project and write structured reports under `docs/analysis/`.

## Usage

`/analyze-project [project_path] [depth]`

- `project_path`: defaults to the current directory.
- `depth`: `quick`, `standard`, or `deep`; default is `standard`.

## Depth

- `quick`: project structure, dependencies, build/deploy, git history, and `SUMMARY.md`.
- `standard`: all quick reports plus architecture, data flow, process analysis, API surface, and data model.
- `deep`: all standard reports plus security review and quality report.

## Workflow

1. Resolve `project_path` to an absolute path and create `docs/analysis/` if needed.
2. Detect the tech stack from manifest and lock files.
3. Read `references/analyze-project-workflow.md` before running `standard` or `deep`, or before using subagents.
4. For each selected report, read the matching prompt from `prompts/` and template from `templates/`.
5. Replace prompt placeholders before execution: `{{PROJECT_PATH}}`, `{{SKILL_PATH}}`, and `{{TECH_STACK}}`.
6. Prefer one subagent per report when subagents are available; otherwise run the same prompts sequentially.
7. Synthesize `docs/analysis/SUMMARY.md` from the generated reports.
8. Tell the user how many reports were created, the output path, and the top three findings.

## Resources

- `references/analyze-project-workflow.md` - full phase map, report filenames, stack detection, and prompt substitution rules.
- `prompts/` - one prompt per report.
- `templates/` - output structure for each report, including `SUMMARY.md`.

## Safety

- Do not modify source code in the target project.
- Do not run destructive commands, execute the project, or commit changes.
- Keep reports under `docs/analysis/`.
- Redact secrets as `***REDACTED***`.
