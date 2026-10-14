"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");

const STATE_DISPLAY = {
  pending: "Pending",
  in_progress: "In Progress",
  in_review: "In Review",
  completed: "Completed",
  blocked: "Blocked",
  cancelled: "Cancelled",
};
const DISPLAY_STATE = Object.fromEntries(Object.entries(STATE_DISPLAY).map(([key, value]) => [value, key]));
const KINDS = new Set(["task", "plan", "queue"]);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TIMESTAMP_PATTERN = "\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01]) (?:[01]\\d|2[0-3]):[0-5]\\d";
const STATUS_PATTERN = new RegExp(`^Status: (${Object.values(STATE_DISPLAY).join("|")}) \\((${TIMESTAMP_PATTERN})\\)$`, "m");
const ARTIFACTS_FIELD_PATTERN = /^(Status: [^\r\n]+\r?\n)Artifacts: \[Artifacts\]\(\.\.\/artifacts\/[a-z0-9]+(?:-[a-z0-9]+)*\/\)\r?\n/m;
const TARGET_PATTERN = /^\s*- \[([ xX])] (T\d+):\s*(.+)$/;
const RESULT_PATTERN = /^\s*- (T\d+):\s*(.+)$/;
const REVIEW_PATTERN = /^\s*- Review gate: (Skipped|Required|Passed|Approved) — (.+)$/m;
const VERIFICATION_PATTERN = /^\s*- (Passed|Failed):\s*(.+)$/m;
const REVIEW_LEDGER_SCHEMA = "task-review-ledger/v1";
const REVIEW_LEDGER_ENTRY_PATTERN = /^- `(TR-([1-9]\d*))` \| no-progress=([012]) \| (.+) \| (.+)$/;
const HTML_BLOCK_TAGS = new Set("address article aside base basefont blockquote body caption center col colgroup dd details dialog dir div dl dt fieldset figcaption figure footer form frame frameset h1 h2 h3 h4 h5 h6 head header hr html iframe legend li link main menu menuitem nav noframes ol optgroup option p param search section summary table tbody td tfoot th thead title tr track ul".split(" "));

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

function normalizeKind(kind, allowLegacyAuto = false) {
  const value = String(kind || "task").toLowerCase();
  if (allowLegacyAuto && value === "auto") return "queue";
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

function normalizedTitle(title) {
  return title.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeMetadata(text) {
  const sectionStart = text.search(/^## /m);
  const headerEnd = sectionStart === -1 ? text.length : sectionStart;
  const header = text.slice(0, headerEnd).replace(
    /^\| Field \| Value \|\r?\n\| --- \| --- \|\r?\n((?:\| (?:Status|Artifacts|Kind|Parent) \| [^\r\n]* \|\r?\n)+)/m,
    (_table, rows) => rows.replace(/^\| (Status|Artifacts|Kind|Parent) \| (.*) \|\r?\n/gm, "$1: $2\n"),
  );
  return header + text.slice(headerEnd);
}

function renderMetadata(text) {
  text = normalizeMetadata(text);
  const sectionStart = text.search(/^## /m);
  const headerEnd = sectionStart === -1 ? text.length : sectionStart;
  const header = text.slice(0, headerEnd);
  const fields = [...header.matchAll(/^(Status|Artifacts|Kind|Parent): (.+)\r?\n/gm)];
  const table = ["| Field | Value |", "| --- | --- |", ...fields.map(([, name, value]) => `| ${name} | ${value} |`)].join("\n");
  let inserted = false;
  return header.replace(/^(Status|Artifacts|Kind|Parent): (.+)\r?\n/gm, () => {
    if (inserted) return "";
    inserted = true;
    return `${table}\n`;
  }) + text.slice(headerEnd);
}

function statusOf(text) {
  const match = normalizeMetadata(text).match(STATUS_PATTERN);
  if (!match) throw new Error("canonical task is missing a standard status line");
  return { display: match[1], state: DISPLAY_STATE[match[1]], timestamp: match[2] };
}

function fieldOf(text, name) {
  return normalizeMetadata(text).match(new RegExp(`^${name}: (.+)$`, "m"))?.[1]?.trim();
}

function markdownLineContext(source) {
  let outerColumns = 0;
  let offset = 0;
  while (source[offset] === " " || source[offset] === "\t") {
    outerColumns = source[offset] === " " ? outerColumns + 1 : outerColumns + 4 - (outerColumns % 4);
    offset += 1;
  }
  let line = source.slice(offset);
  let quoteDepth = 0;
  while (line.startsWith(">")) {
    quoteDepth += 1;
    line = line.slice(1).replace(/^[ \t]?/, "");
  }
  let innerColumns = 0;
  let innerOffset = 0;
  while (line[innerOffset] === " " || line[innerOffset] === "\t") {
    innerColumns = line[innerOffset] === " " ? innerColumns + 1 : innerColumns + 4 - (innerColumns % 4);
    innerOffset += 1;
  }
  line = line.slice(innerOffset);
  const columns = quoteDepth > 0 ? innerColumns : outerColumns;
  let payload = line;
  let listIndent;
  let listMarker = false;
  const list = payload.match(/^([-+*]|\d{1,9}[.)])([ \t]+)(.*)$/);
  if (list) {
    listMarker = true;
    listIndent = columns + list[1].length;
    for (const character of list[2]) {
      listIndent = character === " " ? listIndent + 1 : listIndent + 4 - (listIndent % 4);
    }
    payload = list[3];
  }
  return { columns, container: quoteDepth > 0 || listMarker, line, listIndent, listMarker, outerColumns, payload, quoteDepth };
}

function visibleMarkdownLines(lines) {
  const visible = [];
  let activeLists = [];
  let fence;
  let html;
  for (let index = 0; index < lines.length; index += 1) {
    const context = markdownLineContext(lines[index]);
    if (fence) {
      let closing;
      if (fence.listIndent !== undefined) {
        if (context.quoteDepth === fence.quoteDepth && !context.listMarker && context.columns >= fence.listIndent && context.columns <= fence.listIndent + 3) {
          closing = context.line.match(/^(`{3,}|~{3,})[ \t]*$/);
        } else if (context.quoteDepth < fence.quoteDepth
          || (context.quoteDepth === fence.quoteDepth && context.columns < fence.listIndent && context.line.trim())
          || (context.quoteDepth > fence.quoteDepth && context.outerColumns < fence.listIndent && context.line.trim())) {
          fence = undefined;
          index -= 1;
          continue;
        }
      } else if (context.quoteDepth === fence.quoteDepth && !context.listMarker && context.columns <= 3) {
        closing = context.payload.match(/^(`{3,}|~{3,})[ \t]*$/);
      } else if (fence.quoteDepth > 0 && context.quoteDepth < fence.quoteDepth && context.line.trim()) {
        fence = undefined;
        index -= 1;
        continue;
      }
      if (closing && closing[1][0] === fence.character && closing[1].length >= fence.length) fence = undefined;
      continue;
    }
    if (html) {
      if (html.listIndent !== undefined
        && (context.quoteDepth < html.quoteDepth
          || (context.quoteDepth === html.quoteDepth && context.columns < html.listIndent && context.line.trim())
          || (context.quoteDepth > html.quoteDepth && context.outerColumns < html.listIndent && context.line.trim()))) {
        html = undefined;
        index -= 1;
        continue;
      }
      if (html.listIndent === undefined && html.quoteDepth > 0
        && context.quoteDepth < html.quoteDepth && context.line.trim()) {
        html = undefined;
        index -= 1;
        continue;
      }
      const sameContainer = context.quoteDepth === html.quoteDepth && !context.listMarker
        && (html.listIndent === undefined || context.columns >= html.listIndent);
      if (html.untilBlank ? !context.payload.trim() : sameContainer && html.end.test(context.payload)) html = undefined;
      continue;
    }
    if (context.columns >= 4 && activeLists.length === 0) continue;
    activeLists = activeLists.filter(({ indent, quoteDepth }) => quoteDepth <= context.quoteDepth
      && (quoteDepth === context.quoteDepth || context.outerColumns >= indent));
    let effectiveListIndent;
    if (context.listMarker) {
      activeLists = activeLists.filter(({ indent, quoteDepth }) => quoteDepth !== context.quoteDepth || indent <= context.columns);
      activeLists.push({ indent: context.listIndent, quoteDepth: context.quoteDepth });
      effectiveListIndent = context.listIndent;
    } else {
      effectiveListIndent = activeLists
        .filter(({ indent, quoteDepth }) => quoteDepth === context.quoteDepth && indent <= context.columns)
        .reduce((deepest, { indent }) => Math.max(deepest, indent), 0) || undefined;
      if (context.line.trim()) {
        activeLists = activeLists.filter(({ indent, quoteDepth }) => quoteDepth < context.quoteDepth
          || (quoteDepth === context.quoteDepth && indent <= context.columns));
      }
    }
    const opening = context.payload.match(/^(`{3,}|~{3,})(.*)$/);
    if (opening && !(opening[1][0] === "`" && opening[2].includes("`"))) {
      fence = {
        character: opening[1][0],
        length: opening[1].length,
        listIndent: effectiveListIndent,
        quoteDepth: context.quoteDepth,
      };
      continue;
    }
    if (/^<!--/.test(context.payload)) {
      if (!context.payload.includes("-->")) html = {
        end: /-->/,
        listIndent: effectiveListIndent,
        quoteDepth: context.quoteDepth,
      };
      continue;
    }
    const rawTag = context.payload.match(/^<(pre|script|style|textarea)(?:[ \t>]|$)/i)?.[1];
    if (rawTag) {
      const end = new RegExp(`</${rawTag}[ \t]*>`, "i");
      if (!end.test(context.payload)) html = {
        end,
        listIndent: effectiveListIndent,
        quoteDepth: context.quoteDepth,
      };
      continue;
    }
    const blockTag = context.payload.match(/^<\/?([A-Za-z][A-Za-z0-9-]*)(?:[ \t/>]|$)/)?.[1]?.toLowerCase();
    if (HTML_BLOCK_TAGS.has(blockTag)) {
      html = {
        listIndent: effectiveListIndent,
        quoteDepth: context.quoteDepth,
        untilBlank: true,
      };
      continue;
    }
    visible.push({ ...context, index });
  }
  return visible;
}

function sectionsOf(text, name) {
  const lines = text.replace(/\s+$/, "").split(/\r?\n/);
  const headings = visibleMarkdownLines(lines).flatMap(({ columns, container, line, index }) => {
    if (columns !== 0 || container) return [];
    const match = line.match(/^(#{1,6})(?:[ \t]+(.*))?$/);
    if (!match || match[1].length !== 2) return [];
    const title = (match[2] || "").replace(/[ \t]+#+[ \t]*$/, "").trim().toLowerCase();
    return [{ index, title }];
  });
  return headings.filter(({ title }) => title === name.toLowerCase()).map(({ index: start }) => {
    const end = headings.find(({ index }) => index > start)?.index ?? lines.length;
    return { lines, start, end, body: lines.slice(start + 1, end).filter((line) => line.trim()) };
  });
}

function section(text, name) {
  return sectionsOf(text, name)[0];
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
  text = normalizeMetadata(text);
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

function invalidateReviewGate(text, evidence) {
  const assessment = section(text, "Review Assessment");
  if (assessment) {
    text = replaceSection(text, "Review Assessment", assessment.body.map((line) =>
      line === "- State: Current" ? "- State: Stale" : line));
  }
  const review = text.match(REVIEW_PATTERN);
  if (review?.[1] === "Skipped") {
    const result = section(text, "Result");
    text = replaceSection(text, "Result", result.body.filter((line) => !REVIEW_PATTERN.test(line)));
  } else if (["Passed", "Approved"].includes(review?.[1])) {
    text = text.replace(REVIEW_PATTERN, `- Review gate: Required — ${evidence}`);
  }
  return replaceSection(text, "Verification", undefined);
}

const REVIEW_ASSESSMENT_SCHEMA = "task-review-assessment/v1";
const REVIEW_ASSESSMENT_FIELDS = {
  reason: "Reason", snapshot: "Snapshot", evidence: "Evidence",
  clarity: "Result clarity", impact: "Bounded impact", risk: "Low risk", verification: "Sufficient verification",
};

function reviewAssessmentOf(text) {
  const sections = sectionsOf(text, "Review Assessment");
  if (sections.length > 1) throw new Error("duplicate Review Assessment section");
  if (!sections.length) return undefined;
  const fields = new Map();
  const allowed = new Set(["Schema", "Level", "State", "Task fingerprint", ...Object.values(REVIEW_ASSESSMENT_FIELDS)]);
  for (const line of sections[0].body) {
    const match = line.match(/^- ([A-Za-z ]+): (\S.*)$/);
    if (!match || !allowed.has(match[1]) || fields.has(match[1])) throw new Error("invalid Review Assessment field");
    fields.set(match[1], match[2].trim());
  }
  if (fields.get("Schema") !== REVIEW_ASSESSMENT_SCHEMA) throw new Error("unsupported Review Assessment schema");
  const level = fields.get("Level");
  if (!["R0", "R1", "R2"].includes(level)) throw new Error("invalid Review Assessment level");
  if (!["Current", "Stale"].includes(fields.get("State"))) throw new Error("invalid Review Assessment state");
  if (!/^[a-f0-9]{64}$/.test(fields.get("Task fingerprint") || "")) throw new Error("invalid Review Assessment fingerprint");
  for (const key of level === "R1" ? Object.keys(REVIEW_ASSESSMENT_FIELDS) : ["reason", "snapshot", "evidence"]) {
    if (!fields.get(REVIEW_ASSESSMENT_FIELDS[key])) throw new Error(`Review Assessment requires ${REVIEW_ASSESSMENT_FIELDS[key]}`);
  }
  return {
    level,
    state: fields.get("State"),
    fingerprint: fields.get("Task fingerprint"),
    ...Object.fromEntries(Object.entries(REVIEW_ASSESSMENT_FIELDS).map(([key, label]) => [key, fields.get(label)])),
  };
}

function withoutArtifactsLink(text) {
  const sectionStart = text.search(/^## /m);
  const headerEnd = sectionStart === -1 ? text.length : sectionStart;
  return text.slice(0, headerEnd).replace(ARTIFACTS_FIELD_PATTERN, "$1") + text.slice(headerEnd);
}

function reviewTaskFingerprint(text) {
  text = normalizeMetadata(text);
  for (const name of ["Review Assessment", "Review", "Review Reports", "Verification", "Block"]) text = replaceSection(text, name, undefined);
  const result = section(text, "Result");
  if (result) text = replaceSection(text, "Result", result.body.filter((line) => !REVIEW_PATTERN.test(line)));
  text = withoutArtifactsLink(text);
  text = text.replace(STATUS_PATTERN, "").replace(/\n{3,}/g, "\n\n").trim();
  return createHash("sha256").update(text).digest("hex");
}

function requireCurrentReviewAssessment(task) {
  const assessment = task.reviewAssessment;
  if (!assessment) throw new Error("record a Review Assessment with assess-review before a terminal review gate or completion");
  if (assessment.state !== "Current" || assessment.fingerprint !== reviewTaskFingerprint(task.text)) {
    throw new Error("stale Review Assessment; refresh self-check, snapshot, and assess-review");
  }
  return assessment;
}

function recordReviewAssessment(workspace, id, level, options = {}) {
  const task = readTask(workspace, id);
  if (task.status.state !== "in_progress") throw new Error("assess-review requires In Progress");
  const value = String(level || "").toUpperCase();
  if (!["R0", "R1", "R2"].includes(value)) throw new Error(`invalid review level: ${level}`);
  if (value !== "R2" && (task.reviewLedger || (task.reviewAssessment?.level === "R2" && ["Required", "Passed", "Approved"].includes(task.review?.[1])))) {
    throw new Error("cannot downgrade an existing R2 review obligation or unresolved Review ledger");
  }
  const fields = [];
  for (const [key, label] of Object.entries(REVIEW_ASSESSMENT_FIELDS)) {
    const content = String(options[key] || "").trim();
    if (/[\r\n]/.test(content)) throw new Error(`${label} must be one line`);
    if (!content && (value === "R1" || ["reason", "snapshot", "evidence"].includes(key))) throw new Error(`Review Assessment requires ${label}`);
    if (content) fields.push(`- ${label}: ${content}`);
  }
  let text = invalidateReviewGate(task.text, "Review assessment changed; rerun the applicable review");
  text = replaceSection(text, "Review Assessment", [
    `- Schema: ${REVIEW_ASSESSMENT_SCHEMA}`, `- Level: ${value}`, "- State: Current",
    ...fields, `- Task fingerprint: ${reviewTaskFingerprint(text)}`,
  ]);
  return writeTaskAndIndex(workspace, task, text);
}

function reviewLedgerOf(text) {
  const reviewSections = sectionsOf(text, "Review");
  if (reviewSections.length > 1) throw new Error("duplicate Review section");
  const found = reviewSections[0];
  if (!found) return undefined;
  const visibleBody = visibleMarkdownLines(found.lines.slice(found.start + 1, found.end))
    .filter(({ line }) => line.trim());
  const body = visibleBody.map(({ line }) => line);
  const activeItems = [];
  const listItems = [];
  for (const { columns, line, listIndent, outerColumns, quoteDepth } of visibleBody) {
    for (let index = activeItems.length - 1; index >= 0; index -= 1) {
      const item = activeItems[index];
      if (item.quoteDepth < quoteDepth && outerColumns < item.contentIndent) activeItems.splice(index, 1);
    }
    const marker = line.match(/^(?:[-+*]|\d{1,9}[.)])(?:[ \t]+(.*)|[ \t]*)$/);
    if (marker) {
      for (let index = activeItems.length - 1; index >= 0; index -= 1) {
        const item = activeItems[index];
        if (item.quoteDepth > quoteDepth
          || (item.quoteDepth === quoteDepth && item.contentIndent > columns)) activeItems.splice(index, 1);
      }
      const item = { contentIndent: listIndent ?? columns + 2, quoteDepth, text: marker[1] || "" };
      activeItems.push(item);
      listItems.push(item);
    } else {
      const item = activeItems
        .filter(({ contentIndent, quoteDepth: itemQuoteDepth }) => itemQuoteDepth === quoteDepth && contentIndent <= columns)
        .sort((left, right) => right.contentIndent - left.contentIndent)[0];
      if (item) item.text += `\n${line}`;
      if (line.trim()) {
        for (let index = activeItems.length - 1; index >= 0; index -= 1) {
          const active = activeItems[index];
          if (active.quoteDepth > quoteDepth
            || (active.quoteDepth === quoteDepth && active.contentIndent > columns)) activeItems.splice(index, 1);
        }
      }
    }
  }
  const schemaLines = body.filter((line) => /^- Schema: task-review-ledger\//.test(line));
  const hasSchema = listItems.some(({ text }) => /\bSchema\b/i.test(text) && /task-review-ledger(?:\/|\b)/i.test(text));
  const hasPass = listItems.some(({ text }) => /^\s*Pass\b/i.test(text));
  const hasNextFinding = listItems.some(({ text }) => /^\s*Next\s+finding\b/i.test(text));
  const hasFinding = listItems.some(({ text }) => /\bTR-[1-9]\d*\b/i.test(text) && /\bno-progress\b/i.test(text));
  if (!hasSchema && !(hasPass && hasNextFinding) && !hasFinding) return undefined;
  if (schemaLines.length !== 1) throw new Error("invalid task-review ledger schema marker");
  if (schemaLines[0] !== `- Schema: ${REVIEW_LEDGER_SCHEMA}`) throw new Error(`unsupported Review ledger schema: ${schemaLines[0].slice("- Schema: ".length)}`);

  const passes = body.map((line) => line.match(/^- Pass: ([1-9]\d*)$/)).filter(Boolean);
  const nextFindings = body.map((line) => line.match(/^- Next finding: ([1-9]\d*)$/)).filter(Boolean);
  const entries = body.map((line) => line.match(REVIEW_LEDGER_ENTRY_PATTERN)).filter(Boolean).map((match) => ({
    id: match[1],
    number: Number(match[2]),
    noProgress: Number(match[3]),
    location: match[4],
    requiredOutcome: match[5],
  }));
  if (passes.length !== 1 || nextFindings.length !== 1 || entries.length === 0
    || 1 + passes.length + nextFindings.length + entries.length !== body.length) {
    throw new Error("invalid task-review-ledger/v1 Review section");
  }
  if (new Set(entries.map(({ id }) => id)).size !== entries.length) throw new Error("duplicate Review finding ID");
  const nextFinding = Number(nextFindings[0][1]);
  if (nextFinding <= Math.max(...entries.map(({ number }) => number))) throw new Error("Next finding must exceed every Review finding ID");
  return { pass: Number(passes[0][1]), nextFinding, entries };
}

function stalledReviewIds(task) {
  return task.reviewLedger?.entries.filter(({ noProgress }) => noProgress >= 2).map(({ id }) => id) || [];
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
  const kind = kindValue ? normalizeKind(kindValue, true) : undefined;
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
    reviewAssessment: reviewAssessmentOf(text),
    reviewLedger: reviewLedgerOf(text),
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

function withArtifactsLink(workspace, id, text) {
  assertId(id);
  text = normalizeMetadata(text);
  const directory = path.join(path.resolve(workspace), "tasks", "artifacts", id);
  let exists = false;
  try {
    exists = fs.statSync(directory).isDirectory();
  } catch (error) {
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
  }
  const withoutLink = withoutArtifactsLink(text);
  if (!exists) return withoutLink;
  return withoutLink.replace(STATUS_PATTERN, (status) => `${status}\nArtifacts: [Artifacts](../artifacts/${id}/)`);
}

function writeMany(workspace, changes) {
  const originals = new Map();
  try {
    for (const [file, text] of changes) {
      const output = path.dirname(file) === tasksDir(workspace)
        ? renderMetadata(withArtifactsLink(workspace, path.basename(file, ".md"), text))
        : text;
      originals.set(file, fs.existsSync(file) ? fs.readFileSync(file, "utf8") : undefined);
      atomicWrite(file, output);
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
  if (task.status.state === "completed") throw new Error("reopen a Completed task before syncing specification changes");
  let text = task.text;
  text = invalidateReviewGate(text, "Task record changed before sync; rerun the applicable review");
  text = replaceSection(text, "Verification", undefined);
  const synced = parseTask(task.id, text, task.file);
  writeMany(workspace, [[task.file, text], [indexPath(workspace), updatedIndex(workspace, synced)]]);
  return readTask(workspace, id);
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
  writeMany(workspace, [[file, text], [indexPath(workspace), index]]);
  return readTask(workspace, id);
}

function replaceStatus(text, state, timestamp = localTimestamp()) {
  text = normalizeMetadata(text);
  const current = statusOf(text);
  return text.replace(STATUS_PATTERN, `Status: ${STATE_DISPLAY[state]} (${timestamp})`);
}

function writeTaskAndIndex(workspace, task, text) {
  const parsed = parseTask(task.id, text, task.file);
  const index = updatedIndex(workspace, parsed);
  writeMany(workspace, [[task.file, text], [indexPath(workspace), index]]);
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
  if (state === "in_progress") {
    const stalled = stalledReviewIds(task);
    if (stalled.length) throw new Error(`reset stalled Review findings after the unblock condition before continuing: ${stalled.join(", ")}`);
  }
  if (task.status.state === state) {
    writeMany(workspace, [[task.file, task.text]]);
    return readTask(workspace, id);
  }
  if (!allowed[task.status.state].has(state)) throw new Error(`cannot move ${task.status.display} to ${STATE_DISPLAY[state]}`);
  if (state === "in_progress" && task.targets.length === 0) throw new Error("In Progress requires at least one Target");
  if (state === "in_review" && task.review?.[1] !== "Required") throw new Error("In Review requires a required review gate");
  if (state === "blocked" && !section(task.text, "Block")) throw new Error("Blocked requires an active Block section");
  let text = replaceStatus(task.text, state);
  if (task.status.state === "in_review" && state !== "in_review") {
    text = invalidateReviewGate(text, "Task left In Review; rerun the applicable review after revisions");
    text = replaceSection(text, "Verification", undefined);
  }
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
  const parent = task.parent ? readTask(workspace, task.parent) : undefined;
  if (parent?.status.state === "completed") throw new Error(`reopen parent ${parent.id} before reopening child ${id}`);
  if (parent && !["in_progress", "in_review"].includes(parent.status.state)) {
    throw new Error(`resume parent ${parent.id} before reopening child ${id}`);
  }

  let text = replaceStatus(task.text, "in_progress");
  text = invalidateReviewGate(text, "Task reopened; rerun the applicable review after revisions");
  text = replaceSection(text, "Verification", undefined);
  if (!parent) return writeTaskAndIndex(workspace, task, text);

  let parentText = invalidateReviewGate(parent.text, `Child ${id} reopened; rerun the applicable integration review`);
  parentText = replaceSection(parentText, "Verification", undefined);
  if (parent.status.state === "in_review") parentText = replaceStatus(parentText, "in_progress");
  const reopened = parseTask(task.id, text, task.file);
  const invalidatedParent = parseTask(parent.id, parentText, parent.file);
  let index = updatedIndex(workspace, reopened);
  index = updatedIndex(workspace, invalidatedParent, undefined, index);
  writeMany(workspace, [[task.file, text], [parent.file, parentText], [indexPath(workspace), index]]);
  return readTask(workspace, id);
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
  text = invalidateReviewGate(text, "Result evidence changed after review; rerun the applicable review");
  text = replaceSection(text, "Verification", undefined);
  writeMany(workspace, [[task.file, text]]);
  return readTask(workspace, id);
}

function setReviewGate(workspace, id, decision, evidence, options = {}) {
  const task = readTask(workspace, id);
  if (task.status.state === "completed") throw new Error("reopen the task before changing the review gate");
  const values = { skipped: "Skipped", required: "Required", passed: "Passed", approved: "Approved" };
  const key = String(decision || "").toLowerCase();
  if (!values[key]) throw new Error(`invalid review gate: ${decision}`);
  if (["passed", "approved"].includes(key) && task.status.state !== "in_review") {
    throw new Error(`${values[key]} review gate requires In Review`);
  }
  if (key === "passed" && task.review?.[1] !== "Required") {
    throw new Error("Passed review gate requires a pending Required review");
  }
  if (key === "approved" && !["Required", "Passed"].includes(task.review?.[1])) {
    throw new Error("Approved review gate requires a Required or Passed review");
  }
  const resolveLedger = options.resolveLedger === true;
  if (resolveLedger && (key !== "passed" || !task.reviewLedger)) {
    throw new Error("resolve-ledger requires Passed and an active Review ledger");
  }
  if (options.snapshot !== undefined && !resolveLedger) throw new Error("review snapshot requires resolve-ledger");
  if (resolveLedger && stalledReviewIds(task).length) throw new Error("cannot resolve a stalled Review ledger before its unblock condition");
  if (["passed", "approved"].includes(key) && task.reviewLedger && !resolveLedger) {
    throw new Error("remove the active Review ledger through passed --resolve-ledger after fresh review resolves every finding");
  }
  if (key === "skipped" && task.status.state === "in_review") throw new Error("In Review cannot skip its review gate");
  if (key !== "required") {
    const assessment = requireCurrentReviewAssessment(task);
    if (resolveLedger && options.snapshot !== assessment.snapshot) throw new Error("resolve-ledger requires the current reviewed assessment snapshot");
    if (key === "skipped" && (assessment.level === "R2" || task.reviewLedger || ["Required", "Passed", "Approved"].includes(task.review?.[1]))) {
      throw new Error("cannot skip R2, an existing review obligation, or an unresolved Review ledger");
    }
    if (key === "approved" && assessment.level === "R2" && task.review?.[1] !== "Passed") {
      throw new Error("R2 adversarial approval requires Passed task-review first");
    }
  }
  const value = String(evidence || "").trim();
  if (!value || /[\r\n]/.test(value)) throw new Error("review evidence must be one line");
  const found = section(task.text, "Result");
  const lines = found ? found.body.filter((line) => !/^\s*- Review gate:/.test(line)) : [];
  lines.push(`- Review gate: ${values[key]} — ${value}`);
  let text = resolveLedger ? replaceSection(task.text, "Review", undefined) : task.text;
  text = replaceSection(text, "Result", lines);
  text = replaceSection(text, "Verification", undefined);
  writeMany(workspace, [[task.file, text]]);
  return readTask(workspace, id);
}

function recordVerification(workspace, id, passed, evidence) {
  const task = readTask(workspace, id);
  if (task.status.state === "completed") throw new Error("reopen the task before changing verification");
  const value = String(evidence || "").trim();
  if (!value || /[\r\n]/.test(value)) throw new Error("verification evidence must be one line");
  const text = replaceSection(task.text, "Verification", [`- ${passed ? "Passed" : "Failed"}: ${value}`]);
  writeMany(workspace, [[task.file, text]]);
  return readTask(workspace, id);
}

function linkChild(workspace, parentId, childId) {
  if (parentId === childId) throw new Error("a task cannot be its own child");
  const parent = readTask(workspace, parentId);
  const child = readTask(workspace, childId);
  if (parent.kind !== "queue") throw new Error("parent must be a Queue task");
  if (child.parent && child.parent !== parentId) throw new Error(`${childId} already belongs to ${child.parent}`);
  const existingChild = parent.children.find(({ id }) => id === childId);
  if (existingChild?.title === child.title && child.parent === parentId) {
    writeMany(workspace, [[parent.file, parent.text], [child.file, child.text]]);
    return { parent: readTask(workspace, parentId), child: readTask(workspace, childId) };
  }
  if (parent.status.state === "completed") throw new Error("reopen the Queue parent before changing its graph");
  if (child.status.state === "completed") throw new Error(`reopen Completed child ${childId} before changing its relationship`);

  const childTitle = normalizedTitle(child.title);
  if (childTitle === normalizedTitle(parent.title)) throw new Error("Queue parent and children need distinct titles");
  for (const sibling of parent.children) {
    if (sibling.id !== childId && normalizedTitle(readTask(workspace, sibling.id).title) === childTitle) {
      throw new Error("Queue children need distinct titles");
    }
  }

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
  parentText = invalidateReviewGate(parentText, "Queue graph changed after review; rerun the applicable review");
  parentText = replaceSection(parentText, "Verification", undefined);
  const childText = invalidateReviewGate(setField(child.text, "Parent", parentId), "Parent link changed; refresh assessment and review");
  writeMany(workspace, [[parent.file, parentText], [child.file, childText]]);
  return { parent: readTask(workspace, parentId), child: readTask(workspace, childId) };
}

function nextChild(workspace, parentId) {
  const parent = readTask(workspace, parentId);
  if (parent.kind !== "queue") throw new Error("parent must be a Queue task");
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
  if (!task.review || !["Skipped", "Passed", "Approved"].includes(task.review[1])) {
    throw new Error("completion requires a skipped, passed, or approved review gate");
  }
  const completedReview = ["Passed", "Approved"].includes(task.review[1]);
  if (task.status.state === "in_review" && !completedReview) throw new Error("In Review completion requires a passed or approved review gate");
  if (completedReview && task.status.state !== "in_review") throw new Error("passed or approved review must complete from In Review");
  if (!task.verification || task.verification[1] !== "Passed") throw new Error("completion requires passed verification evidence");
  if (task.reviewLedger) throw new Error("an active Review ledger blocks completion");
  if (section(task.text, "Block")) throw new Error("a blocked task cannot be completed");
  const assessment = requireCurrentReviewAssessment(task);
  if (assessment.level === "R2" && task.review[1] === "Skipped") throw new Error("R2 cannot complete with skipped review");
  if (task.kind === "queue") {
    if (task.children.length === 0) throw new Error("a Queue task needs at least one child");
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
    if (!fieldOf(text, "Kind")) continue;
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
    const queueTitles = task.kind === "queue" ? new Map([[normalizedTitle(task.title), task.id]]) : undefined;
    for (const child of task.children) {
      const record = modern.get(child.id);
      if (!record) errors.push(`${task.id}: missing child ${child.id}`);
      else {
        if (record.parent !== task.id) errors.push(`${task.id}: child link is not reciprocal for ${child.id}`);
        const key = normalizedTitle(record.title);
        if (queueTitles?.has(key)) errors.push(`${task.id}: duplicate Queue title for ${child.id}`);
        else queueTitles?.set(key, child.id);
      }
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
  recordReviewAssessment,
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
