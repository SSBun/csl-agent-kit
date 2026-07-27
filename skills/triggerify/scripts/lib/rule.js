"use strict";

const path = require("node:path");
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
const FIELDS = new Set(["schema", "event", "action", "description", "enabled", "when", "script", "timeout", "inject-output"]);
const MAX_TIMEOUT = 60;
const MAX_DESCRIPTION = 160;
const MAX_CONDITION_DEPTH = 32;
const MAX_CONDITION_NODES = 256;
const MAX_PATTERN_LENGTH = 1024;
const MAX_REGEX_INPUT = 4096;
const REGEX_TIMEOUT = 100;
const DISABLED_SENTINEL = "<!-- triggerify:disabled -->\n";

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
  if (rule.description !== undefined) {
    if (typeof rule.description !== "string") errors.push(issue("description-type", `${file}: description must be a string`));
    else if (!rule.description || rule.description !== rule.description.trim() || /[\p{Cc}\p{Zl}\p{Zp}]/u.test(rule.description)) {
      errors.push(issue("description-format", `${file}: description must be one trimmed, non-empty line without control characters`));
    } else if (rule.description.length > MAX_DESCRIPTION) {
      errors.push(issue("description-length", `${file}: description exceeds ${MAX_DESCRIPTION} characters`));
    }
  }
  if (rule.enabled !== undefined && typeof rule.enabled !== "boolean") {
    errors.push(issue("enabled-type", `${file}: enabled must be a boolean`));
  }
  if (rule.timeout !== undefined && (!Number.isInteger(rule.timeout) || rule.timeout < 1 || rule.timeout > MAX_TIMEOUT)) {
    errors.push(issue("timeout-invalid", `${file}: timeout must be an integer from 1 to ${MAX_TIMEOUT}`));
  }
  if (rule.action === "inject-prompt") {
    if (!body.trim()) errors.push(issue("prompt-empty", `${file}: inject-prompt requires a non-empty Markdown body`));
    if (rule.script !== undefined) errors.push(issue("script-unexpected", `${file}: inject-prompt cannot define script`));
    if (rule["inject-output"] !== undefined) errors.push(issue("inject-output-unexpected", `${file}: inject-prompt cannot define inject-output`));
  }
  if (rule.action === "run-script") {
    const scriptError = validateScriptReference(rule.script, scope);
    if (scriptError) errors.push(issue(scriptError.code, `${file}: ${scriptError.message}`));
    if (body.trim()) errors.push(issue("body-unexpected", `${file}: run-script cannot contain a Markdown body`));
    if (rule["inject-output"] !== undefined && typeof rule["inject-output"] !== "boolean") errors.push(issue("inject-output-type", `${file}: inject-output must be a boolean`));
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

function serialize(rule) {
  const body = rule.body || "";
  const frontmatter = {};
  for (const field of ["schema", "event", "action", "description", "enabled", "script", "timeout", "inject-output", "when"]) {
    if (rule[field] !== undefined) frontmatter[field] = rule[field];
  }
  const suffix = body ? `\n${body.replace(/^\n+/, "")}` : "";
  return `---\n${YAML.stringify(frontmatter, { lineWidth: 0 }).trimEnd()}\n---\n${suffix}`.replace(/\n{3,}$/, "\n\n");
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

function invalid(code, message) {
  return { valid: false, errors: [issue(code, message)] };
}

module.exports = {
  DISABLED_SENTINEL,
  MAX_DESCRIPTION,
  MAX_TIMEOUT,
  evaluateCondition,
  globRegex,
  issue,
  parseMarkdown,
  safeRegexTest,
  serialize,
  validateCondition,
};
