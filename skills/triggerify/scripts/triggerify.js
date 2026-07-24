#!/usr/bin/env node
"use strict";

const { runCli } = require("./lib/cli.js");
const { dispatch, normalizePayload } = require("./lib/native-hook.js");
const {
  CODEX_CAPABILITIES,
  HOST_CAPABILITIES,
  createEvent,
  runEvent,
} = require("./lib/runtime.js");
const {
  evaluateCondition,
  globRegex,
  parseMarkdown,
  safeRegexTest,
  validateCondition,
} = require("./lib/rule.js");

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  process.exit(command === "dispatch" ? dispatch() : runCli([command || "help", ...args]));
}

module.exports = {
  CODEX_CAPABILITIES,
  HOST_CAPABILITIES,
  createEvent,
  dispatch,
  evaluateCondition,
  globRegex,
  normalizePayload,
  parseMarkdown,
  runCli,
  runEvent,
  safeRegexTest,
  validateCondition,
};
