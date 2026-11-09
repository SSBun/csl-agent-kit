# Figma Describe Hook

## Plan

- [x] Add a Codex `SessionStart` lifecycle hook for CSL SOP routing.
- [x] Add a Codex `PostToolUse` lifecycle hook for Figma/MasterGo design-fetch MCP tools.
- [x] Document `hooks/` in the repository layout.
- [x] Verify hook JSON, matcher coverage, and workspace status.

## Review

Added `hooks/hooks.json` with a `SessionStart` hook that injects the SOP routing prompt when the plugin loads in a Codex session.

Added `hooks/hooks.json` with a `PostToolUse` hook for Figma/MasterGo design-fetch MCP tools. The hook prints a mandatory reminder to use `figma-describe` before implementation, summary, or UI translation.

Updated `README.md` to document `hooks/` as bundled Codex lifecycle hooks.

Verification performed:

- `jq . hooks/hooks.json`
- Executed the `SessionStart` and `PostToolUse` hook commands extracted from `hooks/hooks.json`
- Tested matcher coverage against representative Figma and MasterGo MCP tool names
- Checked SOP and Figma routing references with `rg`
- Checked workspace status
