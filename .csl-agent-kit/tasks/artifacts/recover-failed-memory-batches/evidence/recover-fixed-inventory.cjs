"use strict";

// 仅恢复固定清单；不修改输入、记忆正文或正常重试策略，不删除任何记录。
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const store = require(path.resolve("bin/memory/store.js"));
const runtime = require(path.resolve("bin/memory/runtime-files.js"));
const migration = require(path.resolve("bin/memory/migration.js"));
const queue = require(path.resolve("bin/memory/queue.js"));
const evidence = path.resolve(".csl-agent-kit/tasks/artifacts/recover-failed-memory-batches/evidence");
const inventory = JSON.parse(fs.readFileSync(path.join(evidence, "inventory.json"), "utf8"));
const apply = process.argv[2] === "--apply";
if (process.argv.length > 3 || process.argv[2] && !apply) throw new Error("Use no arguments for inspection, or --apply for the fixed recovery set");
const queueFile = path.resolve("bin/memory/queue.js");
const sandbox = { require: createRequire(queueFile), module: { exports: {} }, Buffer };
vm.runInNewContext(`${fs.readFileSync(queueFile, "utf8")}\nmodule.exports.validateEvent = validateEvent; module.exports.receipt = receipt;`, sandbox, { filename: queueFile });
const { validateEvent, receipt } = sandbox.module.exports;
const rows = [], counts = {};
const rawHash = relative => { const raw = store.readOptional(runtime.file(relative), 2 * 1024 * 1024); return raw === null ? null : store.hash(raw); };
const log = row => {
  rows.push(row); counts[row.action] = (counts[row.action] || 0) + 1;
  if (apply) fs.appendFileSync(path.join(evidence, "recovery-actions.ndjson"), `${JSON.stringify(row)}\n`, { mode: 0o600 });
};
const user = migration.preview({ scope: "user" });
if (user.status !== "current") throw new Error("User memory is not writable; preserve the queue for explicit resolution");
const scopes = new Map();
for (const candidate of inventory.rows) {
  if (!["failed", "interrupted", "exhausted"].includes(candidate.status)) continue;
  let unlockJob, unlockEvent;
  try {
    runtime.jobId(candidate.id);
    if (apply) {
      unlockJob = runtime.acquire(`job-locks/${candidate.id}.lock`);
      unlockEvent = runtime.acquire(`event-locks/${candidate.id}.lock`);
    }
    const current = queue.get(candidate.id), { event, state } = current;
    const receiptHash = receipt(candidate.id);
    if (receiptHash && receiptHash !== event.payloadHash) throw new Error("Completion receipt conflicts with current payload; preserve input");
    if (state.status === "completed" || receiptHash) { log({ id: candidate.id, action: "already-completed-preserved", at: new Date().toISOString() }); continue; }
    if (!["failed", "interrupted", "exhausted"].includes(state.status)) { log({ id: candidate.id, action: "active-or-changed-preserved", status: state.status, at: new Date().toISOString() }); continue; }
    if (rawHash(`events/${candidate.id}.json`) !== candidate.eventHash || rawHash(`jobs/${candidate.id}.json`) !== candidate.jobHash) { log({ id: candidate.id, action: "identity-changed-preserved", at: new Date().toISOString() }); continue; }
    validateEvent(event);
    const payload = { schema: "csl-memory-event/v1", workspace: event.workspace, session: event.session, eventKey: event.eventKey, task: event.task || null, messages: event.messages.map(({ role, text, at }) => ({ role, text, ...(at ? { at } : {}) })), ...(event.maintenance ? { maintenance: { scope: event.maintenance.scope, ids: event.maintenance.ids } } : {}) };
    if (event.id !== candidate.id || store.hash(JSON.stringify([event.workspace, event.session, event.eventKey])) !== candidate.id || store.hash(JSON.stringify(payload)) !== event.payloadHash) throw new Error("Event identity differs from validated payload");
    if (fs.realpathSync(event.workspace) !== event.workspace) throw new Error("Workspace canonical identity changed");
    if (!scopes.has(event.workspace)) scopes.set(event.workspace, migration.preview({ scope: "project", workspace: event.workspace }));
    if (scopes.get(event.workspace).status !== "current") throw new Error("Project requires explicit upgrade; preserve input");
    const effects = { reported: state.effects?.length || 0, legacyUnlocatable: 0, currentHashMatches: 0, changedOrRemoved: 0 };
    for (const effect of state.effects || []) {
      if (!effect.id || !["user", "project"].includes(effect.scope)) { effects.legacyUnlocatable++; continue; }
      const entry = store.get(store.rootFor({ scope: effect.scope, workspace: event.workspace }), effect.id, { raw: true });
      if (entry.hash === effect.hash) effects.currentHashMatches++; else effects.changedOrRemoved++;
    }
    const effectsHash = store.hash(JSON.stringify(state.effects || []));
    if (apply) {
      log({ id: candidate.id, action: "recovery-intent", workspace: event.workspace, previousAttempts: state.attempts, eventHash: candidate.eventHash, effectsHash, at: new Date().toISOString() });
      queue.update(candidate.id, { status: "queued", attempts: 0, error: null, started: null, completed: null });
      const saved = queue.get(candidate.id);
      if (rawHash(`events/${candidate.id}.json`) !== candidate.eventHash || store.hash(JSON.stringify(saved.state.effects || [])) !== effectsHash || saved.state.status !== "queued" || saved.state.attempts !== 0) throw new Error("Recovery verification failed; inspect actual current state before retry");
    }
    log({ id: candidate.id, workspace: event.workspace, action: apply ? "requeued" : "eligible", previousAttempts: state.attempts, effects, at: new Date().toISOString() });
  } catch (error) {
    log({ id: candidate.id, action: "blocked-preserved", code: error.code || "RECOVERY_CHECK", error: error.message, at: new Date().toISOString() });
  } finally { unlockEvent?.(); unlockJob?.(); }
}
const summary = { mode: apply ? "applied" : "inspection", inventoryCaptured: inventory.captured, completed: new Date().toISOString(), counts, rows };
fs.writeFileSync(path.join(evidence, apply ? "recovery-result.json" : "recovery-plan.json"), `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ mode: summary.mode, counts }, null, 2));
