"use strict";

// 最终只读核对：固定原始集合、接续映射、成功凭据及清理范围。
const fs = require("node:fs"), path = require("node:path");
const queue = require(path.resolve("bin/memory/queue.js"));
const runtime = require(path.resolve("bin/memory/runtime-files.js"));
const store = require(path.resolve("bin/memory/store.js"));
const service = require(path.resolve("bin/memory/service.js"));
const evidence = path.resolve(".csl-agent-kit/tasks/artifacts/recover-failed-memory-batches/evidence");
const read = name => JSON.parse(fs.readFileSync(path.join(evidence, name), "utf8"));
const inventory = read("inventory.json"), recovery = read("recovery-result.json"), aliases = read("alias-result.json"), contexts = read("context-recovery-plan.json");
const transfers = aliases.rows.filter(row => row.action === "transferred-and-old-retired"), aliasMap = new Map(transfers.map(row => [row.oldId, row]));
const requeued = recovery.rows.filter(row => row.action === "requeued");
const originalIds = new Set(inventory.rows.map(row => row.id)), covered = [...requeued.map(row => row.id), ...transfers.map(row => row.oldId)];
const errors = [];
if (covered.length !== originalIds.size || new Set(covered).size !== originalIds.size || covered.some(id => !originalIds.has(id))) errors.push("Recovery actions do not cover the original set exactly once");
const rows = [], contextRows = [];
for (const original of inventory.rows) {
  const moved = aliasMap.get(original.id), id = moved?.targetId || original.id;
  try {
    const result = queue.get(id);
    const row = { originalId: original.id, effectiveId: id, status: result.state.status, retired: !!result.state.retired, completionReceipt: result.state.retired ? result.event.payloadHash : null };
    if (row.status !== "completed" || !row.retired) errors.push(`Not yet retired successfully: ${id}`);
    if (moved && result.event.payloadHash !== moved.payloadHash) errors.push(`Canonical receipt mismatch: ${id}`);
    if (moved && (fs.existsSync(runtime.file(`events/${original.id}.json`)) || fs.existsSync(runtime.file(`jobs/${original.id}.json`)))) errors.push(`Old alias runtime input remains: ${original.id}`);
    rows.push(row);
  } catch (error) { errors.push(`Unreadable outcome ${id}: ${error.code || error.message}`); }
}
for (const entry of contexts.rows) {
  try {
    const source = queue.get(entry.sourceId), target = queue.get(entry.targetId);
    const matches = source.state.retired && target.state.retired && source.event.payloadHash === entry.sourcePayloadHash && target.event.payloadHash === entry.targetPayloadHash;
    contextRows.push({ sourceId: entry.sourceId, targetId: entry.targetId, matches: !!matches });
    if (!matches) errors.push(`Context recovery receipt is not verified: ${entry.sourceId}`);
  } catch (error) { errors.push(`Context recovery not finished ${entry.sourceId}: ${error.code || error.message}`); }
}
const oldWorkspace = "/Users/caishilin/Desktop/personal/skills";
if (fs.existsSync(runtime.file(`workspaces/${store.hash(oldWorkspace)}.json`))) errors.push("Obsolete alias workspace registration remains");
if (queue.all().some(item => item.event.workspace === oldWorkspace)) errors.push("Queue still contains the obsolete workspace alias");
(async () => {
  const status = await service.status();
  const report = { captured: new Date().toISOString(), originalBatchCount: originalIds.size, directlyRequeued: requeued.length, normalizedAliases: transfers.length, verifiedContextRecoveries: contextRows.filter(row => row.matches).length, completedOriginalBatches: rows.filter(row => row.status === "completed" && row.retired).length, obsoleteRegistrationsRemoved: aliases.rows.filter(row => row.action === "obsolete-workspace-registration-removed").length, sourcePolicy: { maxAttempts: queue.MAX_ATTEMPTS, normalLimitChanged: false }, errors, service: { running: status.running, pid: status.pid, maxAgentsPerWorkspace: status.maxAgentsPerWorkspace, counts: status.counts, activeBatches: status.activeBatches?.length, schedulerError: status.schedulerError, maintenanceErrors: status.maintenanceErrors }, rows, contextRows, limitations: ["普通完成批次依据原输入未变检查及正常队列成功凭据；原输入按正常协议已释放，没有复制会话正文备份。", "未逐条语义审计模型对真实记忆的提炼和合并，也未运行单元或项目测试。", "服务与队列状态仅代表本次直接观察时点，不证明未来不会出现新的失败。"] };
  const filename = errors.length ? `audit-pending-${new Date().toISOString().replace(/[:.]/g, "-")}.json` : "final-audit.json";
  fs.writeFileSync(path.join(evidence, filename), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify({ file: filename, originalBatchCount: report.originalBatchCount, completedOriginalBatches: report.completedOriginalBatches, normalizedAliases: report.normalizedAliases, verifiedContextRecoveries: report.verifiedContextRecoveries, errors, service: report.service }, null, 2));
  if (errors.length) process.exitCode = 1;
})().catch(error => { console.error(error.message); process.exitCode = 1; });
