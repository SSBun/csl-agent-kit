---
name: triggerify
description: Create, inspect, update, enable, disable, delete, and audit persistent event-driven Triggerify rules that inject prompts or run scripts at supported hook timings. Use when users want reusable changed-file or command matching, runtime guards, hook-like automation, or trigger inventory and management for Codex, Claude Code, or Pi.
---

# Triggerify

Manage triggers through the bundled CLI. Treat the CLI as the source of accepted syntax, validation, and runtime behavior.

## Boundaries

- Target Codex first. Treat Claude Code and Pi as secondary hosts unless the CLI reports verified support.
- Use global rules when runtime execution is required.
- Treat project rules as metadata-only until trusted project runtime loading is implemented.
- Use Triggerify for persistent event-driven automation. Use a direct command for one-time work and native Git hooks for repository-owned Git enforcement.
- Do not use project RFCs as runtime or rule-format guidance.

## Command

Run commands from this skill directory:

```bash
node scripts/triggerify.js --help
node scripts/triggerify.js <command> --help
```

Read command help before constructing an unfamiliar operation. Do not guess flags or hand-edit managed rule files.

## Core Workflow

1. Identify the event timing, action, scope, and condition.
2. Choose a qualified ID such as `global:<name>` or `project:<name>`.
3. Inspect existing rules before creating a new ID.
4. For `run-script`, create the script inside the permitted Triggerify scripts directory with a valid shebang and executable permission.
5. Use the CLI to create or change the rule.
6. Confirm the mutation succeeded, then run `show <qualified-id>` to inspect the stored rule and all reported statuses.
7. Report the qualified ID, configured state, support or trust limitations, and effective state.
8. Never describe a rule as active when the CLI reports it as disabled, unsupported, metadata-only, untrusted, invalid, conflicting, or otherwise ineffective.

## Construct Conditions

Use the smallest condition that expresses the requirement.

- Use `all` for conjunction and `some` for collection matching.
- Use `eq`, `in`, `glob`, or `regex` only with their documented operand shapes.
- Use JSON Pointer paths exactly; do not invent field names.
- Treat condition evaluation as three-valued: `true`, `false`, or `unknown`.
- Trigger only on `true`. Missing or unavailable event data must not become a match.
- Do not rely on implicit type conversion.
- Prefer changed-file and command conditions for the initial supported workflows.
- Move complex policy into a reviewed script instead of building an unreadable matcher tree.

For verified Codex event mappings and capability evidence, read [references/codex-protocol.json](references/codex-protocol.json).

## Create

1. Run `list` and confirm the qualified ID is unused.
2. Run `create --help`, then create the rule through the CLI.
3. Treat a successful CLI result as evidence that the candidate passed the runtime validator before it was written.
4. Run `show <qualified-id>` to confirm the stored rule, configured state, diagnostics, and effective status.
5. If the rule references a script, report script readiness separately from rule validity.

Do not bypass a validation failure by writing YAML directly.

## List

Run `list` to inventory rules. Preserve scope in every displayed ID.

Use the returned diagnostics to identify invalid or conflicting rules. Do not treat inventory presence as proof that a rule is active.

## Show

Run `show <qualified-id>` to inspect one exact rule.

Use `show` before update or delete. Do not fall back to a same-named rule in another scope.

## Update

1. Run `show <qualified-id>`.
2. Run `update --help` and update only the requested fields through the CLI.
3. Preserve the existing enabled state unless the user explicitly requests a state change.
4. Run `show <qualified-id>` again and inspect diagnostics and effective status.

Do not rename a qualified ID through update. Create the new ID, confirm it, then delete the old ID.

## Enable and Disable

Use the qualified ID.

- Treat enable and disable as configured-state changes, not proof of host activation.
- After enable, report any host, trust, resource, or metadata-only limitation.
- After disable, confirm the configured state is disabled.
- Do not claim success from `enabled: true` alone; distinguish configured state from effective state.

## Delete

1. Run `show <qualified-id>` and confirm the exact target.
2. Delete only through the CLI.
3. Preserve referenced scripts and shared resources by default.
4. Remove a script only when the user separately requests it and ownership is unambiguous.

## Audit

For an explicit audit:

1. Run `list`.
2. Run `show` for each relevant rule or every rule carrying diagnostics.
3. Report invalid rules, duplicate IDs, missing or unsafe scripts, unsupported host mappings, trust limitations, configured state, and effective state separately.
4. Do not execute rule actions as part of validation.

## Safety Rules

- Use qualified IDs for every mutation.
- Fail closed on invalid rules, duplicate IDs, unsafe paths, unsupported actions, or unresolved runtime requirements.
- Keep script paths inside the permitted Triggerify directory.
- Do not execute validation-time scripts to prove business behavior.
- Do not delete scripts as a side effect of deleting rules.
- Do not infer host support from similarly named hooks.
- Do not claim project rules run while project scope remains metadata-only.

## Completion Reporting

Include:

- The operation performed.
- The qualified rule ID.
- The configured state.
- Validation or diagnostics reported by the CLI.
- Script readiness when applicable.
- Host support and project-scope limitations.
- Whether the rule is effective, ineffective, or cannot be proven effective.

A completed mutation means the requested configuration was safely written. It does not by itself prove runtime activation.
