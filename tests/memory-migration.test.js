"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const store = require("../bin/memory/store.js");
const migration = require("../bin/memory/migration.js");

function fixture(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "memory-upgrade-"));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const options = { scope: "project", workspace, home: path.join(workspace, "user") };
  const root = store.rootFor(options);
  fs.mkdirSync(path.join(root, "entries"), { recursive: true });
  fs.writeFileSync(path.join(root, ".format.json"), JSON.stringify({ schema: "csl-memory-store/v1", version: 4, scope: "project" }));
  return { options, root };
}
function legacy(root, id = "current", deleted = false, body = "- [2026-11-06] 保留知识与条件。") {
  const raw = `---\nschema: csl-memory/v2\nid: ${id}\nrevision: 7\ntype: fact\ntitle: 宽主题\nsummary: 当前范围\nsources: [old-source]\nupdated: 2026-11-06T00:00:00.000Z\ndeleted: ${deleted}\n---\n\n${body}\n`;
  fs.writeFileSync(path.join(root, `entries/${id}.md`), raw);
  return raw;
}

test("legacy ensure and preview are read-only and do not expose source bodies", t => {
  const { options, root } = fixture(t), raw = legacy(root);
  assert.equal(migration.ensure(options).writable, false);
  const plan = migration.preview(options);
  assert.equal(plan.status, "needed");
  assert.equal(plan.active, 1);
  assert.equal(JSON.stringify(plan).includes("old-source"), false);
  assert.equal(fs.readFileSync(path.join(root, "entries/current.md"), "utf8"), raw);
  assert.equal(fs.existsSync(path.join(root, "index.md")), false);
});

test("explicit scoped upgrade preserves live knowledge and permanently removes internals", t => {
  const { options, root } = fixture(t); legacy(root); legacy(root, "removed", true, "已删除");
  for (const name of [".history", ".proposals", ".migrations", ".indexes"]) {
    fs.mkdirSync(path.join(root, name)); fs.writeFileSync(path.join(root, name, "old.json"), "old");
  }
  const user = store.rootFor({ ...options, scope: "user" }); fs.mkdirSync(user, { recursive: true });
  fs.writeFileSync(path.join(user, "untouched.txt"), "other scope");
  const before = store.get(root, "current");
  migration.upgrade(options);
  const after = store.get(root, "current");
  for (const key of ["title", "summary", "body"]) assert.equal(after[key], before[key]);
  assert.equal(after.legacy, false);
  assert.equal(store.get(root, "removed").exists, false);
  assert.deepEqual(fs.readdirSync(root).sort(), ["entries", "index.md"]);
  assert.equal(store.inspectIndex(options).state, "published");
  assert.equal(fs.readFileSync(path.join(user, "untouched.txt"), "utf8"), "other scope");
  const hash = after.hash; migration.upgrade(options);
  assert.equal(store.get(root, "current").hash, hash);
});

test("invalid current knowledge blocks conversion before any file is removed", t => {
  const { options, root } = fixture(t), first = legacy(root), bad = legacy(root, "invalid", false, "undated paragraph");
  assert.throws(() => migration.upgrade(options), { code: "MEMORY_CASE_FORMAT" });
  assert.equal(fs.readFileSync(path.join(root, "entries/current.md"), "utf8"), first);
  assert.equal(fs.readFileSync(path.join(root, "entries/invalid.md"), "utf8"), bad);
  assert.equal(fs.existsSync(path.join(root, ".format.json")), true);
});

test("unknown versions and live writers are rejected", t => {
  const { options, root } = fixture(t); legacy(root);
  fs.writeFileSync(path.join(root, ".write-lock-v4"), JSON.stringify({ host: os.hostname(), pid: process.pid }));
  assert.throws(() => migration.upgrade(options), { code: "LOCKED" });
  fs.unlinkSync(path.join(root, ".write-lock-v4"));
  fs.writeFileSync(path.join(root, ".format.json"), JSON.stringify({ schema: "csl-memory-store/v1", version: 999 }));
  assert.throws(() => migration.preview(options), { code: "UNSUPPORTED_STORE" });
});

test("prepared legacy conversion is conditional and validates the whole scope before writing", t => {
  const { options, root } = fixture(t);
  const raw = legacy(root, "current", false, "undated paragraph");
  const put = { id: "current", operation: "put", expected: { hash: store.hash(raw) }, content: { title: "宽主题", summary: "当前范围", body: "- [2026-11-06] 经核对的知识。" } };
  assert.throws(() => migration.upgrade({ ...options, prepared: [{ ...put, expected: { hash: "0".repeat(64) } }] }), { code: "CONFLICT" });
  assert.throws(() => migration.upgrade({ ...options, prepared: [put, put] }), { code: "INVALID_INPUT" });
  assert.throws(() => migration.upgrade({ ...options, prepared: [{ ...put, id: "missing" }] }), { code: "INVALID_INPUT" });
  const invalid = legacy(root, "invalid", false, "another undated paragraph");
  assert.throws(() => migration.upgrade({ ...options, prepared: [put] }), { code: "MEMORY_CASE_FORMAT" });
  assert.equal(fs.readFileSync(path.join(root, "entries/current.md"), "utf8"), raw);
  assert.equal(fs.readFileSync(path.join(root, "entries/invalid.md"), "utf8"), invalid);
  assert.equal(fs.existsSync(path.join(root, ".format.json")), true);
  fs.unlinkSync(path.join(root, "entries/invalid.md"));
  migration.upgrade({ ...options, prepared: [put] });
  assert.equal(store.get(root, "current").body, put.content.body);
  assert.equal(store.inspectIndex(options).state, "published");
  const current = store.get(root, "current");
  assert.throws(() => migration.upgrade({ ...options, prepared: [{ ...put, expected: { hash: current.hash } }] }), { code: "INVALID_INPUT" });
  assert.equal(store.get(root, "current").hash, current.hash);
});

test("new stores do not import retired Context or Lessons", t => {
  const { options, root } = fixture(t); fs.rmSync(root, { recursive: true });
  fs.mkdirSync(path.join(options.workspace, "tasks"));
  fs.writeFileSync(path.join(options.workspace, "tasks/context.md"), "retired source");
  assert.equal(migration.ensure(options).writable, true);
  assert.equal(store.entries(root).length, 0);
  assert.deepEqual(fs.readdirSync(root).sort(), ["entries", "index.md"]);
});
