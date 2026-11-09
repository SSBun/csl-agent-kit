import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const taskDir = path.join(root, "tasks", "tasks");
const artifactDir = path.join(root, "tasks", "artifacts");
const skillsDir = path.join(root, "skills");
const cslTasksDir = path.join(root, "skills", "meta");
const cslTasksSharedDir = path.join(cslTasksDir, "csl-tasks", "shared");
const require = createRequire(import.meta.url);
const { checkTaskIndex } = require(path.join(cslTasksSharedDir, "lib", "task-core.js"));

function readMarkdown(dir) {
  return new Map(readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => [file, readFileSync(path.join(dir, file), "utf8")]));
}

function readReviewReports(dir) {
  const reports = new Map();
  for (const taskId of readdirSync(dir)) {
    const report = path.join(dir, taskId, "reports", "adversarial-review.md");
    if (existsSync(report)) reports.set(taskId, readFileSync(report, "utf8"));
  }
  return reports;
}

function writeTaskIndexFixture(t, { entry, status = "Status: In Progress (2026-07-29 13:43)", legacyEntry = "" }) {
  const workspace = mkdtempSync(path.join(os.tmpdir(), "task-index-"));
  const recordsDir = path.join(workspace, "tasks", "tasks");
  const taskFile = path.join(recordsDir, "task-a.md");
  mkdirSync(recordsDir, { recursive: true });
  writeFileSync(taskFile, `# 任务 A\n\n${status}\n`, "utf8");
  writeFileSync(path.join(workspace, "tasks", "tasks.md"), `# 任务索引\n\n${entry}${legacyEntry ? `\n${legacyEntry}` : ""}\n`, "utf8");
  t.after(() => rmSync(workspace, { recursive: true, force: true }));
  return { workspace, taskFile };
}

function validateReviewReport(markdown, { task, cycles, dialogue = [] } = {}) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n\n([\s\S]+)$/);
  assert.ok(match, "missing report frontmatter");

  const metadata = Object.fromEntries(match[1].split("\n").map((line) => line.split(/:\s+/, 2)));
  assert.deepEqual(Object.keys(metadata).sort(), ["created", "review_cycles", "task"]);
  assert.match(metadata.created, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(Number.isInteger(Number(metadata.review_cycles)) && Number(metadata.review_cycles) > 0);
  if (cycles !== undefined) assert.equal(Number(metadata.review_cycles), cycles);
  assert.equal(metadata.task, task);

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
    const current = line.match(/^- \[(.+)]\(tasks\/([a-z0-9-]+\.md)\) — (.+)$/);
    if (current) return { title: current[1], file: current[2], status: current[3] };

    const historical = line.match(/^- (.+) — (Status \(\d{4}-\d{2}-\d{2} \d{2}:\d{2}\): (?:Pending|In Progress|In Review|Completed|Blocked)) — \[[^\]]+]\(tasks\/([a-z0-9-]+\.md)\)$/);
    assert.ok(historical, `invalid task index entry: ${line}`);
    return { title: historical[1], status: historical[2], file: historical[3] };
  });
  const linkedReports = new Set();

  assert.equal(index.startsWith("# 任务索引\n\n"), true);
  assert.equal(new Set(entries.map(({ file }) => file)).size, entries.length);
  assert.deepEqual(entries.map(({ file }) => file).sort(), [...tasks.keys()].sort());

  for (const entry of entries) {
    const body = tasks.get(entry.file);
    assert.equal(body.match(/^# (.+)$/m)?.[1], entry.title, entry.file);
    const status = body.match(/^(Status \(\d{4}-\d{2}-\d{2} \d{2}:\d{2}\): (?:Pending|In Progress|In Review|Completed|Blocked))$/m)?.[1]
      ?? body.match(/^状态：\s*(.+)$/m)?.[1]
      ?? body.match(/^- 状态：\s*(.+)$/m)?.[1]
      ?? body.match(/^- \*\*Status:\*\*\s*(.+)$/m)?.[1]
      ?? body.match(/^\*\*Status:\*\*\s*(.+)$/m)?.[1]
      ?? body.match(/^Status:\s*(.+)$/m)?.[1]
      ?? body.match(/^\| Status \| (.+) \|$/m)?.[1]
      ?? "未标注";
    assert.equal(entry.status, status.trim(), entry.file);
    const reportLink = body.match(/^- .*\[[^\]]+]\(\.\.\/artifacts\/([a-z0-9-]+)\/reports\/adversarial-review\.md\)$/m);
    if (reportLink) {
      assert.equal(`${reportLink[1]}.md`, entry.file, `task/report slug mismatch: ${entry.file}`);
      assert.ok(reports.has(reportLink[1]), `missing report: ${reportLink[1]}`);
      linkedReports.add(reportLink[1]);
    }
  }

  assert.deepEqual([...linkedReports].sort(), [...reports.keys()].sort());
  for (const [taskId, report] of reports) {
    const taskFile = report.match(/^task:\s*([a-z0-9-]+)$/m)?.[1]?.concat(".md")
      ?? report.match(/^- Task: \[[^\]]+]\(\.\.\/\.\.\/\.\.\/tasks\/([a-z0-9-]+\.md)\)/m)?.[1];
    assert.ok(taskFile, `missing task link: ${taskId}`);
    assert.equal(taskFile, `${taskId}.md`, `report/task slug mismatch: ${taskId}`);
    assert.ok(tasks.has(taskFile), `missing task: ${taskFile}`);
  }
}

test("task index and review reports resolve to isolated same-slug files", () => {
  validateTaskGraph(
    readFileSync(path.join(root, "tasks", "tasks.md"), "utf8"),
    readMarkdown(taskDir),
    readReviewReports(artifactDir),
  );
});

test("task index checker accepts the current format without migrating legacy siblings", (t) => {
  const fixture = writeTaskIndexFixture(t, {
    entry: "- [任务 A](tasks/task-a.md) — In Progress (2026-07-29 13:43)",
    legacyEntry: "- 旧任务 — Status (2026-07-01 09:00): Completed — [任务记录](tasks/legacy-task.md)",
  });
  assert.doesNotThrow(() => checkTaskIndex(fixture.workspace, "task-a"));
});

test("task index checker rejects incompatible paths and canonical mismatches", (t) => {
  const cases = [
    "- 任务 A — Status (2026-07-29 13:43): In Progress — [任务记录](tasks/task-a.md)",
    "- [任务 A](tasks/task-a.md) — Completed (2026-07-29 13:43)",
    "- [任务 B](tasks/task-a.md) — In Progress (2026-07-29 13:43)",
    "- [任务 A](tasks/task-a.md) — In Progress (2026-07-29 25:61)",
  ];

  for (const entry of cases) {
    const fixture = writeTaskIndexFixture(t, { entry });
    assert.throws(() => checkTaskIndex(fixture.workspace, "task-a"));
  }
});

test("task links to deleted reports fail validation", () => {
  const index = "# 任务索引\n\n- [任务 A](tasks/task-a.md) — 进行中\n";
  const tasks = new Map([["task-a.md", "# 任务 A\n\n状态：进行中\n\n- Report: [Adversarial review report](../artifacts/task-a/reports/adversarial-review.md)\n"]]);
  assert.throws(() => validateTaskGraph(index, tasks, new Map()), /missing report: task-a/);
});

test("cross-linked task and report slugs fail validation", () => {
  const index = "# 任务索引\n\n- [任务 A](tasks/task-a.md) — 进行中\n";
  const tasks = new Map([["task-a.md", "# 任务 A\n\n状态：进行中\n\n- Report: [Adversarial review report](../artifacts/report-b/reports/adversarial-review.md)\n"]]);
  const reports = new Map([["report-b", "# Review\n\n- Task: [tasks/tasks/task-a.md](../../../tasks/task-a.md) — 任务 A\n"]]);
  assert.throws(() => validateTaskGraph(index, tasks, reports), /task\/report slug mismatch: task-a\.md/);
});

test("task artifact producers use stable task-owned paths", () => {
  const task = readFileSync(path.join(root, "skills", "meta", "task", "SKILL.md"), "utf8");
  const taskPlan = readFileSync(path.join(root, "skills", "meta", "task-plan", "SKILL.md"), "utf8");
  const brainstorming = readFileSync(path.join(root, "skills", "dev", "brainstorming", "SKILL.md"), "utf8");
  const deliberate = readFileSync(path.join(root, "skills", "dev", "deliberate", "SKILL.md"), "utf8");
  const review = readFileSync(path.join(root, "skills", "dev", "adversarial-review", "references", "final-review-report.md"), "utf8");

  assert.match(task, /tasks\/artifacts\/<task-id>\/<category>\/<name>/);
  for (const category of ["discussions", "specs", "reports", "evidence"]) {
    assert.ok(task.includes("- `" + category + "`:"));
  }
  assert.match(taskPlan, /do not create a `tasks\/artifacts\/` file merely to mirror/);
  assert.match(brainstorming, /tasks\/artifacts\/<task-id>\/specs\/YYYY-MM-DD-<topic>-design\.md/);
  assert.equal(brainstorming.includes("tasks/plans/"), false);
  assert.match(deliberate, /tasks\/artifacts\/<task-id>\/discussions\//);
  assert.equal(deliberate.includes("tasks/thinking/"), false);
  assert.match(review, /tasks\/artifacts\/<task-id>\/reports\/adversarial-review\.md/);
  assert.equal(review.includes("`reports/adversarial-review/"), false);
});

test("task workflow skills own canonical records and routes", () => {
  const contract = readFileSync(path.join(root, "skills", "meta", "agent-hooks", "references", "csl-agent-kit-contract.md"), "utf8");
  const expected = {
    "agent-memory": [path.join(cslTasksDir, "agent-memory"), ".csl-agent-kit/memory"],
    "task": [path.join(cslTasksDir, "task"), "tasks/tasks.md"],
  };

  for (const [name, [skillDir, ownedPath]] of Object.entries(expected)) {
    const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    assert.match(skill, new RegExp(`^name: ${name}$`, "m"));
    assert.ok(skill.includes(ownedPath), `${name} missing owned path`);
    assert.equal(skill.includes("TODO"), false, `${name} contains scaffold text`);
  }

  for (const name of ["task", "task-plan", "task-queue"]) {
    assert.ok(existsSync(path.join(cslTasksDir, name, "SKILL.md")), `missing ${name}`);
    assert.ok(contract.includes(`\`${name}\``), `contract missing route: ${name}`);
  }
  for (const name of ["csl-task", "csl-task-plan", "csl-task-auto"]) {
    assert.equal(existsSync(path.join(cslTasksDir, name)), false, `legacy skill still exists: ${name}`);
    assert.equal(contract.includes(`\`${name}\``), false, `legacy route still exists: ${name}`);
  }
  assert.equal(existsSync(path.join(skillsDir, "workspace-manage-task")), false);
  assert.equal(existsSync(path.join(skillsDir, "workspace-maintain-context")), false);
  assert.equal(existsSync(path.join(skillsDir, "workspace-context")), false);
  assert.equal(existsSync(path.join(skillsDir, "workspace-lessons")), false);

  assert.match(contract, /## Task-Family Routing/);
  assert.match(contract, /Use `task-plan` when the current outcome is an implementation-ready plan/);
  assert.match(contract, /standalone analysis whose findings are the requested deliverable/);
  assert.match(contract, /Use `task-queue` when the user wants multiple independently acceptable outcomes/);
  assert.match(contract, /Use `task` for one execution outcome/);
  assert.match(contract, /Complexity, step count, or file count alone does not make a Queue/);
  assert.doesNotMatch(contract, /TASK_GO|task_target_confirm/);

  const alignmentProtocolPath = path.join(cslTasksSharedDir, "protocols", "task-target-alignment.md");
  assert.ok(existsSync(alignmentProtocolPath), "missing shared Task Target alignment protocol");
  const alignmentProtocol = readFileSync(alignmentProtocolPath, "utf8");
  assert.doesNotMatch(alignmentProtocol, /^---/);
  assert.match(alignmentProtocol, /sole detailed authority for Task Target readiness, Authorization Ledger construction, semantic equivalence, L0-L4 guard levels/);
  assert.doesNotMatch(alignmentProtocol, /TASK_GO/);
  assert.match(alignmentProtocol, /Current user authorization consists only of/);
  assert.match(alignmentProtocol, /Authorization Ledger/);
  for (const relation of ["preserve", "add", "omit", "weaken", "change", "unknown"]) assert.match(alignmentProtocol, new RegExp("`" + relation + "`"));
  assert.match(alignmentProtocol, /If the candidate can be satisfied while current authorization remains unsatisfied/);
  assert.match(alignmentProtocol, /If the user can accept current authorization yet reasonably reject the candidate/);
  for (const level of ["L0", "L1", "L2", "L3", "L4"]) assert.match(alignmentProtocol, new RegExp(`\\| ${level} \\|`));
  assert.match(alignmentProtocol, /L2 is valid only when all of these hold/);
  assert.match(alignmentProtocol, /missingAuthorizedAtoms = \[\]/);
  assert.match(alignmentProtocol, /untraceableCandidateAtoms = \[\]/);
  assert.match(alignmentProtocol, /Compact Decision Packet/);
  assert.match(alignmentProtocol, /^\*\*Task Target\*\*$/m);
  assert.match(alignmentProtocol, /^- \*\*Outcome:\*\*/m);
  assert.match(alignmentProtocol, /^- \*\*Done when:\*\*/m);
  assert.match(alignmentProtocol, /^- \*\*Boundaries:\*\*/m);
  assert.match(alignmentProtocol, /Interaction Owner and Delegated Execution/);
  assert.match(alignmentProtocol, /Only that main session may render user-facing L0-L4 interactions or an S1 Safety Confirmation/);
  assert.match(alignmentProtocol, /Changing from `task-plan` to `task` does not itself create a new Target/);
  assert.match(alignmentProtocol, /Planning-phase acceptance aligns the Target but never authorizes execution/);
  assert.match(alignmentProtocol, /use `continue_delegated` without rendering a Task Target/);
  assert.match(alignmentProtocol, /use `return_to_main`/);
  assert.match(alignmentProtocol, /adding, removing, or reordering a child/);
  assert.match(alignmentProtocol, /Files, functions, algorithms, commands, and verification methods within one unchanged child node/);
  assert.match(alignmentProtocol, /L2 Checkpoint/);
  assert.match(alignmentProtocol, /I will begin substantive work only after confirmation/);
  assert.match(alignmentProtocol, /Changes requiring approval/);
  assert.match(alignmentProtocol, /This Target changes your current authorization/);
  assert.match(alignmentProtocol, /Ask one focused question about the exact user-owned ambiguity/);
  assert.match(alignmentProtocol, /Every new or materially revised non-trivial equivalent Target owned by the main session outside the exploration exemption must pass one L2 checkpoint/);
  assert.match(alignmentProtocol, /### Authorization Sources and Goal Acceptance/);
  assert.match(alignmentProtocol, /`direct_user`/);
  assert.match(alignmentProtocol, /`accepted_target`/);
  assert.match(alignmentProtocol, /both the proposal and the user's acceptance/);
  assert.match(alignmentProtocol, /Wording, formatting, mechanical restatement, or generic low confidence alone cannot create a new commitment difference/);
  assert.match(alignmentProtocol, /Repository facts may establish what exists, but do not authorize what to change/);
  assert.match(alignmentProtocol, /independently accepted clauses must not be combined into an unapproved effect/);
  assert.match(alignmentProtocol, /changed objects\/environments, or expired conditions/);
  assert.match(alignmentProtocol, /`show_continue` is not a valid alignment action/);
  assert.match(alignmentProtocol, /Authorization coverage does not establish user goal acceptance/);
  assert.match(alignmentProtocol, /empty `confirmationItems`, and null `checkpointReason`/);
  for (const reason of ["goal_recheck", "user_requested", "plan_graph_change", "acceptance_unavailable", "trivial_display"]) assert.match(alignmentProtocol, new RegExp("`" + reason + "`"));
  assert.match(alignmentProtocol, /Preserve all inherited constraints in the displayed Target/);
  assert.match(alignmentProtocol, /`authorizedClauses`/);
  assert.match(alignmentProtocol, /These lists may overlap/);
  assert.match(alignmentProtocol, /accepted_target` evidence for every clause/);
  assert.match(alignmentProtocol, /An answer to a local clarification is not acceptance of an undisplayed whole Target/);
  assert.match(alignmentProtocol, /confirm, but/);
  assert.match(alignmentProtocol, /Do not continue source inspection, research, planning, delegation or editing while waiting/);
  assert.match(alignmentProtocol, /only the currently displayed L2 or L4 check that is waiting for a reply/);
  assert.match(alignmentProtocol, /delegated children covered by its current Plan also inherit that acceptance/);
  assert.match(alignmentProtocol, /A delegated child reaching that boundary returns to the main session/);
  assert.match(alignmentProtocol, /trimmed content is exactly `1` or case-insensitively equals `y`/);
  assert.match(alignmentProtocol, /S0 NONE/);
  assert.match(alignmentProtocol, /S1 REQUIRED/);
  assert.match(alignmentProtocol, /\*\*Safety Confirmation\*\*/);
  assert.match(alignmentProtocol, /does not persist guard levels or acceptance/);
  assert.match(alignmentProtocol, /End the turn and wait/);
  assert.doesNotMatch(alignmentProtocol, /If all commitments are settled, use `show_continue`|render the complete Target without a confirmation footer and continue immediately/);
  assert.doesNotMatch(alignmentProtocol, /task_target_confirm/);

  for (const name of ["task", "task-plan", "task-queue"]) {
    const skill = readFileSync(path.join(cslTasksDir, name, "SKILL.md"), "utf8");
    assert.ok(skill.includes("csl-tasks/shared/protocols/task-target-alignment.md"), `${name} missing shared protocol reference`);
    assert.match(skill, /Before forming, presenting, or accepting a Task Target, read/);
    assert.match(skill, /stop before substantive work and report the missing runtime dependency/);
    assert.match(skill, /The shared protocol owns all Task Target alignment semantics/);
    assert.doesNotMatch(skill, /It presents every ready Target/);
    assert.doesNotMatch(skill, /mandatory non-trivial presentation/);
    assert.doesNotMatch(skill, /TASK_GO/);
    assert.doesNotMatch(skill, /state one line in the exact format `\*\*Task Target:\*\*/);
    assert.doesNotMatch(skill, /task_target_confirm/);
  }
  const taskSkill = readFileSync(path.join(cslTasksDir, "task", "SKILL.md"), "utf8");
  const planSkill = readFileSync(path.join(cslTasksDir, "task-plan", "SKILL.md"), "utf8");
  const queueSkill = readFileSync(path.join(cslTasksDir, "task-queue", "SKILL.md"), "utf8");
  assert.match(taskSkill, /single-outcome Target meaning/);
  assert.match(taskSkill, /delegated child must use the existing owning task named by the main session's current delegation packet/);
  assert.match(taskSkill, /resume that plan's exact record/);
  assert.match(taskSkill, /explicit request to execute is execution authorization, not a new Target by itself/);
  assert.match(planSkill, /planned-task Target meaning/);
  assert.match(planSkill, /accepting it does not authorize execution/);
  assert.match(planSkill, /planning-only task-record writes do not trigger the deliverable-change review loop/);
  assert.match(planSkill, /inherits that acceptance and does not present another checkpoint/);
  assert.match(queueSkill, /integration Target meaning/);
  assert.match(queueSkill, /mandatory `task-review` loop for R2 or explicit ordinary review/);
  assert.match(queueSkill, /No parent-owned deliverable changes is R0/);
  assert.match(queueSkill, /R0\/R1 use `skipped` only without explicit or existing review obligations/);
  assert.match(queueSkill, /explicitly requested adversarial review of a no-file parent/);
  assert.match(queueSkill, /without mandatory `task-review`/);
  const parentFinalGate = queueSkill.split("## Parent Final Gate")[1];
  assert.match(parentFinalGate, /After the final review-gate write/);
  assert.match(parentFinalGate, /Every review-gate write clears prior Verification/);
  assert.match(parentFinalGate, /confirm any reviewed scope still matches the assembled deliverable/);
  assert.match(parentFinalGate, /failed verification Blocks completion/);
  const finalVerify = parentFinalGate.indexOf("`verify <parent-id> passed --evidence <observation>`");
  const completeParent = parentFinalGate.indexOf("`complete <parent-id>`");
  assert.ok(finalVerify !== -1 && finalVerify < completeParent, "parent verification must follow the final review gate and precede completion");
  assert.match(queueSkill, /Reopening a completed child requires an active parent/);
  assert.match(queueSkill, /invalidates the active parent's assessment, terminal review and Verification evidence/);
  assert.match(queueSkill, /stall guard independently to each child and to any parent-owned deliverable review/);
  assert.match(queueSkill, /A stalled child or parent becomes Blocked/);
  assert.match(queueSkill, /parent, child, and sibling titles in one Queue must not normalize to the same text/);
  assert.match(queueSkill, /do not display another child checkpoint/);
  assert.match(queueSkill, /material child-distribution graph change/);
  assert.match(contract, /applying sources, conditions and reusable experience/);
  assert.match(contract, /Classify the actual result under the shared Task Review Grading protocol before choosing a completion gate/);
  assert.match(contract, /R2 covers complex, high-risk or materially uncertain changes and requires `task-review`/);
  assert.match(contract, /Independent adversarial review, a two-Agent Reviewer–Editor loop and independent approval remain separate and require an explicit user request/);
  assert.equal(contract.includes("applicable task requirement"), false);

  const projectRules = readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(projectRules, /After modifying any \*\*skill package\*\* under `skills\/` or `\.agents\/skills\/`/);
  assert.match(projectRules, /node skills\/meta\/skill-quality\/scripts\/check\.js <skill-dir>/);
  assert.match(projectRules, /Run `adversarial-review` or request human review only when the user explicitly asks/);
  assert.match(projectRules, /high risk alone does not trigger it/);

  const reviewSkill = readFileSync(path.join(root, "skills", "dev", "adversarial-review", "SKILL.md"), "utf8");
  assert.match(reviewSkill, /Use only when the user explicitly requests adversarial review/);
  assert.match(reviewSkill, /Enter only from an explicit user request/);
  assert.match(reviewSkill, /start only after its mandatory one-pass `task-review` is recorded as `Passed`/);
  assert.match(reviewSkill, /replace its `Passed` gate with `Approved` evidence/);
  assert.equal(reviewSkill.includes("applicable requirement mandates"), false);
});

test("injected CSL Agent Kit contract defines behavior without runtime mechanics", () => {
  const contract = readFileSync(path.join(root, "skills", "meta", "agent-hooks", "references", "csl-agent-kit-contract.md"), "utf8");
  const task = readFileSync(path.join(cslTasksDir, "task", "SKILL.md"), "utf8");
  const grading = readFileSync(path.join(cslTasksDir, "csl-tasks", "shared", "protocols", "task-review-grading.md"), "utf8");
  assert.equal(existsSync(path.join(root, "super-agent")), false);
  assert.ok(existsSync(path.join(root, "skills", "meta", "agent-hooks", "hooks", "csl-agent-kit-contract.md")));
  assert.equal(existsSync(path.join(root, "skills", "meta", "agent-hooks", "hooks", "workspace-workflow-gates.md")), false);
  const order = [
    "1. **Orient**",
    "2. **Align**",
    "3. **Prepare**",
    "4. **Execute**",
    "5. **Verify**",
    "6. **Review**",
  ];

  let previous = -1;
  for (const step of order) {
    const current = contract.indexOf(step, previous + 1);
    assert.ok(current > previous, `missing or out-of-order behavior step: ${step}`);
    previous = current;
  }

  assert.match(contract, /^CSL AGENT KIT CONTRACT ACTIVE/);
  assert.match(contract, /# CSL Agent Kit Task Workflow Contract/);
  assert.match(contract, /owns only stable task-family routing and cross-workflow gates/);
  assert.doesNotMatch(contract, /Persistence and Priority|AGENTS\.md/);
  assert.doesNotMatch(contract, /## Task Workflow Adoption/);
  assert.match(contract, /Use Task workflows automatically for every eligible request/);
  assert.match(contract, /users should not need to know Skill names or internal lifecycle mechanics/);
  assert.match(contract, /Use Task Target to let the user recheck implementation goals before substantive work; exploration-only work proceeds without a generic Target confirmation/);
  assert.match(contract, /A clear request or complete authorization coverage is not user acceptance/);
  assert.match(contract, /end the turn and wait/);
  assert.match(contract, /do not narrate routine internal bookkeeping/);
  assert.match(contract, /## Task-Family Routing/);
  assert.match(contract, /Use `task-plan` when the current outcome is an implementation-ready plan/);
  assert.match(contract, /Use `task-queue` when the user wants multiple independently acceptable outcomes/);
  assert.match(contract, /Complexity, step count, or file count alone does not make a Queue/);
  assert.match(contract, /activate and focus its owning record before task-direct exploration or requested deliverable changes/);
  assert.match(contract, /Lifecycle writes needed for activation and alignment may happen first, but they never authorize execution/);
  assert.match(contract, /Apply the selected task-family Skill, including its required Task Target alignment gate/);
  assert.match(contract, /Only the main interaction owner handles user-facing alignment and independent safety gates/);
  assert.match(contract, /Do not repeat confirmation when the previously displayed Target has recoverable user acceptance/);
  assert.match(contract, /Delegated work covered by the current aligned Plan inherits its bounded scope/);
  assert.match(contract, /missing coverage, material changes, user decisions, or safety boundaries return to the main session/);
  assert.doesNotMatch(contract, /The Task Target states:|L0|L1|L2|L3|L4|Authorization Ledger|Changes requiring approval/);
  assert.match(contract, /At session start, resume or compaction, use the small user\/project indexes for orientation/);
  assert.match(contract, /After Task Target alignment, use ordinary file tools/);
  assert.match(contract, /Foreground Task Agents do not perform routine extraction or memory housekeeping/);
  assert.match(contract, /maintains both scopes without per-entry user approval/);
  assert.match(contract, /Ordinary Agent exit must not terminate the independent Memory service/);
  assert.match(contract, /Implement the minimum solution that fully satisfies the aligned outcome/);
  assert.match(contract, /Touch only what the aligned outcome requires/);
  assert.match(contract, /## Mandatory Modification Review/);
  assert.match(contract, /mark Required, enter In Review and dispatch one read-only `task-review` pass/);
  assert.match(contract, /The main Agent compares original requirements, effective revisions and accepted constraints/);
  assert.match(contract, /using an actual fresh subagent/);
  assert.match(contract, /Unavailable or failed mandatory review Blocks the task/);
  assert.match(contract, /Self-review cannot substitute or justify Passed/);
  assert.match(contract, /Bind assessment, self-check, review and final verification to actual content and evidence/);
  assert.match(contract, /a suspected false positive needs counterevidence checked by a fresh pass/);
  assert.match(contract, /Direct task specification edits require sync, which invalidates assessment, terminal review and Verification evidence/);
  assert.match(contract, /Any confirmed finding returns the task to In Progress for remediation/);
  assert.doesNotMatch(contract, /task-review-ledger\/v1|no-progress=|At two|Resume is rejected while any stalled item remains at two/);
  assert.match(task, /Duplicate Review sections, unknown ledger schemas, and ledger-like malformed content using alternate Markdown list markers or whitespace fail closed/);
  assert.match(task, /Give each Critical Finding, Concern, and Target-blocking Unverified Risk a stable/);
  assert.match(task, /When any item reaches `no-progress=2`, stop dispatching review passes/);
  assert.match(task, /Text churn, restatement, unchanged checks, or unsupported relabeling is not progress/);
  assert.match(task, /the core rejects resume while any ledger item remains at `no-progress=2`/);
  assert.match(contract, /stall guard stops further passes, Blocks with the stalled IDs and an observable unblock condition/);
  assert.match(contract, /Never disguise no progress, bypass the unblock condition or convert a stall to Passed/);
  assert.match(contract, /Those Skills own ledger schemas, counters, resolution and resume rules/);
  assert.match(contract, /The Reviewer is feedback-only: it never grants approval or changes task state/);
  assert.match(grading, /R0\/R1 may enter `required` → In Review → `approved` directly/);
  assert.match(grading, /R2 first completes mandatory `task-review`/);
  assert.match(contract, /Independent adversarial review, a two-Agent Reviewer–Editor loop and independent approval remain separate and require an explicit user request/);
  assert.match(contract, /Keep this contract behavioral and stable\. Skills retain operational detail\./);
  assert.doesNotMatch(contract, /\$(?:task|task-plan|task-queue|task-context|task-lessons)/);
  assert.doesNotMatch(contract, /Task Target Alignment Protocol/);
  assert.doesNotMatch(contract, /task_focus/);
  assert.doesNotMatch(contract, /tasks\/tasks/);
  assert.doesNotMatch(contract, /SKILL\.md/);
});

test("agent-memory replaces separate knowledge workflows with a file read/write contract", () => {
  const skill = readFileSync(path.join(cslTasksDir, "agent-memory", "SKILL.md"), "utf8");
  for (const name of ["task-context", "task-lessons"]) assert.equal(existsSync(path.join(cslTasksDir, name)), false);
  assert.match(skill, /Topics emerge from actual content, not a preset taxonomy/);
  assert.match(skill, /ordinary `read`, `grep` and `find`/);
  assert.match(skill, /No dedicated retrieval tool or running background service is required/);
  assert.match(skill, /user scope does not require per-change approval/);
  assert.match(skill, /at most 60 Unicode characters/);
  assert.match(skill, /summary`: at most 200/);
  assert.match(skill, /new ordinary writes over 8,000 are rejected/);
  assert.match(skill, /There is no total-file-count or total-knowledge quota/);
  assert.match(skill, /Legacy imports and exact historical restores preserve their contents/);
  assert.match(skill, /Historical pending proposals are not automatically approved by an upgrade/);
  assert.match(skill, /history and restoration|history, migration backups/);
  const bridge = readFileSync(path.join(root, "pi/lib/memory-bridge.ts"), "utf8");
  assert.match(bridge, /migration\.ensureWorkspace/);
  assert.match(bridge, /agent_settled/);
  assert.doesNotMatch(bridge, /不要自行修改用户级记忆或批准提案/);
});

test("task workflows use event logs without turning history into authorization or a resume cursor", () => {
  const task = readFileSync(path.join(cslTasksDir, "task", "SKILL.md"), "utf8");
  const plan = readFileSync(path.join(cslTasksDir, "task-plan", "SKILL.md"), "utf8");
  const queue = readFileSync(path.join(cslTasksDir, "task-queue", "SKILL.md"), "utf8");
  const log = task.split("### Execution Log\n")[1].split("\n### ")[0];
  assert.match(task, /Do not maintain the former `Current artifacts:`, `Next action:`, or `Required input:` recovery bullets/);
  assert.doesNotMatch(task, /keep a concise recovery note in this same section/);
  assert.match(task, /Plan, Decisions, Execution Log, Block/);
  assert.match(log, /Append promptly/);
  assert.match(log, /stable increasing ordinal/);
  assert.match(log, /unfinished or unknown outcome/);
  assert.match(log, /never private reasoning, role transcripts, secrets or full tool logs/);
  assert.match(log, /appending an explicit reference to its ordinal/);
  assert.match(log, /cannot amend requirements or grant authorization/);
  assert.match(log, /Unexpected interruption may prevent the latest event from being recorded/);
  assert.match(log, /recheck actual artifacts and relevant external state/);
  assert.match(log, /unknown external action outcome must be checked before retrying/);
  assert.match(log, /included in the review fingerprint/);
  assert.match(log, /no append-only bookkeeping exemption/);
  assert.match(log, /freeze the log with the reviewed scope/);
  assert.match(log, /not an Execution Log summary/);
  assert.match(log, /Missing logs remain valid for historical records/);
  for (const consumer of [plan, queue]) assert.match(consumer, /\[Task Execution Log\]\(\.\.\/task\/SKILL\.md#execution-log\)/);
  assert.match(plan, /Log planning events, not unperformed implementation/);
  assert.match(queue, /child discoveries, decisions and execution results stay in that child's log/);
  assert.match(queue, /Log order does not select a child or permit skipping a blocked one/);
});

test("CSL task contract keeps acceptance, evidence, and review gates explicit", () => {
  const skillDir = path.join(cslTasksDir, "task");
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");

  for (const section of ["Storage and Core", "Activation and Ownership", "Start or Resume", "Record Contract", "Completion", "Maintainer Validation"]) {
    assert.ok(skill.includes(`## ${section}`), `missing task section: ${section}`);
  }
  for (const section of ["Scope", "Target", "Plan", "Execution Log", "Result", "Review Assessment", "Review", "Review Reports", "Verification", "Block"]) {
    assert.ok(skill.includes(`### ${section}`), `missing record section: ${section}`);
  }
  assert.equal(skill.includes("### Checklist"), false);
  assert.match(skill, /tasks\/tasks\.md/);
  assert.match(skill, /tasks\/tasks\/<slug>\.md/);
  assert.match(skill, /Do not hand-edit status or index lines/);
  assert.match(skill, /`sync` conservatively marks its assessment Stale, clears Verification, removes `Skipped`, and invalidates `Passed` or `Approved`/);
  assert.match(skill, /reopen a Completed task before changing its specification/);
  assert.match(skill, /Load the small user\/project Memory indexes/);
  assert.match(skill, /After the protocol aligns the current Target, read relevant Markdown memory/);
  assert.match(skill, /Before self-check, verify any memory used against the task's actual changes and authoritative sources/);
  assert.match(skill, /including affected knowledge beyond the selected Packs; respect the task's write scope/);
  assert.match(skill, /Start a new task for every independently acceptable user outcome/);
  assert.match(skill, /directly corrects, completes, or re-verifies the same outcome/);
  assert.match(skill, /Component, file, topic, or implementation overlap alone does not establish ownership/);
  assert.match(skill, /Canonical `#` and `##` record headings start at column zero/);
  assert.match(skill, /indented or container-nested headings are content, not record sections/);
  assert.match(skill, /This is the only checkbox list/);
  assert.match(skill, /Do not put implementation steps, commands, workflow gates, or review state here/);
  assert.match(skill, /Never check a Target manually/);
  assert.match(skill, /## Owner Self-Check and Review Handoff/);
  assert.match(skill, /For each Target, collect requirement, observed result, evidence, and limitations/);
  assert.match(skill, /Stop editing the review scope while the Reviewer runs/);
  assert.match(skill, /untracked, deleted, and renamed content, not merely HEAD or filenames/);
  assert.match(skill, /Do not substitute inline self-review or silently switch execution modes/);
  assert.match(skill, /Infrastructure failures do not increment finding no-progress streaks/);
  assert.match(skill, /Prepare the mandatory review handoff for R2 or explicit ordinary review/);
  assert.match(skill, /core validates assessment structure, level\/gate consistency, task-record fingerprint and evidence text/);
  assert.match(skill, /semantic risk, actual subagent isolation, check execution and complete scope remain the host and main Agent/);
  assert.match(skill, /Do not prescribe algorithms, files, functions, types, or call paths/);
  assert.match(skill, /`skipped` only with a current R0 or R1 assessment and no explicit or existing review obligation/);
  assert.match(skill, /`required` before every R2 or explicitly requested review pass/);
  assert.match(skill, /`passed` only after that `task-review` pass reports no Critical Finding/);
  assert.match(skill, /return to In Progress, remediate it/);
  assert.match(skill, /Use exactly one temporary `## Review` section with the exact `task-review-ledger\/v1` marker/);
  assert.match(skill, /Duplicate Review sections, unknown ledger schemas, and ledger-like malformed content using alternate Markdown list markers or whitespace fail closed/);
  assert.match(skill, /one unmarked historical free-form Review section remains compatible/);
  assert.match(skill, /Advance `Next finding` monotonically/);
  assert.match(skill, /no-progress=2/);
  assert.match(skill, /core rejects resume while any ledger item remains at `no-progress=2`/);
  assert.match(skill, /stop dispatching review passes/);
  assert.match(skill, /passed --resolve-ledger --snapshot/);
  assert.match(skill, /remove the ledger and record Passed atomically/);
  assert.match(skill, /Do not manually delete the resolved ledger then `sync`/);
  assert.match(skill, /Never convert a stall to `passed`/);
  assert.match(skill, /Repeat without a fixed total round limit/);
  assert.match(skill, /adversarial review of that no-file result/);
  assert.match(skill, /without a mandatory `task-review`/);
  assert.match(skill, /Independent adversarial review, a two-Agent Reviewer-Editor loop, and independent approval remain opt-in/);
  assert.match(skill, /Use `cancel <id>` for a reversible soft stop/);
  assert.match(skill, /This and the low-risk `finalize` path are the only routes to Completed; both fail closed/);
  assert.match(skill, /--final-verification <current-final-check-observation>/);
  assert.match(skill, /core cannot infer a conversational obligation/);
  assert.match(skill, /Do not retrofit untouched historical record bodies/);
  assert.match(skill, /run the built-in `\$skill-quality` gate against this package/);
  assert.match(skill, /Quality failures block completion/);

  for (const status of ["Pending", "In Progress", "Completed", "Blocked", "Cancelled"]) {
    assert.ok(skill.includes(status), `missing task status: ${status}`);
  }
  assert.deepEqual(readdirSync(skillDir).sort(), ["SKILL.md", "agents", "evals"]);
  assert.deepEqual(readdirSync(cslTasksSharedDir).sort(), ["lib", "protocols", "scripts"]);
});

test("owning tasks persist review feedback separately from the active finding ledger", () => {
  const task = readFileSync(path.join(cslTasksDir, "task", "SKILL.md"), "utf8");
  const reviewer = readFileSync(path.join(cslTasksDir, "task-review", "SKILL.md"), "utf8");
  const workflow = readFileSync(path.join(cslTasksDir, "task-review", "references", "review_workflow.md"), "utf8");
  const queue = readFileSync(path.join(cslTasksDir, "task-queue", "SKILL.md"), "utf8");
  assert.match(task, /tasks\/artifacts\/<task-id>\/reviews\/round-<NN>\.md/);
  assert.match(task, /Never overwrite or renumber a report/);
  assert.match(task, /Index-only bookkeeping does not require `sync`/);
  assert.match(task, /core checks registered report bytes, paths and header\/index correspondence/);
  assert.match(task, /task-review-reports\/v1/);
  assert.match(task, /--existing-round/);
  assert.match(task, /index survives ledger resolution and completion/);
  assert.match(reviewer, /Reviewer never writes the report or task index/);
  assert.match(workflow, /If the process stops between saving and indexing/);
  assert.match(queue, /under that owning task's ID before the terminal gate/);
});

test("workspace task ownership defaults independent and ambiguous outcomes to new records", () => {
  const fixture = JSON.parse(readFileSync(path.join(cslTasksDir, "task", "evals", "task_ownership_cases.json"), "utf8"));
  const outcomes = new Set();

  for (const item of fixture.cases) {
    const reopen = item.corrects_completes_or_reverifies_existing_outcome
      && item.leaving_existing_result_unchanged_would_be_misleading
      && !item.independently_acceptable_outcome
      && !item.ambiguous;
    const actual = reopen ? "Reopen" : "New";
    assert.equal(actual, item.expected, item.id);
    outcomes.add(actual);
  }

  assert.deepEqual([...outcomes].sort(), ["New", "Reopen"]);
  const byId = Object.fromEntries(fixture.cases.map((item) => [item.id, item]));
  assert.equal(byId["release-ci-failure"].expected, "Reopen");
  assert.equal(byId["completed-document-correction"].expected, "Reopen");
  assert.equal(byId["same-skill-new-behavior"].expected, "New");
  assert.equal(byId["same-component-new-feature"].expected, "New");
  assert.equal(byId["new-session-independent-improvement"].expected, "New");
  assert.equal(byId["ambiguous-relationship"].expected, "New");
});

test("workspace review-gate cases distinguish R0, R1, R2 and explicit review", () => {
  const fixture = JSON.parse(readFileSync(path.join(cslTasksDir, "task", "evals", "review_gate_cases.json"), "utf8"));
  const terminalOutcomes = new Set();

  for (const item of fixture.cases) {
    const exempt = item.simple && ["clarity", "impact", "risk", "verification"].every((key) => item.r1_grounds?.[key] === true);
    const level = !item.deliverable_files_changed ? "R0" : exempt ? "R1" : "R2";
    const taskReview = level === "R2" || Boolean(item.user_requested_ordinary_review);
    const entry = taskReview || item.user_requested_adversarial_review ? "Required" : "Skipped";
    const terminal = item.user_requested_adversarial_review ? "Approved" : taskReview ? "Passed" : "Skipped";
    assert.equal(level, item.expected_level, `${item.id}: level`);
    assert.equal(entry, item.expected_entry, `${item.id}: entry`);
    assert.equal(taskReview, item.expected_task_review, `${item.id}: task-review`);
    assert.equal(terminal, item.expected_terminal, `${item.id}: terminal`);
    terminalOutcomes.add(terminal);
  }

  assert.deepEqual([...terminalOutcomes].sort(), ["Approved", "Passed", "Skipped"]);
  const byId = Object.fromEntries(fixture.cases.map((item) => [item.id, item]));
  assert.equal(byId["simple-file-change"].expected_terminal, "Skipped");
  assert.equal(byId["small-logic-change"].expected_level, "R1");
  assert.equal(byId["many-mechanical-files"].expected_level, "R1");
  assert.equal(byId["uncertain-consumers"].expected_level, "R2");
  assert.equal(byId["syntax-only-evidence"].completion_requires_missing_evidence, true);
  assert.equal(byId["explicit-adversarial-low-risk"].expected_task_review, false);
  assert.equal(byId["critical-file-change"].expected_task_review, true);
  assert.equal(byId["workflow-mandated-review"].expected_entry, "Required");
  assert.equal(byId["ordinary-one-pass-review"].expected_terminal, "Skipped");
  assert.equal(byId["explicit-adversarial-file-change"].expected_terminal, "Approved");
  assert.equal(byId["explicit-adversarial-no-file-result"].expected_task_review, false);
  assert.equal(byId["explicit-adversarial-no-file-result"].expected_terminal, "Approved");
  assert.equal(byId["explicit-adversarial-no-file-queue"].expected_task_review, false);
  assert.equal(byId["explicit-adversarial-no-file-queue"].expected_terminal, "Approved");
});

test("review grading has one shared authority and keeps evidence and safety boundaries", () => {
  const protocol = readFileSync(path.join(cslTasksSharedDir, "protocols", "task-review-grading.md"), "utf8");
  assert.match(protocol, /R1 may include small logic changes/);
  assert.match(protocol, /All four conditions must have concrete, task-specific grounds/);
  assert.match(protocol, /A missing required check or unproven Target blocks completion/);
  assert.match(protocol, /never replace it with Skipped/);
  assert.match(protocol, /does not select a semantic level, discover omitted scope/);
  assert.match(protocol, /check-evidence <id>/);
  assert.match(protocol, /Historical records without an assessment remain readable/);
  assert.match(protocol, /no parent-owned changes is R0, not a waiver of integration verification/);
  assert.match(protocol, /Changing a Completed child's relationship requires explicitly reopening/);
  assert.match(protocol, /fully identical reciprocal `link` is a no-op/);
  assert.match(protocol, /core atomically removes the marked ledger and records Passed/);
  for (const name of ["task", "task-queue"]) {
    const skill = readFileSync(path.join(cslTasksDir, name, "SKILL.md"), "utf8");
    assert.match(skill, /task-review-grading\.md/);
    assert.match(skill, /assess-review/);
  }
});

test("workspace task-review stall cases block after two per-finding no-progress re-reviews", () => {
  const fixture = JSON.parse(readFileSync(path.join(cslTasksDir, "task", "evals", "review_stall_cases.json"), "utf8"));
  const actions = new Set();

  for (const item of fixture.cases) {
    let noProgress;
    let action;
    if (!item.tracked) {
      noProgress = null;
      action = "Ignore";
    } else if (item.resolved) {
      noProgress = null;
      action = "Remove";
    } else {
      noProgress = !item.same_required_outcome || item.substantive_progress
        ? 0
        : item.previous_no_progress + 1;
      action = noProgress >= fixture.stall_threshold ? "Blocked" : "In Progress";
    }
    assert.equal(noProgress, item.expected_no_progress, `${item.id}: streak`);
    assert.equal(action, item.expected_action, `${item.id}: action`);
    actions.add(action);
  }

  assert.equal(fixture.stall_threshold, 2);
  assert.deepEqual([...actions].sort(), ["Blocked", "Ignore", "In Progress", "Remove"]);

  for (const item of fixture.ledger_cases) {
    const ledger = new Map(item.previous.map(({ id, no_progress: noProgress }) => [id, noProgress]));
    for (const update of item.updates) {
      if (update.progress === "new" || update.progress === "substantive progress") ledger.set(update.id, 0);
      else if (update.progress === "no progress") ledger.set(update.id, (ledger.get(update.id) || 0) + 1);
      else if (update.progress === "resolved") ledger.delete(update.id);
      else assert.fail(`${item.id}: unknown progress ${update.progress}`);
    }
    const actual = [...ledger].sort(([left], [right]) => left.localeCompare(right)).map(([id, noProgress]) => ({ id, no_progress: noProgress }));
    const action = actual.some(({ no_progress: noProgress }) => noProgress >= fixture.stall_threshold) ? "Blocked" : "In Progress";
    assert.deepEqual(actual, item.expected, `${item.id}: ledger`);
    assert.equal(action, item.expected_action, `${item.id}: action`);
  }

  const byId = Object.fromEntries(fixture.cases.map((item) => [item.id, item]));
  assert.equal(byId["first-appearance"].expected_no_progress, 0);
  assert.equal(byId["second-no-progress-re-review"].expected_action, "Blocked");
  assert.equal(byId["artifact-progress-resets"].expected_no_progress, 0);
  assert.equal(byId["unsupported-reclassification-does-not-reset"].expected_action, "Blocked");
  assert.equal(byId["nonblocking-risk-is-not-tracked"].expected_action, "Ignore");
  const ledgerById = Object.fromEntries(fixture.ledger_cases.map((item) => [item.id, item]));
  assert.deepEqual(ledgerById["new-finding-preserves-stalled-peer"].expected, [
    { id: "TR-1", no_progress: 2 },
    { id: "TR-2", no_progress: 0 },
  ]);
  assert.equal(ledgerById["new-finding-preserves-stalled-peer"].expected_action, "Blocked");
  assert.equal(ledgerById["progress-resets-only-one-finding"].expected_action, "Blocked");
});

test("task maintenance separates safe structure operations and protects stable-ID consumers", () => {
  const skillDir = path.join(cslTasksDir, "task-maintenance");
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const fixture = JSON.parse(readFileSync(path.join(skillDir, "evals", "structure_operation_cases.json"), "utf8"));

  assert.deepEqual(fixture.transaction_invariants.destructive_structure_operations, ["Migrate", "Duplicate Delete", "Empty Directory Delete"]);
  assert.equal(fixture.transaction_invariants.pre_delete_recheck, true);
  assert.equal(fixture.transaction_invariants.atomic_no_replace_verified_before_writes, true);
  assert.equal(fixture.transaction_invariants.same_filesystem_sibling_quarantine, true);
  assert.equal(fixture.transaction_invariants.quarantine_manifest_verified_after_rename, true);
  assert.equal(fixture.transaction_invariants.quarantine_retained_until_postconditions_pass, true);
  assert.equal(fixture.transaction_invariants.final_recheck_before_quarantine_cleanup, true);
  assert.equal(fixture.transaction_invariants.final_cleanup_rechecks_source_absent, true);
  assert.equal(fixture.transaction_invariants.rollback_restores_from_quarantine, true);
  assert.equal(fixture.transaction_invariants.rollback_requires_source_absent, true);
  assert.equal(fixture.transaction_invariants.rollback_uses_atomic_no_replace_rename, true);
  assert.equal(fixture.transaction_invariants.rollback_conflict_retains_source_and_quarantine, true);
  for (const item of fixture.rollback_cases) {
    const actual = item.source_path_absent && !item.source_exists_at_rename ? "Restore From Quarantine" : "Unresolved Recovery Conflict";
    assert.equal(actual, item.expected, item.id);
    assert.equal(item.overwrite_source, false, item.id);
    assert.equal(item.delete_source, false, item.id);
  }
  const rollbackById = Object.fromEntries(fixture.rollback_cases.map((item) => [item.id, item]));
  assert.equal(rollbackById["source-reappeared-at-no-replace-rename"].expected, "Unresolved Recovery Conflict");
  assert.equal(rollbackById["source-reappeared-at-no-replace-rename"].retain_quarantine, true);

  for (const section of ["Migrate Gate", "Byte-Identical Duplicate Delete Gate", "Empty Directory Delete Gate", "Apply Migrate", "Apply Duplicate Delete", "Apply Empty Directory Delete"]) {
    assert.ok(skill.includes(`### ${section}`), `missing structure operation section: ${section}`);
  }
  assert.match(skill, /inventory every current non-historical consumer in Task-owned and non-Task sources/);
  assert.match(skill, /Any non-empty historical path that is not a verified byte-identical duplicate must use Migrate/);
  assert.match(skill, /Duplicate Delete candidate requires a non-empty source/);
  assert.match(skill, /Empty Directory Delete candidate has no destination and exclusively owns every empty-source case/);
  assert.match(skill, /neither may contain the other/);
  assert.match(skill, /same-filesystem atomic no-replace rename primitive is available and verified/);
  assert.match(skill, /otherwise Defer before writing/);
  assert.match(skill, /Each empty parent directory requires its own approved Empty Directory Delete candidate/);
  assert.match(skill, /Immediately recheck both manifests/);
  assert.match(skill, /atomically rename the source to a unique absent sibling quarantine path/);
  assert.match(skill, /Recompute the quarantine manifest and require it to match/);
  assert.match(skill, /Immediately recheck source absence, quarantine and destination identity, and rewritten references/);
  assert.match(skill, /delete quarantine only after every postcondition passes/);
  assert.match(skill, /Quarantine is transaction-local rollback state, not a persistent ledger/);
  assert.match(skill, /immediately require source absence and use an atomic no-replace rename/);
  assert.match(skill, /source exists at the call boundary/);
  assert.match(skill, /report an unresolved recovery conflict/);

  for (const item of fixture.cases) {
    let actual;
    if (item.scope === "data-delete") {
      actual = item.staleness_proven && item.live_consumers_remain_valid ? "Data Delete" : "Defer";
    } else if (item.empty) {
      actual = "Empty Directory Delete";
    } else if (item.byte_identical_destination && !item.has_unique_content) {
      actual = "Duplicate Delete";
    } else if (item.has_unique_content && item.canonical_destination === "absent") {
      actual = "Migrate";
    } else {
      actual = "Defer";
    }
    assert.equal(actual, item.expected, item.id);
  }
  const byId = Object.fromEntries(fixture.cases.map((item) => [item.id, item]));
  assert.equal(byId["empty-directory-deletes-without-destination"].expected, "Empty Directory Delete");
  assert.equal(byId["empty-directory-with-identical-destination-still-uses-empty-delete"].expected, "Empty Directory Delete");
  assert.equal(byId["identical-copy-deletes"].empty, false);
  assert.equal(byId["stable-id-with-live-consumer-defers"].staleness_proven, true);
  assert.equal(byId["stable-id-with-live-consumer-defers"].live_consumers_remain_valid, false);
  assert.equal(byId["stable-id-with-live-consumer-defers"].expected, "Defer");
});

// Legacy Context/Lessons parser contracts were removed with their runtime.
// Their migration, source preservation and new writer behavior are covered in
// memory-migration.test.js and memory-store.test.js, not by a parallel reader.

test("adversarial review report presents compact human-readable dialogue", () => {
  const contract = readFileSync(path.join(root, "skills", "dev", "adversarial-review", "references", "final-review-report.md"), "utf8");
  const report = readFileSync(path.join(artifactDir, "optimize-workspace-capture-lessons", "reports", "adversarial-review.md"), "utf8");
  const cases = JSON.parse(readFileSync(path.join(root, "skills", "dev", "adversarial-review", "evals", "report_contract_cases.json"), "utf8"));

  for (const field of ["created", "task", "review_cycles"]) {
    assert.match(contract, new RegExp(`^${field}:`, "m"), `missing report metadata: ${field}`);
  }
  assert.match(contract, /preserve `created`/);
  assert.match(contract, /update `review_cycles` cumulatively/);
  assert.match(contract, /single viewpoint on the same line/);
  assert.match(contract, /multiple independent viewpoints, place list items below the label/);
  assert.match(contract, /Use one quote block and one `Conclusion` per topic/);

  const caseById = Object.fromEntries(cases.cases.map((item) => [item.id, item.expect]));
  assert.deepEqual(caseById["terminal-report-shape"].frontmatter, ["created", "task", "review_cycles"]);
  assert.equal(caseById["terminal-report-shape"].decision_in_frontmatter, false);
  assert.equal(caseById["material-discussion-only"].dialogue_uses_one_quote_block, true);
  assert.equal(caseById["material-discussion-only"].multiple_viewpoints_use_list, true);
  assert.equal(caseById["clean-approval"].invented_discussion, false);
  assert.equal(caseById["approval-invalidated"].created_preserved, true);
  assert.equal(caseById["approval-invalidated"].review_cycles_updated_cumulatively, true);
  assert.equal(caseById["missing-owning-task"].report_created_or_updated, false);

  validateReviewReport(report, {
    task: "optimize-workspace-capture-lessons",
    cycles: 3,
    dialogue: [["E1", "R1", "E2", "R2", "E3", "R3"]],
  });

  validateReviewReport(`---
created: 2026-07-21
task: clean-review
review_cycles: 1
---

# Clean review

No material discussion occurred.

---

**Final decision:** \`APPROVED\`

**Outcome:** The artifact satisfies the request.

**Remaining:** \`none\`
`, { task: "clean-review", cycles: 1 });

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
