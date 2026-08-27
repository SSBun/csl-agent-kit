# Remove Legacy Compatibility From CSL Agent Kit Rename

## Plan

- [x] Remove `~/.ssbun-skills/` runtime fallback and migration code; use only `~/.csl-agent-kit/`.
- [x] Remove legacy `SSBUN_TIPS_DIR` / `SSBUN_TIPS_FILE` environment-variable fallbacks.
- [x] Rename plugin namespace/id surfaces from `CSL` to the short canonical `csl`, including README command examples and installer hints.
- [x] Update active docs and skill references for `/csl:<skill>` instead of `/CSL:<skill>`.
- [x] Run JSON, syntax, package, grep, and smoke-test verification; record results.

## Review

Removed the compatibility layer as requested:

- Removed `~/.ssbun-skills/` fallback and migration logic from active runtime scripts.
- Removed `SSBUN_TIPS_DIR` and `SSBUN_TIPS_FILE` fallbacks; scripts now use `CSL_AGENT_KIT_*` variables or `~/.csl-agent-kit/` defaults.
- Changed plugin IDs / namespaces to canonical short `csl` in Claude, Cursor, Codex, and `.agents` marketplace metadata.
- Updated README command examples from `/CSL:<skill>` to `/csl:<skill>` and install examples from `CSL@...` to `csl@...`.
- Updated `skills/figma-describe/SKILL.md` to reference `/csl:figma-describe`.
- Updated `tasks/lessons.md` with the rule that renames should not preserve legacy compatibility when the user says compatibility is not needed.

Verification performed:

- `bash -n scripts/install.sh skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh skills/tips/scripts/tips-doctor.sh skills/sop-manager/scripts/sop-summaries.sh`
- `node --check skills/sop-manager/scripts/sop-candidates.js`
- `jq . package.json .claude-plugin/plugin.json .cursor-plugin/plugin.json .codex-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json hooks/hooks.json .codex-plugin/hooks/hooks.json >/dev/null`
- `cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `skills/tips/scripts/tips-inject.sh`
- `skills/tips/scripts/tips-doctor.sh`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `test ! -e "$HOME/.ssbun-skills" && test -d "$HOME/.csl-agent-kit"`
- `npm pack --dry-run --json >/dev/null`
- Active-surface stale compatibility grep: `rg -n "/CSL:|CSL@|csl@CSL|~/.cursor/plugins/local/CSL|\\.ssbun-skills|~/.ssbun-skills|SSBUN_TIPS|SSBUN|ssbun-skills|Renamed ~/.ssbun|legacy" README.md scripts hooks .codex-plugin/hooks skills .claude-plugin .cursor-plugin .codex-plugin .agents tasks/lessons.md`
- `git diff --check -- README.md scripts/install.sh skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh skills/tips/scripts/tips-doctor.sh skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/scripts/sop-candidates.js skills/figma-describe/SKILL.md .claude-plugin/plugin.json .cursor-plugin/plugin.json .claude-plugin/marketplace.json .cursor-plugin/marketplace.json .agents/plugins/marketplace.json tasks/lessons.md tasks/todo.md`

local quality gate audit:

- `quick_validate.py` passed for `skills/tips`, `skills/sop-manager`, and `skills/figma-describe`.
- `check.js` still reports the pre-existing `Missing agents/interface.yaml` issue for those skills; lint, governance, and resource-boundary checks passed. `sop-manager` still has the existing heavy `SKILL.md` warning.
