import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { execFileSync, spawn } from "node:child_process";

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
  return state === "Draft" ? created : topics.setState(root, "account", state, created.version);
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

test("Draft maintenance can finish, while implementation requires Active", (t) => {
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
  fs.writeFileSync(topicRecord.file, topicRecord.text.replace(/^- \{"reference":.*\n/m, "\n"));
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

test("new CLI entry, spec package and manifest expose Topic without adding a task kind", () => {
  const help = execFileSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.match(help, /topic <command>/);
  assert.match(help, /--kind task\|plan\|queue/);
  const manifest = JSON.parse(fs.readFileSync(path.resolve(".claude-plugin/plugin.json"), "utf8"));
  assert.ok(manifest.skills.includes("./skills/meta/topic"));
  assert.match(fs.readFileSync(path.resolve("skills/meta/topic/SKILL.md"), "utf8"), /Completing all members never closes a Topic/);
});
