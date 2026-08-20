# Subagent Dispatch

Real isolation strengthens adversarial roles. Dispatch the Reviewer/Editor (or Synthesizer/Challenger) as genuine subagents when the host can run them in an independent process or context window; otherwise fall back to inline role-play and disclose the weaker isolation. The loop contract, state machine, finding ledger, and report format are identical in both modes — only the execution boundary differs.

## Capability Detection

Before the first role pass, detect whether the host can dispatch an isolated subagent. Check in this order and stop at the first hit:

1. A `subagent` tool is available (Pi with the subagent extension) and a carrier agent is registered for it to spawn by name.
2. The host is Codex and can spawn an agent process by passing a prompt (no pre-registered role file needed).
3. A `tmux` session is available and a non-interactive `pi`/`codex` invocation can run in a separate pane.
4. None of the above — inline fallback.

Both Pi and Codex dispatch roles by inlining the role contract into the prompt — neither requires per-role files registered on the host. The difference is only what the host needs to accept the spawn call:

- Pi: the `subagent` tool requires a registered agent **name** to spawn. The carrier `pi-agent` (installed by `csl-agent-kit install --target pi` into `~/.pi/agent/agents/`) satisfies this; the role contract is inlined into the task. Confirm `pi-agent` is discoverable before choosing `SUBAGENT`.
- Codex: spawning takes a prompt directly, so there is no per-role file to register. Confirm the host can actually start an agent process; a host that accepts the call but runs no agent will idle on `Waiting for agents` / `No agents completed yet`. Do not poll — if no agent is running, stop and re-resolve dispatch.
- tmux: a `tmux` session exists and a non-interactive `pi`/`codex` invocation starts without error in a test pane.

If the host's spawn path cannot be confirmed ready (e.g. `pi-agent` not registered on Pi, or Codex cannot start an agent), downgrade the whole run to `INLINE-FALLBACK`. Do not enter the loop in `SUBAGENT` mode on an unverified dispatch path.

Record the chosen mode and per-role readiness once per run (this is what the disclosure table in the next section prints):

Never claim `isolated` under inline fallback. Under `INLINE-FALLBACK`, set `ISOLATION: simulated` and proceed with the role-separation rules below.

## Role → Subagent Mapping

Each adversarial role is defined by a **role contract file** under the skill's `examples/agents/`. These are not registered as host agents — the Coordinator reads the file and inlines its full text into the task/prompt when spawning a carrier subagent each pass. Because Pi subagents are disposable processes (and Codex spawns roles via prompt the same way), role identity is carried by the contract in the prompt, not by a long-lived agent process.

Role contract files intentionally omit a `model` field. On Pi, the carrier's effective model may come from agent configuration or overrides rather than `PI_MODEL`; on Codex, the launcher may choose a model per role. Resolve the concrete model at dispatch time as described below. Their `tools` frontmatter is **not parsed** by the carrier spawn path (only the registered carrier's frontmatter is read; the role contract is inlined into the task verbatim), so it has no runtime effect. Read-only constraints are therefore enforced by the role contract text, not the tool layer — and because the `pi-agent` carrier registers no `tools` restriction, every role subprocess has the full toolset available and abstains from mutation only by obeying its contract. This is a prompt-level guarantee, not a tool-layer sandbox; do not treat read-only roles as sandboxed.

| Skill | Role | Carrier (Pi) | Role contract file (inlined into task/prompt) | Constraint carried into the role contract |
|-------|------|--------------|----------------------------------------------|-------------------------------------------|
| adversarial-review | Reviewer | `pi-agent` | `adversarial-review/examples/agents/adversarial-reviewer.md` | Read-only; never edits the artifact; never self-approves |
| adversarial-review | Editor | `pi-agent` | `adversarial-review/examples/agents/adversarial-editor.md` | Never Reviewer; never self-approves; answers every finding in one batch |
| deliberate | Synthesizer | `pi-agent` | `deliberate/examples/agents/adversarial-synthesizer.md` | Produces the complete answer; never challenges |
| deliberate | Challenger | `pi-agent` | `deliberate/examples/agents/adversarial-challenger.md` | Independent of Synthesizer; reports every visible issue in one batch |

The Coordinator runs in the parent context in both modes: it pins scope, routes exchanges, validates findings, and maintains the ledger. It never becomes the Reviewer/Challenger.

## Dispatch by Host

### Pi (subagent tool)

Pi subagents are **disposable processes**: each `subagent` call spawns a fresh `pi` child process that dies when the pass ends — there is no persistent conversation or cross-call memory. Role identity and accumulated state are therefore carried by the Coordinator via the task prompt, not by process reuse.

The `subagent` tool requires a registered agent name to spawn, but that agent is only a **carrier** — its system prompt is just a neutral shell. The real role definition lives in the skill's `examples/agents/<role>.md` and is inlined into the task prompt by the Coordinator each pass. One carrier agent (`pi-agent`, installed by `csl-agent-kit install --target pi`) serves all roles; you never register per-role agents.

Each pass: read the role's `examples/agents/<role>.md`, concatenate it with the full state packet, and pass it as the `task` to a `pi-agent` subagent. Chain a full round so the prior pass output flows to the next role via `{previous}`:

```text
subagent tool, chain:
  1. agent: pi-agent, task: "<reviewer.md role contract>\n\nSTATE PACKET:\n<full state>\n\nYOUR TASK THIS PASS:\n<initial review instruction>"
  2. agent: pi-agent, task: "<editor.md role contract>\n\nAnswer every finding from the previous pass.\n\n{previous}"
  3. agent: pi-agent, task: "<reviewer.md role contract>\n\nRe-review accounting for every prior ID.\n\n{previous}"
```

- Before disclosure, inspect the effective `pi-agent` configuration with `subagent({ action: "get", agent: "pi-agent" })`. Report its concrete model when available; otherwise report `unknown`. Never infer the child model from `PI_MODEL` alone because agent configuration or overrides may differ. Tools are unrestricted; enforce read-only roles (Reviewer/Synthesizer/Challenger) via the role contract in the task, not at the tool layer.
- Send the complete state packet + role contract in each task; `{previous}` is the only cross-process channel, so every handoff must be self-contained. Because processes are disposable, the state packet must include the full prior-round ledger (every D-ID/R-ID) — the new process has no memory of earlier passes.
- `Ctrl+C` aborts propagate to the subagent process; a killed subagent is treated as a stall under the loop contract, not an approval.

### Codex (subagent via prompt)

Codex spawns subagents by passing a role definition as the prompt to a fresh agent process — same inline-role model as Pi, no pre-registered role files. The parent thread acts as Coordinator, feeding the complete role contract + state packet as the prompt each pass. There is no fixed `agents/` folder requirement; roles are defined in the prompt, not in files the host must discover.

- Scout-style passes (reviewer/challenger) may use a cheaper model tier; solver passes (editor/synthesizer) use the default.
- The Editor role may need write access scoped to the artifact; pass that scope in the prompt.
- Do not poll for completion — use the host's notification mechanism. A parent that polls `Waiting for agents` in a loop is a bug, not progress; if no agent is actually running, stop and re-resolve dispatch.
- Roles and accumulated state are carried by the prompt each pass, mirroring Pi's disposable-process model.

### tmux (external isolation)

When no native dispatch tool exists but `tmux` + non-interactive agent CLI is available, run each role in its own pane for full observability:

```text
tmux split-window  "pi -p '<role prompt with full state>'"
# capture output:  tmux capture-pane -p -t <pane>
```

- Each pane is an independent process = one role pass.
- The parent (Coordinator) sends the complete state as the pane's prompt and captures the pane output as the role's response.
- This mode is `isolated` but manual: the Coordinator must feed each round's output into the next pane's prompt itself.

### Inline Fallback

When no isolation capability is available, run all roles in the current context under strict role-separation rules:

- Re-issue the role's system-prompt constraints at the start of each pass.
- Exclude the Editor's reasoning from the first Reviewer prompt; exclude the Synthesizer's draft from the Challenger's first pass where the contract requires independence.
- Rely on the state packet, ledger IDs, and output contracts to enforce separation, since the model is literally talking to itself.
- Set `ISOLATION: simulated` and disclose this to the user before the loop starts.

## Disclosure

State the dispatch metadata to the user **once, before entering the adversarial loop**, and again whenever it changes mid-run. This is the single point where the user sees what will be discussed and how the roles will execute; emitting it only after the loop has started (or letting the host's `Waiting for agents` spinner speak first) hides a material execution fact. Print it as the first thing after Step 0 resolves, before any role pass, as a table:

```text
| Dispatch metadata |                                                                |
|-------------------|----------------------------------------------------------------|
| Topic             | <the question/problem this run deliberates or reviews>         |
| Host              | <Pi | Codex | tmux | unknown>                                |
| Dispatch mode     | <SUBAGENT (<host>) | INLINE-FALLBACK>                         |
| Isolation         | <isolated | simulated>                                          |
| Roles             | <role> (<model>, <ready|missing>) ...                          |
```

`Topic` is the user's original question/problem for this run (one line; refine inside the loop, not in this banner). `Roles` lists every adversarial role this skill needs with the model that role will actually run on and the readiness you verified in Capability Detection:

- **Model:** report the concrete model the role will actually run on. On Pi, resolve it from the effective carrier configuration with `subagent({ action: "get", agent: "pi-agent" })`; do not infer it from `PI_MODEL`. On Codex, use the launcher's effective per-role model when available. If the concrete id cannot be determined before the first role pass, report `unknown` rather than an inheritance source or an invented provider-specific name.
- **Readiness:** on Pi, `ready` means the carrier agent (`pi-agent`) is registered and spawnable; `missing` means it is not (run `csl-agent-kit install --target pi`, or fall back). On Codex, `ready` means the host can spawn an agent process by prompt; `missing` means it cannot. A host that accepts the spawn call but runs no agent will idle on `Waiting for agents` — report that as `missing`, not `ready`.

Example, deliberate on Pi after `csl-agent-kit install --target pi`:

```text
| Dispatch metadata |                                                                    |
|-------------------|--------------------------------------------------------------------|
| Topic             | Should we ship the new cache layer before or after the API split? |
| Host              | Pi                                                                 |
| Dispatch mode     | SUBAGENT (Pi)                                                     |
| Isolation         | isolated                                                          |
| Roles             | synthesizer (glm-5.2, ready), challenger (glm-5.2, ready)         |
```

### Enter the loop or ask

- **All roles `ready`:** enter `SUBAGENT` mode immediately. Do not ask the user; isolation is the stronger default.
- **Any role `missing`:** do not enter the loop. Present the table above and ask the user a single yes/no question whether to proceed in `INLINE-FALLBACK` (roles run inline with `ISOLATION: simulated`). Only enter `INLINE-FALLBACK` after explicit user confirmation; if the user declines, stop and wait for them to resolve the dispatch path (on Pi: run `csl-agent-kit install --target pi` to register the `pi-agent` carrier).

Never auto-downgrade silently, and never enter the loop on an unverified dispatch path. Entering the loop with an unregistered role agent is exactly the state that produces the empty `Waiting for agents` cycle.

A `simulated` Reviewer/Challenger is weaker evidence than an isolated one. Do not treat inline convergence as stronger than it is: a `SUFFICIENT`/`APPROVED` reached under `simulated` isolation must be reported with that caveat, and the loop must not silently upgrade `simulated` to `isolated` between rounds.

## Unchanged Contracts

Dispatch changes only the execution boundary. The following are identical in `SUBAGENT` and `INLINE-FALLBACK` modes:

- Review Loop Contract, Finding Validity Gate, Review States, Round Completeness.
- Deliberate state packet, D-ID/T-ID ledger, `CONTINUE`/`SUFFICIENT`/`NEEDS_USER`/`BLOCKED` rules.
- Shared Principles, Review Lenses, Decision Consensus Gate.
- Resource Handoff, Final Review Report Contract.

A subagent that cannot fulfill its role contract (e.g., a Reviewer that tries to edit) is rejected by the Coordinator exactly as an invalid inline pass would be.
