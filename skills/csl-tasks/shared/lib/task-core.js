"use strict";

const fs = require("node:fs");
const path = require("node:path");

const STATE_DISPLAY = {
  pending: "Pending",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
  blocked: "Blocked",
  cancelled: "Cancelled",
};
const DISPLAY_STATE = Object.fromEntries(Object.entries(STATE_DISPLAY).map(([key, value]) => [value, key]));
const KINDS = new Set(["task", "plan", "auto"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIMESTAMP_PATTERN = "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01]) (?:[01]\\d|2[0-3]):[0-5]\\d";
const STATUS_PATTERN = new RegExp(`^Status: (${Object.values(STATE_DISPLAY).join("|")}) \\((${TIMESTAMP_PATTERN})\\)$`, "m");
const TARGET_PATTERN = /^\s*- \[([ xX])] (T\d+):\s*(.+)$/;
const RESULT_PATTERN = /^\s*- (T\d+):\s*(.+)$/;
const REVIEW_PATTERN = /^\s*- Review gate: (Skipped|Required|Approved) — (.+)$/m;
const VERIFICATION_PATTERN = /^\s*- (Passed|Failed):\s*(.+)$/m;

function tasksDir(workspace) {
  return path.join(path.resolve(workspace), "tasks", "tasks");
}

function indexPath(workspace) {
  return path.join(path.resolve(workspace), "tasks", "tasks.md");
}

function taskPath(workspace, id) {
  assertId(id);
  return path.join(tasksDir(workspace), `${id}.md`);
}

function assertId(id) {
  if (!ID_PATTERN.test(id || "")) throw new Error(`invalid task id: ${id}`);
}

function normalizeKind(kind) {
  const value = String(kind || "task").toLowerCase();
  if (!KINDS.has(value)) throw new Error(`invalid task kind: ${kind}`);
  return value;
}

function normalizeState(state) {
  const value = String(state || "").toLowerCase().replace(/[ -]+/g, "_");
  if (!STATE_DISPLAY[value]) throw new Error(`invalid task state: ${state}`);
  return value;
}

function localTimestamp(now = new Date()) {
  const part = (value) => String(value).padStart(2, "0");
  return `${now.getFullYear()}-${part(now.getMonth() + 1)}-${part(now.getDate())} ${part(now.getHours())}:${part(now.getMinutes())}`;
}

function titleOf(text) {
  const title = text.match(/^# (.+)$/m)?.[1]?.trim();
  if (!title) throw new Error("canonical task is missing its title");
  return title;
}

function statusOf(text) {
  const match = text.match(STATUS_PATTERN);
  if (!match) throw new Error("canonical task is missing a standard status line");
  return { display: match[1], state: DISPLAY_STATE[match[1]], timestamp: match[2] };
}

function fieldOf(text, name) {
  return text.match(new RegExp(`^${name}: (.+)$`, "m"))?.[1]?.trim();
}

function section(text, name) {
  const lines = text.replace(/\s+$/, "").split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim().toLowerCase() === `## ${name.toLowerCase()}`);
  if (start === -1) return undefined;
  let end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  if (end === -1) end = lines.length;
  return { lines, start, end, body: lines.slice(start + 1, end).filter((line) => line.trim()) };
}

function replaceSection(text, name, bodyLines) {
  const normalized = text.replace(/\s+$/, "");
  const found = section(normalized, name);
  const replacement = bodyLines?.length ? [`## ${name}`, "", ...bodyLines] : [];
  if (!found) return replacement.length ? `${normalized}\n\n${replacement.join("\n")}\n` : `${normalized}\n`;

  const before = found.lines.slice(0, found.start);
  const after = found.lines.slice(found.end);
  const joined = [...before, ...replacement, ...after]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\s+$/, "");
  return `${joined}\n`;
}

function setField(text, name, value, after = "Kind") {
  const pattern = new RegExp(`^${name}: .+$`, "m");
  if (pattern.test(text)) return text.replace(pattern, `${name}: ${value}`);
  const anchor = new RegExp(`^${after}: .+$`, "m");
  if (anchor.test(text)) return text.replace(anchor, (line) => `${line}\n${name}: ${value}`);
  const status = /^Status: .+$/m;
  if (status.test(text)) return text.replace(status, (line) => `${line}\n${name}: ${value}`);
  throw new Error(`cannot add ${name}: missing status field`);
}

function targetsOf(text) {
  const found = section(text, "Target");
  if (!found) return [];
  const targets = found.body.map((line) => line.match(TARGET_PATTERN)).filter(Boolean).map((match) => ({
    checked: match[1].toLowerCase() === "x",
    id: match[2],
    text: match[3],
  }));
  if (new Set(targets.map(({ id }) => id)).size !== targets.length) throw new Error("duplicate Target ID");
  return targets;
}

function resultsOf(text) {
  const found = section(text, "Result");
  if (!found) return new Map();
  const results = found.body.map((line) => line.match(RESULT_PATTERN)).filter(Boolean);
  const map = new Map();
  for (const match of results) {
    if (map.has(match[1])) throw new Error(`duplicate Result ID: ${match[1]}`);
    map.set(match[1], match[2]);
  }
  return map;
}

function childrenOf(text) {
  const found = section(text, "Children");
  if (!found) return [];
  return found.body.map((line) => {
    const match = line.match(/^\d+\. \[(.+)]\(([a-z0-9-]+)\.md\)$/);
    if (!match) throw new Error(`invalid child entry: ${line}`);
    return { title: match[1], id: match[2] };
  });
}

function readTask(workspace, id) {
  const file = taskPath(workspace, id);
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    if (error.code === "ENOENT") throw new Error(`task not found: ${id}`);
    throw error;
  }
  return parseTask(id, text, file);
}

function parseTask(id, text, file) {
  const kindValue = fieldOf(text, "Kind");
  const kind = kindValue ? normalizeKind(kindValue) : undefined;
  const parent = fieldOf(text, "Parent");
  return {
    id,
    file,
    text,
    title: titleOf(text),
    status: statusOf(text),
    kind,
    parent: !parent || parent === "none" ? undefined : parent,
    children: childrenOf(text),
    targets: targetsOf(text),
    results: resultsOf(text),
    review: text.match(REVIEW_PATTERN),
    verification: text.match(VERIFICATION_PATTERN),
  };
}

function atomicWrite(file, text) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp-${process.pid}-${Math.random().toString(16).slice(2)}`;
  try {
    fs.writeFileSync(temporary, text, "utf8");
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function writeMany(changes) {
  const originals = new Map();
  try {
    for (const [file, text] of changes) {
      originals.set(file, fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined);
      atomicWrite(file, text);
    }
  } catch (error) {
    for (const [file, original] of originals) {
      if (original === undefined) fs.rmSync(file, { force: true });
      else atomicWrite(file, original);
    }
    throw error;
  }
}

function indexEntry(task, timestamp = task.status.timestamp) {
  return `- [${task.title}](tasks/${task.id}.md) — ${task.status.display} (${timestamp})`;
}

function updatedIndex(workspace, task, timestamp, existingText) {
  const file = indexPath(workspace);
  const text = existingText ?? (fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "# 任务索引\n");
  const lines = text.replace(/\s+$/, "").split(/\r?\n/);
  const link = `(tasks/${task.id}.md)`;
  const matches = lines.map((line, index) => line.includes(link) ? index : -1).filter((index) => index !== -1);
  if (matches.length > 1) throw new Error(`duplicate task index entry: ${task.id}`);
  const entry = indexEntry(task, timestamp);
  if (matches.length === 1) lines[matches[0]] = entry;
  else {
    const heading = lines.findIndex((line) => /^# /.test(line));
    if (heading === -1) throw new Error("task index is missing its title");
    lines.splice(heading + 1, 0, "", entry);
  }
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

function syncIndex(workspace, id) {
  const task = readTask(workspace, id);
  atomicWrite(indexPath(workspace), updatedIndex(workspace, task));
  return task;
}

function createTask(workspace, options) {
  const id = options.id;
  assertId(id);
  const title = String(options.title || "").trim();
  if (!title || /[\r\n]/.test(title)) throw new Error("task title must be one line");
  const kind = normalizeKind(options.kind);
  const targets = options.targets || [];
  if (targets.length === 0) throw new Error("a task needs at least one Target");
  const targetIds = targets.map((target) => String(target).match(/^(T\d+):\s*.+$/)?.[1]);
  if (targetIds.some((value) => !value) || new Set(targetIds).size !== targetIds.length) {
    throw new Error("Targets must have unique Tn IDs");
  }
  const file = taskPath(workspace, id);
  if (fs.existsSync(file)) throw new Error(`task already exists: ${id}`);

  const timestamp = localTimestamp(options.now);
  const lines = [
    `# ${title}`,
    "",
    `Status: Pending (${timestamp})`,
    `Kind: ${kind[0].toUpperCase()}${kind.slice(1)}`,
    "",
    "## Target",
    "",
    ...targets.map((target) => `- [ ] ${target}`),
  ];
  const text = `${lines.join("\n")}\n`;
  const task = parseTask(id, text, file);
  const index = updatedIndex(workspace, task, timestamp);
  writeMany([[file, text], [indexPath(workspace), index]]);
  return readTask(workspace, id);
}

function replaceStatus(text, state, timestamp = localTimestamp()) {
  const current = statusOf(text);
  return text.replace(STATUS_PATTERN, `Status: ${STATE_DISPLAY[state]} (${timestamp})`);
}

function writeTaskAndIndex(workspace, task, text) {
  const parsed = parseTask(task.id, text, task.file);
  const index = updatedIndex(workspace, parsed);
  writeMany([[task.file, text], [indexPath(workspace), index]]);
  return readTask(workspace, task.id);
}

function setState(workspace, id, requested) {
  const state = normalizeState(requested);
  if (state === "completed") throw new Error("use complete to enter Completed");
  const task = readTask(workspace, id);
  const allowed = {
    pending: new Set(["in_progress", "blocked", "cancelled"]),
    in_progress: new Set(["pending", "in_review", "blocked", "cancelled"]),
    in_review: new Set(["in_progress", "blocked", "cancelled"]),
    blocked: new Set(["in_progress", "cancelled"]),
    cancelled: new Set(["in_progress"]),
    completed: new Set(),
  };
  if (task.status.state === state) return task;
  if (!allowed[task.status.state].has(state)) throw new Error(`cannot move ${task.status.display} to ${STATE_DISPLAY[state]}`);
  if (state === "in_progress" && task.targets.length === 0) throw new Error("In Progress requires at least one Target");
  if (state === "in_review" && task.review?.[1] !== "Required") throw new Error("In Review requires a required review gate");
  if (state === "blocked" && !section(task.text, "Block")) throw new Error("Blocked requires an active Block section");
  let text = replaceStatus(task.text, state);
  if (task.status.state === "blocked" && state !== "blocked") text = replaceSection(text, "Block", undefined);
  return writeTaskAndIndex(workspace, task, text);
}

function cancelTask(workspace, id) {
  return setState(workspace, id, "cancelled");
}

function resumeTask(workspace, id) {
  return setState(workspace, id, "in_progress");
}

function reopenTask(workspace, id) {
  const task = readTask(workspace, id);
  if (task.status.state !== "completed") throw new Error("only Completed tasks can be reopened");
  let text = replaceStatus(task.text, "in_progress");
  text = replaceSection(text, "Verification", undefined);
  return writeTaskAndIndex(workspace, task, text);
}

function recordResult(workspace, id, targetId, evidence) {
  const task = readTask(workspace, id);
  if (task.status.state === "completed") throw new Error("reopen the task before changing results");
  if (!/^T\d+$/.test(targetId)) throw new Error(`invalid Target ID: ${targetId}`);
  const value = String(evidence || "").trim();
  if (!value || /[\r\n]/.test(value)) throw new Error("result evidence must be one line");
  if (!task.targets.some((target) => target.id === targetId)) throw new Error(`unknown Target ID: ${targetId}`);

  let text = task.text.replace(
    new RegExp(`^(\\s*- \\[[ xX]\\] ${targetId}:)`, "m"),
    `- [x] ${targetId}:`,
  );
  const found = section(text, "Result");
  const lines = found ? found.body.filter((line) => !new RegExp(`^\\s*- ${targetId}:`).test(line)) : [];
  const reviewIndex = lines.findIndex((line) => /^\s*- Review gate:/.test(line));
  const result = `- ${targetId}: ${value}`;
  if (reviewIndex === -1) lines.push(result);
  else lines.splice(reviewIndex, 0, result);
  text = replaceSection(text, "Result", lines);
  text = replaceSection(text, "Verification", undefined);
  atomicWrite(task.file, text);
  return readTask(workspace, id);
}

function setReviewGate(workspace, id, decision, evidence) {
  const task = readTask(workspace, id);
  if (task.status.state === "completed") throw new Error("reopen the task before changing the review gate");
  const values = { skipped: "Skipped", required: "Required", approved: "Approved" };
  const key = String(decision || "").toLowerCase();
  if (!values[key]) throw new Error(`invalid review gate: ${decision}`);
  const value = String(evidence || "").trim();
  if (!value || /[\r\n]/.test(value)) throw new Error("review evidence must be one line");
  const found = section(task.text, "Result");
  const lines = found ? found.body.filter((line) => !/^\s*- Review gate:/.test(line)) : [];
  lines.push(`- Review gate: ${values[key]} — ${value}`);
  let text = replaceSection(task.text, "Result", lines);
  text = replaceSection(text, "Verification", undefined);
  atomicWrite(task.file, text);
  return readTask(workspace, id);
}

function recordVerification(workspace, id, passed, evidence) {
  const task = readTask(workspace, id);
  if (task.status.state === "completed") throw new Error("reopen the task before changing verification");
  const value = String(evidence || "").trim();
  if (!value || /[\r\n]/.test(value)) throw new Error("verification evidence must be one line");
  const text = replaceSection(task.text, "Verification", [`- ${passed ? "Passed" : "Failed"}: ${value}`]);
  atomicWrite(task.file, text);
  return readTask(workspace, id);
}

function linkChild(workspace, parentId, childId) {
  if (parentId === childId) throw new Error("a task cannot be its own child");
  const parent = readTask(workspace, parentId);
  const child = readTask(workspace, childId);
  if (parent.kind !== "auto") throw new Error("parent must be an Auto task");
  if (parent.status.state === "completed") throw new Error("reopen the Auto parent before changing its graph");
  if (child.parent && child.parent !== parentId) throw new Error(`${childId} already belongs to ${child.parent}`);

  const seen = new Set();
  const reachesParent = (id) => {
    if (id === parentId) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return readTask(workspace, id).children.some(({ id: nested }) => reachesParent(nested));
  };
  if (reachesParent(childId)) throw new Error("parent-child link would create a cycle");

  const children = parent.children.some(({ id }) => id === childId)
    ? parent.children
    : [...parent.children, { id: childId, title: child.title }];
  let parentText = replaceSection(parent.text, "Children", children.map((item, index) => `${index + 1}. [${item.title}](${item.id}.md)`));
  parentText = replaceSection(parentText, "Verification", undefined);
  const childText = setField(child.text, "Parent", parentId);
  writeMany([[parent.file, parentText], [child.file, childText]]);
  return { parent: readTask(workspace, parentId), child: readTask(workspace, childId) };
}

function nextChild(workspace, parentId) {
  const parent = readTask(workspace, parentId);
  if (parent.kind !== "auto") throw new Error("parent must be an Auto task");
  for (const child of parent.children) {
    const current = readTask(workspace, child.id);
    if (current.status.state !== "completed") return current;
  }
  return undefined;
}

function completeTask(workspace, id) {
  const task = readTask(workspace, id);
  if (!["in_progress", "in_review"].includes(task.status.state)) throw new Error("only active tasks can be completed");
  if (task.targets.length === 0) throw new Error("completion requires at least one Target");
  const unchecked = task.targets.find((target) => !target.checked);
  if (unchecked) throw new Error(`unchecked Target: ${unchecked.id}`);
  const missing = task.targets.find((target) => !task.results.has(target.id));
  if (missing) throw new Error(`missing Result evidence: ${missing.id}`);
  if (!task.review || !["Skipped", "Approved"].includes(task.review[1])) throw new Error("completion requires a skipped or approved review gate");
  if (task.status.state === "in_review" && task.review[1] !== "Approved") throw new Error("In Review completion requires approval");
  if (!task.verification || task.verification[1] !== "Passed") throw new Error("completion requires passed verification evidence");
  if (section(task.text, "Block")) throw new Error("a blocked task cannot be completed");
  if (task.kind === "auto") {
    if (task.children.length === 0) throw new Error("an Auto task needs at least one child");
    const unfinished = task.children.map(({ id: childId }) => readTask(workspace, childId)).find((child) => child.status.state !== "completed");
    if (unfinished) throw new Error(`unfinished child: ${unfinished.id}`);
  }
  return writeTaskAndIndex(workspace, task, replaceStatus(task.text, "completed"));
}

function checkTaskIndex(workspace, idOrPath) {
  const id = ID_PATTERN.test(idOrPath || "")
    ? idOrPath
    : path.basename(path.resolve(idOrPath || ""), ".md");
  const task = readTask(workspace, id);
  const text = fs.readFileSync(indexPath(workspace), "utf8");
  const link = `(tasks/${id}.md)`;
  const lines = text.split(/\r?\n/).filter((line) => line.includes(link));
  if (lines.length !== 1) throw new Error(`expected exactly one tasks/tasks.md entry for ${id}.md`);
  if (lines[0] !== indexEntry(task)) throw new Error("task index entry does not match the canonical task");
  return true;
}

function validateWorkspace(workspace) {
  const errors = [];
  const directory = tasksDir(workspace);
  const index = indexPath(workspace);
  if (!fs.existsSync(index)) return ["missing tasks/tasks.md"];
  if (!fs.existsSync(directory)) return ["missing tasks/tasks/"];
  const files = fs.readdirSync(directory).filter((file) => file.endsWith(".md")).sort();
  const indexText = fs.readFileSync(index, "utf8");
  const linked = [...indexText.matchAll(/\(tasks\/([a-z0-9-]+\.md)\)/g)].map((match) => match[1]);
  if (new Set(linked).size !== linked.length) errors.push("duplicate task index links");
  for (const file of files) if (!linked.includes(file)) errors.push(`missing index entry: ${file}`);
  for (const file of linked) if (!files.includes(file)) errors.push(`missing canonical task: ${file}`);

  const modern = new Map();
  for (const file of files) {
    const id = file.slice(0, -3);
    const text = fs.readFileSync(path.join(directory, file), "utf8");
    if (!/^Kind: /m.test(text)) continue;
    try {
      const task = parseTask(id, text, path.join(directory, file));
      modern.set(id, task);
      checkTaskIndex(workspace, id);
    } catch (error) {
      errors.push(`${file}: ${error.message}`);
    }
  }
  for (const task of modern.values()) {
    if (task.parent) {
      const parent = modern.get(task.parent);
      if (!parent) errors.push(`${task.id}: missing parent ${task.parent}`);
      else if (!parent.children.some(({ id }) => id === task.id)) errors.push(`${task.id}: parent link is not reciprocal`);
    }
    for (const child of task.children) {
      const record = modern.get(child.id);
      if (!record) errors.push(`${task.id}: missing child ${child.id}`);
      else if (record.parent !== task.id) errors.push(`${task.id}: child link is not reciprocal for ${child.id}`);
    }
  }
  return errors;
}

function listTasks(workspace) {
  if (!fs.existsSync(tasksDir(workspace))) return [];
  return fs.readdirSync(tasksDir(workspace))
    .filter((file) => ID_PATTERN.test(file.slice(0, -3)) && file.endsWith(".md"))
    .map((file) => readTask(workspace, file.slice(0, -3)));
}

module.exports = {
  STATE_DISPLAY,
  cancelTask,
  checkTaskIndex,
  completeTask,
  createTask,
  indexPath,
  linkChild,
  listTasks,
  localTimestamp,
  nextChild,
  readTask,
  recordResult,
  recordVerification,
  reopenTask,
  resumeTask,
  setReviewGate,
  setState,
  syncIndex,
  taskPath,
  tasksDir,
  validateWorkspace,
};
