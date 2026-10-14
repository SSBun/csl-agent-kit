#!/usr/bin/env node
"use strict";

const { resolveTaskMode, saveTaskMode } = require("../lib/task-mode.js");

const HELP = `Usage:
  node task-mode.js show [--workspace <path>] [--host <host> --session <id>]
  node task-mode.js set <session|project|global> <confirm|solo|inherit> [--workspace <path>] [--host <host> --session <id>]

Session > project > global > default confirm. Inherit removes only the selected override.
All settings are user-local under CSL_AGENT_KIT_HOME (default ~/.csl-agent-kit).
Session scope requires a real host session ID. Output is JSON; errors use stderr and exit 1.
SOLO skips Task confirmation grading and in-scope publication/SOP confirmation, not host permissions or review/verification.
Existing stored autonomous values resolve as solo without modifying files; new writes use solo.
`;

try {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help")) {
    process.stdout.write(HELP);
  } else {
    const command = args.shift();
    const scope = command === "set" ? args.shift() : undefined;
    const mode = command === "set" ? args.shift() : undefined;
    const options = {};
    const flags = { "--workspace": "workspace", "--host": "host", "--session": "sessionId" };
    while (args.length) {
      const flag = args.shift();
      const field = flags[flag];
      const value = args.shift();
      if (!field || !value || value.startsWith("--") || options[field] !== undefined) {
        throw new Error(`Invalid or duplicate option: ${flag}`);
      }
      options[field] = value;
    }
    if (Boolean(options.host) !== Boolean(options.sessionId)) throw new Error("Supply --host and --session together");
    if (command === "set") {
      const saved = saveTaskMode(scope, mode, options);
      // A successful write is distinct from resolving other, potentially invalid layers.
      process.stdout.write(`${JSON.stringify({ saved, scope, mode })}\n`);
    } else if (command === "show") {
      process.stdout.write(`${JSON.stringify(resolveTaskMode(options), null, 2)}\n`);
    } else throw new Error(`Unknown command: ${command}`);
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
}
