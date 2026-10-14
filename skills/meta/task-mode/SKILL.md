---
name: task-mode
description: Query or change persistent Task confirmation mode at session, project, or global scope. Use for task-mode, SOLO mode, disabling repeated Task confirmations, restoring confirm mode, or inspecting the effective mode and source. Do not use to execute the underlying task, bypass host permissions, or disable quality review.
---

# Task Mode

Manage the existing shared confirmation preference, not a second settings store. Codex can discover this Skill as `$task-mode`; Pi also retains its direct `/task-mode` settings command and `/skill:task-mode` entry.

## Authority and commands

Resolve paths from this Skill directory, not the user's working directory. Read [Confirmation Modes](../csl-tasks/shared/protocols/task-target-alignment.md) before applying mode semantics. Use the bundled [CLI](../csl-tasks/shared/scripts/task-mode.js); run it with `node` and an absolute path.

```text
node <cli> show --workspace <actual-workspace> [--host <actual-host> --session <actual-session-id>]
node <cli> set <session|project|global> <confirm|solo|inherit> --workspace <actual-workspace> [--host <actual-host> --session <actual-session-id>]
```

Scope order is session > project > global > default `confirm`. `inherit` removes only the selected override; it may expose a lower SOLO value. Explicit `confirm` overrides lower SOLO. The public name is **SOLO**, canonical value `solo`; existing stored `autonomous` values resolve to `solo` without rewriting files. New writes use `solo`. Storage stays under `CSL_AGENT_KIT_HOME` or the default user data directory, with project/session identity isolation; never create a repository-local authorization file.

## Procedure

1. With no arguments, `show`, or an inspection request, query without writing. Accept `project solo`, `session confirm`, `global inherit`, and equivalent explicit natural-language requests. If a write request lacks a scope or value, ask one focused question; do not assume global scope.
2. Establish the actual workspace and host. Use only authoritative current-session identity supplied by the host, a documented host session environment field, or its current session metadata. Use the same host key as its Hook (`pi`, `codex`, or `claude-code`). Do not search unrelated transcripts, use another session's ID, invent an ID, or substitute a task ID. If session identity is unavailable, refuse session writes and label queries without it as **project/global only**, not the current session's effective mode. Project/global writes can still save the explicitly requested layer.
3. Follow the active Task lifecycle/alignment policy for file-changing configuration work; this Skill cannot waive a required checkpoint. Once the requested change is authorized and aligned, run `set` only for that scope/value. Do not change modes to escape a hold in another task. A generic request to run a task is not authorization to change this preference.
4. After a successful write, run `show` again with the same workspace and known host/session identity. Distinguish successful storage from resolution failure; preserve diagnostics and never overwrite malformed JSON or silently fall back to another data directory. No-argument inspection never changes settings.
5. Report the saved scope/value, resolved mode/source, workspace and data-root identity, and whether resolution included the current session. Explain any higher-priority override. Report runtime activation separately: with complete actual identity, this explicit fresh read supplies the shared protocol's current configuration for subsequent in-scope work when governing instructions permit it. Without identity, do not claim session activation; direct the user to the host's settings entry or a resume/start with the updated Hook. Pi rereads per agent turn; native Codex/Claude Hooks reread at SessionStart. Older installed plugins may lack this Skill or protocol; source changes alone do not update installed copies. Never claim a plugin update, restart, or activation that was not observed.

## Boundaries

SOLO bypasses the entire L0-L4 Task second-confirmation grading path, displays the complete Task Target, and drives toward the requested final result. Decide in-scope operational choices from evidence and bounded defaults; do not repeatedly ask what to do next. Skip framework/SOP confirmation-only pauses, including external publication, X posts/replies and batch safety confirmation: announce action/object/consequence and continue. A generic SOP requirement to ask is not an explicit user pause. Keep substantive safeguards, the user's actual pause instructions, scope, host approvals, higher-priority safety rules, required review and verification. Missing facts/permissions that cannot be established are real blockers, not permission to invent or expand the request. Querying or changing mode alone never resumes a stopped batch or executes unrelated work.

Routing examples are in [evals/trigger_cases.json](evals/trigger_cases.json); SOLO/confirm boundary scenarios are in [evals/confirmation_cases.json](evals/confirmation_cases.json). These fixtures are not proof of an executed model replay. Skill discovery, saved configuration, runtime injection and observed Agent behavior are separate verification boundaries.
