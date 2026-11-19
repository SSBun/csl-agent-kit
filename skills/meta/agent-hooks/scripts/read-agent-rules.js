#!/usr/bin/env node
"use strict";

// Injects one Agent Rules file per scope in built-in, user, then project order.
// Pairs with the inner session-start hook `agent-rules`.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dataRoot = process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
const workspace = process.env.AGENT_HOOKS_WORKSPACE || process.cwd();
const projectRules = path.join(workspace, ".csl-agent-kit", "agent-rules.md");
const files = [
  path.resolve(__dirname, "..", "..", "agent-rules", "agent-rules.md"),
  path.join(dataRoot, "agent-rules.md"),
  projectRules,
];

function readRules(file) {
  try {
    return fs.readFileSync(file, "utf8").trim();
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

const rules = files.map(readRules).filter(Boolean);
if (rules.length > 0) process.stdout.write(`## Agent Rules\n\n${rules.join("\n")}\n`);

if (!fs.existsSync(projectRules) && fs.existsSync(path.join(workspace, ".agents", "agent-rules.md"))) {
  process.stdout.write("\n## Agent Rules migration notice\n\nThe project still uses `.agents/agent-rules.md`. The hook did not load its rules. Tell the user to migrate the file to `.csl-agent-kit/agent-rules.md`.\n");
}
