#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const file = path.join(__dirname, "..", "..", "..", "..", "super-agent", "workspace-workflow-gates.md");

try {
  process.stdout.write(fs.readFileSync(file, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
