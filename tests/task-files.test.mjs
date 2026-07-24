import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
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

test("default agent instructions explain workspace records and route work to workflow skills", () => {
  const rules = readFileSync(path.join(root, "super-agent", "AGENTS.md"), "utf8");
  const expected = {
    "workspace-maintain-context": "tasks/context.md",
    "workspace-manage-task": "tasks/todo.md",
    "workspace-capture-lessons": "tasks/lessons.md",
  };

  for (const [name, ownedPath] of Object.entries(expected)) {
    const skillDir = path.join(workflowDir, name);
    const evaluatedSkill = ["workspace-maintain-context", "workspace-manage-task"].includes(name);
    assert.deepEqual(readdirSync(skillDir).sort(), evaluatedSkill ? ["SKILL.md", "agents", "evals"] : ["SKILL.md", "agents"]);
    assert.deepEqual(readdirSync(path.join(skillDir, "agents")).sort(), evaluatedSkill ? ["interface.yaml", "openai.yaml"] : ["openai.yaml"]);
    const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    assert.match(skill, new RegExp(`^name: ${name}$`, "m"));
    assert.ok(skill.includes(ownedPath), `${name} missing owned path`);
    assert.equal(skill.includes("TODO"), false, `${name} contains scaffold text`);
    assert.ok(rules.includes(`$${name}`), `default instructions missing route: ${name}`);
    assert.ok(rules.includes(ownedPath), `default instructions missing mechanism path: ${ownedPath}`);
  }

  assert.match(rules, /load `\$workspace-maintain-context` and follow its `SKILL\.md` before acting/);
  assert.match(rules, /load `\$workspace-manage-task` and follow its `SKILL\.md` before execution/);
  assert.match(rules, /load `\$workspace-capture-lessons` and follow its `SKILL\.md` before continuing/);
  assert.match(rules, /Do not wait for the user to request/);
});

test("injected workspace workflow gates define proactive execution order", () => {
  const gates = readFileSync(path.join(root, "super-agent", "workspace-workflow-gates.md"), "utf8");
  const order = [
    "$workspace-maintain-context.",
    "$workspace-capture-lessons.",
    "$workspace-manage-task.",
    "$workspace-capture-lessons before continuing.",
    "$workspace-maintain-context if durable facts changed.",
  ];

  let previous = -1;
  for (const step of order) {
    const current = gates.indexOf(step, previous + 1);
    assert.ok(current > previous, `missing or out-of-order lifecycle step: ${step}`);
    previous = current;
  }

  assert.match(gates, /load and follow the matching skill SKILL\.md before the next action/);
  assert.match(gates, /This file selects the workflow; each skill owns its current execution contract/);
  assert.equal(gates.includes("ask permission before modifying existing entries"), false);
});

test("workspace context contract keeps only durable decision value", () => {
  const skill = readFileSync(path.join(workflowDir, "workspace-maintain-context", "SKILL.md"), "utf8");

  for (const section of ["Purpose", "Workflow", "Admission Gate", "Store", "Route Elsewhere", "Entry Contract", "Mutable Information", "Temporary Unrouted Facts", "Maintenance", "Maintainer Validation"]) {
    assert.ok(skill.includes(`## ${section}`), `missing context section: ${section}`);
  }

  assert.match(skill, /Confirmed.*Project-specific.*Stable boundary.*Decision-changing.*Summary-efficient.*Correctly routed.*Verifiable/s);
  assert.match(skill, /Treat discoverability only as a cost signal/);
  assert.match(skill, /Fact — decision effect — authoritative source \/ concrete review trigger/);
  assert.match(skill, /Verification and observability boundaries/);
  assert.match(skill, /sourced non-goals, and negative knowledge/);
  assert.match(skill, /Never cache a mutable current value/);
  assert.match(skill, /A stable lookup does not qualify by itself/);
  assert.match(skill, /Exclude an obvious version or configuration pointer/);
  assert.match(skill, /the current task ends/);
  assert.match(skill, /the related module next changes materially/);
  assert.match(skill, /evidence, source, assumption, or authority becomes invalid/);
  assert.match(skill, /At that event, choose exactly one outcome:[\s\S]*promote it to a normal context entry[\s\S]*move the required rationale, procedure, rule, or contract to its authoritative carrier[\s\S]*delete it when it is false, unverifiable, redundant, or no longer decision-changing/);
  assert.match(skill, /Before ending, update, migrate, or remove affected entries in the same work/);
  assert.match(skill, /Update or delete an entry in the same work that changes its conclusion/);
  assert.match(skill, /The only acceptable non-blocking failure is Yao `Estimated initial-load tokens exceed budget`/);
  assert.equal(skill.includes("Workspace-level decisions and conventions"), false);
});

test("workspace context value cases enforce admission and temporary exits", () => {
  const fixture = JSON.parse(readFileSync(path.join(workflowDir, "workspace-maintain-context", "evals", "context_value_cases.json"), "utf8"));
  const requiredExits = new Set(["task-end", "next-module-change", "evidence-invalid"]);
  const outcomes = new Set();

  for (const item of fixture.cases) {
    const durable = item.stable || item.mutable_current_value
      && item.stable_decision_boundary
      && item.high_consequence
      && item.review_trigger
      && !item.stores_live_value;
    const verified = item.authoritative_source || item.temporary && item.temporary_evidence;
    const temporaryLifecycle = !item.temporary || item.responsible_role_or_module
      && [...requiredExits].every((event) => item.exit_events.includes(event));
    const store = item.confirmed
      && item.project_specific
      && durable
      && item.decision_changing
      && item.summary_efficient
      && item.correctly_routed
      && verified
      && temporaryLifecycle;
    const actual = store ? "Store" : "Exclude";
    assert.equal(actual, item.expected, item.id);
    outcomes.add(actual);
  }

  assert.deepEqual([...outcomes].sort(), ["Exclude", "Store"]);
  const byId = Object.fromEntries(fixture.cases.map((item) => [item.id, item]));
  assert.equal(byId["live-feature-flag"].expected, "Exclude");
  assert.equal(byId["mutable-environment-boundary"].expected, "Store");
  assert.equal(byId["normal-without-authoritative-source"].expected, "Exclude");
  assert.equal(byId["temporary-without-exit"].expected, "Exclude");
  assert.equal(byId["temporary-with-event-exits"].authoritative_source, false);
  assert.equal(byId["temporary-with-event-exits"].temporary_evidence, true);
  assert.equal(byId["temporary-with-event-exits"].responsible_role_or_module, true);
  assert.equal(byId["temporary-with-event-exits"].expected, "Store");
});

test("workspace task contract keeps implementation and review out of acceptance", () => {
  const skillDir = path.join(workflowDir, "workspace-manage-task");
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");

  for (const section of ["Scope", "Target", "Plan", "Result"]) {
    assert.ok(skill.includes(`### ${section}`), `missing task section: ${section}`);
  }
  for (const section of ["Activation Boundary", "Record Ownership", "Task Contract", "Subtasks", "Review Gate", "Lifecycle", "Adoption", "Maintainer Validation"]) {
    assert.ok(skill.includes(`## ${section}`), `missing inline workflow section: ${section}`);
  }
  assert.equal(existsSync(path.join(skillDir, "references")), false, "task contract must remain inline");
  assert.equal(skill.includes("### Checklist"), false);
  assert.match(skill, /Do not prescribe algorithms, files, functions, types, or call paths/);
  assert.match(skill, /Do not include implementation steps, commands, shared workflow gates, or review status/);
  assert.match(skill, /Required = Explicit OR Critical OR \(Complex AND Verification Gap\)/);
  assert.match(skill, /Review gate: Required/);
  assert.match(skill, /Review gate: Skipped/);
  assert.match(skill, /For `Required`.*invoke `\$adversarial-review`/);
  assert.match(skill, /For `Skipped`, do not enter `In Review`/);
  assert.match(skill, /Re-evaluate whenever scope, risk, or verification evidence changes/);
  assert.match(skill, /Multiple items within one category still count as one category/);
  assert.match(skill, /Never require review outside the formula/);
  assert.equal(/Escalate if/.test(skill), false);

  assert.match(skill, /Skip task records for read-only answers and simple operations with direct deterministic verification/);
  assert.match(skill, /Modify only the owning task file and its exact index entry/);
  assert.match(skill, /Check a Target only when its current evidence is recorded under the same ID in `Result`/);
  assert.match(skill, /Add `Block` only while the task status is `Blocked`/);
  assert.match(skill, /Remove the section when work resumes/);
  assert.match(skill, /Create a separate canonical task only for work with an independent deliverable, blocking condition, or review boundary/);
  assert.match(skill, /small follow-up that extends a completed task's existing outcome.*reopen its canonical task instead of creating a new file.*append the next Target ID.*re-evaluate the Review Gate/);
  assert.match(skill, /treat the canonical task as authoritative and repair the index/);
  assert.match(skill, /Apply this contract to new tasks and reopened scope/);
  assert.match(skill, /Do not retrofit untouched completed history/);
  assert.match(skill, /only acceptable non-blocking failure is Yao `Estimated initial-load tokens exceed budget` against its 1000-token initial-load budget/);
  assert.match(skill, /Syntax\/frontmatter, lint, governance, every other resource-boundary check, applicable routing evaluation, OpenAI validation, and tests remain blocking/);
  assert.match(skill, /Never delete, distort, or split core operational guidance merely to satisfy the initial-load budget/);

  for (const status of ["Pending", "In Progress", "In Review", "Completed", "Blocked"]) {
    assert.ok(skill.includes(`\`${status}\``), `missing task status: ${status}`);
  }
  assert.match(skill, /Status \(YYYY-MM-DD HH:MM\)/);
  assert.match(skill, /current local date and 24-hour time/);
  for (const status of ["待执行", "进行中", "待审查", "已完成", "阻塞"]) {
    assert.equal(skill.includes(`\`${status}\``), false, `translated task status remains: ${status}`);
  }
});

test("workspace review-gate cases follow the binary formula", () => {
  const fixture = JSON.parse(readFileSync(path.join(workflowDir, "workspace-manage-task", "evals", "review_gate_cases.json"), "utf8"));
  const outcomes = new Set();
  const expectedCategories = new Set(["integration-surface", "state-change", "competing-constraints", "non-local-effects", "correctness-ambiguity"]);

  for (const item of fixture.cases) {
    assert.equal(new Set(item.complexity_categories).size, item.complexity_categories.length, `${item.id}: duplicate category`);
    assert.ok(item.complexity_categories.every((category) => expectedCategories.has(category)), `${item.id}: unknown category`);
    const complex = new Set(item.complexity_categories).size >= 2;
    const required = item.explicit || item.critical || complex && item.verification_gap;
    const actual = required ? "Required" : "Skipped";
    assert.equal(actual, item.expected, item.id);
    outcomes.add(actual);
  }

  assert.deepEqual([...outcomes].sort(), ["Required", "Skipped"]);
  const byId = Object.fromEntries(fixture.cases.map((item) => [item.id, item]));
  assert.equal(byId["gap-only"].expected, "Skipped");
  assert.equal(byId["one-category-gap"].expected, "Skipped");
  assert.equal(byId["multi-category-gap"].complexity_categories.length, 2);
  assert.equal(byId["multi-category-gap"].verification_gap, true);
  assert.equal(byId["multi-category-gap"].expected, "Required");
  assert.ok(byId["multi-category-no-gap"].complexity_categories.length >= 2);
  assert.equal(byId["multi-category-no-gap"].verification_gap, false);
  assert.equal(byId["multi-category-no-gap"].expected, "Skipped");
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
