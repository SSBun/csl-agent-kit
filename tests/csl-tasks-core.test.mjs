import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const core = require("../skills/csl-tasks/shared/lib/task-core.js");
const cli = path.resolve("skills/csl-tasks/shared/scripts/csl-tasks.js");

function workspace(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "csl-tasks-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function body(root, id) {
  return readFileSync(path.join(root, "tasks", "tasks", `${id}.md`), "utf8");
}

test("the shared CLI creates and validates a host-neutral workspace", (t) => {
  const root = workspace(t);
  execFileSync(process.execPath, [cli, "--workspace", root, "create", "demo", "--title", "Demo", "--kind", "task", "--target", "T1: Finish"], { stdio: "pipe" });
  const output = execFileSync(process.execPath, [cli, "--workspace", root, "validate"], { encoding: "utf8" });
  const help = execFileSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.deepEqual(JSON.parse(output), { valid: true });
  assert.match(help, /--kind task\|plan\|queue/);
  assert.doesNotMatch(help, /--kind task\|plan\|auto/);
});

test("creates a task and keeps the canonical record and newest-first index aligned", (t) => {
  const root = workspace(t);

  core.createTask(root, {
    id: "first-task",
    title: "First task",
    kind: "task",
    targets: ["T1: Deliver the result"],
  });
  core.createTask(root, {
    id: "second-task",
    title: "Second task",
    kind: "plan",
    targets: ["T1: Produce an implementation-ready plan"],
  });

  assert.match(body(root, "first-task"), /^Status: Pending \(\d{4}-\d{2}-\d{2} \d{2}:\d{2}\)$/m);
  assert.match(body(root, "first-task"), /^Kind: Task$/m);
  assert.deepEqual(core.validateWorkspace(root), []);

  const index = readFileSync(path.join(root, "tasks", "tasks.md"), "utf8");
  assert.ok(index.indexOf("tasks/second-task.md") < index.indexOf("tasks/first-task.md"));
  assert.doesNotThrow(() => core.checkTaskIndex(root, "first-task"));
});

test("writes Queue records and reads legacy Auto parents without accepting new Auto records", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate"] });
  assert.match(body(root, "parent"), /^Kind: Queue$/m);
  assert.throws(
    () => core.createTask(root, { id: "old-name", title: "Old name", kind: "auto", targets: ["T1: Integrate"] }),
    /invalid task kind: auto/,
  );

  writeFileSync(core.taskPath(root, "parent"), body(root, "parent").replace("Kind: Queue", "Kind: Auto"));
  assert.equal(core.readTask(root, "parent").kind, "queue");
  core.createTask(root, { id: "child", title: "Child", kind: "task", targets: ["T1: Finish"] });
  core.linkChild(root, "parent", "child");
  assert.equal(core.nextChild(root, "parent").id, "child");
  assert.deepEqual(core.validateWorkspace(root), []);
});

test("cancel and resume are reversible state transitions", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "demo", title: "Demo", kind: "task", targets: ["T1: Finish"] });

  core.setState(root, "demo", "in_progress");
  core.cancelTask(root, "demo");
  assert.match(body(root, "demo"), /^Status: Cancelled /m);

  core.resumeTask(root, "demo");
  assert.match(body(root, "demo"), /^Status: In Progress /m);
  assert.deepEqual(core.validateWorkspace(root), []);
});

test("completion fails closed until targets, review, and verification have evidence", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "demo", title: "Demo", kind: "task", targets: ["T1: Finish"] });
  core.resumeTask(root, "demo");

  assert.throws(() => core.completeTask(root, "demo"), /unchecked Target/);
  core.recordResult(root, "demo", "T1", "Checked the delivered artifact");
  assert.throws(() => core.completeTask(root, "demo"), /review gate/);
  core.setReviewGate(root, "demo", "skipped", "no explicit user request");
  assert.throws(() => core.completeTask(root, "demo"), /passed verification/);
  core.recordVerification(root, "demo", true, "node --test passed");
  core.completeTask(root, "demo");

  assert.match(body(root, "demo"), /^Status: Completed /m);
  assert.doesNotThrow(() => core.checkTaskIndex(root, "demo"));
});

test("queue tasks keep reciprocal ordered children and resume at the first unfinished child", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate children"] });
  core.createTask(root, { id: "child-a", title: "Child A", kind: "task", targets: ["T1: Finish A"] });
  core.createTask(root, { id: "child-b", title: "Child B", kind: "task", targets: ["T1: Finish B"] });
  core.linkChild(root, "parent", "child-a");
  core.linkChild(root, "parent", "child-b");

  assert.equal(core.nextChild(root, "parent").id, "child-a");
  assert.match(body(root, "child-a"), /^Parent: parent$/m);
  assert.match(body(root, "parent"), /1\. \[Child A\]\(child-a\.md\)[\s\S]*2\. \[Child B\]\(child-b\.md\)/);
  assert.throws(() => core.linkChild(root, "child-a", "parent"), /Queue task/);

  for (const id of ["child-a", "child-b"]) {
    core.resumeTask(root, id);
    core.recordResult(root, id, "T1", `Finished ${id}`);
    core.setReviewGate(root, id, "skipped", "no explicit user request");
    core.recordVerification(root, id, true, `${id} check passed`);
    core.completeTask(root, id);
  }

  assert.equal(core.nextChild(root, "parent"), undefined);
  core.resumeTask(root, "parent");
  assert.throws(() => core.completeTask(root, "parent"), /unchecked Target/);
  core.recordResult(root, "parent", "T1", "Integrated both children");
  core.setReviewGate(root, "parent", "skipped", "no explicit user request");
  core.recordVerification(root, "parent", true, "integration check passed");
  core.completeTask(root, "parent");
  assert.match(body(root, "parent"), /^Status: Completed /m);
});

test("a child can have only one parent", (t) => {
  const root = workspace(t);
  for (const id of ["parent-a", "parent-b"]) {
    core.createTask(root, { id, title: id, kind: "queue", targets: ["T1: Integrate"] });
  }
  core.createTask(root, { id: "child", title: "Child", kind: "task", targets: ["T1: Finish"] });
  core.linkChild(root, "parent-a", "child");
  assert.throws(() => core.linkChild(root, "parent-b", "child"), /already belongs to parent-a/);
});

test("blocked and review states require their lifecycle sections", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "demo", title: "Demo", kind: "task", targets: ["T1: Finish"] });
  assert.throws(() => core.setState(root, "demo", "blocked"), /Block section/);
  core.resumeTask(root, "demo");
  assert.throws(() => core.setState(root, "demo", "in_review"), /required review gate/);
  core.setReviewGate(root, "demo", "required", "explicit user request");
  assert.doesNotThrow(() => core.setState(root, "demo", "in_review"));
});

test("a completed Queue parent must be reopened before its graph changes", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate"] });
  core.createTask(root, { id: "child-a", title: "Child A", kind: "task", targets: ["T1: Finish"] });
  core.linkChild(root, "parent", "child-a");
  for (const id of ["child-a", "parent"]) {
    core.resumeTask(root, id);
    core.recordResult(root, id, "T1", `Finished ${id}`);
    core.setReviewGate(root, id, "skipped", "no explicit user request");
    core.recordVerification(root, id, true, `${id} check passed`);
    core.completeTask(root, id);
  }
  core.createTask(root, { id: "child-b", title: "Child B", kind: "task", targets: ["T1: Finish"] });
  assert.throws(() => core.linkChild(root, "parent", "child-b"), /reopen/);
});
