# Add Triggerify hook to open todo files in Typora

**Status:** Completed (2026-07-23 11:53)

## Target

- [x] T1 — A Triggerify rule fires on file-tool events (apply_patch / Write / Edit) so it triggers when a todo md is created or edited.
- [x] T2 — When a path under `tasks/todo/*.md` is touched, the script opens that file in Typora; non-todo file events do nothing.
- [x] T3 — A real Codex file-tool event, not a manually dispatched payload, causes Typora to open the matching todo file.

## Plan

1. Capture whether this Codex host invokes `PostToolUse` for file-tool calls.
2. Localize the missing link between the host hook and Triggerify dispatch.
3. Apply the smallest fix and verify with a real task file creation.

## Result

- T1 — `global:open-todo-in-typora` is enabled, valid, supported, and active. The host hook initially did not run because `csl-agent-kit@csl-agent-market:hooks/hooks.json:post_tool_use:1:0` had no trusted hash; reviewing and trusting that exact dispatcher through the Codex `/hooks` UI added the persisted trust entry.
- T2 — `open-todo-in-typora.js --self-test` passed cases for a valid path containing spaces, an unrelated patch body mentioning a todo path, `../` traversal, and symlink escape. The script parses only canonical `apply_patch` target headers, resolves real paths, and requires an existing regular `.md` below the real `tasks/todo` root.
- T3 — A fresh Codex CLI session created `tasks/todo/zz-trigger-safe-test.md` via real `apply_patch` and reported every `PostToolUse` hook completed; Computer Use observed Typora's active URL as that exact file. The temporary test file and tabs were removed afterward.
- Review — `APPROVED` after three Reviewer passes; [Adversarial review report](../artifacts/add-triggerify-typora-todo-hook/reports/adversarial-review.md)
