"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const store = require("./store.js");

function runtimeRoot() {
  return store.safePath(store.rootFor({ scope: "user" }), ".service");
}

function file(relative) { return store.safePath(runtimeRoot(), relative); }
function read(relative) {
  const raw = store.readOptional(file(relative), 2 * 1024 * 1024);
  return raw === null ? null : JSON.parse(raw);
}
function write(relative, value) {
  const target = file(relative);
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  store.atomicWrite(target, `${JSON.stringify(value, null, 2)}\n`);
}

function alive(owner) {
  if (!owner || owner.host !== os.hostname() || !Number.isSafeInteger(owner.pid) || owner.pid < 1) return null;
  try { process.kill(owner.pid, 0); return true; } catch (error) {
    return error.code === "ESRCH" ? false : null;
  }
}

function acquire(relative) {
  const target = file(relative);
  fs.mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
  const owner = { pid: process.pid, host: os.hostname(), nonce: crypto.randomUUID() };
  const bytes = `${JSON.stringify(owner)}\n`;
  const create = () => {
    const fd = fs.openSync(target, "wx", 0o600);
    try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  };
  try { create(); } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (alive(read(relative)) !== false) store.fail("LOCKED", `Memory runtime lock is active or unverifiable: ${relative}`);
    // Serialize stale-lock reclamation. A crashed reaper requires inspection;
    // do not recursively reclaim unknown locks or interrupt a live PID.
    const reaper = `${target}.reaper`;
    let fd;
    try { fd = fs.openSync(reaper, "wx", 0o600); } catch (reaperError) {
      if (reaperError.code === "EEXIST") store.fail("LOCKED", `Lock recovery is active or needs inspection: ${relative}`);
      throw reaperError;
    }
    try {
      if (alive(read(relative)) !== false) store.fail("LOCKED", `Lock owner changed: ${relative}`);
      fs.unlinkSync(target);
      create();
    } finally { fs.closeSync(fd); fs.unlinkSync(reaper); }
  }
  return () => {
    if (store.readOptional(target) === bytes) fs.unlinkSync(target);
  };
}

function names(relative) {
  try { return fs.readdirSync(file(relative)).filter((name) => name.endsWith(".json")).sort(); } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function jobId(id) {
  if (typeof id !== "string" || !/^[a-f0-9]{64}$/.test(id)) store.fail("INVALID_ID", "Invalid maintenance event ID");
  return id;
}

module.exports = { runtimeRoot, file, read, write, acquire, alive, names, jobId };
