# Subagent Dispatch

Real isolation strengthens adversarial roles. Dispatch the Reviewer/Editor (or Synthesizer/Challenger) as genuine subagents when the host can run them in an independent process or context window; otherwise fall back to inline role-play and disclose the weaker isolation. The loop contract, state machine, finding ledger, and report format are identical in both modes — only the execution boundary differs.

## Capability Detection

Before the first role pass, detect whether the host can dispatch an isolated subagent. Check in this order and stop at the first hit:

1. A `subagent` tool is available (Pi with the subagent extension, or an equivalent delegation tool exposing `single`, `parallel`, or `chain` modes).
2. The host is Codex with `multi_agent` enabled and pre-defined agent files loadable from an `agents/` directory.
3. A `tmux` session is available and a non-interactive `pi`/`codex` invocation can run in a separate pane.
4. None of the above — inline fallback.

Detecting the capability is not enough — you must also confirm the role agents are actually registered and spawnable on this host before choosing `SUBAGENT`. A host that advertises `multi_agent` but has no loaded role agent will accept the dispatch call and then idle: the parent session prints `Waiting for agents` / `No agents completed yet` in a loop with no role pass ever running. To prevent that, verify readiness, do not merely assume it:

- Pi: the role agent file exists under `~/.pi/agent/agents/` (user scope) or `.pi/agents/` (project scope) and the `subagent` tool lists it as available.
- Codex: the role is loadable from the plugin `agents/` directory and `multi_agent` is actually enabled in the active config — not just advertised by the host. If you cannot confirm the agent is registered, treat dispatch as unavailable and fall back.
- tmux: a `tmux` session exists and a non-interactive `pi`/`codex` invocation starts without error in a test pane.

If any role agent cannot be confirmed ready, downgrade the whole run to `INLINE-FALLBACK` for that host. Do not enter the loop in `SUBAGENT` mode on an unverified dispatch path.

Record the chosen mode and per-role readiness once per run (this is what the disclosure table in the next section prints):

Never claim `isolated` under inline fallback. Under `INLINE-FALLBACK`, set `ISOLATION: simulated` and proceed with the role-separation rules below.

## Role → Subagent Mapping

Each adversarial role maps to one subagent. Reuse the same subagent identity across passes within a run; do not spawn a fresh process per round unless the role contract requires a replacement.

Example agent definitions live under each skill's `examples/agents/` and are ready to copy into the host's agent directory (Pi: `~/.pi/agent/agents/`; Codex: plugin `agents/`). They are inner-role templates — they restate the role contract from the skill's references so the subagent is self-contained. The example files intentionally omit a `model` field: model names are provider-specific (`sonnet` is meaningless on Codex; `gpt-*` is meaningless on Pi), so each host resolves the model from its own default or an override you set after copying the file in.

| Skill | Role | Subagent identity | Example file | Constraint carried into its system prompt |
|-------|------|-------------------|--------------|-------------------------------------------|
| adversarial-review | Reviewer | `adversarial-reviewer` | `adversarial-review/examples/agents/adversarial-reviewer.md` | Read-only; never edits the artifact; never self-approves |
| adversarial-review | Editor | `adversarial-editor` | `adversarial-review/examples/agents/adversarial-editor.md` | Never Reviewer; never self-approves; answers every finding in one batch |
| adversarial-deliberate | Synthesizer | `adversarial-synthesizer` | `adversarial-deliberate/examples/agents/adversarial-synthesizer.md` | Produces the complete answer; never challenges |
| adversarial-deliberate | Challenger | `adversarial-challenger` | `adversarial-deliberate/examples/agents/adversarial-challenger.md` | Independent of Synthesizer; reports every visible issue in one batch |

The Coordinator runs in the parent context in both modes: it pins scope, routes exchanges, validates findings, and maintains the ledger. It never becomes the Reviewer/Challenger.

## Dispatch by Host

### Pi (subagent tool)

Spawn each role as a `single` subagent task. Chain a full round as a `chain` so the prior pass output flows to the next role via `{previous}`:

```text
subagent tool, chain:
  1. agent: adversarial-reviewer, task: "<Reviewer pass prompt with full state>"
  2. agent: adversarial-editor,   task: "Answer every finding from the previous pass. {previous}"
  3. agent: adversarial-reviewer, task: "Re-review accounting for every prior ID. {previous}"
```

- Define each role once as an agent file under `~/.pi/agent/agents/` (user scope) or `.pi/agents/` (project scope, requires `agentScope: "both"` and trust).
- Send the complete state packet in each task; `{previous}` is the only cross-process channel, so every handoff must be self-contained.
- `Ctrl+C` aborts propagate to the subagent process; a killed subagent is treated as a stall under the loop contract, not an approval.

### Codex (multi_agent + plugin agents)

Pre-define each role as a plugin agent file under `<plugin>/agents/<role>.md` with YAML frontmatter (`name`, `description`, `tools`). Dispatch via the host's subagent spawn; the parent thread acts as Coordinator.

- Reviewer/Synthesizer/Challenger: `tools` read-only (`Read, Grep, Glob, Bash`); you may set a cheaper model tier for scout-style passes.
- Editor: `tools` include write access scoped to the artifact.
- `subagent_start` / `subagent_stop` hooks fire on each dispatch and may load matching SOP context.

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

- **Model:** read it from the registered agent file's `model` field. If the file has no `model` field (the shipped examples intentionally omit it), pass the current harness default model — the same model the main agent (Coordinator) is running on (Pi: `PI_MODEL`; Codex: the session default). Report that model name; do not invent a provider-specific one.
- **Readiness:** `ready` (registered and spawnable) or `missing` (not registered / cannot be confirmed). A host that advertises dispatch but has no loaded role agent will accept the call and then idle — `Waiting for agents` / `No agents completed yet` in a loop with no role pass ever running — so report the unverified agent as `missing`, not `ready`.

Example, adversarial-deliberate on a host where both example agents were copied in without a `model` field:

```text
| Dispatch metadata |                                                                    |
|-------------------|--------------------------------------------------------------------|
| Topic             | Should we ship the new cache layer before or after the API split? |
| Host              | Codex                                                              |
| Dispatch mode     | SUBAGENT (Codex)                                                   |
| Isolation         | isolated                                                           |
| Roles             | synthesizer (<harness default>, ready), challenger (<harness default>, ready) |
```

### Enter the loop or ask

- **All roles `ready`:** enter `SUBAGENT` mode immediately. Do not ask the user; isolation is the stronger default.
- **Any role `missing`:** do not enter the loop. Present the table above and ask the user a single yes/no question whether to proceed in `INLINE-FALLBACK` (roles run inline with `ISOLATION: simulated`). Only enter `INLINE-FALLBACK` after explicit user confirmation; if the user declines, stop and wait for them to register the missing agent(s) or resolve the dispatch path.

Never auto-downgrade silently, and never enter the loop on an unverified dispatch path. Entering the loop with an unregistered role agent is exactly the state that produces the empty `Waiting for agents` cycle.

A `simulated` Reviewer/Challenger is weaker evidence than an isolated one. Do not treat inline convergence as stronger than it is: a `SUFFICIENT`/`APPROVED` reached under `simulated` isolation must be reported with that caveat, and the loop must not silently upgrade `simulated` to `isolated` between rounds.

## Unchanged Contracts

Dispatch changes only the execution boundary. The following are identical in `SUBAGENT` and `INLINE-FALLBACK` modes:

- Review Loop Contract, Finding Validity Gate, Review States, Round Completeness.
- Deliberate state packet, D-ID/T-ID ledger, `CONTINUE`/`SUFFICIENT`/`NEEDS_USER`/`BLOCKED` rules.
- Shared Principles, Review Lenses, Decision Consensus Gate.
- Resource Handoff, Final Review Report Contract.

A subagent that cannot fulfill its role contract (e.g., a Reviewer that tries to edit) is rejected by the Coordinator exactly as an invalid inline pass would be.
