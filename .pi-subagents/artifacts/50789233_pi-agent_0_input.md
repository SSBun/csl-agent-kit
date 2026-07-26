# Task for pi-agent

You are the Reviewer in an adversarial-review loop. You are read-only and must not edit files or settings.

Review topic: Replace the globally enabled Pi example subagent extension with npm package `pi-subagents`.

User intent:
- Remove the old Pi official example subagent system.
- Install only user-level `npm:pi-subagents`.
- Do not install `@tintinweb/pi-subagents`.
- Preserve unrelated Pi agents/packages, especially `~/.pi/agent/agents/pi-agent.md`.

Pinned artifact and observable evidence:
- Before: `~/.pi/agent/extensions/subagent/index.ts` and `agents.ts` were symlinks into `@earendil-works/pi-coding-agent/examples/extensions/subagent/`; `~/.pi/agent/agents/{planner,reviewer,scout,worker}.md` were symlinks to that same example's hard-coded Claude role files.
- Applied: only those exact six links were removed after their targets were checked; the now-empty `~/.pi/agent/extensions/subagent/` directory was removed.
- Preserved: `~/.pi/agent/agents/pi-agent.md` remains a symlink to `/Users/caishilin/Desktop/personal/skills/references/agents/pi-agent.md`.
- Installed: `pi install npm:pi-subagents` completed successfully. `pi list` reports `npm:pi-subagents` at `~/.pi/agent/npm/node_modules/pi-subagents`.
- Installed manifest: `pi-subagents@0.37.0`; Pi resources are `extensions: ["./index.ts"]`, `skills: ["./skills"]`, and `prompts: ["./prompts"]`.
- Fresh-process smoke test: `pi --mode json -p --no-session` successfully called `subagent({ action: "list" })` and returned `advisor`, `context-builder`, `delegate`, `oracle`, `pi-agent`, `planner`, `researcher`, `reviewer`, `scout`, `worker`.
- No current `~/.pi/agent/extensions/subagent/` directory or the four old role links exists.
- Local Pi version is 0.82.1; the package declares `@earendil-works/pi-ai >=0.80.0`.
- `npm audit` in the shared Pi package store reports four moderate findings, all transitive from pre-existing `pi-mcp-adapter@2.15.0` → `@modelcontextprotocol/sdk` / `@hono/node-server`; `pi-subagents` has only `jiti`, `typebox`, and `yaml` direct runtime dependencies.

Criteria:
1. No stale old example extension or its four hard-coded Claude user-agent links remain.
2. The requested package is globally registered and can load its `subagent` tool in a fresh Pi process.
3. Unrelated `pi-agent.md` and packages were not removed.
4. Surface material safety/configuration risks with evidence; do not invent issues.

Use exactly this format:
ROUND: INITIAL (1)
STATUS: CONTINUE | APPROVED
For each finding: R<n> [BLOCKER|QUESTION|NOTE], Violated criterion, Evidence, Risk, Required outcome, Suggested remedy.
Then RESOLVED and UNRESOLVED.

## Acceptance Contract
Acceptance level: attested
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Return concrete findings with file paths and severity when applicable

Required evidence: review-findings, residual-risks

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```