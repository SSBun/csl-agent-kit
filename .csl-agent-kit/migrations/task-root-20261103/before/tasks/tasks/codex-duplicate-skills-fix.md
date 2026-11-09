# Codex Duplicate Skills Fix

## Plan

- [x] Explain duplicate skill source.
- [x] Change install output so unchanged links do not print an `unchanged` status.
- [x] Show only the Codex skill path in install output, not the repository target path.
- [x] Make Codex plugin hooks-only so skills load from `~/.agents/skills` instead of both plugin cache and symlinks.
- [x] Refresh current Codex plugin cache and verify duplicate plugin skills are gone.

## Review

- Root cause: Codex had both `/Users/caishilin/.agents/skills/sop-manager` and plugin cache `/Users/caishilin/.codex/plugins/cache/CSL/csl/1.7.1/skills/sop-manager`, so the same skill appeared twice.
- Updated `scripts/install.sh` output:
  - Unchanged links print as `Codex: ~/.agents/skills/{name}` in default color.
  - New links print as `new Codex: ~/.agents/skills/{name}` in green when color is available.
  - Updated links print as `updated Codex: ~/.agents/skills/{name}` in yellow when color is available.
  - Repository target paths are no longer printed for normal skill links.
- Added `.codex-plugin/hooks/hooks.json` so `.codex-plugin` is the actual hooks-only Codex plugin package.
- Removed `skills` export from `.codex-plugin/plugin.json`.
- Changed the Codex marketplace source to `./.codex-plugin`.
- Removed the old tracked `plugins/csl -> ..` symlink, which caused Codex to package the whole repository as the plugin.
- Updated `scripts/install.sh` to remove/re-add `csl@CSL`, preventing stale plugin caches from keeping a `skills/` directory.
- Refreshed current machine's `csl@CSL` plugin cache; it no longer contains `skills/`.
- Documented in `README.md` that Codex skills are linked through `~/.agents/skills` and the plugin is hooks-only.

Verification performed:

- `bash -n scripts/install.sh`
- `jq . .codex-plugin/plugin.json .codex-plugin/hooks/hooks.json hooks/hooks.json .agents/plugins/marketplace.json`
- Temporary `HOME` install output test: first run shows `new ...`, second run shows plain `Codex: ~/.agents/skills/{name}`.
- Real `./scripts/install.sh codex`
- Confirmed `/Users/caishilin/.codex/plugins/cache/CSL/csl/local/skills` does not exist.
- Confirmed `/Users/caishilin/.codex/plugins/cache/CSL/csl/local/hooks/hooks.json` exists.
- Confirmed `/Users/caishilin/.agents/skills/sop-manager` points to `/Users/caishilin/Desktop/personal/skills/skills/sop-manager`.
- `git diff --check`
