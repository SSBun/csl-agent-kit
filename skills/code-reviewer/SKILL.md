---
name: code-reviewer
description: Reviews pull requests and code changes for bugs, security, clarity, and maintainability. Use when the user asks for a code review, or when reviewing PRs/MRs, merge requests, or diffs.
---

# Code Reviewer

Structured review for pull requests and local diffs. Read `references/` for checklists and standards — do not run generated demo automation scripts.

## PR / MR Preparation

Detect the host from `git remote -v` or ask the user.

### GitHub

```bash
gh pr checkout <number>
gh pr view <number>
gh pr diff <number>
```

### GitLab

```bash
glab mr checkout <id>
glab mr view <id> | cat
glab mr diff <id> | cat
```

### No CLI / generic

Use `git diff <base>...<head>` or the diff the user provides. Read the PR/MR description from the host UI if CLI is unavailable.

Skip preparation for trivial one-file changes when the diff is already in context.

## Review Process

Walk through in order. Skip steps that do not apply.

1. **Business goal** — Understand why the change exists before nitpicking style.
2. **Placement** — Is code in the right module? Are existing utilities reused?
3. **Correctness** — Logic bugs, edge cases, security issues. Check related unchanged code that should have been updated.
4. **Clarity** — Names, structure, readability a year from now.
5. **KISS** — Unnecessary complexity, dead code, oversized functions.
6. **Single responsibility** — One job per unit; reasonable file/class size.
7. **Tests** — Complex logic needs tests; do not demand tests for trivial glue.

## Output Format

Summarize in the user's language. Group findings by severity:

- **Critical** — Must fix before merge (bugs, security, data loss)
- **Suggestion** — Worth improving (design, clarity, missing tests)
- **Nit** — Optional polish

Each finding: location (`file:line`), problem, suggested fix.

## Reference Documentation

Read as needed — do not load all upfront:

- `references/code_review_checklist.md` — review checklist
- `references/coding_standards.md` — style and workflow standards
- `references/common_antipatterns.md` — patterns to flag

## Rules

- Review the actual diff, not assumptions about intent.
- Prefer specific citations over vague feedback.
- Do not claim automated scan results unless you ran real linters/tests and report their output.
- Flag secrets, credentials, and unsafe defaults explicitly.
