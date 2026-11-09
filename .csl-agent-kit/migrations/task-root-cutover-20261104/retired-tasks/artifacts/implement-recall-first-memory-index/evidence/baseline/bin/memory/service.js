"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const runtime = require("./runtime-files.js");
const store = require("./store.js");
const queue = require("./queue.js");

async function request(route, { method = "GET", body } = {}) {
  const descriptor = runtime.read("daemon.json");
  if (!descriptor || descriptor.schema !== "csl-memory-daemon/v1" || !Number.isInteger(descriptor.port) || descriptor.port < 1 || descriptor.port > 65535 || !/^[a-f0-9]{64}$/.test(descriptor.token)) store.fail("SERVICE_UNAVAILABLE", "Memory service is not ready");
  const response = await fetch(`http://127.0.0.1:${descriptor.port}${route}`, {
    method, headers: { Authorization: `Bearer ${descriptor.token}`, "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(1500), redirect: "error",
  });
  const value = await response.json();
  if (!response.ok) store.fail(value.error?.code || "SERVICE_ERROR", value.error?.message || `Memory service HTTP ${response.status}`);
  return value;
}

async function status() {
  try { return await request("/api/status"); } catch (error) {
    const lock = runtime.read("daemon.lock");
    return { running: false, state: runtime.alive(lock) === true ? "unreachable-or-starting" : "stopped", error: error.code || error.message, startupError: runtime.read("startup-error.json") };
  }
}

async function ensureStarted() {
  const current = await status();
  if (current.running) {
    if (current.protocol !== 2) store.fail("SERVICE_UPGRADE_REQUIRED", "An older Memory daemon is running; use memory service restart before dispatching new work");
    return current;
  }
  if (current.state === "unreachable-or-starting") return current;
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 22 || major === 22 && minor < 19) store.fail("NODE_UNSUPPORTED", "Memory Agent requires Node >=22.19 for the Pi SDK; local store reads remain available");
  fs.mkdirSync(runtime.runtimeRoot(), { recursive: true, mode: 0o700 });
  const log = fs.openSync(runtime.file("daemon.log"), "a", 0o600);
  try {
    const child = spawn(process.execPath, [path.join(__dirname, "daemon.js")], { detached: true, stdio: ["ignore", log, log], env: process.env });
    child.on("error", (error) => {
      try { runtime.write("startup-error.json", { at: new Date().toISOString(), message: error.message }); } catch { /* Startup failure remains visible as unreachable. */ }
    });
    child.unref();
    return { running: false, state: "starting", pid: child.pid || null };
  } finally { fs.closeSync(log); }
}

async function enqueue(event) {
  const current = await status();
  if (current.running && current.protocol !== 2) store.fail("SERVICE_UPGRADE_REQUIRED", "Restart the older daemon before enqueueing new work");
  const receipt = queue.enqueue(event);
  try { return { ...receipt, service: await ensureStarted() }; } catch (error) {
    return { ...receipt, service: { running: false, state: "unavailable", error: error.message } };
  }
}

async function dashboard() {
  const state = await ensureStarted();
  if (!state.running) return { ...state, message: "服务尚未就绪；就绪后重新执行 memory dashboard。" };
  const descriptor = runtime.read("daemon.json");
  return { url: `http://127.0.0.1:${descriptor.port}/#${descriptor.token}`, warning: "此 URL 含本机审计授权；不要分享。" };
}

async function restart() {
  const current = await status();
  if (current.running) await request("/api/stop", { method: "POST", body: {} });
  for (let i = 0; i < 50; i++) {
    const lock = runtime.read("daemon.lock");
    if (!lock || runtime.alive(lock) === false) return ensureStarted();
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  store.fail("SERVICE_STOPPING", "Memory service is still stopping; inspect active work before restarting");
}

module.exports = { request, status, ensureStarted, enqueue, dashboard, restart };
