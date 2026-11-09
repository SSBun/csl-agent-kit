# SOP Routing Index

## Plan

- [x] Create a lightweight built-in SOP index under `skills/sop-manager/sops/`.
- [x] Add a plugin `SessionStart` hook that points procedural work to the index.
- [x] Update `sop-manager` lookup guidance to read the built-in index before individual built-in SOPs.
- [x] Verify index references and workspace status.

## Review

Created a lightweight frontmatter summary router for built-in SOPs.

Added SOP routing to `hooks/hooks.json` as a `SessionStart` hook:

- Do not read SOP files by default.
- For procedural work only, consult SOP summaries from frontmatter.
- Do not read unrelated SOP files.

Updated `skills/sop-manager/SKILL.md` so built-in SOP lookup reads the index first.

Verification performed:

- Read `hooks/hooks.json`.
- Read SOP frontmatter summaries.
- Checked index references with `rg`.
- Verified referenced SOP files exist.
- Checked `git status --short --untracked-files=all`.
