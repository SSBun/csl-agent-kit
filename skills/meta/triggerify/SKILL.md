---
name: triggerify
description: Create, inspect, update, enable, disable, delete, and audit persistent Triggerify rules that inject prompts or run scripts at supported hook timings. Use for cross-session user directives, reusable changed-file or command matching, runtime guards, hook-like automation, or trigger inventory and management for Codex, Claude Code, or Pi. A bare preference without an explicit request for future-session persistence does not trigger this skill.
---

# Triggerify

Use the bundled CLI as the validation and status authority.

Run `node scripts/triggerify.js <command> --help` before unfamiliar operations. Never hand-edit managed rules or use project RFCs as runtime guidance.

Validate proposed rule files with `node scripts/validate-rules.js [--scope global|project] <file.md>...` before passing them to `update --from`. Treat this as frontmatter and V1 rule validation; use `show` for stored script readiness and effective host status.

## Boundaries

- Use global rules for runtime execution; project rules remain metadata-only.
- Inner scope (`inner:*`) ships hooks with the triggerify skill (e.g. `inner:agent-rules` and `inner:workspace-workflow-gates`). Hook source is read-only: do not create, update, or delete it through the CLI. All inner hooks default enabled; `enable`/`disable` persists user choices in `$CSL_AGENT_KIT_HOME/triggerify/config.json` (default `~/.csl-agent-kit/triggerify/config.json`). Optional `hookSettings` are keyed by qualified inner ID; runtime passes only the matching object to that script as JSON in `TRIGGERIFY_HOOK_CONFIG`.
- Codex is the reference host: all events support inject/script (and block where the protocol allows). Claude Code shares Codex's hook protocol and is now supported at parity.
- Pi runs triggers inside the `csl-context-hooks` extension via `pi.on(...)`. Inject works where a handler can rewrite model-facing content (session-start systemPrompt, prompt-submit, after-tool tool_result); script runs as a best-effort side effect on all supported events. A `run-script` rule with `inject-output: true` additionally surfaces the script stdout as an injected prompt on inject-capable events. Block and permission/subagent events are not physically realizable on Pi and remain unsupported.
- Use Triggerify for persistent automation, direct commands for one-time work, and native Git hooks for Git enforcement.

## Workflow

1. Identify timing, action, scope, description, and the smallest condition.
2. Run `list`; use `show` before changing an existing rule. For inner hooks, inspect Default, Override, Configured, and Effective before toggling.
3. Keep `run-script` executables with valid shebangs inside the permitted directory.
4. Run the CLI mutation, then `show <qualified-id>` and inspect configured, validation, trust, support, effective, and reasons.
5. Report the ID, diagnostics, script readiness, host limits, and effective state.

## Persistent Directives

For explicit future-session persistence, use one global `session-start` / `inject-prompt` rule per atomic directive.

1. Exclude ordinary preferences and other carriers unless persistence is explicit.
2. Reject secrets, sensitive data, permission bypasses, hierarchy overrides, and project/security conflicts.
3. State in the body that the directive applies unless higher-priority instructions or the user's more specific current request conflict.
4. Show the exact `global:directive-<subject>` ID and body; wait for confirmation before create or update.
5. Inspect Codex, Claude Code, and Pi with `show --host`; change the exact rule instead of duplicating it.

## Conditions

- Use `all`, `some`, exact JSON Pointers, and documented operators. Trigger only on `true`; missing data is `unknown`.
- Prefer simple changed-file or command conditions; move complex policy into a reviewed script.
- Read `references/codex-protocol.json` only for Codex payload details.

## Safety and Operations

- Create only unused IDs. Successful storage does not prove host activation.
- Treat an invalid inner config as fail-closed for inner hooks; repair it before calling any inner hook active.
- Update only requested fields; preserve enabled state. Rename by create, verify, delete.
- Enable/disable changes configured state only. Preserve scripts on rule deletion unless separately requested.
- Audit with `list` and `show`; report diagnostics, support, trust, and state without executing actions.

Fail closed on invalid, conflicting, unsafe, unsupported, or unresolved rules. Never call an ineffective rule active.

Routing evals are in `evals/`.
