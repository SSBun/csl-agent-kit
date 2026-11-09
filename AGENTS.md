# Project Agent Rules

## Rule Changes

- After modifying any **skill package** under `skills/` or `.agents/skills/`, load the built-in `skill-quality` Skill and run `node skills/meta/skill-quality/scripts/check.js <skill-dir>` from the workspace root for every changed package before claiming completion. Use `--all --workspace .` only for broad Skill changes. Quality failures block completion; review and disclose any accepted warning that affects confidence.
- After modifying **non-skill rules** (AGENTS.md, CLAUDE.md, SOPs under `~/.csl-agent-kit/sops/` or `skills/meta/agent-sops/sops/`, hooks), `skill-quality` does not apply. Verify instead by: (1) structural consistency with existing files of the same kind, and (2) for SOPs — matching the YAML header fields and section template of peer SOPs. Run `adversarial-review` or request human review only when the user explicitly asks for that review; high risk alone does not trigger it.

## Task Files

- Follow `docs/storage.md`: the target layout stores each task in `.csl-agent-kit/tasks/tasks/<task-slug>.md` and its title, status and relative link in `.csl-agent-kit/tasks/tasks.md`.
- This is a specification-first transition: until the actual task runtime supports the new root and an explicit `agent-migration` completes cutover, keep this workspace's existing `tasks/` records under the current CLI. Never dual-write or manually relocate active tasks to satisfy the target layout.
- Update only the owning task file and its exact index entry; do not rewrite unrelated task records. Reusable knowledge follows `agent-memory`; do not recreate legacy Context/Lessons stores.
