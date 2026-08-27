# Move agent rules into the super-agent directory

**Status:** Completed (2026-07-23 14:36)

## Scope

- Include the canonical agent rules, workspace lifecycle injection, every active runtime/package consumer, and forced relinking behavior.
- Include authoritative default installation: replace existing instruction symlinks and back up regular files without requiring `--force`.
- Exclude running the real installer or changing the user's current global links; the user will perform that reset.

## Target

- [x] T1: The canonical default rules and workspace lifecycle dispatcher live under `super-agent/`, with the obsolete root `references/` directory removed when empty.
- [x] T2: Installer, hooks, package contents, documentation, tests, and durable workspace context consistently use the new paths and default-authoritative behavior.
- [x] T3: Installing the `super-agent` target replaces existing instruction symlinks and backs up regular files by default, while dry-run remains non-mutating.
- [x] T4: Focused CLI, rule-contract, package, and path-staleness checks pass without changing the user's installed global links.

## Plan

1. Move the two production rule assets into the new top-level ownership directory.
2. Make the super-agent install target authoritative by default and update its focused regression coverage.
3. Verify runtime paths, package contents, and dry-run behavior, then complete independent review.

## Result

- T1: Moved the canonical rule source to `super-agent/AGENTS.md` and the injected dispatcher to `super-agent/workspace-workflow-gates.md`; the empty `references/` directory was removed.
- T2: Installer, hooks, npm whitelist, README, `.gitignore`, rule tests, and durable workspace context now describe the new paths and authoritative default behavior. The compatibility wrapper already forwards all options to the Node CLI.
- T3: `installSuperAgent` reuses the existing link routine with `force: true`. The regression test proves default dry-run leaves an unrelated symlink and regular file unchanged, while default real installation relinks the symlink and backs up the regular file before replacement.
- T4: CLI tests passed 26/26, the two moved-rule contract tests passed, the real-HOME wrapper dry-run planned four default relinks without changing installed links, and package, syntax, JSON, tree, and `git diff --check` checks passed. local quality gate trigger evaluation remains 37/37 from the unchanged rule content. Full `npm test` remains red only in the two pre-existing task-suite contracts recorded earlier.
- Review: `APPROVED` after three cumulative passes; report: [move-agent-rules-to-super-agent](../../reports/adversarial-review/move-agent-rules-to-super-agent.md)
