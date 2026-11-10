"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const YAML = require("yaml");
const recall = require("./recall-index.js");
const recent = require("./recent.js");

const STORE_VERSION = 5;
const MAX_BYTES = 256 * 1024;
const BUDGETS = Object.freeze({ title: 60, summary: 200, bodyTarget: 4000, body: 8000, indexPage: 4000, projectChips: 20, projectBodyWords: 1000 });
const segmenter = new Intl.Segmenter("zh", { granularity: "word" });
const words = value => [...segmenter.segment(value)].filter(part => part.isWordLike).length;
const characters = value => [...value].length;
function fail(code, message, details) { const error = new Error(message); error.code = code; error.details = details; throw error; }
function hash(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function validateId(id) {
  if (typeof id !== "string" || id.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) fail("INVALID_ID", "Invalid memory ID");
  return id;
}
function exactKeys(value, allowed, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("INVALID_INPUT", `${name} must be an object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) fail("INVALID_INPUT", `Unknown ${name} field: ${key}`);
}
function text(value, name, max) {
  if (typeof value !== "string" || !value.trim() || value.includes("\0") || characters(value) > max) fail("INVALID_INPUT", `Invalid ${name}`);
}

// Refuse symlinks anywhere below the selected root; this is not an OS sandbox.
function safePath(root, relative) {
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) fail("INVALID_PATH", "Path escapes memory root");
  let current = root;
  for (const part of ["", ...path.relative(root, target).split(path.sep).filter(Boolean)]) {
    if (part) current = path.join(current, part);
    try { if (fs.lstatSync(current).isSymbolicLink()) fail("SYMLINK", `Memory paths cannot be symbolic links: ${current}`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return target;
}
function rootFor({ scope = "project", workspace = process.cwd(), home = process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit") } = {}) {
  if (!["user", "project"].includes(scope)) fail("INVALID_SCOPE", "Scope must be user or project");
  const base = scope === "user" ? path.resolve(home) : path.join(fs.realpathSync(workspace), ".csl-agent-kit");
  safePath(base, "");
  return safePath(base, "memory");
}
function readOptional(file, maxBytes = MAX_BYTES) {
  try {
    const stat = fs.lstatSync(file);
    if (!stat.isFile() || stat.isSymbolicLink()) fail("INVALID_FILE", `Not a regular file: ${file}`);
    if (stat.size > maxBytes) fail("TOO_LARGE", `File exceeds ${maxBytes} bytes: ${file}`);
    const bytes = fs.readFileSync(file), value = bytes.toString("utf8");
    if (!bytes.equals(Buffer.from(value, "utf8"))) fail("INVALID_ENCODING", `Invalid UTF-8: ${file}`);
    return value;
  } catch (error) { if (error.code === "ENOENT") return null; throw error; }
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
    fs.writeFileSync(fd, content); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
    fs.renameSync(temporary, file); syncDirectory(path.dirname(file));
  } finally { if (fd !== undefined) fs.closeSync(fd); fs.rmSync(temporary, { force: true }); }
}
function validateCaseBody(body) {
  text(body, "body", 100000);
  for (const [index, line] of body.trim().split(/\r?\n/).entries()) {
    if (!line.trim()) continue;
    const match = /^- \[(\d{4}-\d{2}-\d{2})\] (\S.*)$/.exec(line);
    const date = match && new Date(`${match[1]}T00:00:00.000Z`);
    if (!match || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== match[1]) fail("MEMORY_CASE_FORMAT", "Each memory case must be - [YYYY-MM-DD] knowledge", { line: index + 1 });
  }
  return body;
}
function validateContent(content, scope = "project", enforceBudget = true, id) {
  exactKeys(content, ["title", "summary", "body"], "content");
  text(content.title, "title", enforceBudget ? BUDGETS.title : 160);
  text(content.summary, "summary", enforceBudget ? BUDGETS.summary : 600);
  const emptyTemp = scope === "project" && id === "temp" && content.body === "";
  if (!emptyTemp) text(content.body, "body", 100000);
  if (/[\r\n]/.test(content.title + content.summary)) fail("INVALID_INPUT", "Title and summary must be single-line text");
  if (enforceBudget) {
    if (!emptyTemp) validateCaseBody(content.body);
    if (scope === "project" && id === "temp") {
      if (content.title !== recent.TITLE || content.summary !== recent.SUMMARY) fail("INVALID_TEMP_MEMORY", "Temporary memory must use its fixed title and summary");
      if (recent.filter(content.body) !== content.body.trim()) fail("TEMP_DATE_RANGE", "Temporary cases must fall within today and the previous six UTC dates");
    }
    if (scope === "project" && words(content.body) > BUDGETS.projectBodyWords) fail("MEMORY_BUDGET", "Project chip exceeds 1000 words");
    if (scope === "user" && characters(content.body) > BUDGETS.body) fail("MEMORY_BUDGET", "User chip exceeds 8000 characters");
  }
}
function encodeEntry(content) {
  const raw = `---\n${YAML.stringify({ title: content.title, summary: content.summary })}---\n\n${content.body.trim()}\n`;
  if (Buffer.byteLength(raw) > MAX_BYTES) fail("TOO_LARGE", "Memory exceeds maximum size");
  return raw;
}
function parseEntry(raw, id) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!match) fail("INVALID_FORMAT", `Missing frontmatter: ${id}`);
  const meta = YAML.parse(match[1], { maxAliasCount: 0, uniqueKeys: true });
  const legacy = meta?.schema !== undefined;
  if (legacy) {
    if (!["csl-memory/v1", "csl-memory/v2"].includes(meta.schema) || meta.id !== id || typeof meta.deleted !== "boolean") fail("UNSUPPORTED_SCHEMA", `Unsupported legacy entry: ${id}`);
  } else exactKeys(meta, ["title", "summary"], "metadata");
  const content = { title: meta.title, summary: meta.summary, body: match[2].trim() };
  validateContent(content, "project", false, id);
  return { id, ...content, hash: hash(raw), exists: !meta.deleted, legacy };
}
function get(root, id, { raw = false } = {}) {
  validateId(id);
  const file = safePath(root, `entries/${id}.md`), bytes = readOptional(file);
  if (bytes === null) return { id, exists: false, hash: null };
  const entry = { ...parseEntry(bytes, id), updated: fs.statSync(file).mtime.toISOString() };
  if (!raw && recent.matches(entry) && indexMetadata(root)?.scope === "project") entry.body = recent.filter(entry.body);
  return entry;
}
function pruneTemp(options = {}) {
  if ((options.scope || "project") !== "project") return { changed: false };
  const root = rootFor(options), index = indexMetadata(root);
  // Cleanup only a recognized current-format file, never a legacy/colliding ID.
  if (index?.formatVersion !== STORE_VERSION || index.scope !== "project" || readOptional(safePath(root, ".format.json")) !== null) return { changed: false };
  const initial = get(root, "temp", { raw: true });
  if (!initial.exists || !recent.matches(initial) || recent.filter(initial.body) === initial.body) return { changed: false };
  return withLock(root, () => {
    const current = get(root, "temp", { raw: true });
    if (!current.exists || !recent.matches(current)) return { changed: false };
    if (current.body) validateCaseBody(current.body);
    const body = recent.filter(current.body);
    if (body === current.body) return { changed: false };
    atomicWrite(safePath(root, "entries/temp.md"), encodeEntry({ title: recent.TITLE, summary: recent.SUMMARY, body }));
    try { rebuildIndex(root, "project"); }
    catch (error) { fail("INDEX_STALE", "Temporary memory was pruned but index refresh failed", { cause: error.message }); }
    return { changed: true };
  });
}
function entries(root) {
  let names;
  try { names = fs.readdirSync(safePath(root, "entries")); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
  return names.filter(name => name.endsWith(".md")).sort().map(name => get(root, name.slice(0, -3)));
}
function list(root, { query = "", offset = 0, limit = 20, fullText = false } = {}) {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) fail("INVALID_PAGE", "Invalid page");
  if (typeof query !== "string" || query.length > 1000) fail("INVALID_QUERY", "Invalid search query");
  const terms = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const matches = entries(root).filter(e => e.exists && terms.every(term => `${e.id} ${e.title} ${e.summary}${fullText ? ` ${e.body}` : ""}`.toLocaleLowerCase().includes(term)));
  return { total: matches.length, offset, limit, nextOffset: offset + limit < matches.length ? offset + limit : null,
    items: matches.slice(offset, offset + limit).map(({ id, title, summary, hash, updated }) => ({ id, title, summary, hash, updated, file: `entries/${id}.md` })) };
}
function indexMetadata(root) {
  const raw = readOptional(safePath(root, "index.md"), 4 * MAX_BYTES);
  const match = raw && /^---\n([\s\S]*?)\n---/.exec(raw);
  return match ? YAML.parse(match[1], { maxAliasCount: 0, uniqueKeys: true }) : null;
}
function indexScope(root) { return indexMetadata(root)?.scope || (root === rootFor({ scope: "user" }) ? "user" : "project"); }
function indexPages(root, scope = indexScope(root)) { return recall.compile({ entries: entries(root), scope }).files; }
function indexText(root, scope) { return indexPages(root, scope)[0].content; }
function rebuildIndex(root, scope) { atomicWrite(safePath(root, "index.md"), indexText(root, scope)); }
function budgetStatus(root, scope = indexScope(root)) {
  if (scope !== "project") return null;
  const active = entries(root).filter(e => e.exists);
  return { count: active.length, limit: BUDGETS.projectChips, wordLimit: BUDGETS.projectBodyWords, oversized: active.map(e => ({ id: e.id, words: words(e.body) })).filter(e => e.words > BUDGETS.projectBodyWords), overCapacity: active.length > BUDGETS.projectChips };
}
function inspectIndex(options = {}) {
  const root = rootFor(options), scope = options.scope || "project";
  const overview = readOptional(safePath(root, "index.md"), 4 * MAX_BYTES), index = indexMetadata(root);
  const current = recall.compile({ entries: entries(root), scope });
  const second = readOptional(safePath(root, "index.md"), 4 * MAX_BYTES);
  const legacy = readOptional(safePath(root, ".format.json")) !== null || entries(root).some(e => e.legacy);
  const state = overview !== second ? "changed" : legacy ? "upgrade-required" : index?.schema === recall.SCHEMA && index.formatVersion === STORE_VERSION && overview === current.files[0].content ? "published" : "stale";
  return { root, state, writable: !legacy, formatVersion: legacy ? null : STORE_VERSION, overview, index, budget: budgetStatus(root, scope), integrity: "current-content comparison; reread relevant files before use" };
}
function withLock(root, fn) {
  fs.mkdirSync(safePath(root, "entries"), { recursive: true, mode: 0o700 });
  const file = safePath(root, ".write-lock-v5");
  let fd;
  try { fd = fs.openSync(file, "wx", 0o600); }
  catch (error) { if (error.code === "EEXIST") fail("LOCKED", "Memory writer is active or its interrupted lock needs inspection"); throw error; }
  try {
    fs.writeFileSync(fd, JSON.stringify({ pid: process.pid, host: os.hostname() })); fs.fsyncSync(fd);
    return fn();
  } finally { fs.closeSync(fd); fs.unlinkSync(file); syncDirectory(root); }
}
function validateMutation(input) {
  exactKeys(input, ["id", "operation", "expected", "content"], "mutation");
  validateId(input.id);
  if (!["put", "delete"].includes(input.operation)) fail("INVALID_OPERATION", "Use put or delete");
  exactKeys(input.expected, ["hash"], "expected");
  if (!(input.expected.hash === null || typeof input.expected.hash === "string" && /^[a-f0-9]{64}$/.test(input.expected.hash))) fail("INVALID_EXPECTATION", "Provide current SHA256; new files use null");
  if (input.operation === "delete" && input.content !== undefined) fail("INVALID_INPUT", "Delete cannot include content");
  return input;
}
function mutate(options, input) {
  validateMutation(input);
  const state = require("./migration.js").ensure(options);
  if (!state.writable) fail("UPGRADE_REQUIRED", "Legacy memory is read-only; explicitly authorize memory upgrade for this scope");
  const root = rootFor(options), scope = options.scope || "project";
  return withLock(root, () => {
    const current = get(root, input.id, { raw: true });
    if (current.hash !== input.expected.hash) fail("CONFLICT", "Memory changed; read again", { current: { hash: current.hash } });
    const file = safePath(root, `entries/${input.id}.md`);
    if (input.operation === "put") {
      validateContent(input.content, scope, true, input.id);
      if (scope === "project" && input.id === "temp" && current.exists && !recent.matches(current)) fail("TEMP_ID_CONFLICT", "Existing temp ID is not recognized temporary memory; preserve it for explicit resolution");
      if (scope === "project" && !current.exists && entries(root).filter(e => e.exists).length >= BUDGETS.projectChips) fail("MEMORY_CAPACITY", "Project memory is full; merge and verify before deleting redundant files");
      atomicWrite(file, encodeEntry(input.content));
    } else {
      if (!current.exists) fail("NOT_FOUND", "Memory does not exist");
      fs.unlinkSync(file); syncDirectory(path.dirname(file));
    }
    try { rebuildIndex(root, scope); }
    catch (error) { fail("INDEX_STALE", "Current file was written but index refresh failed; reread entries and reindex", { cause: error.message }); }
    return { operation: input.operation, entry: get(root, input.id) };
  });
}
function reindex(options) {
  const state = require("./migration.js").ensure(options);
  if (!state.writable) fail("UPGRADE_REQUIRED", "Legacy scope needs an explicitly authorized upgrade");
  const root = rootFor(options);
  return withLock(root, () => { rebuildIndex(root, options.scope || "project"); return { root, rebuilt: true }; });
}

module.exports = { STORE_VERSION, MAX_BYTES, BUDGETS, words, characters, fail, hash, safePath, rootFor, readOptional, atomicWrite, validateCaseBody, validateContent, validateMutation, encodeEntry, parseEntry, get, pruneTemp, entries, list, indexMetadata, indexPages, indexText, rebuildIndex, inspectIndex, budgetStatus, withLock, mutate, reindex };
