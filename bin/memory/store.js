"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const YAML = require("yaml");

const recall = require("./recall-index.js");
const SCHEMA = "csl-memory/v2";
const STORE_VERSION = 4;
const WRITE_LOCK = ".write-lock-v4";
const LEGACY_FENCE = "csl-memory-write-fence/v3";
const TYPES = new Set(["fact", "preference", "experience", "reference"]);
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BYTES = 256 * 1024;
const BUDGETS = Object.freeze({ title: 60, summary: 200, bodyTarget: 4000, body: 8000, indexPage: 4000, projectChips: 20, projectBodyWords: 1000 });
const wordSegmenter = new Intl.Segmenter("zh", { granularity: "word" });
const words = (value) => {
  let count = 0;
  for (const segment of wordSegmenter.segment(value)) if (segment.isWordLike) count++;
  return count;
};
const characters = (value) => [...value].length;

function fail(code, message, details) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  throw error;
}

function hash(bytes) {
  return crypto.createHash("sha256").update(bytes).digest("hex");
}

function validateId(id) {
  if (typeof id !== "string" || id.length > 100 || !ID.test(id)) fail("INVALID_ID", "Invalid memory ID");
  return id;
}

function text(value, name, max = 1000) {
  if (typeof value !== "string" || !value.trim() || value.length > max || value.includes("\0")) {
    fail("INVALID_INPUT", `${name} must be non-empty text, at most ${max} characters`);
  }
  return value;
}

function object(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_INPUT", `${name} must be an object`);
  return value;
}

function exactKeys(value, allowed, name) {
  object(value, name);
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail("INVALID_INPUT", `Unknown ${name} field: ${key}`);
  }
}

// Refuse symlinks below the selected root. This is a filesystem correctness
// boundary, not a sandbox against a local user who can modify the store.
function safePath(root, relative) {
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) fail("INVALID_PATH", "Path escapes memory root");
  const parts = path.relative(root, target).split(path.sep).filter(Boolean);
  let current = root;
  for (const part of ["", ...parts]) {
    current = part ? path.join(current, part) : current;
    try {
      if (fs.lstatSync(current).isSymbolicLink()) fail("SYMLINK", `Memory paths cannot be symbolic links: ${current}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return target;
}

function rootFor({ scope = "project", workspace = process.cwd(), home = process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit") } = {}) {
  if (!["user", "project"].includes(scope)) fail("INVALID_SCOPE", "Scope must be user or project");
  const base = scope === "user" ? path.resolve(home) : path.join(fs.realpathSync(workspace), ".csl-agent-kit");
  // Check the data directory itself too, before resolving its memory child.
  safePath(base, "");
  return safePath(base, "memory");
}

function readOptional(file, maxBytes = MAX_BYTES) {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) fail("INVALID_FILE", `Not a regular file: ${file}`);
    if (stat.size > maxBytes) fail("TOO_LARGE", `File exceeds ${maxBytes} bytes: ${file}`);
    const bytes = fs.readFileSync(file);
    const value = bytes.toString("utf8");
    if (!bytes.equals(Buffer.from(value, "utf8"))) fail("INVALID_ENCODING", `File must contain valid UTF-8: ${file}`);
    return value;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function readJson(file, maxBytes = 4 * MAX_BYTES) {
  const raw = readOptional(file, maxBytes);
  return raw === null ? null : JSON.parse(raw);
}

function syncDirectory(directory) {
  const fd = fs.openSync(directory, "r");
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}

function atomicWrite(file, content) {
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  let fd;
  try {
    fd = fs.openSync(temporary, "wx", 0o600);
    fs.writeFileSync(fd, content);
    fs.fsyncSync(fd);
    fs.closeSync(fd);
    fd = undefined;
    fs.renameSync(temporary, file);
    syncDirectory(path.dirname(file));
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    fs.rmSync(temporary, { force: true });
  }
}

function encodeJson(value) { return `${JSON.stringify(value, null, 2)}\n`; }

function validateContent(content, enforceBudget = false, scope = "user") {
  exactKeys(content, ["title", "summary", "type", "sources", "body", "retrieval"], "content");
  if (content.retrieval !== undefined) recall.validateRetrieval(content.retrieval);
  text(content.title, "title", 160);
  text(content.summary, "summary", 600);
  if (/[\r\n]/.test(content.title + content.summary)) fail("INVALID_INPUT", "Title and summary must be single-line text");
  if (!TYPES.has(content.type)) fail("INVALID_TYPE", "Unknown memory type");
  if (!Array.isArray(content.sources) || !content.sources.length || content.sources.length > 30) {
    fail("INVALID_INPUT", "Provide between 1 and 30 sources");
  }
  content.sources.forEach((source) => text(source, "source", 2000));
  text(content.body, "body", 100000);
  if (enforceBudget) {
    for (const field of scope === "project" ? ["title", "summary"] : ["title", "summary", "body"]) {
      if (characters(content[field]) > BUDGETS[field]) fail("MEMORY_BUDGET", `${field} exceeds ${BUDGETS[field]} characters; shorten metadata or split the topic without losing valid knowledge`, { field, limit: BUDGETS[field], actual: characters(content[field]) });
    }
  }
  return content;
}

function encodeEntry(metadata, body) {
  const raw = `---\n${YAML.stringify(metadata)}---\n\n${body.trim()}\n`;
  if (Buffer.byteLength(raw) > MAX_BYTES) fail("TOO_LARGE", "Memory exceeds maximum size");
  return raw;
}

function parseEntry(raw, id) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) fail("INVALID_FORMAT", `Missing frontmatter: ${id}`);
  const metadata = YAML.parse(match[1], { maxAliasCount: 0, uniqueKeys: true });
  exactKeys(metadata, ["schema", "id", "revision", "type", "title", "summary", "sources", "updated", "deleted", ...(metadata?.schema === SCHEMA ? ["retrieval"] : [])], "metadata");
  if (![SCHEMA, "csl-memory/v1"].includes(metadata.schema)) fail("UNSUPPORTED_SCHEMA", `Unsupported memory schema: ${metadata.schema}`);
  if (metadata.id !== id || !Number.isSafeInteger(metadata.revision) || metadata.revision < 1) fail("INVALID_FORMAT", `Invalid identity or revision: ${id}`);
  if (typeof metadata.deleted !== "boolean" || !Number.isFinite(Date.parse(metadata.updated))) fail("INVALID_FORMAT", `Invalid lifecycle metadata: ${id}`);
  const body = match[2].trim();
  validateContent({ title: metadata.title, summary: metadata.summary, type: metadata.type, sources: metadata.sources, body, ...(metadata.retrieval === undefined ? {} : { retrieval: metadata.retrieval }) });
  return { ...metadata, body, hash: hash(raw), exists: !metadata.deleted };
}

function get(root, id) {
  validateId(id);
  const raw = readOptional(safePath(root, `entries/${id}.md`));
  return raw === null ? { id, exists: false, deleted: false, revision: 0, hash: null } : parseEntry(raw, id);
}

function entries(root) {
  let names;
  try { names = fs.readdirSync(safePath(root, "entries")); } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  return names.filter((name) => name.endsWith(".md")).sort().map((name) => get(root, name.slice(0, -3)));
}

function list(root, { query = "", offset = 0, limit = 20, fullText = false } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    fail("INVALID_PAGE", "offset must be non-negative; limit must be 1..100");
  }
  if (typeof query !== "string" || query.length > 1000) fail("INVALID_QUERY", "Invalid search query");
  // Entries remain authoritative even after a crash between entry and index
  // publication. Reads never take the maintenance lock or wait for an Agent.
  const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = entries(root).filter((entry) => {
    if (!entry.exists) return false;
    const searchable = `${entry.id} ${entry.title} ${entry.summary} ${entry.type} ${JSON.stringify(entry.retrieval || {})}${fullText ? ` ${entry.body}` : ""}`.toLocaleLowerCase();
    return words.every((word) => searchable.includes(word));
  });
  return {
    schema: "csl-memory-list/v1", total: matches.length, offset, limit,
    nextOffset: offset + limit < matches.length ? offset + limit : null,
    items: matches.slice(offset, offset + limit).map(({ id, title, summary, type, revision, hash: digest }) => ({ id, title, summary, type, revision, hash: digest, file: `entries/${id}.md` })),
  };
}

function indexScope(root) {
  const marker = readJson(safePath(root, ".format.json"));
  const scope = marker?.scope || readJson(safePath(root, ".upgrade-v3.json"), Infinity)?.scope;
  if (scope && !["user", "project"].includes(scope)) fail("INVALID_SCOPE", "Invalid stored memory scope");
  return scope || (root === rootFor({ scope: "user" }) ? "user" : "project");
}

function indexPages(root) {
  return recall.compile({ entries: entries(root), scope: indexScope(root), budget: BUDGETS.indexPage }).files;
}

function indexText(root) { return indexPages(root)[0].content; }

function rebuildIndex(root) {
  try {
    const pages = indexPages(root);
    const manifest = pages.find(page => page.file.endsWith("/manifest.json"));
    if (manifest) for (const directory of ["cards", "topics"]) fs.mkdirSync(safePath(root, `${path.dirname(manifest.file)}/${directory}`), { recursive: true, mode: 0o700 });
    // Publish immutable generation files before switching the root pointer.
    for (const page of pages.slice(1)) {
      const file = safePath(root, page.file);
      fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
      const old = readOptional(file, Math.max(MAX_BYTES, Buffer.byteLength(page.content)));
      if (old !== null && old !== page.content) fail("INDEX_COLLISION", "Immutable index generation has different bytes", { file: page.file });
      if (old === null) atomicWrite(file, page.content);
    }
    atomicWrite(safePath(root, "index.md"), pages[0].content);
    // The project index is complete before removing obsolete derived files.
    if (indexScope(root) === "project") fs.rmSync(safePath(root, ".indexes"), { recursive: true, force: true });
    fs.rmSync(safePath(root, ".index-error.json"), { force: true });
  } catch (error) {
    try { atomicWrite(safePath(root, ".index-error.json"), encodeJson({ at: new Date().toISOString(), code: error.code || "INDEX_ERROR", message: error.message })); } catch { /* The original failure remains visible to the caller. */ }
    throw error;
  }
}

function initialize(root) {
  for (const dir of ["", "entries", ".history", ".proposals"]) fs.mkdirSync(safePath(root, dir), { recursive: true, mode: 0o700 });
}

function assertUpgradeService(options = {}) {
  const serviceRoot = rootFor({ ...options, scope: "user" });
  const descriptor = readJson(safePath(serviceRoot, ".service/daemon.json"));
  if (!descriptor || descriptor.protocol === STORE_VERSION) return;
  const owner = readJson(safePath(serviceRoot, ".service/daemon.lock"));
  if (!owner || owner.host !== os.hostname() || !Number.isSafeInteger(owner.pid) || owner.pid < 1) fail("SERVICE_UPGRADE_REQUIRED", "Old Memory service ownership is unverifiable; inspect before upgrade");
  try { process.kill(owner.pid, 0); } catch (error) { if (error.code === "ESRCH") return; throw error; }
  fail("SERVICE_UPGRADE_REQUIRED", "Stop the older shared Memory service at an idle boundary before upgrading data");
}

function fenceLegacyWriter(root, recoveryOwned = false, lockName = ".write-lock") {
  const file = safePath(root, lockName);
  const isFence = value => value?.schema === LEGACY_FENCE && value.host === "csl-memory-format-v3" && value.pid === 0;
  if (isFence(readJson(file))) return;
  const recoveryFile = safePath(root, ".recovery-lock");
  let guard;
  if (!recoveryOwned) {
    try { guard = fs.openSync(recoveryFile, "wx", 0o600); } catch (error) {
      if (error.code === "EEXIST") fail("LOCKED", "Legacy lock recovery is active or requires inspection");
      throw error;
    }
  }
  try {
    const old = readJson(file);
    if (isFence(old)) return;
    if (old) {
      if (old.host !== os.hostname() || !Number.isSafeInteger(old.pid) || old.pid < 1) fail("LOCKED", "Legacy writer ownership is unverifiable");
      try { process.kill(old.pid, 0); fail("LOCKED", "A legacy writer is still alive"); } catch (error) { if (error.code !== "ESRCH") throw error; }
      fs.unlinkSync(file);
    }
    let fd;
    try { fd = fs.openSync(file, "wx", 0o600); } catch (error) {
      if (error.code === "EEXIST") fail("LOCKED", "A legacy writer acquired the lock during upgrade");
      throw error;
    }
    try {
      // Old writers use this path. Its deliberately non-process owner makes
      // old recovery fail closed; v3 uses a distinct process lock instead.
      fs.writeFileSync(fd, encodeJson({ schema: LEGACY_FENCE, host: "csl-memory-format-v3", pid: 0, reason: "Permanent format fence; do not delete to run an older writer." }));
      fs.fsyncSync(fd);
    } finally { fs.closeSync(fd); }
    syncDirectory(root);
  } finally {
    if (guard !== undefined) { fs.closeSync(guard); fs.unlinkSync(recoveryFile); }
  }
}

function recover(options) {
  assertUpgradeService(options);
  const root = rootFor(options);
  initialize(root);
  const recoveryFile = safePath(root, ".recovery-lock");
  let fd;
  try { fd = fs.openSync(recoveryFile, "wx", 0o600); } catch (error) {
    if (error.code === "EEXIST") fail("LOCKED", "Another recovery is active or its recovery lock needs inspection");
    throw error;
  }
  try {
    fs.writeFileSync(fd, encodeJson({ pid: process.pid, host: os.hostname() }));
    const lockFile = safePath(root, WRITE_LOCK);
    const lock = readJson(lockFile);
    if (lock) {
      if (lock.host !== os.hostname() || !Number.isSafeInteger(lock.pid) || lock.pid < 1) fail("LOCKED", "Cannot prove lock belongs to a dead local writer");
      try {
        process.kill(lock.pid, 0);
        fail("LOCKED", "Writer PID is still alive; recovery will not interrupt it");
      } catch (error) {
        if (error.code !== "ESRCH") throw error;
      }
      // Only recovery removes stale locks, and recovery itself is serialized.
      fs.unlinkSync(lockFile);
      syncDirectory(root);
    }
    return withLock(root, () => { rebuildIndex(root); return { recovered: true, root }; }, { recoveryOwned: true });
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(recoveryFile);
  }
}

function withLock(root, fn, { recoveryOwned = false } = {}) {
  const marker = readJson(safePath(root, ".format.json"));
  if (marker && (marker.schema !== "csl-memory-store/v1" || ![2, 3, STORE_VERSION].includes(marker.version))) fail("UNSUPPORTED_STORE", "Refusing writes to an unknown memory store format");
  initialize(root);
  const file = safePath(root, WRITE_LOCK);
  let fd;
  try { fd = fs.openSync(file, "wx", 0o600); } catch (error) {
    if (error.code === "EEXIST") fail("LOCKED", "Memory writer is busy or an interrupted lock requires inspection", { lock: file });
    throw error;
  }
  try {
    fs.writeFileSync(fd, encodeJson({ pid: process.pid, host: os.hostname(), created: new Date().toISOString() }));
    fs.fsyncSync(fd);
    fenceLegacyWriter(root, recoveryOwned);
    fenceLegacyWriter(root, recoveryOwned, ".write-lock-v3");
    recoverPending(root);
    return fn();
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(file);
    syncDirectory(root);
  }
}

function validateExpected(expected) {
  exactKeys(expected, ["revision", "hash"], "expected");
  if (!Number.isSafeInteger(expected.revision) || expected.revision < 0 ||
      !(expected.hash === null && expected.revision === 0 || typeof expected.hash === "string" && /^[a-f0-9]{64}$/.test(expected.hash) && expected.revision > 0)) {
    fail("INVALID_EXPECTATION", "Provide the revision and SHA256 returned by read; new entries use 0/null");
  }
}

function compare(current, expected) {
  validateExpected(expected);
  if (current.revision !== expected.revision || current.hash !== expected.hash) {
    fail("CONFLICT", "Memory changed; read again before preparing a new mutation", { current: { revision: current.revision, hash: current.hash } });
  }
}

function validateMutation(input, enforceBudget = true, scope = "user") {
  exactKeys(input, ["id", "operation", "expected", "content", "reason", "source", "session", "task"], "mutation");
  validateId(input.id);
  if (!["put", "delete"].includes(input.operation)) fail("INVALID_OPERATION", "Operation must be put or delete");
  validateExpected(input.expected);
  text(input.reason, "reason", 4000);
  text(input.source, "source", 2000);
  for (const field of ["session", "task"]) if (input[field] !== undefined) text(input[field], field, 200);
  if (input.operation === "put") validateContent(input.content, enforceBudget, scope);
  else if (input.content !== undefined) fail("INVALID_INPUT", "Delete cannot include replacement content");
  return input;
}

function commit(root, mutation, { actor, proposal = null, preserveLegacy = false, restoreHistoricalReferences = false, referenceRoots, deferIndex = false } = {}) {
  const scope = indexScope(root);
  validateMutation(mutation, !preserveLegacy, scope);
  text(actor, "actor", 100);
  const current = get(root, mutation.id);
  compare(current, mutation.expected);
  if (mutation.operation === "put" && scope === "project" && !deferIndex) {
    const actual = words(mutation.content.body);
    if (actual > BUDGETS.projectBodyWords) fail("MEMORY_BUDGET", "Project chip exceeds 1000 words; condense without losing conditions or sources", { field: "body", unit: "words", limit: BUDGETS.projectBodyWords, actual });
    if (!current.exists) {
      const count = entries(root).filter(entry => entry.exists).length;
      if (count >= BUDGETS.projectChips) fail("MEMORY_CAPACITY", "Project memory is full; merge into an existing chip, verify it, and retire redundant chips before adding one", { limit: BUDGETS.projectChips, actual: count });
    }
  }
  if (mutation.operation === "delete" && !current.exists) fail("NOT_FOUND", "Cannot delete an absent memory");
  if (current.revision >= Number.MAX_SAFE_INTEGER) fail("REVISION_EXHAUSTED", "Revision limit reached");
  const content = mutation.operation === "put" ? mutation.content : current;
  const retrieval = recall.validateRetrieval(content.retrieval === undefined ? current.retrieval : content.retrieval, { scope: indexScope(root), id: mutation.id });
  // Budget preservation is not permission to introduce unresolved references.
  // Only exact historical restoration may retain historical dangling targets.
  if (mutation.operation === "put" && !restoreHistoricalReferences) {
    const previousLinks = new Set((current.retrieval?.links || []).map(link => JSON.stringify(link)));
    for (const link of retrieval.links) {
      if (previousLinks.has(JSON.stringify(link))) continue;
      const targetRoot = link.scope === indexScope(root) ? root : referenceRoots?.[link.scope];
      if (!targetRoot) fail("REFERENCE_SCOPE_REQUIRED", "Cross-scope references need the current workspace and user roots");
      if (!get(targetRoot, link.id).exists) fail("REFERENCE_NOT_FOUND", "New relationship target must be an active chip", { link });
    }
  }
  const after = encodeEntry({
    schema: SCHEMA, id: mutation.id, revision: current.revision + 1,
    type: content.type, title: content.title, summary: content.summary, sources: content.sources,
    updated: new Date().toISOString(), deleted: mutation.operation === "delete", retrieval,
  }, mutation.operation === "put" ? content.body : "此条目已删除；历史正文保留在审计记录中。");
  // Reject invalid relationship graphs before preparing any persistent change.
  const candidate = parseEntry(after, mutation.id);
  recall.compile({ entries: [...entries(root).filter(entry => entry.id !== mutation.id), candidate], scope: indexScope(root), budget: BUDGETS.indexPage });
  const before = readOptional(safePath(root, `entries/${mutation.id}.md`));
  return writeChange(root, mutation, before, after, actor, proposal, deferIndex);
}

function writeChange(root, mutation, before, after, actor, proposal = null, deferIndex = false) {
  const transaction = {
    schema: "csl-memory-change/v1", id: crypto.randomUUID(), entryId: mutation.id,
    status: "prepared", at: new Date().toISOString(), actor, proposal, deferIndex,
    reason: mutation.reason, source: mutation.source, session: mutation.session || null, task: mutation.task || null,
    before, after, beforeHash: before === null ? null : hash(before), afterHash: hash(after),
  };
  const journal = safePath(root, `.history/${transaction.id}.json`);
  atomicWrite(journal, encodeJson(transaction));
  atomicWrite(safePath(root, ".pending.json"), encodeJson({ transaction: transaction.id }));
  // Once the pending marker is durable, failure may mean the entry committed.
  // Never claim rollback or repeat the mutation; recovery decides by hash.
  try {
    atomicWrite(safePath(root, `entries/${mutation.id}.md`), after);
    finishTransaction(root, transaction);
  } catch (error) {
    fail("RECOVERY_REQUIRED", "Mutation may have committed; inspect history and recover before retrying", { transaction: transaction.id, cause: error.message });
  }
  return { transaction: transaction.id, entry: get(root, mutation.id) };
}

function convertEntry(root, id) {
  const before = readOptional(safePath(root, `entries/${validateId(id)}.md`));
  if (before === null) fail("NOT_FOUND", "Chip disappeared during schema upgrade");
  const current = parseEntry(before, id);
  if (current.schema === SCHEMA) return { duplicate: true, entry: current };
  if (current.revision >= Number.MAX_SAFE_INTEGER) fail("REVISION_EXHAUSTED", "Revision limit reached");
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(before);
  const metadata = YAML.parse(match[1], { maxAliasCount: 0, uniqueKeys: true });
  const after = `---\n${YAML.stringify({ ...metadata, schema: SCHEMA, revision: current.revision + 1, updated: new Date().toISOString() })}---\n${match[2]}`;
  if (Buffer.byteLength(after) > MAX_BYTES) fail("TOO_LARGE", "Schema upgrade needs manual handling; original preserved");
  parseEntry(after, id);
  return writeChange(root, { id, reason: "格式升级：保留身份、来源、正文与墓碑，仅升级schema和revision。", source: `schema-upgrade-v3:${id}:${current.hash}` }, before, after, "automatic-upgrade", null, true);
}

function inspectIndex(options = {}) {
  const root = rootFor(options);
  const first = readOptional(safePath(root, "index.md"));
  const pending = readJson(safePath(root, ".pending.json"));
  const marker = readJson(safePath(root, ".format.json"));
  const second = readOptional(safePath(root, "index.md"));
  const match = second && /^---\n([\s\S]*?)\n---\n/.exec(second);
  const metadata = match ? YAML.parse(match[1], { maxAliasCount: 0, uniqueKeys: true }) : null;
  const currentStore = marker?.schema === "csl-memory-store/v1" && marker.version === STORE_VERSION && marker.scope === (options.scope || "project");
  const currentLayout = options.scope !== "user"
    ? metadata?.layout === "single" && metadata?.entries === "entries" && !metadata?.cards && !metadata?.topics && !metadata?.manifest
    : metadata?.cards === `.indexes/${metadata?.generation}/cards` && metadata?.cardCount === metadata?.count;
  const currentIndex = metadata?.schema === recall.SCHEMA && metadata.scope === marker?.scope && /^[a-f0-9]{64}$/.test(metadata.generation || "") && currentLayout && Number.isSafeInteger(metadata.count) && metadata.count >= 0;
  const lastBuildError = readJson(safePath(root, ".index-error.json"));
  const state = first !== second ? "changed" : pending ? "pending" : !currentStore ? "upgrade-required" : !currentIndex ? "invalid-index" : metadata.missingReferences || lastBuildError ? "degraded" : "published";
  return { root, state, pending: Boolean(pending), formatVersion: marker?.version || null, lastBuildError, overview: second, index: metadata, budget: budgetStatus(root), integrity: "header-only; verify relevant entry hashes and relations before use" };
}

function transactionId(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)) fail("INVALID_ID", "Invalid transaction/proposal ID");
  return id;
}

function finishTransaction(root, transaction) {
  if (transaction.deferIndex) {
    const upgrade = readJson(safePath(root, ".upgrade-v3.json"), Infinity);
    if (upgrade?.schema !== "csl-memory-upgrade/v3" || !["user", "project"].includes(upgrade.scope)) fail("RECOVERY_REQUIRED", "Deferred index transaction requires its upgrade state");
  } else rebuildIndex(root);
  atomicWrite(safePath(root, `.history/${transactionId(transaction.id)}.json`), encodeJson({ ...transaction, status: "committed" }));
  if (transaction.proposal) {
    const file = safePath(root, `.proposals/${transactionId(transaction.proposal)}.json`);
    const proposal = readJson(file);
    if (!proposal) fail("INVALID_PROPOSAL", "Approved proposal is missing");
    atomicWrite(file, encodeJson({ ...proposal, status: "approved", transaction: transaction.id }));
  }
  fs.unlinkSync(safePath(root, ".pending.json"));
  syncDirectory(root);
}

function recoverPending(root) {
  const pending = readJson(safePath(root, ".pending.json"));
  if (!pending) return;
  const file = safePath(root, `.history/${transactionId(pending.transaction)}.json`);
  const transaction = readJson(file);
  if (!transaction || transaction.schema !== "csl-memory-change/v1") fail("CORRUPT_JOURNAL", "Cannot recover missing or unsupported transaction");
  validateId(transaction.entryId);
  const raw = readOptional(safePath(root, `entries/${transaction.entryId}.md`));
  const digest = raw === null ? null : hash(raw);
  if (digest === transaction.afterHash) return finishTransaction(root, transaction);
  if (digest !== transaction.beforeHash) fail("RECOVERY_CONFLICT", "Entry changed outside the pending transaction; manual reconciliation required");
  atomicWrite(file, encodeJson({ ...transaction, status: "aborted" }));
  fs.unlinkSync(safePath(root, ".pending.json"));
  syncDirectory(root);
}

function mutate(options, mutation) {
  require("./migration.js").ensure(options);
  const root = rootFor(options);
  const referenceRoots = Object.fromEntries(["user", "project"].map(scope => [scope, rootFor({ ...options, scope })]));
  return withLock(root, () => commit(root, mutation, { actor: options.actor || "memory-agent", referenceRoots }));
}

function propose(options, mutation) {
  require("./migration.js").ensure(options);
  validateMutation(mutation, true, options.scope || "project");
  const root = rootFor(options);
  return withLock(root, () => {
    const current = get(root, mutation.id);
    compare(current, mutation.expected);
    if (mutation.operation === "delete" && !current.exists) fail("NOT_FOUND", "Cannot propose deleting an absent memory");
    const id = crypto.randomUUID();
    const proposal = { schema: "csl-memory-proposal/v1", id, scope: options.scope, status: "pending", created: new Date().toISOString(), mutation };
    atomicWrite(safePath(root, `.proposals/${id}.json`), encodeJson(proposal));
    return { ...proposal, digest: hash(encodeJson(proposal)) };
  });
}

function proposalDetail(options, id) {
  const root = rootFor(options);
  const raw = readOptional(safePath(root, `.proposals/${transactionId(id)}.json`), 4 * MAX_BYTES);
  if (raw === null) fail("NOT_FOUND", "Proposal not found");
  const proposal = JSON.parse(raw);
  if (proposal.schema !== "csl-memory-proposal/v1" || proposal.id !== id || proposal.scope !== options.scope) fail("INVALID_PROPOSAL", "Proposal identity or scope mismatch");
  validateMutation(proposal.mutation, false);
  return { ...proposal, digest: hash(raw), current: get(root, proposal.mutation.id) };
}

// Call only after an interactive human approval of this exact digest. Prompt and
// CLI boundaries intentionally do not defend against direct local API calls.
function decide(options, id, digest, decision) {
  if (!["approve", "reject"].includes(decision)) fail("INVALID_DECISION", "Invalid decision");
  require("./migration.js").ensure(options);
  const root = rootFor(options);
  return withLock(root, () => {
    const proposal = proposalDetail(options, id);
    if (proposal.digest !== digest || proposal.status !== "pending") fail("CONFLICT", "Proposal changed or was already decided");
    if (decision === "approve") {
      const referenceRoots = Object.fromEntries(["user", "project"].map(scope => [scope, rootFor({ ...options, scope })]));
      return commit(root, proposal.mutation, { actor: "user-approved", proposal: id, preserveLegacy: true, referenceRoots });
    }
    const { digest: ignoredDigest, current: ignoredCurrent, ...record } = proposal;
    atomicWrite(safePath(root, `.proposals/${id}.json`), encodeJson({ ...record, status: "rejected", decided: new Date().toISOString() }));
    return { id, status: "rejected" };
  });
}

function historyRecords(options) {
  const root = rootFor(options);
  let names;
  try { names = fs.readdirSync(safePath(root, ".history")); } catch (error) { if (error.code === "ENOENT") names = []; else throw error; }
  return names.filter((name) => name.endsWith(".json")).map((name) => {
    const { before, after, ...record } = readJson(safePath(root, `.history/${name}`));
    return record;
  }).sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
}

function history(options, { offset = 0, limit = 20 } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail("INVALID_PAGE", "Invalid history page");
  const records = historyRecords(options);
  return { total: records.length, offset, limit, nextOffset: offset + limit < records.length ? offset + limit : null, items: records.slice(offset, offset + limit) };
}

function changeDetail(options, id) {
  const record = readJson(safePath(rootFor(options), `.history/${transactionId(id)}.json`));
  if (!record || record.schema !== "csl-memory-change/v1" || record.id !== id) fail("NOT_FOUND", "Change not found or unsupported");
  return record;
}

function restore(options, id, expected, reason) {
  require("./migration.js").ensure(options);
  const record = changeDetail(options, id);
  if (record.status !== "committed") fail("INVALID_CHANGE", "Only committed changes can be restored");
  const previous = record.before === null ? null : parseEntry(record.before, record.entryId);
  const mutation = { id: record.entryId, operation: previous?.exists ? "put" : "delete", expected, reason, source: `restore:${id}` };
  if (previous?.exists) mutation.content = { title: previous.title, summary: previous.summary, type: previous.type, sources: previous.sources, body: previous.body, retrieval: previous.retrieval || {} };
  // Restore the historical bytes as a new revision, even if legacy content is
  // over today's budget. Never truncate it to make restoration pass.
  const root = rootFor(options);
  return withLock(root, () => commit(root, mutation, { actor: options.actor || "memory-restore", preserveLegacy: true, restoreHistoricalReferences: true }));
}

function reindex(options) {
  require("./migration.js").ensure(options);
  const root = rootFor(options);
  return withLock(root, () => { rebuildIndex(root); return { root, rebuilt: true }; });
}

function budgetStatus(root) {
  if (indexScope(root) !== "project") return null;
  const active = entries(root).filter(entry => entry.exists);
  const oversized = active.map(entry => ({ id: entry.id, words: words(entry.body) })).filter(entry => entry.words > BUDGETS.projectBodyWords);
  return { count: active.length, limit: BUDGETS.projectChips, wordLimit: BUDGETS.projectBodyWords, oversized, overCapacity: active.length > BUDGETS.projectChips };
}

module.exports = { words, budgetStatus, SCHEMA, STORE_VERSION, MAX_BYTES, BUDGETS, characters, fail, hash, rootFor, safePath, get, list, entries, indexText, indexPages, rebuildIndex, inspectIndex, mutate, propose, proposalDetail, decide, history, historyRecords, changeDetail, restore, reindex, recover, readOptional, atomicWrite, validateMutation, withLock, commit, convertEntry, assertUpgradeService };
