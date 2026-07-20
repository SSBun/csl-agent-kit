# SSBun SOP Storage

## Plan

- [x] Move user SOP storage into the SSBun-owned local folder: `~/.ssbun-skills/sops`.
- [x] Update SOP lookup, create, learn, see, release, hook, and script path references.
- [x] Record the naming correction for short preferences as tips, not rules.
- [x] Test the updated skill, script, hook command, and path searches.

## Review

- Updated `sop-manager` create/list/learn/see guidance to use `~/.ssbun-skills/sops`.
- Updated `sop-summaries.sh`, `release`, and `release-orchestrator` to resolve user SOPs from the new folder.
- Updated hooks to prefer `~/.ssbun-skills/skills/sop-manager/scripts/sop-summaries.sh`, with existing fallback paths preserved.
- Updated `scripts/install.sh` so Codex installs also create `~/.ssbun-skills/skills/{name}` symlinks.
- Documented user-created SOP storage in `README.md`.
- Removed the invalid `argument-hint` frontmatter key from `skills/release/SKILL.md` after validation exposed it.
- Recorded the tips naming correction in `tasks/lessons.md`.

Verification performed:

- `bash -n skills/sop-manager/scripts/sop-summaries.sh scripts/install.sh`
- `jq . hooks/hooks.json`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/release`
- Temporary `HOME` test with `~/.ssbun-skills/sops/release-orchestrator.md`
- Executed the `SessionStart` hook command from `hooks/hooks.json`
- No-residual search for legacy user SOP path
- `git diff --check`
