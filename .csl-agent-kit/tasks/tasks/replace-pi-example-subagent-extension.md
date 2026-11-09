---
created: 2026-07-26
task: replace-pi-example-subagent-extension
---

# Replace Pi example subagent extension with pi-subagents

Status: Completed (2026-07-26 18:14)

## Scope

- Remove only the user-level extension and agent-definition symlinks that resolve to Pi's bundled `examples/extensions/subagent/` source.
- Preserve `~/.pi/agent/agents/pi-agent.md` and all unrelated Pi packages/extensions.
- Install only the user-level npm package `pi-subagents`; do not install `@tintinweb/pi-subagents` or migrate custom agent definitions.

## Target

- [x] T1: The old example extension and its four Claude-model user-agent symlinks are absent, while unrelated user agents remain intact.
- [x] T2: User-level `npm:pi-subagents` is installed and reported by `pi list`.
- [x] T3: The installed package exposes its declared extension resources without stale example `subagent` files remaining in the user extension directory.

## Result

- T1: Removed exactly six symlinks resolving to Pi's `examples/extensions/subagent/`: two extension entry links and four Claude-model agent links. `~/.pi/agent/extensions/subagent/` is absent; `~/.pi/agent/agents/pi-agent.md` remains unchanged.
- T2: `pi install npm:pi-subagents` completed successfully. `pi list` reports `npm:pi-subagents` at `~/.pi/agent/npm/node_modules/pi-subagents`.
- T3: Installed manifest is `pi-subagents@0.37.0` with `pi.extensions: ["./index.ts"]`, bundled `skills` and `prompts`; an isolated `pi --mode json -p --no-session` smoke test called `subagent({ action: "list" })` successfully and returned the package builtins plus preserved `pi-agent`. A fresh Pi process also launched `pi-agent`, returned `PONG` in 22 seconds with exit code 0, and made no file changes.

Review gate: Required — user-level extension installation changes global Pi agent behavior and executes third-party code in every applicable Pi session.

- Review: APPROVED（用户授权 `ISOLATION: simulated` fallback）— [审查报告](../artifacts/replace-pi-example-subagent-extension/reports/adversarial-review.md)
