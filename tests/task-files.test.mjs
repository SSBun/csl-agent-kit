import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const taskDir = path.join(root, "tasks", "todo");
const reportDir = path.join(root, "reports", "adversarial-review");
const workflowDir = path.join(root, "skills", "workspace-workflow");

function readMarkdown(dir) {
  return new Map(readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => [file, readFileSync(path.join(dir, file), "utf8")]));
}

function validateReviewReport(markdown, { task, cycles, dialogue = [] } = {}) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]+)$/);
  assert.ok(match, "missing report frontmatter");

  const metadata = Object.fromEntries(match[1].split("\n").map((line) => line.split(/:\s+/, 2)));
  const expectedMetadata = task === undefined ? ["created", "review_cycles"] : ["created", "review_cycles", "task"];
  assert.deepEqual(Object.keys(metadata).sort(), expectedMetadata);
  assert.match(metadata.created, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Number.isInteger(Number(metadata.review_cycles)) && Number(metadata.review_cycles) > 0);
  if (cycles !== undefined) assert.equal(Number(metadata.review_cycles), cycles);
  if (task === undefined) assert.equal("task" in metadata, false);
  else assert.equal(metadata.task, task);

  const body = match[2];
  assert.equal((body.match(/^---$/gm) ?? []).length, 1, "report must have one body divider");
  const divider = body.search(/^---$/m);
  const discussion = body.slice(0, divider).trim();
  const decision = body.slice(divider + 3).trim();
  assert.deepEqual(decision.split("\n").filter(Boolean).map((line) => line.match(/^\*\*([^:]+):\*\*/)?.[1]), ["Final decision", "Outcome", "Remaining"]);
  assert.match(decision, /^\*\*Final decision:\*\* `(?:APPROVED|NEEDS_USER|BLOCKED|STALLED|USER_STOP|SUPERSEDED)`$/m);
  assert.match(decision, /^\*\*Outcome:\*\* .+$/m);
  assert.match(decision, /^\*\*Remaining:\*\* .+$/m);
  assert.equal(/^(?:Topic:|> |\*\*Conclusion:)/m.test(decision), false);

  for (const forbidden of ["Discussion results", "Reviewer position", "Editor response", "Reviewer:", "Reviewer identity", "Finding:", "Required outcome:", "Gate:", "Review state:", "Stop reason:", "Round history", "Technical appendix", "Verification", "INITIAL", "RE-REVIEW", "CONTINUE", "BLOCKER", "QUESTION", "fingerprint"]) {
    assert.equal(discussion.includes(forbidden), false, `internal report metadata remains: ${forbidden}`);
  }
  assert.equal(/^##+ /m.test(discussion), false, "extra discussion heading remains");
  assert.equal(/^\|.*\|$/m.test(discussion), false, "report table remains");
  assert.equal(/\p{Extended_Pictographic}/u.test(discussion), false, "report emoji remains");
  assert.equal(/(?:^|\s)(?:\/|\.\.\/|\.\/)[^\s]+/m.test(discussion), false, "routine path remains");

  const topics = [...discussion.matchAll(/^Topic: .+$/gm)];
  assert.equal(topics.length, dialogue.length);
  if (topics.length === 0) {
    const lines = discussion.split("\n").filter(Boolean);
    assert.match(lines[0], /^# /);
    assert.equal(lines.slice(1).length, 1, "clean approval must use one sentence");
    return;
  }

  topics.forEach((topic, index) => {
    const end = topics[index + 1]?.index ?? discussion.length;
    const block = discussion.slice(topic.index, end).trim();
    assert.equal((block.match(/^\*\*Conclusion:\*\* .+$/gm) ?? []).length, 1);
    assert.match(block, /^Topic: .+[\s\S]*\n\*\*Conclusion:\*\* .+$/);
    const quoted = block.slice(block.indexOf("\n") + 1, block.search(/^\*\*Conclusion:/m)).trim();
    assert.ok(quoted.split("\n").every((line) => line.startsWith(">")), "topic has multiple quote blocks");

    const labels = [...quoted.matchAll(/^> \*\*([ER]\d+):\*\*(?: .+)?$/gm)].map((item) => item[1]);
    assert.deepEqual(labels, dialogue[index]);

    const lines = quoted.split("\n");
    for (const [lineIndex, line] of lines.entries()) {
      if (!/^> \*\*[ER]\d+:\*\*/.test(line)) continue;
      const nextLabel = lines.findIndex((candidate, candidateIndex) => candidateIndex > lineIndex && /^> \*\*[ER]\d+:\*\*/.test(candidate));
      const turn = lines.slice(lineIndex + 1, nextLabel === -1 ? lines.length : nextLabel);
      const listItems = turn.filter((candidate) => /^> - /.test(candidate));
      if (/^> \*\*[ER]\d+:\*\*$/.test(line)) {
        assert.ok(listItems.length >= 2, "multi-viewpoint turn needs a list");
        assert.ok(turn.every((candidate) => candidate === ">" || /^> - /.test(candidate)), "multi-viewpoint turn contains non-list content");
      } else {
        assert.ok(turn.every((candidate) => candidate === ">"), "single-viewpoint turn must stay inline");
      }
    }
  });
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
      ?? body.match(/^- 状态：\s*(.+)$/m)?.[1]
      ?? body.match(/^- \*\*Status:\*\*\s*(.+)$/m)?.[1]
      ?? body.match(/^\*\*Status:\*\*\s*(.+)$/m)?.[1]
      ?? body.match(/^Status:\s*(.+)$/m)?.[1]
      ?? "未标注";
    assert.equal(entry.status, status.trim(), entry.file);
    const reportLink = body.match(/^- .*\[[^\]]+]\(\.\.\/\.\.\/reports\/adversarial-review\/([a-z0-9-]+\.md)\)$/m);
    if (reportLink) {
      assert.equal(reportLink[1], entry.file, `task/report slug mismatch: ${entry.file}`);
      assert.ok(reports.has(reportLink[1]), `missing report: ${reportLink[1]}`);
      linkedReports.add(reportLink[1]);
    }
  }

  assert.deepEqual([...linkedReports].sort(), [...reports.keys()].sort());
  for (const [reportFile, report] of reports) {
    const taskFile = report.match(/^task:\s*([a-z0-9-]+)$/m)?.[1]?.concat(".md")
      ?? report.match(/^- Task: \[[^\]]+]\(\.\.\/\.\.\/tasks\/todo\/([a-z0-9-]+\.md)\)/m)?.[1];
    assert.ok(taskFile, `missing task link: ${reportFile}`);
    assert.equal(taskFile, reportFile, `report/task slug mismatch: ${reportFile}`);
    assert.ok(tasks.has(taskFile), `missing task: ${taskFile}`);
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

test("default agent instructions route workspace records to isolated workflow skills", () => {
  const rules = readFileSync(path.join(root, "references", "agents.md"), "utf8");
  const expected = {
    "workspace-maintain-context": "tasks/context.md",
    "workspace-manage-task": "tasks/todo.md",
    "workspace-capture-lessons": "tasks/lessons.md",
  };

  for (const [name, ownedPath] of Object.entries(expected)) {
    const skillDir = path.join(workflowDir, name);
    assert.deepEqual(readdirSync(skillDir).sort(), ["SKILL.md", "agents"]);
    assert.deepEqual(readdirSync(path.join(skillDir, "agents")), ["openai.yaml"]);
    const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    assert.match(skill, new RegExp(`^name: ${name}$`, "m"));
    assert.ok(skill.includes(ownedPath), `${name} missing owned path`);
    assert.equal(skill.includes("TODO"), false, `${name} contains scaffold text`);
    assert.ok(rules.includes(`$${name}`), `default instructions missing route: ${name}`);
  }

  assert.equal(rules.includes("tasks/context.md"), false);
  assert.equal(rules.includes("tasks/todo.md"), false);
  assert.equal(rules.includes("tasks/lessons.md"), false);
  assert.match(rules, /Before non-trivial work and after a user correction, use `\$workspace-capture-lessons`/);
});

test("workspace task contract keeps implementation and review out of acceptance", () => {
  const skill = readFileSync(path.join(workflowDir, "workspace-manage-task", "SKILL.md"), "utf8");

  for (const section of ["Scope", "Target", "Plan", "Checklist"]) {
    assert.ok(skill.includes(`### ${section}`), `missing task section: ${section}`);
  }
  assert.match(skill, /Do not prescribe algorithms, files, functions, types, or call paths/);
  assert.match(skill, /Do not include review status/);
  assert.match(skill, /Invoke `\$adversarial-review`/);

  for (const status of ["Pending", "In Progress", "In Review", "Completed", "Blocked"]) {
    assert.ok(skill.includes(`\`${status}\``), `missing task status: ${status}`);
  }
  assert.match(skill, /Status \(YYYY-MM-DD HH:MM\)/);
  assert.match(skill, /current local date and 24-hour time/);
  assert.match(skill, /complete status text, including the minute-level timestamp, identical/);
  assert.match(skill, /do not bulk-rewrite untouched historical entries/);
  for (const status of ["待执行", "进行中", "待审查", "已完成", "阻塞"]) {
    assert.equal(skill.includes(`\`${status}\``), false, `translated task status remains: ${status}`);
  }
});

test("workspace lesson contract keeps one confirmed current rule set", () => {
  const skill = readFileSync(path.join(workflowDir, "workspace-capture-lessons", "SKILL.md"), "utf8");

  for (const field of ["Trigger", "Rule", "Check"]) {
    assert.match(skill, new RegExp(`- \`${field}\`:`), `missing lesson field: ${field}`);
  }
  assert.match(skill, /Use only `Trigger`, `Rule`, and `Check`; omit narrative fields such as `Why`/);
  assert.match(skill, /Give each field at least one list item/);
  assert.match(skill, /Keep one condition, action, boundary, or check per list item/);
  assert.match(skill, /addition, update, replacement, deletion, or no change/);
  assert.match(skill, /current effective rule set, not an append-only record/);
  assert.match(skill, /new independent entry needs no second write confirmation/);
  assert.match(skill, /Before updating, merging, replacing, or deleting an existing entry, show the exact proposed change and ask the user for explicit write permission/);
  assert.match(skill, /If permission is not granted, leave `tasks\/lessons\.md` unchanged/);
  assert.match(skill, /Remove superseded or invalidated lessons instead of preserving them as history/);
  assert.match(skill, /Apply each relevant `Rule` and perform its `Check` when present/);
  assert.match(skill, /Do not bulk-migrate legacy entries/);
});

test("adversarial review report presents compact human-readable dialogue", () => {
  const contract = readFileSync(path.join(root, "skills", "adversarial-review", "references", "final-review-report.md"), "utf8");
  const report = readFileSync(path.join(reportDir, "optimize-workspace-capture-lessons.md"), "utf8");
  const cases = JSON.parse(readFileSync(path.join(root, "skills", "adversarial-review", "evals", "report_contract_cases.json"), "utf8"));

  for (const field of ["created", "task", "review_cycles"]) {
    assert.match(contract, new RegExp(`^${field}:`, "m"), `missing report metadata: ${field}`);
  }
  assert.match(contract, /preserve `created`/);
  assert.match(contract, /update `review_cycles` cumulatively/);
  assert.match(contract, /single viewpoint on the same line/);
  assert.match(contract, /multiple independent viewpoints, place list items below the label/);
  assert.match(contract, /Use one quote block and one `Conclusion` per topic/);

  const caseById = Object.fromEntries(cases.cases.map((item) => [item.id, item.expect]));
  assert.deepEqual(caseById["terminal-report-shape"].frontmatter, ["created", "review_cycles"]);
  assert.equal(caseById["terminal-report-shape"].decision_in_frontmatter, false);
  assert.equal(caseById["material-discussion-only"].dialogue_uses_one_quote_block, true);
  assert.equal(caseById["material-discussion-only"].multiple_viewpoints_use_list, true);
  assert.equal(caseById["clean-approval"].invented_discussion, false);
  assert.equal(caseById["approval-invalidated"].created_preserved, true);
  assert.equal(caseById["approval-invalidated"].review_cycles_updated_cumulatively, true);
  assert.equal(caseById["no-owning-task"].frontmatter_task_omitted, true);

  validateReviewReport(report, {
    task: "optimize-workspace-capture-lessons",
    cycles: 3,
    dialogue: [["E1", "R1", "E2", "R2", "E3", "R3"]],
  });

  validateReviewReport(`---
created: 2026-07-21
review_cycles: 1
---

# Clean review

No material discussion occurred.

---

**Final decision:** \`APPROVED\`

**Outcome:** The artifact satisfies the request.

**Remaining:** \`none\`
`, { cycles: 1 });

  validateReviewReport(`---
created: 2026-07-21
task: sample-task
review_cycles: 1
---

# Multi-viewpoint review

Topic: Boundary coverage

> **E1:**
>
> - Added the required metadata.
> - Kept the final decision in the body.
>
> **R1:** The format satisfies the contract.

**Conclusion:** The report is complete.

---

**Final decision:** \`APPROVED\`

**Outcome:** The format is readable.

**Remaining:** \`none\`
`, { task: "sample-task", cycles: 1, dialogue: [["E1", "R1"]] });
});
