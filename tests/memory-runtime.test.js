"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const queue = require("../bin/memory/queue.js");
const runtime = require("../bin/memory/runtime-files.js");
const models = require("../bin/memory/model-config.js");

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
