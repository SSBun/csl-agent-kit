# Yao Meta Skill Audit Fixes

## Plan

- [x] Mark Yao metadata gaps as release-only gates instead of normal platform blockers.
- [x] Remove unsupported `argument-hint` frontmatter and preserve usage hints in skill bodies.
- [x] Reduce over-budget `SKILL.md` entrypoints by moving detail into references.
- [x] Remove duplicated `beautiful-mermaid` install instructions.
- [x] Regenerate audit artifacts and verify OpenAI/Yao checks.

## Review

- Added `skill_atlas/policy.json` so Yao interface/governance metadata gaps are tracked as release-only gates for this OpenAI/Codex-first skill collection.
- Removed all unsupported `argument-hint` frontmatter keys and kept usage hints in skill bodies.
- Reduced over-budget entrypoints by moving detailed workflow/format material into `references/` for `analyze-project`, `repo-map`, `same-page`, `figma-describe`, and `handoff-save`.
- Removed the duplicated global install block from `beautiful-mermaid`; also removed duplicate setup install text from `venom-cli`.
- Refreshed Yao Skill Atlas artifacts under `docs/analysis/yao-meta-skill-audit/` and updated the audit report with post-fix status.

Verification performed:

- `rg -n "^argument-hint:" skills/*/SKILL.md`
- Per-skill OpenAI `quick_validate.py`
- Per-skill Yao `resource_boundary_check.py`
- Yao `skill-atlas` regeneration with `--today 2026-07-03`
- Yao `validate` summary confirmed only `Missing agents/interface.yaml`, now release-only
