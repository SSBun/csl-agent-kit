---
name: agent-hooks
description: Create, inspect, update, enable, disable, delete, and audit persistent Agent Hooks rules that inject prompts or run scripts at supported hook timings. Use for cross-session user directives, reusable changed-file or command matching, runtime guards, hook-like automation, or trigger inventory and management for Codex, Claude Code, or Pi. A bare preference without an explicit request for future-session persistence does not trigger this skill.
---

# Agent Hooks

Use the bundled CLI as the validation and status authority.

Run `node scripts/agent-hooks.js <command> --help` before unfamiliar operations. Never hand-edit managed rules or use project RFCs as runtime guidance.

Validate proposed rule files with `node scripts/validate-rules.js [--scope global|project] <file.md>...` before passing them to `update --from`. Treat this as frontmatter and V1 rule validation; use `show` for stored script readiness and effective host status.

## Boundaries

- Use global hook rules for runtime execution; project hook rules remain metadata-only. Global rules and scripts live under `$CSL_AGENT_KIT_HOME/hooks/` (default `~/.csl-agent-kit/hooks/`); project rules and scripts live under `<workspace>/.agents/hooks/`.
- Inner scope (`inner:*`) ships hooks with the agent-hooks skill (e.g. `inner:agent-rules` and `inner:csl-agent-kit-contract`). Hook source is read-only: do not create, update, or delete it through the CLI. All inner hooks default enabled; `enable`/`disable` persists user choices in `$CSL_AGENT_KIT_HOME/hooks/config.json` (default `~/.csl-agent-kit/hooks/config.json`). Optional `hookSettings` are keyed by qualified inner ID; runtime passes only the matching object to that script as JSON in `AGENT_HOOKS_HOOK_CONFIG`. `inner:csl-agent-kit-contract` injects the stable behavioral contract from `references/csl-agent-kit-contract.md`; `inner:agent-rules` merges the built-in, user, and project `agent-rules.md` files in that order, and disabling that hook suppresses all three rule sources.
- Codex is the reference host; each event supports only the actions in its capability table. Claude Code retains the shared event surface. `interrupt` and `session-end` are Codex-only, nonblocking script events, registered through the Codex manifest's supplemental lifecycle file with a three-second native timeout. Pi/Claude Code adapters are unchanged.
- Pi runs triggers inside the `csl-context-hooks` extension via `pi.on(...)`. Inject works where a handler can rewrite model-facing content (session-start systemPrompt, prompt-submit, after-tool tool_result); script runs as a best-effort side effect on all supported events. A `run-script` rule with `inject-output: true` additionally surfaces the script stdout as an injected prompt on inject-capable events. Block and permission/subagent events are not physically realizable on Pi and remain unsupported.
- Use Agent Hooks for persistent automation, direct commands for one-time work, and native Git hooks for Git enforcement.

## Workflow

1. Identify timing, action, scope, description, and the smallest condition.
2. Run `list`; use `show` before changing an existing rule. For inner hooks, inspect Default, Override, Configured, and Effective before toggling.
3. Keep `run-script` executables with valid shebangs inside the permitted directory.
4. Run the CLI mutation, then `show <qualified-id>` and inspect configured, validation, trust, support, effective, and reasons.
5. Report the ID, diagnostics, script readiness, host limits, and effective state.

## Bundled iTermate Integration

`inner:itermate-codex-*` rules reuse the existing dispatcher for session start, prompt submission, tool observations, stop, interrupt, and session end. They run only for Codex and require iTermate's explicit `codex-agent-hooks.json` opt-in marker beside its installed `iTermate-status.py` reporter. The adapter forwards the native payload unchanged; it does not infer status, inject model context, install scripts, or edit user rules. Disabling the integration in iTermate removes the marker. These inner rules may also be disabled with the normal CLI.

Update the CSL Agent Kit Codex plugin and review its hooks before enabling this provider in iTermate. The app migrates only its own legacy native entries on explicit enable; unrelated hooks remain, although removal can change their group indices and require review. A CLI `effective: active` result proves rule eligibility, not plugin trust, app opt-in, socket availability, or observed delivery. Do not mark the integration operational without checking those separately.

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
