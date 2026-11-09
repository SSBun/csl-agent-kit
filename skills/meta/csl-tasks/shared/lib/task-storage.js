"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const MARKER = ".csl-agent-kit/task-storage.json";
const TARGET = ".csl-agent-kit/tasks";

function safeFile(workspace, relative) {
  if (typeof relative !== "string" || !relative || path.isAbsolute(relative) || /[\\\x00-\x1f]/.test(relative) || relative.split("/").some(p => !p || p === "." || p === "..")) throw new Error("unsafe storage path");
  let file = fs.realpathSync(workspace);
  for (const part of relative.split("/")) {
    file = path.join(file, part);
    try { if (fs.lstatSync(file).isSymbolicLink()) throw new Error(`storage symlink is not allowed: ${file}`); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return file;
}

function layout(workspace) {
  const file = safeFile(workspace, MARKER);
  let raw;
  try { raw = fs.readFileSync(file, "utf8"); } catch (error) {
    if (error.code !== "ENOENT") throw error;
    if (fs.existsSync(safeFile(workspace, TARGET))) throw new Error("Task target exists without a completed storage migration");
    return { root: "tasks" };
  }
  const marker = JSON.parse(raw);
  if (marker.schema !== "csl-task-storage/v1" || !["migrating", "unified"].includes(marker.state)) throw new Error("unsupported Task storage marker");
  if (marker.state !== "unified") throw new Error("Task storage migration in progress; writes and panel reads are suspended");
  if (!/^migrations\/[a-z0-9-]+\/manifest\.json$/.test(marker.manifest || "") || !/^[a-f0-9]{64}$/.test(marker.sha256 || "")) throw new Error("invalid Task migration identity");
  if (fs.existsSync(safeFile(workspace, "tasks/tasks.md"))) throw new Error("Legacy Task index reappeared after cutover; inspect competing writers");
  return { root: TARGET, marker };
}

// Historical logical references keep their identity; they resolve to one active root,
// never by trying a second copy when a file is absent.
function relative(workspace, reference) {
  const current = layout(workspace);
  return reference === "tasks" || reference.startsWith("tasks/") ? current.root + reference.slice(5) : reference;
}

function taskPath(workspace, tail = "") {
  return safeFile(workspace, layout(workspace).root + (tail ? `/${tail}` : ""));
}

function manifest(workspace) {
  const current = layout(workspace);
  if (!current.marker) return undefined;
  const bytes = fs.readFileSync(safeFile(workspace, `.csl-agent-kit/${current.marker.manifest}`));
  if (hash(bytes) !== current.marker.sha256) throw new Error("Task migration manifest digest mismatch");
  const value = JSON.parse(bytes);
  if (value.schema !== "csl-task-migration/v1" || !Array.isArray(value.files)) throw new Error("invalid Task migration manifest");
  return value;
}

function originalFingerprint(file, fingerprint) {
  if (!file) return fingerprint;
  const suffix = `${path.sep}.csl-agent-kit${path.sep}tasks${path.sep}tasks${path.sep}`;
  const pos = file.lastIndexOf(suffix);
  if (pos < 0) return fingerprint;
  const workspace = file.slice(0, pos);
  const id = path.basename(file, ".md");
  const entry = manifest(workspace)?.files.find(item => item.source === `tasks/tasks/${id}.md`);
  return entry?.afterFingerprint === fingerprint ? entry.beforeFingerprint : fingerprint;
}

function originalHash(workspace, reference, currentHash, snapshotReference) {
  const migration = manifest(workspace);
  if (!migration) return currentHash;
  // Only manifests present before the cutover may use a recorded relocation transform.
  const snapshot = migration.files.find(item => item.source === snapshotReference);
  if (!snapshot || snapshot.beforeHash !== snapshot.afterHash) return currentHash;
  const entry = migration.files.find(item => item.source === reference);
  return entry?.afterHash === currentHash ? entry.beforeHash : currentHash;
}

module.exports = { MARKER, TARGET, safeFile, layout, relative, taskPath, manifest, originalFingerprint, originalHash, hash };
