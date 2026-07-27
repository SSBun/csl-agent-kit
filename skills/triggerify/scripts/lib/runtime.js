"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");

const { evaluateCondition } = require("./rule.js");
const {
  canonicalWorkspace,
  compareUtf8,
  discover,
  isWithin,
  scopeRoot,
} = require("./store.js");

const CODEX_CAPABILITIES = {
  "session-start": { inject: true, script: true, block: false },
  "prompt-submit": { inject: true, script: true, block: true },
  "before-tool": { inject: true, script: true, block: true },
  "permission-request": { inject: false, script: true, block: true },
  "after-tool": { inject: true, script: true, block: false },
  "before-compact": { inject: false, script: true, block: true },
  "after-compact": { inject: false, script: true, block: false },
  "subagent-start": { inject: true, script: true, block: false },
  "subagent-stop": { inject: false, script: true, block: true },
  stop: { inject: false, script: true, block: true },
};
// Claude Code shares Codex's stdin/stdout hook protocol (hookSpecificOutput,
// exit 2 block, PermissionRequest deny, PreCompact continue:false), so every
// Codex event/action is also physically realizable on Claude Code.
const CLAUDE_CODE_CAPABILITIES = CODEX_CAPABILITIES;

// Pi has no native hook protocol; triggers run inside the csl-context-hooks
// extension via pi.on(event, handler). Inject only works where the handler can
// rewrite model-facing content (systemPrompt / tool_result). Block is not
// physically possible (Pi handlers cannot stop tool or agent execution).
// Permission/subagent events have no Pi equivalent.
const PI_CAPABILITIES = {
  "session-start": { inject: true, script: true, block: false },
  "prompt-submit": { inject: true, script: true, block: false },
  "before-tool": { inject: false, script: true, block: false },
  "after-tool": { inject: true, script: true, block: false },
  "before-compact": { inject: false, script: true, block: false },
  "after-compact": { inject: false, script: true, block: false },
  stop: { inject: false, script: true, block: false },
};

const HOST_CAPABILITIES = {
  codex: CODEX_CAPABILITIES,
  "claude-code": CLAUDE_CODE_CAPABILITIES,
  pi: PI_CAPABILITIES,
};
const DEFAULT_TIMEOUT = 10;
const MAX_OUTPUT = 64 * 1024;
const EVENT_BUDGET = 60 * 1000;

function createEvent({
  event,
  host,
  workspace,
  sessionId = null,
  prompt = null,
  tool = null,
  permission = null,
  compact = null,
  subagent = null,
  stop = null,
  changedFiles = null,
  nativeEvent = null,
  nativePayload = {},
}) {
  return {
    schema: "triggerify.event/v1",
    event,
    host: { name: host, version: null },
    workspace: { root: workspace, trusted: null },
    session: { id: sessionId },
    prompt,
    tool,
    permission,
    compact,
    subagent,
    stop,
    changed_files: changedFiles,
    native: { event: nativeEvent, payload: nativePayload },
  };
}

function ruleStatus(entry, host = "codex") {
  const rule = entry.rule;
  const capability = rule ? HOST_CAPABILITIES[host]?.[rule.event] : null;
  const supported = capability && (rule.action === "inject-prompt" ? capability.inject : capability.script);
  const trust = entry.scope === "global" || entry.scope === "inner" ? "not-applicable" : "unavailable";
  const validation = entry.valid === null ? "unavailable" : entry.valid ? "valid" : "invalid";
  const sourceConfigured = rule ? (rule.enabled ? "enabled" : "disabled") : "unavailable";
  const defaultState = entry.scope === "inner" ? sourceConfigured : "not-applicable";
  const override = entry.scope !== "inner"
    ? "not-applicable"
    : entry.innerConfigValid === false
      ? "invalid"
      : entry.innerDisabled
        ? "disabled"
        : "none";
  const configured = override === "invalid" ? "unavailable" : override === "disabled" ? "disabled" : sourceConfigured;
  const support = supported ? "supported" : "unsupported";
  const active = configured === "enabled" && validation === "valid" && trust !== "unavailable" && support === "supported";
  const reasons = entry.errors.map((error) => error.code);
  if (override === "invalid") reasons.push("inner-config-invalid");
  if (override === "disabled") reasons.push("inner-disabled-by-user");
  if (trust === "unavailable") reasons.push("workspace-trust-unavailable");
  if (support === "unsupported") reasons.push("capability-unsupported");
  return {
    id: entry.id,
    description: rule?.description ?? null,
    scope: entry.scope,
    lifecycle: entry.local ? "local" : "shared",
    event: rule?.event ?? null,
    action: rule?.action ?? null,
    script: rule?.script ?? null,
    path: entry.path,
    default: defaultState,
    override,
    configured,
    validation,
    trust,
    support,
    effective: active ? "active" : "inactive",
    reasons: [...new Set(reasons)],
  };
}

function runEvent(payload, options = {}) {
  const host = options.host || payload.host.name;
  const capability = HOST_CAPABILITIES[host]?.[payload.event];
  if (!capability) return { prompts: [], diagnostics: ["capability-unsupported"], blocked: false };
  const workspace = options.workspace || payload.workspace.root;
  const prompts = [];
  const diagnostics = [];
  const deadline = Date.now() + (options.eventBudgetMs || EVENT_BUDGET);
  let entries;
  let discoveringScope = "global";
  try {
    const globalEntries = discover("global", workspace, true, deadline);
    discoveringScope = "inner";
    const innerEntries = discover("inner", workspace, true, deadline);
    entries = [...globalEntries, ...innerEntries];
  } catch (error) {
    if (error.code === "TRIGGERIFY_BUDGET") {
      return { prompts, diagnostics: [`${discoveringScope}:${error.reason}`], blocked: false };
    }
    throw error;
  }
  for (const entry of entries.sort((left, right) => compareUtf8(left.id, right.id))) {
    if (entry.scope === "inner" && entry.innerConfigValid === false) {
      if (!diagnostics.includes("inner:config-invalid")) diagnostics.push("inner:config-invalid");
      continue;
    }
    if (entry.scope === "inner" && entry.innerDisabled) continue;
    if (!entry.valid) {
      diagnostics.push(...entry.errors.map((error) => `${entry.id}:${error.code}`));
      continue;
    }
    if (!entry.rule.enabled || entry.rule.event !== payload.event) continue;
    if (Date.now() >= deadline) {
      diagnostics.push(`${entry.id}:event-budget-exhausted`);
      break;
    }
    const condition = evaluateCondition(entry.rule.when, payload, deadline);
    if (condition.value === "unknown") diagnostics.push(`${entry.id}:condition-unknown`);
    if (condition.value !== "true") continue;
    if (Date.now() >= deadline) {
      diagnostics.push(`${entry.id}:event-budget-exhausted`);
      break;
    }
    if (entry.rule.action === "inject-prompt") {
      if (!capability.inject) {
        diagnostics.push(`${entry.id}:capability-unsupported`);
        continue;
      }
      prompts.push({ id: entry.id, content: entry.rule.body.trim() });
      continue;
    }
    if (!capability.script) {
      diagnostics.push(`${entry.id}:capability-unsupported`);
      continue;
    }
    let result;
    try {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        diagnostics.push(`${entry.id}:event-budget-exhausted`);
        break;
      }
      result = executeScript(entry, payload, workspace, remaining);
    } catch {
      diagnostics.push(`${entry.id}:runtime-error`);
      continue;
    }
    if (result.status === 2) {
      if (capability.block) return { prompts: [], diagnostics, blocked: true, reason: result.stderr || `${entry.id} blocked the event` };
      diagnostics.push(`${entry.id}:block-unsupported`);
    } else if (result.status !== 0) diagnostics.push(`${entry.id}:runtime-error`);
    else if (entry.rule["inject-output"] && capability.inject && result.stdout) {
      prompts.push({ id: entry.id, content: result.stdout });
    }
  }
  return { prompts, diagnostics, blocked: false };
}

function executeScript(entry, payload, workspace, remaining) {
  const scripts = fs.realpathSync(path.join(scopeRoot(entry.scope, workspace), "scripts"));
  const executable = fs.realpathSync(path.join(scripts, entry.rule.script));
  if (!isWithin(scripts, executable)) return { status: 1, stderr: "script-escape" };
  const payloadFile = path.join(os.tmpdir(), `triggerify-${process.pid}-${crypto.randomBytes(12).toString("hex")}.json`);
  let payloadDescriptor;
  let payloadPath = payloadFile;
  let result;
  try {
    fs.writeFileSync(payloadPath, `${JSON.stringify(payload)}\n`, { mode: 0o600, flag: "wx" });
    payloadDescriptor = fs.openSync(payloadPath, "r");
    fs.unlinkSync(payloadPath);
    payloadPath = null;
    result = spawnSync(executable, [], {
      cwd: canonicalWorkspace(workspace),
      env: {
        ...process.env,
        TRIGGERIFY_ROOT: scopeRoot(entry.scope, workspace),
        TRIGGERIFY_SCOPE: entry.scope,
        TRIGGERIFY_HOOK_ID: entry.id,
        TRIGGERIFY_WORKSPACE: canonicalWorkspace(workspace),
        TRIGGERIFY_HOST: payload.host.name,
        TRIGGERIFY_EVENT: payload.event,
        TRIGGERIFY_HOOK_CONFIG: JSON.stringify(entry.hookConfig || {}),
      },
      stdio: [payloadDescriptor, "pipe", "pipe"],
      encoding: "utf8",
      shell: false,
      timeout: Math.max(1, Math.min((entry.rule.timeout || DEFAULT_TIMEOUT) * 1000, remaining)),
      maxBuffer: MAX_OUTPUT,
    });
  } finally {
    if (payloadDescriptor !== undefined) {
      try { fs.closeSync(payloadDescriptor); } catch {}
    }
    if (payloadPath !== null) {
      try { fs.unlinkSync(payloadPath); } catch {}
    }
  }
  if (result.error || result.signal) return { status: 1, stderr: bounded(result.error?.message || `terminated by ${result.signal}`) };
  return { status: result.status ?? 1, stdout: bounded(result.stdout), stderr: bounded(result.stderr) };
}

function bounded(value = "") {
  return String(value).slice(0, MAX_OUTPUT).trim();
}

module.exports = {
  CODEX_CAPABILITIES,
  CLAUDE_CODE_CAPABILITIES,
  PI_CAPABILITIES,
  HOST_CAPABILITIES,
  bounded,
  createEvent,
  executeScript,
  ruleStatus,
  runEvent,
};
