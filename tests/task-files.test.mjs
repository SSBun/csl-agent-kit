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
const reportDir = path.join(root, "reports", "adversarial-review");
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
      ?? report.match(/^- Task: \[[^\]]+]\(\.\.\/\.\.\/tasks\/tasks\/([a-z0-9-]+\.md)\)/m)?.[1];
    assert.ok(taskFile, `missing task link: ${reportFile}`);
    assert.equal(taskFile, reportFile, `report/task slug mismatch: ${reportFile}`);
    assert.ok(tasks.has(taskFile), `missing task: ${taskFile}`);
  }
}

test("task index and review reports resolve to isolated same-slug files", () => {
  validateTaskGraph(
    readFileSync(path.join(root, "tasks", "tasks.md"), "utf8"),
    readMarkdown(taskDir),
    readMarkdown(reportDir),
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
  const tasks = new Map([["task-a.md", "# 任务 A\n\n状态：进行中\n\n- Report: [Adversarial review report](../../reports/adversarial-review/task-a.md)\n"]]);
  assert.throws(() => validateTaskGraph(index, tasks, new Map()), /missing report: task-a\.md/);
});

test("cross-linked task and report slugs fail validation", () => {
  const index = "# 任务索引\n\n- [任务 A](tasks/task-a.md) — 进行中\n";
  const tasks = new Map([["task-a.md", "# 任务 A\n\n状态：进行中\n\n- Report: [Adversarial review report](../../reports/adversarial-review/report-b.md)\n"]]);
  const reports = new Map([["report-b.md", "# Review\n\n- Task: [tasks/tasks/task-a.md](../../tasks/tasks/task-a.md) — 任务 A\n"]]);
  assert.throws(() => validateTaskGraph(index, tasks, reports), /task\/report slug mismatch: task-a\.md/);
});

test("default agent instructions explain workspace records and route work to workflow skills", () => {
  const rules = readFileSync(path.join(root, "super-agent", "AGENTS.md"), "utf8");
  const expected = {
    "task-context": [path.join(cslTasksDir, "task-context"), "tasks/context.md"],
    "task": [path.join(cslTasksDir, "task"), "tasks/tasks.md"],
    "task-lessons": [path.join(cslTasksDir, "task-lessons"), "tasks/lessons.md"],
  };

  for (const [name, [skillDir, ownedPath]] of Object.entries(expected)) {
    const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
    assert.match(skill, new RegExp(`^name: ${name}$`, "m"));
    assert.ok(skill.includes(ownedPath), `${name} missing owned path`);
    assert.equal(skill.includes("TODO"), false, `${name} contains scaffold text`);
    assert.ok(rules.includes(`$${name}`), `default instructions missing route: ${name}`);
    assert.ok(rules.includes(ownedPath), `default instructions missing mechanism path: ${ownedPath}`);
  }

  for (const name of ["task", "task-plan", "task-queue"]) {
    assert.ok(existsSync(path.join(cslTasksDir, name, "SKILL.md")), `missing ${name}`);
    assert.ok(rules.includes(`$${name}`), `default instructions missing route: ${name}`);
  }
  for (const name of ["csl-task", "csl-task-plan", "csl-task-auto"]) {
    assert.equal(existsSync(path.join(cslTasksDir, name)), false, `legacy skill still exists: ${name}`);
    assert.equal(rules.includes(`$${name}`), false, `legacy route still exists: ${name}`);
  }
  assert.equal(existsSync(path.join(skillsDir, "workspace-manage-task")), false);
  assert.equal(existsSync(path.join(skillsDir, "workspace-maintain-context")), false);
  assert.equal(existsSync(path.join(skillsDir, "workspace-context")), false);
  assert.equal(existsSync(path.join(skillsDir, "workspace-lessons")), false);

  assert.match(rules, /load `\$task-context` and use it to establish and load a standard Project Core before acting/);
  assert.match(rules, /Rewrite an existing nonstandard Context through the skill/);
  assert.match(rules, /obtain explicit confirmation for the exact minimal file before creating it/);
  assert.equal(rules.includes("$workspace-maintain-context"), false);
  assert.equal(rules.includes("$workspace-context"), false);
  assert.match(rules, /query only the relevant Context Packs, normally one to three/);
  assert.equal(rules.includes("Read `tasks/context.md` first"), false);
  assert.match(rules, /asks to create, modify, move, rename, or delete any file—even when the requested edit is trivial/);
  assert.match(rules, /load `\$task` and follow its `SKILL\.md` to create, resume, or reopen the owning record before substantive discussion/);
  assert.match(rules, /task lifecycle writes needed for activation, focus, and Target alignment are the bootstrap exception/);
  assert.match(rules, /apply the selected task-family skill's required shared Task Target Alignment Protocol/);
  assert.match(rules, /current complete user authorization/);
  assert.match(rules, /bidirectionally materially equivalent/);
  assert.match(rules, /focused user-owned clarification needed to form an honest commitment/);
  assert.match(rules, /Continue to substantive preparation or execution only after alignment/);
  assert.doesNotMatch(rules, /TASK_GO/);
  assert.doesNotMatch(rules, /`\*\*Task Target:\*\* <target>`/);
  assert.doesNotMatch(rules, /task_target_confirm/);
  assert.match(rules, /Skip task records only for simple factual answers and open-ended conversation that request no file mutation/);
  assert.match(rules, /read-only trivial deterministic operations/);

  const alignmentProtocolPath = path.join(cslTasksSharedDir, "protocols", "task-target-alignment.md");
  assert.ok(existsSync(alignmentProtocolPath), "missing shared Task Target alignment protocol");
  const alignmentProtocol = readFileSync(alignmentProtocolPath, "utf8");
  assert.doesNotMatch(alignmentProtocol, /^---/);
  assert.match(alignmentProtocol, /sole detailed authority for Task Target readiness, semantic alignment, conditional presentation and confirmation, revision, and realignment/);
  assert.doesNotMatch(alignmentProtocol, /TASK_GO/);
  assert.match(alignmentProtocol, /current user authorization/);
  assert.match(alignmentProtocol, /originating request, focused clarification answers, explicit user additions or revisions/);
  assert.match(alignmentProtocol, /neither adds, removes, weakens, omits, nor changes/);
  assert.match(alignmentProtocol, /If the user could accept the current authorization yet reasonably reject the candidate Target/);
  assert.match(alignmentProtocol, /If the candidate Target could be satisfied while the current authorization remains unsatisfied/);
  assert.match(alignmentProtocol, /continue without rendering a confirmation prompt/);
  assert.match(alignmentProtocol, /^   \*\*Task Target\*\*$/m);
  assert.match(alignmentProtocol, /^   - \*\*Outcome:\*\*/m);
  assert.match(alignmentProtocol, /^   - \*\*Done when:\*\*/m);
  assert.match(alignmentProtocol, /^   - \*\*Boundaries:\*\*/m);
  assert.match(alignmentProtocol, /Confirm this target, or state what should change/);
  assert.doesNotMatch(alignmentProtocol, /Reply `1`/);
  assert.match(alignmentProtocol, /Keep the title exactly `\*\*Task Target\*\*`/);
  assert.match(alignmentProtocol, /Localize the `Outcome`, `Done when`, and `Boundaries` labels/);
  assert.match(alignmentProtocol, /do not add confirmation shortcut hints to it/);
  assert.match(alignmentProtocol, /`Outcome` and `Done when` are required/);
  assert.match(alignmentProtocol, /Include the entire `Boundaries` item only when omitting a material scope boundary could cause misunderstanding/);
  assert.match(alignmentProtocol, /Render it without a code fence, implementation method, file list, command sequence, internal plan, or checkbox/);
  assert.doesNotMatch(alignmentProtocol, /`\*\*Task Target:\*\* <intended outcome and observable completion condition>`/);
  assert.match(alignmentProtocol, /This focused clarification forms the commitment/);
  assert.match(alignmentProtocol, /trimmed content is exactly `1` or case-insensitively equals `y` confirms the currently presented Target/);
  assert.match(alignmentProtocol, /Treat these as implicit shortcuts and do not advertise them in the user-facing block/);
  assert.match(alignmentProtocol, /Any other unambiguous affirmative response that accepts it also confirms it/);
  assert.match(alignmentProtocol, /updates the current user authorization instead of confirming the old Target/);
  assert.match(alignmentProtocol, /continue without asking the user to confirm their own explicit revision again/);
  assert.match(alignmentProtocol, /material change introduced by the Agent or by discovery is not authorized until the user accepts it/);
  assert.match(alignmentProtocol, /Independent Safety Gates/);
  assert.match(alignmentProtocol, /does not replace the canonical record's `Target` section/);
  assert.doesNotMatch(alignmentProtocol, /task_target_confirm/);

  for (const name of ["task", "task-plan", "task-queue"]) {
    const skill = readFileSync(path.join(cslTasksDir, name, "SKILL.md"), "utf8");
    assert.ok(skill.includes("csl-tasks/shared/protocols/task-target-alignment.md"), `${name} missing shared protocol reference`);
    assert.match(skill, /Before forming, presenting, or accepting a Task Target, read/);
    assert.match(skill, /stop before substantive work and report the missing runtime dependency/);
    assert.match(skill, /The shared protocol owns readiness, semantic alignment, focused clarification, conditional confirmation, revision, and realignment semantics/);
    assert.doesNotMatch(skill, /TASK_GO/);
    assert.doesNotMatch(skill, /state one line in the exact format `\*\*Task Target:\*\*/);
    assert.doesNotMatch(skill, /task_target_confirm/);
  }
  const taskSkill = readFileSync(path.join(cslTasksDir, "task", "SKILL.md"), "utf8");
  const planSkill = readFileSync(path.join(cslTasksDir, "task-plan", "SKILL.md"), "utf8");
  const queueSkill = readFileSync(path.join(cslTasksDir, "task-queue", "SKILL.md"), "utf8");
  assert.match(taskSkill, /single-outcome Target meaning/);
  assert.match(planSkill, /planning-handoff Target meaning/);
  assert.match(queueSkill, /integration Target meaning/);
  assert.match(rules, /before substantive preparation or execution, load `\$task-lessons` and follow its `SKILL\.md`/);
  assert.equal(rules.includes("$workspace-capture-lessons"), false);
  assert.equal(rules.includes("$workspace-lessons"), false);
  assert.match(rules, /Do not wait for the user to request/);
  assert.match(rules, /Use an independent review workflow only when the user explicitly requests/);
  assert.equal(rules.includes("applicable task requirement"), false);

  const projectRules = readFileSync(path.join(root, "AGENTS.md"), "utf8");
  assert.match(projectRules, /After modifying any \*\*skill package\*\* under `skills\/` or `\.agents\/skills\/`/);
  assert.match(projectRules, /node skills\/meta\/skill-quality\/scripts\/check\.js <skill-dir>/);
  assert.match(projectRules, /Run `adversarial-review` or request human review only when the user explicitly asks/);
  assert.match(projectRules, /high risk alone does not trigger it/);

  const reviewSkill = readFileSync(path.join(root, "skills", "dev", "adversarial-review", "SKILL.md"), "utf8");
  assert.match(reviewSkill, /Use only when the user explicitly requests adversarial review/);
  assert.match(reviewSkill, /Enter only from an explicit user request/);
  assert.equal(reviewSkill.includes("applicable requirement mandates"), false);
});

test("injected CSL Agent Kit contract defines behavior without runtime mechanics", () => {
  const contract = readFileSync(path.join(root, "super-agent", "workspace-workflow-gates.md"), "utf8");
  const order = [
    "1. **Orient**",
    "2. **Align**",
    "3. **Prepare**",
    "4. **Execute**",
    "5. **Verify**",
  ];

  let previous = -1;
  for (const step of order) {
    const current = contract.indexOf(step, previous + 1);
    assert.ok(current > previous, `missing or out-of-order behavior step: ${step}`);
    previous = current;
  }

  assert.match(contract, /^CSL AGENT KIT CONTRACT ACTIVE/);
  assert.match(contract, /never requires replacing or rewriting `AGENTS\.md`/);
  assert.match(contract, /Existing user rules and the current explicit request take precedence/);
  assert.match(contract, /Before any user-requested file creation, modification, move, rename, or deletion/);
  assert.match(contract, /This applies even to trivial deterministic edits/);
  assert.match(contract, /task-lifecycle writes needed to create or restore that record, bind the session, and align its Target are the bootstrap exception/);
  assert.match(contract, /Whenever a Task workflow applies, align a concise Task Target/);
  assert.match(contract, /Treat a clear user instruction as authorization for a materially equivalent Target/);
  assert.match(contract, /Present the Target and wait for confirmation only when it adds, removes, weakens, omits, or changes/);
  assert.match(contract, /A complete explicit user revision authorizes an equivalent revised Target without another confirmation/);
  assert.match(contract, /Independent safety or permission confirmations remain separate/);
  assert.match(contract, /At session start, resume, or compaction, establish and load the standard workspace Context before acting/);
  assert.match(contract, /Before substantive work, apply every relevant Lesson/);
  assert.match(contract, /Implement the minimum solution that fully satisfies the aligned outcome/);
  assert.match(contract, /Touch only what the aligned outcome requires/);
  assert.match(contract, /Independent adversarial review, a two-Agent Reviewer–Editor loop, or independent Reviewer approval is required only when the user explicitly requests it/);
  assert.match(contract, /The Contract stays behavioral and stable\. Skills retain operational detail\./);
  assert.doesNotMatch(contract, /\$(?:task|task-plan|task-queue|task-context|task-lessons)/);
  assert.doesNotMatch(contract, /Task Target Alignment Protocol/);
  assert.doesNotMatch(contract, /task_focus/);
  assert.doesNotMatch(contract, /tasks\/tasks/);
  assert.doesNotMatch(contract, /SKILL\.md/);
});

test("workspace context contract supports dispatch-ready retrieval and durable admission", () => {
  const skill = readFileSync(path.join(cslTasksDir, "task-context", "SKILL.md"), "utf8");

  for (const section of ["Purpose", "Data Model", "Query Lifecycle", "Admission Gate", "Store", "Route Elsewhere", "Authority and Writes", "Mutable Information", "Temporary Unrouted Facts", "Standard Context Bootstrap", "Degradation and Failure", "Maintainer Validation"]) {
    assert.ok(skill.includes(`## ${section}`), `missing context section: ${section}`);
  }

  for (const coreSection of ["Purpose", "Global Vocabulary", "System Map", "Global Invariants"]) {
    assert.match(skill, new RegExp(`### ${coreSection}`), `missing Project Core section: ${coreSection}`);
  }
  for (const field of ["Scope", "Paths", "Keywords", "Authority", "Recheck"]) {
    assert.match(skill, new RegExp(`- ${field}:`), `missing Context Pack metadata: ${field}`);
  }

  assert.match(skill, /without repeating broad repository exploration, repo mapping, or architecture analysis/);
  assert.match(skill, /do not read the whole Context file for orientation/);
  assert.match(skill, /Usually select one to three Packs/);
  assert.match(skill, /node <skill-dir>\/scripts\/context\.js --workspace <workspace> core/);
  assert.match(skill, /one batched `show`/);
  assert.match(skill, /Keep selected IDs only in session state/);
  assert.match(skill, /Confirmed.*Project-specific.*Stable boundary.*Decision-changing.*Summary-efficient.*Correctly routed.*Verifiable/s);
  assert.match(skill, /Treat discoverability only as a cost signal/);
  assert.match(skill, /Verification and observability boundaries/);
  assert.match(skill, /sourced non-goals, and negative knowledge/);
  assert.match(skill, /Never cache a mutable current value/);
  assert.match(skill, /A stable lookup does not qualify by itself/);
  assert.match(skill, /Exclude an obvious version or configuration pointer/);
  assert.match(skill, /Replacing the current workspace's existing Context when it lacks a valid Project Core is pre-authorized/);
  assert.match(skill, /Creating a missing `tasks\/context\.md` requires showing the exact complete proposed file and obtaining explicit user confirmation/);
  assert.match(skill, /Every other persistent Project Core change requires showing the exact proposed diff and obtaining explicit user confirmation/);
  assert.match(skill, /source-backed Add, Update, or Delete may happen automatically/);
  assert.match(skill, /If validation fails, restore the pre-write content/);
  assert.match(skill, /the current task ends/);
  assert.match(skill, /the related module next changes materially/);
  assert.match(skill, /evidence, source, assumption, or Authority becomes invalid/);
  assert.match(skill, /Never convert old Context content into Packs or carry it into the replacement/);
  assert.match(skill, /Replace the entire file with a minimal standard Context/);
  assert.match(skill, /Show the exact complete proposed file and request explicit user confirmation/);
  assert.match(skill, /Run both `core` and `validate` against the replacement/);
  assert.match(skill, /Do not disclose an existing invalid Core before attempting Existing Context Rewrite/);
  assert.doesNotMatch(skill, /Default Migration|Legacy Migration|legacy-<content-hash>/);
  const script = readFileSync(path.join(cslTasksDir, "task-context", "scripts", "context.js"), "utf8");
  assert.doesNotMatch(script, /parseLegacy|legacy-pack|LEGACY_SECTIONS/);
  assert.match(skill, /the built-in `\$skill-quality` gate against this package/);
  assert.match(skill, /Quality failures block completion/);
});

test("workspace context value cases enforce admission and temporary exits", () => {
  const fixture = JSON.parse(readFileSync(path.join(cslTasksDir, "task-context", "evals", "context_value_cases.json"), "utf8"));
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

test("workspace context query cases cover session, task, write, and failure gates", () => {
  const fixture = JSON.parse(readFileSync(path.join(cslTasksDir, "task-context", "evals", "query_cases.json"), "utf8"));
  assert.equal(fixture.schema, "csl-context.query-cases/v1");
  const actions = Object.fromEntries(fixture.cases.map((item) => [item.id, item.expected_action]));
  assert.equal(actions["session-start"], "LoadCore");
  assert.equal(actions["resume-active-task"], "LoadCoreThenQuery");
  assert.equal(actions["after-compaction"], "LoadCoreThenQuery");
  assert.equal(actions["concrete-task"], "QueryRelevantPacks");
  assert.equal(actions["ordinary-follow-up"], "ReuseSelectedPacks");
  assert.equal(actions["durable-pack-change"], "MaintainPackThenValidate");
  assert.equal(actions["project-core-change"], "ShowDiffAndConfirm");
  assert.equal(actions["existing-nonstandard-context"], "RewriteThenLoadCore");
  assert.equal(actions["existing-context-rewrite-failed"], "RestoreAndDisclose");
  assert.equal(actions["missing-context"], "AnalyzeProposeAndConfirm");
  assert.equal(actions["missing-context-confirmed"], "CreateThenLoadCore");
  assert.equal(actions["duplicate-relevant-id"], "DoNotApply");
});

test("workspace context CLI loads Core, queries only v1 Packs, and fails closed", (t) => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), "context-query-"));
  const contextDir = path.join(workspace, "tasks");
  const contextFile = path.join(contextDir, "context.md");
  const script = path.join(cslTasksDir, "task-context", "scripts", "context.js");
  mkdirSync(contextDir, { recursive: true });
  t.after(() => rmSync(workspace, { recursive: true, force: true }));

  const core = `# Workspace Context

## Project Core

### Purpose
- Dispatch tasks without broad exploration.

### Global Vocabulary
- A Context Pack is one retrieval unit.

### System Map
- \`skills/\` contains skill packages.

### Global Invariants
- Task-direct source remains authoritative.
`;
  writeFileSync(contextFile, `${core}
## CTX-workspace-tasks — Workspace tasks
- Scope: Canonical task records and their index.
- Paths: \`tasks/tasks.md\`, \`tasks/tasks/\`
- Keywords: task, target, status
- Authority: \`skills/meta/task/SKILL.md\`
- Recheck: When the CSL Task contract changes.

### Purpose and Boundaries
- Canonical task records own progress; Context does not.

### Decision and Verification Boundaries
- Verify status through the shared task core.
`, "utf8");

  const run = (...args) => spawnSync(process.execPath, [script, "--workspace", workspace, ...args], { encoding: "utf8" });
  const coreResult = run("core");
  assert.equal(coreResult.status, 0, coreResult.stderr);
  assert.deepEqual(Object.keys(JSON.parse(coreResult.stdout).core), ["purpose", "globalVocabulary", "systemMap", "globalInvariants"]);

  const indexResult = run("index");
  assert.equal(indexResult.status, 0, indexResult.stderr);
  const index = JSON.parse(indexResult.stdout);
  assert.equal(index.schema, "csl-context.index/v1");
  assert.equal(index.packs.length, 1);
  assert.deepEqual(Object.keys(index.packs[0]), ["id", "title", "format", "scope", "paths", "keywords"]);
  assert.equal(index.packs[0].id, "CTX-workspace-tasks");
  assert.deepEqual(index.packs[0].paths, ["tasks/tasks.md", "tasks/tasks/"]);

  const showResult = run("show", ...index.packs.map(({ id }) => id));
  assert.equal(showResult.status, 0, showResult.stderr);
  const shown = JSON.parse(showResult.stdout);
  assert.equal(shown.schema, "csl-context.packs/v1");
  assert.equal(shown.packs[0].authority, "`skills/meta/task/SKILL.md`");

  const validationResult = run("validate");
  assert.equal(validationResult.status, 0, validationResult.stderr);
  const validation = JSON.parse(validationResult.stdout);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.warnings, []);

  const selfTest = spawnSync(process.execPath, [script, "--self-test"], { encoding: "utf8" });
  assert.equal(selfTest.status, 0, selfTest.stderr);

  rmSync(contextFile);
  const missingResult = run("validate");
  assert.equal(missingResult.status, 1);
  const missingCodes = new Set(JSON.parse(missingResult.stdout).errors.map(({ code }) => code));
  assert.ok(missingCodes.has("missing-context"));
  assert.ok(missingCodes.has("missing-or-duplicate-core"));

  writeFileSync(contextFile, `${core}
## CTX-duplicate — First
- Scope: first
- Paths: \`one/\`
- Keywords: one
- Authority: \`one/source\`
- Recheck: When one changes.

### Structure
- First.

## CTX-duplicate — Second
- Scope: second
- Paths: \`two/\`
- Keywords: two

### Structure
- Second.
`, "utf8");
  const malformedPackCoreResult = run("core");
  assert.equal(malformedPackCoreResult.status, 0, malformedPackCoreResult.stderr);

  const invalidResult = run("validate");
  assert.equal(invalidResult.status, 1);
  const invalidCodes = new Set(JSON.parse(invalidResult.stdout).errors.map(({ code }) => code));
  assert.ok(invalidCodes.has("missing-pack-metadata"));
  assert.ok(invalidCodes.has("duplicate-id"));
});

test("current workspace Context has a valid Core and formal Packs", () => {
  const script = path.join(cslTasksDir, "task-context", "scripts", "context.js");
  const result = spawnSync(process.execPath, [script, "--workspace", root, "validate"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const validation = JSON.parse(result.stdout);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.warnings, []);

  const indexResult = spawnSync(process.execPath, [script, "--workspace", root, "index"], { encoding: "utf8" });
  assert.equal(indexResult.status, 0, indexResult.stderr);
  const packs = JSON.parse(indexResult.stdout).packs;
  assert.ok(packs.some(({ id, format }) => id === "CTX-task-context" && format === "v1"));
  assert.ok(packs.every(({ format }) => format === "v1"));
});

test("CSL task contract keeps acceptance, evidence, and review gates explicit", () => {
  const skillDir = path.join(cslTasksDir, "task");
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");

  for (const section of ["Storage and Core", "Activation and Ownership", "Start or Resume", "Record Contract", "Completion", "Maintainer Validation"]) {
    assert.ok(skill.includes(`## ${section}`), `missing task section: ${section}`);
  }
  for (const section of ["Scope", "Target", "Plan", "Result", "Verification", "Block"]) {
    assert.ok(skill.includes(`### ${section}`), `missing record section: ${section}`);
  }
  assert.equal(skill.includes("### Checklist"), false);
  assert.match(skill, /tasks\/tasks\.md/);
  assert.match(skill, /tasks\/tasks\/<slug>\.md/);
  assert.match(skill, /Do not hand-edit status or index lines/);
  assert.match(skill, /Load Project Core, then read only the newest index entries/);
  assert.match(skill, /After the protocol aligns the current Target, query task-relevant Context Packs/);
  assert.match(skill, /Start a new task for every independently acceptable user outcome/);
  assert.match(skill, /directly corrects, completes, or re-verifies the same outcome/);
  assert.match(skill, /Component, file, topic, or implementation overlap alone does not establish ownership/);
  assert.match(skill, /This is the only checkbox list/);
  assert.match(skill, /Do not put implementation steps, commands, workflow gates, or review state here/);
  assert.match(skill, /Never check a Target manually/);
  assert.match(skill, /Do not prescribe algorithms, files, functions, types, or call paths/);
  assert.match(skill, /Do not infer review from risk, complexity, verification gaps, another rule, or Agent judgment/);
  assert.match(skill, /Ordinary review, testing, proofreading, and self-review do not request the independent review workflow/);
  assert.match(skill, /Use `cancel <id>` for a reversible soft stop/);
  assert.match(skill, /This is the only route to Completed and fails closed/);
  assert.match(skill, /Do not retrofit untouched historical record bodies/);
  assert.match(skill, /run the built-in `\$skill-quality` gate against this package/);
  assert.match(skill, /Quality failures block completion/);

  for (const status of ["Pending", "In Progress", "Completed", "Blocked", "Cancelled"]) {
    assert.ok(skill.includes(status), `missing task status: ${status}`);
  }
  assert.deepEqual(readdirSync(skillDir).sort(), ["SKILL.md", "agents", "evals"]);
  assert.deepEqual(readdirSync(cslTasksSharedDir).sort(), ["lib", "scripts"]);
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

test("workspace review-gate cases require an explicit user request", () => {
  const fixture = JSON.parse(readFileSync(path.join(cslTasksDir, "task", "evals", "review_gate_cases.json"), "utf8"));
  const outcomes = new Set();

  for (const item of fixture.cases) {
    const actual = item.user_requested_adversarial_review ? "Required" : "Skipped";
    assert.equal(actual, item.expected, item.id);
    outcomes.add(actual);
  }

  assert.deepEqual([...outcomes].sort(), ["Required", "Skipped"]);
  const byId = Object.fromEntries(fixture.cases.map((item) => [item.id, item]));
  assert.equal(byId["critical-without-request"].expected, "Skipped");
  assert.equal(byId["complex-gap-without-request"].expected, "Skipped");
  assert.equal(byId["workflow-mandate-without-user-request"].expected, "Skipped");
  assert.equal(byId["ordinary-one-pass-review"].expected, "Skipped");
  assert.equal(byId["explicit-adversarial-review"].expected, "Required");
  assert.equal(byId["explicit-two-agent-review"].expected, "Required");
});

test("workspace lesson contract queries before work and confirms every persistent write", () => {
  const skillDir = path.join(cslTasksDir, "task-lessons");
  const skill = readFileSync(path.join(skillDir, "SKILL.md"), "utf8");
  const queryCases = JSON.parse(readFileSync(path.join(skillDir, "evals", "query_cases.json"), "utf8"));

  for (const field of ["Trigger", "Rule", "Check"]) {
    assert.match(skill, new RegExp(`- \`${field}\`:`), `missing lesson field: ${field}`);
  }
  assert.match(skill, /A Lesson is learned only when it changes future behavior/);
  assert.match(skill, /source, schema, types, tests, lint, CI, or a mandatory workflow/);
  assert.match(skill, /last-mile behavioral control/);
  assert.match(skill, /before the same failure recurs/);
  assert.match(skill, /directly blocks the failure mechanism/);
  assert.match(skill, /preventive control covers the relevant scope/);
  assert.match(skill, /failed or unobservable applicable Check blocks completion/i);
  assert.match(skill, /same failure recurs under a matching `Trigger`/);
  assert.match(skill, /fully prevented by a stronger mechanical control/);
  for (const gate of ["Entry Gate", "Change Gate", "Completion Gate"]) {
    assert.ok(skill.includes(`### ${gate}`), `missing lesson gate: ${gate}`);
  }
  assert.match(skill, /L-YYYYMMDD-ascii-slug/);
  assert.match(skill, /Keep the section order exactly `Trigger`, `Rule`, `Check`/);
  assert.match(skill, /Prefer recall: include any plausible match/);
  assert.match(skill, /Keep selected lesson IDs only in current session state/);
  assert.match(skill, /Before every persistent Add, Update, Merge, Replace, or Delete/);
  assert.match(skill, /Obtain explicit confirmation/);
  assert.match(skill, /Without confirmation, leave `tasks\/lessons\.md` unchanged/);
  assert.match(skill, /restore the pre-write content/);
  assert.match(skill, /more specific Trigger/);
  assert.match(skill, /Never use record date as priority/);
  assert.match(skill, /Do not bulk-migrate existing records/);
  assert.match(skill, /missing `tasks\/lessons\.md` means an empty rule set/);
  assert.match(skill, /manually perform the same Trigger-first scan/);
  assert.match(skill, /Applied Lessons: <ID\.\.\.>/);
  assert.match(skill, /node <skill-dir>\/scripts\/lessons\.js --workspace <workspace> index/);

  assert.equal(queryCases.schema, "csl-lessons.query-cases/v1");
  const expected = Object.fromEntries(queryCases.cases.map((item) => [item.id, item.expected_action]));
  assert.equal(expected["entry-non-trivial-task"], "Query");
  assert.equal(expected["resume-with-active-task"], "Query");
  assert.equal(expected["completion-selected-checks"], "CheckSelected");
  assert.equal(expected["no-task-session-start"], "Skip");
  assert.equal(expected["ordinary-follow-up"], "Skip");
});

test("workspace lesson CLI indexes v1 and legacy records and rejects malformed v1", (t) => {
  const workspace = mkdtempSync(path.join(os.tmpdir(), "lessons-query-"));
  const lessonsDir = path.join(workspace, "tasks");
  const lessonsFile = path.join(lessonsDir, "lessons.md");
  const script = path.join(cslTasksDir, "task-lessons", "scripts", "lessons.js");
  mkdirSync(lessonsDir, { recursive: true });
  t.after(() => rmSync(workspace, { recursive: true, force: true }));

  writeFileSync(lessonsFile, `# Lessons

## L-20260809-shared-format — Shared format

### Trigger
- Changing a shared format.

### Rule
- Update every reader.

### Check
- Producer and consumer tests pass.

## 2026-08-01 Legacy rule

- **Trigger:**
  - Editing a legacy file.
- **Rule:**
  - Preserve compatibility.
`, "utf8");

  const indexResult = spawnSync(process.execPath, [script, "--workspace", workspace, "index"], { encoding: "utf8" });
  assert.equal(indexResult.status, 0, indexResult.stderr);
  const index = JSON.parse(indexResult.stdout);
  assert.equal(index.schema, "csl-lessons.index/v1");
  assert.deepEqual(Object.keys(index.lessons[0]), ["id", "title", "format", "triggers"]);
  assert.equal(index.lessons[0].id, "L-20260809-shared-format");
  assert.match(index.lessons[1].id, /^legacy-[a-f0-9]{12}$/);
  assert.deepEqual(index.lessons[1].triggers, ["Editing a legacy file.", "Preserve compatibility."]);

  const showResult = spawnSync(process.execPath, [
    script,
    "--workspace",
    workspace,
    "show",
    ...index.lessons.map(({ id }) => id),
  ], { encoding: "utf8" });
  assert.equal(showResult.status, 0, showResult.stderr);
  const shown = JSON.parse(showResult.stdout);
  assert.equal(shown.schema, "csl-lessons.records/v1");
  assert.deepEqual(shown.lessons[0].checks, ["Producer and consumer tests pass."]);
  assert.deepEqual(shown.lessons[1].checks, []);

  const validateResult = spawnSync(process.execPath, [script, "--workspace", workspace, "validate"], { encoding: "utf8" });
  assert.equal(validateResult.status, 0, validateResult.stderr);
  const validation = JSON.parse(validateResult.stdout);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.warnings.map(({ code }) => code), ["legacy-record"]);

  const selfTest = spawnSync(process.execPath, [script, "--self-test"], { encoding: "utf8" });
  assert.equal(selfTest.status, 0, selfTest.stderr);

  writeFileSync(lessonsFile, `# Lessons

## L-bad — Broken

### Rule
- Run checks.

### Trigger
  - Nested item.

### Check
`, "utf8");
  const invalidResult = spawnSync(process.execPath, [script, "--workspace", workspace, "validate"], { encoding: "utf8" });
  assert.equal(invalidResult.status, 1);
  const codes = new Set(JSON.parse(invalidResult.stdout).errors.map(({ code }) => code));
  assert.ok(codes.has("invalid-id"));
  assert.ok(codes.has("section-order"));
  assert.ok(codes.has("non-flat-list"));
  assert.ok(codes.has("empty-section"));
});

test("adversarial review report presents compact human-readable dialogue", () => {
  const contract = readFileSync(path.join(root, "skills", "dev", "adversarial-review", "references", "final-review-report.md"), "utf8");
  const report = readFileSync(path.join(reportDir, "optimize-workspace-capture-lessons.md"), "utf8");
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
