"use strict";

const fs = require("node:fs");
const path = require("node:path");
const store = require("./store.js");

const VERSION = 2;
const MAX_SOURCE = 2 * 1024 * 1024;
const MAX_PLAN = 8 * 1024 * 1024;

function units(text, source) {
  const lines = text.match(/[^\n]*\n|[^\n]+$/g) || [];
  const boundaries = [{ offset: 0, title: "文件前言" }];
  let offset = 0, fence = null;
  for (const line of lines) {
    const marker = /^ {0,3}(`{3,}|~{3,})(.*)/.exec(line);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
    } else if (!fence) {
      const heading = /^##[ \t]+([^\r\n]+?)[ \t]*(?:\r?\n)?$/.exec(line);
      if (heading) {
        if (offset === 0) boundaries[0] = { offset, title: heading[1] };
        else boundaries.push({ offset, title: heading[1] });
      }
    }
    offset += line.length;
  }
  const occurrences = new Map();
  return boundaries.map((part, index) => {
    const count = (occurrences.get(part.title) || 0) + 1;
    occurrences.set(part.title, count);
    const raw = text.slice(part.offset, boundaries[index + 1]?.offset ?? text.length);
    return { key: `${source}#${part.title}:${count}`, title: part.title, raw, sourceHash: store.hash(raw) };
  });
}

function readJson(file, max = MAX_PLAN) {
  const raw = store.readOptional(file, max);
  return raw === null ? null : JSON.parse(raw);
}

function inventory(options) {
  const root = store.rootFor(options);
  const scope = options.scope || "project";
  const base = scope === "user" ? path.dirname(root) : fs.realpathSync(options.workspace || process.cwd());
  const candidates = scope === "user" ? ["context.md", "lessons.md", "tasks/context.md", "tasks/lessons.md"] : ["tasks/context.md", "tasks/lessons.md"];
  return candidates.flatMap((relative) => {
    const text = store.readOptional(store.safePath(base, relative), MAX_SOURCE);
    return text === null ? [] : [{ path: relative, hash: store.hash(text), text }];
  });
}

function marker(root) {
  const value = readJson(store.safePath(root, ".format.json"));
  if (value && (value.schema !== "csl-memory-store/v1" || !Number.isSafeInteger(value.version) || value.version !== VERSION)) store.fail("UNSUPPORTED_STORE", "Unknown memory store version; do not downgrade or overwrite");
  return value;
}

function journals(root) {
  let names;
  try { names = fs.readdirSync(store.safePath(root, ".history")); } catch (error) { if (error.code === "ENOENT") return []; throw error; }
  return names.filter((name) => name.endsWith(".json")).map((name) => readJson(store.safePath(root, `.history/${name}`))).filter((record) => record?.status === "committed");
}

// The old approved import remains evidence, never a second active read source.
// Match each source unit, not the whole file: unrelated later edits must not
// import all 48 previously migrated entries again.
function priorImports(root, records) {
  const known = new Map();
  let names;
  try { names = fs.readdirSync(store.safePath(root, ".migrations")); } catch (error) { if (error.code === "ENOENT") return known; throw error; }
  for (const digest of names.filter((name) => /^[a-f0-9]{64}$/.test(name))) {
    const raw = store.readOptional(store.safePath(root, `.migrations/${digest}/preview.json`), MAX_PLAN);
    if (raw === null) continue;
    if (store.hash(raw) !== digest) store.fail("BACKUP_CONFLICT", "Historical migration preview identity changed");
    const plan = JSON.parse(raw);
    if (plan.schema !== "csl-memory-migration/v1" || !Array.isArray(plan.items)) store.fail("INVALID_MIGRATION", "Historical preview is invalid");
    for (const item of plan.items) {
      if (item.decision === "archive") {
        known.set(`${item.key}:${item.sourceHash}`, { disposition: "previously-archived", preview: digest });
      } else if (item.decision === "import") {
        const record = records.find((entry) => entry.entryId === item.id && entry.source === `migration:${digest}:${store.hash(item.key)}`);
        if (!record) continue;
        if (store.get(root, item.id).revision === 0) store.fail("MISSING_IMPORTED_ENTRY", `Previously imported entry is missing: ${item.id}`);
        known.set(`${item.key}:${item.sourceHash}`, { disposition: "previously-imported", id: item.id, transaction: record.id });
      }
    }
  }
  return known;
}

function preview(options = {}) {
  const root = store.rootFor(options);
  const current = marker(root);
  if (current) return { version: VERSION, root, scope: options.scope || "project", status: "current", sources: [], items: [] };
  const sources = inventory(options);
  const records = journals(root);
  const known = priorImports(root, records);
  const items = sources.flatMap((source) => units(source.text, source.path).flatMap((unit) => {
    const previous = known.get(`${unit.key}:${unit.sourceHash}`);
    if (previous) return [{ key: unit.key, sourceHash: unit.sourceHash, ...previous }];
    if (!unit.raw.trim()) return [{ key: unit.key, sourceHash: unit.sourceHash, disposition: "backup-only" }];
    // Split only for the legacy parser's absolute safety limit. Preserve the
    // complete original in backups; ordinary agent writes obey smaller budgets.
    const chars = [...unit.raw];
    const chunks = chars.length > 80000 ? Array.from({ length: Math.ceil(chars.length / 8000) }, (_, i) => chars.slice(i * 8000, (i + 1) * 8000).join("")) : [unit.raw];
    return chunks.map((chunk, index) => {
      const identity = store.hash(`${unit.key}:${unit.sourceHash}:${index}`);
      const id = `import-${identity.slice(0, 32)}`;
      const sourceKey = `auto-upgrade-v${VERSION}:${identity}`;
      const existing = store.get(root, id);
      const record = records.find((entry) => entry.entryId === id && entry.source === sourceKey);
      if (existing.revision && !record) store.fail("DESTINATION_CONFLICT", `Migration destination already exists without matching provenance: ${id}`);
      if (record && !existing.revision) store.fail("MISSING_IMPORTED_ENTRY", `Imported entry disappeared: ${id}`);
      const title = [...unit.title].slice(0, chunks.length > 1 ? 48 : 60).join("") + (chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : "");
      return {
        key: unit.key, sourceHash: unit.sourceHash, id, disposition: record ? "already-imported" : "import", transaction: record?.id,
        mutation: { id, operation: "put", expected: { revision: 0, hash: null }, reason: "版本升级：保真导入旧知识；后续由Memory Agent核实、合并与整理，不覆盖已有有效修改。", source: sourceKey,
          content: { title, summary: `从旧${path.basename(source.path)}导入；适用性及当前权威来源需核对。`, type: source.path.endsWith("lessons.md") ? "experience" : "fact", sources: [`legacy:${source.path}; sha256:${source.hash}; unit:${unit.key}`], body: chunk.trim() } },
      };
    });
  }));
  for (const item of items) if (item.mutation) store.validateMutation(item.mutation, false);
  return { version: VERSION, root, scope: options.scope || "project", status: "needed", sources, items };
}

function ensure(options = {}, recovered = false) {
  const root = store.rootFor(options);
  if (marker(root)) return { version: VERSION, root, scope: options.scope || "project", status: "current" };
  try { return store.withLock(root, () => {
    if (marker(root)) return { version: VERSION, root, scope: options.scope || "project", status: "current" };
    const plan = preview(options);
    const identity = store.hash(JSON.stringify(plan.sources.map(({ path: file, hash }) => [file, hash])));
    const relative = `.migrations/auto-v${VERSION}-${identity}`;
    fs.mkdirSync(store.safePath(root, `${relative}/sources`), { recursive: true, mode: 0o700 });
    for (const source of plan.sources) {
      const file = store.safePath(root, `${relative}/sources/${source.path.replaceAll("/", "--")}`);
      const old = store.readOptional(file, MAX_SOURCE);
      if (old !== null && store.hash(old) !== source.hash) store.fail("BACKUP_CONFLICT", "Upgrade backup differs from source identity");
      if (old === null) store.atomicWrite(file, source.text);
    }
    const state = { schema: "csl-memory-upgrade/v2", status: "importing", scope: plan.scope, sources: plan.sources.map(({ text, ...source }) => source), effects: [] };
    const stateFile = store.safePath(root, `${relative}/state.json`);
    const persist = () => store.atomicWrite(stateFile, `${JSON.stringify(state, null, 2)}\n`);
    const checkSources = () => {
      const now = inventory(options);
      if (JSON.stringify(now.map(({ path: file, hash }) => [file, hash])) !== JSON.stringify(plan.sources.map(({ path: file, hash }) => [file, hash]))) store.fail("SOURCE_CHANGED", "Source changed during upgrade; preserved effects can be reconciled on the next attempt");
    };
    persist();
    for (const item of plan.items) {
      checkSources();
      let transaction = item.transaction;
      if (item.disposition === "import") transaction = store.commit(root, item.mutation, { actor: "automatic-upgrade", preserveLegacy: true }).transaction;
      state.effects.push({ key: item.key, sourceHash: item.sourceHash, id: item.id, disposition: item.disposition, transaction });
      persist();
    }
    checkSources();
    // Rebuild even for empty/new stores. Pending transactions are recovered by
    // withLock before the upgrade starts. Never erase old pending proposals.
    const pages = store.indexPages(root);
    for (const page of pages.slice(1)) {
      const file = store.safePath(root, page.file);
      fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
      store.atomicWrite(file, page.content);
    }
    store.atomicWrite(store.safePath(root, "index.md"), pages[0].content);
    state.status = "completed";
    persist();
    store.atomicWrite(store.safePath(root, ".format.json"), `${JSON.stringify({ schema: "csl-memory-store/v1", version: VERSION, completed: new Date().toISOString(), migration: relative, originalSourcesPreserved: true }, null, 2)}\n`);
    return { version: VERSION, root, scope: plan.scope, status: "upgraded", effects: state.effects, originalSourcesPreserved: true };
  }); } catch (error) {
    if (error.code !== "LOCKED" || recovered) throw error;
    // Recovery proves the local owner is dead; it refuses live/unknown locks.
    // A second collision is reported, never spun on or force-unlocked.
    store.recover(options);
    return ensure(options, true);
  }
}

function ensureWorkspace(workspace = process.cwd()) {
  return [ensure({ scope: "user", workspace }), ensure({ scope: "project", workspace })];
}

module.exports = { VERSION, units, inventory, preview, ensure, ensureWorkspace };
