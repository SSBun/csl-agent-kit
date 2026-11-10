"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const queue = require("../bin/memory/queue.js");
const runtime = require("../bin/memory/runtime-files.js");
const models = require("../bin/memory/model-config.js");
const store = require("../bin/memory/store.js");
const migration = require("../bin/memory/migration.js");
const maintenance = require("../bin/memory/maintenance.js");

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "csl-memory-runtime-"));
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = path.join(root, "home");
  t.after(() => {
    if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
    else process.env.CSL_AGENT_KIT_HOME = previous;
    fs.rmSync(root, { recursive: true, force: true });
  });
  return { schema: "csl-memory-event/v1", workspace: root, session: "session-1", eventKey: "reply-1", messages: [{ role: "user", text: "隔离验证资料" }, { role: "assistant", text: "未形成长期记忆" }] };
}

test("queued legacy user maintenance does not block scheduling the writable project", t => {
  const event = fixture(t);
  const userRoot = store.rootFor({ scope: "user" });
  fs.mkdirSync(path.join(userRoot, "entries"), { recursive: true });
  fs.writeFileSync(path.join(userRoot, ".format.json"), JSON.stringify({ schema: "csl-memory-store/v1", version: 4, scope: "user" }));
  const options = { scope: "project", workspace: event.workspace };
  migration.ensure(options);
  store.mutate(options, { id: "topic", operation: "put", expected: { hash: null }, content: { title: "主题", summary: "有效范围", body: "- [2026-11-06] 当前有效知识。" } });
  const waiting = queue.enqueue({ ...event, messages: [], maintenance: { scope: "user", ids: ["legacy"] } });
  const before = queue.get(waiting.id);
  assert.deepEqual(maintenance.schedule(queue.all()), []);
  const items = queue.all();
  assert.equal(items.length, 2);
  assert.equal(items.find(item => item.event.maintenance.scope === "project").state.status, "queued");
  assert.deepEqual(queue.get(waiting.id), before);
  // An existing project reservation prevents duplicates, not other scopes.
  assert.deepEqual(maintenance.schedule(items), []);
  assert.equal(queue.all().length, 2);
  assert.deepEqual(queue.get(waiting.id), before);
});

test("daemon dispatch isolates inaccessible and read-only maintenance scopes", async () => {
  const vm = require("node:vm");
  const daemonFile = path.resolve(__dirname, "../bin/memory/daemon.js");
  const localRequire = require("node:module").createRequire(daemonFile);
  const makeItem = (id, workspace, scope) => ({ event: { id, workspace, maintenance: { scope } }, state: { status: "queued", attempts: 0 } });
  const items = [makeItem("missing", "/missing", "project"), makeItem("legacy", "/healthy", "user"), makeItem("ready", "/healthy", "project")];
  const preserved = JSON.stringify(items.slice(0, 2));
  const dispatched = [];
  let tick, handler;
  const server = { once() {}, listen(_port, _host, ready) { ready(); }, address() { return { port: 1 }; }, close() {} };
  const mocks = {
    "node:http": { createServer(callback) { handler = callback; return server; } },
    "./runtime-files.js": { acquire: () => () => {}, write() {} },
    "./queue.js": {
      MAX_ATTEMPTS: 2, all: () => items, reconcile() {}, compactCompleted() {},
      get: id => items.find(item => item.event.id === id),
      update(id, patch) { Object.assign(this.get(id).state, patch); },
      complete(id) { this.update(id, { status: "completed" }); },
    },
    "./migration.js": {
      ensure({ workspace, scope }) {
        if (workspace === "/missing") throw Object.assign(new Error("Workspace unavailable"), { code: "ENOENT" });
        return { writable: scope === "project" };
      },
      ensureWorkspace: () => [{ scope: "project", writable: true }],
    },
    "./agent.js": { reconcile() {}, states: () => [], createManager: () => ({ async run(event) { dispatched.push(event.id); }, close() {} }) },
    "./maintenance.js": { schedule: () => [] },
    "./model-config.js": { resolveModel: async () => ({}) },
    "./endpoint.js": { resolve: () => ({ port: 1, token: "test-only" }) },
  };
  const sandbox = {
    require: name => mocks[name] || localRequire(name), module: { exports: {} },
    process: { pid: 0, once() {} }, console, AbortController, Buffer, URL,
    setInterval(callback) { tick = callback; return 0; }, clearInterval() {},
  };
  vm.runInNewContext(fs.readFileSync(daemonFile, "utf8"), sandbox, { filename: daemonFile });
  await sandbox.module.exports.main();
  tick();
  await Promise.resolve();
  assert.deepEqual(dispatched, ["ready"]);
  assert.equal(JSON.stringify(items.slice(0, 2)), preserved);
  assert.equal(items[2].state.status, "completed");
  let status;
  await handler({ method: "GET", url: "/api/status", headers: { host: "127.0.0.1:1", authorization: "Bearer test-only" } }, {
    writeHead() {}, end(value) { status = JSON.parse(value); },
  });
  assert.match(status.schedulerError, /\/missing: ENOENT/);
});

test("queue deduplicates identical payload and rejects conflicting event reuse", (t) => {
  const event = fixture(t);
  const first = queue.enqueue(event);
  assert.equal(first.status, "queued");
  assert.equal(queue.enqueue(event).duplicate, true);
  assert.equal(queue.list().total, 1);
  assert.throws(() => queue.enqueue({ ...event, messages: [{ role: "user", text: "不同内容" }] }), { code: "EVENT_CONFLICT" });
  assert.equal(queue.get(first.id).event.messages[0].text, "隔离验证资料");
});

test("queue rejects hidden roles and oversized increments instead of truncating", (t) => {
  const event = fixture(t);
  assert.throws(() => queue.enqueue({ ...event, messages: [{ role: "thinking", text: "not visible" }] }), { code: "INVALID_EVENT" });
  assert.throws(() => queue.enqueue({ ...event, messages: [{ role: "user", text: "a".repeat(150000) }] }), { code: "EVENT_TOO_LARGE" });
  assert.equal(queue.list().total, 0);
});

test("restart preserves interrupted work and explicit retry preserves effects", (t) => {
  const first = queue.enqueue(fixture(t));
  const effects = [{ scope: "project", transaction: "existing-transaction" }];
  queue.update(first.id, { status: "running", attempts: 1, effects });
  queue.reconcile();
  assert.equal(queue.get(first.id).state.status, "interrupted");
  queue.retry(first.id);
  assert.equal(queue.get(first.id).state.status, "queued");
  assert.deepEqual(queue.get(first.id).state.effects, effects);
  assert.throws(() => queue.retry(first.id), { code: "INVALID_STATE" });
});

test("durable event survives interruption before job state creation", (t) => {
  const first = queue.enqueue(fixture(t));
  fs.unlinkSync(runtime.file(`jobs/${first.id}.json`));
  assert.equal(queue.get(first.id).state.status, "untracked");
  queue.reconcile();
  assert.equal(queue.get(first.id).state.status, "queued");
});

test("live runtime lock is exclusive and released by its owner", (t) => {
  fixture(t);
  const release = runtime.acquire("probe.lock");
  assert.throws(() => runtime.acquire("probe.lock"), { code: "LOCKED" });
  release();
  const second = runtime.acquire("probe.lock");
  second();
});

test("explicit Memory model is independent; reset removes override", async (t) => {
  fixture(t);
  models.setModel("example/model-a");
  assert.deepEqual(await models.resolveModel(), { provider: "example", model: "model-a", source: "memory-override" });
  models.setModel(null);
  assert.equal(models.readConfig().model, null);
  assert.throws(() => models.setModel("ambiguous-model"), { code: "INVALID_MODEL" });
  assert.throws(() => models.setModel("provider/model with spaces"), { code: "INVALID_MODEL" });
});
