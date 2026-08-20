# Project Agent Rules

## Rule Changes

- After modifying a **skill package** (anything under `skills/*/` with a `SKILL.md`), invoke `yao-meta-skill` to audit it before claiming the work is complete: `python3 ~/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/<name>` (plus `resource_boundary_check.py` per skill dir). yao-meta-skill only validates skill packages, not rule files.
- After modifying **non-skill rules** (AGENTS.md, CLAUDE.md, SOPs under `~/.csl-agent-kit/sops/` or `skills/meta/sop-manager/sops/`, hooks), yao-meta-skill does not apply. Verify instead by: (1) structural consistency with existing files of the same kind, and (2) for SOPs — matching the YAML header fields and section template of peer SOPs. Run `adversarial-review` or request human review only when the user explicitly asks for that review; high risk alone does not trigger it.

## Task Files

- Store each task in `tasks/tasks/<task-slug>.md` and add its title, current status, and relative link at the top of the newest-first `tasks/tasks.md` index.
- Update only the owning task file and its exact index entry; do not rewrite unrelated task records. Add new lessons at the top of `tasks/lessons.md`.
