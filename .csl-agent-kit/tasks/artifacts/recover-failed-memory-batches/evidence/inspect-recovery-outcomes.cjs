"use strict";

// 只读核对固定恢复集合与正常完成凭据；报告不含会话正文。
const fs = require("node:fs"), path = require("node:path");
const store = require(path.resolve("bin/memory/store.js"));
const runtime = require(path.resolve("bin/memory/runtime-files.js"));
const queue = require(path.resolve("bin/memory/queue.js"));
const service = require(path.resolve("bin/memory/service.js"));
const evidence = path.resolve(".csl-agent-kit/tasks/artifacts/recover-failed-memory-batches/evidence");
const inventory = JSON.parse(fs.readFileSync(path.join(evidence, "inventory.json"), "utf8"));
const transfers = JSON.parse(fs.readFileSync(path.join(evidence, "alias-result.json"), "utf8")).rows.filter(row => row.action === "transferred-and-old-retired");
const mapping = new Map(transfers.map(row => [row.oldId, row]));
const rows = [], counts = {}, errors = {};
for (const original of inventory.rows) {
  const moved = mapping.get(original.id), id = moved?.targetId || original.id;
  try {
    const { event, state } = queue.get(id);
    const row = { originalId: original.id, id, workspace: event.workspace || moved?.canonical || original.workspace, status: state.status, attempts: state.attempts, retired: !!state.retired, error: state.error || null, effects: state.effects?.length || 0 };
    if (moved && event.payloadHash !== moved.payloadHash) row.integrityError = "Canonical payload or completion receipt differs from the transfer manifest";
    if (!moved && !state.retired) {
      const raw = store.readOptional(runtime.file(`events/${id}.json`), 2 * 1024 * 1024);
      if (raw === null || store.hash(raw) !== original.eventHash) row.integrityError = "Original event input changed";
    }
    if (moved && (fs.existsSync(runtime.file(`events/${original.id}.json`)) || fs.existsSync(runtime.file(`jobs/${original.id}.json`)))) row.integrityError = "Obsolete alias runtime record still exists";
    if (state.retired) row.completionReceipt = event.payloadHash;
    rows.push(row); counts[row.status] = (counts[row.status] || 0) + 1;
    if (row.error) errors[row.error.split(":")[0]] = (errors[row.error.split(":")[0]] || 0) + 1;
  } catch (error) {
    rows.push({ originalId: original.id, id, status: "unverified", error: `${error.code || "READ_ERROR"}: ${error.message}` });
    counts.unverified = (counts.unverified || 0) + 1;
  }
}
(async () => {
  const status = await service.status();
  const report = { captured: new Date().toISOString(), originalBatchCount: inventory.rows.length, normalizedAliases: transfers.length, counts, errors, integrityErrors: rows.filter(row => row.integrityError), registryAliasPresent: fs.existsSync(runtime.file(`workspaces/${store.hash("/Users/caishilin/Desktop/personal/skills")}.json`)), service: { running: status.running, pid: status.pid, maxAgentsPerWorkspace: status.maxAgentsPerWorkspace, activeBatches: status.activeBatches?.length, schedulerError: status.schedulerError, maintenanceErrors: status.maintenanceErrors, counts: status.counts }, rows };
  const name = `outcomes-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(path.join(evidence, name), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ file: name, captured: report.captured, counts, errors, integrityErrors: report.integrityErrors, registryAliasPresent: report.registryAliasPresent, service: report.service, unresolved: rows.filter(row => ["failed", "interrupted", "exhausted", "unverified"].includes(row.status)).map(({ originalId, id, status, error }) => ({ originalId, id, status, error })) }, null, 2));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
