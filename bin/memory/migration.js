"use strict";

const fs = require("node:fs");
const os = require("node:os");
const store = require("./store.js");
const VERSION = store.STORE_VERSION;
const RETIRED = [".history", ".proposals", ".migrations", ".indexes", ".upgrade-v3.json", ".index-error.json", ".pending.json", ".format.json", ".write-lock", ".write-lock-v3", ".write-lock-v4", ".recovery-lock"];

function json(root, name) { const raw = store.readOptional(store.safePath(root, name)); return raw === null ? null : JSON.parse(raw); }
function checkVersion(root) {
  const marker = json(root, ".format.json"), index = store.indexMetadata(root);
  if (marker && (marker.schema !== "csl-memory-store/v1" || ![2, 3, 4].includes(marker.version))) store.fail("UNSUPPORTED_STORE", "Unknown legacy store format");
  if (index?.schema && !["csl-memory-index/v1", "csl-memory-index/v2", "csl-memory-index/v3", "csl-memory-index/v4"].includes(index.schema)) store.fail("UNSUPPORTED_STORE", "Unknown memory index format");
  if (index?.schema === "csl-memory-index/v4" && index.formatVersion !== VERSION) store.fail("UNSUPPORTED_STORE", "Unknown current-content format version");
  return marker;
}
function preview(options = {}) {
  const root = store.rootFor(options), scope = options.scope || "project", marker = checkVersion(root);
  if (marker?.scope && marker.scope !== scope) store.fail("INVALID_SCOPE", "Stored scope differs from requested scope");
  const entries = store.entries(root);
  const remove = RETIRED.filter(name => fs.existsSync(store.safePath(root, name)));
  return { root, scope, version: VERSION, status: remove.length || entries.some(e => e.legacy) ? "needed" : "current", active: entries.filter(e => e.exists).length,
    entries: entries.map(({ id, hash, exists, legacy }) => ({ id, hash, action: !exists ? "delete-tombstone" : legacy ? "simplify" : "keep" })), remove,
    warning: "只保留当前有效知识；永久删除来源、历史和恢复资料，不创建备份。" };
}
function ensure(options = {}) {
  const root = store.rootFor(options), scope = options.scope || "project";
  const plan = preview(options);
  if (plan.status !== "current") return { root, scope, version: VERSION, status: "upgrade-required", writable: false };
  const index = store.indexMetadata(root);
  if (index?.scope && index.scope !== scope) store.fail("INVALID_SCOPE", "Index scope differs from requested scope");
  if (!index) store.withLock(root, () => store.rebuildIndex(root, scope));
  store.pruneTemp({ ...options, scope });
  return { root, scope, version: VERSION, status: "current", writable: true };
}
function assertIdle(options) {
  const serviceRoot = store.rootFor({ ...options, scope: "user" });
  const descriptor = json(serviceRoot, ".service/daemon.json"), owner = json(serviceRoot, ".service/daemon.lock");
  if (!descriptor && !owner) return;
  if (!owner || owner.host !== os.hostname() || !Number.isSafeInteger(owner.pid) || owner.pid < 1) store.fail("SERVICE_BUSY", "Cannot verify shared service ownership; inspect before upgrade");
  try { process.kill(owner.pid, 0); }
  catch (error) { if (error.code === "ESRCH") return; throw error; }
  store.fail("SERVICE_BUSY", "Stop the shared Memory service at an idle boundary before upgrading");
}
function checkOldLocks(root) {
  if (json(root, ".pending.json")) store.fail("PENDING_WRITE", "Unresolved legacy write: inspect current files before discarding history");
  for (const name of [".write-lock", ".write-lock-v3", ".write-lock-v4", ".recovery-lock"]) {
    const owner = json(root, name);
    if (!owner) continue;
    if ([".write-lock", ".write-lock-v3"].includes(name) && owner.schema === "csl-memory-write-fence/v3" && owner.host === "csl-memory-format-v3" && owner.pid === 0) continue;
    if (owner.host !== os.hostname() || !Number.isSafeInteger(owner.pid) || owner.pid < 1) store.fail("LOCKED", `Unverifiable writer: ${name}`);
    try { process.kill(owner.pid, 0); }
    catch (error) { if (error.code === "ESRCH") continue; throw error; }
    store.fail("LOCKED", `Writer is alive: ${name}`);
  }
}
function upgrade(options = {}) {
  assertIdle(options);
  const plan = preview(options), root = plan.root;
  const preparedInputs = options.prepared ?? [];
  if (!Array.isArray(preparedInputs)) store.fail("INVALID_INPUT", "Prepared upgrade content must be an array");
  const replacements = new Map();
  for (const input of preparedInputs) {
    store.validateMutation(input);
    if (input.operation !== "put" || input.expected.hash === null || replacements.has(input.id)) store.fail("INVALID_INPUT", "Upgrade accepts unique existing-file put operations only");
    replacements.set(input.id, input);
  }
  checkOldLocks(root);
  return store.withLock(root, () => {
    checkOldLocks(root);
    // Validate all current knowledge before the first irreversible operation.
    const current = store.entries(root);
    if (JSON.stringify(current.map(e => [e.id, e.hash])) !== JSON.stringify(plan.entries.map(e => [e.id, e.hash]))) store.fail("CONFLICT", "Memory changed during upgrade preflight");
    for (const [id, input] of replacements) {
      const entry = current.find(item => item.id === id);
      if (!entry?.exists || !entry.legacy) store.fail("INVALID_INPUT", "Prepared content must target an active legacy entry");
      if (entry.hash !== input.expected.hash) store.fail("CONFLICT", "Prepared upgrade content is stale");
    }
    const prepared = current.map(entry => {
      if (!entry.exists) return { entry, raw: null };
      const content = replacements.get(entry.id)?.content ?? { title: entry.title, summary: entry.summary, body: entry.body };
      store.validateContent(content, plan.scope, true, entry.id);
      return { entry, raw: store.encodeEntry(content) };
    });
    for (const { entry, raw } of prepared) {
      const file = store.safePath(root, `entries/${entry.id}.md`);
      if (store.get(root, entry.id).hash !== entry.hash) store.fail("CONFLICT", "Memory changed before conversion");
      if (raw === null) fs.unlinkSync(file);
      else if (entry.legacy) store.atomicWrite(file, raw);
    }
    store.rebuildIndex(root, plan.scope);
    for (const name of plan.remove) fs.rmSync(store.safePath(root, name), { recursive: true, force: true });
    return { root, scope: plan.scope, version: VERSION, status: "current", active: plan.active, removed: plan.remove, historyRetained: false };
  });
}
function ensureWorkspace(workspace = process.cwd()) { return [ensure({ scope: "user", workspace }), ensure({ scope: "project", workspace })]; }

module.exports = { VERSION, preview, ensure, upgrade, ensureWorkspace };
