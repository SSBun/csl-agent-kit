#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const crypto = require("node:crypto");
const { spawnSync } = require("node:child_process");
const YAML = require("yaml");

const EVENTS = new Set([
  "session-start",
  "prompt-submit",
  "before-tool",
  "permission-request",
  "after-tool",
  "before-compact",
  "after-compact",
  "subagent-start",
  "subagent-stop",
  "stop",
]);
const ACTIONS = new Set(["inject-prompt", "run-script"]);
const FIELDS = new Set(["schema", "event", "action", "enabled", "when", "script", "timeout"]);
const NATIVE_EVENTS = {
  SessionStart: "session-start",
  UserPromptSubmit: "prompt-submit",
  PreToolUse: "before-tool",
  PermissionRequest: "permission-request",
  PostToolUse: "after-tool",
  PreCompact: "before-compact",
  PostCompact: "after-compact",
  SubagentStart: "subagent-start",
  SubagentStop: "subagent-stop",
  Stop: "stop",
};
const CODEX_CAPABILITIES = {
  "session-start": { inject: true, script: true, block: false },
  "prompt-submit": { inject: true, script: true, block: true },
  "before-tool": { inject: true, script: true, block: true },
  "permission-request": { inject: false, script: true, block: true },
  "after-tool": { inject: true, script: true, block: false },
  "before-compact": { inject: false, script: true, block: true },
  "after-compact": { inject: false, script: true, block: false },
  "subagent-start": { inject: true, script: true, block: false },
  "subagent-stop": { inject: false, script: true, block: true },
  stop: { inject: false, script: true, block: true },
};
const DEFAULT_TIMEOUT = 10;
const MAX_TIMEOUT = 60;
const MAX_OUTPUT = 64 * 1024;
const MAX_CONDITION_DEPTH = 32;
const MAX_CONDITION_NODES = 256;
const MAX_PATTERN_LENGTH = 1024;
const MAX_RULES = 256;
const MAX_RULE_FILE = 256 * 1024;
const MAX_REGEX_INPUT = 4096;
const REGEX_TIMEOUT = 100;
const EVENT_BUDGET = 60 * 1000;
const DISABLED_SENTINEL = "<!-- triggerify:disabled -->\n";

function dataRoot() {
  return process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
}

function canonicalWorkspace(value = process.cwd()) {
  return fs.realpathSync(value);
}

function scopeRoot(scope, workspace = process.cwd()) {
  return scope === "global"
    ? path.join(dataRoot(), "triggerify")
    : path.join(canonicalWorkspace(workspace), ".csl-agent-kit", "triggerify");
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function logicalName(file) {
  return file.replace(/\.md$/, "").replace(/\.local$/, "");
}

function isLocalFile(file) {
  return file.endsWith(".local.md");
}

function parseMarkdown(content, file = "<memory>", scope = "global") {
  if (content.startsWith(DISABLED_SENTINEL)) {
    return {
      valid: false,
      rule: { enabled: false },
      errors: [issue("recovery-disabled", `${file}: invalid rule disabled by the recovery CLI`)],
    };
  }
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/);
  if (!match) return invalid("frontmatter-invalid", `${file}: expected one leading YAML frontmatter block`);

  const documents = YAML.parseAllDocuments(match[1], {
    schema: "core",
    strict: true,
    uniqueKeys: true,
    merge: false,
    maxAliasCount: 0,
  });
  if (documents.length !== 1) return invalid("yaml-document-count", `${file}: expected exactly one YAML document`);
  const document = documents[0];
  if (document.errors.length > 0) {
    return invalid("yaml-invalid", `${file}: ${document.errors.map((error) => error.message).join("; ")}`);
  }
  if (containsYamlIndirection(document.contents)) {
    return invalid("yaml-indirection", `${file}: anchors, aliases, tags, and merge keys are not supported`);
  }

  const value = document.toJS({ maxAliasCount: 0 });
  if (!isPlainObject(value)) return invalid("schema-type", `${file}: frontmatter must be a mapping`);
  const errors = validateRule(value, match[2], scope, file);
  if (errors.length > 0) return { valid: false, errors };
  return { valid: true, rule: { ...value, enabled: value.enabled ?? true, body: match[2] }, errors: [] };
}

function containsYamlIndirection(node, seen = new Set()) {
  if (!node || typeof node !== "object" || seen.has(node)) return false;
  seen.add(node);
  if (node.anchor || node.constructor?.name === "Alias" || node.tag) return true;
  if (Array.isArray(node.items) && node.items.some((item) => containsYamlIndirection(item, seen))) return true;
  if (containsYamlIndirection(node.key, seen) || containsYamlIndirection(node.value, seen)) return true;
  return false;
}

function validateRule(rule, body, scope, file) {
  const errors = [];
  for (const field of Object.keys(rule)) {
    if (!FIELDS.has(field)) errors.push(issue("unknown-field", `${file}: unknown field '${field}'`));
  }
  if (rule.schema !== "triggerify/v1") errors.push(issue("schema-unsupported", `${file}: schema must be triggerify/v1`));
  if (!EVENTS.has(rule.event)) errors.push(issue("event-invalid", `${file}: unsupported event '${rule.event}'`));
  if (!ACTIONS.has(rule.action)) errors.push(issue("action-invalid", `${file}: unsupported action '${rule.action}'`));
  if (rule.enabled !== undefined && typeof rule.enabled !== "boolean") {
    errors.push(issue("enabled-type", `${file}: enabled must be a boolean`));
  }
  if (rule.timeout !== undefined && (!Number.isInteger(rule.timeout) || rule.timeout < 1 || rule.timeout > MAX_TIMEOUT)) {
    errors.push(issue("timeout-invalid", `${file}: timeout must be an integer from 1 to ${MAX_TIMEOUT}`));
  }
  if (rule.action === "inject-prompt") {
    if (!body.trim()) errors.push(issue("prompt-empty", `${file}: inject-prompt requires a non-empty Markdown body`));
    if (rule.script !== undefined) errors.push(issue("script-unexpected", `${file}: inject-prompt cannot define script`));
  }
  if (rule.action === "run-script") {
    const scriptError = validateScriptReference(rule.script, scope);
    if (scriptError) errors.push(issue(scriptError.code, `${file}: ${scriptError.message}`));
    if (body.trim()) errors.push(issue("body-unexpected", `${file}: run-script cannot contain a Markdown body`));
  }
  if (rule.when !== undefined) errors.push(...validateCondition(rule.when, file));
  return errors;
}

function validateScriptReference(script, scope) {
  if (typeof script !== "string" || !script) return issue("script-missing", "run-script requires script");
  if (script.includes("\0") || path.posix.isAbsolute(script) || script.split("/").includes("..")) {
    return issue("script-path-invalid", "script must be a relative path without NUL or '..' segments");
  }
  if (script.includes("\\") || script.split("/").includes(".")) {
    return issue("script-path-invalid", "script must use normalized POSIX path segments");
  }
  if (scope === "global" && /(^|\/)\.?[^/]*\.local\.[^/]+$/.test(script)) {
    return issue("global-local-script", "global hooks cannot reference local scripts");
  }
  return null;
}

function validateCondition(condition, file = "<memory>") {
  const errors = [];
  let nodes = 0;
  const visit = (node, depth) => {
    nodes += 1;
    if (nodes > MAX_CONDITION_NODES) {
      errors.push(issue("condition-budget", `${file}: condition exceeds ${MAX_CONDITION_NODES} nodes`));
      return;
    }
    if (depth > MAX_CONDITION_DEPTH) {
      errors.push(issue("condition-depth", `${file}: condition exceeds depth ${MAX_CONDITION_DEPTH}`));
      return;
    }
    if (!isPlainObject(node)) {
      errors.push(issue("condition-type", `${file}: each condition must be a mapping`));
      return;
    }
    const keys = Object.keys(node);
    if (keys.length === 1 && keys[0] === "all") {
      if (!Array.isArray(node.all)) errors.push(issue("all-type", `${file}: all must be an array`));
      else node.all.forEach((child) => visit(child, depth + 1));
      return;
    }
    if (keys.length === 1 && keys[0] === "some") {
      if (!isPlainObject(node.some) || Object.keys(node.some).some((key) => !["path", "where"].includes(key))) {
        errors.push(issue("some-shape", `${file}: some must contain only path and where`));
        return;
      }
      if (!validPointer(node.some.path)) errors.push(issue("pointer-invalid", `${file}: invalid JSON Pointer`));
      visit(node.some.where, depth + 1);
      return;
    }
    if (keys.some((key) => !["path", "op", "value"].includes(key)) || keys.length !== 3) {
      errors.push(issue("predicate-shape", `${file}: predicate must contain path, op, and value`));
      return;
    }
    if (!validPointer(node.path)) errors.push(issue("pointer-invalid", `${file}: invalid JSON Pointer`));
    if (!["eq", "in", "regex", "glob"].includes(node.op)) {
      errors.push(issue("operator-invalid", `${file}: unsupported operator '${node.op}'`));
      return;
    }
    if (node.op === "in" && (!Array.isArray(node.value) || node.value.some((value) => !isScalar(value)))) {
      errors.push(issue("in-value", `${file}: in value must be an array of scalars`));
    }
    if ((node.op === "regex" || node.op === "glob") && typeof node.value !== "string") {
      errors.push(issue("pattern-type", `${file}: ${node.op} value must be a string`));
    }
    if (typeof node.value === "string" && node.value.length > MAX_PATTERN_LENGTH) {
      errors.push(issue("pattern-budget", `${file}: pattern exceeds ${MAX_PATTERN_LENGTH} characters`));
    }
    if (node.op === "regex" && typeof node.value === "string") {
      try { new RegExp(node.value); } catch (error) {
        errors.push(issue("regex-invalid", `${file}: invalid regex: ${error.message}`));
      }
    }
    if (node.op === "glob" && typeof node.value === "string") {
      const globError = validateGlob(node.value);
      if (globError) errors.push(issue("glob-invalid", `${file}: ${globError}`));
    }
  };
  visit(condition, 1);
  return errors;
}

function evaluateCondition(condition, root, deadline = Infinity) {
  if (Date.now() >= deadline) return { value: "unknown", trace: "budget-exhausted" };
  if (condition === undefined) return { value: "true", trace: "unconditional" };
  if (condition.all) {
    const children = [];
    for (const child of condition.all) {
      const evaluated = evaluateCondition(child, root, deadline);
      children.push(evaluated);
      if (evaluated.value === "false") break;
    }
    const value = children.some((child) => child.value === "false")
      ? "false"
      : children.some((child) => child.value === "unknown") ? "unknown" : "true";
    return { value, trace: { all: children } };
  }
  if (condition.some) {
    const selected = pointer(root, condition.some.path);
    if (!selected.found || !Array.isArray(selected.value)) {
      return { value: "unknown", trace: { some: selected.found ? "not-array" : "missing" } };
    }
    const children = [];
    for (const item of selected.value) {
      const evaluated = evaluateCondition(condition.some.where, item, deadline);
      children.push(evaluated);
      if (evaluated.value === "true") break;
      if (Date.now() >= deadline) break;
    }
    const value = children.some((child) => child.value === "true")
      ? "true"
      : children.some((child) => child.value === "unknown") ? "unknown" : "false";
    return { value, trace: { some: children } };
  }
  const selected = pointer(root, condition.path);
  if (!selected.found) return { value: "unknown", trace: "missing" };
  const left = selected.value;
  let result;
  if (condition.op === "eq") result = sameJsonScalar(left, condition.value);
  if (condition.op === "in") result = isScalar(left) && condition.value.some((value) => sameJsonScalar(left, value));
  if (condition.op === "regex") {
    const remaining = deadline - Date.now();
    result = typeof left === "string" && remaining > 0
      ? safeRegexTest(condition.value, left, Math.min(REGEX_TIMEOUT, remaining))
      : undefined;
  }
  if (condition.op === "glob") result = typeof left === "string" && globRegex(condition.value).test(left);
  return { value: result === undefined || result === false && !operatorAccepts(condition.op, left) ? "unknown" : String(result), trace: { path: condition.path, op: condition.op } };
}

function operatorAccepts(operator, value) {
  if (operator === "eq") return isScalar(value);
  if (operator === "in") return isScalar(value);
  return typeof value === "string";
}

function safeRegexTest(pattern, input, timeout = REGEX_TIMEOUT) {
  if (input.length > MAX_REGEX_INPUT) return undefined;
  const program = "const fs=require('node:fs');const [p,s]=JSON.parse(fs.readFileSync(0,'utf8'));process.stdout.write(new RegExp(p).test(s)?'1':'0')";
  const result = spawnSync(process.execPath, ["-e", program], {
    input: JSON.stringify([pattern, input]),
    encoding: "utf8",
    timeout: Math.max(1, timeout),
    killSignal: "SIGKILL",
    maxBuffer: 1024,
  });
  if (result.error || result.signal || result.status !== 0) return undefined;
  return result.stdout === "1";
}

function pointer(root, value) {
  if (value === "") return { found: true, value: root };
  let current = root;
  for (const raw of value.slice(1).split("/")) {
    const key = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    if (current === null || typeof current !== "object" || !Object.hasOwn(current, key)) {
      return { found: false };
    }
    current = current[key];
  }
  return { found: true, value: current };
}

function validPointer(value) {
  return typeof value === "string" && (value === "" || /^\/(?:[^~]|~[01])*(?:\/(?:[^~]|~[01])*)*$/.test(value));
}

function validateGlob(pattern) {
  for (const segment of pattern.split("/")) {
    if (segment.includes("**") && segment !== "**") return "** must occupy a complete path segment";
    if (/[\[\]{}]/.test(segment)) return "brace and character-class syntax is not supported";
  }
  return null;
}

function globRegex(pattern) {
  const segments = pattern.split("/");
  let source = "^";
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (segment === "**") {
      if (index > 0) source += "/";
      source += index === segments.length - 1 ? "(?:[^/]+(?:/[^/]+)*)?" : "(?:[^/]+/)*";
      continue;
    }
    if (index > 0 && segments[index - 1] !== "**") source += "/";
    source += [...segment].map((character) => {
      if (character === "*") return "[^/]*";
      if (character === "?") return "[^/]";
      return character.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
    }).join("");
  }
  return new RegExp(`${source}$`);
}

function discover(scope, workspace = process.cwd(), read = true, deadline = Infinity) {
  const root = scopeRoot(scope, workspace);
  const hooks = path.join(root, "hooks");
  let files = [];
  try {
    files = fs.readdirSync(hooks).filter((file) => file.endsWith(".md")).sort(compareUtf8);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (Number.isFinite(deadline) && files.length > MAX_RULES) throw budgetError("rule-count-budget");
  const entries = files.map((file) => ({
    id: `${scope}:${logicalName(file)}`,
    scope,
    local: isLocalFile(file),
    file,
    path: path.join(hooks, file),
  }));
  const counts = entries.reduce((result, entry) => result.set(entry.id, (result.get(entry.id) || 0) + 1), new Map());
  return entries.map((entry) => {
    if ((counts.get(entry.id) || 0) > 1) return { ...entry, valid: false, errors: [issue("id-conflict", `${entry.path}: shared/local ID conflict`)] };
    if (scope === "global" && entry.local) return { ...entry, valid: false, errors: [issue("global-local-hook", `${entry.path}: global hooks cannot be local`)] };
    if (!read) return { ...entry, valid: null, errors: [] };
    if (Date.now() >= deadline) throw budgetError("event-budget-exhausted");
    return readEntry(entry, workspace, deadline);
  });
}

function readEntry(entry, workspace = process.cwd(), deadline = Infinity) {
  if (Date.now() >= deadline) throw budgetError("event-budget-exhausted");
  if (fs.statSync(entry.path).size > MAX_RULE_FILE) {
    return { ...entry, valid: false, errors: [issue("rule-file-budget", `${entry.path}: rule exceeds ${MAX_RULE_FILE} bytes`)] };
  }
  const parsed = parseMarkdown(fs.readFileSync(entry.path, "utf8"), entry.path, entry.scope);
  if (Date.now() >= deadline) throw budgetError("event-budget-exhausted");
  if (!parsed.valid) return { ...entry, valid: false, rule: parsed.rule, errors: parsed.errors };
  const scriptError = parsed.rule.action === "run-script" ? inspectScript(entry, parsed.rule, workspace) : null;
  return scriptError
    ? { ...entry, valid: false, rule: parsed.rule, errors: [scriptError] }
    : { ...entry, valid: true, rule: parsed.rule, errors: [] };
}

function inspectScript(entry, rule, workspace) {
  const scripts = path.join(scopeRoot(entry.scope, workspace), "scripts");
  let scriptsReal;
  let targetReal;
  try {
    scriptsReal = fs.realpathSync(scripts);
    targetReal = fs.realpathSync(path.join(scripts, rule.script));
  } catch (error) {
    return issue("script-unavailable", `${entry.path}: ${error.message}`);
  }
  if (!isWithin(scriptsReal, targetReal)) return issue("script-escape", `${entry.path}: script escapes scripts root`);
  const stat = fs.statSync(targetReal);
  if (!stat.isFile()) return issue("script-not-file", `${entry.path}: script is not a regular file`);
  if ((stat.mode & 0o111) === 0) return issue("script-not-executable", `${entry.path}: script is not executable`);
  const descriptor = fs.openSync(targetReal, "r");
  const header = Buffer.alloc(256);
  let length;
  try { length = fs.readSync(descriptor, header, 0, header.length, 0); } finally { fs.closeSync(descriptor); }
  if (!/^#!\/[^\r\n\s]+(?:\s+[^\r\n]+)?(?:\r?\n|$)/.test(header.subarray(0, length).toString("utf8"))) {
    return issue("script-shebang-invalid", `${entry.path}: script requires a valid absolute shebang`);
  }
  if (!entry.local && /(^|\/)\.?[^/]*\.local\.[^/]+$/.test(rule.script)) {
    return issue("shared-local-script", `${entry.path}: shared hook cannot reference a local script`);
  }
  return null;
}

function status(entry, host = "codex") {
  const rule = entry.rule;
  const capability = host === "codex" && rule ? CODEX_CAPABILITIES[rule.event] : null;
  const supported = capability && (rule.action === "inject-prompt" ? capability.inject : capability.script);
  const trust = entry.scope === "global" ? "not-applicable" : "unavailable";
  const validation = entry.valid === null ? "unavailable" : entry.valid ? "valid" : "invalid";
  const configured = rule ? (rule.enabled ? "enabled" : "disabled") : "unavailable";
  const support = supported ? "supported" : "unsupported";
  const active = configured === "enabled" && validation === "valid" && trust !== "unavailable" && support === "supported";
  const reasons = entry.errors.map((error) => error.code);
  if (trust === "unavailable") reasons.push("workspace-trust-unavailable");
  if (support === "unsupported") reasons.push("capability-unsupported");
  return {
    id: entry.id,
    scope: entry.scope,
    lifecycle: entry.local ? "local" : "shared",
    event: rule?.event ?? null,
    action: rule?.action ?? null,
    script: rule?.script ?? null,
    path: entry.path,
    configured,
    validation,
    trust,
    support,
    effective: active ? "active" : "inactive",
    reasons: [...new Set(reasons)],
  };
}

function serialize(rule) {
  const body = rule.body || "";
  const frontmatter = {};
  for (const field of ["schema", "event", "action", "enabled", "script", "timeout", "when"]) {
    if (rule[field] !== undefined) frontmatter[field] = rule[field];
  }
  const suffix = body ? `\n${body.replace(/^\n+/, "")}` : "";
  return `---\n${YAML.stringify(frontmatter, { lineWidth: 0 }).trimEnd()}\n---\n${suffix}`.replace(/\n{3,}$/, "\n\n");
}

function writeAtomic(file, content, mode = 0o600) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = path.join(path.dirname(file), `.${path.basename(file)}.${process.pid}.${Date.now()}.tmp`);
  try {
    fs.writeFileSync(temporary, content, { mode });
    fs.renameSync(temporary, file);
  } finally {
    fs.rmSync(temporary, { force: true });
  }
}

function ensureLocalIgnore(workspace) {
  const file = path.join(canonicalWorkspace(workspace), ".gitignore");
  let content = "";
  let mode = 0o644;
  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(`${file} must be a regular file, not a symlink`);
    mode = stat.mode & 0o777;
    content = fs.readFileSync(file, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const entries = [
    ".csl-agent-kit/triggerify/hooks/*.local.md",
    ".csl-agent-kit/triggerify/scripts/*.local.*",
  ];
  const missing = entries.filter((entry) => !content.split(/\r?\n/).includes(entry));
  if (missing.length === 0) return;
  const prefix = content && !content.endsWith("\n") ? "\n" : "";
  writeAtomic(file, `${content}${prefix}${missing.join("\n")}\n`, mode);
}

function parseOptions(args) {
  const options = { positional: [] };
  const boolean = new Set(["json", "shared", "clear-when", "clear-timeout", "clear-script", "help"]);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith("--")) {
      options.positional.push(argument);
      continue;
    }
    const name = argument.slice(2);
    if (boolean.has(name)) options[name] = true;
    else {
      index += 1;
      if (index >= args.length) throw new Error(`--${name} requires a value`);
      options[name] = args[index];
    }
  }
  return options;
}

function runCli(args, io = console) {
  try {
    const [command = "help", ...rest] = args;
    const options = parseOptions(rest);
    if (command === "help" || options.help) return printTriggerifyHelp(io);
    if (command === "list") return listCommand(options, io);
    if (command === "show") return showCommand(options, io);
    if (command === "create") return createCommand(options, io);
    if (command === "update") return updateCommand(options, io);
    if (command === "enable" || command === "disable") return toggleCommand(command, options, io);
    if (command === "delete") return deleteCommand(options, io);
    throw new Error(`Unknown triggerify command: ${command}`);
  } catch (error) {
    io.error(`Error: ${error.message}`);
    return 2;
  }
}

function listCommand(options, io) {
  const scope = options.scope || "all";
  if (!["all", "global", "project"].includes(scope)) throw new Error("--scope must be all, global, or project");
  const workspace = options.workspace || process.cwd();
  const scopes = scope === "all" ? ["global", "project"] : [scope];
  const items = scopes.flatMap((name) => discover(name, workspace, name === "global")).map((entry) => status(entry, options.host || "codex"));
  if (options.json) io.log(JSON.stringify(items, null, 2));
  else if (items.length === 0) io.log("No triggers configured.");
  else items.forEach((item) => io.log(`${item.id}\t${item.configured}\t${item.validation}\t${item.trust}\t${item.support}\t${item.effective}\t${item.event || "-"}\t${item.action || "-"}`));
  return 0;
}

function showCommand(options, io) {
  const entry = resolveEntry(requiredId(options), options.workspace);
  const item = { ...status(entry, options.host || "codex"), definition: entry.rule || null, errors: entry.errors };
  if (options.json) io.log(JSON.stringify(item, null, 2));
  else io.log(`${formatStatus(item)}\n\n${entry.rule ? serialize(entry.rule) : entry.errors.map((error) => error.message).join("\n")}`);
  return entry.valid ? 0 : 1;
}

function createCommand(options, io) {
  const name = options.positional[0];
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error("create requires a kebab-case name");
  const scope = options.scope || "project";
  if (!["global", "project"].includes(scope)) throw new Error("--scope must be global or project");
  const workspace = options.workspace || process.cwd();
  const local = scope === "project" && !options.shared;
  const file = path.join(scopeRoot(scope, workspace), "hooks", `${name}${local ? ".local" : ""}.md`);
  if (fs.existsSync(file)) throw new Error(`${scope}:${name} already exists`);
  const rule = buildRule(options);
  const parsed = parseMarkdown(serialize(rule), file, scope);
  if (!parsed.valid) throw new Error(parsed.errors.map((error) => error.message).join("; "));
  const entry = { id: `${scope}:${name}`, scope, local, path: file };
  const scriptError = parsed.rule.action === "run-script" ? inspectScript(entry, parsed.rule, workspace) : null;
  if (scriptError) throw new Error(scriptError.message);
  if (local) ensureLocalIgnore(workspace);
  writeAtomic(file, serialize(rule));
  io.log(`Created ${scope}:${name} at ${file}`);
  return 0;
}

function updateCommand(options, io) {
  const entry = resolveEntry(requiredId(options), options.workspace);
  if (options.from !== undefined) {
    const replacement = fs.readFileSync(options.from, "utf8");
    const parsedReplacement = parseMarkdown(replacement, entry.path, entry.scope);
    if (!parsedReplacement.valid) throw new Error(parsedReplacement.errors.map((error) => error.message).join("; "));
    const scriptError = parsedReplacement.rule.action === "run-script"
      ? inspectScript(entry, parsedReplacement.rule, options.workspace || process.cwd())
      : null;
    if (scriptError) throw new Error(scriptError.message);
    writeAtomic(entry.path, serialize(parsedReplacement.rule));
    io.log(`Updated ${entry.id}`);
    return 0;
  }
  if (!entry.valid) throw new Error(entry.errors.map((error) => error.message).join("; "));
  const rule = { ...entry.rule };
  for (const field of ["event", "action", "script"]) if (options[field] !== undefined) rule[field] = options[field];
  if (options.timeout !== undefined) rule.timeout = Number(options.timeout);
  if (options["when-json"] !== undefined) rule.when = JSON.parse(options["when-json"]);
  if (options.body !== undefined || options["body-file"] !== undefined) rule.body = readBody(options);
  if (options["clear-when"]) delete rule.when;
  if (options["clear-timeout"]) delete rule.timeout;
  if (options["clear-script"]) delete rule.script;
  const parsed = parseMarkdown(serialize(rule), entry.path, entry.scope);
  if (!parsed.valid) throw new Error(parsed.errors.map((error) => error.message).join("; "));
  const scriptError = parsed.rule.action === "run-script" ? inspectScript(entry, parsed.rule, options.workspace || process.cwd()) : null;
  if (scriptError) throw new Error(scriptError.message);
  writeAtomic(entry.path, serialize(rule));
  io.log(`Updated ${entry.id}`);
  return 0;
}

function toggleCommand(command, options, io) {
  const id = requiredId(options);
  const scope = id.startsWith("global:") ? "global" : "project";
  const workspace = options.workspace || process.cwd();
  const matches = discover(scope, workspace, false).filter((entry) => entry.id === id);
  if (matches.length === 0) throw new Error(`Trigger not found: ${id}`);
  if (matches.length > 1 && command === "enable") throw new Error(`Trigger ID conflict: ${id}`);
  for (const match of matches) setEntryEnabled(readEntry(match, workspace), command === "enable");
  io.log(`${command === "enable" ? "Enabled" : "Disabled"} ${id}${matches.length > 1 ? ` (${matches.length} conflicting files)` : ""}`);
  return 0;
}

function setEntryEnabled(entry, enabled) {
  if (!entry.valid) {
    if (enabled) throw new Error(entry.errors.map((error) => error.message).join("; "));
    const content = fs.readFileSync(entry.path, "utf8");
    const disabled = setEnabledRaw(content, false);
    writeAtomic(entry.path, disabled);
    return;
  }
  writeAtomic(entry.path, serialize({ ...entry.rule, enabled }));
}

function deleteCommand(options, io) {
  const entry = resolveEntry(requiredId(options), options.workspace);
  fs.unlinkSync(entry.path);
  io.log(`Deleted ${entry.id}; referenced scripts were preserved.`);
  return 0;
}

function requiredId(options) {
  const id = options.positional[0];
  if (!/^(global|project):[a-z0-9][a-z0-9-]*$/.test(id || "")) {
    throw new Error("a qualified ID such as global:name or project:name is required");
  }
  return id;
}

function resolveEntry(id, workspace = process.cwd()) {
  const scope = id.startsWith("global:") ? "global" : "project";
  const matches = discover(scope, workspace, false).filter((entry) => entry.id === id);
  if (matches.length === 0) throw new Error(`Trigger not found: ${id}`);
  if (matches.length > 1) throw new Error(`Trigger ID conflict: ${id}`);
  return readEntry(matches[0], workspace);
}

function setEnabledRaw(content, enabled) {
  const match = content.match(/^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$)[\s\S]*)$/);
  if (!match) return enabled ? null : `${DISABLED_SENTINEL}${content}`;
  const value = enabled ? "true" : "false";
  const frontmatter = /^enabled\s*:/m.test(match[2])
    ? match[2].replace(/^enabled\s*:.*$/m, `enabled: ${value}`)
    : `${match[2]}\nenabled: ${value}`;
  return `${match[1]}${frontmatter}${match[3]}`;
}

function buildRule(options) {
  const action = options.action;
  const rule = {
    schema: "triggerify/v1",
    event: options.event,
    action,
    enabled: true,
    body: readBody(options),
  };
  if (options.script !== undefined) rule.script = options.script;
  if (options.timeout !== undefined) rule.timeout = Number(options.timeout);
  if (options["when-json"] !== undefined) rule.when = JSON.parse(options["when-json"]);
  return rule;
}

function readBody(options) {
  if (options.body !== undefined && options["body-file"] !== undefined) throw new Error("use only one of --body or --body-file");
  if (options["body-file"] !== undefined) return fs.readFileSync(options["body-file"], "utf8");
  return options.body || "";
}

function formatStatus(item) {
  return [
    `ID: ${item.id}`,
    `Configured: ${item.configured}`,
    `Validation: ${item.validation}`,
    `Trust: ${item.trust}`,
    `Support: ${item.support}`,
    `Effective: ${item.effective}`,
    `Reasons: ${item.reasons.join(", ") || "none"}`,
  ].join("\n");
}

function printTriggerifyHelp(io) {
  io.log(`Usage:\n  csl-agent-kit triggerify list [--scope all|global|project] [--json]\n  csl-agent-kit triggerify show <qualified-id> [--json]\n  csl-agent-kit triggerify create <name> --event <event> --action <action> [options]\n  csl-agent-kit triggerify update <qualified-id> [options]\n  csl-agent-kit triggerify update <qualified-id> --from <file>\n  csl-agent-kit triggerify enable|disable|delete <qualified-id>\n\nCommon options:\n  --workspace <path>  Project workspace (default: cwd)\n  --host <name>       Capability view (default: codex)\n  --scope <scope>     all, global, or project\n  --shared            Create a shared project rule\n  --body <text>       Prompt body\n  --body-file <path>  Read prompt body from a file\n  --script <path>     Script relative to the scope scripts root\n  --timeout <seconds> Script timeout, 1-${MAX_TIMEOUT}\n  --when-json <json>  V1 condition AST as JSON\n  --from <file>       Replace an invalid rule with a validated definition\n`);
  return 0;
}

function normalizePayload(native, host, event, workspace) {
  const toolName = native.tool_name ?? null;
  const command = typeof native.tool_input?.command === "string" ? native.tool_input.command : null;
  return {
    schema: "triggerify.event/v1",
    event,
    host: { name: host, version: null },
    workspace: { root: workspace, trusted: null },
    session: { id: native.session_id ?? null },
    prompt: event === "prompt-submit" ? native.prompt ?? null : null,
    tool: ["before-tool", "after-tool"].includes(event) ? {
      name: toolName,
      category: toolCategory(toolName),
      command,
      success: null,
    } : null,
    permission: event === "permission-request" ? { tool: toolName, description: native.tool_input?.description ?? null } : null,
    compact: ["before-compact", "after-compact"].includes(event) ? { trigger: native.trigger ?? null } : null,
    subagent: ["subagent-start", "subagent-stop"].includes(event) ? {
      id: native.agent_id ?? null,
      type: native.agent_type ?? null,
    } : null,
    stop: ["subagent-stop", "stop"].includes(event) ? {
      hook_active: native.stop_hook_active ?? null,
      last_message: native.last_assistant_message ?? null,
    } : null,
    changed_files: null,
    native: { event: native.hook_event_name ?? null, payload: native },
  };
}

function toolCategory(name) {
  if (name === "Bash") return "shell";
  if (["apply_patch", "Edit", "Write"].includes(name)) return "file";
  if (typeof name === "string" && name.startsWith("mcp__")) return "mcp";
  return name ? "tool" : null;
}

function runEvent(payload, options = {}) {
  const host = options.host || payload.host.name;
  const capability = host === "codex" ? CODEX_CAPABILITIES[payload.event] : null;
  if (!capability) return { prompts: [], diagnostics: ["capability-unsupported"], blocked: false };
  const workspace = options.workspace || payload.workspace.root;
  const prompts = [];
  const diagnostics = [];
  const deadline = Date.now() + (options.eventBudgetMs || EVENT_BUDGET);
  let entries;
  try {
    entries = discover("global", workspace, true, deadline);
  } catch (error) {
    if (error.code === "TRIGGERIFY_BUDGET") {
      return { prompts, diagnostics: [`global:${error.reason}`], blocked: false };
    }
    throw error;
  }
  for (const entry of entries.sort((left, right) => compareUtf8(left.id, right.id))) {
    if (Date.now() >= deadline) {
      diagnostics.push(`${entry.id}:event-budget-exhausted`);
      break;
    }
    if (!entry.valid) {
      diagnostics.push(...entry.errors.map((error) => `${entry.id}:${error.code}`));
      continue;
    }
    if (!entry.rule.enabled || entry.rule.event !== payload.event) continue;
    const condition = evaluateCondition(entry.rule.when, payload, deadline);
    if (condition.value === "unknown") diagnostics.push(`${entry.id}:condition-unknown`);
    if (condition.value !== "true") continue;
    if (Date.now() >= deadline) {
      diagnostics.push(`${entry.id}:event-budget-exhausted`);
      break;
    }
    if (entry.rule.action === "inject-prompt") {
      if (!capability.inject) {
        diagnostics.push(`${entry.id}:capability-unsupported`);
        continue;
      }
      prompts.push({ id: entry.id, content: entry.rule.body.trim() });
      continue;
    }
    if (!capability.script) {
      diagnostics.push(`${entry.id}:capability-unsupported`);
      continue;
    }
    let result;
    try {
      const remaining = deadline - Date.now();
      if (remaining <= 0) {
        diagnostics.push(`${entry.id}:event-budget-exhausted`);
        break;
      }
      result = executeScript(entry, payload, workspace, remaining);
    } catch {
      diagnostics.push(`${entry.id}:runtime-error`);
      continue;
    }
    if (result.status === 2) {
      if (capability.block) return { prompts: [], diagnostics, blocked: true, reason: result.stderr || `${entry.id} blocked the event` };
      diagnostics.push(`${entry.id}:block-unsupported`);
    } else if (result.status !== 0) diagnostics.push(`${entry.id}:runtime-error`);
  }
  return { prompts, diagnostics, blocked: false };
}

function executeScript(entry, payload, workspace, remaining) {
  const scripts = fs.realpathSync(path.join(scopeRoot(entry.scope, workspace), "scripts"));
  const executable = fs.realpathSync(path.join(scripts, entry.rule.script));
  if (!isWithin(scripts, executable)) return { status: 1, stderr: "script-escape" };
  const payloadFile = path.join(os.tmpdir(), `triggerify-${process.pid}-${crypto.randomBytes(12).toString("hex")}.json`);
  let payloadDescriptor;
  let payloadPath = payloadFile;
  let result;
  try {
    fs.writeFileSync(payloadPath, `${JSON.stringify(payload)}\n`, { mode: 0o600, flag: "wx" });
    payloadDescriptor = fs.openSync(payloadPath, "r");
    fs.unlinkSync(payloadPath);
    payloadPath = null;
    result = spawnSync(executable, [], {
      cwd: canonicalWorkspace(workspace),
      env: {
        ...process.env,
        TRIGGERIFY_ROOT: scopeRoot(entry.scope, workspace),
        TRIGGERIFY_SCOPE: entry.scope,
        TRIGGERIFY_HOOK_ID: entry.id,
        TRIGGERIFY_WORKSPACE: canonicalWorkspace(workspace),
        TRIGGERIFY_HOST: payload.host.name,
        TRIGGERIFY_EVENT: payload.event,
      },
      stdio: [payloadDescriptor, "pipe", "pipe"],
      encoding: "utf8",
      shell: false,
      timeout: Math.max(1, Math.min((entry.rule.timeout || DEFAULT_TIMEOUT) * 1000, remaining)),
      maxBuffer: MAX_OUTPUT,
    });
  } finally {
    if (payloadDescriptor !== undefined) {
      try { fs.closeSync(payloadDescriptor); } catch {}
    }
    if (payloadPath !== null) {
      try { fs.unlinkSync(payloadPath); } catch {}
    }
  }
  if (result.error || result.signal) return { status: 1, stderr: bounded(result.error?.message || `terminated by ${result.signal}`) };
  return { status: result.status ?? 1, stdout: bounded(result.stdout), stderr: bounded(result.stderr) };
}

function dispatch(input = fs.readFileSync(0, "utf8"), env = process.env, io = process) {
  try {
    const native = JSON.parse(input || "{}");
    const event = NATIVE_EVENTS[native.hook_event_name];
    if (!event) return 0;
    const host = env.PLUGIN_ROOT ? "codex" : "claude-code";
    const workspace = canonicalWorkspace(native.cwd || process.cwd());
    const payload = normalizePayload(native, host, event, workspace);
    const result = runEvent(payload, { host, workspace });
    const diagnostics = dedupeDiagnostics(payload, result.diagnostics);
    if (diagnostics.length > 0) io.stderr.write(`Triggerify: ${diagnostics.join(", ")}\n`);
    if (result.blocked) {
      const reason = bounded(result.reason) || "Blocked by Triggerify";
      if (native.hook_event_name === "PermissionRequest") {
        io.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: "PermissionRequest", decision: { behavior: "deny", message: reason } } })}\n`);
        return 0;
      }
      if (native.hook_event_name === "PreCompact") {
        io.stdout.write(`${JSON.stringify({ continue: false, stopReason: reason })}\n`);
        return 0;
      }
      io.stderr.write(`${reason}\n`);
      return 2;
    }
    if (result.prompts.length > 0) {
      const context = result.prompts.map((prompt) => `[Triggerify ${prompt.id}]\n${prompt.content}`).join("\n\n");
      io.stdout.write(`${JSON.stringify({ hookSpecificOutput: { hookEventName: native.hook_event_name, additionalContext: context } })}\n`);
    } else if (["Stop", "SubagentStop"].includes(native.hook_event_name)) io.stdout.write("{}\n");
    return 0;
  } catch (error) {
    io.stderr.write(`Triggerify runtime error (fail-open): ${bounded(error.message)}\n`);
    return 0;
  }
}

function dedupeDiagnostics(payload, diagnostics) {
  const unique = [...new Set(diagnostics)];
  if (unique.length === 0 || !payload.session.id) return unique;
  try {
    const digest = crypto.createHash("sha256").update(String(payload.session.id)).digest("hex");
    const file = path.join(dataRoot(), "triggerify", ".diagnostics", `${digest}.json`);
    let seen = [];
    try { seen = JSON.parse(fs.readFileSync(file, "utf8")); } catch {}
    const fresh = unique.filter((item) => !seen.includes(item));
    if (fresh.length > 0) writeAtomic(file, `${JSON.stringify([...seen, ...fresh].slice(-256))}\n`);
    return fresh;
  } catch {
    return unique;
  }
}

function bounded(value = "") {
  return String(value).slice(0, MAX_OUTPUT).trim();
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isScalar(value) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function sameJsonScalar(left, right) {
  return isScalar(left) && isScalar(right) && Object.is(left, right);
}

function issue(code, message) {
  return { code, message };
}

function budgetError(reason) {
  const error = new Error(reason);
  error.code = "TRIGGERIFY_BUDGET";
  error.reason = reason;
  return error;
}

function invalid(code, message) {
  return { valid: false, errors: [issue(code, message)] };
}

if (require.main === module) {
  const [command, ...args] = process.argv.slice(2);
  process.exit(command === "dispatch" ? dispatch() : runCli([command || "help", ...args]));
}

module.exports = {
  CODEX_CAPABILITIES,
  dispatch,
  evaluateCondition,
  globRegex,
  normalizePayload,
  parseMarkdown,
  runCli,
  runEvent,
  safeRegexTest,
  validateCondition,
};
