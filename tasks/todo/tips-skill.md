# Tips Skill

## Plan

- [x] Create the `tips` skill with minimal add/list/edit guidance.
- [x] Store user tips under `~/.ssbun-skills/tips/tips.md`.
- [x] Add scripts to append tips and inject tips into session context.
- [x] Add hooks for session start/new/resume/clear/compact and post-compact injection.
- [x] Update install/docs and verify scripts, hooks, and skill metadata.

## Review

- Added `skills/tips/SKILL.md` and `skills/tips/agents/openai.yaml`.
- Added `skills/tips/scripts/tips-add.sh` to append one short tip to `~/.ssbun-skills/tips/tips.md`.
- Added `skills/tips/scripts/tips-inject.sh` to inject stored tips into session context.
- Updated `hooks/hooks.json` so tips inject before SOP summaries on `SessionStart` (`startup|resume|clear|compact|new`) and before SOP reload on `PostCompact`.
- Updated README and plugin manifests to include `tips`.

Verification performed:

- `bash -n skills/tips/scripts/tips-add.sh skills/tips/scripts/tips-inject.sh scripts/install.sh`
- `jq .` for hook and plugin JSON files
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/tips`
- Temporary `HOME` test for `tips-add.sh` and `tips-inject.sh`
- Temporary `HOME` tests for `SessionStart` and `PostCompact` tips hook commands
- Hook order check: tips runs before SOP summary/reload
- `git diff --check`
