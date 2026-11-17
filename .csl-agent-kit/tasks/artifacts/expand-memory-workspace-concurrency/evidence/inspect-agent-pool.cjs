"use strict";

// 隔离运行探针：使用真实manager代码与独立的内存SDK替身，不请求模型或操作真实记忆。
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const crypto = require("node:crypto");
const store = require(path.resolve("bin/memory/store.js"));
const recent = require(path.resolve("bin/memory/recent.js"));
const live = require(path.resolve("bin/memory/live.js"));
const agentFile = path.resolve("bin/memory/agent.js");
const localRequire = createRequire(agentFile);
const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "memory-pool-inspect-")));
const workspaces = [path.join(root, "a"), path.join(root, "b")];
workspaces.forEach(workspace => fs.mkdirSync(workspace));
const records = new Map(), creations = [], sessions = [], results = [];
const selection = { provider: "isolated-probe", model: "isolated-probe" };
const flush = async () => { for (let i = 0; i < 12; i++) await Promise.resolve(); };
const event = (workspace, number) => ({ workspace, id: store.hash(`${workspace}:${number}`), session: `session-${number}`, messages: [] });
function makeWorker(item) {
  const prompts = [], messages = [], context = { pendingWrites: new Map() };
  let listener;
  const session = {
    messages, disposed: false,
    subscribe(callback) { listener = callback; return () => { listener = null; }; },
    prompt() { return new Promise(resolve => { prompts.push(() => { messages.push({ role: "assistant", stopReason: "stop" }); resolve(); }); listener?.({ type: "message_end", message: { role: "assistant", content: [{ type: "text", text: item.id }] } }); }); },
    abort() { prompts.shift()?.(); },
    dispose() { this.disposed = true; },
    getLastAssistantText() { return "隔离探针已返回"; },
  };
  sessions.push({ workspace: item.workspace, event: item.id, session, prompts, context });
  return { session, selection, context, roots: { project: item.workspace, user: root }, batches: 0, id: crypto.randomUUID(), created: new Date().toISOString(), utcDay: recent.window().today };
}
const sandbox = {
  require(name) {
    if (name === "./model-config.js") return { resolveModel: async () => selection };
    if (name === "./migration.js") return { ensureWorkspace: () => [{ scope: "project", writable: true }, { scope: "user", writable: true }] };
    if (name === "./store.js") return { ...store, budgetStatus: () => ({ oversized: [], overCapacity: false }), compactionStatus: () => [] };
    if (name === "./runtime-files.js") return { read: key => records.get(key) || null, write: (key, value) => records.set(key, structuredClone(value)), names: prefix => [...records.keys()].filter(key => key.startsWith(`${prefix}/`)).map(key => key.slice(prefix.length + 1)), jobId: id => id };
    if (name === "./live.js") return live;
    return localRequire(name);
  },
  module: { exports: {} }, __dirname: path.dirname(agentFile), Buffer, console, setTimeout, clearTimeout,
  mockCreateMemorySession: item => new Promise(resolve => creations.push({ item, resolve })),
};
vm.runInNewContext(`${fs.readFileSync(agentFile, "utf8")}\ncreateMemorySession = mockCreateMemorySession;`, sandbox, { filename: agentFile });
const manager = sandbox.module.exports.createManager();
const runs = [];
function launch(item, signal) { const run = manager.run(item, { signal }).then(() => "completed", error => error.code); runs.push(run); return run; }
(async () => {
  try {
    const controller = new AbortController();
    for (let i = 0; i < 10; i++) launch(event(workspaces[0], i), i === 0 ? controller.signal : undefined);
    for (let i = 0; i < 2; i++) launch(event(workspaces[1], i));
    await flush();
    results.push({ phase: "creation-reserved", a: creations.filter(item => item.item.workspace === workspaces[0]).length, b: creations.filter(item => item.item.workspace === workspaces[1]).length, eleventh: await manager.run(event(workspaces[0], 10)).catch(error => error.code), duplicate: await manager.run(event(workspaces[0], 0)).catch(error => error.code) });
    creations.splice(0).forEach(item => item.resolve(makeWorker(item.item)));
    await flush();
    const states = sandbox.module.exports.states();
    results.push({ phase: "running", a: states.filter(item => item.workspace === workspaces[0] && item.state === "running").length, b: states.filter(item => item.workspace === workspaces[1] && item.state === "running").length, uniqueSessionIds: new Set(states.map(item => item.sessionId)).size, isolatedLive: sessions.every(item => live.get(item.workspace, item.event).events.every(entry => entry.kind !== "公开回复" || entry.text === item.event)) });
    controller.abort();
    await flush();
    results.push({ phase: "cancel-one", result: await runs[0], otherRunning: sandbox.module.exports.states().filter(item => item.workspace === workspaces[0] && item.state === "running").length, cancelledDisposed: sessions[0].session.disposed });
    launch(event(workspaces[0], 10));
    await flush();
    creations.splice(0).forEach(item => item.resolve(makeWorker(item.item)));
    await flush();
    sessions[1].prompts.shift()();
    await flush();
    const beforeReuse = sessions.length;
    launch(event(workspaces[0], 11));
    await flush();
    results.push({ phase: "reuse-idle", createdAnotherSession: sessions.length !== beforeReuse || creations.length !== 0, retainedSlotsA: sandbox.module.exports.states().filter(item => item.workspace === workspaces[0]).length, activeSessionsA: sessions.filter(item => item.workspace === workspaces[0] && !item.session.disposed).length });
    for (const item of sessions) while (item.prompts.length) item.prompts.shift()();
    await flush();
    const settled = await Promise.all(runs);
    results.push({ phase: "settled", completed: settled.filter(item => item === "completed").length, interrupted: settled.filter(item => item === "INTERRUPTED").length, unexpected: settled.filter(item => !["completed", "INTERRUPTED"].includes(item)) });
    const unresolved = launch(event(workspaces[0], 20));
    await flush();
    let active = sessions.find(item => item.prompts.length);
    active.context.pendingWrites.set("project:topic", { scope: "project", id: "topic", code: "CONFLICT" });
    active.prompts.shift()();
    await flush();
    const followupOffered = active.prompts.length === 1;
    active.prompts.shift()();
    await flush();
    results.push({ phase: "unresolved-write", followupOffered, result: await unresolved, failedSessionDisposed: active.session.disposed, peerSessionsRetained: sessions.filter(item => item.workspace === workspaces[0] && !item.session.disposed).length });
    const recovered = launch(event(workspaces[0], 21));
    await flush();
    creations.splice(0).forEach(item => item.resolve(makeWorker(item.item)));
    await flush();
    active = sessions.find(item => item.prompts.length);
    active.context.pendingWrites.set("project:topic", { scope: "project", id: "topic", code: "CONFLICT" });
    active.prompts.shift()();
    await flush();
    active.context.pendingWrites.clear();
    active.prompts.shift()();
    await flush();
    results.push({ phase: "resolved-write", result: await recovered, retainedSlotsA: sandbox.module.exports.states().filter(item => item.workspace === workspaces[0]).length });
    manager.close();
    results.push({ phase: "close", allDisposed: sessions.every(item => item.session.disposed), stoppedStates: sandbox.module.exports.states().filter(item => item.state === "stopped").length });
    sandbox.module.exports.reconcile();
    results.push({ phase: "reconcile", stateFiles: records.size, slotsA: sandbox.module.exports.states().filter(item => item.workspace === workspaces[0]).map(item => item.agent).sort((a, b) => a - b) });
    console.log(JSON.stringify(results, null, 2));
  } finally { manager.close(); fs.rmSync(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
