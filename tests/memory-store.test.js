"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const YAML = require("yaml");
const store = require("../bin/memory/store.js");

function fixture(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "memory-current-"));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const options = { scope: "project", workspace, home: path.join(workspace, "user") };
  return { options, root: store.rootFor(options) };
}
function mutation(id = "sample", hash = null) {
  return { id, operation: "put", expected: { hash }, content: { title: "宽主题", summary: "适用范围", body: "- [2026-11-09] 当前知识与条件。" } };
}

test("absent reads do not create a store", t => {
  const { root } = fixture(t);
  assert.deepEqual(store.get(root, "sample"), { id: "sample", exists: false, hash: null });
  assert.equal(store.list(root).total, 0);
  assert.equal(fs.existsSync(root), false);
});

test("writes retain only current fields, exact UTF-8 hashes and no history", t => {
  const { options, root } = fixture(t);
  const first = store.mutate(options, mutation()).entry;
  const bytes = fs.readFileSync(path.join(root, "entries/sample.md"));
  assert.equal(first.hash, store.hash(bytes));
  assert.deepEqual(Object.keys(YAML.parse(bytes.toString().split("---\n")[1])), ["title", "summary"]);
  assert.throws(() => store.mutate(options, mutation()), { code: "CONFLICT" });
  const next = mutation("sample", first.hash); next.content.body = "- [2026-11-09] 已纠正的知识。";
  store.mutate(options, next);
  assert.deepEqual(fs.readdirSync(root).sort(), ["entries", "index.md"]);
  assert.equal(store.get(root, "sample").body, next.content.body);
  assert.equal(store.inspectIndex(options).state, "published");
  assert.equal(store.restore, undefined);
  assert.equal(store.history, undefined);
});

test("delete removes the actual file without a tombstone", t => {
  const { options, root } = fixture(t), first = store.mutate(options, mutation()).entry;
  store.mutate(options, { id: first.id, operation: "delete", expected: { hash: first.hash } });
  assert.equal(fs.existsSync(path.join(root, "entries/sample.md")), false);
  assert.equal(store.list(root).total, 0);
  assert.deepEqual(fs.readdirSync(root).sort(), ["entries", "index.md"]);
  assert.equal(store.mutate(options, mutation()).entry.exists, true);
});

test("malformed dates, paragraphs and old metadata are rejected", t => {
  const { options } = fixture(t);
  for (const body of ["paragraph", "- [2026-02-30] 不存在的日期", "- [2026-11-09] case\n  - nested"]) {
    const input = mutation(); input.content.body = body;
    assert.throws(() => store.mutate(options, input), { code: "MEMORY_CASE_FORMAT" });
  }
  const old = mutation(); old.content.sources = ["old"];
  assert.throws(() => store.mutate(options, old), { code: "INVALID_INPUT" });
  const revision = mutation(); revision.expected.revision = 0;
  assert.throws(() => store.mutate(options, revision), { code: "INVALID_INPUT" });
});

test("index rebuild is deterministic and detects current-file drift", t => {
  const { options, root } = fixture(t);
  store.mutate(options, mutation("z-last")); store.mutate(options, mutation("a-first"));
  const before = fs.readFileSync(path.join(root, "index.md"), "utf8");
  store.reindex(options);
  assert.equal(fs.readFileSync(path.join(root, "index.md"), "utf8"), before);
  assert.equal(store.indexPages(root).length, 1);
  assert.equal(store.list(root, { limit: 1 }).items[0].id, "a-first");
  const file = path.join(root, "entries/a-first.md");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("当前知识与条件", "修改后的知识"));
  assert.equal(store.inspectIndex(options).state, "stale");
  store.reindex(options);
  assert.equal(store.inspectIndex(options).state, "published");
});

test("project capacity and body budget permit merging existing files", t => {
  const { options, root } = fixture(t);
  const oversized = mutation(); oversized.content.body = "- [2026-11-09] " + "word ".repeat(1001);
  assert.throws(() => store.mutate(options, oversized), { code: "MEMORY_BUDGET" });
  for (let i = 0; i < 20; i++) store.mutate(options, mutation(`entry-${i}`));
  assert.throws(() => store.mutate(options, mutation("overflow")), { code: "MEMORY_CAPACITY" });
  const current = store.get(root, "entry-0");
  assert.equal(store.mutate(options, mutation(current.id, current.hash)).entry.exists, true);
});

test("unknown fields, traversal and symlink entries fail closed", t => {
  const { options, root } = fixture(t);
  store.mutate(options, mutation());
  assert.throws(() => store.get(root, "../sample"), { code: "INVALID_ID" });
  const file = path.join(root, "entries/sample.md");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("title:", "unknown: true\ntitle:"));
  assert.throws(() => store.get(root, "sample"), { code: "INVALID_INPUT" });
  fs.unlinkSync(file); fs.symlinkSync(path.join(root, "index.md"), file);
  assert.throws(() => store.get(root, "sample"), { code: "SYMLINK" });
});

test("temporary context expires at the seventh UTC midnight without changing long-term knowledge", t => {
  const recent = require("../bin/memory/recent.js");
  const { options, root } = fixture(t);
  let now = Date.parse("2026-11-10T23:59:59.999Z");
  t.mock.method(Date, "now", () => now);
  const body = "- [2026-11-10] 用户近期关注的事项。\n- [2026-11-04] 仍处于窗口的背景。";
  store.mutate(options, { id: "temp", operation: "put", expected: { hash: null }, content: { title: recent.TITLE, summary: recent.SUMMARY, body } });
  store.mutate(options, mutation("context"));
  const original = store.get(root, "temp").hash, longTerm = store.get(root, "context").hash;
  now = Date.parse("2026-11-11T00:00:00.000Z");
  assert.equal(store.get(root, "temp").body, body.split("\n")[0]);
  assert.equal(store.get(root, "temp").hash, original);
  assert.equal(store.pruneTemp(options).changed, true);
  assert.notEqual(store.get(root, "temp").hash, original);
  now = Date.parse("2026-11-17T00:00:00.000Z");
  store.pruneTemp(options);
  assert.equal(store.get(root, "temp").body, "");
  assert.equal(store.get(root, "temp").exists, true);
  assert.equal(store.get(root, "context").hash, longTerm);
  assert.equal(store.inspectIndex(options).state, "published");
  assert.deepEqual(fs.readdirSync(root).sort(), ["entries", "index.md"]);
});

test("temporary metadata, dates and reserved IDs cannot leak or replace arbitrary knowledge", t => {
  const recent = require("../bin/memory/recent.js"), { options, root } = fixture(t);
  t.mock.method(Date, "now", () => Date.parse("2026-11-10T00:00:00.000Z"));
  const input = { id: "temp", operation: "put", expected: { hash: null }, content: { title: recent.TITLE, summary: recent.SUMMARY, body: "- [2026-11-10] 近期背景。" } };
  for (const date of ["2026-11-03", "2026-11-11"]) assert.throws(() => store.mutate(options, { ...input, content: { ...input.content, body: `- [${date}] 不在窗口内。` } }), { code: "TEMP_DATE_RANGE" });
  assert.throws(() => store.mutate(options, { ...input, content: { ...input.content, summary: "会过期的用户意图" } }), { code: "INVALID_TEMP_MEMORY" });
  fs.writeFileSync(path.join(root, "entries/temp.md"), store.encodeEntry({ title: "其他用途", summary: "独有内容", body: "- [2020-01-01] 不得误删。" }));
  const before = store.get(root, "temp");
  assert.equal(store.pruneTemp(options).changed, false);
  assert.throws(() => store.mutate(options, { ...input, expected: { hash: before.hash } }), { code: "TEMP_ID_CONFLICT" });
  assert.equal(store.get(root, "temp").hash, before.hash);
});

test("special badges are project-specific and ordinary or user memories remain ordinary", () => {
  const recent = require("../bin/memory/recent.js");
  assert.equal(recent.kind({ id: "context" }, "project"), "context");
  assert.equal(recent.kind({ id: "lessons" }, "project"), "lessons");
  assert.equal(recent.kind({ id: "temp", title: recent.TITLE, summary: recent.SUMMARY }, "project"), "temp");
  assert.equal(recent.kind({ id: "context" }, "user"), null);
  assert.equal(recent.kind({ id: "temp", title: "其他内容" }, "project"), null);
});

test("user storage uses the same current index and its character budget", t => {
  const f = fixture(t), options = { ...f.options, scope: "user" }, root = store.rootFor(options);
  const oversized = mutation(); oversized.content.body = "- [2026-11-09] " + "字".repeat(8001);
  assert.throws(() => store.mutate(options, oversized), { code: "MEMORY_BUDGET" });
  store.mutate(options, mutation());
  assert.equal(store.inspectIndex(options).index.scope, "user");
  assert.deepEqual(fs.readdirSync(root).sort(), ["entries", "index.md"]);
});
