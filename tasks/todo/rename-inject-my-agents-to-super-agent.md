# Rename Inject My Agents To Super Agent

## Plan

- [x] Rename `skills/inject-may-agents` to `skills/super-agent` and rename bundled `references/AGENTS.template.md` to `references/AGENTS.md`.
- [x] Rewrite the skill behavior so `super-agent` asks which agent config file to replace, backs up the old file, then symlinks the bundled default instructions.
- [x] Update skill metadata, README, plugin manifests, marketplace keywords, and Pi slash-command aliases from `inject-may-agents` to `super-agent`.
- [x] Run validation, stale-reference grep, package checks, and `yao-meta-skill` audit.
- [x] Record review evidence and unresolved risks.

## Review

Implemented `super-agent` as a replacement for `inject-may-agents`:

- Renamed `skills/inject-may-agents/` to `skills/super-agent/`.
- Renamed the bundled default instruction file from `references/AGENTS.template.md` to `references/AGENTS.md`.
- Rewrote `skills/super-agent/SKILL.md` so the skill:
  - asks which agent config file should be replaced;
  - treats `references/AGENTS.md` as the source of truth;
  - handles special target names such as Claude Code `CLAUDE.md` by asking instead of guessing;
  - shows source, target, backup path, and command plan before changing files;
  - backs up the old target as `{target}.backup-YYYYMMDD-HHMMSS`;
  - creates a symlink and verifies `readlink`.
- Updated `skills/super-agent/agents/openai.yaml` with the new display name and default prompt.
- Updated README and plugin/marketplace manifests from `inject-may-agents` to `super-agent`.
- Pi slash aliases are covered by the dynamic skill discovery in `pi/extensions/csl-skill-commands.ts`, so no hard-coded Pi entry needed changing.
- Updated `.gitignore` so `skills/super-agent/references/AGENTS.md` is visible even when a global gitignore ignores `AGENTS.md` files.

Verification performed:

- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/super-agent`
- YAML parse for `skills/super-agent/agents/openai.yaml`
- `jq . package.json .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json >/dev/null`
- `bash -n scripts/install.sh`
- `npm pack --dry-run --json >/dev/null`
- Active-surface stale reference check: `rg -n "inject-may-agents|Inject My Agents|AGENTS\\.template|My agent-principles|My Agents|inject-may" README.md package.json .claude-plugin .cursor-plugin .codex-plugin .agents pi skills scripts tasks/lessons.md`
- Positive reference check for `super-agent`, `Super Agent`, and `references/AGENTS.md`.
- `git diff --check -- README.md .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json skills/super-agent skills/inject-may-agents pi/extensions/csl-skill-commands.ts .gitignore tasks/todo.md`
- `git status --short --untracked-files=all -- skills/super-agent skills/inject-may-agents .gitignore`

Yao audit:

- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/super-agent`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `super-agent`; lint, governance, and resource-boundary checks passed.
- Historical generated analysis docs still mention `inject-may-agents`; active docs, manifests, and skill files now use `super-agent`.
