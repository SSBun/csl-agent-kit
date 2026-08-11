# Remove Super Agent Interface Folder

## Plan

- [x] Confirm the folder contents and search for runtime, packaging, and documentation references.
- [x] Remove `skills/super-agent/agents/` without changing the skill workflow or bundled AGENTS source.
- [x] Run package tests, diff checks, and the required `yao-meta-skill` audit.

## Review

- Removed the unreferenced `skills/super-agent/agents/openai.yaml` and its now-empty directory.
- Kept `skills/super-agent/SKILL.md` and `skills/super-agent/references/AGENTS.md` unchanged.
- Verified no runtime, package, or documentation references remain.
- `npm run check` passed: 6 CLI, 8 tips, and 4 Pi tests, plus install dry-run.
- Package dry-run contains the skill and bundled AGENTS reference but no super-agent `agents/` path.
- `git diff --check` passed.
- Required Yao audit ran; lint, governance, and resource checks passed. Its aggregate validator reports `Missing agents/interface.yaml`, which is expected after intentionally removing the one-off interface directory and is not a runtime/package requirement in this repository.
