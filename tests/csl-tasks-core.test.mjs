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
  core.setReviewGate(root, "legacy-review", "skipped", "no deliverable files changed");
  core.recordVerification(root, "legacy-review", true, "initial result checked");
  core.completeTask(root, "legacy-review");
  writeFileSync(core.taskPath(root, "legacy-review"), `${body(root, "legacy-review").trimEnd()}\n\n## Review\n\n- Historical free-form review summary.\n\n~~~markdown\n## Review\n- Pass: example only\n~~~\n\n \t## Review\n \t- Pass: mixed-indent code sample\n\n- ~~~markdown\n  ## Review ##\n  - Schema: task-review-ledger/v2\n  ~~~\n\n- example\n  ~~~markdown\n  ## Review ##\n  ~~~\n\n<!--\n## Review\n- Pass: comment sample\n-->\n\n<div>\n## Review\n</div>\n\n~~~markdown\n> ~~~\n- ~~~\n## Review ##\n~~~\n`);

  core.reopenTask(root, "legacy-review");
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
  core.setReviewGate(root, "demo", "required", "explicit adversarial review pending");
  core.setState(root, "demo", "in_review");
  core.setReviewGate(root, "demo", "approved", "requested adversarial review approved the no-file result");
  core.recordVerification(root, "demo", true, "result evidence checked");
  core.recordResult(root, "demo", "T1", "Revised no-file result");
  assert.match(body(root, "demo"), /Review gate: Required — Result evidence changed after review; rerun the applicable review/);
  assert.doesNotMatch(body(root, "demo"), /## Verification/);

  core.setState(root, "demo", "in_progress");
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
  core.setReviewGate(root, "child", "skipped", "no deliverable files changed");
  core.recordVerification(root, "child", true, "child result checked");
  core.completeTask(root, "child");

  core.resumeTask(root, "parent");
  core.recordResult(root, "parent", "T1", "Integrated no-file child result");
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
  core.setReviewGate(root, "child", "skipped", "no deliverable files changed");
  core.recordVerification(root, "child", true, "child result checked");
  core.completeTask(root, "child");

  core.resumeTask(root, "parent");
  core.recordResult(root, "parent", "T1", "Initial integration result");
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

  core.setReviewGate(root, "child", "skipped", "no deliverable files changed");
  core.recordVerification(root, "child", true, "revised child result checked");
  core.completeTask(root, "child");
  core.recordVerification(root, "parent", true, "stale integration check must not bypass review");
  assert.throws(() => core.completeTask(root, "parent"), /review gate/);
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
    core.setReviewGate(root, id, "skipped", "no deliverable files changed");
    core.recordVerification(root, id, true, `${id} check passed`);
    core.completeTask(root, id);
  }
  core.createTask(root, { id: "child-b", title: "Child B", kind: "task", targets: ["T1: Finish"] });
  assert.throws(() => core.linkChild(root, "parent", "child-b"), /reopen/);
});
