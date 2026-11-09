#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { enqueue } = require(path.resolve(__dirname, "../../../../bin/memory/service.js"));

async function main() {
  const payload = JSON.parse(fs.readFileSync(0, "utf8"));
  if (payload.host?.name !== "pi" || payload.native?.event !== "agent_settled") return;
  const event = payload.native?.payload?.memoryEvent;
  if (!event || event.workspace !== payload.workspace?.root || event.session !== payload.session?.id) throw new Error("Memory event identity does not match hook payload");
  const receipt = await enqueue(event);
  if (!receipt.enqueued) throw new Error("Memory event was not durably queued");
  // Pi checks the durable queue receipt itself; stdout is not injected into
  // the foreground model and the hook never waits for maintenance completion.
  process.stdout.write(`${JSON.stringify(receipt)}\n`);
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
