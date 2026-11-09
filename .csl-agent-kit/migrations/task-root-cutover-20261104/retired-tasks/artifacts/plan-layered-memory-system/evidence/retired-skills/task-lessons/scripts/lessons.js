#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const SECTION_NAMES = ["Trigger", "Rule", "Check"];
const V1_HEADING = /^## (L-\d{8}-[a-z0-9]+(?:-[a-z0-9]+)*) — (.+)$/;

function unique(items) {
  return [...new Set(items)];
}

function diagnostic(code, message, record, line = record.startLine) {
  return { code, message, id: record.id, line };
}

function splitRecords(markdown) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) starts.push(index);
  }

  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    return {
      heading: lines[start],
      lines: lines.slice(start + 1, end),
      raw: lines.slice(start, end).join("\n").trimEnd(),
      startLine: start + 1,
    };
  });
}

function parseV1(record) {
  const heading = record.heading.match(V1_HEADING);
  const fallbackId = record.heading.slice(3).split(/\s+/)[0] || `invalid-v1-${record.startLine}`;
  record.id = heading?.[1] ?? fallbackId;
  record.title = heading?.[2] ?? record.heading.slice(3);
  record.format = "v1";

  const errors = [];
  if (!heading) errors.push(diagnostic("invalid-id", "expected `L-YYYYMMDD-ascii-slug — Title`", record));

  const markers = [];
  for (let index = 0; index < record.lines.length; index += 1) {
    const match = record.lines[index].match(/^### (.+)$/);
    if (match) markers.push({ name: match[1], index, line: record.startLine + index + 1 });
  }

  if (markers.map(({ name }) => name).join("\0") !== SECTION_NAMES.join("\0")) {
    errors.push(diagnostic("section-order", "expected exactly `Trigger`, `Rule`, `Check` in that order", record));
  }

  const firstMarker = markers[0]?.index ?? record.lines.length;
  if (record.lines.slice(0, firstMarker).some((line) => line.trim())) {
    errors.push(diagnostic("unexpected-content", "content before `### Trigger` is not allowed", record));
  }

  const fields = { Trigger: [], Rule: [], Check: [] };
  for (const name of SECTION_NAMES) {
    const markerIndexes = markers.filter((marker) => marker.name === name);
    if (markerIndexes.length !== 1) {
      errors.push(diagnostic("missing-or-duplicate-section", `expected one \`### ${name}\` section`, record));
      continue;
    }

    const marker = markerIndexes[0];
    const next = markers.find((candidate) => candidate.index > marker.index)?.index ?? record.lines.length;
    for (let index = marker.index + 1; index < next; index += 1) {
      const line = record.lines[index];
      if (!line.trim()) continue;
      const item = line.match(/^-\s+(\S.*)$/);
      if (item) {
        fields[name].push(item[1]);
        continue;
      }
      const code = /^\s+[-*+]\s+/.test(line) ? "non-flat-list" : "invalid-section-content";
      errors.push(diagnostic(code, `${name} must contain only flat \`- item\` entries`, record, record.startLine + index + 1));
    }
    if (fields[name].length === 0) {
      errors.push(diagnostic("empty-section", `${name} requires at least one list item`, record, marker.line));
    }
  }

  record.triggers = fields.Trigger;
  record.rules = fields.Rule;
  record.checks = fields.Check;
  return errors;
}

function parseLegacy(record) {
  record.id = `legacy-${crypto.createHash("sha256").update(record.raw).digest("hex").slice(0, 12)}`;
  record.title = record.heading.slice(3).trim();
  record.format = "legacy";

  const fields = { Trigger: [], Rule: [], Check: [] };
  let current = null;
  for (const source of record.lines) {
    const line = source.trim();
    const section = line.match(/^### (Trigger|Rule|Check)$/);
    if (section) {
      current = section[1];
      continue;
    }
    if (/^### /.test(line)) {
      current = null;
      continue;
    }

    const label = line.match(/^-\s+\*\*([^*]+):\*\*\s*(.*)$/);
    if (label) {
      current = SECTION_NAMES.includes(label[1]) ? label[1] : null;
      if (current && label[2]) fields[current].push(label[2]);
      continue;
    }

    if (!current) continue;
    const item = line.match(/^[-*+]\s+(.+)$/);
    if (item) fields[current].push(item[1]);
  }

  record.triggers = unique([...fields.Trigger, ...fields.Rule]);
  record.rules = fields.Rule;
  record.checks = fields.Check;
  return [];
}

function parseLessons(markdown) {
  const records = splitRecords(markdown);
  const errors = [];
  const warnings = [];

  for (const record of records) {
    if (/^## [Ll]-/.test(record.heading)) {
      errors.push(...parseV1(record));
    } else {
      parseLegacy(record);
      warnings.push(diagnostic("legacy-record", "legacy record remains readable but is not v1", record));
    }
  }

  const byId = new Map();
  for (const record of records) {
    const matches = byId.get(record.id) ?? [];
    matches.push(record);
    byId.set(record.id, matches);
  }
  for (const [id, matches] of byId) {
    if (matches.length < 2) continue;
    for (const record of matches) {
      errors.push(diagnostic("duplicate-id", `duplicate lesson ID: ${id}`, record));
    }
  }

  return { records, errors, warnings };
}

function readLessons(workspace) {
  const file = path.join(path.resolve(workspace), "tasks", "lessons.md");
  try {
    return { file, markdown: fs.readFileSync(file, "utf8") };
  } catch (error) {
    if (error.code === "ENOENT") return { file, markdown: "" };
    throw error;
  }
}

function indexPayload(parsed) {
  return {
    schema: "csl-lessons.index/v1",
    lessons: parsed.records.map(({ id, title, format, triggers }) => ({ id, title, format, triggers })),
  };
}

function showPayload(parsed, ids) {
  const records = [];
  const errors = [];
  for (const id of unique(ids)) {
    const matches = parsed.records.filter((record) => record.id === id);
    if (matches.length === 0) {
      errors.push({ code: "unknown-id", message: `unknown lesson ID: ${id}`, id });
    } else if (matches.length > 1) {
      errors.push({ code: "duplicate-id", message: `lesson ID is ambiguous: ${id}`, id });
    } else {
      const { title, format, triggers, rules, checks } = matches[0];
      records.push({ id, title, format, triggers, rules, checks });
    }
  }
  return { payload: { schema: "csl-lessons.records/v1", lessons: records }, errors };
}

function validationPayload(parsed) {
  return {
    schema: "csl-lessons.validation/v1",
    valid: parsed.errors.length === 0,
    errors: parsed.errors,
    warnings: parsed.warnings,
  };
}

function parseArguments(args) {
  if (args.length === 1 && args[0] === "--self-test") return { selfTest: true };

  const positional = [];
  let workspace = null;
  let help = false;
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--help") {
      help = true;
    } else if (argument === "--workspace") {
      workspace = args[index + 1];
      if (!workspace) throw new Error("--workspace requires a path");
      index += 1;
    } else if (argument.startsWith("--")) {
      throw new Error(`unknown option: ${argument}`);
    } else {
      positional.push(argument);
    }
  }

  if (help) return { help: true };
  if (!workspace) throw new Error("--workspace is required");
  const [command, ...ids] = positional;
  if (!command || !["index", "show", "validate"].includes(command)) {
    throw new Error("command must be `index`, `show`, or `validate`");
  }
  if (command === "show" && ids.length === 0) throw new Error("show requires at least one lesson ID");
  if (command !== "show" && ids.length > 0) throw new Error(`${command} does not accept lesson IDs`);
  return { command, ids, workspace };
}

function printDiagnostics(items, io) {
  for (const item of items) {
    const location = item.line ? `line ${item.line}: ` : "";
    io.error(`[${item.code}] ${location}${item.message}`);
  }
}

function selfTest() {
  const parsed = parseLessons(`# Lessons

## L-20260809-shared-format — Shared format

### Trigger
- Changing a shared format.

### Rule
- Update all readers.

### Check
- Producer and consumer tests pass.

## 2026-08-01 Legacy rule

- **Trigger:**
  - Editing a legacy file.
- **Rule:**
  - Preserve compatibility.
`);
  assert.equal(parsed.errors.length, 0);
  assert.equal(parsed.records.length, 2);
  assert.deepEqual(parsed.records[0].checks, ["Producer and consumer tests pass."]);
  assert.deepEqual(parsed.records[1].triggers, ["Editing a legacy file.", "Preserve compatibility."]);
  assert.match(parsed.records[1].id, /^legacy-[a-f0-9]{12}$/);

  const malformed = parseLessons(`# Lessons

## L-bad — Broken

### Rule
- Run checks.

### Trigger
  - Nested item.

### Check
`);
  const codes = new Set(malformed.errors.map(({ code }) => code));
  assert.ok(codes.has("invalid-id"));
  assert.ok(codes.has("section-order"));
  assert.ok(codes.has("non-flat-list"));
  assert.ok(codes.has("empty-section"));

  const duplicate = parseLessons(`${parsed.records[0].raw}\n\n${parsed.records[0].raw}\n`);
  assert.ok(duplicate.errors.some(({ code }) => code === "duplicate-id"));
}

function run(args, io = console) {
  let options;
  try {
    options = parseArguments(args);
  } catch (error) {
    io.error(`Error: ${error.message}`);
    return 2;
  }

  if (options.help) {
    io.log("Usage: node lessons.js --workspace <workspace> index|show <id>...|validate\n       node lessons.js --self-test");
    return 0;
  }
  if (options.selfTest) {
    selfTest();
    io.log(JSON.stringify({ schema: "csl-lessons.self-test/v1", ok: true }));
    return 0;
  }

  let parsed;
  try {
    parsed = parseLessons(readLessons(options.workspace).markdown);
  } catch (error) {
    io.error(`Error: ${error.message}`);
    return 1;
  }

  if (options.command === "validate") {
    io.log(JSON.stringify(validationPayload(parsed), null, 2));
    return parsed.errors.length === 0 ? 0 : 1;
  }

  if (options.command === "index") {
    io.log(JSON.stringify(indexPayload(parsed), null, 2));
    printDiagnostics(parsed.errors, io);
    return parsed.errors.length === 0 ? 0 : 1;
  }

  const shown = showPayload(parsed, options.ids);
  io.log(JSON.stringify(shown.payload, null, 2));
  printDiagnostics([...parsed.errors, ...shown.errors], io);
  return parsed.errors.length === 0 && shown.errors.length === 0 ? 0 : 1;
}

if (require.main === module) process.exit(run(process.argv.slice(2)));

module.exports = {
  indexPayload,
  parseArguments,
  parseLessons,
  run,
  selfTest,
  showPayload,
  validationPayload,
};
