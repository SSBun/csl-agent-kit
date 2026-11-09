"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const store = require("../bin/memory/store.js");
const migration = require("../bin/memory/migration.js");

function fixture(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "csl-memory-upgrade-"));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  fs.mkdirSync(path.join(workspace, "tasks"));
  const source = "# Old context\n\n## First\n\nKeep this knowledge.\n```md\n## Not a unit\n```\n\n## Second\n\nAnother fact.\n";
  fs.writeFileSync(path.join(workspace, "tasks/context.md"), source);
  const options = { scope: "project", workspace, home: path.join(workspace, "home") };
  return { options, workspace, source, root: store.rootFor(options) };
}

test("Task relocation preserves Memory logical source identities and rejects drift", (t) => {
  const f = fixture(t);
  const taskMigration = require("../skills/meta/csl-tasks/shared/scripts/migrate-task-storage.js");
  const before = migration.inventory(f.options);
  fs.mkdirSync(path.join(f.workspace, ".csl-agent-kit/migrations"), { recursive: true });
  taskMigration.prepare(fs.realpathSync(f.workspace), "memory-source");
  taskMigration.apply(fs.realpathSync(f.workspace), "memory-source");
  assert.deepEqual(migration.inventory(f.options), before);
  const source = migration.sourceInventory(f.options)[0];
  assert.equal(source.path, "tasks/context.md");
  assert.equal(source.resolvedPath, ".csl-agent-kit/tasks/context.md");
  assert.equal(source.hash, store.hash(f.source));
  const target = path.join(f.workspace, source.resolvedPath);
  fs.appendFileSync(target, "changed");
  assert.throws(() => migration.inventory(f.options), /does not match Task migration evidence/);
  fs.unlinkSync(target);
  assert.throws(() => migration.sourceInventory(f.options), /does not match Task migration evidence/);
});

test("Memory legacy source lookup refuses a frozen Task migration", (t) => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.workspace, ".csl-agent-kit"), { recursive: true });
  fs.writeFileSync(path.join(f.workspace, ".csl-agent-kit/task-storage.json"), JSON.stringify({ schema: "csl-task-storage/v1", state: "migrating" }));
  assert.throws(() => migration.inventory(f.options), /migration in progress/);
});

test("preview is read-only and preserves every source unit including preamble", (t) => {
  const f = fixture(t);
  const plan = migration.preview(f.options);
  assert.equal(plan.items.length, 3);
  assert.equal(plan.sources[0].text, f.source);
  assert.equal(migration.units(f.source, "tasks/context.md").map((unit) => unit.raw).join(""), f.source);
  assert.equal(fs.existsSync(f.root), false);
});

test("automatic upgrade is idempotent, backed up, and retires the old reader", (t) => {
  const f = fixture(t);
  const first = migration.ensure(f.options);
  assert.equal(first.status, "upgraded");
  assert.equal(store.entries(f.root).length, 3);
  const marker = JSON.parse(fs.readFileSync(path.join(f.root, ".format.json"), "utf8"));
  assert.equal(fs.readFileSync(path.join(f.root, marker.migration, "sources/tasks--context.md"), "utf8"), f.source);
  assert.equal(fs.readFileSync(path.join(f.workspace, "tasks/context.md"), "utf8"), f.source);
  const count = store.history(f.options).total;
  fs.appendFileSync(path.join(f.workspace, "tasks/context.md"), "\nRetired source must not become a parallel writer.\n");
  assert.equal(migration.ensure(f.options).status, "current");
  assert.equal(store.history(f.options).total, count);
});

test("resume identifies committed effects even before version marker was published", (t) => {
  const f = fixture(t);
  const plan = migration.preview(f.options);
  store.withLock(f.root, () => store.commit(f.root, plan.items[0].mutation, { actor: "automatic-upgrade", preserveLegacy: true }));
  migration.ensure(f.options);
  assert.equal(store.entries(f.root).length, 3);
  assert.equal(store.history(f.options).total, 3);
  assert.equal(store.get(f.root, plan.items[0].id).revision, 1);
});

test("previous reviewed import is not duplicated or overwritten after later edits", (t) => {
  const f = fixture(t);
  const unit = migration.units(f.source, "tasks/context.md")[1];
  const plan = { schema: "csl-memory-migration/v1", items: [{ ...unit, id: "previous", decision: "import" }] };
  const raw = `${JSON.stringify(plan)}\n`, digest = store.hash(raw);
  fs.mkdirSync(path.join(f.root, ".migrations", digest), { recursive: true });
  fs.writeFileSync(path.join(f.root, ".migrations", digest, "preview.json"), raw);
  const mutation = { id: "previous", operation: "put", expected: { revision: 0, hash: null }, reason: "old import", source: `migration:${digest}:${store.hash(unit.key)}`, content: { title: "First", summary: "First fact", type: "fact", sources: ["legacy"], body: unit.raw } };
  const first = store.withLock(f.root, () => store.commit(f.root, mutation, { actor: "historical-import" }));
  const revised = store.withLock(f.root, () => store.commit(f.root, { ...mutation, expected: { revision: first.entry.revision, hash: first.entry.hash }, source: "later-edit", content: { ...mutation.content, body: "More accurate maintained knowledge." } }, { actor: "historical-editor" }));
  migration.ensure(f.options);
  assert.equal(store.entries(f.root).length, 3);
  assert.equal(store.get(f.root, "previous").hash, revised.entry.hash);
});

test("store v2 upgrade preserves exact body bytes, IDs and tombstones without importing retired sources", (t) => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, "entries"), { recursive: true });
  fs.writeFileSync(path.join(f.root, ".format.json"), JSON.stringify({ schema: "csl-memory-store/v1", version: 2 }));
  const body = "\n\n  Preserve original body spacing.\n\n";
  for (const id of ["alive", "removed"]) {
    fs.writeFileSync(path.join(f.root, `entries/${id}.md`), `---\nschema: csl-memory/v1\nid: ${id}\nrevision: 7\ntype: fact\ntitle: Original\nsummary: Original summary\nsources: [original]\nupdated: 2026-01-01T00:00:00.000Z\ndeleted: ${id === "removed"}\n---\n${body}`);
  }
  const result = migration.ensure(f.options);
  assert.equal(result.converted.length, 2);
  assert.equal(result.effects.length, 0);
  assert.equal(store.entries(f.root).length, 2);
  assert.equal(store.get(f.root, "removed").deleted, true);
  for (const id of ["alive", "removed"]) {
    const raw = fs.readFileSync(path.join(f.root, `entries/${id}.md`), "utf8");
    assert.equal(raw.slice(raw.indexOf("\n---\n") + 5), body);
    assert.equal(store.get(f.root, id).revision, 8);
    assert.equal(store.get(f.root, id).schema, "csl-memory/v2");
  }
  assert.equal(migration.ensure(f.options).status, "current");
  assert.equal(store.history(f.options).total, 2);
  assert.equal(store.inspectIndex(f.options).index.count, 1);
});

test("v3 upgrade removes project derived files without changing chips or user layout", (t) => {
  const f = fixture(t);
  migration.ensure(f.options);
  const before = store.entries(f.root).map(entry => [entry.id, entry.hash]);
  const markerPath = path.join(f.root, ".format.json");
  const marker = JSON.parse(fs.readFileSync(markerPath, "utf8"));
  fs.writeFileSync(markerPath, JSON.stringify({ ...marker, version: 3 }));
  const derived = path.join(f.root, ".indexes/old/topics");
  fs.mkdirSync(derived, { recursive: true });
  fs.writeFileSync(path.join(derived, "topic.md"), "旧派生内容");
  assert.equal(migration.preview(f.options).items[0].layout, "single");
  assert.equal(migration.ensure(f.options).version, 4);
  assert.deepEqual(store.entries(f.root).map(entry => [entry.id, entry.hash]), before);
  assert.equal(fs.existsSync(path.join(f.root, ".indexes")), false);
  assert.equal(migration.ensure(f.options).status, "current");
  const userOptions = { ...f.options, scope: "user" };
  migration.ensure(userOptions);
  assert.ok(store.inspectIndex(userOptions).index.cards);
});

test("user-root legacy files migrate independently and unknown versions fail closed", (t) => {
  const f = fixture(t);
  const options = { ...f.options, scope: "user" };
  fs.mkdirSync(options.home);
  fs.writeFileSync(path.join(options.home, "lessons.md"), "# User notes\n\n## Learned\n\nA synthetic lesson.\n");
  migration.ensure(options);
  const root = store.rootFor(options);
  assert.equal(store.entries(root).length, 2);
  assert.equal(fs.existsSync(f.root), false);
  const marker = path.join(root, ".format.json");
  fs.writeFileSync(marker, JSON.stringify({ schema: "csl-memory-store/v1", version: 999 }));
  assert.throws(() => migration.ensure(options), { code: "UNSUPPORTED_STORE" });
});
