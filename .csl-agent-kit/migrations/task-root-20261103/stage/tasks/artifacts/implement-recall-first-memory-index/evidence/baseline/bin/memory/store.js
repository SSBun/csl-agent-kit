"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const YAML = require("yaml");

const SCHEMA = "csl-memory/v1";
const TYPES = new Set(["fact", "preference", "experience", "reference"]);
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BYTES = 256 * 1024;
const BUDGETS = Object.freeze({ title: 60, summary: 200, bodyTarget: 4000, body: 8000, indexPage: 4000 });
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

function readJson(file) {
  const raw = readOptional(file, 4 * MAX_BYTES);
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

function validateContent(content, enforceBudget = false) {
  exactKeys(content, ["title", "summary", "type", "sources", "body"], "content");
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
    for (const field of ["title", "summary", "body"]) {
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
  exactKeys(metadata, ["schema", "id", "revision", "type", "title", "summary", "sources", "updated", "deleted"], "metadata");
  if (metadata.schema !== SCHEMA) fail("UNSUPPORTED_SCHEMA", `Unsupported memory schema: ${metadata.schema}`);
  if (metadata.id !== id || !Number.isSafeInteger(metadata.revision) || metadata.revision < 1) fail("INVALID_FORMAT", `Invalid identity or revision: ${id}`);
  if (typeof metadata.deleted !== "boolean" || !Number.isFinite(Date.parse(metadata.updated))) fail("INVALID_FORMAT", `Invalid lifecycle metadata: ${id}`);
  const body = match[2].trim();
  validateContent({ title: metadata.title, summary: metadata.summary, type: metadata.type, sources: metadata.sources, body });
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
    const searchable = `${entry.id} ${entry.title} ${entry.summary} ${entry.type}${fullText ? ` ${entry.body}` : ""}`.toLocaleLowerCase();
    return words.every((word) => searchable.includes(word));
  });
  return {
    schema: "csl-memory-list/v1", total: matches.length, offset, limit,
    nextOffset: offset + limit < matches.length ? offset + limit : null,
    items: matches.slice(offset, offset + limit).map(({ id, title, summary, type, revision, hash: digest }) => ({ id, title, summary, type, revision, hash: digest, file: `entries/${id}.md` })),
  };
}

function markdownText(value) { return value.replace(/[\\`*_[\]<>|]/g, "\\$&"); }

function indexPages(root) {
  const active = entries(root).filter((entry) => entry.exists);
  const generation = hash(active.map((entry) => `${entry.id}:${entry.hash}`).join("\n"));
  const groups = [[]];
  let size = 0;
  for (const entry of active) {
    const row = `- [${markdownText(entry.title)}](entries/${entry.id}.md) | ${entry.type} | ${markdownText(entry.summary)}\n  revision: ${entry.revision}; sha256: ${entry.hash}\n`;
    // Reserve room for the header, generation-specific link and relative paths.
    if (size && size + characters(row) > BUDGETS.indexPage - 700) { groups.push([]); size = 0; }
    groups.at(-1).push(row);
    size += characters(row);
  }
  return groups.map((rows, index) => {
    const next = index + 1 < groups.length ? (index === 0 ? `.indexes/${generation}/` : "") + `page-${index + 2}.md` : null;
    const prefix = index === 0 ? "" : "../../";
    const content = `---\nschema: csl-memory-index/v2\ngeneration: ${generation}\ncount: ${active.length}\npage: ${index + 1}\npages: ${groups.length}\n---\n\n# 记忆索引\n\n${rows.join("\n").replaceAll("](entries/", `](${prefix}entries/`)}\n${next ? `[下一页](${next})；当前不是全部记忆。` : "索引已结束。"}\n`;
    if (characters(content) > BUDGETS.indexPage) fail("INDEX_BUDGET", "Index metadata cannot fit a page; inspect oversized legacy metadata");
    return { file: index === 0 ? "index.md" : `.indexes/${generation}/page-${index + 1}.md`, content };
  });
}

function indexText(root) { return indexPages(root)[0].content; }

function rebuildIndex(root) {
  const pages = indexPages(root);
  // Publish immutable generation pages before switching the root pointer.
  for (const page of pages.slice(1)) {
    const file = safePath(root, page.file);
    fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
    atomicWrite(file, page.content);
  }
  atomicWrite(safePath(root, "index.md"), pages[0].content);
}

function initialize(root) {
  for (const dir of ["", "entries", ".history", ".proposals"]) fs.mkdirSync(safePath(root, dir), { recursive: true, mode: 0o700 });
}

function recover(options) {
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
    const lockFile = safePath(root, ".write-lock");
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
    return withLock(root, () => { rebuildIndex(root); return { recovered: true, root }; });
  } finally {
    fs.closeSync(fd);
    fs.unlinkSync(recoveryFile);
  }
}

function withLock(root, fn) {
  initialize(root);
  const file = safePath(root, ".write-lock");
  let fd;
  try { fd = fs.openSync(file, "wx", 0o600); } catch (error) {
    if (error.code === "EEXIST") fail("LOCKED", "Memory writer is busy or an interrupted lock requires inspection", { lock: file });
    throw error;
  }
  try {
    fs.writeFileSync(fd, encodeJson({ pid: process.pid, host: os.hostname(), created: new Date().toISOString() }));
    fs.fsyncSync(fd);
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

function validateMutation(input, enforceBudget = true) {
  exactKeys(input, ["id", "operation", "expected", "content", "reason", "source", "session", "task"], "mutation");
  validateId(input.id);
  if (!["put", "delete"].includes(input.operation)) fail("INVALID_OPERATION", "Operation must be put or delete");
  validateExpected(input.expected);
  text(input.reason, "reason", 4000);
  text(input.source, "source", 2000);
  for (const field of ["session", "task"]) if (input[field] !== undefined) text(input[field], field, 200);
  if (input.operation === "put") validateContent(input.content, enforceBudget);
  else if (input.content !== undefined) fail("INVALID_INPUT", "Delete cannot include replacement content");
  return input;
}

function commit(root, mutation, { actor, proposal = null, preserveLegacy = false } = {}) {
  validateMutation(mutation, !preserveLegacy);
  text(actor, "actor", 100);
  const current = get(root, mutation.id);
  compare(current, mutation.expected);
  if (mutation.operation === "delete" && !current.exists) fail("NOT_FOUND", "Cannot delete an absent memory");
  if (current.revision >= Number.MAX_SAFE_INTEGER) fail("REVISION_EXHAUSTED", "Revision limit reached");
  const content = mutation.operation === "put" ? mutation.content : current;
  const after = encodeEntry({
    schema: SCHEMA, id: mutation.id, revision: current.revision + 1,
    type: content.type, title: content.title, summary: content.summary, sources: content.sources,
    updated: new Date().toISOString(), deleted: mutation.operation === "delete",
  }, mutation.operation === "put" ? content.body : "此条目已删除；历史正文保留在审计记录中。");
  const before = readOptional(safePath(root, `entries/${mutation.id}.md`));
  const transaction = {
    schema: "csl-memory-change/v1", id: crypto.randomUUID(), entryId: mutation.id,
    status: "prepared", at: new Date().toISOString(), actor, proposal,
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

function transactionId(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(id)) fail("INVALID_ID", "Invalid transaction/proposal ID");
  return id;
}

function finishTransaction(root, transaction) {
  rebuildIndex(root);
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
  const root = rootFor(options);
  return withLock(root, () => commit(root, mutation, { actor: options.actor || "memory-agent" }));
}

function propose(options, mutation) {
  validateMutation(mutation);
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
  const root = rootFor(options);
  return withLock(root, () => {
    const proposal = proposalDetail(options, id);
    if (proposal.digest !== digest || proposal.status !== "pending") fail("CONFLICT", "Proposal changed or was already decided");
    if (decision === "approve") return commit(root, proposal.mutation, { actor: "user-approved", proposal: id, preserveLegacy: true });
    const { digest: ignoredDigest, current: ignoredCurrent, ...record } = proposal;
    atomicWrite(safePath(root, `.proposals/${id}.json`), encodeJson({ ...record, status: "rejected", decided: new Date().toISOString() }));
    return { id, status: "rejected" };
  });
}

function history(options, { offset = 0, limit = 20 } = {}) {
  const root = rootFor(options);
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail("INVALID_PAGE", "Invalid history page");
  let names;
  try { names = fs.readdirSync(safePath(root, ".history")); } catch (error) { if (error.code === "ENOENT") names = []; else throw error; }
  const records = names.filter((name) => name.endsWith(".json")).map((name) => readJson(safePath(root, `.history/${name}`))).sort((a, b) => b.at.localeCompare(a.at) || a.id.localeCompare(b.id));
  return { total: records.length, offset, limit, nextOffset: offset + limit < records.length ? offset + limit : null, items: records.slice(offset, offset + limit).map(({ before, after, ...record }) => record) };
}

function changeDetail(options, id) {
  const record = readJson(safePath(rootFor(options), `.history/${transactionId(id)}.json`));
  if (!record || record.schema !== "csl-memory-change/v1" || record.id !== id) fail("NOT_FOUND", "Change not found or unsupported");
  return record;
}

function restore(options, id, expected, reason) {
  const record = changeDetail(options, id);
  if (record.status !== "committed") fail("INVALID_CHANGE", "Only committed changes can be restored");
  const previous = record.before === null ? null : parseEntry(record.before, record.entryId);
  const mutation = { id: record.entryId, operation: previous?.exists ? "put" : "delete", expected, reason, source: `restore:${id}` };
  if (previous?.exists) mutation.content = { title: previous.title, summary: previous.summary, type: previous.type, sources: previous.sources, body: previous.body };
  // Restore the historical bytes as a new revision, even if legacy content is
  // over today's budget. Never truncate it to make restoration pass.
  const root = rootFor(options);
  return withLock(root, () => commit(root, mutation, { actor: options.actor || "memory-restore", preserveLegacy: true }));
}

function reindex(options) {
  const root = rootFor(options);
  return withLock(root, () => { rebuildIndex(root); return { root, rebuilt: true }; });
}

module.exports = { SCHEMA, MAX_BYTES, BUDGETS, characters, fail, hash, rootFor, safePath, get, list, entries, indexText, indexPages, mutate, propose, proposalDetail, decide, history, changeDetail, restore, reindex, recover, readOptional, atomicWrite, validateMutation, withLock, commit };
