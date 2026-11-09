"use strict";

const fs = require("node:fs");
const path = require("node:path");
const store = require("./store.js");

const VERSION = store.STORE_VERSION;
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

function sourceInventory(options = {}) {
  const root = store.rootFor(options);
  const scope = options.scope || "project";
  const base = scope === "user" ? path.dirname(root) : fs.realpathSync(options.workspace || process.cwd());
  const candidates = scope === "user" ? ["context.md", "lessons.md", "tasks/context.md", "tasks/lessons.md"] : ["tasks/context.md", "tasks/lessons.md"];
  const storage = scope === "project" ? require("../../skills/meta/csl-tasks/shared/lib/task-storage.js") : null;
  const layout = storage?.layout(base);
  const manifest = layout?.marker ? storage.manifest(base) : null;
  return candidates.flatMap((relative) => {
    const resolvedPath = manifest ? `${layout.root}${relative.slice(5)}` : relative;
    const entry = manifest?.files.find(item => item.source === relative);
    const text = store.readOptional(store.safePath(base, resolvedPath), MAX_SOURCE);
    if (manifest && (entry || text !== null)) {
      if (!entry || entry.target !== resolvedPath || entry.beforeHash !== entry.afterHash || text === null || store.hash(text) !== entry.beforeHash) store.fail("SOURCE_CHANGED", `Relocated legacy source does not match Task migration evidence: ${relative}`);
    }
    return text === null ? [] : [{ path: relative, resolvedPath, hash: store.hash(text), text }];
  });
}

function inventory(options) {
  return sourceInventory(options).map(({ resolvedPath, ...source }) => source);
}

function marker(root) {
  const value = readJson(store.safePath(root, ".format.json"));
  if (value && (value.schema !== "csl-memory-store/v1" || !Number.isSafeInteger(value.version) || ![2, 3, VERSION].includes(value.version))) store.fail("UNSUPPORTED_STORE", "Unknown memory store version; do not downgrade or overwrite");
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
  const scope = options.scope || "project";
  if (current?.version === VERSION) {
    if (current.scope !== scope) store.fail("INVALID_SCOPE", "Stored scope does not match requested scope");
    return { version: VERSION, root, scope, status: "current", sources: [], items: [] };
  }
  if (current?.version === 3) {
    if (current.scope !== scope) store.fail("INVALID_SCOPE", "Stored scope does not match requested scope");
    return { version: VERSION, root, scope, status: "needed", sources: [], items: [{ disposition: "rebuild-index", layout: scope === "project" ? "single" : "cards" }] };
  }
  if (current?.version === 2) return { version: VERSION, root, scope, status: "needed", sources: [], items: store.entries(root).filter(entry => entry.schema !== store.SCHEMA).map(entry => ({ id: entry.id, sourceHash: entry.hash, disposition: "convert-schema", deleted: entry.deleted })) };
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
      const sourceKey = `auto-upgrade-v2:${identity}`;
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
  const scope = options.scope || "project";
  const current = marker(root);
  if (current?.version === VERSION) {
    if (current.scope !== scope) store.fail("INVALID_SCOPE", "Stored scope does not match requested scope");
    return { version: VERSION, root, scope, status: "current" };
  }
  store.assertUpgradeService(options);
  try { return store.withLock(root, () => {
    const prior = marker(root);
    if (prior?.version === VERSION) {
      if (prior.scope !== scope) store.fail("INVALID_SCOPE", "Stored scope does not match requested scope");
      return { version: VERSION, root, scope, status: "current" };
    }
    if (prior?.version === 3) {
      if (prior.scope !== scope) store.fail("INVALID_SCOPE", "Stored scope does not match requested scope");
      store.rebuildIndex(root);
      store.atomicWrite(store.safePath(root, ".format.json"), `${JSON.stringify({ ...prior, version: VERSION, completed: new Date().toISOString() }, null, 2)}\n`);
      return { version: VERSION, root, scope, status: "upgraded", originalSourcesPreserved: true, budget: store.budgetStatus(root) };
    }
    const plan = preview(options);
    const relative = ".migrations/format-v3";
    for (const dir of [relative, `${relative}/sources`, `${relative}/entries`]) fs.mkdirSync(store.safePath(root, dir), { recursive: true, mode: 0o700 });
    const stateFile = store.safePath(root, ".upgrade-v3.json");
    const previousState = readJson(stateFile, Infinity);
    if (previousState && (previousState.schema !== "csl-memory-upgrade/v3" || previousState.scope !== scope)) store.fail("INVALID_MIGRATION", "Upgrade state identity mismatch");
    const sources = plan.sources.map(({ text, ...source }) => source);
    if (previousState && JSON.stringify(previousState.sources) !== JSON.stringify(sources)) store.fail("SOURCE_CHANGED", "Legacy source changed during an interrupted upgrade; inspect preserved backups");
    const state = previousState || { schema: "csl-memory-upgrade/v3", scope, status: "converting", previousFormat: prior, sources, effects: [], converted: [] };
    const persist = () => store.atomicWrite(stateFile, `${JSON.stringify(state, null, 2)}\n`);
    const backup = (name, bytes) => {
      const target = store.safePath(root, `${relative}/${name}`);
      const existing = store.readOptional(target, Math.max(MAX_SOURCE, Buffer.byteLength(bytes)));
      if (existing === null) store.atomicWrite(target, bytes);
      else if (existing !== bytes) store.fail("BACKUP_CONFLICT", "Upgrade backup differs; refusing overwrite", { name });
    };
    if (!previousState) {
      backup("format.before.json", store.readOptional(store.safePath(root, ".format.json")) || "null\n");
      backup("index.before.md", store.readOptional(store.safePath(root, "index.md")) || "");
    }
    for (const source of plan.sources) backup(`sources/${source.path.replaceAll("/", "--")}`, source.text);
    persist();
    const checkSources = () => {
      if (prior?.version === 2) return;
      const now = inventory(options).map(({ text, ...source }) => source);
      if (JSON.stringify(now) !== JSON.stringify(sources)) store.fail("SOURCE_CHANGED", "Source changed during upgrade; preserved effects need inspection");
    };
    for (const item of plan.items) {
      checkSources();
      if (item.disposition === "import") {
        const result = store.commit(root, item.mutation, { actor: "automatic-upgrade", preserveLegacy: true, deferIndex: true });
        state.effects.push({ id: item.id, sourceHash: item.sourceHash, transaction: result.transaction });
        persist();
      } else if (item.disposition === "already-imported" && !state.effects.some(effect => effect.id === item.id)) {
        state.effects.push({ id: item.id, sourceHash: item.sourceHash, transaction: item.transaction });
        persist();
      }
    }
    const committed = journals(root);
    for (const entry of store.entries(root)) {
      if (entry.schema === store.SCHEMA) {
        const saved = store.readOptional(store.safePath(root, `${relative}/entries/${entry.id}.md`));
        if (saved !== null && !state.converted.some(effect => effect.id === entry.id)) {
          const beforeHash = store.hash(saved);
          const journal = committed.find(record => record.entryId === entry.id && record.source === `schema-upgrade-v3:${entry.id}:${beforeHash}` && record.afterHash === entry.hash);
          if (!journal) store.fail("RECOVERY_CONFLICT", "Converted entry lacks matching upgrade audit", { id: entry.id });
          state.converted.push({ id: entry.id, beforeHash, afterHash: entry.hash, transaction: journal.id });
          persist();
        }
        continue;
      }
      const raw = store.readOptional(store.safePath(root, `entries/${entry.id}.md`));
      backup(`entries/${entry.id}.md`, raw);
      const result = store.convertEntry(root, entry.id);
      state.converted.push({ id: entry.id, beforeHash: entry.hash, afterHash: result.entry.hash, transaction: result.transaction });
      persist();
    }
    checkSources();
    store.rebuildIndex(root);
    state.status = "completed";
    persist();
    store.atomicWrite(store.safePath(root, `${relative}/state.json`), `${JSON.stringify(state, null, 2)}\n`);
    store.atomicWrite(store.safePath(root, ".format.json"), `${JSON.stringify({ schema: "csl-memory-store/v1", version: VERSION, scope, completed: new Date().toISOString(), migration: relative, originalSourcesPreserved: true }, null, 2)}\n`);
    return { version: VERSION, root, scope, status: "upgraded", effects: state.effects, converted: state.converted, originalSourcesPreserved: true };
  }); } catch (error) {
    if (error.code !== "LOCKED" || recovered) throw error;
    store.recover(options);
    return ensure(options, true);
  }
}

function ensureWorkspace(workspace = process.cwd()) {
  return [ensure({ scope: "user", workspace }), ensure({ scope: "project", workspace })];
}

module.exports = { VERSION, units, inventory, sourceInventory, preview, ensure, ensureWorkspace };
