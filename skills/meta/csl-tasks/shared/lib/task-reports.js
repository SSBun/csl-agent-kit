"use strict";

const fs = require("node:fs");
const { createHash } = require("node:crypto");
const topics = require("./topic-core.js");
const core = () => require("./task-core.js");
const SCHEMA = "- Schema: task-review-reports/v1";
const HASH = /^[a-f0-9]{64}$/;
const OUTCOMES = new Set(["findings", "no blocking findings", "incomplete", "invalidated by drift"]);
const MODES = new Set(["independent subagent", "non-independent self-review", "incomplete"]);
const digest = (text) => createHash("sha256").update(text).digest("hex");

function tableLine(value, name) {
  if (typeof value !== "string" || !value.trim() || /[\r\n|]/.test(value)) throw new Error(`${name} must be one non-empty table-safe line`);
  return value.trim();
}

function reportsOf(task) {
  const sections = core().sectionsOf(task.text, "Review Reports");
  if (sections.length > 1) throw new Error("duplicate Review Reports section");
  if (!sections.length) return { managed: false, rows: [], legacyNotes: [] };
  const body = sections[0].body;
  const schemas = body.filter((line) => /^- Schema:/.test(line));
  if (schemas.length && (schemas.length !== 1 || schemas[0] !== SCHEMA)) throw new Error("unsupported Review Reports schema");
  const managed = schemas.length === 1;
  const rows = [];
  const legacyNotes = [];
  for (const line of body) {
    if (line === SCHEMA || /^\| (?:Round |---)/.test(line)) continue;
    if (!line.startsWith("|")) {
      if (managed) throw new Error("invalid managed Review Reports row");
      legacyNotes.push(line);
      continue;
    }
    const fields = line.split("|").slice(1, -1).map((part) => part.trim());
    if (fields.length !== (managed ? 5 : 4) || !/^\d+$/.test(fields[0]) || Number(fields[0]) < 1 || !Number.isSafeInteger(Number(fields[0]))) {
      throw new Error("invalid Review Reports table row");
    }
    const [, link, snapshot, outcome, hash] = fields;
    const target = link.match(/^\[[^\]]+\]\(([^)]+)\)$/)?.[1];
    const expected = `../artifacts/${task.id}/reviews/round-${fields[0]}.md`;
    if (!target || target !== expected || !snapshot || !outcome || (managed && hash !== "legacy" && !HASH.test(hash))) {
      throw new Error("invalid Review Reports link, snapshot, outcome or digest");
    }
    if (rows.some((row) => row.round === Number(fields[0]))) throw new Error("duplicate Review Reports round");
    rows.push({ round: Number(fields[0]), number: fields[0], target, snapshot, outcome, hash: hash || "legacy" });
  }
  return { managed, rows, legacyNotes };
}

function renderReports(rows) {
  return [SCHEMA, "", "| Round | Report | Snapshot | Outcome | SHA256 |", "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${row.number} | [Round ${row.number}](${row.target}) | ${row.snapshot} | ${row.outcome} | ${row.hash} |`)];
}

function reportHeader(taskId, number, snapshot, fingerprint, outcome, mode, run) {
  return `# Review round ${number}\n\n- Schema: task-review-report/v1\n- Task: ${taskId}\n- Round: ${number}\n- Snapshot: ${snapshot}\n- Task fingerprint: ${fingerprint}\n- Outcome: ${outcome}\n- Mode: ${mode}\n- Run: ${run}\n\n## Reviewer feedback\n\n`;
}

function readReport(text, taskId, number) {
  const metadata = text.match(/^# Review round [0-9]+\n\n- Schema: task-review-report\/v1\n- Task: [a-z0-9-]+\n- Round: [0-9]+\n- Snapshot: ([^\n]+)\n- Task fingerprint: ([a-f0-9]{64})\n- Outcome: ([^\n]+)\n- Mode: ([^\n]+)\n- Run: ([^\n]+)\n\n## Reviewer feedback\n\n/);
  if (!metadata) throw new Error(`invalid managed report header: round ${number}`);
  const [, snapshot, fingerprint, outcome, mode, run] = metadata;
  if (!OUTCOMES.has(outcome) || !MODES.has(mode) || !text.startsWith(reportHeader(taskId, number, snapshot, fingerprint, outcome, mode, run))
    || !text.slice(metadata[0].length).trim()) throw new Error(`review report metadata mismatch: round ${number}`);
  return { snapshot, fingerprint, outcome, mode, run };
}

function prepareReport(workspace, task, { feedback, snapshot, outcome, mode, run = "unavailable", existingRound }) {
  const { rows, legacyNotes } = reportsOf(task);
  if (legacyNotes.length) throw new Error("Review Reports contains legacy notes; preserve them outside this section before migrating");
  const fingerprint = task.reviewAssessment?.fingerprint;
  if (!HASH.test(fingerprint || "")) throw new Error("review report requires a current Task fingerprint");
  if (existingRound !== undefined) {
    if (!/^\d{2,}$/.test(existingRound) || !Number.isSafeInteger(Number(existingRound)) || Number(existingRound) < 1) throw new Error("invalid existing report round");
    const relative = `tasks/artifacts/${task.id}/reviews/round-${existingRound}.md`;
    const file = topics.safePath(workspace, relative);
    const bytes = fs.readFileSync(file);
    const text = bytes.toString("utf8");
    const metadata = readReport(text, task.id, existingRound);
    if (metadata.fingerprint !== fingerprint) throw new Error("existing report Task fingerprint must match the current assessment");
    const row = { round: Number(existingRound), number: existingRound, target: `../artifacts/${task.id}/reviews/round-${existingRound}.md`, snapshot: metadata.snapshot, outcome: metadata.outcome, hash: digest(bytes) };
    const prior = rows.find((item) => item.round === row.round);
    if (prior && JSON.stringify(prior) !== JSON.stringify(row)) throw new Error("existing report conflicts with its index row");
    return { file, text, relative, row, existing: true, taskText: core().replaceSection(task.text, "Review Reports", renderReports(prior ? rows : [...rows, row])) };
  }
  snapshot = tableLine(snapshot, "report snapshot");
  if (!OUTCOMES.has(outcome)) throw new Error("invalid report outcome");
  if (!MODES.has(mode)) throw new Error("report mode must describe the actual review execution");
  run = tableLine(run, "report run");
  if (typeof feedback !== "string" || !feedback.trim()) throw new Error("review feedback must not be empty");
  const directory = topics.safePath(workspace, `tasks/artifacts/${task.id}/reviews`);
  const files = fs.existsSync(directory) ? fs.readdirSync(directory) : [];
  const rounds = files.flatMap((file) => {
    const match = file.match(/^round-(\d+)\.md$/);
    if (!match) return [];
    const value = Number(match[1]);
    if (!Number.isSafeInteger(value)) throw new Error("invalid existing review round number");
    return [value];
  });
  const round = Math.max(0, ...rows.map((row) => row.round), ...rounds) + 1;
  if (!Number.isSafeInteger(round)) throw new Error("review round limit exceeded");
  const number = String(round).padStart(2, "0");
  const relative = `tasks/artifacts/${task.id}/reviews/round-${number}.md`;
  const file = topics.safePath(workspace, relative);
  if (fs.existsSync(file)) throw new Error("review report already exists");
  const text = reportHeader(task.id, number, snapshot, fingerprint, outcome, mode, run) + feedback;
  const row = { round, number, target: `../artifacts/${task.id}/reviews/round-${number}.md`, snapshot, outcome, hash: digest(text) };
  return { file, text, relative, row, taskText: core().replaceSection(task.text, "Review Reports", renderReports([...rows, row])) };
}

function verifyReports(workspace, task, { requirePassed = false, includeLegacy = false } = {}) {
  const { managed, rows } = reportsOf(task);
  let checked = 0;
  for (const row of rows) {
    if (row.hash === "legacy" && !includeLegacy) continue;
    const file = topics.safePath(workspace, `tasks/artifacts/${task.id}/reviews/round-${row.number}.md`);
    const bytes = fs.readFileSync(file);
    if (row.hash !== "legacy") {
      if (digest(bytes) !== row.hash) throw new Error(`review report content changed: round ${row.number}`);
      const metadata = readReport(bytes.toString("utf8"), task.id, row.number);
      if (metadata.snapshot !== row.snapshot || metadata.outcome !== row.outcome) throw new Error(`review report metadata mismatch: round ${row.number}`);
      row.mode = metadata.mode;
      row.fingerprint = metadata.fingerprint;
    }
    checked++;
  }
  if (requirePassed) {
    const current = rows.filter((row) => row.snapshot === task.reviewAssessment?.snapshot
      && row.fingerprint === task.reviewAssessment?.fingerprint).sort((a, b) => b.round - a.round)[0];
    if (!current || current.hash === "legacy" || current.outcome !== "no blocking findings" || current.mode !== "independent subagent") {
      throw new Error("record a verified no-blocking-findings report for the current snapshot and Task fingerprint before Passed");
    }
  }
  return { managed, checked, legacy: rows.filter((row) => row.hash === "legacy").length };
}

module.exports = { prepareReport, reportsOf, verifyReports };
