import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const core = require("../skills/meta/csl-tasks/shared/lib/task-core.js");
const topics = require("../skills/meta/csl-tasks/shared/lib/topic-core.js");
const cli = path.resolve("skills/meta/csl-tasks/shared/scripts/csl-tasks.js");
const spec = { scope: "Persistent account capability", spec: "FR-1: Authenticate before deletion.", decisions: "Shared interface.", dependencies: [] };

function workspace(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "csl-topics-"));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return fs.realpathSync(directory);
}

function topic(root, state = "Active") {
  const created = topics.createTopic(root, "account", "Account", spec);
  if (state === "Draft") {
    // Old on-disk record fixture; the public API no longer creates Draft Topics.
    fs.writeFileSync(created.file, created.text.replace("- State: Active", "- State: Draft"));
    topics.rebuildIndex(root);
    return topics.readTopic(root, "account");
  }
  return state === "Active" ? created : topics.setState(root, "account", state, created.version);
}

function task(root, id = "ios") {
  return core.createTask(root, { id, title: id, kind: "task", targets: ["T1: Deliver the scoped result"] });
}

function attach(root, id = "ios", mode = "implementation") {
  const record = core.readTask(root, id);
  return topics.association(root, id, "self:account", {
    expectedTask: topics.hash(record.text), expectedTopic: topics.readTopic(root, "account").version,
    mode, applies: "FR-1", purpose: "Implement scoped behavior",
  });
}

function finish(root, id) {
  core.resumeTask(root, id);
  core.recordResult(root, id, "T1", "Fixture observation");
  core.recordReviewAssessment(root, id, "R0", { reason: "Fixture", snapshot: "fixture-v1", evidence: "Fixture" });
  core.setReviewGate(root, id, "skipped", "Fixture");
  core.recordVerification(root, id, true, "Fixture");
  return core.completeTask(root, id);
}

test("new Topics start Active and accept implementation without activation", (t) => {
  const root = workspace(t);
  const created = topics.createTopic(root, "account", "Account", spec);
  assert.equal(created.state, "Active");
  assert.match(fs.readFileSync(path.join(root, "tasks/topics.md"), "utf8"), /— Active/);
  task(root);
  attach(root);
  assert.equal(topics.fresh(root, core.readTask(root, "ios")).applicable, true);
  assert.equal(core.readTask(root, "ios").status.state, "pending");
  assert.throws(() => topics.setState(root, "account", "Draft", created.version), /state must/);
});

test("legacy Draft is unchanged by reads and converts only through an explicit versioned command", (t) => {
  const root = workspace(t);
  const legacy = topic(root, "Draft");
  const sibling = topics.createTopic(root, "other", "Other", spec);
  const indexFile = path.join(root, "tasks/topics.md");
  const indexBefore = fs.readFileSync(indexFile, "utf8");
  topics.listTopics(root);
  topics.check(root, "account");
  assert.equal(fs.readFileSync(legacy.file, "utf8"), legacy.text);
  assert.equal(fs.readFileSync(indexFile, "utf8"), indexBefore);
  const result = JSON.parse(execFileSync(process.execPath, [cli, "--workspace", root, "topic", "activate", "account", "--expected", legacy.version], { encoding: "utf8" }));
  assert.equal(result.state, "Active");
  assert.equal(result.revision, legacy.revision);
  assert.equal(fs.readFileSync(sibling.file, "utf8"), sibling.text);
  assert.equal(topics.check(root, "account").valid, true);
});

test("standalone tasks do not create Topic storage", (t) => {
  const root = workspace(t);
  task(root);
  finish(root, "ios");
  assert.equal(fs.existsSync(path.join(root, "tasks/topics")), false);
  assert.deepEqual(topics.listTopics(root), []);
});

test("persistent Topic has immutable spec revisions and a separate index", (t) => {
  const root = workspace(t);
  const created = topic(root);
  task(root);
  attach(root);
  assert.equal(topics.readTopic(root, "account").revision, created.revision);
  assert.equal(topics.check(root, "account").valid, true);
  finish(root, "ios");
  assert.equal(topics.readTopic(root, "account").state, "Active");
  assert.match(fs.readFileSync(path.join(root, "tasks/topics.md"), "utf8"), /topics\/account.md/);
  assert.throws(() => attach(root), /reopen Completed/);
});

test("changed external specification blocks assessment and terminal gates without editing task", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  core.resumeTask(root, "ios");
  core.recordResult(root, "ios", "T1", "Fixture");
  core.recordReviewAssessment(root, "ios", "R0", { reason: "Fixture", snapshot: "v1", evidence: "Fixture" });
  core.setReviewGate(root, "ios", "skipped", "Fixture");
  core.recordVerification(root, "ios", true, "Fixture");
  const old = topics.readTopic(root, "account");
  topics.updateSpec(root, "account", old.version, { ...spec, spec: "FR-1: Require a second factor." });
  assert.throws(() => core.completeTask(root, "ios"), /specification changed/);
  assert.throws(() => core.recordVerification(root, "ios", true, "Fixture"), /specification changed/);
  assert.throws(() => core.setReviewGate(root, "ios", "skipped", "Fixture"), /specification changed/);
  assert.throws(() => core.recordReviewAssessment(root, "ios", "R0", {}), /specification changed/);
  assert.equal(topics.freshness(root, core.resumeTask(root, "ios")).current, false);
  const adopted = topics.adopt(root, "ios", {
    expectedTask: topics.hash(core.readTask(root, "ios").text), expectedTopic: topics.readTopic(root, "account").version,
    evidence: "Changed behavior aligned; implementation and evidence must be refreshed.",
  });
  assert.equal(adopted.reviewAssessment.state, "Stale");
  assert.equal(adopted.verification, null);
});

test("adoption preserves Required review and exits In Review", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  core.resumeTask(root, "ios");
  core.recordResult(root, "ios", "T1", "Fixture");
  core.recordReviewAssessment(root, "ios", "R2", { reason: "Fixture", snapshot: "v1", evidence: "Fixture" });
  core.setReviewGate(root, "ios", "required", "Fixture");
  core.setState(root, "ios", "in_review");
  const current = topics.readTopic(root, "account");
  topics.updateSpec(root, "account", current.version, { ...spec, decisions: "Revised common decision." });
  const updated = topics.adopt(root, "ios", { expectedTask: topics.hash(core.readTask(root, "ios").text), expectedTopic: topics.readTopic(root, "account").version, evidence: "Impact checked." });
  assert.equal(updated.review[1], "Required");
  assert.equal(updated.status.state, "in_progress");
  assert.equal(core.checkTaskIndex(root, "ios"), true);
});

test("legacy Draft maintenance can finish, while implementation requires explicit conversion", (t) => {
  const root = workspace(t);
  topic(root, "Draft"); task(root);
  assert.throws(() => attach(root), /Active/);
  attach(root, "ios", "maintenance");
  finish(root, "ios");
  assert.equal(topics.readTopic(root, "account").state, "Draft");
});

test("archive blocks active members and preserves completed historical evidence", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  assert.throws(() => topics.setState(root, "account", "Archived", topics.readTopic(root, "account").version), /active or inaccessible/);
  finish(root, "ios");
  topics.setState(root, "account", "Archived", topics.readTopic(root, "account").version);
  assert.equal(core.readTask(root, "ios").status.state, "completed");
  assert.equal(topics.freshness(root, core.readTask(root, "ios")).current, false);
  assert.throws(() => topics.updateSpec(root, "account", topics.readTopic(root, "account").version, spec), /restore/);
});

test("archive maintenance owner can finish after archiving its own Topic", (t) => {
  const root = workspace(t);
  topic(root); task(root, "archive-topic"); attach(root, "archive-topic", "maintenance");
  core.resumeTask(root, "archive-topic");
  const current = topics.readTopic(root, "account");
  topics.setState(root, "account", "Archived", current.version, "self:archive-topic");
  finish(root, "archive-topic");
  assert.equal(topics.readTopic(root, "account").state, "Archived");
});

test("stale association cannot adopt a new revision without impact evidence", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  const current = topics.readTopic(root, "account");
  topics.updateSpec(root, "account", current.version, { ...spec, spec: "FR-1: Revised requirement." });
  assert.throws(() => attach(root), /use adopt with impact evidence/);
});

test("duplicate binding, stale writes, missing snapshots and unsafe paths fail closed", (t) => {
  const root = workspace(t);
  const first = topic(root); task(root); attach(root);
  assert.throws(() => topics.updateSpec(root, "account", first.version, spec), /reread/);
  const record = core.readTask(root, "ios");
  const section = record.text.slice(record.text.indexOf("## Topic"));
  assert.throws(() => core.parseTask("ios", `${record.text}\n${section}`, record.file), /one Topic/);
  assert.throws(() => topics.safePath(root, "../escape"), /unsafe/);
  fs.unlinkSync(path.join(root, "tasks/topics/account/revisions", `${first.revision}.md`));
  assert.equal(topics.freshness(root, record).current, false);
});

test("pinned dependencies are rechecked even when the Topic text is unchanged", (t) => {
  const root = workspace(t);
  fs.writeFileSync(path.join(root, "api.json"), "v1");
  const created = topics.createTopic(root, "account", "Account", { ...spec, dependencies: [{ path: "api.json", sha256: topics.hash("v1") }] });
  topics.setState(root, "account", "Active", created.version);
  task(root); attach(root);
  fs.writeFileSync(path.join(root, "api.json"), "v2");
  assert.throws(() => topics.fresh(root, core.readTask(root, "ios")), /dependency changed/);
});

test("explicit repair follows task authority and index rebuild does not alter specs", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  const topicRecord = topics.readTopic(root, "account");
  fs.writeFileSync(topicRecord.file, topicRecord.text.replace(/^\| \[.*\| member \|.*\n/m, ""));
  assert.equal(topics.freshness(root, core.readTask(root, "ios")).current, false);
  topics.repair(root, "account", "self:ios", { expectedTopic: topics.readTopic(root, "account").version, purpose: "Repair exact reference" });
  assert.equal(topics.fresh(root, core.readTask(root, "ios")).applicable, true);
  fs.unlinkSync(path.join(root, "tasks/topics.md"));
  topics.rebuildIndex(root);
  assert.equal(topics.check(root, "account").revision, topicRecord.revision);
});

test("cross-repository binding requires permission, exact mapping and pinned origin identity", (t) => {
  const owner = workspace(t), client = workspace(t), home = workspace(t);
  const previous = process.env.CSL_AGENT_KIT_HOME;
  process.env.CSL_AGENT_KIT_HOME = home;
  t.after(() => { if (previous === undefined) delete process.env.CSL_AGENT_KIT_HOME; else process.env.CSL_AGENT_KIT_HOME = previous; });
  for (const [name, directory] of [["owner", owner], ["client", client]]) {
    execFileSync("git", ["init", directory], { stdio: "ignore" });
    execFileSync("git", ["-C", directory, "remote", "add", "origin", `https://example.invalid/${name}.git`]);
  }
  fs.mkdirSync(path.join(home, "project-indexes"));
  fs.writeFileSync(path.join(home, "project-indexes/index.json"), JSON.stringify({ schemaVersion: 1, projects: { owner: { root: owner }, client: { root: client } } }));
  topic(owner); task(client);
  const options = { expectedTask: topics.hash(core.readTask(client, "ios").text), expectedTopic: topics.readTopic(owner, "account").version, mode: "implementation", applies: "FR-1", purpose: "Client work" };
  assert.throws(() => topics.association(client, "ios", "owner:account", options), /allow-cross-workspace/);
  const bound = topics.association(client, "ios", "owner:account", { ...options, allowCross: true });
  assert.equal(topics.fresh(client, bound).applicable, true);
  execFileSync("git", ["-C", owner, "remote", "set-url", "origin", "https://example.invalid/replaced.git"]);
  assert.throws(() => topics.fresh(client, bound), /identity changed/);
});

test("failed detach and rollback retain a durable terminal blocker until exact repair", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  const record = core.readTask(root, "ios");
  const topicFile = topics.readTopic(root, "account").file;
  const original = core.atomicWrite;
  let taskWrites = 0;
  core.atomicWrite = (file, text) => {
    if (file === record.file && ++taskWrites > 1) throw new Error("injected task rollback failure");
    if (file === topicFile) throw new Error("injected backlink write failure");
    return original(file, text);
  };
  try {
    assert.throws(() => topics.association(root, "ios", undefined, { expectedTask: topics.hash(record.text) }), /rollback failed/);
  } finally { core.atomicWrite = original; }
  const detached = core.readTask(root, "ios");
  assert.equal(detached.topic, undefined);
  assert.ok(topics.pendingTransaction(root, "ios"));
  assert.throws(() => topics.fresh(root, detached), /incomplete Topic association/);
  assert.throws(() => core.recordReviewAssessment(root, "ios", "R0", {}), /incomplete Topic association/);
  const repaired = topics.repair(root, "account", "self:ios", { expectedTopic: topics.readTopic(root, "account").version, purpose: "Recover interrupted detach" });
  assert.equal(repaired.pendingAssociation, null);
  assert.equal(repaired.tasks.length, 0);
  assert.equal(topics.fresh(root, core.readTask(root, "ios")).applicable, false);
});

test("repair reconciles the task index after an In Review detach and rollback failure", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  core.resumeTask(root, "ios");
  core.recordResult(root, "ios", "T1", "Fixture");
  core.recordReviewAssessment(root, "ios", "R2", { reason: "Fixture", snapshot: "v1", evidence: "Fixture" });
  core.setReviewGate(root, "ios", "required", "Fixture");
  core.setState(root, "ios", "in_review");
  const record = core.readTask(root, "ios");
  const topicFile = topics.readTopic(root, "account").file;
  const original = core.atomicWrite;
  let taskWrites = 0;
  core.atomicWrite = (file, text) => {
    if (file === record.file && ++taskWrites > 1) throw new Error("injected task rollback failure");
    if (file === topicFile) throw new Error("injected backlink write failure");
    return original(file, text);
  };
  try {
    assert.throws(() => topics.association(root, "ios", undefined, { expectedTask: topics.hash(record.text) }), /rollback failed/);
  } finally { core.atomicWrite = original; }
  assert.equal(core.readTask(root, "ios").status.state, "in_progress");
  assert.throws(() => core.checkTaskIndex(root, "ios"), /does not match/);
  topics.repair(root, "account", "self:ios", { expectedTopic: topics.readTopic(root, "account").version, purpose: "Recover failed review detach" });
  assert.equal(core.checkTaskIndex(root, "ios"), true);
  assert.equal(topics.pendingTransaction(root, "ios"), undefined);
  assert.equal(core.readTask(root, "ios").review[1], "Required");
});

test("successful rollback also requires explicit verification and pending repair", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  const record = core.readTask(root, "ios");
  const target = topics.readTopic(root, "account");
  const original = core.atomicWrite;
  core.atomicWrite = (file, text) => {
    if (file === target.file) throw new Error("injected backlink failure");
    return original(file, text);
  };
  try {
    assert.throws(() => topics.association(root, "ios", undefined, { expectedTask: topics.hash(record.text) }), /rolled back/);
  } finally { core.atomicWrite = original; }
  assert.equal(core.readTask(root, "ios").topic.reference, "self:account");
  assert.equal(topics.freshness(root, core.readTask(root, "ios")).current, false);
  topics.repair(root, "account", "self:ios", { expectedTopic: topics.readTopic(root, "account").version, purpose: "Confirm rollback" });
  assert.equal(topics.freshness(root, core.readTask(root, "ios")).current, true);
});

test("stale specification allows failure evidence and cancellation without adopting", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  core.resumeTask(root, "ios");
  core.recordResult(root, "ios", "T1", "Fixture");
  core.recordReviewAssessment(root, "ios", "R0", { reason: "Fixture", snapshot: "v1", evidence: "Fixture" });
  core.setReviewGate(root, "ios", "skipped", "Fixture");
  const current = topics.readTopic(root, "account");
  topics.updateSpec(root, "account", current.version, { ...spec, spec: "FR-1: Changed." });
  assert.equal(core.recordVerification(root, "ios", false, "Specification changed").verification[1], "Failed");
  assert.equal(core.cancelTask(root, "ios").status.state, "cancelled");
  assert.equal(topics.freshness(root, core.readTask(root, "ios")).current, false);
});

test("malformed candidate Markdown is rejected before Topic, index or snapshot writes", (t) => {
  const root = workspace(t);
  const current = topic(root);
  const index = fs.readFileSync(path.join(root, "tasks/topics.md"), "utf8");
  const revisions = fs.readdirSync(path.join(root, "tasks/topics/account/revisions"));
  for (const scope of ["Scope\n\n```text", "Scope\n\n<!--", "Scope\n\n<script>"]) {
    assert.throws(() => topics.updateSpec(root, "account", current.version, { ...spec, scope }), /section|structure/);
    assert.equal(fs.readFileSync(current.file, "utf8"), current.text);
    assert.equal(fs.readFileSync(path.join(root, "tasks/topics.md"), "utf8"), index);
    assert.deepEqual(fs.readdirSync(path.join(root, "tasks/topics/account/revisions")), revisions);
  }
});

test("concurrent member additions reject a stale writer instead of losing a backlink", async (t) => {
  const root = workspace(t);
  topic(root); task(root, "ios"); task(root, "android");
  const version = topics.readTopic(root, "account").version;
  const jobs = ["ios", "android"].map((id) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, "--workspace", root, "topic", "attach", id, "self:account", "--expected", topics.hash(core.readTask(root, id).text), "--expected-topic", version, "--mode", "implementation", "--applies", "FR-1", "--purpose", id], { stdio: "ignore" });
    child.on("error", reject);
    child.on("exit", (code) => resolve({ id, code }));
  }));
  const results = await Promise.all(jobs);
  assert.equal(results.filter((entry) => entry.code === 0).length, 1);
  const failed = results.find((entry) => entry.code !== 0);
  attach(root, failed.id);
  assert.equal(topics.readTopic(root, "account").tasks.length, 2);
  assert.equal(topics.check(root, "account").valid, true);
});

test("new Topics provide a shared resources directory and clickable classified index", (t) => {
  const root = workspace(t);
  const current = topic(root);
  const relative = "tasks/topics/account/resources/design notes #1.md";
  fs.writeFileSync(path.join(root, relative), "Background notes");
  const updated = topics.updateResources(root, "account", current.version, [
    { label: "Design notes", target: relative, purpose: "Long-lived reference", kind: "reference" },
    { label: "Remote design", target: "https://example.com/design", purpose: "External reference", kind: "reference" },
  ]);
  assert.equal(updated.revision, current.revision);
  assert.match(updated.text, /\[Design notes\]\(<account\/resources\/design%20notes%20%231.md>\)/);
  assert.equal(updated.resources[0].target, relative);
  assert.equal(fs.readFileSync(path.join(root, relative), "utf8"), "Background notes");
  assert.equal(topics.check(root, "account").valid, true);
});

test("reference metadata and content changes do not stale a bound task", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  const record = core.readTask(root, "ios");
  const initial = topics.readTopic(root, "account");
  fs.writeFileSync(path.join(root, "notes.md"), "v1");
  const resource = { label: "Notes", target: "notes.md", purpose: "Background only", kind: "reference" };
  let updated = topics.updateResources(root, "account", initial.version, [resource]);
  fs.writeFileSync(path.join(root, "notes.md"), "v2");
  updated = topics.updateResources(root, "account", updated.version, [{ ...resource, purpose: "Updated reference description" }]);
  assert.equal(topics.fresh(root, core.readTask(root, "ios")).revision, initial.revision);
  assert.equal(core.readTask(root, "ios").text, record.text);
  topics.updateResources(root, "account", updated.version, []);
  assert.equal(fs.readFileSync(path.join(root, "notes.md"), "utf8"), "v2");
  assert.equal(topics.freshness(root, core.readTask(root, "ios")).current, true);
});

test("normative resource changes use the existing revision and terminal gates", (t) => {
  const root = workspace(t);
  const initial = topic(root);
  fs.writeFileSync(path.join(root, "api.json"), "v1");
  const resource = { label: "API", target: "api.json", purpose: "Shared contract", kind: "normative", sha256: topics.hash("v1") };
  const first = topics.updateResources(root, "account", initial.version, [resource]);
  assert.notEqual(first.revision, initial.revision);
  task(root); attach(root); core.resumeTask(root, "ios");
  fs.writeFileSync(path.join(root, "api.json"), "v2");
  assert.throws(() => core.recordVerification(root, "ios", true, "Fixture"), /dependency changed/);
  const second = topics.updateResources(root, "account", topics.readTopic(root, "account").version, [{ ...resource, sha256: topics.hash("v2") }]);
  assert.notEqual(second.revision, first.revision);
  assert.equal(topics.freshness(root, core.readTask(root, "ios")).current, false);
  topics.adopt(root, "ios", { expectedTask: topics.hash(core.readTask(root, "ios").text), expectedTopic: second.version, evidence: "Aligned API v2" });
  assert.equal(topics.freshness(root, core.readTask(root, "ios")).current, true);
  assert.match(fs.readFileSync(path.join(root, "tasks/topics/account/revisions", `${first.revision}.md`), "utf8"), /## Normative Resources/);
  assert.equal(fs.existsSync(path.join(root, "tasks/topics/account/resources/api.json")), false);
  const third = topics.updateSpec(root, "account", second.version, { ...spec, decisions: "Updated choice" });
  assert.equal(third.resources[0].sha256, topics.hash("v2"));
  assert.equal(topics.readTopic(root, "account").revision, third.revision);
});

test("resource classification and removal change the normative projection only when applicable", (t) => {
  const root = workspace(t);
  const initial = topic(root);
  fs.writeFileSync(path.join(root, "notes.md"), "contract");
  const reference = { label: "Notes", target: "notes.md", purpose: "Notes", kind: "reference" };
  const normative = { ...reference, kind: "normative", sha256: topics.hash("contract") };
  const first = topics.updateResources(root, "account", initial.version, [reference]);
  const second = topics.updateResources(root, "account", first.version, [normative]);
  assert.notEqual(second.revision, first.revision);
  const third = topics.updateResources(root, "account", second.version, [reference]);
  assert.equal(third.revision, initial.revision);
  assert.equal(fs.readFileSync(path.join(root, "notes.md"), "utf8"), "contract");
});

test("legacy Topics keep their shape and digest until explicit resource initialization", (t) => {
  const root = workspace(t);
  const initial = topic(root);
  const legacy = initial.text.replace(/\n## Resources\n\n\| Resource \| Kind \| Purpose \| SHA-256 \|\n\| --- \| --- \| --- \| --- \|\n/, "").replace(/## Tasks\n[\s\S]*$/, "## Tasks\n\n\n");
  fs.writeFileSync(initial.file, legacy);
  fs.rmSync(path.join(root, "tasks/topics/account/resources"), { recursive: true });
  const loaded = topics.readTopic(root, "account");
  assert.equal(loaded.resources, undefined);
  assert.equal(loaded.revision, initial.revision);
  topics.listTopics(root); topics.check(root, "account");
  assert.equal(fs.readFileSync(initial.file, "utf8"), legacy);
  assert.equal(fs.existsSync(path.join(root, "tasks/topics/account/resources")), false);
  const updated = topics.updateResources(root, "account", loaded.version, []);
  assert.equal(updated.revision, loaded.revision);
  assert.ok(fs.statSync(path.join(root, "tasks/topics/account/resources")).isDirectory());
});

test("resource registration rejects unsafe sources, duplicates, stale versions and archived writes", (t) => {
  const root = workspace(t);
  const initial = topic(root);
  fs.writeFileSync(path.join(root, "api.json"), "v1");
  const reference = { label: "API", target: "api.json", purpose: "Reference", kind: "reference" };
  const invalid = [
    [{ ...reference, target: "../escape" }],
    [{ ...reference, target: path.join(root, "api.json") }],
    [{ ...reference, kind: "normative" }],
    [{ ...reference, kind: "normative", sha256: topics.hash("wrong") }],
    [{ ...reference, sha256: topics.hash("v1") }],
    [{ ...reference, target: "https://user:password@example.com/" }],
    [{ ...reference, kind: "normative", target: "https://example.com/", sha256: topics.hash("v1") }],
    [reference, reference],
    [{ ...reference, label: "bad|label" }],
  ];
  for (const resources of invalid) {
    assert.throws(() => topics.updateResources(root, "account", initial.version, resources));
    assert.equal(topics.readTopic(root, "account").text, initial.text);
  }
  fs.symlinkSync(path.join(root, "api.json"), path.join(root, "alias.json"));
  assert.throws(() => topics.updateResources(root, "account", initial.version, [{ ...reference, target: "alias.json" }]), /symlinks/);
  assert.throws(() => topics.updateResources(root, "account", "outdated", [reference]), /reread/);
  const archived = topics.setState(root, "account", "Archived", initial.version);
  assert.throws(() => topics.updateResources(root, "account", archived.version, []), /restore Archived/);
});

test("the same normative source cannot acquire conflicting resource and dependency pins", (t) => {
  const root = workspace(t);
  fs.writeFileSync(path.join(root, "api.json"), "v1");
  const current = topics.createTopic(root, "account", "Account", { ...spec, dependencies: [{ path: "api.json", sha256: topics.hash("v1") }] });
  assert.throws(() => topics.updateResources(root, "account", current.version, [{ label: "API", target: "api.json", purpose: "Contract", kind: "normative", sha256: topics.hash("v1") }]), /must not be duplicated/);
  assert.equal(topics.readTopic(root, "account").revision, current.revision);
});

test("normative source deduplication uses the same separator handling as file reads", (t) => {
  const root = workspace(t);
  fs.mkdirSync(path.join(root, "contracts"));
  fs.writeFileSync(path.join(root, "contracts/api.json"), "v1");
  const current = topics.createTopic(root, "account", "Account", { ...spec, dependencies: [{ path: "contracts\\api.json", sha256: topics.hash("v1") }] });
  assert.throws(() => topics.updateResources(root, "account", current.version, [{ label: "API", target: "contracts/api.json", purpose: "Contract", kind: "normative", sha256: topics.hash("v1") }]), /must not be duplicated/);
  assert.equal(topics.readTopic(root, "account").text, current.text);
});

test("resource CLI updates expose the index and directory without copying source content", (t) => {
  const root = workspace(t);
  const current = topic(root);
  fs.writeFileSync(path.join(root, "notes.md"), "Existing authority");
  const input = path.join(root, "resources.json");
  fs.writeFileSync(input, JSON.stringify([{ label: "Notes", target: "notes.md", purpose: "Reference", kind: "reference" }]));
  const output = JSON.parse(execFileSync(process.execPath, [cli, "--workspace", root, "topic", "update-resources", "account", "--expected", current.version, "--resources-json", input], { encoding: "utf8" }));
  assert.equal(output.resources[0].target, "notes.md");
  assert.equal(output.resourcesDirectory, path.join(root, "tasks/topics/account/resources"));
  assert.deepEqual(fs.readdirSync(output.resourcesDirectory), []);
});

test("new Topic Tasks tables link formal members and history without reopening completed tasks", (t) => {
  const root = workspace(t);
  topic(root); task(root, "current"); attach(root, "current");
  task(root, "old-fix"); finish(root, "old-fix");
  const old = core.readTask(root, "old-fix");
  const taskIndex = fs.readFileSync(core.indexPath(root), "utf8");
  const before = topics.readTopic(root, "account");
  const after = topics.referenceTask(root, "account", "self:old-fix", before.version, "Historical | evidence");
  assert.equal(after.tasksFormat, "table");
  assert.match(after.text, /\| Task \| Relation \| Reference \| Purpose \| Repository \|/);
  assert.match(after.text, /\[old-fix\]\(<\.\.\/tasks\/old-fix.md>\) \| history \|/);
  assert.equal(after.revision, before.revision);
  assert.equal(core.readTask(root, "old-fix").text, old.text);
  assert.equal(fs.readFileSync(core.indexPath(root), "utf8"), taskIndex);
  assert.equal(topics.members(root, after).find((entry) => entry.reference === "self:old-fix").member, false);
  assert.equal(topics.freshness(root, core.readTask(root, "current")).current, true);
  assert.throws(() => topics.referenceTask(root, "account", "self:current", after.version, "wrong"), /formal members/);
});

test("history does not block archive or satisfy a formal backlink", (t) => {
  const root = workspace(t);
  topic(root); task(root, "pending-history");
  let current = topics.readTopic(root, "account");
  current = topics.referenceTask(root, "account", "self:pending-history", current.version, "Unfinished old work");
  fs.unlinkSync(core.taskPath(root, "pending-history"));
  assert.equal(topics.check(root, "account").referenceWarnings.length, 1);
  current = topics.setState(root, "account", "Archived", current.version);
  assert.equal(current.state, "Archived");
  current = topics.setState(root, "account", "Active", current.version);
  current = topics.referenceTask(root, "account", "self:pending-history", current.version, undefined, true);
  assert.equal(current.tasks.length, 0);
  task(root, "member"); attach(root, "member");
  current = topics.readTopic(root, "account");
  fs.writeFileSync(current.file, current.text.replace(" | member | self:member |", " | history | self:member |"));
  assert.throws(() => topics.fresh(root, core.readTask(root, "member")), /incomplete Topic association/);
  topics.repair(root, "account", "self:member", { expectedTopic: topics.readTopic(root, "account").version, purpose: "Restore formal relationship" });
  assert.equal(topics.readTopic(root, "account").tasks[0].relation, "member");
});

test("repair preserves genuine history and history removal never detaches a member", (t) => {
  const root = workspace(t);
  topic(root); task(root, "history");
  let current = topics.readTopic(root, "account");
  current = topics.referenceTask(root, "account", "self:history", current.version, "History");
  current = topics.repair(root, "account", "self:history", { expectedTopic: current.version, purpose: "History remains history" });
  assert.equal(current.tasks[0].relation, "history");
  assert.equal(core.readTask(root, "history").topic, undefined);
  task(root, "member"); attach(root, "member");
  assert.throws(() => topics.referenceTask(root, "account", "self:member", topics.readTopic(root, "account").version, undefined, true), /formal members/);
});

test("explicit formatting converts legacy JSON Tasks without changing task evidence or revisions", (t) => {
  const root = workspace(t);
  topic(root); task(root); attach(root);
  const record = core.readTask(root, "ios");
  const current = topics.readTopic(root, "account");
  const legacyRows = current.tasks.map(({ reference, repository, purpose }) => `- ${JSON.stringify({ reference, repository, purpose })}`).join("\n");
  const legacy = current.text.replace(/## Tasks\n[\s\S]*$/, `## Tasks\n\n${legacyRows}\n`);
  fs.writeFileSync(current.file, legacy);
  const loaded = topics.readTopic(root, "account");
  assert.equal(loaded.tasksFormat, "legacy");
  topics.check(root, "account");
  assert.equal(fs.readFileSync(current.file, "utf8"), legacy);
  const formatted = topics.formatTopic(root, "account", loaded.version);
  assert.equal(formatted.tasksFormat, "table");
  assert.equal(formatted.revision, current.revision);
  assert.equal(core.readTask(root, "ios").text, record.text);
  assert.equal(topics.freshness(root, record).current, true);
});

test("reference files and folders expose openable encoded links for Chinese and spaces", (t) => {
  const root = workspace(t);
  const current = topic(root);
  fs.mkdirSync(path.join(root, "共享 资料 #1"));
  fs.writeFileSync(path.join(root, "共享 资料 #1", "设计 文档.md"), "Design");
  const updated = topics.updateResources(root, "account", current.version, [
    { label: "文件夹", target: "共享 资料 #1", purpose: "Shared material", kind: "reference" },
    { label: "设计文档", target: "共享 资料 #1/设计 文档.md", purpose: "Reference document", kind: "reference" },
  ]);
  assert.equal(updated.resources[0].type, "directory");
  assert.equal(updated.revision, current.revision);
  const view = topics.resourceViews(root, updated);
  assert.equal(fs.statSync(fileURLToPath(view[0].href)).isDirectory(), true);
  assert.equal(fs.statSync(fileURLToPath(view[1].href)).isFile(), true);
  assert.match(view[0].href, /%20.*%23.*\/$/);
  assert.match(updated.text, /\[文件夹\]\(<.*%20.*%23.*\/>\)/);
  assert.equal(topics.readTopic(root, "account").resources[0].type, "directory");
  assert.throws(() => topics.updateResources(root, "account", updated.version, [{ label: "Folder", target: "共享 资料 #1", purpose: "Contract", kind: "normative", sha256: topics.hash("x") }]), /normative directories/);
});

test("task records cannot be newly registered as Resources while reports remain eligible", (t) => {
  const root = workspace(t);
  const current = topic(root); task(root);
  for (const target of ["tasks/tasks/ios.md", "tasks/tasks", "tasks/tasks.md", "https://example.com/repo/tasks/tasks/ios.md"]) {
    assert.throws(() => topics.updateResources(root, "account", current.version, [{ label: "Task", target, purpose: "History", kind: "reference" }]), /belong in Tasks/);
  }
  fs.mkdirSync(path.join(root, "tasks/artifacts/ios/reports"), { recursive: true });
  fs.writeFileSync(path.join(root, "tasks/artifacts/ios/reports/analysis.md"), "Reusable analysis");
  const updated = topics.updateResources(root, "account", current.version, [{ label: "Analysis", target: "tasks/artifacts/ios/reports/analysis.md", purpose: "Long-lived report", kind: "reference" }]);
  assert.equal(updated.resources.length, 1);
});

test("legacy task Resource links remain readable but must be explicitly removed on update", (t) => {
  const root = workspace(t);
  const current = topic(root); task(root);
  const legacy = current.text.replace("| --- | --- | --- | --- |\n", "| --- | --- | --- | --- |\n| [Old task](<../tasks/ios.md>) | reference | Historical source | - |\n");
  fs.writeFileSync(current.file, legacy);
  const loaded = topics.readTopic(root, "account");
  assert.equal(loaded.revision, current.revision);
  assert.throws(() => topics.updateResources(root, "account", loaded.version, loaded.resources), /belong in Tasks/);
  const listed = topics.referenceTask(root, "account", "self:ios", loaded.version, "History without binding");
  const cleaned = topics.updateResources(root, "account", listed.version, []);
  assert.equal(cleaned.tasks[0].relation, "history");
  assert.equal(cleaned.resources.length, 0);
  assert.equal(core.readTask(root, "ios").topic, undefined);
});

test("historical task CLI and show links do not mutate the referenced task", (t) => {
  const root = workspace(t);
  const current = topic(root); task(root);
  const before = core.readTask(root, "ios").text;
  const output = JSON.parse(execFileSync(process.execPath, [cli, "--workspace", root, "topic", "reference-task", "account", "self:ios", "--expected", current.version, "--purpose", "Historical context"], { encoding: "utf8" }));
  assert.equal(output.tasksFormat, "table");
  assert.equal(output.tasks[0].relation, "history");
  assert.equal(fs.readFileSync(fileURLToPath(output.tasks[0].href), "utf8"), before);
  assert.equal(core.readTask(root, "ios").text, before);
});

test("new CLI entry, spec package and manifest expose Topic without adding a task kind", () => {
  const help = execFileSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.match(help, /topic <command>/);
  assert.match(help, /--kind task\|plan\|queue/);
  const manifest = JSON.parse(fs.readFileSync(path.resolve(".claude-plugin/plugin.json"), "utf8"));
  assert.ok(manifest.skills.includes("./skills/meta/topic"));
  assert.match(fs.readFileSync(path.resolve("skills/meta/topic/SKILL.md"), "utf8"), /Completing all members never closes a Topic/);
});
