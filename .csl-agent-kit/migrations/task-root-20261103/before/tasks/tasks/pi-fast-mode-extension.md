# Pi Fast Mode Extension

## Plan

- [x] Move Pi-specific extension code into a dedicated `pi/` folder.
- [x] Add a Pi extension for OpenAI Codex Fast Mode with `/fast on|off|toggle|status` and `--fast` support.
- [x] Update the Pi package manifest and README so Pi loads extensions from the dedicated folder.
- [x] Verify JSON validity, extension loading, installer syntax, and package dry-run.
- [x] Review changed files and unresolved risks.

## Review

- Created `pi/extensions/` as the dedicated Pi-specific component folder.
- Moved the CSL skill alias extension to `pi/extensions/csl-skill-commands.ts`.
- Added `pi/extensions/openai-codex-fast.ts` with `--fast` and `/fast on|off|toggle|status`.
- Updated Fast Mode to persist in `~/.pi/agent/csl/openai-codex-fast.json` so new Pi sessions reuse the configured value.
- Updated Fast Mode status to render in the TUI footer's right side as `model • thinking • fast` when enabled, with a non-TUI fallback through Pi's footer status API.
- Updated `package.json` to load Pi extensions from `./pi/extensions`.
- Updated `README.md` with Pi-specific layout and Fast Mode usage.
- Verification performed:
  - `node -e "JSON.parse(...)"` for `package.json`
  - `bash -n scripts/install.sh`
  - `npm pack --dry-run --json`
  - Jiti-loaded both Pi extensions and simulated persistent config, custom footer rendering, and Fast Mode injection.
  - `git diff --check` for changed Pi package files.
  - `npm pack --dry-run --json` after the persistent footer update.
- Unresolved risk: Fast Mode effectiveness still depends on `openai-codex` provider authentication and account entitlement; the extension only injects `service_tier: "priority"` for eligible models.
