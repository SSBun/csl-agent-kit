# Remove Release Orchestrator SOP

## Plan

- [x] Delete the built-in `release-orchestrator` SOP shell.
- [x] Update `skills/release/SKILL.md` to route directly to concrete existing release SOPs.
- [x] Verify SOP summaries no longer list `release-orchestrator`.
- [x] Validate affected skills and audit with `yao-meta-skill`.
- [x] Record changed files and unresolved risks.

## Review

- Deleted `skills/sop-manager/sops/release-orchestrator.md`.
- Updated `skills/release/SKILL.md` so it no longer loads an orchestrator SOP.
- Release now:
  - checks workspace status directly.
  - discovers concrete release SOPs from built-in and user SOP directories.
  - ignores `project-version-update` as a publish SOP because it is version-prep only.
  - stops when no concrete matching release SOP exists.
  - requires explicit confirmation before tag, push, publish, upload, notarize, or remote release actions.

Verification performed:

- `rg -n "release-orchestrator|xcode-macos-dmg-release|python-pypi-release|cargo-crates-release" skills README.md hooks commands -S`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/release`
- `python3 /Users/caishilin/.codex/skills/.system/skill-creator/scripts/quick_validate.py skills/sop-manager`
- `bash skills/sop-manager/scripts/sop-summaries.sh`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/release`
- `python3 /Users/caishilin/.codex/skills/yao-meta-skill/scripts/yao.py validate skills/sop-manager`
- `git diff --check -- skills/release/SKILL.md skills/sop-manager/sops/release-orchestrator.md tasks/todo.md`

Unresolved risk:

- Yao validation still reports the pre-existing `Missing agents/interface.yaml` issue for `skills/release` and `skills/sop-manager`; lint, governance check, and resource boundary check passed.
