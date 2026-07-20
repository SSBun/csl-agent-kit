# Install Script Output And Local Data Boundary

## Plan

- [x] Stop creating `~/.ssbun-skills/skills` mirrors; keep `~/.ssbun-skills` for user data only.
- [x] Link Codex skills directly from `~/.agents/skills/{name}` to this repository's `skills/{name}`.
- [x] Remove hook lookups for `~/.ssbun-skills/skills/...`.
- [x] Make install output show unchanged links in default color, new links in green, updated links in yellow.
- [x] Verify install behavior with a temporary HOME and fake Codex path.

## Review

- Updated `scripts/install.sh` so Codex skill symlinks point directly from `~/.agents/skills/{name}` to `/Users/caishilin/Desktop/personal/skills/skills/{name}`.
- Removed creation of `~/.ssbun-skills/skills/{name}` mirrors.
- Added cleanup for obsolete symlinks under `~/.ssbun-skills/skills`; only symlinks are removed.
- Changed installer output to status lines:
  - `unchanged` in default terminal color.
  - `new` in green when stdout supports color.
  - `updated` in yellow when stdout supports color.
- Removed `~/.ssbun-skills/skills/...` lookups from tips and SOP hooks.
- Updated the current machine: removed the old `~/.ssbun-skills/skills` symlink mirror and relinked real `~/.agents/skills/*` entries directly to this repository.
- Recorded the local-data boundary correction in `tasks/lessons.md`.

Verification performed:

- `bash -n scripts/install.sh`
- `jq . hooks/hooks.json`
- Temporary `HOME` install with Codex hidden from `PATH`: creates direct `~/.agents/skills` links and no `~/.ssbun-skills/skills`.
- Temporary `HOME` migration test: removes old mirror symlink and updates `.agents` link to direct repository path.
- Hook fallback tests for tips and SOP summary commands.
- Real HOME relink test with Codex hidden from `PATH`; second run reports `unchanged`.
- `git diff --check`
