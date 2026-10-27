"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { execFileSync } = require("node:child_process");
const { safePath } = require("./topic-core.js");

const SCHEMA = "task-snapshot/v1";
const DIGEST = /^[a-f0-9]{64}$/;
const OBJECT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const MODE = /^(?:100644|100755|120000)$/;
const hash = (value) => createHash("sha256").update(value).digest("hex");

function assertId(id) {
  if (typeof id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`invalid task id: ${id}`);
}

function scopeName(taskId, relative) {
  if (typeof relative !== "string" || !relative || path.isAbsolute(relative) || /[\\\u0000-\u001f\u007f]/.test(relative) || relative.split("/").some((part) => !part || part === "." || part === "..")) throw new Error("snapshot scope requires canonical workspace-relative file paths");
  const reserved = relative.toLowerCase();
  if (reserved === "tasks/tasks.md" || reserved === `tasks/tasks/${taskId}.md` || new RegExp(`^tasks/artifacts/${taskId}/evidence/[a-f0-9]{64}\\.json$`).test(reserved)) {
    throw new Error(`snapshot scope cannot include its own lifecycle files: ${relative}`);
  }
}

function scopePath(workspace, taskId, relative) {
  scopeName(taskId, relative);
  return safePath(workspace, relative);
}

function git(workspace, args) {
  return execFileSync("git", ["--literal-pathspecs", ...args], {
    cwd: workspace, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, LC_ALL: "C" },
  });
}

function repository(workspace) {
  let top;
  try { top = git(workspace, ["rev-parse", "--show-toplevel"]).trim(); } catch (error) {
    if (error.status === 128 && /not a git repository/.test(String(error.stderr))) return undefined;
    throw new Error(`cannot inspect snapshot Git identity: ${error.message}`);
  }
  const root = fs.realpathSync(top);
  const relative = path.relative(root, workspace);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) throw new Error("snapshot workspace is outside its Git repository");
  let head = true;
  try { git(root, ["rev-parse", "--verify", "--quiet", "HEAD"]); } catch (error) {
    if (error.status !== 1) throw error;
    head = false;
  }
  return { root, prefix: relative ? `${relative.split(path.sep).join("/")}/` : "", head };
}

function gitFile(repo, relative) {
  if (!repo) return null;
  const target = `${repo.prefix}${relative}`;
  let head = null;
  if (repo.head) {
    const records = git(repo.root, ["ls-tree", "-z", "HEAD", "--", target]).split("\0").filter(Boolean);
    if (records.length > 1) throw new Error(`snapshot scope is not one Git file: ${relative}`);
    if (records.length) {
      const match = records[0].match(/^(\d+) blob ([a-f0-9]+)\t(.+)$/);
      if (!match || !MODE.test(match[1]) || !OBJECT.test(match[2]) || match[3] !== target) throw new Error(`snapshot scope is not a regular Git file: ${relative}`);
      head = { mode: match[1], object: match[2] };
    }
  }
  const index = git(repo.root, ["ls-files", "--stage", "-z", "--", target]).split("\0").filter(Boolean).map((record) => {
    const match = record.match(/^(\d+) ([a-f0-9]+) ([0-3])\t(.+)$/);
    if (!match || !MODE.test(match[1]) || !OBJECT.test(match[2]) || match[4] !== target) throw new Error(`snapshot scope is not a regular indexed file: ${relative}`);
    return { mode: match[1], object: match[2], stage: Number(match[3]) };
  });
  return { head, index };
}

function capture(workspace, taskId, files) {
  const repo = repository(workspace);
  return files.map((relative) => {
    const file = scopePath(workspace, taskId, relative);
    const identity = gitFile(repo, relative);
    let sha256 = null;
    try {
      if (!fs.lstatSync(file).isFile()) throw new Error(`snapshot scope must name a regular file: ${relative}`);
      sha256 = hash(fs.readFileSync(file));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      if (!identity?.head && !identity?.index.length) throw new Error(`snapshot scope file is missing and not Git-tracked: ${relative}`);
    }
    return { path: relative, sha256, git: identity };
  });
}

function keys(value, expected) {
  return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join(",") === expected;
}

function validGitEntry(value, index = false) {
  return keys(value, index ? "mode,object,stage" : "mode,object") && typeof value.mode === "string" && MODE.test(value.mode) && typeof value.object === "string" && OBJECT.test(value.object) && (!index || Number.isInteger(value.stage) && value.stage >= 0 && value.stage <= 3);
}

function validateManifest(taskId, manifest) {
  if (!keys(manifest, "files,schema,taskId") || manifest.schema !== SCHEMA || manifest.taskId !== taskId || !Array.isArray(manifest.files) || !manifest.files.length) throw new Error("invalid snapshot manifest schema or task identity");
  let previous;
  for (const item of manifest.files) {
    if (!keys(item, "git,path,sha256") || typeof item.path !== "string" || previous !== undefined && previous >= item.path || item.sha256 !== null && (typeof item.sha256 !== "string" || !DIGEST.test(item.sha256))) throw new Error("invalid, duplicate, or unsorted snapshot file entry");
    scopeName(taskId, item.path);
    previous = item.path;
    if (item.git !== null) {
      const identity = item.git;
      if (!keys(identity, "head,index") || identity.head !== null && !validGitEntry(identity.head) || !Array.isArray(identity.index)) throw new Error(`invalid snapshot Git identity: ${item.path}`);
      if (identity.index.some((entry, i) => !validGitEntry(entry, true) || i > 0 && identity.index[i - 1].stage >= entry.stage) || identity.index.length > 1 && identity.index[0].stage === 0) throw new Error(`invalid snapshot index identity: ${item.path}`);
    }
    if (item.sha256 === null && !item.git?.head && !item.git?.index.length) throw new Error(`snapshot missing file has no tracked identity: ${item.path}`);
  }
  return manifest;
}

function isSnapshotReference(value) {
  return typeof value === "string" && /^snapshot:/i.test(value.trimStart());
}

function gitSignature(identity) {
  return identity === null ? null : JSON.stringify([
    identity.head && [identity.head.mode, identity.head.object],
    identity.index.map((entry) => [entry.mode, entry.object, entry.stage]),
  ]);
}

function prepareSnapshot(workspace, taskId, files) {
  assertId(taskId);
  const root = fs.realpathSync(path.resolve(workspace));
  if (!Array.isArray(files) || !files.length) throw new Error("snapshot requires at least one explicit file");
  for (const file of files) scopePath(root, taskId, file);
  if (new Set(files).size !== files.length) throw new Error("duplicate snapshot scope file");
  const manifest = { schema: SCHEMA, taskId, files: capture(root, taskId, [...files].sort()) };
  const text = `${JSON.stringify(manifest, null, 2)}\n`;
  const digest = hash(text);
  const relative = `tasks/artifacts/${taskId}/evidence/${digest}.json`;
  const file = safePath(root, relative);
  try {
    if (!fs.lstatSync(file).isFile() || !fs.readFileSync(file).equals(Buffer.from(text))) throw new Error(`existing immutable snapshot is corrupt: ${relative}`);
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  return { file, text, reference: `snapshot:${relative}#${digest}`, manifest };
}

function verifySnapshot(workspace, taskId, reference, { current = true } = {}) {
  assertId(taskId);
  if (typeof current !== "boolean") throw new Error("snapshot current option must be boolean");
  const match = typeof reference === "string" && reference.match(/^snapshot:tasks\/artifacts\/([a-z0-9]+(?:-[a-z0-9]+)*)\/evidence\/([a-f0-9]{64})\.json#([a-f0-9]{64})$/);
  if (!match || match[1] !== taskId || match[2] !== match[3]) throw new Error("invalid snapshot reference or task identity");
  const root = fs.realpathSync(path.resolve(workspace));
  const file = safePath(root, `tasks/artifacts/${taskId}/evidence/${match[2]}.json`);
  if (!fs.lstatSync(file).isFile()) throw new Error("snapshot manifest must be a regular file");
  const text = fs.readFileSync(file);
  if (hash(text) !== match[3]) throw new Error("snapshot manifest content digest does not match its reference");
  let manifest;
  try { manifest = JSON.parse(text.toString("utf8")); } catch { throw new Error("invalid snapshot manifest JSON"); }
  validateManifest(taskId, manifest);
  if (current) {
    const actual = capture(root, taskId, manifest.files.map((item) => item.path));
    for (let i = 0; i < actual.length; i++) {
      if (actual[i].sha256 !== manifest.files[i].sha256 || gitSignature(actual[i].git) !== gitSignature(manifest.files[i].git)) throw new Error(`snapshot content or Git identity changed: ${actual[i].path}`);
    }
  }
  return manifest;
}

module.exports = { prepareSnapshot, verifySnapshot, isSnapshotReference };
