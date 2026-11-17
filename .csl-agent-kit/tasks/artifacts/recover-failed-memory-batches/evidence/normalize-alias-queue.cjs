"use strict";

// 把已验证的旧别名输入接续到规范队列；目标完整持久化后才移除旧运行记录。
const fs = require("node:fs"), path = require("node:path");
const store = require(path.resolve("bin/memory/store.js"));
const runtime = require(path.resolve("bin/memory/runtime-files.js"));
const queue = require(path.resolve("bin/memory/queue.js"));
const evidence = path.resolve(".csl-agent-kit/tasks/artifacts/recover-failed-memory-batches/evidence");
const inventory = JSON.parse(fs.readFileSync(path.join(evidence, "inventory.json"), "utf8"));
const oldWorkspace = "/Users/caishilin/Desktop/personal/skills";
const canonical = fs.realpathSync(oldWorkspace);
const candidates = inventory.rows.filter(row => row.workspace === oldWorkspace);
const apply = process.argv[2] === "--apply";
if (process.argv.length > 3 || process.argv[2] && !apply) throw new Error("Use no arguments for inspection, or --apply for the fixed alias set");
if (canonical !== "/Users/caishilin/Desktop/personal/csl-agent-kit" || canonical === oldWorkspace) throw new Error("The verified workspace alias changed");
if (fs.realpathSync(store.rootFor({ scope: "project", workspace: oldWorkspace })) !== fs.realpathSync(store.rootFor({ scope: "project", workspace: canonical }))) throw new Error("Memory roots differ; preserve the original input");
const hashFile = relative => { const raw = store.readOptional(runtime.file(relative), 2 * 1024 * 1024); return raw === null ? null : store.hash(raw); };
const rows = [], counts = {};
function log(row) {
  rows.push(row); counts[row.action] = (counts[row.action] || 0) + 1;
  if (apply) fs.appendFileSync(path.join(evidence, "alias-actions.ndjson"), `${JSON.stringify(row)}\n`, { mode: 0o600 });
}
for (const candidate of candidates) {
  let unlockSourceJob, unlockSourceEvent, unlockTargetJob;
  try {
    if (apply) {
      unlockSourceJob = runtime.acquire(`job-locks/${candidate.id}.lock`);
      unlockSourceEvent = runtime.acquire(`event-locks/${candidate.id}.lock`);
    }
    const { event, state } = queue.get(candidate.id);
    if (state.status !== "exhausted" || hashFile(`events/${candidate.id}.json`) !== candidate.eventHash || hashFile(`jobs/${candidate.id}.json`) !== candidate.jobHash) throw new Error("Source no longer matches the inactive inventory entry");
    const targetId = store.hash(JSON.stringify([canonical, event.session, event.eventKey]));
    if (targetId === candidate.id) throw new Error("Canonical identity did not change");
    if (apply) unlockTargetJob = runtime.acquire(`job-locks/${targetId}.lock`);
    const normalized = { schema: event.schema, workspace: canonical, session: event.session, eventKey: event.eventKey, task: event.task || null, messages: event.messages, ...(event.maintenance ? { maintenance: event.maintenance } : {}) };
    const payloadHash = store.hash(JSON.stringify(normalized));
    let target;
    try { target = queue.get(targetId); } catch (error) { if (error.code !== "NOT_FOUND") throw error; }
    if (target?.state.status === "running") throw new Error("Canonical target is active; defer without touching its state");
    if (target?.event.payloadHash && target.event.payloadHash !== payloadHash) throw new Error("Canonical event key has different content; preserve both for resolution");
    const effectsHash = store.hash(JSON.stringify(state.effects || []));
    if (apply) {
      log({ oldId: candidate.id, targetId, action: "transfer-intent", sourceEventHash: candidate.eventHash, sourceJobHash: candidate.jobHash, payloadHash, effectsHash, at: new Date().toISOString() });
      const receipt = queue.enqueue(normalized);
      if (receipt.id !== targetId) throw new Error("Queue returned an unexpected canonical identity");
      if (!receipt.duplicate) queue.update(targetId, { effects: state.effects || [] });
      const saved = queue.get(targetId);
      if (saved.event.payloadHash !== payloadHash) throw new Error("Canonical payload was not preserved");
      if (!saved.state.retired && JSON.stringify(saved.event.messages) !== JSON.stringify(event.messages)) throw new Error("Canonical messages differ from the original");
      if (!receipt.duplicate && store.hash(JSON.stringify(saved.state.effects || [])) !== effectsHash) throw new Error("Partial effects were not preserved");
      if (hashFile(`events/${candidate.id}.json`) !== candidate.eventHash || hashFile(`jobs/${candidate.id}.json`) !== candidate.jobHash) throw new Error("Source drifted before retirement");
      // 移除事件在先；中断最多留下不可调度的孤立旧job，规范目标已原子保存。
      fs.unlinkSync(runtime.file(`events/${candidate.id}.json`));
      fs.unlinkSync(runtime.file(`jobs/${candidate.id}.json`));
      if (hashFile(`events/${candidate.id}.json`) !== null || hashFile(`jobs/${candidate.id}.json`) !== null) throw new Error("Old alias record retirement is incomplete");
    }
    log({ oldId: candidate.id, targetId, action: apply ? "transferred-and-old-retired" : "eligible", canonical, payloadHash, effectsHash, at: new Date().toISOString() });
  } catch (error) {
    log({ oldId: candidate.id, action: "blocked-preserved", code: error.code || "ALIAS_CHECK", error: error.message, at: new Date().toISOString() });
  } finally { unlockTargetJob?.(); unlockSourceEvent?.(); unlockSourceJob?.(); }
}
if (apply && rows.filter(row => row.action === "transferred-and-old-retired").length === candidates.length && !queue.all().some(item => item.event.workspace === oldWorkspace)) {
  const oldFile = `workspaces/${store.hash(oldWorkspace)}.json`, canonicalFile = `workspaces/${store.hash(canonical)}.json`;
  const old = runtime.read(oldFile), current = runtime.read(canonicalFile);
  if (old?.workspace === oldWorkspace && current?.workspace === canonical) {
    fs.unlinkSync(runtime.file(oldFile));
    log({ action: "obsolete-workspace-registration-removed", workspace: oldWorkspace, canonical, at: new Date().toISOString() });
  }
}
const report = { mode: apply ? "applied" : "inspection", completed: new Date().toISOString(), counts, rows };
fs.writeFileSync(path.join(evidence, apply ? "alias-result.json" : "alias-plan.json"), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ mode: report.mode, counts, rows }, null, 2));
