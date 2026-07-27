"use strict";

const fs = require("node:fs");
const path = require("node:path");

const {
  MAX_DESCRIPTION,
  MAX_TIMEOUT,
  parseMarkdown,
  serialize,
} = require("./rule.js");
const {
  discover,
  ensureLocalIgnore,
  inspectScript,
  readEntry,
  resolveEntry,
  scopeRoot,
  setEntryEnabled,
  writeAtomic,
} = require("./store.js");
const { ruleStatus } = require("./runtime.js");

function parseOptions(args) {
  const options = { positional: [] };
  const boolean = new Set(["json", "shared", "clear-description", "clear-when", "clear-timeout", "clear-script", "help"]);
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
  if (!["all", "global", "project", "inner"].includes(scope)) throw new Error("--scope must be all, global, project, or inner");
  const workspace = options.workspace || process.cwd();
  const scopes = scope === "all" ? ["global", "inner", "project"] : [scope];
  const items = scopes.flatMap((name) => discover(name, workspace, name !== "project")).map((entry) => ruleStatus(entry, options.host || "codex"));
  if (options.json) io.log(JSON.stringify(items, null, 2));
  else if (items.length === 0) io.log("No triggers configured.");
  else {
    io.log("ID\tDESCRIPTION\tCONFIGURED\tVALIDATION\tTRUST\tSUPPORT\tEFFECTIVE\tEVENT\tACTION");
    items.forEach((item) => io.log(`${item.id}\t${item.description || "-"}\t${item.configured}\t${item.validation}\t${item.trust}\t${item.support}\t${item.effective}\t${item.event || "-"}\t${item.action || "-"}`));
  }
  return 0;
}

function showCommand(options, io) {
  const entry = resolveEntry(requiredId(options), options.workspace);
  const item = { ...ruleStatus(entry, options.host || "codex"), definition: entry.rule || null, errors: entry.errors };
  if (options.json) io.log(JSON.stringify(item, null, 2));
  else io.log(`${formatStatus(item)}\n\n${entry.rule ? serialize(entry.rule) : entry.errors.map((error) => error.message).join("\n")}`);
  return entry.valid ? 0 : 1;
}

function createCommand(options, io) {
  const name = options.positional[0];
  if (!name || !/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new Error("create requires a kebab-case name");
  const scope = options.scope || "project";
  if (!["global", "project"].includes(scope)) throw new Error("--scope must be global or project (inner is read-only)");
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
  if (options.positional[0]?.startsWith("inner:")) throw new Error("inner scope is read-only; update the skill source instead");
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
  for (const field of ["event", "action", "description", "script"]) if (options[field] !== undefined) rule[field] = options[field];
  if (options.timeout !== undefined) rule.timeout = Number(options.timeout);
  if (options["when-json"] !== undefined) rule.when = JSON.parse(options["when-json"]);
  if (options.body !== undefined || options["body-file"] !== undefined) rule.body = readBody(options);
  if (options["clear-description"]) delete rule.description;
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
  if (id.startsWith("inner:")) throw new Error("inner scope is read-only; toggle the source file in the triggerify skill");
  const scope = id.startsWith("global:") ? "global" : "project";
  const workspace = options.workspace || process.cwd();
  const matches = discover(scope, workspace, false).filter((entry) => entry.id === id);
  if (matches.length === 0) throw new Error(`Trigger not found: ${id}`);
  if (matches.length > 1 && command === "enable") throw new Error(`Trigger ID conflict: ${id}`);
  for (const match of matches) setEntryEnabled(readEntry(match, workspace), command === "enable");
  io.log(`${command === "enable" ? "Enabled" : "Disabled"} ${id}${matches.length > 1 ? ` (${matches.length} conflicting files)` : ""}`);
  return 0;
}

function deleteCommand(options, io) {
  if (options.positional[0]?.startsWith("inner:")) throw new Error("inner scope is read-only; inner hooks ship with the triggerify skill");
  const entry = resolveEntry(requiredId(options), options.workspace);
  fs.unlinkSync(entry.path);
  io.log(`Deleted ${entry.id}; referenced scripts were preserved.`);
  return 0;
}

function requiredId(options) {
  const id = options.positional[0];
  if (!/^(global|inner|project):[a-z0-9][a-z0-9-]*$/.test(id || "")) {
    throw new Error("a qualified ID such as global:name, inner:name, or project:name is required");
  }
  return id;
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
  if (options.description !== undefined) rule.description = options.description;
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
    `Description: ${item.description || "-"}`,
    `Configured: ${item.configured}`,
    `Validation: ${item.validation}`,
    `Trust: ${item.trust}`,
    `Support: ${item.support}`,
    `Effective: ${item.effective}`,
    `Reasons: ${item.reasons.join(", ") || "none"}`,
  ].join("\n");
}

function printTriggerifyHelp(io) {
  io.log(`Usage:\n  csl-agent-kit triggerify list [--scope all|global|project] [--json]\n  csl-agent-kit triggerify show <qualified-id> [--json]\n  csl-agent-kit triggerify create <name> --event <event> --action <action> [options]\n  csl-agent-kit triggerify update <qualified-id> [options]\n  csl-agent-kit triggerify update <qualified-id> --from <file>\n  csl-agent-kit triggerify enable|disable|delete <qualified-id>\n\nCommon options:\n  --workspace <path>    Project workspace (default: cwd)\n  --host <name>         Capability view (default: codex)\n  --scope <scope>       all, global, or project\n  --shared              Create a shared project rule\n  --description <text> One-line description, up to ${MAX_DESCRIPTION} characters\n  --clear-description  Remove an existing description during update\n  --body <text>         Prompt body\n  --body-file <path>    Read prompt body from a file\n  --script <path>       Script relative to the scope scripts root\n  --timeout <seconds>   Script timeout, 1-${MAX_TIMEOUT}\n  --when-json <json>    V1 condition AST as JSON\n  --from <file>         Replace an invalid rule with a validated definition\n`);
  return 0;
}

module.exports = { runCli };
