"use strict";

const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const {
  DISABLED_SENTINEL,
  issue,
  parseMarkdown,
  serialize,
} = require("./rule.js");

const MAX_RULES = 256;
const MAX_RULE_FILE = 256 * 1024;
const INNER_CONFIG_SCHEMA = "triggerify.config/v1";

function innerRoot() {
  return path.join(__dirname, "..", "..");
}

function dataRoot() {
  return process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
}

function innerConfigPath() {
  return path.join(dataRoot(), "triggerify", "config.json");
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readInnerConfig() {
  const file = innerConfigPath();
  let value;
  try {
    value = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { valid: true, file, disabledHooks: new Set(), hookSettings: {} };
    return { valid: false, file, error: `invalid inner hook config at ${file}: ${error.message}` };
  }

  const fields = isPlainObject(value) ? Object.keys(value) : [];
  const disabled = value?.disabledHooks;
  const settings = value?.hookSettings ?? {};
  const valid = value?.schema === INNER_CONFIG_SCHEMA
    && fields.every((field) => ["schema", "disabledHooks", "hookSettings"].includes(field))
    && Array.isArray(disabled)
    && disabled.every((id) => typeof id === "string" && /^inner:[a-z0-9][a-z0-9-]*$/.test(id))
    && new Set(disabled).size === disabled.length
    && isPlainObject(settings)
    && Object.entries(settings).every(([id, config]) => /^inner:[a-z0-9][a-z0-9-]*$/.test(id) && isPlainObject(config));
  return valid
    ? { valid: true, file, disabledHooks: new Set(disabled), hookSettings: settings }
    : { valid: false, file, error: `invalid inner hook config at ${file}: expected ${INNER_CONFIG_SCHEMA} with unique inner:* disabledHooks and object hookSettings` };
}

function setInnerHookEnabled(id, enabled) {
  const config = readInnerConfig();
  if (!config.valid) throw new Error(config.error);
  if (enabled) config.disabledHooks.delete(id);
  else config.disabledHooks.add(id);
  const value = {
    schema: INNER_CONFIG_SCHEMA,
    disabledHooks: [...config.disabledHooks].sort(compareUtf8),
  };
  if (Object.keys(config.hookSettings).length > 0) value.hookSettings = config.hookSettings;
  writeAtomic(config.file, `${JSON.stringify(value, null, 2)}\n`);
}

function canonicalWorkspace(value = process.cwd()) {
  return fs.realpathSync(value);
}

function scopeRoot(scope, workspace = process.cwd()) {
  if (scope === "inner") return innerRoot();
  return scope === "global"
    ? path.join(dataRoot(), "triggerify")
    : path.join(canonicalWorkspace(workspace), ".csl-agent-kit", "triggerify");
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
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
  const config = scope === "inner" ? readInnerConfig() : null;
  return entries.map((entry) => {
    let result;
    if ((counts.get(entry.id) || 0) > 1) result = { ...entry, valid: false, errors: [issue("id-conflict", `${entry.path}: shared/local ID conflict`)] };
    else if (scope === "global" && entry.local) result = { ...entry, valid: false, errors: [issue("global-local-hook", `${entry.path}: global hooks cannot be local`)] };
    else if (!read) result = { ...entry, valid: null, errors: [] };
    else {
      if (Date.now() >= deadline) throw budgetError("event-budget-exhausted");
      result = readEntry(entry, workspace, deadline);
    }
    if (!config) return result;
    return {
      ...result,
      innerConfigValid: config.valid,
      innerConfigError: config.valid ? null : config.error,
      innerDisabled: config.valid ? config.disabledHooks.has(entry.id) : true,
      hookConfig: config.valid ? (config.hookSettings[entry.id] || {}) : null,
    };
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

function resolveEntry(id, workspace = process.cwd()) {
  const scope = id.startsWith("global:") ? "global" : id.startsWith("inner:") ? "inner" : "project";
  const matches = discover(scope, workspace, false).filter((entry) => entry.id === id);
  if (matches.length === 0) throw new Error(`Trigger not found: ${id}`);
  if (matches.length > 1) throw new Error(`Trigger ID conflict: ${id}`);
  return readEntry(matches[0], workspace);
}

function setEntryEnabled(entry, enabled) {
  if (!entry.valid) {
    if (enabled) throw new Error(entry.errors.map((error) => error.message).join("; "));
    const content = fs.readFileSync(entry.path, "utf8");
    writeAtomic(entry.path, setEnabledRaw(content, false));
    return;
  }
  writeAtomic(entry.path, serialize({ ...entry.rule, enabled }));
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

function logicalName(file) {
  return file.replace(/\.md$/, "").replace(/\.local$/, "");
}

function isLocalFile(file) {
  return file.endsWith(".local.md");
}

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function budgetError(reason) {
  const error = new Error(reason);
  error.code = "TRIGGERIFY_BUDGET";
  error.reason = reason;
  return error;
}

module.exports = {
  canonicalWorkspace,
  compareUtf8,
  dataRoot,
  discover,
  ensureLocalIgnore,
  inspectScript,
  isWithin,
  readEntry,
  resolveEntry,
  scopeRoot,
  setEntryEnabled,
  setInnerHookEnabled,
  writeAtomic,
};
