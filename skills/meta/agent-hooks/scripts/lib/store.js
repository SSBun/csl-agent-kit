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
const INNER_CONFIG_SCHEMA = "agent-hooks.config/v1";
const LEGACY_PROTOCOL_REPLACEMENTS = [
  ["triggerify.config/v1", "agent-hooks.config/v1"],
  ["triggerify.event/v1", "agent-hooks.event/v1"],
  ["triggerify/v1", "agent-hooks/v1"],
  ["<!-- triggerify:disabled -->", "<!-- agent-hooks:disabled -->"],
  ["TRIGGERIFY_", "AGENT_HOOKS_"],
  ["csl-agent-kit triggerify", "csl-agent-kit agent-hooks"],
  ["$triggerify", "$agent-hooks"],
  ["Triggerify ", "Agent Hooks "],
  ["triggerify-", "agent-hooks-"],
  ["\"triggerify\"", "\"hooks\""],
  ["'triggerify'", "'hooks'"],
];

function innerRoot() {
  return path.join(__dirname, "..", "..");
}

function dataRoot() {
  return process.env.CSL_AGENT_KIT_HOME || path.join(os.homedir(), ".csl-agent-kit");
}

function globalRoot() {
  return path.join(dataRoot(), "hooks");
}

function projectRoot(workspace = process.cwd()) {
  return path.join(canonicalWorkspace(workspace), ".agents", "hooks");
}

function innerConfigPath() {
  migrateLegacyScope("global");
  return path.join(globalRoot(), "config.json");
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
  migrateLegacyScope(scope, workspace);
  return scope === "global" ? globalRoot() : projectRoot(workspace);
}

function ruleRoot(scope, workspace = process.cwd()) {
  return scope === "inner" ? path.join(innerRoot(), "hooks") : scopeRoot(scope, workspace);
}

function scriptsRoot(scope, workspace = process.cwd()) {
  return path.join(scopeRoot(scope, workspace), "scripts");
}

function migrateLegacyScope(scope, workspace = process.cwd()) {
  if (!["global", "project"].includes(scope)) return false;
  const legacy = scope === "global"
    ? path.join(dataRoot(), "triggerify")
    : path.join(canonicalWorkspace(workspace), ".csl-agent-kit", "triggerify");
  if (!fs.existsSync(legacy)) return false;
  const legacyStat = fs.lstatSync(legacy);
  if (legacyStat.isSymbolicLink() || !legacyStat.isDirectory()) {
    throw new Error(`cannot migrate Agent Hooks: ${legacy} must be a directory, not a symlink`);
  }

  const target = scope === "global" ? globalRoot() : projectRoot(workspace);
  if (fs.existsSync(target)) {
    const targetStat = fs.lstatSync(target);
    if (targetStat.isSymbolicLink() || !targetStat.isDirectory()) {
      throw new Error(`cannot migrate Agent Hooks: ${target} must be a directory, not a symlink`);
    }
    if (fs.readdirSync(target).length > 0) {
      throw new Error(`cannot migrate Agent Hooks: both ${legacy} and ${target} contain data`);
    }
  }

  const staging = path.join(path.dirname(target), `.hooks.migrate-${process.pid}-${Date.now()}`);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.cpSync(legacy, staging, { recursive: true, preserveTimestamps: true, errorOnExist: true });
  try {
    flattenLegacyHooks(staging);
    migrateProtocolFiles(staging);
    if (fs.existsSync(target)) fs.rmdirSync(target);
    fs.renameSync(staging, target);
    fs.rmSync(legacy, { recursive: true, force: true });
    if (scope === "project") {
      ensureLocalIgnore(workspace);
      const legacyParent = path.dirname(legacy);
      if (fs.existsSync(legacyParent) && fs.readdirSync(legacyParent).length === 0) fs.rmdirSync(legacyParent);
    }
    return true;
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

function flattenLegacyHooks(root) {
  const nested = path.join(root, "hooks");
  if (!fs.existsSync(nested)) return;
  const stat = fs.lstatSync(nested);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error(`cannot migrate Agent Hooks: ${nested} must be a directory`);
  for (const name of fs.readdirSync(nested)) {
    const target = path.join(root, name);
    if (fs.existsSync(target)) throw new Error(`cannot migrate Agent Hooks: duplicate ${target}`);
    fs.renameSync(path.join(nested, name), target);
  }
  fs.rmdirSync(nested);
}

function migrateProtocolFiles(root) {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const file = path.join(root, entry.name);
    if (entry.isDirectory()) migrateProtocolFiles(file);
    else if (entry.isFile() && /\.(?:c?js|mjs|json|md|sh|ts)$/.test(entry.name)) {
      const content = fs.readFileSync(file, "utf8");
      const migrated = LEGACY_PROTOCOL_REPLACEMENTS.reduce(
        (value, [before, after]) => value.split(before).join(after),
        content,
      );
      if (migrated !== content) fs.writeFileSync(file, migrated);
    }
  }
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left), Buffer.from(right));
}

function discover(scope, workspace = process.cwd(), read = true, deadline = Infinity) {
  const hooks = ruleRoot(scope, workspace);
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
  const scripts = scriptsRoot(entry.scope, workspace);
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
    ".agents/hooks/*.local.md",
    ".agents/hooks/scripts/*.local.*",
  ];
  const legacy = new Set([
    ".csl-agent-kit/triggerify/hooks/*.local.md",
    ".csl-agent-kit/triggerify/scripts/*.local.*",
  ]);
  const lines = content.split(/\r?\n/).filter((line) => !legacy.has(line));
  let updated = lines.join("\n");
  const missing = entries.filter((entry) => !lines.includes(entry));
  if (missing.length > 0) {
    const prefix = updated && !updated.endsWith("\n") ? "\n" : "";
    updated = `${updated}${prefix}${missing.join("\n")}\n`;
  }
  if (updated !== content) writeAtomic(file, updated, mode);
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
  error.code = "AGENT_HOOKS_BUDGET";
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
  migrateLegacyScope,
  readEntry,
  resolveEntry,
  ruleRoot,
  scopeRoot,
  scriptsRoot,
  setEntryEnabled,
  setInnerHookEnabled,
  writeAtomic,
};
