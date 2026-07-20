# Internet Research: Popular Agents and Skills

## Plan

- [x] Research popular coding agents, agent frameworks, and skill/plugin ecosystems from current public internet sources.
- [x] Compare repeated capability patterns across those agents.
- [x] Write a Chinese report under `docs/analysis/` with source links and recommendations.
- [x] Verify the report file, links/source coverage, and workspace diff.

## Review

- Created `docs/analysis/popular-agents-and-skills-report.md`.
- Compared popular coding agents and agent frameworks using GitHub metadata collected on 2026-06-25.
- Identified high-frequency skill categories: repo understanding, file/shell/test loop, test triage, dependency docs, browser UI verification, code/security review, GitHub workflow, MCP/connectors, release gates, and handoff/SOP.
- Recommended highest-impact coding power additions: `test-triage`, `repo-map`, `dependency-docs`, `browser-ui-verify`, `security-review`, and release-gate SOPs.

Verification performed:

- Read the generated report.
- `rg -n 'https://|test-triage|repo-map|dependency-docs|browser-ui-verify|security-review|release-gate' docs/analysis/popular-agents-and-skills-report.md`
- `git diff --check`
- `git status --short --branch --untracked-files=all`
