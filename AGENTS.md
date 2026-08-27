# Project Agent Rules

## Rule Changes

- After modifying any **skill package** under `skills/` or `.agents/skills/`, load the built-in `skill-quality` Skill and run `node skills/meta/skill-quality/scripts/check.js <skill-dir>` from the workspace root for every changed package before claiming completion. Use `--all --workspace .` only for broad Skill changes. Quality failures block completion; review and disclose any accepted warning that affects confidence.
- After modifying **non-skill rules** (AGENTS.md, CLAUDE.md, SOPs under `~/.csl-agent-kit/sops/` or `skills/meta/agent-sops/sops/`, hooks), `skill-quality` does not apply. Verify instead by: (1) structural consistency with existing files of the same kind, and (2) for SOPs — matching the YAML header fields and section template of peer SOPs. Run `adversarial-review` or request human review only when the user explicitly asks for that review; high risk alone does not trigger it.

## Task Files

- Store each task in `tasks/tasks/<task-slug>.md` and add its title, current status, and relative link at the top of the newest-first `tasks/tasks.md` index.
- Update only the owning task file and its exact index entry; do not rewrite unrelated task records. Add new lessons at the top of `tasks/lessons.md`.
