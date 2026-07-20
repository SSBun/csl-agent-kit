import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const taskDir = path.join(root, "tasks", "todo");
const reportDir = path.join(root, "reports", "adversarial-review");

function readMarkdown(dir) {
  return new Map(readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => [file, readFileSync(path.join(dir, file), "utf8")]));
}

function validateTaskGraph(index, tasks, reports) {
  const entries = index.split("\n").slice(2).filter(Boolean).map((line) => {
    const match = line.match(/^- \[(.+)]\(todo\/([a-z0-9-]+\.md)\) — (.+)$/);
    assert.ok(match, `invalid task index entry: ${line}`);
    return { title: match[1], file: match[2], status: match[3] };
  });
  const linkedReports = new Set();

  assert.equal(index.startsWith("# 任务索引\n\n"), true);
  assert.equal(new Set(entries.map(({ file }) => file)).size, entries.length);
  assert.deepEqual(entries.map(({ file }) => file).sort(), [...tasks.keys()].sort());

  for (const entry of entries) {
    const body = tasks.get(entry.file);
    assert.equal(body.match(/^# (.+)$/m)?.[1], entry.title, entry.file);
    const status = body.match(/^状态：\s*(.+)$/m)?.[1]
      ?? body.match(/^\*\*Status:\*\*\s*(.+)$/m)?.[1]
      ?? body.match(/^Status:\s*(.+)$/m)?.[1]
      ?? "未标注";
    assert.equal(entry.status, status.trim(), entry.file);
    const reportLink = body.match(/^- Report: \[[^\]]+]\(\.\.\/\.\.\/reports\/adversarial-review\/([a-z0-9-]+\.md)\)$/m);
    if (reportLink) {
      assert.equal(reportLink[1], entry.file, `task/report slug mismatch: ${entry.file}`);
      assert.ok(reports.has(reportLink[1]), `missing report: ${reportLink[1]}`);
      linkedReports.add(reportLink[1]);
    }
  }

  assert.deepEqual([...linkedReports].sort(), [...reports.keys()].sort());
  for (const [reportFile, report] of reports) {
    const taskLink = report.match(/^- Task: \[[^\]]+]\(\.\.\/\.\.\/tasks\/todo\/([a-z0-9-]+\.md)\)/m);
    assert.ok(taskLink, `missing task link: ${reportFile}`);
    assert.equal(taskLink[1], reportFile, `report/task slug mismatch: ${reportFile}`);
    assert.ok(tasks.has(taskLink[1]), `missing task: ${taskLink[1]}`);
  }
}

test("task index and review reports resolve to isolated same-slug files", () => {
  validateTaskGraph(
    readFileSync(path.join(root, "tasks", "todo.md"), "utf8"),
    readMarkdown(taskDir),
    readMarkdown(reportDir),
  );
});

test("task links to deleted reports fail validation", () => {
  const index = "# 任务索引\n\n- [任务 A](todo/task-a.md) — 进行中\n";
  const tasks = new Map([["task-a.md", "# 任务 A\n\n状态：进行中\n\n- Report: [Adversarial review report](../../reports/adversarial-review/task-a.md)\n"]]);
  assert.throws(() => validateTaskGraph(index, tasks, new Map()), /missing report: task-a\.md/);
});

test("cross-linked task and report slugs fail validation", () => {
  const index = "# 任务索引\n\n- [任务 A](todo/task-a.md) — 进行中\n";
  const tasks = new Map([["task-a.md", "# 任务 A\n\n状态：进行中\n\n- Report: [Adversarial review report](../../reports/adversarial-review/report-b.md)\n"]]);
  const reports = new Map([["report-b.md", "# Review\n\n- Task: [tasks/todo/task-a.md](../../tasks/todo/task-a.md) — 任务 A\n"]]);
  assert.throws(() => validateTaskGraph(index, tasks, reports), /task\/report slug mismatch: task-a\.md/);
});
