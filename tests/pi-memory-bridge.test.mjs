import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { registerMemoryBridge } from "../pi/lib/memory-bridge.ts";

const require = createRequire(import.meta.url);
const store = require("../bin/memory/store.js");
const migration = require("../bin/memory/migration.js");
const queue = require("../bin/memory/queue.js");
const service = require("../bin/memory/service.js");
const hooks = require("../skills/meta/agent-hooks/scripts/agent-hooks.js");

for (const [user, project] of [[true, false], [false, true], [true, true], [false, false]]) {
  test(`settled conversation uses writable scopes: user=${user}, project=${project}`, async t => {
    const temporary = mkdtempSync(join(tmpdir(), "csl-memory-bridge-"));
    const previous = process.env.CSL_AGENT_KIT_HOME;
    process.env.CSL_AGENT_KIT_HOME = temporary;
    t.after(() => {
      if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME;
      else process.env.CSL_AGENT_KIT_HOME = previous;
      rmSync(temporary, { recursive: true, force: true });
    });
    t.mock.method(store, "indexMetadata", () => ({ formatVersion: project ? 5 : 4 }));
    t.mock.method(migration, "ensureWorkspace", () => [{ scope: "user", writable: user }, { scope: "project", writable: project }]);
    t.mock.method(hooks, "createEvent", input => input);
    t.mock.method(hooks, "runEvent", input => {
      queue.enqueue(input.nativePayload.memoryEvent);
      return { diagnostics: [] };
    });
    t.mock.method(service, "status", async () => ({ running: false }));
    const handlers = new Map(), cursors = [], notices = [];
    registerMemoryBridge({ on: (name, callback) => handlers.set(name, callback), appendEntry: (name, data) => cursors.push({ name, data }) });
    const branch = [
      { type: "message", id: "user-1", timestamp: "2026-11-10T00:00:00.000Z", message: { role: "user", content: "长期适用的约定。" } },
      { type: "message", id: "answer-1", timestamp: "2026-11-10T00:01:00.000Z", message: { role: "assistant", content: "已明确适用范围。" } },
    ];
    await handlers.get("agent_settled")({}, {
      cwd: process.cwd(), mode: "rpc",
      sessionManager: { getBranch: () => branch, getSessionId: () => "bridge-regression" },
      ui: { theme: { fg: (_color, text) => text }, setStatus() {}, notify: message => notices.push(message) },
    });
    assert.deepEqual(notices, []);
    assert.equal(queue.all().length, user || project ? 1 : 0);
    assert.equal(cursors.length, user || project ? 1 : 0);
    if (user || project) {
      assert.equal(cursors[0].data.lastEntryId, "answer-1");
      assert.equal(queue.all()[0].event.messages[0].at, "2026-11-10T00:00:00.000Z");
    }
  });
}
