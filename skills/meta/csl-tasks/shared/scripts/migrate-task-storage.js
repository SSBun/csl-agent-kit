#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { fileURLToPath } = require("node:url");
const storage = require("../lib/task-storage.js");
const core = require("../lib/task-core.js");

function inventory(workspace, directory = "tasks") {
  const files = [], directories = [];
  function walk(relative) {
    const absolute = storage.safeFile(workspace, relative), stat = fs.lstatSync(absolute);
    if (stat.isDirectory()) {
      if (relative.endsWith("/.topic-write.lock")) throw new Error("Task writer lock exists; coordinate writers before migration");
      directories.push({ path: relative, mode: stat.mode & 0o777 });
      for (const name of fs.readdirSync(absolute).sort()) walk(`${relative}/${name}`);
    } else if (stat.isFile()) files.push({ source: relative, mode: stat.mode & 0o777, size: stat.size, beforeHash: storage.hash(fs.readFileSync(absolute)) });
    else throw new Error(`unsupported migration entry: ${relative}`);
  }
  walk(directory);
  return { files, directories };
}

function rebaseLinks(text, source, workspace) {
  const destination = `${storage.TARGET}${source.slice(5)}`;
  const rewrite = line => line.replace(/(`+)([^`]*?)\1|(\]\()(<[^>\n]+>|[^\s)]+)(\))/g, (full, code, _literal, start, raw, end) => {
    if (code) return full;
    const angle = raw.startsWith("<"), link = angle ? raw.slice(1, -1) : raw;
    if (!link || link.startsWith("#") || (/^[a-z][a-z0-9+.-]*:/i.test(link) && !link.startsWith("file:"))) return full;
    const hashAt = link.indexOf("#"), fragment = hashAt < 0 ? "" : link.slice(hashAt), name = hashAt < 0 ? link : link.slice(0, hashAt);
    let target;
    try { target = name.startsWith("file:") ? fileURLToPath(name) : path.resolve(workspace, path.dirname(source), decodeURIComponent(name)); } catch { return full; }
    const relative = path.relative(workspace, target).split(path.sep).join("/");
    if (relative.startsWith("../") || path.isAbsolute(relative)) return full;
    const moved = relative === "tasks" || relative.startsWith("tasks/") ? `${storage.TARGET}${relative.slice(5)}` : relative;
    const relativeTarget = path.posix.relative(path.posix.dirname(destination), moved) || ".";
    const replacement = relativeTarget.split("/").map(encodeURIComponent).join("/") + (name.endsWith("/") ? "/" : "") + fragment;
    if (!name.startsWith("file:") && replacement === link) return full;
    return `${start}${angle ? "<" : ""}${replacement}${angle ? ">" : ""}${end}`;
  });
  let fence;
  return text.split(/(?<=\n)/).map(line => {
    const match = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fence) {
      if (match && match[1][0] === fence[0] && match[1].length >= fence.length && !line.slice(match[0].length).trim()) fence = undefined;
      return line;
    }
    if (match) { fence = match[1]; return line; }
    return /^(?: {4}|\t)/.test(line) ? line : rewrite(line);
  }).join("");
}

function verifyTopicIdentity(source, before, after) {
  if (!/^tasks\/topics\/[^/]+\.md$/.test(source)) return;
  for (const name of ["Scope", "Spec Context", "Decisions", "Dependencies"]) {
    const contents = text => core.sectionsOf(text, name).map(section => section.lines.slice(section.start, section.end).join("\n"));
    if (JSON.stringify(contents(before)) !== JSON.stringify(contents(after))) throw new Error(`Topic normative content would change during migration: ${source} (${name}); explicit identity migration is required`);
  }
}

function copyFile(source, target, mode) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target, fs.constants.COPYFILE_EXCL);
  fs.chmodSync(target, mode);
  const stat = fs.statSync(source);
  fs.utimesSync(target, stat.atime, stat.mtime);
}

function renameExclusive(source, destination) {
  // No check-then-rename: the kernel must reject an already existing destination.
  const program = `import ctypes,os,sys\nlib=ctypes.CDLL(None,use_errno=True)\na,b=map(os.fsencode,sys.argv[1:])\nif sys.platform=='darwin':\n f=lib.renamex_np; f.argtypes=[ctypes.c_char_p,ctypes.c_char_p,ctypes.c_uint]; r=f(a,b,4)\nelif sys.platform.startswith('linux'):\n f=lib.renameat2; f.argtypes=[ctypes.c_int,ctypes.c_char_p,ctypes.c_int,ctypes.c_char_p,ctypes.c_uint]; r=f(-100,a,-100,b,1)\nelse: raise RuntimeError('atomic no-replace rename unavailable')\nif r: raise OSError(ctypes.get_errno(),os.strerror(ctypes.get_errno()))\n`;
  execFileSync("python3", ["-c", program, source, destination], { stdio: "pipe" });
}

function prepare(workspace, id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || "")) throw new Error("canonical migration ID required");
  if (storage.layout(workspace).root !== "tasks") throw new Error("workspace already uses unified Task storage");
  const location = storage.safeFile(workspace, `.csl-agent-kit/migrations/${id}`);
  fs.mkdirSync(location, { recursive: false, mode: 0o700 });
  const original = inventory(workspace);
  const files = original.files.map(item => {
    const from = storage.safeFile(workspace, item.source), backup = path.join(location, "before", item.source), stage = path.join(location, "stage", item.source);
    copyFile(from, backup, item.mode);
    copyFile(from, stage, item.mode);
    const mutable = /^tasks\/(tasks|topics)\/[^/]+\.md$/.test(item.source);
    let after = fs.readFileSync(from);
    const change = { ...item, target: `${storage.TARGET}${item.source.slice(5)}` };
    if (mutable) {
      const beforeText = after.toString("utf8"), afterText = rebaseLinks(beforeText, item.source, workspace);
      verifyTopicIdentity(item.source, beforeText, afterText);
      after = Buffer.from(afterText);
      if (item.source.startsWith("tasks/tasks/")) {
        change.beforeFingerprint = core.reviewTaskFingerprint(beforeText);
        change.afterFingerprint = core.reviewTaskFingerprint(afterText);
      }
      fs.writeFileSync(stage, after);
    }
    change.afterHash = storage.hash(after);
    change.afterSize = after.length;
    return change;
  });
  for (const directory of original.directories) {
    for (const prefix of ["before", "stage"]) {
      const target = path.join(location, prefix, directory.path);
      fs.mkdirSync(target, { recursive: true });
      fs.chmodSync(target, directory.mode);
    }
  }
  if (JSON.stringify(inventory(workspace)) !== JSON.stringify(original)) throw new Error("source drift during preparation; keep backup and prepare a new inventory");
  const manifest = { schema: "csl-task-migration/v1", id, source: "tasks", target: storage.TARGET, directories: original.directories, files };
  fs.writeFileSync(path.join(location, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n", { flag: "wx", mode: 0o600 });
  const repairedDocuments = files.filter(f => f.beforeHash !== f.afterHash).length;
  fs.writeFileSync(path.join(location, "README.md"), `# Task目录迁移清单\n\n本文记录准备时点，不是实时状态；实时切换状态见工作区存储标记及state.json。\n\n所属范围：用户明确选定的工作区原tasks整树，内部分类不变；不包括Memory库和源码。\n\n目标：${storage.TARGET}。共${files.length}个文件、${original.directories.length}个目录；${repairedDocuments}份可变记录需要链接重定位。逐项相对路径、大小、权限、前后SHA256和处理结果以manifest.json为准。\n\n原文备份在before/tasks，待发布树在stage/tasks；执行apply后原树移入retired-tasks作为恢复材料，不自动删除。历史产物与审查证据原文保持不变。\n\n中断时先检查存储标记及树状态；只对匹配清单续做或回滚，不能覆盖新的用户修改。\n`, { flag: "wx", mode: 0o600 });
  core.atomicWrite(path.join(location, "state.json"), JSON.stringify({ schema: "csl-task-migration-state/v1", phase: "prepared" }) + "\n");
  return { location, files: files.length, repairedDocuments, status: "prepared" };
}

function verifyTree(workspace, directory, plan, after = false) {
  const actual = inventory(workspace, directory);
  const files = actual.files.map(item => ({ ...item, source: `tasks${item.source.slice(directory.length)}` }));
  const expected = plan.files.map(item => ({ source: item.source, mode: item.mode, size: after ? item.afterSize : item.size, beforeHash: after ? item.afterHash : item.beforeHash }));
  const directories = actual.directories.map(item => ({ ...item, path: `tasks${item.path.slice(directory.length)}` }));
  if (JSON.stringify(files) !== JSON.stringify(expected) || JSON.stringify(directories) !== JSON.stringify(plan.directories)) throw new Error(`migration tree drift: ${directory}`);
}

function apply(workspace, id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || "")) throw new Error("canonical migration ID required");
  const relative = `migrations/${id}/manifest.json`, file = storage.safeFile(workspace, `.csl-agent-kit/${relative}`), bytes = fs.readFileSync(file), plan = JSON.parse(bytes), location = path.dirname(file);
  if (plan.schema !== "csl-task-migration/v1" || plan.id !== id || plan.source !== "tasks" || plan.target !== storage.TARGET) throw new Error("invalid migration manifest");
  const markerFile = storage.safeFile(workspace, storage.MARKER), target = storage.safeFile(workspace, storage.TARGET);
  const old = storage.safeFile(workspace, "tasks"), retired = path.join(location, "retired-tasks"), stage = path.join(location, "stage/tasks");
  const expected = { schema: "csl-task-storage/v1", state: "migrating", manifest: relative, sha256: storage.hash(bytes) };
  const record = phase => core.atomicWrite(storage.safeFile(workspace, `.csl-agent-kit/migrations/${id}/state.json`), JSON.stringify({ schema: "csl-task-migration-state/v1", phase }) + "\n");
  if (fs.existsSync(markerFile)) {
    const marker = JSON.parse(fs.readFileSync(markerFile, "utf8"));
    if (JSON.stringify(marker) === JSON.stringify({ ...expected, state: "unified" })) { record("completed"); return { status: "current", target }; }
    if (JSON.stringify(marker) !== JSON.stringify(expected)) throw new Error("conflicting storage marker; do not overwrite");
  } else {
    if (fs.existsSync(target) || fs.existsSync(retired)) throw new Error("migration destination already exists");
    const current = inventory(workspace);
    if (JSON.stringify(current.files) !== JSON.stringify(plan.files.map(({ source, mode, size, beforeHash }) => ({ source, mode, size, beforeHash }))) || JSON.stringify(current.directories) !== JSON.stringify(plan.directories)) throw new Error("source drift; prepare a new inventory");
    fs.writeFileSync(markerFile, JSON.stringify(expected) + "\n", { flag: "wx", mode: 0o600 });
  }
  record("frozen");
  if (fs.existsSync(target) && fs.existsSync(stage)) throw new Error("destination collision; staged tree has not been published");
  verifyTree(workspace, `.csl-agent-kit/migrations/${id}/before/tasks`, plan);
  verifyTree(workspace, fs.existsSync(target) ? storage.TARGET : `.csl-agent-kit/migrations/${id}/stage/tasks`, plan, true);
  // Verify every retained original and published/staged byte before any further step.
  for (const item of plan.files) {
    const backup = storage.safeFile(workspace, `.csl-agent-kit/migrations/${id}/before/${item.source}`);
    const candidate = fs.existsSync(target) ? storage.safeFile(workspace, item.target) : storage.safeFile(workspace, `.csl-agent-kit/migrations/${id}/stage/${item.source}`);
    const before = fs.readFileSync(backup), after = fs.readFileSync(candidate);
    if (storage.hash(before) !== item.beforeHash || storage.hash(after) !== item.afterHash) throw new Error(`migration bytes changed: ${item.source}`);
    verifyTopicIdentity(item.source, before.toString("utf8"), after.toString("utf8"));
  }
  if (fs.existsSync(old)) {
    const current = inventory(workspace);
    if (JSON.stringify(current.files) !== JSON.stringify(plan.files.map(({ source, mode, size, beforeHash }) => ({ source, mode, size, beforeHash })))) throw new Error("source changed after freeze; inspect before resume");
    renameExclusive(old, retired);
    record("source-retained");
  } else if (!fs.existsSync(retired)) throw new Error("original source and retired source both missing");
  verifyTree(workspace, `.csl-agent-kit/migrations/${id}/retired-tasks`, plan);
  if (!fs.existsSync(target)) { renameExclusive(stage, target); record("published"); }
  verifyTree(workspace, storage.TARGET, plan, true);
  if (fs.existsSync(old)) throw new Error("old Task root reappeared during migration; keep frozen and inspect writers");
  core.atomicWrite(markerFile, JSON.stringify({ ...expected, state: "unified" }) + "\n");
  record("completed");
  return { status: "migrated", target, retainedOriginal: retired, manifest: relative, files: plan.files.length };
}

function rollback(workspace, id) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id || "")) throw new Error("canonical migration ID required");
  const relative = `migrations/${id}/manifest.json`, location = storage.safeFile(workspace, `.csl-agent-kit/migrations/${id}`);
  const bytes = fs.readFileSync(path.join(location, "manifest.json")), plan = JSON.parse(bytes);
  const markerFile = storage.safeFile(workspace, storage.MARKER), marker = fs.readFileSync(markerFile, "utf8");
  const expected = { schema: "csl-task-storage/v1", state: "migrating", manifest: relative, sha256: storage.hash(bytes) };
  if (JSON.stringify(JSON.parse(marker)) !== JSON.stringify(expected)) throw new Error("only an incomplete matching migration can be rolled back; preserve later changes");
  const target = storage.safeFile(workspace, storage.TARGET), stage = path.join(location, "stage/tasks");
  const old = storage.safeFile(workspace, "tasks"), retired = path.join(location, "retired-tasks");
  verifyTree(workspace, `.csl-agent-kit/migrations/${id}/before/tasks`, plan);
  if (fs.existsSync(target)) {
    if (fs.existsSync(stage)) throw new Error("conflicting target and stage; inspect before rollback");
    verifyTree(workspace, storage.TARGET, plan, true);
    renameExclusive(target, stage);
  }
  if (fs.existsSync(retired)) {
    if (fs.existsSync(old)) throw new Error("old root reappeared; preserve new writes before rollback");
    verifyTree(workspace, `.csl-agent-kit/migrations/${id}/retired-tasks`, plan);
    renameExclusive(retired, old);
  }
  verifyTree(workspace, "tasks", plan);
  if (fs.readFileSync(markerFile, "utf8") !== marker) throw new Error("migration marker changed during rollback");
  fs.unlinkSync(markerFile);
  core.atomicWrite(storage.safeFile(workspace, `.csl-agent-kit/migrations/${id}/state.json`), JSON.stringify({ schema: "csl-task-migration-state/v1", phase: "rolled-back" }) + "\n");
  return { status: "rolled-back", backupsRetained: true };
}

if (require.main === module) {
  try {
    const [command, workspaceArg, id] = process.argv.slice(2);
    const workspace = fs.realpathSync(workspaceArg || process.cwd());
    if (!["prepare", "apply", "rollback"].includes(command)) throw new Error("usage: migrate-task-storage.js prepare|apply|rollback <workspace> <migration-id>");
    if (command === "prepare") fs.mkdirSync(storage.safeFile(workspace, ".csl-agent-kit/migrations"), { recursive: true, mode: 0o700 });
    console.log(JSON.stringify(({ prepare, apply, rollback })[command](workspace, id)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { inventory, rebaseLinks, renameExclusive, prepare, apply, rollback };
