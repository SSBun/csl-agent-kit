#!/usr/bin/env node
"use strict";

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const CORE_SECTIONS = ["Purpose", "Global Vocabulary", "System Map", "Global Invariants"];
const PACK_METADATA = ["Scope", "Paths", "Keywords", "Authority", "Recheck"];
const PACK_SECTIONS = [
  "Purpose and Boundaries",
  "Vocabulary",
  "Structure",
  "Relationships",
  "Workflows",
  "Decision and Verification Boundaries",
];
const LEGACY_SECTIONS = new Set(["Components", "Relationships", "Decisions and Conventions"]);
const PACK_HEADING = /^## (CTX-[a-z0-9]+(?:-[a-z0-9]+)*) — (.+)$/;

function unique(items) {
  return [...new Set(items)];
}

function diagnostic(code, message, line, id) {
  return { code, message, ...(id ? { id } : {}), ...(line ? { line } : {}) };
}

function sectionBlocks(lines, level) {
  const prefix = "#".repeat(level) + " ";
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (lines[index].startsWith(prefix) && !lines[index].startsWith(`${prefix}#`)) starts.push(index);
  }
  return starts.map((start, index) => ({
    heading: lines[start],
    name: lines[start].slice(prefix.length),
    start,
    end: starts[index + 1] ?? lines.length,
    startLine: start + 1,
  }));
}

function parseFlatItems(lines, start, end, label, errors, id) {
  const items = [];
  for (let index = start; index < end; index += 1) {
    const line = lines[index];
    if (!line.trim()) continue;
    const item = line.match(/^-\s+(\S.*)$/);
    if (item) {
      items.push(item[1]);
      continue;
    }
    errors.push(diagnostic(
      /^\s+[-*+]\s+/.test(line) ? "non-flat-list" : "invalid-section-content",
      `${label} must contain only flat \`- item\` entries`,
      index + 1,
      id,
    ));
  }
  return items;
}

function parseCore(lines, topSections, errors) {
  const matches = topSections.filter(({ name }) => name === "Project Core");
  if (matches.length !== 1) {
    errors.push(diagnostic("missing-or-duplicate-core", "expected exactly one `## Project Core` section", matches[0]?.startLine));
    return null;
  }

  const block = matches[0];
  const body = lines.slice(block.start + 1, block.end);
  const subsections = sectionBlocks(body, 3);
  if (subsections.map(({ name }) => name).join("\0") !== CORE_SECTIONS.join("\0")) {
    errors.push(diagnostic(
      "core-section-order",
      "expected exactly `Purpose`, `Global Vocabulary`, `System Map`, and `Global Invariants` in that order",
      block.startLine,
    ));
  }
  const first = subsections[0]?.start ?? body.length;
  if (body.slice(0, first).some((line) => line.trim())) {
    errors.push(diagnostic("unexpected-core-content", "content before `### Purpose` is not allowed", block.startLine));
  }

  const values = {};
  for (const name of CORE_SECTIONS) {
    const sectionMatches = subsections.filter((section) => section.name === name);
    if (sectionMatches.length !== 1) {
      errors.push(diagnostic("missing-or-duplicate-core-section", `expected one \`### ${name}\` section`, block.startLine));
      values[name] = [];
      continue;
    }
    const section = sectionMatches[0];
    const items = parseFlatItems(
      body,
      section.start + 1,
      section.end,
      `Project Core ${name}`,
      errors,
    );
    if (items.length === 0) {
      errors.push(diagnostic("empty-core-section", `${name} requires at least one list item`, block.startLine + section.start));
    }
    values[name] = items;
  }

  return {
    purpose: values.Purpose,
    globalVocabulary: values["Global Vocabulary"],
    systemMap: values["System Map"],
    globalInvariants: values["Global Invariants"],
  };
}

function splitCommaList(value) {
  return value.split(",").map((item) => item.trim().replace(/^`|`$/g, "")).filter(Boolean);
}

function parsePack(lines, block, errors) {
  const heading = block.heading.match(PACK_HEADING);
  const fallbackId = block.name.split(/\s+/)[0] || `invalid-pack-${block.startLine}`;
  const id = heading?.[1] ?? fallbackId;
  const title = heading?.[2] ?? block.name;
  if (!heading) errors.push(diagnostic("invalid-pack-heading", "expected `CTX-ascii-slug — Title`", block.startLine, id));

  const body = lines.slice(block.start + 1, block.end);
  const subsections = sectionBlocks(body, 3);
  const firstSection = subsections[0]?.start ?? body.length;
  const metadata = {};
  for (let index = 0; index < firstSection; index += 1) {
    const line = body[index];
    if (!line.trim()) continue;
    const match = line.match(/^- (Scope|Paths|Keywords|Authority|Recheck):\s*(\S.*)$/);
    if (!match) {
      errors.push(diagnostic("invalid-pack-metadata", "pack metadata must use `- Field: value`", block.startLine + index + 1, id));
      continue;
    }
    if (metadata[match[1]]) {
      errors.push(diagnostic("duplicate-pack-metadata", `duplicate ${match[1]} metadata`, block.startLine + index + 1, id));
      continue;
    }
    metadata[match[1]] = match[2];
  }
  for (const name of PACK_METADATA) {
    if (!metadata[name]) errors.push(diagnostic("missing-pack-metadata", `missing ${name} metadata`, block.startLine, id));
  }

  if (subsections.length === 0) {
    errors.push(diagnostic("missing-pack-body", "pack requires at least one body section", block.startLine, id));
  }
  const seen = new Set();
  const sections = {};
  for (const section of subsections) {
    if (!PACK_SECTIONS.includes(section.name)) {
      errors.push(diagnostic("unknown-pack-section", `unknown pack section: ${section.name}`, block.startLine + section.start + 1, id));
      continue;
    }
    if (seen.has(section.name)) {
      errors.push(diagnostic("duplicate-pack-section", `duplicate pack section: ${section.name}`, block.startLine + section.start + 1, id));
      continue;
    }
    seen.add(section.name);
    const items = parseFlatItems(
      body,
      section.start + 1,
      section.end,
      `Pack ${section.name}`,
      errors,
      id,
    );
    if (items.length === 0) {
      errors.push(diagnostic("empty-pack-section", `${section.name} requires at least one list item`, block.startLine + section.start + 1, id));
    }
    sections[section.name] = items;
  }

  return {
    id,
    title,
    format: "v1",
    scope: metadata.Scope ?? "",
    paths: splitCommaList(metadata.Paths ?? ""),
    keywords: splitCommaList(metadata.Keywords ?? ""),
    authority: metadata.Authority ?? "",
    recheck: metadata.Recheck ?? "",
    sections,
    raw: lines.slice(block.start, block.end).join("\n").trimEnd(),
    startLine: block.startLine,
  };
}

function legacyTitle(raw) {
  const code = raw.match(/`([^`]+)`/);
  if (code) return code[1];
  return raw.replace(/^-\s*/, "").replace(/[*_#]/g, "").split(/[。.!；;]/, 1)[0].trim().slice(0, 100);
}

function legacyKeywords(raw, section) {
  const code = [...raw.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
  return unique([section, ...code, legacyTitle(raw)]).slice(0, 12);
}

function parseLegacy(lines, block) {
  const records = [];
  let start = null;
  const flush = (end) => {
    if (start === null) return;
    const raw = lines.slice(start, end).join("\n").trimEnd();
    const normalized = raw.replace(/\s+/g, " ").trim();
    const id = `legacy-${crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12)}`;
    const code = [...raw.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
    records.push({
      id,
      title: legacyTitle(raw),
      format: "legacy",
      scope: block.name,
      paths: unique(code.filter((item) => item.includes("/") || /\.[a-z0-9]+$/i.test(item))),
      keywords: legacyKeywords(raw, block.name),
      raw,
      startLine: start + 1,
    });
    start = null;
  };

  for (let index = block.start + 1; index < block.end; index += 1) {
    if (/^-\s+\S/.test(lines[index])) {
      flush(index);
      start = index;
    }
  }
  flush(block.end);
  return records;
}

function parseContext(markdown, { missing = false } = {}) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const topSections = sectionBlocks(lines, 2);
  const errors = [];
  const warnings = [];
  if (missing) errors.push(diagnostic("missing-context", "missing `tasks/context.md`"));
  const core = parseCore(lines, topSections, errors);
  const packs = [];

  for (const block of topSections) {
    if (block.name === "Project Core") continue;
    if (block.name.startsWith("CTX-")) {
      packs.push(parsePack(lines, block, errors));
    } else if (LEGACY_SECTIONS.has(block.name)) {
      for (const pack of parseLegacy(lines, block)) {
        packs.push(pack);
        warnings.push(diagnostic("legacy-pack", "legacy pack remains readable but is not v1", pack.startLine, pack.id));
      }
    }
  }

  const byId = new Map();
  for (const pack of packs) {
    const matches = byId.get(pack.id) ?? [];
    matches.push(pack);
    byId.set(pack.id, matches);
  }
  for (const [id, matches] of byId) {
    if (matches.length < 2) continue;
    for (const pack of matches) errors.push(diagnostic("duplicate-id", `duplicate context pack ID: ${id}`, pack.startLine, id));
  }

  return { core, packs, errors, warnings };
}

function readContext(workspace) {
  const file = path.join(path.resolve(workspace), "tasks", "context.md");
  try {
    return { file, markdown: fs.readFileSync(file, "utf8"), missing: false };
  } catch (error) {
    if (error.code === "ENOENT") return { file, markdown: "", missing: true };
    throw error;
  }
}

function corePayload(parsed) {
  return { schema: "csl-context.core/v1", core: parsed.core };
}

function indexPayload(parsed) {
  return {
    schema: "csl-context.index/v1",
    packs: parsed.packs.map(({ id, title, format, scope, paths, keywords }) => ({ id, title, format, scope, paths, keywords })),
  };
}

function showPayload(parsed, ids) {
  const packs = [];
  const errors = [];
  for (const id of unique(ids)) {
    const matches = parsed.packs.filter((pack) => pack.id === id);
    if (matches.length === 0) {
      errors.push(diagnostic("unknown-id", `unknown context pack ID: ${id}`, null, id));
    } else if (matches.length > 1) {
      errors.push(diagnostic("duplicate-id", `context pack ID is ambiguous: ${id}`, null, id));
    } else {
      const pack = matches[0];
      if (pack.format === "legacy") {
        packs.push({
          id: pack.id,
          title: pack.title,
          format: pack.format,
          scope: pack.scope,
          paths: pack.paths,
          keywords: pack.keywords,
          raw: pack.raw,
        });
      } else {
        packs.push({
          id: pack.id,
          title: pack.title,
          format: pack.format,
          scope: pack.scope,
          paths: pack.paths,
          keywords: pack.keywords,
          authority: pack.authority,
          recheck: pack.recheck,
          sections: pack.sections,
        });
      }
    }
  }
  return { payload: { schema: "csl-context.packs/v1", packs }, errors };
}

function validationPayload(parsed) {
  return {
    schema: "csl-context.validation/v1",
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
  if (!command || !["core", "index", "show", "validate"].includes(command)) {
    throw new Error("command must be `core`, `index`, `show`, or `validate`");
  }
  if (command === "show" && ids.length === 0) throw new Error("show requires at least one context pack ID");
  if (command !== "show" && ids.length > 0) throw new Error(`${command} does not accept context pack IDs`);
  return { command, ids, workspace };
}

function printDiagnostics(items, io) {
  for (const item of items) {
    const location = item.line ? `line ${item.line}: ` : "";
    io.error(`[${item.code}] ${location}${item.message}`);
  }
}

function selfTest() {
  const valid = parseContext(`# Workspace Context

## Project Core

### Purpose
- Dispatch work without broad exploration.

### Global Vocabulary
- Pack means task-relevant context.

### System Map
- \`skills/\` contains skills.

### Global Invariants
- Authority wins over context.

## CTX-tasks — Tasks
- Scope: Task records
- Paths: \`tasks/tasks.md\`, \`tasks/tasks/\`
- Keywords: task, status
- Authority: \`skills/csl-tasks/task/SKILL.md\`
- Recheck: When the task contract changes.

### Purpose and Boundaries
- Tasks own progress, not Context.

## Components

- \`legacy/component.js\` owns legacy behavior.
`);
  assert.equal(valid.errors.length, 0);
  assert.equal(valid.core.purpose.length, 1);
  assert.equal(valid.packs.length, 2);
  assert.deepEqual(valid.packs[0].paths, ["tasks/tasks.md", "tasks/tasks/"]);
  assert.match(valid.packs[1].id, /^legacy-[a-f0-9]{12}$/);
  assert.equal(showPayload(valid, valid.packs.map(({ id }) => id)).errors.length, 0);

  const missing = parseContext("", { missing: true });
  assert.ok(missing.errors.some(({ code }) => code === "missing-context"));
  assert.ok(missing.errors.some(({ code }) => code === "missing-or-duplicate-core"));

  const malformed = parseContext(`# Workspace Context

## Project Core

### Purpose

### System Map
- map

## CTX-bad — Bad
- Scope: bad
- Scope: duplicate

### Unknown
- item
`);
  const malformedCodes = new Set(malformed.errors.map(({ code }) => code));
  assert.ok(malformedCodes.has("core-section-order"));
  assert.ok(malformedCodes.has("empty-core-section"));
  assert.ok(malformedCodes.has("duplicate-pack-metadata"));
  assert.ok(malformedCodes.has("missing-pack-metadata"));
  assert.ok(malformedCodes.has("unknown-pack-section"));

  const duplicate = parseContext(`${valid.packs[0].raw}\n\n${valid.packs[0].raw}\n`);
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
    io.log("Usage: node context.js --workspace <workspace> core|index|show <id>...|validate\n       node context.js --self-test");
    return 0;
  }
  if (options.selfTest) {
    selfTest();
    io.log(JSON.stringify({ schema: "csl-context.self-test/v1", ok: true }));
    return 0;
  }

  let parsed;
  try {
    const source = readContext(options.workspace);
    parsed = parseContext(source.markdown, { missing: source.missing });
  } catch (error) {
    io.error(`Error: ${error.message}`);
    return 1;
  }

  if (options.command === "validate") {
    io.log(JSON.stringify(validationPayload(parsed), null, 2));
    return parsed.errors.length === 0 ? 0 : 1;
  }
  if (options.command === "core") {
    const errors = parsed.errors.filter(({ id }) => !id);
    io.log(JSON.stringify(corePayload(parsed), null, 2));
    printDiagnostics(errors, io);
    return errors.length === 0 ? 0 : 1;
  }
  if (options.command === "index") {
    io.log(JSON.stringify(indexPayload(parsed), null, 2));
    printDiagnostics(parsed.errors, io);
    return parsed.errors.length === 0 ? 0 : 1;
  }

  const shown = showPayload(parsed, options.ids);
  const selected = new Set(options.ids);
  const errors = parsed.errors.filter(({ id }) => !id || selected.has(id));
  io.log(JSON.stringify(shown.payload, null, 2));
  printDiagnostics([...errors, ...shown.errors], io);
  return errors.length === 0 && shown.errors.length === 0 ? 0 : 1;
}

if (require.main === module) process.exit(run(process.argv.slice(2)));

module.exports = {
  corePayload,
  indexPayload,
  parseArguments,
  parseContext,
  run,
  selfTest,
  showPayload,
  validationPayload,
};
