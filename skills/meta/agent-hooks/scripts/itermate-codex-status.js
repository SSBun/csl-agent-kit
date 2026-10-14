#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const EVENTS = {
  "session-start": ["SessionStart", "idle"],
  "prompt-submit": ["UserPromptSubmit", "running"],
  "before-tool": ["PreToolUse", "running"],
  "after-tool": ["PostToolUse", "running"],
  interrupt: ["Interrupt", "idle"],
  stop: ["Stop", "finished"],
  "session-end": ["SessionEnd", "detached"],
};

function report(payload, options = {}) {
  const event = EVENTS[payload?.event];
  const native = payload?.native?.payload;
  if (payload?.schema !== "agent-hooks.event/v1" || payload?.host?.name !== "codex"
      || !event || native?.hook_event_name !== event[0]
      || typeof native.session_id !== "string" || payload.session?.id !== native.session_id) return 0;
  const directory = path.join(options.home || os.homedir(), "Library/Application Support/iTermate/integrations");
  const marker = path.join(directory, "codex-agent-hooks.json");
  let config;
  try {
    config = JSON.parse(fs.readFileSync(marker, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return 0; // iTermate has not opted in.
    return 1;
  }
  if (config.schema !== "itermate.codex-agent-hooks/v1" || config.enabled !== true) return 0;
  const executable = path.join(directory, "iTermate-status.py");
  const result = (options.spawn || spawnSync)(executable, ["agent", event[1]], {
    input: JSON.stringify(native),
    encoding: "utf8",
    timeout: 2400,
    maxBuffer: 64 * 1024,
    env: process.env,
    shell: false,
  });
  // This observer cannot block a Codex prompt or tool, and emits no model context.
  return result.error || result.signal || result.status !== 0 || result.stderr?.trim() ? 1 : 0;
}

if (require.main === module) {
  try {
    const input = fs.readFileSync(0, "utf8");
    if (Buffer.byteLength(input) > 1024 * 1024) throw new Error("oversized hook payload");
    process.exitCode = report(JSON.parse(input));
  } catch {
    process.stderr.write("iTermate Agent Hooks: invalid input or unavailable reporter\n");
    process.exitCode = 1;
  }
}

module.exports = { report, EVENTS };
