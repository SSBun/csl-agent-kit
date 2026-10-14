import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
const core = require("../skills/meta/csl-tasks/shared/lib/task-core.js");
const cli = path.resolve("skills/meta/csl-tasks/shared/scripts/csl-tasks.js");

function workspace(t) {
  const root = mkdtempSync(path.join(os.tmpdir(), "csl-tasks-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  return root;
}

function body(root, id) {
  return readFileSync(path.join(root, "tasks", "tasks", `${id}.md`), "utf8");
}

function assess(root, id, level = "R2", overrides = {}) {
  return core.recordReviewAssessment(root, id, level, {
    reason: level === "R0" ? "No deliverable files changed" : "Fixture grading grounds",
    snapshot: "fixture-content-v1",
    evidence: "Current fixture Result observations",
    ...(level === "R1" ? {
      clarity: "Expected behavior is specified",
      impact: "All direct consumers are bounded",
      risk: "Presentation-only failure is recoverable",
      verification: "Direct output comparison covers Target and preserved behavior",
    } : {}),
    ...overrides,
  });
}

test("the shared CLI creates and validates a host-neutral workspace", (t) => {
  const root = workspace(t);
  execFileSync(process.execPath, [cli, "--workspace", root, "create", "demo", "--title", "Demo", "--kind", "task", "--target", "T1: Finish"], { stdio: "pipe" });
  const output = execFileSync(process.execPath, [cli, "--workspace", root, "validate"], { encoding: "utf8" });
  const help = execFileSync(process.execPath, [cli, "--help"], { encoding: "utf8" });
  assert.deepEqual(JSON.parse(output), { valid: true });
  assert.match(help, /--kind task\|plan\|queue/);
  assert.match(help, /review <id> <skipped\|required\|passed\|approved>/);
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

test("no-file completion fails closed until targets, skipped review, and verification have evidence", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "demo", title: "Demo", kind: "task", targets: ["T1: Finish"] });
  core.resumeTask(root, "demo");

  assert.throws(() => core.completeTask(root, "demo"), /unchecked Target/);
  core.recordResult(root, "demo", "T1", "Checked the no-file result");
  assert.throws(() => core.completeTask(root, "demo"), /review gate/);
  assess(root, "demo", "R0");
  core.setReviewGate(root, "demo", "skipped", "no deliverable files changed");
  assert.throws(() => core.completeTask(root, "demo"), /passed verification/);
  core.recordVerification(root, "demo", true, "result evidence checked");
  core.completeTask(root, "demo");

  assert.match(body(root, "demo"), /^Status: Completed /m);
  assert.doesNotThrow(() => core.checkTaskIndex(root, "demo"));
  assert.throws(() => core.syncIndex(root, "demo"), /reopen a Completed task/);
});

test("historical free-form Review sections stay compatible while marked ledgers fail closed", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "legacy-review", title: "Legacy review", kind: "task", targets: ["T1: Finish"] });
  core.resumeTask(root, "legacy-review");
  core.recordResult(root, "legacy-review", "T1", "Initial result");
  assess(root, "legacy-review", "R0");
  core.setReviewGate(root, "legacy-review", "skipped", "no deliverable files changed");
  core.recordVerification(root, "legacy-review", true, "initial result checked");
  core.completeTask(root, "legacy-review");
  writeFileSync(core.taskPath(root, "legacy-review"), `${body(root, "legacy-review").trimEnd()}\n\n## Review\n\n- Historical free-form review summary.\n\n~~~markdown\n## Review\n- Pass: example only\n~~~\n\n \t## Review\n \t- Pass: mixed-indent code sample\n\n- ~~~markdown\n  ## Review ##\n  - Schema: task-review-ledger/v2\n  ~~~\n\n- example\n  ~~~markdown\n  ## Review ##\n  ~~~\n\n<!--\n## Review\n- Pass: comment sample\n-->\n\n<div>\n## Review\n</div>\n\n~~~markdown\n> ~~~\n- ~~~\n## Review ##\n~~~\n`);

  core.reopenTask(root, "legacy-review");
  assess(root, "legacy-review");
  core.setReviewGate(root, "legacy-review", "required", "mandatory task-review pending");
  core.setState(root, "legacy-review", "in_review");
  core.setReviewGate(root, "legacy-review", "passed", "task-review found no blocking issue");
  core.recordVerification(root, "legacy-review", true, "reopened result checked");
  core.completeTask(root, "legacy-review");
  assert.match(body(root, "legacy-review"), /Historical free-form review summary/);

  core.createTask(root, { id: "malformed-ledger", title: "Malformed ledger", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "malformed-ledger"), `${body(root, "malformed-ledger").trimEnd()}\n\n## Review\n\n- Schema: task-review-ledger/v1\n- Pass: 1\n`);
  assert.throws(() => core.readTask(root, "malformed-ledger"), /invalid task-review-ledger\/v1 Review section/);

  core.createTask(root, { id: "unknown-ledger", title: "Unknown ledger", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "unknown-ledger"), `${body(root, "unknown-ledger").trimEnd()}\n\n## Review\n\n### Notes\n\n  - Schema: task-review-ledger/v2\n  - Pass: 1\n  - Next finding: 2\n  - \`TR-1\` | no-progress=2 | source.js:1 | Fix the defect\n`);
  assert.throws(() => core.readTask(root, "unknown-ledger"), /unsupported Review ledger schema/);

  core.createTask(root, { id: "unmarked-ledger", title: "Unmarked ledger", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "unmarked-ledger"), `${body(root, "unmarked-ledger").trimEnd()}\n\n## Review\n\n  - Pass: 1\n  - Next finding: 2\n  - \`TR-1\` | no-progress=2 | source.js:1 | Fix the defect\n`);
  assert.throws(() => core.readTask(root, "unmarked-ledger"), /invalid task-review ledger schema marker/);

  core.createTask(root, { id: "malformed-labels", title: "Malformed labels", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "malformed-labels"), `${body(root, "malformed-labels").trimEnd()}\n\n## Review\n\n  - Schema : task-review-ledger/v2\n  - Pass : 1\n  - Next finding : 2\n  - \`TR-1\` | no-progress = 2 | source.js:1 | Fix the defect\n`);
  assert.throws(() => core.readTask(root, "malformed-labels"), /invalid task-review ledger schema marker/);

  core.createTask(root, { id: "invalid-fence", title: "Invalid fence", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(
    core.taskPath(root, "invalid-fence"),
    `${body(root, "invalid-fence").trimEnd()}\n` + "\n## Review\n\n- Historical summary.\n\n```bad`info\n## Review ##\n",
  );
  assert.throws(() => core.readTask(root, "invalid-fence"), /duplicate Review section/);

  core.createTask(root, { id: "quote-reentry", title: "Quote reentry", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "quote-reentry"), `${body(root, "quote-reentry").trimEnd()}\n\n## Review\n\n> - TR-1 |\n- unrelated\n>   no-progress=2 | source.js:1 | example\n`);
  assert.equal(core.readTask(root, "quote-reentry").reviewLedger, undefined);

  core.createTask(root, { id: "sibling-quote", title: "Sibling quote", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "sibling-quote"), `${body(root, "sibling-quote").trimEnd()}\n\n## Review\n\n- TR-1 |\n> unrelated quote\n  no-progress=2 | source.js:1 | example\n`);
  assert.equal(core.readTask(root, "sibling-quote").reviewLedger, undefined);

  core.createTask(root, { id: "nested-quote", title: "Nested quote", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "nested-quote"), `${body(root, "nested-quote").trimEnd()}\n\n## Review\n\n- TR-1 |\n  > related quote\n  no-progress=2 | source.js:1 | example\n`);
  assert.throws(() => core.readTask(root, "nested-quote"), /invalid task-review ledger schema marker/);

  core.createTask(root, { id: "star-ledger", title: "Star ledger", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "star-ledger"), `${body(root, "star-ledger").trimEnd()}\n\n## Review\n\n* Schema: task-review-ledger/v2\n* Pass: 1\n* Next finding: 2\n* \`TR-1\` | no-progress=2 | source.js:1 | Fix the defect\n`);
  assert.throws(() => core.readTask(root, "star-ledger"), /invalid task-review ledger schema marker/);

  core.createTask(root, { id: "plus-ledger", title: "Plus ledger", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "plus-ledger"), `${body(root, "plus-ledger").trimEnd()}\n\n## Review\n\n+ Schema task-review-ledger/v2\n+ Pass 1\n+ Next finding 2\n+ \`TR-1\` | no-progress = 2 | source.js:1 | Fix the defect\n`);
  assert.throws(() => core.readTask(root, "plus-ledger"), /invalid task-review ledger schema marker/);

  for (const [name, marker] of [["dash", "-"], ["plus", "+"], ["star", "*"]]) {
    for (const [shape, finding] of [
      ["reverse", `${marker} no-progress 2 | TR-1 | source.js:1 | Fix the defect`],
      ["continuation", `${marker} TR-1 |\n  no-progress 2 | source.js:1 | Fix the defect`],
    ]) {
      const id = `${name}-${shape}`;
      core.createTask(root, { id, title: id, kind: "task", targets: ["T1: Finish"] });
      writeFileSync(core.taskPath(root, id), `${body(root, id).trimEnd()}\n\n## Review\n\n${finding}\n`);
      assert.throws(() => core.readTask(root, id), /invalid task-review ledger schema marker/);
    }
  }

  core.createTask(root, { id: "indented-ledger", title: "Indented ledger", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "indented-ledger"), `${body(root, "indented-ledger").trimEnd()}\n\n## Review\n\n  - Schema: task-review-ledger/v1\n  - Pass: 1\n  - Next finding: 2\n  - \`TR-1\` | no-progress=2 | source.js:1 | Fix the defect\n`);
  assert.equal(core.readTask(root, "indented-ledger").reviewLedger.entries[0].noProgress, 2);

  for (const [id, container] of [
    ["unclosed-quote-html-comment", "> <!--\n> comment"],
    ["unclosed-list-html-comment", "- example\n  <!--\n  comment"],
    ["unclosed-quote-html-raw", "> <pre>\n> content"],
    ["unclosed-list-html-block", "- example\n  <div>\n  content"],
  ]) {
    core.createTask(root, { id, title: id, kind: "task", targets: ["T1: Finish"] });
    writeFileSync(core.taskPath(root, id), `${body(root, id).trimEnd()}\n\n## Review\n\n- Historical summary.\n\n${container}\n## Review ##\n`);
    assert.throws(() => core.readTask(root, id), /duplicate Review section/);
  }

  for (const [id, container] of [
    ["unclosed-list-continuation", "- example\n  ~~~markdown\n  example"],
    ["unclosed-nested-list-continuation", "- parent\n  - child\n  ~~~markdown\n  example"],
    ["unclosed-quote-list-continuation", "> - example\n>   ~~~markdown\n>   example"],
    ["unclosed-quote-nested-list-continuation", "> - parent\n>   - child\n>   ~~~markdown\n>   example"],
  ]) {
    core.createTask(root, { id, title: id, kind: "task", targets: ["T1: Finish"] });
    writeFileSync(core.taskPath(root, id), `${body(root, id).trimEnd()}\n\n## Review\n\n- Historical summary.\n\n${container}\n## Review ##\n`);
    assert.throws(() => core.readTask(root, id), /duplicate Review section/);
  }

  core.createTask(root, { id: "unclosed-list-fence", title: "Unclosed list fence", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "unclosed-list-fence"), `${body(root, "unclosed-list-fence").trimEnd()}\n\n## Review\n\n- Historical summary.\n\n- ~~~markdown\n  example\n## Review ##\n`);
  assert.throws(() => core.readTask(root, "unclosed-list-fence"), /duplicate Review section/);

  core.createTask(root, { id: "duplicate-review", title: "Duplicate review", kind: "task", targets: ["T1: Finish"] });
  writeFileSync(core.taskPath(root, "duplicate-review"), `${body(root, "duplicate-review").trimEnd()}\n\n## Review\n\n- Historical summary.\n\n## Review ##\n\n- Schema: task-review-ledger/v1\n- Pass: 1\n- Next finding: 2\n- \`TR-1\` | no-progress=2 | source.js:1 | Fix the defect\n`);
  assert.throws(() => core.readTask(root, "duplicate-review"), /duplicate Review section/);
});

test("no-file tasks honor explicitly requested adversarial review without task-review", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "demo", title: "Demo", kind: "task", targets: ["T1: Finish"] });
  core.resumeTask(root, "demo");
  core.recordResult(root, "demo", "T1", "Checked the no-file result");
  assess(root, "demo", "R0");
  core.setReviewGate(root, "demo", "required", "explicit adversarial review pending");
  core.setState(root, "demo", "in_review");
  core.setReviewGate(root, "demo", "approved", "requested adversarial review approved the no-file result");
  core.recordVerification(root, "demo", true, "result evidence checked");
  core.recordResult(root, "demo", "T1", "Revised no-file result");
  assert.match(body(root, "demo"), /Review gate: Required — Result evidence changed after review; rerun the applicable review/);
  assert.doesNotMatch(body(root, "demo"), /## Verification/);

  core.setState(root, "demo", "in_progress");
  assess(root, "demo", "R0");
  core.setState(root, "demo", "in_review");
  core.setReviewGate(root, "demo", "approved", "requested adversarial re-review approved the no-file result");
  core.recordVerification(root, "demo", true, "revised result evidence checked");
  core.completeTask(root, "demo");
  assert.match(body(root, "demo"), /Review gate: Approved/);

  core.reopenTask(root, "demo");
  assert.match(body(root, "demo"), /Review gate: Required — Task reopened; rerun the applicable review/);
  assert.doesNotMatch(body(root, "demo"), /## Verification/);
});

test("file-changing tasks complete from In Review after task-review passes", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "demo", title: "Demo", kind: "task", targets: ["T1: Finish"] });
  core.resumeTask(root, "demo");
  core.recordResult(root, "demo", "T1", "Changed the deliverable");

  assert.throws(() => core.setReviewGate(root, "demo", "passed", "findings none"), /requires In Review/);
  assess(root, "demo");
  core.setReviewGate(root, "demo", "required", "mandatory task-review pending");
  core.setState(root, "demo", "in_review");
  assert.throws(() => core.completeTask(root, "demo"), /review gate/);
  core.setReviewGate(root, "demo", "passed", "independent task-review found no blocking issue");
  core.recordVerification(root, "demo", true, "focused checks passed");
  core.completeTask(root, "demo");

  assert.match(body(root, "demo"), /^Status: Completed /m);
  assert.match(body(root, "demo"), /Review gate: Passed/);

  core.reopenTask(root, "demo");
  assert.match(body(root, "demo"), /^Status: In Progress /m);
  assert.match(body(root, "demo"), /Review gate: Required — Task reopened/);
  assert.doesNotMatch(body(root, "demo"), /## Verification/);
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
    assess(root, id);
    core.setReviewGate(root, id, "required", "mandatory task-review pending");
    core.setState(root, id, "in_review");
    core.setReviewGate(root, id, "passed", "task-review found no blocking issue");
    core.recordVerification(root, id, true, `${id} check passed`);
    core.completeTask(root, id);
  }

  assert.equal(core.nextChild(root, "parent"), undefined);
  core.resumeTask(root, "parent");
  assert.throws(() => core.completeTask(root, "parent"), /unchecked Target/);
  core.recordResult(root, "parent", "T1", "Integrated both children");
  assess(root, "parent", "R0");
  core.setReviewGate(root, "parent", "skipped", "no parent-owned deliverable files changed");
  core.recordVerification(root, "parent", true, "integration check passed");
  core.completeTask(root, "parent");
  assert.match(body(root, "parent"), /^Status: Completed /m);
});

test("a no-file Queue parent can honor explicit adversarial review without task-review", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate"] });
  core.createTask(root, { id: "child", title: "Child", kind: "task", targets: ["T1: Finish"] });
  core.linkChild(root, "parent", "child");

  core.resumeTask(root, "child");
  core.recordResult(root, "child", "T1", "Completed no-file child result");
  assess(root, "child", "R0");
  core.setReviewGate(root, "child", "skipped", "no deliverable files changed");
  core.recordVerification(root, "child", true, "child result checked");
  core.completeTask(root, "child");

  core.resumeTask(root, "parent");
  core.recordResult(root, "parent", "T1", "Integrated no-file child result");
  assess(root, "parent", "R0");
  core.setReviewGate(root, "parent", "required", "explicit adversarial review pending");
  core.setState(root, "parent", "in_review");
  core.setReviewGate(root, "parent", "approved", "requested adversarial review approved the no-file integration result");
  core.recordVerification(root, "parent", true, "integration result checked");
  core.completeTask(root, "parent");

  assert.match(body(root, "parent"), /Review gate: Approved/);
});

test("reopening a Queue child invalidates its active parent and rejects a completed parent", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate"] });
  core.createTask(root, { id: "child", title: "Child", kind: "task", targets: ["T1: Finish"] });
  core.linkChild(root, "parent", "child");

  core.resumeTask(root, "child");
  core.recordResult(root, "child", "T1", "Initial child result");
  assess(root, "child", "R0");
  core.setReviewGate(root, "child", "skipped", "no deliverable files changed");
  core.recordVerification(root, "child", true, "child result checked");
  core.completeTask(root, "child");

  core.resumeTask(root, "parent");
  core.recordResult(root, "parent", "T1", "Initial integration result");
  assess(root, "parent");
  core.setReviewGate(root, "parent", "required", "mandatory task-review pending");
  core.setState(root, "parent", "in_review");
  core.setReviewGate(root, "parent", "passed", "task-review found no blocking issue");
  core.recordVerification(root, "parent", true, "integration checked");

  core.reopenTask(root, "child");
  let parent = core.readTask(root, "parent");
  assert.equal(parent.status.state, "in_progress");
  assert.equal(parent.review[1], "Required");
  assert.match(parent.review[2], /Child child reopened/);
  assert.equal(parent.verification, null);
  assert.equal(parent.reviewAssessment.state, "Stale");

  assess(root, "child", "R0");
  core.setReviewGate(root, "child", "skipped", "no deliverable files changed");
  core.recordVerification(root, "child", true, "revised child result checked");
  core.completeTask(root, "child");
  core.recordVerification(root, "parent", true, "stale integration check must not bypass review");
  assert.throws(() => core.completeTask(root, "parent"), /review gate/);
  assess(root, "parent");
  core.setState(root, "parent", "in_review");
  core.setReviewGate(root, "parent", "passed", "fresh integration task-review found no blocking issue");
  core.recordVerification(root, "parent", true, "fresh integration checked");
  core.completeTask(root, "parent");

  assert.throws(() => core.reopenTask(root, "child"), /reopen parent parent/);
  core.reopenTask(root, "parent");
  assert.doesNotThrow(() => core.reopenTask(root, "child"));
});

test("Queue parents and children require distinct normalized titles", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Release workflow", kind: "queue", targets: ["T1: Integrate"] });
  core.createTask(root, { id: "same-as-parent", title: " Release  workflow ", kind: "task", targets: ["T1: Finish"] });
  assert.throws(() => core.linkChild(root, "parent", "same-as-parent"), /parent and children need distinct titles/);

  core.createTask(root, { id: "child-a", title: "Publish package", kind: "task", targets: ["T1: Finish A"] });
  core.createTask(root, { id: "child-b", title: "Ｐｕｂｌｉｓｈ package", kind: "task", targets: ["T1: Finish B"] });
  core.linkChild(root, "parent", "child-a");
  assert.throws(() => core.linkChild(root, "parent", "child-b"), /children need distinct titles/);

  writeFileSync(core.taskPath(root, "child-a"), body(root, "child-a").replace("# Publish package", "# Release workflow"));
  core.syncIndex(root, "child-a");
  assert.match(core.validateWorkspace(root).join("\n"), /duplicate Queue title for child-a/);
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
  assess(root, "demo");
  core.setReviewGate(root, "demo", "required", "mandatory task-review pending");
  core.setState(root, "demo", "in_review");
  assert.throws(() => core.setReviewGate(root, "demo", "skipped", "no review"), /cannot skip/);
  core.setReviewGate(root, "demo", "passed", "task-review found no blocking issue");
  core.recordVerification(root, "demo", true, "focused checks passed");
  core.setState(root, "demo", "in_progress");
  assert.match(body(root, "demo"), /Review gate: Required — Task left In Review/);
  assert.doesNotMatch(body(root, "demo"), /## Verification/);
});

test("a stalled mandatory review blocks completion and preserves its ledger across resume", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "demo", title: "Demo", kind: "task", targets: ["T1: Finish"] });
  core.resumeTask(root, "demo");
  core.recordResult(root, "demo", "T1", "Changed the deliverable");
  assess(root, "demo");
  core.setReviewGate(root, "demo", "required", "mandatory task-review pending");
  core.setState(root, "demo", "in_review");
  writeFileSync(core.taskPath(root, "demo"), `${body(root, "demo").trimEnd()}\n\n## Review\n\n- Schema: task-review-ledger/v1\n- Pass: 3\n- Next finding: 2\n- \`TR-1\` | no-progress=2 | source.js:10 | Correct the stale write\n\n## Block\n\n- Reason: TR-1 made no substantive progress in two consecutive re-reviews.\n- Unblock when: The user chooses a different remedy or new artifact evidence addresses TR-1.\n`);
  assert.throws(() => core.setState(root, "demo", "in_progress"), /reset stalled Review findings.*TR-1/);
  core.setState(root, "demo", "blocked");

  assert.match(body(root, "demo"), /^Status: Blocked /m);
  assert.throws(() => core.completeTask(root, "demo"), /only active tasks/);
  assert.match(body(root, "demo"), /no-progress=2/);

  assert.throws(() => core.resumeTask(root, "demo"), /reset stalled Review findings.*TR-1/);
  writeFileSync(core.taskPath(root, "demo"), body(root, "demo").replace("no-progress=2", "no-progress=0"));
  core.resumeTask(root, "demo");
  assert.match(body(root, "demo"), /^Status: In Progress /m);
  assert.doesNotMatch(body(root, "demo"), /## Block/);
  assert.match(body(root, "demo"), /## Review[\s\S]*no-progress=0/);
  assert.match(body(root, "demo"), /Review gate: Required/);
  writeFileSync(core.taskPath(root, "demo"), body(root, "demo").replace("no-progress=0", "no-progress=2"));
  assert.throws(() => core.resumeTask(root, "demo"), /reset stalled Review findings.*TR-1/);
  writeFileSync(core.taskPath(root, "demo"), body(root, "demo").replace("no-progress=2", "no-progress=0"));
  core.setState(root, "demo", "in_review");
  assert.throws(
    () => core.setReviewGate(root, "demo", "passed", "task-review found no blocking issue"),
    /remove the active Review ledger/,
  );
});

test("sync invalidates terminal review and verification after direct task specification edits", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "demo", title: "Demo", kind: "task", targets: ["T1: Original result"] });
  core.resumeTask(root, "demo");
  core.recordResult(root, "demo", "T1", "Original result checked");
  assess(root, "demo");
  core.setReviewGate(root, "demo", "required", "mandatory task-review pending");
  core.setState(root, "demo", "in_review");
  core.setReviewGate(root, "demo", "passed", "original Target reviewed");
  core.recordVerification(root, "demo", true, "original Target verified");
  writeFileSync(core.taskPath(root, "demo"), body(root, "demo").replace("T1: Original result", "T1: Materially different result"));

  core.syncIndex(root, "demo");
  assert.match(body(root, "demo"), /Review gate: Required — Task record changed before sync/);
  assert.doesNotMatch(body(root, "demo"), /## Verification/);
  assert.throws(() => core.completeTask(root, "demo"), /review gate/);
});

test("result and Queue graph changes invalidate completed review evidence", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "task", title: "Task", kind: "task", targets: ["T1: Finish"] });
  core.resumeTask(root, "task");
  core.recordResult(root, "task", "T1", "Initial result");
  assess(root, "task");
  core.setReviewGate(root, "task", "required", "mandatory task-review pending");
  core.setState(root, "task", "in_review");
  core.setReviewGate(root, "task", "passed", "task-review found no blocking issue");
  core.setReviewGate(root, "task", "approved", "ordinary review passed and requested adversarial review approved");
  core.recordVerification(root, "task", true, "initial checks passed");
  core.recordResult(root, "task", "T1", "Revised result");
  assert.match(body(root, "task"), /Review gate: Required — Result evidence changed after review/);
  assert.doesNotMatch(body(root, "task"), /## Verification/);

  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate"] });
  core.createTask(root, { id: "child", title: "Child", kind: "task", targets: ["T1: Finish"] });
  core.resumeTask(root, "parent");
  core.recordResult(root, "parent", "T1", "Initial integration");
  assess(root, "parent");
  core.setReviewGate(root, "parent", "required", "mandatory task-review pending");
  core.setState(root, "parent", "in_review");
  core.setReviewGate(root, "parent", "passed", "task-review found no blocking issue");
  core.recordVerification(root, "parent", true, "initial integration checks passed");
  core.linkChild(root, "parent", "child");
  assert.match(body(root, "parent"), /Review gate: Required — Queue graph changed after review/);
  assert.doesNotMatch(body(root, "parent"), /## Verification/);
});

test("a completed Queue parent must be reopened before its graph changes", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate"] });
  core.createTask(root, { id: "child-a", title: "Child A", kind: "task", targets: ["T1: Finish"] });
  core.linkChild(root, "parent", "child-a");
  for (const id of ["child-a", "parent"]) {
    core.resumeTask(root, id);
    core.recordResult(root, id, "T1", `Finished ${id}`);
    assess(root, id, "R0");
    core.setReviewGate(root, id, "skipped", "no deliverable files changed");
    core.recordVerification(root, id, true, `${id} check passed`);
    core.completeTask(root, id);
  }
  core.createTask(root, { id: "child-b", title: "Child B", kind: "task", targets: ["T1: Finish"] });
  assert.throws(() => core.linkChild(root, "parent", "child-b"), /reopen/);
});

test("R1 includes verified small logic changes and preserves final verification", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "logic", title: "Presentation condition", targets: ["T1: Show the empty-state label"] });
  core.resumeTask(root, "logic");
  core.recordResult(root, "logic", "T1", "Both presentation branches compared with the expected output");
  assert.throws(() => core.setReviewGate(root, "logic", "skipped", "small diff"), /Review Assessment/);
  assess(root, "logic", "R1");
  core.recordVerification(root, "logic", true, "preliminary comparison");
  core.setReviewGate(root, "logic", "skipped", "All R1 grounds established");
  assert.equal(core.readTask(root, "logic").verification, null);
  assert.throws(() => core.completeTask(root, "logic"), /passed verification/);
  core.recordVerification(root, "logic", true, "Final output and snapshot comparison unchanged");
  core.completeTask(root, "logic");
  assert.equal(core.readTask(root, "logic").reviewAssessment.level, "R1");
  assert.equal(core.readTask(root, "logic").status.state, "completed");
});

test("R1 requires all concrete grounds and a snapshot without partial writes", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "grounds", title: "Grounds", targets: ["T1: Finish"] });
  core.resumeTask(root, "grounds");
  const original = body(root, "grounds");
  for (const field of ["reason", "snapshot", "evidence", "clarity", "impact", "risk", "verification"]) {
    assert.throws(() => assess(root, "grounds", "R1", { [field]: "" }), /Review Assessment requires/);
    assert.equal(body(root, "grounds"), original);
  }
  assert.throws(() => assess(root, "grounds", "R3"), /invalid review level/);
  assert.throws(() => assess(root, "grounds", "R1", { reason: "first\nsecond" }), /one line/);
});

test("R2 and existing review obligations cannot be skipped or downgraded after failure", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "risk", title: "Permission change", targets: ["T1: Preserve access control"] });
  core.resumeTask(root, "risk");
  core.recordResult(root, "risk", "T1", "Authorization behavior examined");
  assess(root, "risk", "R2", { reason: "One-line authorization change has high consequences" });
  assert.throws(() => core.setReviewGate(root, "risk", "skipped", "one line"), /cannot skip R2/);
  core.setReviewGate(root, "risk", "required", "Independent review required");
  core.setState(root, "risk", "in_review");
  writeFileSync(core.taskPath(root, "risk"), `${body(root, "risk")}\n## Block\n\n- Reason: Reviewer unavailable.\n- Unblock when: A fresh read-only Reviewer can run.\n`);
  core.setState(root, "risk", "blocked");
  core.resumeTask(root, "risk");
  assert.throws(() => assess(root, "risk", "R1"), /cannot downgrade/);
  assess(root, "risk", "R2");
  assert.throws(() => core.setReviewGate(root, "risk", "skipped", "Reviewer unavailable"), /cannot skip/);
  core.setState(root, "risk", "in_review");
  assert.throws(() => core.setReviewGate(root, "risk", "approved", "Adversarial review only"), /requires Passed task-review first/);
  core.setReviewGate(root, "risk", "passed", "Independent review found no issue");
  core.setReviewGate(root, "risk", "approved", "Explicit adversarial review also completed");
});

test("R1 exemptions do not cancel explicit ordinary or adversarial review", (t) => {
  const root = workspace(t);
  for (const mode of ["ordinary", "adversarial"]) {
    core.createTask(root, { id: mode, title: mode, targets: ["T1: Finish"] });
    core.resumeTask(root, mode);
    core.recordResult(root, mode, "T1", "Output verified");
    assess(root, mode, "R1");
    core.setReviewGate(root, mode, "required", `User requested ${mode} review`);
    assess(root, mode, "R1");
    assert.throws(() => core.setReviewGate(root, mode, "skipped", "Low risk"), /existing review obligation/);
    core.setState(root, mode, "in_review");
    core.setReviewGate(root, mode, mode === "ordinary" ? "passed" : "approved", "Requested review completed");
    core.recordVerification(root, mode, true, "Final result unchanged");
    core.completeTask(root, mode);
  }
});

test("sync, Result and snapshot changes invalidate low-risk exemptions", (t) => {
  const root = workspace(t);
  for (const change of ["sync", "result", "snapshot"]) {
    core.createTask(root, { id: change, title: change, targets: ["T1: Finish"] });
    core.resumeTask(root, change);
    core.recordResult(root, change, "T1", "Initial result");
    assess(root, change, "R1");
    core.setReviewGate(root, change, "skipped", "R1 grounds checked");
    core.recordVerification(root, change, true, "Initial result verified");
    if (change === "sync") core.syncIndex(root, change);
    if (change === "result") core.recordResult(root, change, "T1", "Revised result");
    if (change === "snapshot") assess(root, change, "R1", { snapshot: "fixture-content-v2" });
    const task = core.readTask(root, change);
    assert.equal(task.review, null);
    assert.equal(task.verification, null);
    if (change !== "snapshot") {
      assert.equal(task.reviewAssessment.state, "Stale");
      assert.throws(() => core.setReviewGate(root, change, "skipped", "Reuse exemption"), /stale Review Assessment/);
      assess(root, change, "R1");
    }
    core.setReviewGate(root, change, "skipped", "Refreshed exemption");
    core.recordVerification(root, change, true, "Current content verified");
    core.completeTask(root, change);
  }
});

test("direct specification drift is caught even if sync was omitted", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "drift", title: "Drift", targets: ["T1: Original behavior"] });
  core.resumeTask(root, "drift");
  core.recordResult(root, "drift", "T1", "Original behavior verified");
  assess(root, "drift", "R1");
  core.setReviewGate(root, "drift", "skipped", "R1 grounds checked");
  core.recordVerification(root, "drift", true, "Original content checked");
  writeFileSync(core.taskPath(root, "drift"), body(root, "drift").replace("T1: Original behavior", "T1: Changed behavior"));
  assert.throws(() => core.completeTask(root, "drift"), /stale Review Assessment/);
});

test("assessment schema rejects duplicates, unknown versions and malformed fields", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "schema", title: "Schema", targets: ["T1: Finish"] });
  core.resumeTask(root, "schema");
  assess(root, "schema", "R1");
  const original = body(root, "schema");
  for (const changed of [
    original.replace("task-review-assessment/v1", "task-review-assessment/v2"),
    original.replace("- Level: R1", "- Level: R1\n- Level: R0"),
    original.replace("- Level: R1", "* Level: R1"),
    original.replace("- Level: R1", "- Level: R9"),
    original.replace(/^- Bounded impact: .+\n/m, ""),
    `${original}\n## Review Assessment\n\n- Level: R0\n`,
  ]) {
    writeFileSync(core.taskPath(root, "schema"), changed);
    assert.throws(() => core.readTask(root, "schema"), /Review Assessment/);
  }
  writeFileSync(core.taskPath(root, "schema"), original);
  assert.doesNotThrow(() => core.readTask(root, "schema"));
});

test("historical records remain readable but new completion needs an assessment", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "history", title: "History", targets: ["T1: Finish"] });
  core.resumeTask(root, "history");
  core.recordResult(root, "history", "T1", "No-file result");
  assess(root, "history", "R0");
  core.setReviewGate(root, "history", "skipped", "No deliverables changed");
  core.recordVerification(root, "history", true, "Verified");
  core.completeTask(root, "history");
  writeFileSync(core.taskPath(root, "history"), body(root, "history").replace(/\n## Review Assessment\n[\s\S]*?(?=\n## |$)/, ""));
  assert.equal(core.readTask(root, "history").reviewAssessment, undefined);
  assert.deepEqual(core.validateWorkspace(root), []);
  core.reopenTask(root, "history");
  assert.throws(() => core.setReviewGate(root, "history", "skipped", "Old exemption"), /Review Assessment/);
  assess(root, "history", "R0");
  core.setReviewGate(root, "history", "skipped", "Current no-file result");
});

test("link rejects a Completed child's new relationship without partial writes", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate"] });
  core.createTask(root, { id: "child", title: "Child", targets: ["T1: Finish"] });
  core.resumeTask(root, "child");
  core.recordResult(root, "child", "T1", "No-file result");
  assess(root, "child", "R0");
  core.setReviewGate(root, "child", "skipped", "No deliverable changes");
  core.recordVerification(root, "child", true, "Final result verified");
  core.completeTask(root, "child");
  const before = [body(root, "parent"), body(root, "child"), readFileSync(core.indexPath(root), "utf8")];
  assert.throws(() => core.linkChild(root, "parent", "child"), /reopen Completed child child/);
  assert.deepEqual([body(root, "parent"), body(root, "child"), readFileSync(core.indexPath(root), "utf8")], before);
  core.reopenTask(root, "child");
  core.linkChild(root, "parent", "child");
  assert.equal(core.nextChild(root, "parent").id, "child");
  assert.equal(core.readTask(root, "child").reviewAssessment.state, "Stale");
});

test("identical reciprocal links preserve Completed evidence and parent review", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "parent", title: "Parent", kind: "queue", targets: ["T1: Integrate"] });
  core.createTask(root, { id: "child", title: "Child", targets: ["T1: Finish"] });
  core.linkChild(root, "parent", "child");
  core.resumeTask(root, "child");
  core.recordResult(root, "child", "T1", "Child result");
  assess(root, "child", "R1");
  core.setReviewGate(root, "child", "skipped", "Bounded low-risk change");
  core.recordVerification(root, "child", true, "Final child result verified");
  core.completeTask(root, "child");
  core.resumeTask(root, "parent");
  core.recordResult(root, "parent", "T1", "Integrated result");
  assess(root, "parent", "R2");
  core.setReviewGate(root, "parent", "required", "Independent integration review");
  core.setState(root, "parent", "in_review");
  core.setReviewGate(root, "parent", "passed", "Independent review complete");
  core.recordVerification(root, "parent", true, "Final integration checked");
  for (const state of ["in_review", "completed"]) {
    if (state === "completed") core.completeTask(root, "parent");
    const before = [body(root, "parent"), body(root, "child"), readFileSync(core.indexPath(root), "utf8")];
    core.linkChild(root, "parent", "child");
    assert.deepEqual([body(root, "parent"), body(root, "child"), readFileSync(core.indexPath(root), "utf8")], before);
    assert.equal(core.nextChild(root, "parent"), undefined);
    assert.equal(core.readTask(root, "child").reviewAssessment.state, "Current");
  }
});

function prepareLedgerReview(root) {
  core.createTask(root, { id: "ledger", title: "Ledger", targets: ["T1: Correct behavior"] });
  core.resumeTask(root, "ledger");
  core.recordResult(root, "ledger", "T1", "Fixed behavior checked");
  writeFileSync(core.taskPath(root, "ledger"), `${body(root, "ledger")}\n## Review\n\n- Schema: task-review-ledger/v1\n- Pass: 2\n- Next finding: 2\n- \`TR-1\` | no-progress=0 | source.js:1 | Correct the behavior\n`);
  assess(root, "ledger", "R2");
  core.setReviewGate(root, "ledger", "required", "Fresh re-review pending");
  core.setState(root, "ledger", "in_review");
}

test("all findings resolved can atomically clear the ledger and pass without regrading", (t) => {
  const root = workspace(t);
  prepareLedgerReview(root);
  const assessment = core.readTask(root, "ledger").reviewAssessment;
  core.recordVerification(root, "ledger", true, "Preliminary check");
  core.setReviewGate(root, "ledger", "passed", "Fresh pass fixture: TR-1 resolved; snapshot unchanged", {
    resolveLedger: true, snapshot: assessment.snapshot,
  });
  const task = core.readTask(root, "ledger");
  assert.equal(task.reviewLedger, undefined);
  assert.deepEqual(task.reviewAssessment, assessment);
  assert.equal(task.review[1], "Passed");
  assert.equal(task.verification, null);
  assert.equal(task.status.state, "in_review");
  core.recordVerification(root, "ledger", true, "Final unchanged result verified");
  core.completeTask(root, "ledger");
});

test("report indexing preserves assessment and survives ledger resolution, completion and reopen", (t) => {
  const root = workspace(t);
  prepareLedgerReview(root);
  const assessment = core.readTask(root, "ledger").reviewAssessment;
  const index = "\n## Review Reports\n\n| Round | Report | Snapshot | Outcome |\n| --- | --- | --- | --- |\n| 01 | [Round 01](../artifacts/ledger/reviews/round-01.md) | fixture-content-v1 | findings: TR-1 |\n";
  writeFileSync(core.taskPath(root, "ledger"), body(root, "ledger") + index);
  writeFileSync(core.taskPath(root, "ledger"), body(root, "ledger") + "| 02 | [Round 02](../artifacts/ledger/reviews/round-02.md) | fixture-content-v1 | no blocking findings |\n");
  core.setReviewGate(root, "ledger", "passed", "Round 02: TR-1 resolved", {
    resolveLedger: true, snapshot: assessment.snapshot,
  });
  assert.deepEqual(core.readTask(root, "ledger").reviewAssessment, assessment);
  assert.equal(core.readTask(root, "ledger").reviewLedger, undefined);
  assert.match(body(root, "ledger"), /## Review Reports/);
  core.recordVerification(root, "ledger", true, "Final unchanged result verified");
  core.completeTask(root, "ledger");
  core.reopenTask(root, "ledger");
  for (const round of ["01", "02"]) assert.ok(body(root, "ledger").includes(`round-${round}.md`));
  assert.equal(core.readTask(root, "ledger").reviewAssessment.state, "Stale");
});

test("report indexes do not hide substantive drift or bypass explicit sync", (t) => {
  const root = workspace(t);
  prepareLedgerReview(root);
  const original = body(root, "ledger");
  const index = "\n## Review Reports\n\n| 01 | [Round 01](../artifacts/ledger/reviews/round-01.md) | fixture-content-v1 | no blocking findings |\n";
  for (const change of [
    (text) => text.replace("T1: Correct behavior", "T1: Different behavior"),
    (text) => text.replace("Fixed behavior checked", "Changed evidence"),
    (text) => text + "\n## Scope\n\nChanged scope\n",
  ]) {
    writeFileSync(core.taskPath(root, "ledger"), change(original + index));
    assert.throws(() => core.setReviewGate(root, "ledger", "passed", "Indexed report", {
      resolveLedger: true, snapshot: "fixture-content-v1",
    }), /stale Review Assessment/);
  }
  writeFileSync(core.taskPath(root, "ledger"), original + index);
  core.syncIndex(root, "ledger");
  assert.equal(core.readTask(root, "ledger").reviewAssessment.state, "Stale");
});

test("ledger resolution rejects missing, stale or mismatched identity without clearing findings", (t) => {
  const root = workspace(t);
  prepareLedgerReview(root);
  const original = body(root, "ledger");
  for (const options of [{ resolveLedger: true }, { resolveLedger: true, snapshot: "other-content" }]) {
    assert.throws(() => core.setReviewGate(root, "ledger", "passed", "Fresh pass", options), /current reviewed assessment snapshot/);
    assert.equal(body(root, "ledger"), original);
  }
  assert.throws(() => core.setReviewGate(root, "ledger", "approved", "Wrong gate", { resolveLedger: true, snapshot: "fixture-content-v1" }), /resolve-ledger requires Passed/);
  assert.throws(() => core.setReviewGate(root, "ledger", "passed", "No resolution flag"), /remove the active Review ledger/);
  writeFileSync(core.taskPath(root, "ledger"), original.replace("T1: Correct behavior", "T1: Different behavior"));
  const drifted = body(root, "ledger");
  assert.throws(() => core.setReviewGate(root, "ledger", "passed", "Stale pass", { resolveLedger: true, snapshot: "fixture-content-v1" }), /stale Review Assessment/);
  assert.equal(body(root, "ledger"), drifted);
  writeFileSync(core.taskPath(root, "ledger"), original.replace("no-progress=0", "no-progress=2"));
  assert.throws(() => core.setReviewGate(root, "ledger", "passed", "Stalled pass", { resolveLedger: true, snapshot: "fixture-content-v1" }), /cannot resolve a stalled Review ledger/);
  assert.equal(core.readTask(root, "ledger").reviewLedger.entries[0].noProgress, 2);
});

test("CLI ledger clearance is restricted to Passed and preserves the current assessment", (t) => {
  const root = workspace(t);
  prepareLedgerReview(root);
  const output = execFileSync(process.execPath, [cli, "--workspace", root, "review", "ledger", "passed",
    "--resolve-ledger", "--snapshot", "fixture-content-v1", "--evidence", "Fresh pass: TR-1 resolved"], { encoding: "utf8" });
  assert.equal(JSON.parse(output).reviewAssessment.state, "Current");
  assert.equal(core.readTask(root, "ledger").reviewLedger, undefined);
  assert.equal(core.readTask(root, "ledger").review[1], "Passed");
});

test("the CLI records and exposes grading grounds without running checks", (t) => {
  const root = workspace(t);
  core.createTask(root, { id: "cli-grade", title: "CLI grade", targets: ["T1: Finish"] });
  core.resumeTask(root, "cli-grade");
  const output = execFileSync(process.execPath, [cli, "--workspace", root, "assess-review", "cli-grade", "R1",
    "--reason", "Small presentation condition", "--snapshot", "sha256:fixture", "--evidence", "Output compared",
    "--clarity", "Settled behavior", "--impact", "Known callers", "--risk", "Recoverable display only",
    "--verification", "Output and preserved behavior compared"], { encoding: "utf8" });
  assert.equal(JSON.parse(output).reviewAssessment.level, "R1");
  const shown = JSON.parse(execFileSync(process.execPath, [cli, "--workspace", root, "show", "cli-grade", "--json"], { encoding: "utf8" }));
  assert.equal(shown.reviewAssessment.snapshot, "sha256:fixture");
  assert.equal(shown.reviewAssessment.state, "Current");
  assert.throws(() => execFileSync(process.execPath, [cli, "--workspace", root, "assess-review", "cli-grade", "R1", "--reason", "small"], { stdio: "pipe" }));
});
