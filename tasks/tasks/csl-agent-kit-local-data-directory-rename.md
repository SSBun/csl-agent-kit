# CSL Agent Kit Local Data Directory Rename

## Plan

- [x] Update active docs and skill instructions from `~/.ssbun-skills/` to `~/.csl-agent-kit/`.
- [x] Update SOP and tips scripts to read/write the new local data directory, with safe legacy environment-variable fallback where useful.
- [x] Update hooks/status messages and release routing references to the new directory name.
- [x] Safely migrate existing local user data from `~/.ssbun-skills/` to `~/.csl-agent-kit/` without overwriting files.
- [x] Run syntax, JSON, grep, and smoke-test verification; record review evidence.

## Review

Renamed the CSL Agent Kit local user data directory:

- Active docs now use `~/.csl-agent-kit/`:
  - `README.md`
  - `skills/sop-manager/SKILL.md`
  - `skills/tips/SKILL.md`
  - `skills/release/SKILL.md`
- Runtime scripts now default to the new directory:
  - SOPs: `~/.csl-agent-kit/sops/`
  - Tips: `~/.csl-agent-kit/tips/tips.md`
- Legacy compatibility remains only in code paths that safely read/migrate old data:
  - `~/.ssbun-skills/` is treated as a legacy fallback for existing installs.
  - `SSBUN_TIPS_DIR` / `SSBUN_TIPS_FILE` are still accepted as legacy environment overrides.
- Hooks now show `CSL Agent Kit tips` instead of `SSBun tips`.
- Existing local user data was renamed on this machine from `/Users/caishilin/.ssbun-skills` to `/Users/caishilin/.csl-agent-kit`.

Verification performed:

- `bash -n scripts/install.sh skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh skills/tips/scripts/tips-doctor.sh skills/sop-manager/scripts/sop-summaries.sh`
- `node --check skills/sop-manager/scripts/sop-candidates.js`
- `jq . hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `cmp -s hooks/hooks.json .codex-plugin/hooks/hooks.json`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/release`
- `skills/tips/scripts/tips-inject.sh`
- `skills/tips/scripts/tips-doctor.sh`
- `skills/sop-manager/scripts/sop-summaries.sh`
- `test -d "$HOME/.csl-agent-kit/sops" && test -s "$HOME/.csl-agent-kit/tips/tips.md" && test ! -e "$HOME/.ssbun-skills"`
- `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"`
- `npm pack --dry-run --json`
- Active-doc stale path check: `rg -n "~/.ssbun-skills|\\.ssbun-skills|ssbun-skills|SSBun tips|Loading SSBun|Reloading SSBun" README.md hooks .codex-plugin/hooks skills/release skills/sop-manager/SKILL.md skills/tips/SKILL.md`
- `git diff --check -- README.md hooks/hooks.json .codex-plugin/hooks/hooks.json scripts/install.sh skills/tips/SKILL.md skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh skills/tips/scripts/tips-doctor.sh skills/sop-manager/SKILL.md skills/sop-manager/scripts/sop-summaries.sh skills/sop-manager/scripts/sop-candidates.js skills/release/SKILL.md tasks/lessons.md tasks/todo.md`

Yao audit:

- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/tips`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/release`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `tips`, `sop-manager`, and `release`; lint, governance, and resource boundary checks passed. `sop-manager` still has the existing heavy `SKILL.md` warning.
- Historical task logs and generated analysis reports may still mention `~/.ssbun-skills/` as historical context; active docs and runtime paths now use `~/.csl-agent-kit/`.
