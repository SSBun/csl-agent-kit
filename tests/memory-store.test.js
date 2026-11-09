"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const store = require("../bin/memory/store.js");

function fixture(t) {
  const workspace = fs.mkdtempSync(path.join(os.tmpdir(), "csl-memory-"));
  t.after(() => fs.rmSync(workspace, { recursive: true, force: true }));
  const options = { scope: "project", workspace, home: path.join(workspace, "user") };
  return { workspace, options, root: store.rootFor(options) };
}

function mutation(id = "sample", expected = { revision: 0, hash: null }) {
  return {
    id, operation: "put", expected, reason: "保留可验证的知识", source: "fixture",
    content: { type: "fact", title: "中文标题", summary: "中文摘要及适用情境", sources: ["fixture"], body: "# 内容\n\n正文知识。" },
  };
}

function expectation(entry) { return { revision: entry.revision, hash: entry.hash }; }

function cli(workspace, ...args) {
  return spawnSync(process.execPath, [path.resolve(__dirname, "../bin/csl-agent-kit.js"), "memory", ...args, "--workspace", workspace], { encoding: "utf8", env: { ...process.env, CSL_AGENT_KIT_HOME: path.join(workspace, "user") } });
}

test("absent-store reads are side-effect free", (t) => {
  const { options, root } = fixture(t);
  assert.equal(store.list(root).total, 0);
  assert.deepEqual(store.get(root, "sample"), { id: "sample", exists: false, deleted: false, revision: 0, hash: null });
  assert.equal(store.history(options).total, 0);
  assert.equal(fs.existsSync(root), false);
});

test("UTF-8 hash covers the exact complete entry; stale CAS fails", (t) => {
  const { options, root } = fixture(t);
  const first = store.mutate(options, mutation());
  const bytes = fs.readFileSync(path.join(root, "entries/sample.md"));
  assert.equal(first.entry.hash, store.hash(bytes));
  assert.equal(first.entry.revision, 1);
  assert.throws(() => store.mutate(options, mutation()), { code: "CONFLICT" });
  const next = mutation("sample", expectation(first.entry));
  next.content.body = "更新后的有效知识。";
  assert.equal(store.mutate(options, next).entry.revision, 2);
  assert.equal(store.history(options).total, 2);
});

test("index is deterministic and reads tolerate a missing derived index", (t) => {
  const { options, root } = fixture(t);
  store.mutate(options, mutation("z-last"));
  store.mutate(options, mutation("a-first"));
  const first = fs.readFileSync(path.join(root, "index.md"), "utf8");
  store.reindex(options);
  assert.equal(fs.readFileSync(path.join(root, "index.md"), "utf8"), first);
  fs.unlinkSync(path.join(root, "index.md"));
  const page = store.list(root, { limit: 1 });
  assert.equal(page.total, 2);
  assert.equal(page.nextOffset, 1);
  assert.equal(page.items[0].id, "a-first");
  assert.equal(store.list(root, { offset: 1, limit: 1 }).items[0].id, "z-last");
  assert.equal(store.list(root, { query: "正文知识", fullText: true }).total, 2);
  assert.equal(store.list(root, { query: "正文知识" }).total, 0);
});

test("user proposal does not publish content; decision binds digest and CAS", (t) => {
  const { options } = fixture(t);
  options.scope = "user";
  const root = store.rootFor(options);
  const automatic = store.mutate(options, mutation("automatic"));
  assert.equal(automatic.entry.revision, 1);
  const proposal = store.propose(options, mutation());
  assert.equal(store.list(root).total, 1);
  assert.throws(() => store.decide(options, proposal.id, "wrong", "approve"), { code: "CONFLICT" });
  const approved = store.decide(options, proposal.id, proposal.digest, "approve");
  assert.equal(approved.entry.revision, 1);
  assert.equal(store.proposalDetail(options, proposal.id).status, "approved");
  assert.throws(() => store.decide(options, proposal.id, proposal.digest, "approve"), { code: "CONFLICT" });
  assert.equal(store.list(root).total, 2);
});

test("proposal approval cannot overwrite intervening project changes", (t) => {
  const { options } = fixture(t);
  const proposal = store.propose(options, mutation());
  store.mutate(options, mutation());
  assert.throws(() => store.decide(options, proposal.id, proposal.digest, "approve"), { code: "CONFLICT" });
});

test("proposal approval rechecks missing and subsequently deleted relationship targets", (t) => {
  const { options, root } = fixture(t);
  for (const scenario of ["never-created", "deleted-after-proposal"]) {
    const targetId = `target-${scenario}`;
    const target = scenario === "deleted-after-proposal" ? store.mutate(options, mutation(targetId)).entry : null;
    const input = mutation(`source-${scenario}`);
    input.content.retrieval = { links: [{ kind: "requires", scope: "project", id: targetId }] };
    const proposal = store.propose(options, input);
    if (target) store.mutate(options, { id: targetId, operation: "delete", expected: expectation(target), reason: "合成目标失效", source: "fixture" });
    const historyCount = store.history(options).total;
    assert.throws(() => store.decide(options, proposal.id, proposal.digest, "approve"), { code: "REFERENCE_NOT_FOUND" });
    assert.equal(store.get(root, input.id).exists, false);
    assert.equal(store.proposalDetail(options, proposal.id).status, "pending");
    assert.equal(store.history(options).total, historyCount);
  }
});

test("proposal approval resolves cross-scope targets in the current roots", (t) => {
  const { options, root } = fixture(t);
  store.mutate({ ...options, scope: "user" }, mutation("user-target"));
  const input = mutation("project-source");
  input.content.retrieval = { links: [{ kind: "requires", scope: "user", id: "user-target" }] };
  const proposal = store.propose(options, input);
  const approved = store.decide(options, proposal.id, proposal.digest, "approve");
  assert.equal(approved.entry.exists, true);
  assert.equal(store.get(root, input.id).retrieval.links[0].scope, "user");
});

test("exact restoration preserves historical references with explicit diagnostics", (t) => {
  const { options } = fixture(t);
  const target = store.mutate(options, mutation("target")).entry;
  const original = mutation("source");
  original.content.retrieval = { links: [{ kind: "requires", scope: "project", id: "target" }] };
  const first = store.mutate(options, original);
  const revised = mutation("source", expectation(first.entry));
  revised.content.retrieval = {};
  const second = store.mutate(options, revised);
  store.mutate(options, { id: "target", operation: "delete", expected: expectation(target), reason: "合成删除", source: "fixture" });
  const restored = store.restore(options, second.transaction, expectation(second.entry), "恢复原知识与引用");
  assert.deepEqual(restored.entry.retrieval.links, first.entry.retrieval.links);
  assert.equal(store.inspectIndex(options).index.missingReferences, 1);
  assert.equal(store.inspectIndex(options).state, "degraded");
});

test("rejected proposal is never indexed", (t) => {
  const { options, root } = fixture(t);
  const proposal = store.propose(options, mutation());
  store.decide(options, proposal.id, proposal.digest, "reject");
  assert.equal(store.proposalDetail(options, proposal.id).status, "rejected");
  assert.equal(store.list(root).total, 0);
});

test("tombstones preserve revision and restore creates a new audited revision", (t) => {
  const { options, root } = fixture(t);
  const created = store.mutate(options, mutation());
  const removed = store.mutate(options, { id: "sample", operation: "delete", expected: expectation(created.entry), reason: "已失效", source: "fixture" });
  assert.equal(removed.entry.exists, false);
  assert.equal(removed.entry.revision, 2);
  assert.equal(store.list(root).total, 0);
  assert.throws(() => store.mutate(options, mutation()), { code: "CONFLICT" });
  const restored = store.restore(options, removed.transaction, expectation(removed.entry), "恢复误删内容");
  assert.equal(restored.entry.revision, 3);
  assert.equal(restored.entry.body, created.entry.body);
  assert.equal(store.history(options).total, 3);
});

test("pending committed transaction can finish without repeating the mutation", (t) => {
  const { options, root } = fixture(t);
  const result = store.mutate(options, mutation());
  const journal = path.join(root, `.history/${result.transaction}.json`);
  const record = JSON.parse(fs.readFileSync(journal, "utf8"));
  fs.writeFileSync(journal, JSON.stringify({ ...record, status: "prepared" }));
  fs.writeFileSync(path.join(root, ".pending.json"), JSON.stringify({ transaction: result.transaction }));
  fs.unlinkSync(path.join(root, "index.md"));
  store.recover(options);
  assert.equal(store.get(root, "sample").revision, 1);
  assert.equal(store.changeDetail(options, result.transaction).status, "committed");
  assert.equal(fs.existsSync(path.join(root, ".pending.json")), false);
});

test("pending transaction with unchanged before-image is marked aborted", (t) => {
  const { options, root } = fixture(t);
  const result = store.mutate(options, mutation());
  fs.unlinkSync(path.join(root, "entries/sample.md"));
  fs.writeFileSync(path.join(root, ".pending.json"), JSON.stringify({ transaction: result.transaction }));
  store.recover(options);
  assert.equal(store.changeDetail(options, result.transaction).status, "aborted");
  assert.equal(store.list(root).total, 0);
});

test("recovery refuses third-party changes and live locks", (t) => {
  const { options, root } = fixture(t);
  const result = store.mutate(options, mutation());
  fs.appendFileSync(path.join(root, "entries/sample.md"), "额外修改\n");
  fs.writeFileSync(path.join(root, ".pending.json"), JSON.stringify({ transaction: result.transaction }));
  assert.throws(() => store.recover(options), { code: "RECOVERY_CONFLICT" });
  fs.unlinkSync(path.join(root, ".pending.json"));
  fs.writeFileSync(path.join(root, ".write-lock-v4"), JSON.stringify({ pid: process.pid, host: os.hostname() }));
  assert.throws(() => store.recover(options), { code: "LOCKED" });
  assert.equal(fs.existsSync(path.join(root, ".write-lock-v4")), true);
});

test("unknown schema, traversal, and symlink entries fail closed", (t) => {
  const { options, root, workspace } = fixture(t);
  store.mutate(options, mutation());
  assert.throws(() => store.get(root, "../sample"), { code: "INVALID_ID" });
  const file = path.join(root, "entries/sample.md");
  fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("csl-memory/v2", "csl-memory/v999"));
  assert.throws(() => store.get(root, "sample"), { code: "UNSUPPORTED_SCHEMA" });
  fs.unlinkSync(file);
  const external = path.join(workspace, "outside.md");
  fs.writeFileSync(external, "outside");
  fs.symlinkSync(external, file);
  assert.throws(() => store.get(root, "sample"), { code: "SYMLINK" });
});

test("user writing budgets and complete card library remain unchanged", (t) => {
  const { options } = fixture(t);
  options.scope = "user";
  const root = store.rootFor(options);
  const oversized = mutation("too-long");
  oversized.content.body = "字".repeat(8001);
  assert.throws(() => store.mutate(options, oversized), { code: "MEMORY_BUDGET" });
  for (let i = 0; i < 30; i++) {
    const next = mutation(`entry-${i}`);
    next.content.summary = "字".repeat(200);
    store.mutate(options, next);
  }
  const pages = store.indexPages(root);
  assert.equal(pages.filter(({ file }) => file.includes("/cards/")).length, 30);
  assert.equal(store.inspectIndex(options).index.unclassifiedCount, 30);
  assert.ok(store.characters(pages[0].content) <= 4000);
  for (const page of pages) {
    assert.equal(fs.readFileSync(path.join(root, page.file), "utf8"), page.content);
  }
});

test("new replacement refreshes single index without rewriting the old chip", (t) => {
  const { options, root } = fixture(t);
  const first = store.mutate(options, mutation("original"));
  const before = store.inspectIndex(options).index.generation;
  const next = mutation("replacement");
  next.content.retrieval = { aliases: ["另一种说法"], topics: ["交付/验收", "质量"], links: [{ kind: "supersedes", scope: "project", id: "original" }] };
  store.mutate(options, next);
  const index = store.inspectIndex(options).index;
  assert.notEqual(index.generation, before);
  assert.equal(store.get(root, "original").hash, first.entry.hash);
  assert.match(fs.readFileSync(path.join(root, "index.md"), "utf8"), /完整替代者（须核对正文）：replacement/);
  assert.equal(store.list(root, { query: "另一种说法" }).total, 1);
  const cycle = mutation("original", expectation(first.entry));
  cycle.content.retrieval = { links: [{ kind: "supersedes", scope: "project", id: "replacement" }] };
  assert.throws(() => store.mutate(options, cycle), { code: "RELATION_CYCLE" });
  assert.equal(store.get(root, "original").hash, first.entry.hash);
  const fence = JSON.parse(fs.readFileSync(path.join(root, ".write-lock"), "utf8"));
  assert.equal(fence.schema, "csl-memory-write-fence/v3");
});

test("project budget caps creation and restoration but permits merge updates at capacity", (t) => {
  const { options, root } = fixture(t);
  const oversized = mutation("oversized");
  oversized.content.body = "word ".repeat(1001);
  assert.throws(() => store.mutate(options, oversized), { code: "MEMORY_BUDGET" });
  oversized.content.body = "知识 ".repeat(1001);
  assert.throws(() => store.mutate(options, oversized), { code: "MEMORY_BUDGET" });
  const accepted = mutation("first");
  accepted.content.body = "word ".repeat(1000);
  const first = store.mutate(options, accepted);
  const removed = store.mutate(options, { id: "first", operation: "delete", expected: expectation(first.entry), reason: "合成删除", source: "fixture" });
  for (let i = 0; i < 20; i++) store.mutate(options, mutation(`entry-${i}`));
  const count = store.history(options).total;
  assert.throws(() => store.mutate(options, mutation("overflow")), { code: "MEMORY_CAPACITY" });
  assert.throws(() => store.restore(options, removed.transaction, expectation(removed.entry), "恢复"), { code: "MEMORY_CAPACITY" });
  assert.equal(store.history(options).total, count);
  const entry = store.get(root, "entry-0");
  assert.equal(store.mutate(options, mutation(entry.id, expectation(entry))).entry.revision, 2);
  assert.equal(store.indexPages(root).length, 1);
  assert.equal(fs.existsSync(path.join(root, ".indexes")), false);
  assert.equal(store.inspectIndex(options).index.layout, "single");
  assert.equal(store.inspectIndex(options).budget.count, 20);
});

test("CLI rejects noninteractive approval and invalid options", (t) => {
  const { workspace, options } = fixture(t);
  const proposal = store.propose(options, mutation());
  const approval = cli(workspace, "approve", proposal.id);
  assert.equal(approval.status, 1);
  assert.equal(JSON.parse(approval.stderr).error.code, "HUMAN_CONFIRMATION_REQUIRED");
  assert.equal(cli(workspace, "list", "--limit", "0").status, 1);
  assert.equal(cli(workspace, "list", "--input", "ignored.json").status, 1);
  assert.equal(cli(workspace, "read", "sample", "--outline", "--section", "内容").status, 1);
});
