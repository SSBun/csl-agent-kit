#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const { taskModePrompt } = require("../../csl-tasks/shared/lib/task-mode.js");
const file = path.join(__dirname, "..", "references", "csl-agent-kit-contract.md");

try {
  process.stdout.write(fs.readFileSync(file, "utf8"));
  let payload = {};
  if (process.env.AGENT_HOOKS_EVENT) {
    try { payload = JSON.parse(fs.readFileSync(0, "utf8")); }
    catch {
      process.stdout.write("\n\n## CSL Task Confirmation Mode (runtime configuration)\nEffective mode: confirm; source: invalid-hook-payload. Use normal confirmation gates, never stale SOLO configuration.\n");
      process.exit(0);
    }
  }
  process.stdout.write(`\n\n${taskModePrompt({
    workspace: process.env.AGENT_HOOKS_WORKSPACE || process.cwd(),
    host: process.env.AGENT_HOOKS_HOST,
    sessionId: payload.session?.id,
  })}\n`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
