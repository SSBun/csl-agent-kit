#!/usr/bin/env node
"use strict";

const childProcess = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SCHEMA_VERSION = 1;
const RESULT_LIMIT = 8;
const MAX_INDEX_BYTES = 10 * 1024 * 1024;
const MAX_RECORD_BYTES = 1024 * 1024;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const RESERVED_IDS = new Set(["__proto__", "constructor", "prototype"]);
const WRITE_LOCK_PATTERN = /^\.index\.lock\.(\d+)\.[0-9a-f-]{36}$/;
const LEGACY_WRITE_LOCK_STALE_MS = 5 * 60_000;
const PROJECT_FIELDS = ["name", "root", "owns", "doesNotOwn", "terms", "useWhen", "pages"];
const PAGE_FIELDS = ["names", "snapshot"];
const GLOSSARY_FIELDS = ["definition", "aliases", "distinctFrom", "evidence"];
const POSITIVE_FIELDS = [
  ["id", 14],
  ["name", 14],
  ["terms", 10],
  ["pages", 8],
  ["useWhen", 6],
  ["owns", 4],
];

function dataRoot() {
  return process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
}

function indexRoot() {
  return path.join(dataRoot(), "project-indexes");
}

function indexPath() {
  return path.join(indexRoot(), "index.json");
}

function snapshotsRoot() {
  return path.join(indexRoot(), "snapshots");
}

function emptyIndex() {
  return { schemaVersion: SCHEMA_VERSION, projects: {}, glossary: {} };
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function unique(values) {
  return [...new Set(values)];
}

function compareUtf8(left, right) {
  return Buffer.from(left).compare(Buffer.from(right));
}

function emit(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function issue(pathName, message) {
  return { path: pathName, message };
}

function validateId(id, label, errors) {
  if (typeof id !== "string" || !ID_PATTERN.test(id) || RESERVED_IDS.has(id)) {
    errors.push(issue(label, "expected a safe non-empty project/glossary ID"));
  }
}

function validateFields(value, allowed, label, errors) {
  if (!isPlainObject(value)) {
    errors.push(issue(label, "expected an object"));
    return false;
  }
  for (const field of Object.keys(value)) {
    if (!allowed.includes(field)) errors.push(issue(`${label}.${field}`, "unknown field"));
  }
  return true;
}

function validateString(value, label, errors) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(issue(label, "expected a non-empty string"));
    return false;
  }
  return true;
}

function validateStringArray(value, label, errors, required = false) {
  if (!Array.isArray(value)) {
    errors.push(issue(label, "expected an array of unique non-empty strings"));
    return;
  }
  if (required && value.length === 0) errors.push(issue(label, "expected at least one item"));
  const seen = new Set();
  for (let index = 0; index < value.length; index += 1) {
    const item = value[index];
    if (typeof item !== "string" || !item.trim()) {
      errors.push(issue(`${label}[${index}]`, "expected a non-empty string"));
      continue;
    }
    if (seen.has(item)) errors.push(issue(`${label}[${index}]`, "duplicate item"));
    seen.add(item);
  }
}

function validateSnapshot(snapshot, label, errors, checkFiles) {
  if (snapshot === undefined) return;
  if (!validateString(snapshot, label, errors)) return;
  if (path.isAbsolute(snapshot) || snapshot.split(/[\\/]+/).includes("..")) {
    errors.push(issue(label, "snapshot must stay inside the snapshots directory"));
    return;
  }
  if (checkFiles) {
    const root = path.resolve(snapshotsRoot());
    const file = path.resolve(root, snapshot);
    try {
      const realRoot = fs.realpathSync(root);
      const realFile = fs.realpathSync(file);
      if (!realFile.startsWith(`${realRoot}${path.sep}`) || !fs.statSync(realFile).isFile()) {
        throw new Error("not a regular file inside the snapshots directory");
      }
    } catch (error) {
      errors.push(issue(label, `snapshot file is unavailable: ${file} (${error.message})`));
    }
  }
}

function validatePages(pages, label, errors, checkFiles) {
  if (!isPlainObject(pages)) {
    errors.push(issue(label, "expected an object"));
    return;
  }
  for (const [id, page] of Object.entries(pages)) {
    validateId(id, `${label}.${id}`, errors);
    if (!validateFields(page, PAGE_FIELDS, `${label}.${id}`, errors)) continue;
    validateStringArray(page.names, `${label}.${id}.names`, errors, true);
    validateSnapshot(page.snapshot, `${label}.${id}.snapshot`, errors, checkFiles);
  }
}

function canonicalGitRoot(root, label, errors) {
  if (!path.isAbsolute(root)) {
    errors.push(issue(label, "expected an absolute path"));
    return null;
  }
  let realRoot;
  try {
    realRoot = fs.realpathSync(root);
    if (!fs.statSync(realRoot).isDirectory()) throw new Error("not a directory");
  } catch (error) {
    errors.push(issue(label, `repository root is unavailable: ${error.message}`));
    return null;
  }
  try {
    const output = childProcess.execFileSync(
      "git",
      ["-C", realRoot, "rev-parse", "--show-toplevel"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    ).trim();
    const gitRoot = fs.realpathSync(output);
    if (gitRoot !== realRoot) errors.push(issue(label, `expected the independent Git root, got ${gitRoot}`));
  } catch (error) {
    errors.push(issue(label, `not an independent Git repository: ${error.message}`));
  }
  return realRoot;
}

function validateProject(id, project, errors, checkFiles, roots) {
  const label = `projects.${id}`;
  validateId(id, label, errors);
  if (!validateFields(project, PROJECT_FIELDS, label, errors)) return;
  validateString(project.name, `${label}.name`, errors);
  if (validateString(project.root, `${label}.root`, errors)) {
    if (!path.isAbsolute(project.root)) {
      errors.push(issue(`${label}.root`, "expected an absolute path"));
    } else {
      const root = checkFiles ? canonicalGitRoot(project.root, `${label}.root`, errors) : path.resolve(project.root);
      if (root) {
        if (roots.has(root)) errors.push(issue(`${label}.root`, `duplicate repository root used by ${roots.get(root)}`));
        roots.set(root, id);
      }
    }
  }
  validateStringArray(project.owns, `${label}.owns`, errors, true);
  validateStringArray(project.doesNotOwn, `${label}.doesNotOwn`, errors);
  validateStringArray(project.terms, `${label}.terms`, errors, true);
  validateStringArray(project.useWhen, `${label}.useWhen`, errors, true);
  if (project.pages !== undefined) validatePages(project.pages, `${label}.pages`, errors, checkFiles);
}

function validateGlossary(glossary, errors) {
  if (!isPlainObject(glossary)) {
    errors.push(issue("glossary", "expected an object"));
    return;
  }
  for (const [id, entry] of Object.entries(glossary)) {
    const label = `glossary.${id}`;
    validateId(id, label, errors);
    if (!validateFields(entry, GLOSSARY_FIELDS, label, errors)) continue;
    validateString(entry.definition, `${label}.definition`, errors);
    validateStringArray(entry.aliases, `${label}.aliases`, errors);
    validateStringArray(entry.distinctFrom, `${label}.distinctFrom`, errors);
    validateStringArray(entry.evidence, `${label}.evidence`, errors, true);
  }
}

function validateIndex(index, checkFiles = false) {
  const errors = [];
  if (!validateFields(index, ["schemaVersion", "projects", "glossary"], "index", errors)) return errors;
  if (index.schemaVersion !== SCHEMA_VERSION) {
    errors.push(issue("schemaVersion", `expected ${SCHEMA_VERSION}`));
  }
  if (!isPlainObject(index.projects)) {
    errors.push(issue("projects", "expected an object"));
  } else {
    const roots = new Map();
    for (const [id, project] of Object.entries(index.projects)) {
      validateProject(id, project, errors, checkFiles, roots);
    }
  }
  validateGlossary(index.glossary, errors);
  return errors;
}

function readIndex(allowMissing = false) {
  const file = indexPath();
  let stat;
  try {
    stat = fs.statSync(file);
  } catch (error) {
    if (allowMissing && error.code === "ENOENT") return { file, exists: false, index: emptyIndex() };
    throw new Error(`index unavailable at ${file}: ${error.message}`);
  }
  if (!stat.isFile()) throw new Error(`index is not a regular file: ${file}`);
  if (stat.size > MAX_INDEX_BYTES) throw new Error(`index exceeds ${MAX_INDEX_BYTES} bytes: ${file}`);
  let index;
  try {
    index = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`invalid JSON at ${file}: ${error.message}`);
  }
  const errors = validateIndex(index, false);
  if (errors.length > 0) throw new Error(`invalid project index: ${errors.map(({ path: itemPath, message }) => `${itemPath}: ${message}`).join("; ")}`);
  return { file, exists: true, index };
}

function canonicalize(index) {
  return {
    schemaVersion: SCHEMA_VERSION,
    projects: Object.fromEntries(Object.entries(index.projects).sort(([left], [right]) => compareUtf8(left, right))),
    glossary: Object.fromEntries(Object.entries(index.glossary).sort(([left], [right]) => compareUtf8(left, right))),
  };
}

function writeAtomic(file, index) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  let descriptor;
  try {
    descriptor = fs.openSync(temporary, "wx", 0o600);
    fs.writeFileSync(descriptor, `${JSON.stringify(canonicalize(index), null, 2)}\n`);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, file);
    fs.chmodSync(file, 0o600);
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(temporary, { force: true });
  }
}

function processExists(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") return false;
    if (error.code === "EPERM") return true;
    throw error;
  }
}

function findActiveWriteTicket(ownTicket) {
  for (const name of fs.readdirSync(indexRoot())) {
    const match = name.match(WRITE_LOCK_PATTERN);
    if (!match) continue;
    const ticket = path.join(indexRoot(), name);
    if (ticket === ownTicket) continue;
    // ponytail: PID liveness is enough for short local writes; add process-start
    // identity only if PID reuse is observed in practice.
    if (processExists(Number(match[1]))) return ticket;
    fs.rmSync(ticket, { force: true });
  }
  return null;
}

function clearLegacyWriteLock() {
  const lock = path.join(indexRoot(), ".index.lock");
  let stat;
  let owner;
  try {
    stat = fs.statSync(lock);
    owner = fs.readFileSync(lock, "utf8").trim();
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  const pid = /^\d+$/.test(owner) ? Number(owner) : 0;
  // ponytail: old ownerless locks use a conservative age cutoff; remove this
  // compatibility branch after installations using the old format age out.
  const stale = pid > 0
    ? !processExists(pid)
    : Date.now() - stat.mtimeMs > LEGACY_WRITE_LOCK_STALE_MS;
  if (!stale) throw new Error(`another index update may be active: ${lock}`);
  fs.rmSync(lock, { force: true });
}

function withWriteLock(action) {
  fs.mkdirSync(indexRoot(), { recursive: true, mode: 0o700 });
  const ticket = path.join(indexRoot(), `.index.lock.${process.pid}.${crypto.randomUUID()}`);
  const descriptor = fs.openSync(ticket, "wx", 0o600);
  try {
    fs.writeFileSync(descriptor, `${process.pid}\n`);
    fs.fsyncSync(descriptor);
    const contender = findActiveWriteTicket(ticket);
    if (contender) throw new Error(`another index update may be active: ${contender}`);
    clearLegacyWriteLock();
    return action();
  } finally {
    fs.closeSync(descriptor);
    fs.rmSync(ticket, { force: true });
  }
}

function normalize(value) {
  return String(value)
    .normalize("NFKC")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function queryTerms(args) {
  const terms = [];
  for (const argument of args) {
    const phrase = normalize(argument);
    if (!phrase) continue;
    terms.push(phrase);
    terms.push(...phrase.split(/\s+/).filter((term) => term.length > 1));
  }
  return unique(terms);
}

function matchQuality(term, value) {
  const candidate = normalize(value);
  if (!candidate) return 0;
  if (candidate === term) return 1.5;
  if (candidate.includes(term)) return 1;
  if (candidate.length > 2 && term.includes(candidate)) return 0.75;
  return 0;
}

function projectFieldValues(id, project) {
  return {
    id: [id],
    name: [project.name],
    terms: project.terms,
    pages: Object.values(project.pages || {}).flatMap((page) => page.names),
    useWhen: project.useWhen,
    owns: project.owns,
  };
}

function expandedTerms(index, original) {
  const expanded = [...original];
  for (const [id, entry] of Object.entries(index.glossary)) {
    const values = [id, ...entry.aliases];
    if (original.some((term) => values.some((value) => matchQuality(term, value) > 0))) {
      expanded.push(...values.map(normalize).filter(Boolean));
    }
  }
  return unique(expanded);
}

function documentFrequency(index, term) {
  let count = 0;
  for (const [id, project] of Object.entries(index.projects)) {
    const fields = projectFieldValues(id, project);
    if (Object.values(fields).flat().some((value) => matchQuality(term, value) > 0)) count += 1;
  }
  return count;
}

function resolvePages(pages = {}) {
  return Object.fromEntries(Object.entries(pages).map(([id, page]) => {
    if (!page.snapshot) return [id, { ...page, snapshotStatus: "not-provided" }];
    const snapshotPath = path.resolve(snapshotsRoot(), page.snapshot);
    let available = false;
    try {
      available = fs.statSync(snapshotPath).isFile();
    } catch {}
    return [id, { ...page, snapshotPath, snapshotStatus: available ? "available" : "missing" }];
  }));
}

function matchedGlossary(index, terms) {
  return Object.fromEntries(Object.entries(index.glossary).filter(([id, entry]) => {
    const values = [id, ...entry.aliases, entry.definition];
    return terms.some((term) => values.some((value) => matchQuality(term, value) > 0));
  }));
}

function queryIndex(index, args) {
  const original = queryTerms(args);
  if (original.length === 0) throw new Error("query requires at least one non-empty term");
  const terms = expandedTerms(index, original);
  const projects = Object.entries(index.projects);
  const idf = new Map(terms.map((term) => [
    term,
    Math.log((projects.length + 1) / (documentFrequency(index, term) + 1)) + 1,
  ]));
  const results = [];

  for (const [id, project] of projects) {
    const fields = projectFieldValues(id, project);
    const matches = [];
    const conflicts = [];
    const matchedOriginal = new Set();
    let score = 0;

    for (const [field, weight] of POSITIVE_FIELDS) {
      for (const term of terms) {
        let best = null;
        for (const value of fields[field]) {
          const quality = matchQuality(term, value);
          if (quality > (best?.quality ?? 0)) best = { value, quality };
        }
        if (!best) continue;
        const contribution = weight * best.quality * idf.get(term);
        score += contribution;
        matches.push({ field, term, value: best.value, score: Number(contribution.toFixed(3)) });
        if (original.includes(term)) matchedOriginal.add(term);
      }
    }

    for (const term of terms) {
      let best = null;
      for (const value of project.doesNotOwn) {
        const quality = matchQuality(term, value);
        if (quality > (best?.quality ?? 0)) best = { value, quality };
      }
      if (!best) continue;
      const penalty = 12 * best.quality * idf.get(term);
      score -= penalty;
      conflicts.push({ term, value: best.value, score: Number((-penalty).toFixed(3)) });
    }

    const coverage = matchedOriginal.size / original.length;
    score += coverage * 5;
    if (score <= 0 || matches.length === 0) continue;
    results.push({
      id,
      score: Number(score.toFixed(3)),
      coverage: Number(coverage.toFixed(3)),
      matches,
      conflicts,
      project: { ...project, pages: resolvePages(project.pages) },
    });
  }

  results.sort((left, right) => right.score - left.score || compareUtf8(left.id, right.id));
  return {
    schema: "project-index.query/v1",
    query: args.join(" "),
    terms: original,
    coverage: {
      indexedProjectCount: projects.length,
      projectIds: projects.map(([id]) => id).sort(compareUtf8),
      note: "Only indexed projects were searched.",
    },
    glossary: matchedGlossary(index, original),
    results: results.slice(0, RESULT_LIMIT),
    ...(results.length === 0 ? {
      warning: "No reliable match was found in the indexed projects. This does not mean the target repository does not exist.",
    } : {}),
  };
}

function commandList() {
  const { file, exists, index } = readIndex(true);
  const projects = Object.entries(index.projects)
    .sort(([left], [right]) => compareUtf8(left, right))
    .map(([id, project]) => ({
      id,
      name: project.name,
      root: project.root,
      pageCount: Object.keys(project.pages || {}).length,
    }));
  emit({ schema: "project-index.list/v1", indexPath: file, indexExists: exists, count: projects.length, projects });
}

function commandGet(id) {
  const errors = [];
  validateId(id, "project-id", errors);
  if (errors.length > 0) throw new Error(errors[0].message);
  const { file, index } = readIndex();
  const project = index.projects[id];
  if (!project) throw new Error(`project not indexed: ${id}`);
  emit({ schema: "project-index.project/v1", indexPath: file, id, project: { ...project, pages: resolvePages(project.pages) } });
}

function commandQuery(args) {
  const { file, exists, index } = readIndex(true);
  emit({ indexPath: file, indexExists: exists, ...queryIndex(index, args) });
}

function commandUpsert(id) {
  const idErrors = [];
  validateId(id, "project-id", idErrors);
  if (idErrors.length > 0) throw new Error(idErrors[0].message);
  const input = fs.readFileSync(0, "utf8");
  if (!input.trim()) throw new Error("upsert requires a complete project record on stdin");
  if (Buffer.byteLength(input) > MAX_RECORD_BYTES) throw new Error(`record exceeds ${MAX_RECORD_BYTES} bytes`);
  let project;
  try {
    project = JSON.parse(input);
  } catch (error) {
    throw new Error(`invalid project JSON on stdin: ${error.message}`);
  }

  withWriteLock(() => {
    const { file, index } = readIndex(true);
    const candidate = { ...index, projects: { ...index.projects, [id]: project } };
    const errors = validateIndex(candidate, true);
    if (errors.length > 0) {
      const error = new Error("project update failed validation");
      error.details = errors;
      throw error;
    }
    writeAtomic(file, candidate);
  });

  emit({ schema: "project-index.upsert/v1", updated: id, indexPath: indexPath() });
}

function commandValidate() {
  const file = indexPath();
  let index;
  try {
    const stat = fs.statSync(file);
    if (!stat.isFile()) throw new Error("not a regular file");
    if (stat.size > MAX_INDEX_BYTES) throw new Error(`exceeds ${MAX_INDEX_BYTES} bytes`);
    index = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    emit({ schema: "project-index.validation/v1", valid: false, indexPath: file, errors: [issue("index", error.message)] });
    process.exitCode = 1;
    return;
  }
  const errors = validateIndex(index, true);
  emit({ schema: "project-index.validation/v1", valid: errors.length === 0, indexPath: file, errors });
  if (errors.length > 0) process.exitCode = 1;
}

function printHelp() {
  process.stdout.write(`Usage: node project-index.js <command> [arguments]\n\nCommands:\n  list\n  get <project-id>\n  query <term>...\n  upsert <project-id>   Read a complete project record from stdin\n  validate\n`);
}

function main() {
  const [, , command, ...args] = process.argv;
  switch (command) {
    case "list": return commandList();
    case "get":
      if (args.length !== 1) throw new Error("get requires one project ID");
      return commandGet(args[0]);
    case "query": return commandQuery(args);
    case "upsert":
      if (args.length !== 1) throw new Error("upsert requires one project ID");
      return commandUpsert(args[0]);
    case "validate": return commandValidate();
    case "help":
    case "--help":
    case "-h":
    case undefined: return printHelp();
    default: throw new Error(`unknown command: ${command}`);
  }
}

try {
  main();
} catch (error) {
  emit({
    schema: "project-index.error/v1",
    error: error.message,
    ...(error.details ? { details: error.details } : {}),
  });
  process.exitCode = 1;
}
