---
allowed-tools: Read, Write, Edit, Bash
argument-hint: [doc-type] | --implementation | --api | --architecture | --sync | --validate
description: Systematically update project documentation with implementation status, API changes, and synchronized content across specs and agent context files.
---

# Documentation Update & Synchronization

Update project documentation to reflect current implementation. Parse optional flags from the user's message: `--implementation`, `--api`, `--architecture`, `--sync`, `--validate`, or a `doc-type` focus area.

## Agent Context Files

Check and update the project's primary agent context file (use whichever exists):

| File | Typical platform |
|------|------------------|
| `AGENTS.md` | Codex, cross-platform |
| `CLAUDE.md` | Claude Code |
| `CONTEXT.md` | Project-specific convention |
| `.cursor/rules/` | Cursor rules |

Also review `README.md` for user-facing status and usage.

## Task

### 1. Discover Documentation

```bash
find . -name "*.md" -not -path "./node_modules/*" -not -path "./.git/*" | head -30
```

Look for common locations:

- `docs/` — guides, architecture, API docs
- `specs/` — specifications and implementation plans
- `docs/plans/` — design documents
- `docs/analysis/` — project analysis reports
- `CHANGELOG.md` / `HISTORY.md`

### 2. Assess Current State

- Scan for status markers (✅ ❌ ⚠️) in docs
- Review recent doc commits: `git log --oneline --since="2 weeks ago" -- "*.md" | head -10`
- Cross-check specs against actual code — mark stale sections

### 3. Update Documentation

Apply updates based on user focus (default: full sync):

1. **Implementation status** — Mark completed items, update completion percentages, add lessons learned
2. **API / architecture docs** — Reflect current endpoints, modules, and data models
3. **Agent context** — Add new conventions, commands, pitfalls, and project map to `AGENTS.md` / `CLAUDE.md` / `CONTEXT.md`
4. **README** — Update setup, usage, and project status
5. **Testing docs** — Document test commands, coverage approach, and new test files

### 4. Formatting

- Consistent headings and status indicators
- Code examples where helpful
- Cross-reference related sections
- Do not create new spec files unless the user explicitly asks

## Guidelines

- UPDATE existing files; prefer editing over creating duplicates
- Document best practices discovered during recent work
- Ensure docs match actual implementation — no aspirational features marked done
- Redact secrets and credentials

## Completion Summary

Report:

1. Files updated
2. Major changes
3. Updated completion percentages (if applicable)
4. New best practices captured
5. Remaining doc gaps
