"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const { bounded, createEvent, runEvent } = require("./runtime.js");
const { canonicalWorkspace, dataRoot, writeAtomic } = require("./store.js");

const NATIVE_EVENTS = {
  SessionStart: "session-start",
  UserPromptSubmit: "prompt-submit",
  PreToolUse: "before-tool",
  PermissionRequest: "permission-request",
  PostToolUse: "after-tool",
  PreCompact: "before-compact",
  PostCompact: "after-compact",
  SubagentStart: "subagent-start",
  SubagentStop: "subagent-stop",
  Stop: "stop",
};

function normalizePayload(native, host, event, workspace) {
  const toolName = native.tool_name ?? null;
  const command = typeof native.tool_input?.command === "string" ? native.tool_input.command : null;
  return createEvent({
    event,
    host,
    workspace,
    sessionId: native.session_id ?? null,
    prompt: event === "prompt-submit" ? native.prompt ?? null : null,
    tool: ["before-tool", "after-tool"].includes(event) ? {
      name: toolName,
      category: toolCategory(toolName),
      command,
      success: null,
    } : null,
    permission: event === "permission-request" ? { tool: toolName, description: native.tool_input?.description ?? null } : null,
    compact: ["before-compact", "after-compact"].includes(event) ? { trigger: native.trigger ?? null } : null,
    subagent: ["subagent-start", "subagent-stop"].includes(event) ? {
      id: native.agent_id ?? null,
      type: native.agent_type ?? null,
    } : null,
    stop: ["subagent-stop", "stop"].includes(event) ? {
      hook_active: native.stop_hook_active ?? null,
      last_message: native.last_assistant_message ?? null,
    } : null,
    nativeEvent: native.hook_event_name ?? null,
    nativePayload: native,
  });
}

function toolCategory(name) {
  if (name === "Bash") return "shell";
  if (["apply_patch", "Edit", "Write"].includes(name)) return "file";
  if (typeof name === "string" && name.startsWith("mcp__")) return "mcp";
  return name ? "tool" : null;
}

function dispatch(input = fs.readFileSync(0, "utf8"), env = process.env, io = process) {
  try {
    const native = JSON.parse(input || "{}");
    const event = NATIVE_EVENTS[native.hook_event_name];
    if (!event) return 0;
    const host = env.PLUGIN_ROOT ? "codex" : "claude-code";
    const workspace = canonicalWorkspace(native.cwd || process.cwd());
    const payload = normalizePayload(native, host, event, workspace);
    const result = runEvent(payload, { host, workspace });
    const diagnostics = dedupeDiagnostics(payload, result.diagnostics);
    if (diagnostics.length > 0) io.stderr.write(`Triggerify: ${diagnostics.join(", ")}\n`);
    if (result.blocked) {
      const reason = bounded(result.reason) || "Blocked by Triggerify";
      if (native.hook_event_name === "PermissionRequest") {
        io.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: "PermissionRequest", decision: { behavior: "deny", message: reason } } })}\n`);
        return 0;
      }
      if (native.hook_event_name === "PreCompact") {
        io.stdout.write(`${JSON.stringify({ continue: false, stopReason: reason })}\n`);
        return 0;
      }
      io.stderr.write(`${reason}\n`);
      return 2;
    }
    if (result.prompts.length > 0) {
      const context = result.prompts.map((prompt) => `[Triggerify ${prompt.id}]\n${prompt.content}`).join("\n\n");
      io.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: native.hook_event_name, additionalContext: context } })}\n`);
    } else if (["Stop", "SubagentStop"].includes(native.hook_event_name)) io.stdout.write("{}\n");
    return 0;
  } catch (error) {
    io.stderr.write(`Triggerify runtime error (fail-open): ${bounded(error.message)}\n`);
    return 0;
  }
}

function dedupeDiagnostics(payload, diagnostics) {
  const unique = [...new Set(diagnostics)];
  if (unique.length === 0 || !payload.session.id) return unique;
  try {
    const digest = crypto.createHash("sha256").update(String(payload.session.id)).digest("hex");
    const file = path.join(dataRoot(), "triggerify", ".diagnostics", `${digest}.json`);
    let seen = [];
    try { seen = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
    const fresh = unique.filter((item) => !seen.includes(item));
    if (fresh.length > 0) writeAtomic(file, `${JSON.stringify([...seen, ...fresh].slice(-256))}\n`);
    return fresh;
  } catch {
    return unique;
  }
}

module.exports = {
  dispatch,
  normalizePayload,
};
