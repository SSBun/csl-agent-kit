#!/usr/bin/env node
"use strict";

// Reads ~/.csl-agent-kit/simple-rules.md (or $CSL_AGENT_KIT_HOME/simple-rules.md)
// and writes its content to stdout when non-empty. Pairs with the inner
// session-start hook `simple-rules`, which uses inject-output to surface the
// content as a session prompt.

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const file = path.join(
  process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit"),
  "simple-rules.md",
);

let content = "";
try {
  content = fs.readFileSync(file, "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const trimmed = content.trim();
if (trimmed) {
  process.stdout.write(`## Simple Rules\n\n${trimmed}\n`);
}
