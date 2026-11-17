"use strict";

// 隔离调度探针：真实daemon代码，内存队列、HTTP及模型替身，不启动服务或请求模型。
const fs = require("node:fs"), path = require("node:path"), vm = require("node:vm");
const { createRequire } = require("node:module");
const daemonFile = path.resolve("bin/memory/daemon.js"), localRequire = createRequire(daemonFile);
const items = [], running = new Map(), dispatched = [], intervals = [], signals = {}, observations = [];
for (const [workspace, count] of [["/workspace-a", 11], ["/workspace-b", 3]]) for (let i = 0; i < count; i++) items.push({ event: { id: `${workspace}:${i}`, workspace, messages: [] }, state: { status: "queued", attempts: 0 } });
let handler, closed = false;
const server = { once() {}, listen(_port, _host, ready) { ready(); }, address: () => ({ port: 1 }), close() { closed = true; } };
const records = new Map();
const mocks = {
  "node:fs": { ...fs, unlinkSync: key => records.delete(key) },
  "node:http": { createServer(callback) { handler = callback; return server; } },
  "./runtime-files.js": { acquire: () => () => {}, read: key => records.get(key), write: (key, value) => records.set(key, value), file: key => key },
  "./queue.js": { MAX_ATTEMPTS: 2, all: () => items, reconcile() {}, compactCompleted() {}, get: id => items.find(item => item.event.id === id), update(id, patch) { Object.assign(this.get(id).state, patch); }, complete(id) { this.update(id, { status: "completed" }); } },
  "./migration.js": { ensureWorkspace: () => [{ scope: "project", writable: true }], ensure: () => ({ writable: true }) },
  "./agent.js": { MAX_AGENTS_PER_WORKSPACE: 10, reconcile() {}, states: () => [], createManager: () => ({ run(event, { signal }) { dispatched.push(event.id); return new Promise((resolve, reject) => { running.set(event.id, resolve); signal.addEventListener("abort", () => reject(Object.assign(new Error("cancelled"), { code: "INTERRUPTED" })), { once: true }); }); }, close() {} }) },
  "./maintenance.js": { schedule: () => [] }, "./model-config.js": { resolveModel: async () => ({}) }, "./endpoint.js": { resolve: () => ({ port: 1, token: "isolated-probe" }) },
};
const sandbox = { require: name => mocks[name] || localRequire(name), module: { exports: {} }, process: { pid: 0, once: (name, callback) => { signals[name] = callback; } }, console, AbortController, Buffer, URL, setInterval(callback) { intervals.push(callback); return callback; }, clearInterval() {} };
vm.runInNewContext(fs.readFileSync(daemonFile, "utf8"), sandbox, { filename: daemonFile });
const flush = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };
async function request(route, body) {
  let result, code;
  const req = { method: body ? "POST" : "GET", url: route, headers: { host: "127.0.0.1:1", authorization: "Bearer isolated-probe", ...(body ? { "content-type": "application/json" } : {}) }, async *[Symbol.asyncIterator]() { yield Buffer.from(JSON.stringify(body)); } };
  await handler(req, { writeHead(value) { code = value; }, end(value) { result = JSON.parse(value); } });
  return { code, result };
}
(async () => {
  await sandbox.module.exports.main();
  await flush();
  for (let i = 0; i < 3; i++) intervals[0]();
  const first = (await request("/api/status")).result;
  observations.push({ phase: "dispatch", workspaceA: first.activeBatches.filter(item => item.workspace === "/workspace-a").length, workspaceB: first.activeBatches.filter(item => item.workspace === "/workspace-b").length, queued: first.counts.queued, uniqueDispatches: new Set(dispatched).size, totalDispatches: dispatched.length, workspaceLimit: first.maxAgentsPerWorkspace });
  observations.push({ phase: "busy-stop", result: await request("/api/stop", { ifIdle: true }) });
  running.get("/workspace-a:0")();
  await flush();
  intervals[0]();
  const second = (await request("/api/status")).result;
  observations.push({ phase: "fill-free-slot", workspaceA: second.activeBatches.filter(item => item.workspace === "/workspace-a").length, eleventhDispatched: dispatched.includes("/workspace-a:10"), queued: second.counts.queued, uniqueDispatches: new Set(dispatched).size, totalDispatches: dispatched.length });
  signals.SIGTERM();
  await flush();
  intervals[1]();
  const final = (await request("/api/status")).result;
  observations.push({ phase: "shutdown", closed, active: final.activeBatches.length, interrupted: final.counts.interrupted, completed: final.counts.completed });
  console.log(JSON.stringify(observations, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
