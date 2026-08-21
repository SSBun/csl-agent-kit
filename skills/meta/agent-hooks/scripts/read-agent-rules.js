#!/usr/bin/env node
"use strict";

// Reads agent-rules.md from the CSL Agent Kit data directory, falling back to
// legacy simple-rules.md when the canonical file is absent. Pairs with the
// inner session-start hook `agent-rules`, which uses inject-output to surface
// the content as a session prompt.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const root = process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
const files = ["agent-rules.md", "simple-rules.md"].map((name) => path.join(root, name));

let content = "";
for (const file of files) {
  try {
    content = fs.readFileSync(file, "utf8");
    break;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

const trimmed = content.trim();
if (trimmed) {
  process.stdout.write(`## Agent Rules\n\n${trimmed}\n`);
}
